import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { candidateProfiles, users } from "@jobos/database";
import type { UpsertCandidateProfileInput } from "@jobos/validation";
import { requireCurrentUserId } from "../common/current-user.js";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class ProfilesRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async getCurrent() {
    const userId = requireCurrentUserId();
    const [profile] = await this.db.select().from(candidateProfiles).where(eq(candidateProfiles.userId, userId)).limit(1);
    return profile ?? null;
  }

  async upsert(input: UpsertCandidateProfileInput) {
    const userId = requireCurrentUserId();
    const canonicalData = {
      skills: input.skills?.split(",").map((skill) => skill.trim()).filter(Boolean) ?? [],
      experience: input.experience ?? ""
    };
    const [existing] = await this.db.select({ id: candidateProfiles.id }).from(candidateProfiles).where(eq(candidateProfiles.userId, userId)).limit(1);

    if (existing) {
      const [profile] = await this.db.update(candidateProfiles).set({
        headline: input.headline,
        summary: input.summary,
        location: input.location,
        canonicalData,
        updatedAt: new Date()
      }).where(eq(candidateProfiles.id, existing.id)).returning();
      return profile;
    }

    const [profile] = await this.db.insert(candidateProfiles).values({
      userId,
      headline: input.headline,
      summary: input.summary,
      location: input.location,
      canonicalData
    }).returning();
    return profile;
  }}

