import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { jobSources } from "@jobos/database";
import type { UpsertJobSourceInput } from "@jobos/validation";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class JobSourcesRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  list() {
    return this.db.select().from(jobSources).orderBy(asc(jobSources.name));
  }

  async create(input: UpsertJobSourceInput) {
    const [source] = await this.db.insert(jobSources).values(input).returning();
    return source;
  }

  async update(id: string, input: UpsertJobSourceInput) {
    const [source] = await this.db.update(jobSources).set({ ...input, updatedAt: new Date() }).where(eq(jobSources.id, id)).returning();
    return source ?? null;
  }
}

