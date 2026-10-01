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
  notes: z.string().optional()
});

export const upsertJobSourceSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["manual", "job_board", "referral", "company_page", "other"]),
  baseUrl: z.string().url().optional(),
  status: z.enum(["active", "paused", "needs_review", "disabled"]).default("active"),
  notes: z.string().optional()
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
  metadata: z.record(z.unknown()).default({})
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
  metadata: z.record(z.unknown()).default({})
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

export const createNoteSchema = z.object({
  body: z.string().min(1)
});

export const createTaskSchema = z.object({
  title: z.string().min(1),
  dueAt: z.string().datetime().optional()
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
export type JobSearchInput = z.infer<typeof jobSearchSchema>;
export type SaveJobFilterInput = z.infer<typeof saveJobFilterSchema>;
export type ParseJobPostingInput = z.infer<typeof parseJobPostingSchema>;
export type UpsertCompanyInput = z.infer<typeof upsertCompanySchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpsertJobSourceInput = z.infer<typeof upsertJobSourceSchema>;
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
export type CreateGroundingReviewInput = z.infer<typeof createGroundingReviewSchema>;
export type UpdateGroundingReviewInput = z.infer<typeof updateGroundingReviewSchema>;
export type UpdateApplicationStageInput = z.infer<typeof updateApplicationStageSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpsertCandidateProfileInput = z.infer<typeof upsertCandidateProfileSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
