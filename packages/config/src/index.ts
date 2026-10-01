import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.string().default("info"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  API_PORT: z.coerce.number().int().positive().default(4000),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string(),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  AUTH_SECRET: z.string().min(32),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_PROVIDER: z.enum(["local", "openai", "anthropic"]).default("local"),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  ANTHROPIC_MODEL: z.string().default("claude-3-5-sonnet-latest"),
  LOCAL_AI_MODEL: z.string().default("jobos-local-deterministic"),
  SENTRY_DSN: z.string().optional()
});

export type JobOsEnv = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): JobOsEnv {
  return envSchema.parse(source);
}
