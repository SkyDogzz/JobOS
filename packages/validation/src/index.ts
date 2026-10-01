import { z } from "zod";

export const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  companyName: z.string().min(1).optional(),
  location: z.string().optional(),
  sourceUrl: z.string().url().optional()
});

export const createApplicationSchema = z.object({
  jobId: z.string().uuid(),
  resumeVersionId: z.string().uuid().optional()
});

