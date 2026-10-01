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
export type UpdateApplicationStageInput = z.infer<typeof updateApplicationStageSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpsertCandidateProfileInput = z.infer<typeof upsertCandidateProfileSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
