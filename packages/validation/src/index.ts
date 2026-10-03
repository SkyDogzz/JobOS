import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  companyName: z.string().min(1).optional(),
  location: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  sourceId: z.string().uuid().optional(),
  sourceName: z.string().min(1).optional(),
  remotePolicy: z.string().min(1).optional(),
  salaryText: z.string().min(1).optional()
});

export const dedupeJobSchema = createJobSchema;

export const mergeJobSchema = z.object({
  incoming: createJobSchema,
  strategy: z.enum(["keep_existing", "update_existing"]).default("update_existing")
});

export const extensionJobImportSchema = z.object({
  contractVersion: z.literal("0.4.4").default("0.4.4"),
  pageUrl: z.string().url(),
  title: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  html: z.string().min(20).optional(),
  text: z.string().min(20).optional(),
  sourceName: z.string().min(1).default("browser_extension"),
  remotePolicy: z.string().min(1).optional(),
  salaryText: z.string().min(1).optional(),
  capturedAt: z.string().datetime().optional()
}).refine((value) => value.description || value.html || value.text, "A description, HTML, or text payload is required.");

export const extensionJobImportPreviewSchema = extensionJobImportSchema;

export const jobSearchSchema = z.object({
  q: z.string().optional(),
  companyId: z.string().uuid().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  remotePolicy: z.string().optional(),
  salaryText: z.string().optional(),
  sourceId: z.string().uuid().optional(),
  sourceName: z.string().optional(),
  stage: z.string().optional(),
  savedAfter: z.string().datetime().optional(),
  savedBefore: z.string().datetime().optional()
});

export const saveJobFilterSchema = z.object({
  name: z.string().min(1),
  filters: jobSearchSchema
});

export const parseJobPostingSchema = z.object({
  url: z.string().url().optional(),
  html: z.string().min(20).optional(),
  text: z.string().min(20).optional()
}).refine((value) => value.url || value.html || value.text, "A URL, HTML, or text payload is required.");

export const upsertCompanySchema = z.object({
  name: z.string().min(1),
  website: z.string().url().optional(),
  description: z.string().optional()
});

export const createContactSchema = z.object({
  companyId: z.string().uuid().optional(),
  name: z.string().min(1),
  title: z.string().optional(),
  email: z.string().email().optional(),
  linkedinUrl: z.string().url().optional(),
  notes: z.string().optional(),
  followUpAt: z.string().min(1).optional()
});

export const linkContactSchema = z.object({
  applicationId: z.string().uuid(),
  relationship: z.string().min(1).default("recruiter"),
  notes: z.string().optional()
});

export const upsertJobSourceSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["manual", "job_board", "referral", "company_page", "other"]),
  baseUrl: z.string().url().optional(),
  status: z.enum(["active", "paused", "needs_review", "disabled"]).default("active"),
  notes: z.string().optional()
});

export const runJobSourceCheckSchema = z.object({
  sourceId: z.string().uuid().optional(),
  fixtures: z.array(createJobSchema.extend({ sourceName: z.string().min(1).optional() })).default([])
});

export const discoveredJobActionSchema = z.object({
  snoozedUntil: z.string().datetime().optional()
});

export const createApplicationSchema = z.object({
  jobId: z.string().uuid(),
  resumeVersionId: z.string().uuid().optional(),
  stage: z.enum([
    "wishlist",
    "saved",
    "applied",
    "screening",
    "interviewing",
    "offer",
    "rejected",
    "withdrawn",
    "accepted"
  ]).optional()
});

export const createResumeSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1).optional(),
  content: z.record(z.unknown()).default({})
});

export const createResumeVersionSchema = z.object({
  title: z.string().min(1),
  content: z.record(z.unknown()).default({})
});

export const parseResumeSchema = z.object({
  text: z.string().min(25)
});

export const createResumeVersionFromParseSchema = z.object({
  title: z.string().min(1),
  parsed: z.record(z.unknown()),
  originalText: z.string().min(25)
});

export const atsAnalysisSchema = z.object({
  jobId: z.string().uuid(),
  resumeVersionId: z.string().uuid()
});

