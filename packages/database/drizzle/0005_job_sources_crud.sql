CREATE TABLE IF NOT EXISTS "job_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"base_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"last_checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "source_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jobs" ADD CONSTRAINT "jobs_source_id_job_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."job_sources"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "job_sources_name_idx" ON "job_sources" USING btree ("name");
