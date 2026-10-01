import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { companies, jobs, users } from "@jobos/database";
import type { CreateJobInput } from "@jobos/validation";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";
import { devUser } from "../common/dev-user.js";

@Injectable()
export class JobsRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async list() {
    return this.db
      .select({
        id: jobs.id,
        title: jobs.title,
        description: jobs.description,
        location: jobs.location,
        sourceUrl: jobs.sourceUrl,
        sourceName: jobs.sourceName,
        remotePolicy: jobs.remotePolicy,
        salaryText: jobs.salaryText,
        companyId: companies.id,
        companyName: companies.name,
        createdAt: jobs.createdAt
      })
      .from(jobs)
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .orderBy(asc(jobs.createdAt));
  }

  async create(input: CreateJobInput) {
    await this.ensureDevUser();
    const companyId = input.companyName ? await this.findOrCreateCompany(input.companyName) : null;
    const [job] = await this.db
      .insert(jobs)
      .values({
        companyId,
        title: input.title,
        description: input.description,
        location: input.location,
        sourceUrl: input.sourceUrl,
        sourceName: input.sourceName,
        remotePolicy: input.remotePolicy,
        salaryText: input.salaryText
      })
      .returning();

    return job;
  }

  private async findOrCreateCompany(name: string) {
    const [existing] = await this.db.select({ id: companies.id }).from(companies).where(eq(companies.name, name)).limit(1);
    if (existing) {
      return existing.id;
    }

    const [company] = await this.db.insert(companies).values({ name }).returning({ id: companies.id });
    return company.id;
  }

  private async ensureDevUser() {
    await this.db
      .insert(users)
      .values(devUser)
      .onConflictDoNothing({ target: users.email });
  }
}

