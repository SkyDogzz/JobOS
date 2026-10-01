import "reflect-metadata";
import helmet from "@fastify/helmet";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await app.register(helmet);
  app.enableCors({ origin: true, credentials: true });

  const openApiConfig = new DocumentBuilder()
    .setTitle("JobOS API")
    .setDescription("Job search operating system API")
    .setVersion("0.1.0")
    .build();
  SwaggerModule.setup("openapi", app, SwaggerModule.createDocument(app, openApiConfig));

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();

