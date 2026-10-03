CREATE TABLE IF NOT EXISTS "search_strategy_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "week_starts_at" timestamp with time zone NOT NULL,
  "goals" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "progress" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "generated_task_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "search_strategy_plans" ADD CONSTRAINT "search_strategy_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "search_strategy_plans_user_week_idx" ON "search_strategy_plans" ("user_id","week_starts_at");
