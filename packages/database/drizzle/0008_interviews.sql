ALTER TABLE "interviews" ADD COLUMN IF NOT EXISTS "participants" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN IF NOT EXISTS "preparation_notes" text;
--> statement-breakpoint
ALTER TABLE "interviews" ADD COLUMN IF NOT EXISTS "outcome" text;
