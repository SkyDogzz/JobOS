import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { applicationEvents, applications, backgroundJobs, billingUsageEvents, calendarSyncJobs, emailSyncJobs, jobs, supportDiagnosticBundles, users } from "@jobos/database";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class AdminRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  searchUsers(query: string) {
    const filter = query ? or(ilike(users.email, `%${query}%`), ilike(users.name, `%${query}%`)) : undefined;
    return this.db.select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt }).from(users).where(filter).orderBy(desc(users.createdAt)).limit(25);
  }

  auditTrail(userId?: string) {
    return this.db
      .select({ id: applicationEvents.id, kind: applicationEvents.kind, payload: applicationEvents.payload, createdAt: applicationEvents.createdAt, applicationId: applications.id, userId: applications.userId, jobTitle: jobs.title })
      .from(applicationEvents)
      .innerJoin(applications, eq(applicationEvents.applicationId, applications.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(userId ? eq(applications.userId, userId) : undefined)
      .orderBy(desc(applicationEvents.createdAt))
      .limit(100);
  }

  failedJobs() {
    return this.db.select().from(backgroundJobs).where(or(eq(backgroundJobs.status, "failed"), eq(backgroundJobs.status, "dead_lettered"))).orderBy(desc(backgroundJobs.updatedAt)).limit(100);
  }

  async syncHealth() {
    const email = await this.db.select().from(emailSyncJobs).orderBy(desc(emailSyncJobs.createdAt)).limit(20);
    const calendar = await this.db.select().from(calendarSyncJobs).orderBy(desc(calendarSyncJobs.createdAt)).limit(20);
    return { email, calendar };
  }

  async supportData(userId: string) {
    const [user] = await this.db.select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt }).from(users).where(eq(users.id, userId)).limit(1);
    const userJobs = await this.db.select({ id: jobs.id, title: jobs.title, location: jobs.location, sourceName: jobs.sourceName, createdAt: jobs.createdAt }).from(jobs).where(eq(jobs.userId, userId)).limit(50);
    const failures = await this.db.select().from(backgroundJobs).where(and(eq(backgroundJobs.userId, userId), or(eq(backgroundJobs.status, "failed"), eq(backgroundJobs.status, "dead_lettered")))).limit(25);
    const usage = await this.db.select().from(billingUsageEvents).where(eq(billingUsageEvents.userId, userId)).orderBy(desc(billingUsageEvents.createdAt)).limit(25);
    return { user, jobs: userJobs, failures, usage };
  }

  async createSupportBundle(input: { requestedByUserId: string | null; targetUserId: string; reason: string; redactedPayload: Record<string, unknown> }) {
    const [bundle] = await this.db.insert(supportDiagnosticBundles).values(input).returning();
    return bundle;
  }
}
