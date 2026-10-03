CREATE TABLE IF NOT EXISTS "offers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "base_compensation" integer NOT NULL,
  "currency" text DEFAULT 'USD' NOT NULL,
  "equity" text,
  "benefits" text,
  "deadline_at" timestamp with time zone,
  "negotiation_notes" text,
  "status" text DEFAULT 'active' NOT NULL,
  "decision_score" integer DEFAULT 0 NOT NULL,
  "comparison" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "offers" ADD CONSTRAINT "offers_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "offers" ADD CONSTRAINT "offers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "offers_user_status_idx" ON "offers" ("user_id","status");
CREATE INDEX IF NOT EXISTS "offers_application_idx" ON "offers" ("application_id");
