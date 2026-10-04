import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const applicationStage = pgEnum("application_stage", [
  "wishlist",
  "saved",
  "applied",
  "screening",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
  "accepted"
]);

export const documentKind = pgEnum("document_kind", ["resume", "cover_letter", "portfolio", "other"]);
export const taskStatus = pgEnum("task_status", ["todo", "doing", "done", "cancelled"]);
export const eventKind = pgEnum("event_kind", ["created", "updated", "stage_changed", "email", "note", "ai_generated", "share_created", "share_viewed", "share_commented", "share_revoked"]);
export const workspaceKind = pgEnum("workspace_kind", ["personal", "team"]);
export const membershipRole = pgEnum("membership_role", ["owner", "admin", "editor", "viewer"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
};

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  passwordHash: text("password_hash"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  ...timestamps
}, (table) => ({
  emailIdx: uniqueIndex("users_email_idx").on(table.email)
}));

export const candidateProfiles = pgTable("candidate_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  headline: text("headline"),
  summary: text("summary"),
  location: text("location"),
  canonicalData: jsonb("canonical_data").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps
});

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  kind: workspaceKind("kind").default("team").notNull(),
  ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps
}, (table) => ({
  slugIdx: uniqueIndex("organizations_slug_idx").on(table.slug),
  ownerIdx: index("organizations_owner_idx").on(table.ownerUserId)
}));

export const organizationMemberships = pgTable("organization_memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: membershipRole("role").default("viewer").notNull(),
  status: text("status").notNull().default("active"),
  invitedEmail: text("invited_email"),
  ...timestamps
}, (table) => ({
  memberIdx: uniqueIndex("organization_memberships_org_user_idx").on(table.organizationId, table.userId),
  userIdx: index("organization_memberships_user_idx").on(table.userId)
}));

export const billingPlans = pgTable("billing_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  monthlyPriceCents: integer("monthly_price_cents").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  limits: jsonb("limits").$type<Record<string, number | boolean>>().notNull().default({}),
  entitlements: jsonb("entitlements").$type<Record<string, boolean>>().notNull().default({}),
  providerProductId: text("provider_product_id"),
  active: boolean("active").notNull().default(true),
  ...timestamps
}, (table) => ({
  codeIdx: uniqueIndex("billing_plans_code_idx").on(table.code)
}));

export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  planId: uuid("plan_id").references(() => billingPlans.id, { onDelete: "restrict" }).notNull(),
  status: text("status").notNull().default("active"),
  provider: text("provider").notNull().default("local_fake"),
  providerCustomerId: text("provider_customer_id"),
  providerSubscriptionId: text("provider_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  usage: jsonb("usage").$type<Record<string, number>>().notNull().default({}),
  ...timestamps
}, (table) => ({
  userIdx: uniqueIndex("user_subscriptions_user_idx").on(table.userId)
}));

export const billingUsageEvents = pgTable("billing_usage_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  subscriptionId: uuid("subscription_id").references(() => userSubscriptions.id, { onDelete: "cascade" }),
  metric: text("metric").notNull(),
  quantity: integer("quantity").notNull().default(1),
  usageBefore: integer("usage_before").notNull().default(0),
  usageAfter: integer("usage_after").notNull().default(0),
  limitValue: integer("limit_value"),
  action: text("action").notNull().default("consume"),
  overrideReason: text("override_reason"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  userMetricIdx: index("billing_usage_events_user_metric_idx").on(table.userId, table.metric)
}));

export const billingWebhookEvents = pgTable("billing_webhook_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: text("provider").notNull().default("stripe"),
  providerEventId: text("provider_event_id").notNull(),
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow().notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps
}, (table) => ({
  providerEventIdx: uniqueIndex("billing_webhook_events_provider_event_idx").on(table.provider, table.providerEventId)
}));

export const supportDiagnosticBundles = pgTable("support_diagnostic_bundles", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestedByUserId: uuid("requested_by_user_id").references(() => users.id, { onDelete: "set null" }),
  targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  reason: text("reason").notNull(),
  redactedPayload: jsonb("redacted_payload").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  targetIdx: index("support_diagnostic_bundles_target_idx").on(table.targetUserId)
}));

export const copilotConversations = pgTable("copilot_conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull().default("Job search copilot"),
  ...timestamps
}, (table) => ({
  userIdx: index("copilot_conversations_user_idx").on(table.userId)
}));

export const copilotMessages = pgTable("copilot_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").references(() => copilotConversations.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  grounding: jsonb("grounding").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  conversationIdx: index("copilot_messages_conversation_idx").on(table.conversationId)
}));