export const matchJobSchema = z.object({
  jobId: z.string().uuid(),
  resumeVersionIds: z.array(z.string().uuid()).optional()
});

export const tailorResumeSchema = z.object({
  jobId: z.string().uuid(),
  resumeVersionId: z.string().uuid()
});

export const approveTailoredResumeSchema = z.object({
  resumeId: z.string().uuid(),
  title: z.string().min(1),
  draft: z.record(z.unknown()),
  sourceVersionId: z.string().uuid(),
  jobId: z.string().uuid(),
  promptHash: z.string().min(1),
  metadata: z.record(z.unknown()).default({}),
  overrideHighRisk: z.boolean().default(false)
});

export const coverLetterToneSchema = z.enum(["concise", "narrative", "technical", "recruiter_friendly"]);

export const generateCoverLettersSchema = z.object({
  jobId: z.string().uuid(),
  resumeVersionId: z.string().uuid(),
  applicationId: z.string().uuid().optional(),
  tones: z.array(coverLetterToneSchema).min(1).max(4).default(["concise", "narrative", "technical", "recruiter_friendly"])
});

export const approveCoverLetterSchema = z.object({
  applicationId: z.string().uuid(),
  name: z.string().min(1),
  variant: z.object({
    tone: coverLetterToneSchema,
    title: z.string().min(1),
    body: z.string().min(1),
    groundedClaims: z.array(z.string()).default([])
  }),
  jobId: z.string().uuid(),
  resumeVersionId: z.string().uuid(),
  artifactId: z.string().uuid(),
  promptHash: z.string().min(1),
  metadata: z.record(z.unknown()).default({}),
  overrideHighRisk: z.boolean().default(false)
});

export const documentFiltersSchema = z.object({
  kind: z.enum(["resume", "cover_letter", "portfolio", "other"]).optional(),
  applicationId: z.string().uuid().optional(),
  provider: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  approvalState: z.string().min(1).optional()
});

export const assignDocumentSchema = z.object({
  applicationId: z.string().uuid().nullable()
});

export const exportFormatSchema = z.enum(["markdown", "pdf", "docx"]);

export const upsertDocumentTemplateSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["resume", "cover_letter", "portfolio", "other"]),
  format: exportFormatSchema.default("markdown"),
  body: z.string().min(1)
});

export const createGroundingReviewSchema = z.object({
  artifactId: z.string().uuid()
});

export const updateGroundingReviewSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "overridden"]),
  reviewerNote: z.string().optional()
});

export const updateApplicationStageSchema = z.object({
  stage: z.enum([
    "wishlist",
    "saved",
    "applied",
    "screening",
    "interviewing",
    "offer",
    "rejected",
    "withdrawn",
    "accepted"
  ])
});

export const createOfferSchema = z.object({
  baseCompensation: z.number().int().min(0),
  currency: z.string().min(3).max(8).default("USD"),
  equity: z.string().optional(),
  benefits: z.string().optional(),
  deadlineAt: z.string().datetime().optional(),
  negotiationNotes: z.string().optional(),
  marketBaseline: z.number().int().min(0).optional()
});

export const createSharePacketSchema = z.object({
  audience: z.enum(["mentor", "recruiter", "trusted_reviewer"]).default("trusted_reviewer"),
  recipientName: z.string().min(1).optional(),
  recipientEmail: z.string().email().optional(),
  expiresAt: z.string().datetime()
});

export const createReviewerCommentSchema = z.object({
  authorName: z.string().min(1).max(120).default("Reviewer"),
  targetType: z.enum(["application", "resume", "document"]).default("application"),
  resumeVersionId: z.string().uuid().optional(),
  documentId: z.string().uuid().optional(),
  body: z.string().min(1).max(4000)
});

export const createNoteSchema = z.object({
  body: z.string().min(1)
});

export const createTaskSchema = z.object({
  title: z.string().min(1),
  dueAt: z.string().datetime().optional()
});

