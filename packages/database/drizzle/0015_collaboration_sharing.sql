ALTER TYPE "public"."event_kind" ADD VALUE IF NOT EXISTS 'share_created';
--> statement-breakpoint
ALTER TYPE "public"."event_kind" ADD VALUE IF NOT EXISTS 'share_viewed';
--> statement-breakpoint
ALTER TYPE "public"."event_kind" ADD VALUE IF NOT EXISTS 'share_commented';
--> statement-breakpoint
ALTER TYPE "public"."event_kind" ADD VALUE IF NOT EXISTS 'share_revoked';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "application_share_packets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "token" text NOT NULL,
  "audience" text DEFAULT 'trusted_reviewer' NOT NULL,
  "recipient_name" text,
  "recipient_email" text,
  "expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  "last_viewed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reviewer_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "share_packet_id" uuid,
  "application_id" uuid NOT NULL,
  "resume_version_id" uuid,
  "document_id" uuid,
  "author_name" text NOT NULL,
  "target_type" text DEFAULT 'application' NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "application_share_packets" ADD CONSTRAINT "application_share_packets_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "application_share_packets" ADD CONSTRAINT "application_share_packets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviewer_comments" ADD CONSTRAINT "reviewer_comments_share_packet_id_application_share_packets_id_fk" FOREIGN KEY ("share_packet_id") REFERENCES "public"."application_share_packets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviewer_comments" ADD CONSTRAINT "reviewer_comments_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviewer_comments" ADD CONSTRAINT "reviewer_comments_resume_version_id_resume_versions_id_fk" FOREIGN KEY ("resume_version_id") REFERENCES "public"."resume_versions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reviewer_comments" ADD CONSTRAINT "reviewer_comments_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "application_share_packets_token_idx" ON "application_share_packets" ("token");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "application_share_packets_application_idx" ON "application_share_packets" ("application_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviewer_comments_application_idx" ON "reviewer_comments" ("application_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviewer_comments_share_packet_idx" ON "reviewer_comments" ("share_packet_id");
