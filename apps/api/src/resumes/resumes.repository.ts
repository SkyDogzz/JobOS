import { Inject, Injectable } from "@nestjs/common";
import { asc, desc, eq } from "drizzle-orm";
import { applications, companies, jobs, resumeVersions, resumes, users } from "@jobos/database";
import type { CreateResumeInput, CreateResumeVersionInput } from "@jobos/validation";
import { devUser } from "../common/dev-user.js";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class ResumesRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async list() {
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
      .orderBy(asc(resumes.createdAt), asc(resumeVersions.versionNumber));
  }

  async create(input: CreateResumeInput) {
    const userId = await this.ensureDevUser();
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
    const [resume] = await this.db
      .select({
        id: resumes.id,
        name: resumes.name,
        createdAt: resumes.createdAt,
        updatedAt: resumes.updatedAt
      })
      .from(resumes)
      .where(eq(resumes.id, id))
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

    return { ...resume, versions, applications: linkedApplications };
  }

  async createVersion(id: string, input: CreateResumeVersionInput) {
    const [resume] = await this.db.select({ id: resumes.id }).from(resumes).where(eq(resumes.id, id)).limit(1);
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

  private async ensureDevUser() {
    await this.db
      .insert(users)
      .values(devUser)
      .onConflictDoNothing({ target: users.email });

    const [user] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, devUser.email)).limit(1);
    return user.id;
  }
}
