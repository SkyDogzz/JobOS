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

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type CreateResumeInput = z.infer<typeof createResumeSchema>;
