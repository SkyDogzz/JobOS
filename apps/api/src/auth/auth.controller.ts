import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service.js";

const cookieName = "jobos_session";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  async register(@Body() body: unknown, @Res({ passthrough: true }) reply: FastifyReply) {
    const result = await this.auth.register(body);
    reply.setCookie(cookieName, result.session, cookieOptions());
    return { user: result.user };
  }

  @Post("login")
  async login(@Body() body: unknown, @Res({ passthrough: true }) reply: FastifyReply) {
    const result = await this.auth.login(body);
    reply.setCookie(cookieName, result.session, cookieOptions());
    return { user: result.user };
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) reply: FastifyReply) {
    reply.clearCookie(cookieName, { path: "/" });
    return { ok: true };
  }

  @Get("session")
  session(@Req() request: FastifyRequest) {
    return this.auth.session(request.cookies?.[cookieName]);
  }
}

function cookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
}

