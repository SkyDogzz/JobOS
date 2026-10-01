import { Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { atsAnalyses, jobs, resumeVersions } from "@jobos/database";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class AtsRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async loadPair(jobId: string, resumeVersionId: string) {
    const [job] = await this.db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    const [resumeVersion] = await this.db.select().from(resumeVersions).where(eq(resumeVersions.id, resumeVersionId)).limit(1);
    return job && resumeVersion ? { job, resumeVersion } : null;
  }

  async create(input: { jobId: string; resumeVersionId: string; inputs: Record<string, unknown>; scores: Record<string, unknown>; findings: Record<string, unknown> }) {
    const [analysis] = await this.db.insert(atsAnalyses).values(input).returning();
    return analysis;
  }

  async listForApplication(jobId: string, resumeVersionId: string | null) {
    if (!resumeVersionId) return [];
    return this.db.select().from(atsAnalyses).where(eq(atsAnalyses.resumeVersionId, resumeVersionId)).orderBy(desc(atsAnalyses.createdAt));
  }
}

