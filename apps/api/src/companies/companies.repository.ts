import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { companies, contacts, jobs } from "@jobos/database";
import type { UpsertCompanyInput } from "@jobos/validation";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class CompaniesRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  list() {
    return this.db.select().from(companies).orderBy(asc(companies.name));
  }

  async findById(id: string) {
    const [company] = await this.db.select().from(companies).where(eq(companies.id, id)).limit(1);
    if (!company) return null;
    const [companyContacts, companyJobs] = await Promise.all([
      this.db
        .select({
          id: contacts.id,
          name: contacts.name,
          title: contacts.title,
          email: contacts.email,
          linkedinUrl: contacts.linkedinUrl,
          notes: contacts.notes,
          followUpAt: contacts.followUpAt
        })
        .from(contacts)
        .where(eq(contacts.companyId, id))
        .orderBy(asc(contacts.name)),
      this.db
        .select({
          id: jobs.id,
          title: jobs.title,
          location: jobs.location,
          sourceUrl: jobs.sourceUrl,
          createdAt: jobs.createdAt
        })
        .from(jobs)
        .where(eq(jobs.companyId, id))
        .orderBy(asc(jobs.createdAt))
    ]);
    return { ...company, contacts: companyContacts, jobs: companyJobs };
  }

  async create(input: UpsertCompanyInput) {
    const [company] = await this.db.insert(companies).values(input).returning();
    return company;
  }

  async update(id: string, input: UpsertCompanyInput) {
    const [company] = await this.db.update(companies).set({ ...input, updatedAt: new Date() }).where(eq(companies.id, id)).returning();
    return company ?? null;
  }
}
