import { Inject, Injectable } from "@nestjs/common";
import { and, asc, desc, eq, or } from "drizzle-orm";
import { companies, discoveredJobs, jobs, jobSources } from "@jobos/database";
import type { DiscoveredJobActionInput, RunJobSourceCheckInput, UpsertJobSourceInput } from "@jobos/validation";
import { requireCurrentUserId } from "../common/current-user.js";
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

  discovered() {
    const userId = requireCurrentUserId();
    return this.db.select().from(discoveredJobs).where(eq(discoveredJobs.userId, userId)).orderBy(desc(discoveredJobs.createdAt));
  }

  async runChecks(input: RunJobSourceCheckInput) {
    const userId = requireCurrentUserId();
    const sources = input.sourceId
      ? await this.db.select().from(jobSources).where(eq(jobSources.id, input.sourceId))
      : await this.db.select().from(jobSources).where(or(eq(jobSources.status, "active"), eq(jobSources.status, "needs_review")));
    const fixtures = input.fixtures.length ? input.fixtures : sources.flatMap((source) => fixtureJobsForSource(source));
    const existing = await this.db.select({ sourceUrl: jobs.sourceUrl, title: jobs.title }).from(jobs).where(eq(jobs.userId, userId));
    const queued = [];
    for (const fixture of fixtures) {
      const fixtureSourceId = "sourceId" in fixture ? fixture.sourceId : undefined;
      const source = sources.find((item) => item.id === fixtureSourceId || item.name === fixture.sourceName) ?? sources[0] ?? null;
      const duplicateScore = existing.some((job) => job.sourceUrl && job.sourceUrl === fixture.sourceUrl) ? 100 : existing.some((job) => normalize(job.title) === normalize(fixture.title)) ? 70 : 0;
      const relevanceScore = scoreRelevance(fixture.description);
      const reliabilityScore = scoreReliability(source?.kind ?? "manual", fixture.sourceUrl);
      const [row] = await this.db.insert(discoveredJobs).values({
        userId,
        sourceId: source?.id,
        title: fixture.title,
        companyName: fixture.companyName,
        description: fixture.description,
        location: fixture.location,
        sourceUrl: fixture.sourceUrl,
        sourceName: fixture.sourceName ?? source?.name,
        remotePolicy: fixture.remotePolicy,
        salaryText: fixture.salaryText,
        reliabilityScore,
        duplicateScore,
        relevanceScore,
        metadata: { checkedAt: new Date().toISOString(), sourceKind: source?.kind ?? "manual" }
      }).returning();
      queued.push(row);
    }
    return { checkedSources: sources.length, imported: queued.length, queued };
  }

  async approveDiscovered(id: string) {
    const userId = requireCurrentUserId();
    const [candidate] = await this.db.select().from(discoveredJobs).where(and(eq(discoveredJobs.id, id), eq(discoveredJobs.userId, userId))).limit(1);
    if (!candidate) return null;
    const companyId = candidate.companyName ? await this.findOrCreateCompany(candidate.companyName) : null;
    const [job] = await this.db.insert(jobs).values({
      userId,
      companyId,
      sourceId: candidate.sourceId,
      title: candidate.title,
      description: candidate.description,
      location: candidate.location,
      sourceUrl: candidate.sourceUrl,
      sourceName: candidate.sourceName,
      remotePolicy: candidate.remotePolicy,
      salaryText: candidate.salaryText
    }).returning();
    await this.db.update(discoveredJobs).set({ status: "approved", updatedAt: new Date() }).where(eq(discoveredJobs.id, id));
    return job;
  }

  async dismissDiscovered(id: string) {
    return this.setStatus(id, "dismissed");
  }

  async snoozeDiscovered(id: string, input: DiscoveredJobActionInput) {
    const userId = requireCurrentUserId();
    const [candidate] = await this.db.update(discoveredJobs).set({
      status: "snoozed",
      snoozedUntil: input.snoozedUntil ? new Date(input.snoozedUntil) : new Date(Date.now() + 604800000),
      updatedAt: new Date()
    }).where(and(eq(discoveredJobs.id, id), eq(discoveredJobs.userId, userId))).returning();
    return candidate ?? null;
  }

  private async setStatus(id: string, status: string) {
    const userId = requireCurrentUserId();
    const [candidate] = await this.db.update(discoveredJobs).set({ status, updatedAt: new Date() }).where(and(eq(discoveredJobs.id, id), eq(discoveredJobs.userId, userId))).returning();
    return candidate ?? null;
  }

  private async findOrCreateCompany(name: string) {
    const [existing] = await this.db.select({ id: companies.id }).from(companies).where(eq(companies.name, name)).limit(1);
    if (existing) return existing.id;
    const [company] = await this.db.insert(companies).values({ name }).returning({ id: companies.id });
    return company.id;
  }
}

function fixtureJobsForSource(source: typeof jobSources.$inferSelect) {
  const base = source.baseUrl ?? "https://jobs.example.com";
  return [{
    title: `${source.name} Platform Engineer`,
    companyName: source.name,
    description: `Build TypeScript automation and PostgreSQL workflows sourced from ${source.name}.`,
    location: "Remote",
    sourceUrl: `${base.replace(/\/$/, "")}/platform-engineer`,
    sourceName: source.name,
    remotePolicy: "remote",
    salaryText: "$130k - $170k"
  }];
}

function scoreReliability(kind: string, sourceUrl?: string) {
  return Math.min(100, (kind === "company_page" ? 85 : kind === "job_board" ? 75 : 60) + (sourceUrl?.startsWith("https://") ? 10 : 0));
}

function scoreRelevance(description: string) {
  const matches = ["typescript", "postgres", "automation", "remote", "workflow"].filter((term) => description.toLowerCase().includes(term)).length;
  return Math.min(100, 45 + matches * 10);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
