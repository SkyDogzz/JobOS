import { Inject, Injectable } from "@nestjs/common";
import { and, asc, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { applications, companies, contacts, jobResumeMatches, jobs, jobSources, resumeVersions, resumes, savedJobFilters, users } from "@jobos/database";
import type { CreateJobInput, JobSearchInput, SaveJobFilterInput } from "@jobos/validation";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";
import { devUser } from "../common/dev-user.js";

@Injectable()
export class JobsRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async list(filters: JobSearchInput = {}) {
    const conditions = [
      filters.companyId ? eq(jobs.companyId, filters.companyId) : undefined,
      filters.sourceId ? eq(jobs.sourceId, filters.sourceId) : undefined,
      filters.location ? ilike(jobs.location, `%${filters.location}%`) : undefined,
      filters.remotePolicy ? ilike(jobs.remotePolicy, `%${filters.remotePolicy}%`) : undefined,
      filters.salaryText ? ilike(jobs.salaryText, `%${filters.salaryText}%`) : undefined,
      filters.company ? ilike(companies.name, `%${filters.company}%`) : undefined,
      filters.sourceName ? ilike(jobSources.name, `%${filters.sourceName}%`) : undefined,
      filters.stage ? eq(applications.stage, filters.stage as typeof applications.$inferSelect.stage) : undefined,
      filters.savedAfter ? gte(jobs.createdAt, new Date(filters.savedAfter)) : undefined,
      filters.savedBefore ? lte(jobs.createdAt, new Date(filters.savedBefore)) : undefined,
      filters.q
        ? or(
            ilike(jobs.title, `%${filters.q}%`),
            ilike(jobs.description, `%${filters.q}%`),
            ilike(companies.name, `%${filters.q}%`),
            ilike(jobSources.name, `%${filters.q}%`)
          )
        : undefined
    ].filter(Boolean);

    return this.db
      .select({
        id: jobs.id,
        title: jobs.title,
        description: jobs.description,
        location: jobs.location,
        sourceUrl: jobs.sourceUrl,
        sourceId: jobs.sourceId,
        sourceName: jobs.sourceName,
        sourceKind: jobSources.kind,
        sourceStatus: jobSources.status,
        remotePolicy: jobs.remotePolicy,
        salaryText: jobs.salaryText,
        companyId: companies.id,
        companyName: companies.name,
        applicationStage: applications.stage,
        createdAt: jobs.createdAt
      })
      .from(jobs)
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .leftJoin(jobSources, eq(jobs.sourceId, jobSources.id))
      .leftJoin(applications, eq(applications.jobId, jobs.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(jobs.createdAt));
  }

  async create(input: CreateJobInput) {
    await this.ensureDevUser();
    const companyId = input.companyName ? await this.findOrCreateCompany(input.companyName) : null;
    const sourceId = input.sourceId ?? (input.sourceName ? await this.findOrCreateSource(input.sourceName) : null);
    const [job] = await this.db
      .insert(jobs)
      .values({
        companyId,
        sourceId,
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

  async findDuplicates(input: CreateJobInput) {
    const rows = await this.list();
    const incomingTitle = normalize(input.title);
    const incomingCompany = normalize(input.companyName ?? "");
    const incomingDescription = fingerprint(input.description);
    return rows
      .map((job) => {
        const reasons: string[] = [];
        let score = 0;
        if (input.sourceUrl && job.sourceUrl === input.sourceUrl) {
          score += 100;
          reasons.push("Exact source URL match");
        }
        const titleScore = similarity(incomingTitle, normalize(job.title));
        const companyScore = similarity(incomingCompany, normalize(job.companyName ?? ""));
        if (titleScore >= 0.75 && (!incomingCompany || companyScore >= 0.7)) {
          score += Math.round((titleScore * 50) + (companyScore * 30));
          reasons.push("Similar company and title");
        }
        const descriptionScore = overlap(incomingDescription, fingerprint(job.description));
        if (descriptionScore >= 0.45) {
          score += Math.round(descriptionScore * 60);
          reasons.push("Similar description fingerprint");
        }
        return { ...job, duplicateScore: Math.min(score, 100), duplicateReasons: reasons };
      })
      .filter((job) => job.duplicateScore >= 45)
      .sort((a, b) => b.duplicateScore - a.duplicateScore)
      .slice(0, 5);
  }

  async merge(id: string, input: CreateJobInput, strategy: "keep_existing" | "update_existing") {
    const [existing] = await this.db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (!existing) return null;
    if (strategy === "keep_existing") return existing;
    const companyId = input.companyName ? await this.findOrCreateCompany(input.companyName) : existing.companyId;
    const sourceId = input.sourceId ?? (input.sourceName ? await this.findOrCreateSource(input.sourceName) : existing.sourceId);
    const [updated] = await this.db
      .update(jobs)
      .set({
        companyId,
        sourceId,
        title: input.title || existing.title,
        description: input.description || existing.description,
        location: input.location ?? existing.location,
        sourceUrl: input.sourceUrl ?? existing.sourceUrl,
        sourceName: input.sourceName ?? existing.sourceName,
        remotePolicy: input.remotePolicy ?? existing.remotePolicy,
        salaryText: input.salaryText ?? existing.salaryText,
        updatedAt: new Date()
      })
      .where(eq(jobs.id, id))
      .returning();
    return updated;
  }

  async findById(id: string) {
    const [job] = await this.db
      .select({
        id: jobs.id,
        title: jobs.title,
        description: jobs.description,
        location: jobs.location,
        sourceUrl: jobs.sourceUrl,
        sourceId: jobs.sourceId,
        sourceName: jobs.sourceName,
        sourceKind: jobSources.kind,
        sourceStatus: jobSources.status,
        remotePolicy: jobs.remotePolicy,
        salaryText: jobs.salaryText,
        companyId: companies.id,
        companyName: companies.name,
        createdAt: jobs.createdAt
      })
      .from(jobs)
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .leftJoin(jobSources, eq(jobs.sourceId, jobSources.id))
      .where(eq(jobs.id, id))
      .limit(1);

    if (!job) return null;

    const matches = await this.db
      .select({
        id: jobResumeMatches.id,
        resumeVersionId: jobResumeMatches.resumeVersionId,
        score: jobResumeMatches.score,
        recommendations: jobResumeMatches.recommendations,
        resumeName: resumes.name,
        resumeTitle: resumeVersions.title,
        createdAt: jobResumeMatches.createdAt
      })
      .from(jobResumeMatches)
      .innerJoin(resumeVersions, eq(jobResumeMatches.resumeVersionId, resumeVersions.id))
      .innerJoin(resumes, eq(resumeVersions.resumeId, resumes.id))
      .where(eq(jobResumeMatches.jobId, id))
      .orderBy(asc(jobResumeMatches.createdAt));

    const jobContacts = job.companyId
      ? await this.db
          .select({
            id: contacts.id,
            companyId: contacts.companyId,
            name: contacts.name,
            title: contacts.title,
            email: contacts.email,
            linkedinUrl: contacts.linkedinUrl,
            notes: contacts.notes,
            followUpAt: contacts.followUpAt
          })
          .from(contacts)
          .where(eq(contacts.companyId, job.companyId))
          .orderBy(asc(contacts.name))
      : [];

    return { ...job, matches: matches.reverse(), contacts: jobContacts };
  }

  async listFilters() {
    const userId = await this.ensureDevUser();
    return this.db.select().from(savedJobFilters).where(eq(savedJobFilters.userId, userId)).orderBy(asc(savedJobFilters.name));
  }

  async saveFilter(input: SaveJobFilterInput) {
    const userId = await this.ensureDevUser();
    const [filter] = await this.db.insert(savedJobFilters).values({ userId, name: input.name, filters: input.filters }).returning();
    return filter;
  }

  private async findOrCreateCompany(name: string) {
    const [existing] = await this.db.select({ id: companies.id }).from(companies).where(eq(companies.name, name)).limit(1);
    if (existing) {
      return existing.id;
    }

    const [company] = await this.db.insert(companies).values({ name }).returning({ id: companies.id });
    return company.id;
  }

  private async findOrCreateSource(name: string) {
    const [existing] = await this.db.select({ id: jobSources.id }).from(jobSources).where(eq(jobSources.name, name)).limit(1);
    if (existing) return existing.id;
    const [source] = await this.db.insert(jobSources).values({ name, kind: "manual", status: "active" }).returning({ id: jobSources.id });
    return source.id;
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

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+#.]+/g, " ").trim();
}

function fingerprint(value: string) {
  const stop = new Set(["the", "and", "for", "with", "you", "our", "this", "that", "will", "are", "job", "role"]);
  return new Set((normalize(value).match(/[a-z0-9+#.]{3,}/g) ?? []).filter((word) => !stop.has(word)).slice(0, 80));
}

function similarity(a: string, b: string) {
  if (!a || !b) return 0;
  const aWords = new Set(a.split(" ").filter(Boolean));
  const bWords = new Set(b.split(" ").filter(Boolean));
  return overlap(aWords, bWords);
}

function overlap(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) return 0;
  const shared = Array.from(a).filter((word) => b.has(word)).length;
  return shared / Math.max(a.size, b.size);
}
