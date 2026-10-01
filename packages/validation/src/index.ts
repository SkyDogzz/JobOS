import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  companyName: z.string().min(1).optional(),
  location: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  sourceName: z.string().min(1).optional(),
  remotePolicy: z.string().min(1).optional(),
  salaryText: z.string().min(1).optional()
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
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type CreateResumeVersionInput = z.infer<typeof createResumeVersionSchema>;
export type ParseResumeInput = z.infer<typeof parseResumeSchema>;
export type CreateResumeVersionFromParseInput = z.infer<typeof createResumeVersionFromParseSchema>;
export type AtsAnalysisInput = z.infer<typeof atsAnalysisSchema>;
export type MatchJobInput = z.infer<typeof matchJobSchema>;
export type TailorResumeInput = z.infer<typeof tailorResumeSchema>;
export type ApproveTailoredResumeInput = z.infer<typeof approveTailoredResumeSchema>;
export type UpdateApplicationStageInput = z.infer<typeof updateApplicationStageSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpsertCandidateProfileInput = z.infer<typeof upsertCandidateProfileSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
