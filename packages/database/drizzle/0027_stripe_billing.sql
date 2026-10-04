CREATE TABLE IF NOT EXISTS "billing_webhook_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider" text DEFAULT 'stripe' NOT NULL,
  "provider_event_id" text NOT NULL,
  "event_type" text NOT NULL,
  "processed_at" timestamp with time zone DEFAULT now() NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "billing_webhook_events_provider_event_idx"
  ON "billing_webhook_events" ("provider", "provider_event_id");

UPDATE "billing_plans"
SET "provider_product_id" = CASE "code"
  WHEN 'premium' THEN COALESCE(NULLIF("provider_product_id", ''), 'prod_jobos_premium')
  WHEN 'team' THEN COALESCE(NULLIF("provider_product_id", ''), 'prod_jobos_team')
  ELSE "provider_product_id"
END
WHERE "code" IN ('premium', 'team');
