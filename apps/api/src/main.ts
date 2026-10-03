import "reflect-metadata";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import { verifySession } from "./auth/auth.service.js";
import { runWithCurrentUser } from "./common/current-user.js";
import { captureError, observeRequest } from "./common/observability.js";

const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000);
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX ?? 300);
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await app.register(cookie);
  await app.register(helmet);
  app.enableCors({ origin: true, credentials: true });
  app.getHttpAdapter().getInstance().addHook("onRequest", (request, _reply, done) => {
    request.headers["x-jobos-started-at"] = String(Date.now());
    done();
  });
  app.getHttpAdapter().getInstance().addHook("onRequest", (request, reply, done) => {
    const sessionCookie = request.cookies?.jobos_session;
    const currentUserId = verifySession(sessionCookie);
    runWithCurrentUser(currentUserId, () => {
    if (request.url.startsWith("/health")) return done();
    const forwarded = request.headers["x-forwarded-for"];
    const key = Array.isArray(forwarded) ? forwarded[0] : forwarded ?? request.ip;
    const now = Date.now();
    const bucket = rateLimitBuckets.get(key) ?? { count: 0, resetAt: now + rateLimitWindowMs };
    if (bucket.resetAt <= now) {
      bucket.count = 0;
      bucket.resetAt = now + rateLimitWindowMs;
    }
    bucket.count += 1;
    rateLimitBuckets.set(key, bucket);
    reply.header("X-RateLimit-Limit", rateLimitMax);
    reply.header("X-RateLimit-Remaining", Math.max(rateLimitMax - bucket.count, 0));
    reply.header("X-RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));
    if (bucket.count > rateLimitMax) {
      reply.code(429).send({ message: "Too many requests" });
      return;
    }
    done();
    });
  });
  app.getHttpAdapter().getInstance().addHook("onResponse", (request, reply, done) => {
    const startedAt = Number(request.headers["x-jobos-started-at"] ?? Date.now());
    observeRequest(request.url.split("?")[0] ?? request.url, request.method, reply.statusCode, Date.now() - startedAt);
    done();
  });
  app.getHttpAdapter().getInstance().addHook("onError", (request, _reply, error, done) => {
    captureError(error, { url: request.url, method: request.method, headers: request.headers });
    done();
  });

  const openApiConfig = new DocumentBuilder()
    .setTitle("JobOS API")
    .setDescription("Job search operating system API")
    .setVersion("0.1.0")
    .build();
  try {
    SwaggerModule.setup("openapi", app, SwaggerModule.createDocument(app, openApiConfig));
  } catch (error) {
    console.warn("OpenAPI setup skipped:", error instanceof Error ? error.message : error);
  }

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