export const strategyGoalsSchema = z.object({
  weekStartsAt: z.string().datetime().optional(),
  goals: z.object({
    applications: z.number().int().min(0).max(100).default(5),
    networking: z.number().int().min(0).max(100).default(3),
    followUps: z.number().int().min(0).max(100).default(3),
    interviews: z.number().int().min(0).max(50).default(1),
    resumeIterations: z.number().int().min(0).max(50).default(1)
  }).default({})
});

export const updateNotificationPreferencesSchema = z.object({
  dueSoonDays: z.number().int().min(0).max(30).optional(),
  taskRemindersEnabled: z.boolean().optional(),
  followUpSuggestionsEnabled: z.boolean().optional(),
  deliveryChannel: z.enum(["in_app", "email_placeholder"]).optional()
});

export const updateUserSettingsSchema = z.object({
  timezone: z.string().min(1).max(80).optional(),
  preferredLocations: z.array(z.string().min(1)).max(12).optional(),
  remotePreference: z.enum(["any", "remote", "hybrid", "onsite"]).optional(),
  minimumSalary: z.string().max(80).nullable().optional(),
  preferredSources: z.array(z.string().min(1)).max(20).optional(),
  defaultAiProvider: z.enum(["local", "openai", "anthropic"]).optional(),
  defaultAiModel: z.string().min(1).max(120).optional(),
  redactSensitiveExports: z.boolean().optional(),
  storeEmailBodies: z.boolean().optional(),
  aiArtifactRetention: z.enum(["keep", "redact_on_export", "delete_on_account_deletion"]).optional()
});

export const accountDeletionSchema = z.object({
  confirmEmail: z.string().email(),
  dryRun: z.boolean().default(true)
});

