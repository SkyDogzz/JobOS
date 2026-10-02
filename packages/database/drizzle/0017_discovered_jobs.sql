CREATE TABLE IF NOT EXISTS "discovered_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "source_id" uuid,
  "title" text NOT NULL,
  "company_name" text,
  "description" text NOT NULL,
  "location" text,
  "source_url" text,
  "source_name" text,
  "remote_policy" text,
  "salary_text" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "reliability_score" integer DEFAULT 50 NOT NULL,
  "duplicate_score" integer DEFAULT 0 NOT NULL,
  "relevance_score" integer DEFAULT 50 NOT NULL,
  "snoozed_until" timestamp with time zone,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discovered_jobs" ADD CONSTRAINT "discovered_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "discovered_jobs" ADD CONSTRAINT "discovered_jobs_source_id_job_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."job_sources"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "discovered_jobs_user_status_idx" ON "discovered_jobs" ("user_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "discovered_jobs_source_url_idx" ON "discovered_jobs" ("source_url");