export const copilotActions = pgTable("copilot_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").references(() => copilotConversations.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  rationale: text("rationale").notNull(),
  status: text("status").notNull().default("pending"),
  proposedMutation: jsonb("proposed_mutation").$type<Record<string, unknown>>().notNull().default({}),
  grounding: jsonb("grounding").$type<Record<string, unknown>>().notNull().default({}),
  approvalHistory: jsonb("approval_history").$type<Record<string, unknown>[]>().notNull().default([]),
  rollbackPlan: jsonb("rollback_plan").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps
}, (table) => ({
  userStatusIdx: index("copilot_actions_user_status_idx").on(table.userId, table.status)
}));

export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  website: text("website"),
  description: text("description"),
  ...timestamps
}, (table) => ({
  nameIdx: index("companies_name_idx").on(table.name)
}));

export const jobSources = pgTable("job_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  baseUrl: text("base_url"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  ...timestamps
}, (table) => ({
  nameIdx: uniqueIndex("job_sources_name_idx").on(table.name)
}));

export const savedJobFilters = pgTable("saved_job_filters", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  filters: jsonb("filters").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps
});

export const discoveredJobs = pgTable("discovered_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  sourceId: uuid("source_id").references(() => jobSources.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  companyName: text("company_name"),
  description: text("description").notNull(),
  location: text("location"),
  sourceUrl: text("source_url"),
  sourceName: text("source_name"),
  remotePolicy: text("remote_policy"),
  salaryText: text("salary_text"),
  status: text("status").notNull().default("pending"),
  reliabilityScore: integer("reliability_score").notNull().default(50),
  duplicateScore: integer("duplicate_score").notNull().default(0),
  relevanceScore: integer("relevance_score").notNull().default(50),
  snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps
}, (table) => ({
  userStatusIdx: index("discovered_jobs_user_status_idx").on(table.userId, table.status),
  sourceUrlIdx: index("discovered_jobs_source_url_idx").on(table.sourceUrl)
}));

export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  title: text("title"),
  email: text("email"),
  linkedinUrl: text("linkedin_url"),
  notes: text("notes"),
  followUpAt: timestamp("follow_up_at", { withTimezone: true }),
  ...timestamps
});

export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  workspaceId: uuid("workspace_id").references(() => organizations.id, { onDelete: "set null" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  sourceId: uuid("source_id").references(() => jobSources.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  sourceUrl: text("source_url"),
  sourceName: text("source_name"),
  remotePolicy: text("remote_policy"),
  salaryText: text("salary_text"),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  ...timestamps
}, (table) => ({
  userIdx: index("jobs_user_idx").on(table.userId),
  workspaceIdx: index("jobs_workspace_idx").on(table.workspaceId),
  titleIdx: index("jobs_title_idx").on(table.title)
}));

export const resumes = pgTable("resumes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  ...timestamps
});

export const resumeVersions = pgTable("resume_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  resumeId: uuid("resume_id").references(() => resumes.id, { onDelete: "cascade" }).notNull(),
  versionNumber: integer("version_number").notNull(),
  title: text("title").notNull(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull(),
  storageKey: text("storage_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  resumeVersionIdx: uniqueIndex("resume_versions_resume_version_idx").on(table.resumeId, table.versionNumber)
}));

export const atsAnalyses = pgTable("ats_analyses", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").references(() => jobs.id, { onDelete: "cascade" }).notNull(),
  resumeVersionId: uuid("resume_version_id").references(() => resumeVersions.id, { onDelete: "cascade" }).notNull(),
  inputs: jsonb("inputs").$type<Record<string, unknown>>().notNull(),
  scores: jsonb("scores").$type<Record<string, unknown>>().notNull(),
  findings: jsonb("findings").$type<Record<string, unknown>>().notNull(),
  provider: text("provider").notNull().default("local"),
  model: text("model").notNull().default("deterministic-v1"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  pairIdx: index("ats_analyses_pair_idx").on(table.jobId, table.resumeVersionId)
}));

export const jobResumeMatches = pgTable("job_resume_matches", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").references(() => jobs.id, { onDelete: "cascade" }).notNull(),
  resumeVersionId: uuid("resume_version_id").references(() => resumeVersions.id, { onDelete: "cascade" }).notNull(),
  score: integer("score").notNull(),
  recommendations: jsonb("recommendations").$type<Record<string, unknown>>().notNull(),
  inputs: jsonb("inputs").$type<Record<string, unknown>>().notNull(),
  provider: text("provider").notNull().default("local"),
  model: text("model").notNull().default("deterministic-v1"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  pairIdx: index("job_resume_matches_pair_idx").on(table.jobId, table.resumeVersionId)
}));

export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  jobId: uuid("job_id").references(() => jobs.id, { onDelete: "cascade" }).notNull(),
  resumeVersionId: uuid("resume_version_id").references(() => resumeVersions.id, { onDelete: "set null" }),
  stage: applicationStage("stage").default("saved").notNull(),
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  outcome: text("outcome"),
  ...timestamps
}, (table) => ({
  userStageIdx: index("applications_user_stage_idx").on(table.userId, table.stage)
}));

