import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { companies } from "@jobos/database";
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
    return company ?? null;
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

