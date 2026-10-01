import { Inject, Injectable } from "@nestjs/common";
import { desc, eq, inArray } from "drizzle-orm";
import { jobResumeMatches, jobs, resumeVersions, resumes } from "@jobos/database";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class MatchingRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async loadJob(id: string) {
    const [job] = await this.db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return job ?? null;
  }

  async loadResumeVersions(ids?: string[]) {
    const query = this.db
      .select({
        id: resumeVersions.id,
        resumeId: resumeVersions.resumeId,
        resumeName: resumes.name,
        title: resumeVersions.title,
        content: resumeVersions.content
      })
      .from(resumeVersions)
      .innerJoin(resumes, eq(resumeVersions.resumeId, resumes.id));
    return ids?.length ? query.where(inArray(resumeVersions.id, ids)) : query;
  }

  async create(input: { jobId: string; resumeVersionId: string; score: number; recommendations: Record<string, unknown>; inputs: Record<string, unknown> }) {
    const [match] = await this.db.insert(jobResumeMatches).values(input).returning();
    return match;
  }

  async listForJob(jobId: string) {
    return this.db
      .select({
        id: jobResumeMatches.id,
        jobId: jobResumeMatches.jobId,
        resumeVersionId: jobResumeMatches.resumeVersionId,
        score: jobResumeMatches.score,
        recommendations: jobResumeMatches.recommendations,
        createdAt: jobResumeMatches.createdAt,
        resumeName: resumes.name,
        resumeTitle: resumeVersions.title
      })
      .from(jobResumeMatches)
      .innerJoin(resumeVersions, eq(jobResumeMatches.resumeVersionId, resumeVersions.id))
      .innerJoin(resumes, eq(resumeVersions.resumeId, resumes.id))
      .where(eq(jobResumeMatches.jobId, jobId))
      .orderBy(desc(jobResumeMatches.score), desc(jobResumeMatches.createdAt));
  }

  async listLatest() {
    return this.db
      .select({
        id: jobResumeMatches.id,
        jobId: jobResumeMatches.jobId,
        resumeVersionId: jobResumeMatches.resumeVersionId,
        score: jobResumeMatches.score,
        recommendations: jobResumeMatches.recommendations,
        createdAt: jobResumeMatches.createdAt,
        resumeName: resumes.name,
        resumeTitle: resumeVersions.title,
        jobTitle: jobs.title
      })
      .from(jobResumeMatches)
      .innerJoin(jobs, eq(jobResumeMatches.jobId, jobs.id))
      .innerJoin(resumeVersions, eq(jobResumeMatches.resumeVersionId, resumeVersions.id))
      .innerJoin(resumes, eq(resumeVersions.resumeId, resumes.id))
      .orderBy(desc(jobResumeMatches.score), desc(jobResumeMatches.createdAt))
      .limit(10);
  }
}
