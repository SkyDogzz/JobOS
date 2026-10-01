CREATE TABLE IF NOT EXISTS "ats_analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"resume_version_id" uuid NOT NULL,
	"inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"scores" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"findings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"provider" text DEFAULT 'local' NOT NULL,
	"model" text DEFAULT 'deterministic-v1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_resume_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"resume_version_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"recommendations" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"inputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"provider" text DEFAULT 'local' NOT NULL,
	"model" text DEFAULT 'deterministic-v1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ats_analyses" ADD CONSTRAINT "ats_analyses_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ats_analyses" ADD CONSTRAINT "ats_analyses_resume_version_id_resume_versions_id_fk" FOREIGN KEY ("resume_version_id") REFERENCES "public"."resume_versions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "job_resume_matches" ADD CONSTRAINT "job_resume_matches_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "job_resume_matches" ADD CONSTRAINT "job_resume_matches_resume_version_id_resume_versions_id_fk" FOREIGN KEY ("resume_version_id") REFERENCES "public"."resume_versions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ats_analyses_pair_idx" ON "ats_analyses" USING btree ("job_id","resume_version_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_resume_matches_pair_idx" ON "job_resume_matches" USING btree ("job_id","resume_version_id");