export const applicationContacts = pgTable("application_contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }).notNull(),
  relationship: text("relationship").notNull().default("recruiter"),
  notes: text("notes"),
  ...timestamps
}, (table) => ({
  applicationContactIdx: uniqueIndex("application_contacts_application_contact_idx").on(table.applicationId, table.contactId)
}));

export const offers = pgTable("offers", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  baseCompensation: integer("base_compensation").notNull(),
  currency: text("currency").notNull().default("USD"),
  equity: text("equity"),
  benefits: text("benefits"),
  deadlineAt: timestamp("deadline_at", { withTimezone: true }),
  negotiationNotes: text("negotiation_notes"),
  status: text("status").notNull().default("active"),
  decisionScore: integer("decision_score").notNull().default(0),
  comparison: jsonb("comparison").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps
}, (table) => ({
  userStatusIdx: index("offers_user_status_idx").on(table.userId, table.status),
  applicationIdx: index("offers_application_idx").on(table.applicationId)
}));

export const backgroundJobs = pgTable("background_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  queueName: text("queue_name").notNull(),
  jobName: text("job_name").notNull(),
  status: text("status").notNull().default("queued"),
  idempotencyKey: text("idempotency_key").notNull(),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  lastError: text("last_error"),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  deadLetteredAt: timestamp("dead_lettered_at", { withTimezone: true }),
  ...timestamps
}, (table) => ({
  idempotencyIdx: uniqueIndex("background_jobs_idempotency_idx").on(table.idempotencyKey),
  queueStatusIdx: index("background_jobs_queue_status_idx").on(table.queueName, table.status)
}));

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "set null" }),
  kind: documentKind("kind").notNull(),
  name: text("name").notNull(),
  storageKey: text("storage_key").notNull(),
  contentHash: text("content_hash").notNull(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps
});

export const documentTemplates = pgTable("document_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  kind: documentKind("kind").notNull(),
  format: text("format").notNull().default("markdown"),
  body: text("body").notNull(),
  ...timestamps
}, (table) => ({
  userKindIdx: index("document_templates_user_kind_idx").on(table.userId, table.kind)
}));

export const applicationSharePackets = pgTable("application_share_packets", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull(),
  audience: text("audience").notNull().default("trusted_reviewer"),
  recipientName: text("recipient_name"),
  recipientEmail: text("recipient_email"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),
  ...timestamps
}, (table) => ({
  tokenIdx: uniqueIndex("application_share_packets_token_idx").on(table.token),
  applicationIdx: index("application_share_packets_application_idx").on(table.applicationId)
}));

export const reviewerComments = pgTable("reviewer_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  sharePacketId: uuid("share_packet_id").references(() => applicationSharePackets.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  resumeVersionId: uuid("resume_version_id").references(() => resumeVersions.id, { onDelete: "set null" }),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "set null" }),
  authorName: text("author_name").notNull(),
  targetType: text("target_type").notNull().default("application"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  applicationIdx: index("reviewer_comments_application_idx").on(table.applicationId),
  sharePacketIdx: index("reviewer_comments_share_packet_idx").on(table.sharePacketId)
}));

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  body: text("body").notNull(),
  ...timestamps
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  status: taskStatus("status").default("todo").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  ...timestamps
});

export const searchStrategyPlans = pgTable("search_strategy_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  weekStartsAt: timestamp("week_starts_at", { withTimezone: true }).notNull(),
  goals: jsonb("goals").$type<Record<string, number>>().notNull().default({}),
  recommendations: jsonb("recommendations").$type<Record<string, unknown>[]>().notNull().default([]),
  progress: jsonb("progress").$type<Record<string, unknown>>().notNull().default({}),
  generatedTaskIds: jsonb("generated_task_ids").$type<string[]>().notNull().default([]),
  ...timestamps
}, (table) => ({
  userWeekIdx: uniqueIndex("search_strategy_plans_user_week_idx").on(table.userId, table.weekStartsAt)
}));

export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  dueSoonDays: integer("due_soon_days").default(3).notNull(),
  taskRemindersEnabled: boolean("task_reminders_enabled").default(true).notNull(),
  followUpSuggestionsEnabled: boolean("follow_up_suggestions_enabled").default(true).notNull(),
  deliveryChannel: text("delivery_channel").notNull().default("in_app"),
  ...timestamps
}, (table) => ({
  userIdx: uniqueIndex("notification_preferences_user_idx").on(table.userId)
}));

