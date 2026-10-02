import { Inject, Injectable } from "@nestjs/common";
import { and, asc, desc, eq } from "drizzle-orm";
import { applications, atsAnalyses, companies, jobResumeMatches, jobs, resumeVersions, resumes } from "@jobos/database";
import type { CreateResumeInput, CreateResumeVersionFromParseInput, CreateResumeVersionInput } from "@jobos/validation";
import { requireCurrentUserId } from "../common/current-user.js";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class ResumesRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async list() {
    const userId = requireCurrentUserId();
    return this.db
      .select({
        id: resumes.id,
        name: resumes.name,
        createdAt: resumes.createdAt,
        versionId: resumeVersions.id,
        versionNumber: resumeVersions.versionNumber,
        versionTitle: resumeVersions.title
      })
      .from(resumes)
      .leftJoin(resumeVersions, eq(resumes.id, resumeVersions.resumeId))
      .where(eq(resumes.userId, userId))
      .orderBy(asc(resumes.createdAt), asc(resumeVersions.versionNumber));
  }

  async create(input: CreateResumeInput) {
    const userId = requireCurrentUserId();
    const [resume] = await this.db.insert(resumes).values({ userId, name: input.name }).returning();
    const [version] = await this.db
      .insert(resumeVersions)
      .values({
        resumeId: resume.id,
        versionNumber: 1,
        title: input.title ?? input.name,
        content: input.content
      })
      .returning();

    return { ...resume, currentVersion: version };
  }

  async findById(id: string) {
    const userId = requireCurrentUserId();
    const [resume] = await this.db
      .select({
        id: resumes.id,
        name: resumes.name,
        createdAt: resumes.createdAt,
        updatedAt: resumes.updatedAt
      })
      .from(resumes)
      .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
      .limit(1);

    if (!resume) {
      return null;
    }

    const versions = await this.db
      .select({
        id: resumeVersions.id,
        resumeId: resumeVersions.resumeId,
        versionNumber: resumeVersions.versionNumber,
        title: resumeVersions.title,
        content: resumeVersions.content,
        createdAt: resumeVersions.createdAt
      })
      .from(resumeVersions)
      .where(eq(resumeVersions.resumeId, id))
      .orderBy(desc(resumeVersions.versionNumber));

    const linkedApplications = await this.db
      .select({
        id: applications.id,
        stage: applications.stage,
        resumeVersionId: applications.resumeVersionId,
        jobTitle: jobs.title,
        companyName: companies.name,
        createdAt: applications.createdAt
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .innerJoin(resumeVersions, eq(applications.resumeVersionId, resumeVersions.id))
      .where(eq(resumeVersions.resumeId, id))
      .orderBy(asc(applications.createdAt));

    const analyses = await this.db
      .select({
        id: atsAnalyses.id,
        jobId: atsAnalyses.jobId,
        resumeVersionId: atsAnalyses.resumeVersionId,
        scores: atsAnalyses.scores,
        findings: atsAnalyses.findings,
        createdAt: atsAnalyses.createdAt
      })
      .from(atsAnalyses)
      .innerJoin(resumeVersions, eq(atsAnalyses.resumeVersionId, resumeVersions.id))
      .where(eq(resumeVersions.resumeId, id))
      .orderBy(desc(atsAnalyses.createdAt));

    const matches = await this.db
      .select({
        id: jobResumeMatches.id,
        jobId: jobResumeMatches.jobId,
        resumeVersionId: jobResumeMatches.resumeVersionId,
        score: jobResumeMatches.score,
        recommendations: jobResumeMatches.recommendations,
        createdAt: jobResumeMatches.createdAt
      })
      .from(jobResumeMatches)
      .innerJoin(resumeVersions, eq(jobResumeMatches.resumeVersionId, resumeVersions.id))
      .where(eq(resumeVersions.resumeId, id))
      .orderBy(desc(jobResumeMatches.createdAt));

    return { ...resume, versions, applications: linkedApplications, analyses, matches };
  }

  async createVersion(id: string, input: CreateResumeVersionInput) {
    const userId = requireCurrentUserId();
    const [resume] = await this.db.select({ id: resumes.id }).from(resumes).where(and(eq(resumes.id, id), eq(resumes.userId, userId))).limit(1);
    if (!resume) {
      return null;
    }

    const [latest] = await this.db
      .select({ versionNumber: resumeVersions.versionNumber })
      .from(resumeVersions)
      .where(eq(resumeVersions.resumeId, id))
      .orderBy(desc(resumeVersions.versionNumber))
      .limit(1);

    const [version] = await this.db
      .insert(resumeVersions)
      .values({
        resumeId: id,
        versionNumber: (latest?.versionNumber ?? 0) + 1,
        title: input.title,
        content: input.content
      })
      .returning();

    return version;
  }

  async createVersionFromParsed(id: string, input: CreateResumeVersionFromParseInput) {
    return this.createVersion(id, {
      title: input.title,
      content: {
        ...input.parsed,
        metadata: {
          source: "resume_paste",
          originalText: input.originalText,
          importedAt: new Date().toISOString()
        }
      }
    });
  }
}
