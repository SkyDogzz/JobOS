CREATE TYPE "workspace_kind" AS ENUM ('personal', 'team');
CREATE TYPE "membership_role" AS ENUM ('owner', 'admin', 'editor', 'viewer');

CREATE TABLE "organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "kind" "workspace_kind" DEFAULT 'team' NOT NULL,
  "owner_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "organization_memberships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "role" "membership_role" DEFAULT 'viewer' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "invited_email" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "organizations_slug_idx" ON "organizations" ("slug");
CREATE INDEX "organizations_owner_idx" ON "organizations" ("owner_user_id");
CREATE UNIQUE INDEX "organization_memberships_org_user_idx" ON "organization_memberships" ("organization_id", "user_id");
CREATE INDEX "organization_memberships_user_idx" ON "organization_memberships" ("user_id");

ALTER TABLE "jobs" ADD COLUMN "workspace_id" uuid REFERENCES "organizations"("id") ON DELETE set null;
CREATE INDEX "jobs_workspace_idx" ON "jobs" ("workspace_id");

INSERT INTO "organizations" ("name", "slug", "kind", "owner_user_id", "settings")
SELECT COALESCE("name", split_part("email", '@', 1)) || ' Personal', 'personal-' || replace("id"::text, '-', ''), 'personal', "id", '{}'::jsonb
FROM "users"
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "organization_memberships" ("organization_id", "user_id", "role", "status")
SELECT "organizations"."id", "organizations"."owner_user_id", 'owner', 'active'
FROM "organizations"
WHERE "organizations"."kind" = 'personal'
ON CONFLICT ("organization_id", "user_id") DO NOTHING;

UPDATE "jobs"
SET "workspace_id" = "organizations"."id"
FROM "organizations"
WHERE "organizations"."owner_user_id" = "jobs"."user_id"
  AND "organizations"."kind" = 'personal'
  AND "jobs"."workspace_id" IS NULL;
