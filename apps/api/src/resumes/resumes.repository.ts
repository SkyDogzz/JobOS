import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { resumeVersions, resumes, users } from "@jobos/database";
import type { CreateResumeInput } from "@jobos/validation";
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

  private async ensureDevUser() {
    await this.db
      .insert(users)
      .values(devUser)
      .onConflictDoNothing({ target: users.email });

    const [user] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, devUser.email)).limit(1);
    return user.id;
  }
}

