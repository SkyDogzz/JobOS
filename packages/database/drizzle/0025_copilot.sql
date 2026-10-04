CREATE TABLE "copilot_conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "title" text DEFAULT 'Job search copilot' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "copilot_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL REFERENCES "copilot_conversations"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "grounding" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "copilot_actions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL REFERENCES "copilot_conversations"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "kind" text NOT NULL,
  "title" text NOT NULL,
  "rationale" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "proposed_mutation" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "grounding" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "approval_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "rollback_plan" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX "copilot_conversations_user_idx" ON "copilot_conversations" ("user_id");
CREATE INDEX "copilot_messages_conversation_idx" ON "copilot_messages" ("conversation_id");
CREATE INDEX "copilot_actions_user_status_idx" ON "copilot_actions" ("user_id", "status");