export const userSettings = pgTable("user_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  preferredLocations: jsonb("preferred_locations").$type<string[]>().notNull().default([]),
  remotePreference: text("remote_preference").notNull().default("any"),
  minimumSalary: text("minimum_salary"),
  preferredSources: jsonb("preferred_sources").$type<string[]>().notNull().default([]),
  defaultAiProvider: text("default_ai_provider").notNull().default("local"),
  defaultAiModel: text("default_ai_model").notNull().default("deterministic-v1"),
  redactSensitiveExports: boolean("redact_sensitive_exports").default(true).notNull(),
  storeEmailBodies: boolean("store_email_bodies").default(false).notNull(),
  aiArtifactRetention: text("ai_artifact_retention").notNull().default("keep"),
  ...timestamps
}, (table) => ({
  userIdx: uniqueIndex("user_settings_user_idx").on(table.userId)
}));

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("pending"),
  deliveryChannel: text("delivery_channel").notNull().default("in_app"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  readAt: timestamp("read_at", { withTimezone: true }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps
}, (table) => ({
  userStatusIdx: index("notifications_user_status_idx").on(table.userId, table.status)
}));

export const interviews = pgTable("interviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  format: text("format"),
  location: text("location"),
  participants: jsonb("participants").$type<string[]>().notNull().default([]),
  preparationNotes: text("preparation_notes"),
  outcome: text("outcome"),
  notes: text("notes"),
  ...timestamps
});

export const emailIntegrationConnections = pgTable("email_integration_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  provider: text("provider").notNull(),
  accountEmail: text("account_email").notNull(),
  status: text("status").notNull().default("placeholder"),
  syncState: jsonb("sync_state").$type<Record<string, unknown>>().notNull().default({}),
  excludeBodies: boolean("exclude_bodies").default(true).notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  ...timestamps
});

export const emailSyncJobs = pgTable("email_sync_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  connectionId: uuid("connection_id").references(() => emailIntegrationConnections.id, { onDelete: "cascade" }).notNull(),
  status: text("status").notNull().default("queued"),
  cursor: text("cursor"),
  error: text("error"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  ...timestamps
});

export const emailMessages = pgTable("email_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  connectionId: uuid("connection_id").references(() => emailIntegrationConnections.id, { onDelete: "cascade" }).notNull(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "set null" }),
  providerMessageId: text("provider_message_id").notNull(),
  threadId: text("thread_id"),
  fromAddress: text("from_address"),
  toAddresses: jsonb("to_addresses").$type<string[]>().notNull().default([]),
  subject: text("subject"),
  snippet: text("snippet"),
  body: text("body"),
  classification: text("classification").notNull().default("unclassified"),
  classificationReason: text("classification_reason"),
  receivedAt: timestamp("received_at", { withTimezone: true }),
  ...timestamps
}, (table) => ({
  providerMessageIdx: uniqueIndex("email_messages_connection_provider_message_idx").on(table.connectionId, table.providerMessageId)
}));

export const calendarIntegrationConnections = pgTable("calendar_integration_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  provider: text("provider").notNull(),
  accountEmail: text("account_email").notNull(),
  calendarName: text("calendar_name"),
  status: text("status").notNull().default("placeholder"),
  syncState: jsonb("sync_state").$type<Record<string, unknown>>().notNull().default({}),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  ...timestamps
});

export const calendarSyncJobs = pgTable("calendar_sync_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  connectionId: uuid("connection_id").references(() => calendarIntegrationConnections.id, { onDelete: "cascade" }).notNull(),
  status: text("status").notNull().default("queued"),
  cursor: text("cursor"),
  error: text("error"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  ...timestamps
});

export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  connectionId: uuid("connection_id").references(() => calendarIntegrationConnections.id, { onDelete: "cascade" }).notNull(),
  interviewId: uuid("interview_id").references(() => interviews.id, { onDelete: "set null" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
  providerEventId: text("provider_event_id").notNull(),
  title: text("title").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  location: text("location"),
  status: text("status").notNull().default("confirmed"),
  conflictStatus: text("conflict_status").notNull().default("clear"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps
}, (table) => ({
  providerEventIdx: uniqueIndex("calendar_events_connection_provider_event_idx").on(table.connectionId, table.providerEventId)
}));

export const aiArtifacts = pgTable("ai_artifacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "set null" }),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  purpose: text("purpose").notNull(),
  promptHash: text("prompt_hash").notNull(),
  output: jsonb("output").$type<Record<string, unknown>>().notNull(),
  groundedInProfile: boolean("grounded_in_profile").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const groundingReviews = pgTable("grounding_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  artifactId: uuid("artifact_id").references(() => aiArtifacts.id, { onDelete: "cascade" }).notNull(),
  claim: text("claim").notNull(),
  evidence: jsonb("evidence").$type<Record<string, unknown>>().notNull().default({}),
  status: text("status").notNull().default("pending"),
  reviewerNote: text("reviewer_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  artifactIdx: index("grounding_reviews_artifact_idx").on(table.artifactId)
}));

export const applicationEvents = pgTable("application_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  kind: eventKind("kind").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
