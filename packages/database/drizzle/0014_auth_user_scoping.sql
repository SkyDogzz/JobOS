INSERT INTO "users" ("email", "name")
VALUES ('dev@jobos.local', 'JobOS Dev User')
ON CONFLICT ("email") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "user_id" uuid;
--> statement-breakpoint
UPDATE "jobs"
SET "user_id" = (SELECT "id" FROM "users" WHERE "email" = 'dev@jobos.local' LIMIT 1)
WHERE "user_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "jobs" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "jobs_user_idx" ON "jobs" ("user_id");
