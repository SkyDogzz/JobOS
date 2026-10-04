CREATE TABLE "support_diagnostic_bundles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "requested_by_user_id" uuid REFERENCES "users"("id") ON DELETE set null,
  "target_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "reason" text NOT NULL,
  "redacted_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "support_diagnostic_bundles_target_idx" ON "support_diagnostic_bundles" ("target_user_id");
