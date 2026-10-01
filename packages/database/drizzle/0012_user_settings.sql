CREATE TABLE IF NOT EXISTS "user_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "timezone" text DEFAULT 'UTC' NOT NULL,
  "preferred_locations" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "remote_preference" text DEFAULT 'any' NOT NULL,
  "minimum_salary" text,
  "preferred_sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "default_ai_provider" text DEFAULT 'local' NOT NULL,
  "default_ai_model" text DEFAULT 'deterministic-v1' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_settings_user_idx" ON "user_settings" USING btree ("user_id");