export const upsertInterviewSchema = z.object({
  applicationId: z.string().uuid(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  format: z.string().optional(),
  location: z.string().optional(),
  participants: z.array(z.string().min(1)).default([]),
  preparationNotes: z.string().optional(),
  outcome: z.string().optional(),
  notes: z.string().optional()
});

export const createEmailConnectionSchema = z.object({
  provider: z.string().min(1),
  accountEmail: z.string().email(),
  status: z.string().min(1).default("connected"),
  excludeBodies: z.boolean().default(true),
  syncState: z.record(z.unknown()).default({})
});

export const updateEmailConnectionSchema = createEmailConnectionSchema.partial();

export const createEmailSyncJobSchema = z.object({
  connectionId: z.string().uuid(),
  cursor: z.string().optional()
});

export const createEmailMessageSchema = z.object({
  connectionId: z.string().uuid(),
  applicationId: z.string().uuid().optional(),
  providerMessageId: z.string().min(1),
  threadId: z.string().optional(),
  fromAddress: z.string().email().optional(),
  toAddresses: z.array(z.string().email()).default([]),
  subject: z.string().optional(),
  snippet: z.string().optional(),
  body: z.string().optional(),
  receivedAt: z.string().datetime().optional()
});

export const syncEmailConnectionSchema = z.object({
  cursor: z.string().optional()
});

export const classifyEmailMessageSchema = z.object({
  classification: z.enum(["application_related", "recruiter", "interview", "offer", "rejection", "other"]),
  classificationReason: z.string().optional(),
  applicationId: z.string().uuid().nullable().optional()
});

export const createCalendarConnectionSchema = z.object({
  provider: z.string().min(1),
  accountEmail: z.string().email(),
  calendarName: z.string().optional(),
  status: z.string().min(1).default("connected"),
  syncState: z.record(z.unknown()).default({})
});

export const createCalendarSyncJobSchema = z.object({
  connectionId: z.string().uuid(),
  cursor: z.string().optional()
});

export const createCalendarEventSchema = z.object({
  connectionId: z.string().uuid(),
  interviewId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  providerEventId: z.string().min(1),
  title: z.string().min(1),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  location: z.string().optional(),
  status: z.string().min(1).default("confirmed"),
  conflictStatus: z.enum(["clear", "conflict", "tentative", "cancelled", "stale"]).default("clear"),
  metadata: z.record(z.unknown()).default({})
});

export const syncCalendarConnectionSchema = z.object({
  cursor: z.string().optional()
});

export const upsertCandidateProfileSchema = z.object({
  headline: z.string().optional(),
  summary: z.string().optional(),
  location: z.string().optional(),
  skills: z.string().optional(),
  experience: z.string().optional()
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type DedupeJobInput = z.infer<typeof dedupeJobSchema>;
export type MergeJobInput = z.infer<typeof mergeJobSchema>;
export type ExtensionJobImportInput = z.infer<typeof extensionJobImportSchema>;
export type JobSearchInput = z.infer<typeof jobSearchSchema>;
export type SaveJobFilterInput = z.infer<typeof saveJobFilterSchema>;
export type ParseJobPostingInput = z.infer<typeof parseJobPostingSchema>;
export type UpsertCompanyInput = z.infer<typeof upsertCompanySchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type LinkContactInput = z.infer<typeof linkContactSchema>;
export type UpsertJobSourceInput = z.infer<typeof upsertJobSourceSchema>;
export type RunJobSourceCheckInput = z.infer<typeof runJobSourceCheckSchema>;
export type DiscoveredJobActionInput = z.infer<typeof discoveredJobActionSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type CreateResumeVersionInput = z.infer<typeof createResumeVersionSchema>;
export type ParseResumeInput = z.infer<typeof parseResumeSchema>;
export type CreateResumeVersionFromParseInput = z.infer<typeof createResumeVersionFromParseSchema>;
export type AtsAnalysisInput = z.infer<typeof atsAnalysisSchema>;
export type MatchJobInput = z.infer<typeof matchJobSchema>;
export type TailorResumeInput = z.infer<typeof tailorResumeSchema>;
export type ApproveTailoredResumeInput = z.infer<typeof approveTailoredResumeSchema>;
export type GenerateCoverLettersInput = z.infer<typeof generateCoverLettersSchema>;
export type ApproveCoverLetterInput = z.infer<typeof approveCoverLetterSchema>;
export type DocumentFiltersInput = z.infer<typeof documentFiltersSchema>;
export type AssignDocumentInput = z.infer<typeof assignDocumentSchema>;
export type ExportFormatInput = z.infer<typeof exportFormatSchema>;
export type UpsertDocumentTemplateInput = z.infer<typeof upsertDocumentTemplateSchema>;
export type CreateGroundingReviewInput = z.infer<typeof createGroundingReviewSchema>;
export type UpdateGroundingReviewInput = z.infer<typeof updateGroundingReviewSchema>;
export type UpdateApplicationStageInput = z.infer<typeof updateApplicationStageSchema>;
export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type CreateSharePacketInput = z.infer<typeof createSharePacketSchema>;
export type CreateReviewerCommentInput = z.infer<typeof createReviewerCommentSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type StrategyGoalsInput = z.infer<typeof strategyGoalsSchema>;
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
export type AccountDeletionInput = z.infer<typeof accountDeletionSchema>;
export type UpsertInterviewInput = z.infer<typeof upsertInterviewSchema>;
export type CreateEmailConnectionInput = z.infer<typeof createEmailConnectionSchema>;
export type UpdateEmailConnectionInput = z.infer<typeof updateEmailConnectionSchema>;
export type CreateEmailSyncJobInput = z.infer<typeof createEmailSyncJobSchema>;
export type CreateEmailMessageInput = z.infer<typeof createEmailMessageSchema>;
export type ClassifyEmailMessageInput = z.infer<typeof classifyEmailMessageSchema>;
export type SyncEmailConnectionInput = z.infer<typeof syncEmailConnectionSchema>;
export type CreateCalendarConnectionInput = z.infer<typeof createCalendarConnectionSchema>;
export type CreateCalendarSyncJobInput = z.infer<typeof createCalendarSyncJobSchema>;
export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;
export type SyncCalendarConnectionInput = z.infer<typeof syncCalendarConnectionSchema>;
export type UpsertCandidateProfileInput = z.infer<typeof upsertCandidateProfileSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
