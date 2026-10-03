CREATE TABLE IF NOT EXISTS "billing_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "monthly_price_cents" integer DEFAULT 0 NOT NULL,
  "currency" text DEFAULT 'USD' NOT NULL,
  "limits" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "entitlements" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "provider_product_id" text,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "billing_plans_code_idx" ON "billing_plans" ("code");

CREATE TABLE IF NOT EXISTS "user_subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "plan_id" uuid NOT NULL REFERENCES "billing_plans"("id") ON DELETE restrict,
  "status" text DEFAULT 'active' NOT NULL,
  "provider" text DEFAULT 'local_fake' NOT NULL,
  "provider_customer_id" text,
  "provider_subscription_id" text,
  "current_period_end" timestamp with time zone,
  "cancel_at_period_end" boolean DEFAULT false NOT NULL,
  "usage" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_subscriptions_user_idx" ON "user_subscriptions" ("user_id");

INSERT INTO "billing_plans" ("code", "name", "monthly_price_cents", "currency", "limits", "entitlements")
VALUES
  ('free', 'Free', 0, 'USD', '{"aiGenerations": 10, "syncRuns": 5, "documentExports": 10, "teamSeats": 1}'::jsonb, '{"localAi": true, "premiumAi": false, "providerSync": false}'::jsonb),
  ('pro', 'Pro', 1900, 'USD', '{"aiGenerations": 500, "syncRuns": 250, "documentExports": 200, "teamSeats": 1}'::jsonb, '{"localAi": true, "premiumAi": true, "providerSync": true}'::jsonb),
  ('team', 'Team', 4900, 'USD', '{"aiGenerations": 2000, "syncRuns": 1000, "documentExports": 1000, "teamSeats": 5}'::jsonb, '{"localAi": true, "premiumAi": true, "providerSync": true, "teamWorkspace": true}'::jsonb)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "monthly_price_cents" = EXCLUDED."monthly_price_cents",
  "limits" = EXCLUDED."limits",
  "entitlements" = EXCLUDED."entitlements",
  "updated_at" = now();
