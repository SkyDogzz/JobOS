CREATE TABLE IF NOT EXISTS "billing_usage_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "subscription_id" uuid REFERENCES "user_subscriptions"("id") ON DELETE cascade,
  "metric" text NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "usage_before" integer DEFAULT 0 NOT NULL,
  "usage_after" integer DEFAULT 0 NOT NULL,
  "limit_value" integer,
  "action" text DEFAULT 'consume' NOT NULL,
  "override_reason" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "billing_usage_events_user_metric_idx" ON "billing_usage_events" ("user_id", "metric");

UPDATE "billing_plans"
SET "limits" = jsonb_set(jsonb_set(jsonb_set(jsonb_set("limits", '{providerCalls}', '10'::jsonb, true), '{discoveredJobImports}', '20'::jsonb, true), '{aiGenerations}', '10'::jsonb, true), '{syncRuns}', '5'::jsonb, true),
    "updated_at" = now()
WHERE "code" = 'free';

UPDATE "billing_plans"
SET "limits" = jsonb_set(jsonb_set("limits", '{providerCalls}', '500'::jsonb, true), '{discoveredJobImports}', '500'::jsonb, true),
    "updated_at" = now()
WHERE "code" = 'pro';

UPDATE "billing_plans"
SET "limits" = jsonb_set(jsonb_set("limits", '{providerCalls}', '2000'::jsonb, true), '{discoveredJobImports}', '2000'::jsonb, true),
    "updated_at" = now()
WHERE "code" = 'team';
