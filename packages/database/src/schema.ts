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
export const eventKind = pgEnum("event_kind", ["created", "updated", "stage_changed", "email", "note", "ai_generated"]);

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

export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  website: text("website"),
  description: text("description"),
  ...timestamps
}, (table) => ({
  nameIdx: index("companies_name_idx").on(table.name)
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
  ...timestamps
});

export const jobs = pgTable("jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
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

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "set null" }),
  kind: documentKind("kind").notNull(),
  name: text("name").notNull(),
  storageKey: text("storage_key").notNull(),
  contentHash: text("content_hash").notNull(),
  ...timestamps
});

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

export const interviews = pgTable("interviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  format: text("format"),
  location: text("location"),
  notes: text("notes"),
  ...timestamps
});

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

export const applicationEvents = pgTable("application_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  kind: eventKind("kind").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
