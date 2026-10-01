ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "redact_sensitive_exports" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "store_email_bodies" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "ai_artifact_retention" text DEFAULT 'keep' NOT NULL;
