import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { loginSchema, registerSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { AuthRepository } from "./auth.repository.js";

const sessionSecret = process.env.AUTH_SECRET ?? "development-auth-secret-change-me-please";

@Injectable()
export class AuthService {
  constructor(private readonly auth: AuthRepository) {}

  async register(body: unknown) {
    const input = parseBody(registerSchema, body);
    const existing = await this.auth.findByEmail(input.email);
    if (existing) throw new ConflictException("Email already registered.");
    const user = await this.auth.create(input, hashPassword(input.password));
    return { user, session: signSession(user.id) };
  }

  async login(body: unknown) {
    const input = parseBody(loginSchema, body);
    const user = await this.auth.findByEmail(input.email);
    if (!user?.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedException("Invalid email or password.");
    }
    return {
      user: { id: user.id, email: user.email, name: user.name },
      session: signSession(user.id)
    };
  }

  async session(token: string | undefined) {
    const userId = verifySession(token);
    if (!userId) return null;
    const user = await this.auth.findById(userId);
    return user ? { id: user.id, email: user.email, name: user.name } : null;
  }
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

function signSession(userId: string) {
  const payload = Buffer.from(JSON.stringify({ userId })).toString("base64url");
  const signature = createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySession(token: string | undefined) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { userId?: string };
  return parsed.userId ?? null;
}
