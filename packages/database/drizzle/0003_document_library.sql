ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "content" jsonb DEFAULT '{}'::jsonb NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_kind_idx" ON "documents" USING btree ("kind");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_artifacts_purpose_idx" ON "ai_artifacts" USING btree ("purpose");
