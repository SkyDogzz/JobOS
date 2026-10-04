import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, sql } from "drizzle-orm";
import { applications, companies, copilotActions, copilotConversations, copilotMessages, documents, jobs, resumes, tasks, userSettings } from "@jobos/database";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class CopilotRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async ensureConversation(userId: string) {
    const existing = await this.db.query.copilotConversations.findFirst({ where: eq(copilotConversations.userId, userId), orderBy: [desc(copilotConversations.updatedAt)] });
    if (existing) return existing;
    const [created] = await this.db.insert(copilotConversations).values({ userId }).returning();
    return created;
  }

  listMessages(conversationId: string) {
    return this.db.select().from(copilotMessages).where(eq(copilotMessages.conversationId, conversationId)).orderBy(copilotMessages.createdAt).limit(100);
  }

  listActions(userId: string) {
    return this.db.select().from(copilotActions).where(eq(copilotActions.userId, userId)).orderBy(desc(copilotActions.createdAt)).limit(100);
  }

  async createMessage(input: { conversationId: string; userId: string; role: string; content: string; grounding?: Record<string, unknown> }) {
    const [message] = await this.db.insert(copilotMessages).values({ ...input, grounding: input.grounding ?? {} }).returning();
    await this.db.update(copilotConversations).set({ updatedAt: new Date() }).where(eq(copilotConversations.id, input.conversationId));
    return message;
  }

  async replacePendingActions(input: { conversationId: string; userId: string; actions: Array<{ kind: string; title: string; rationale: string; proposedMutation: Record<string, unknown>; grounding: Record<string, unknown>; rollbackPlan: Record<string, unknown> }> }) {
    const inserted = [];
    for (const action of input.actions) {
      const [row] = await this.db.insert(copilotActions).values({ conversationId: input.conversationId, userId: input.userId, ...action }).returning();
      inserted.push(row);
    }
    return inserted;
  }

  async updateActionStatus(id: string, userId: string, status: "accepted" | "rejected") {
    const [existing] = await this.db.select().from(copilotActions).where(and(eq(copilotActions.id, id), eq(copilotActions.userId, userId))).limit(1);
    if (!existing) return null;
    const history = [...(existing.approvalHistory as Record<string, unknown>[]), { status, at: new Date().toISOString() }];
    const [updated] = await this.db.update(copilotActions).set({ status, approvalHistory: history, updatedAt: new Date() }).where(and(eq(copilotActions.id, id), eq(copilotActions.userId, userId))).returning();
    return updated;
  }

  async groundingContext(userId: string) {
    const savedJobs = await this.db.select({ id: jobs.id, title: jobs.title, description: jobs.description, companyName: companies.name, location: jobs.location, createdAt: jobs.createdAt }).from(jobs).leftJoin(companies, eq(jobs.companyId, companies.id)).where(eq(jobs.userId, userId)).orderBy(desc(jobs.createdAt)).limit(10);
    const apps = await this.db.select({ id: applications.id, stage: applications.stage, jobTitle: jobs.title, companyName: companies.name, updatedAt: applications.updatedAt }).from(applications).innerJoin(jobs, eq(applications.jobId, jobs.id)).leftJoin(companies, eq(jobs.companyId, companies.id)).where(eq(applications.userId, userId)).orderBy(desc(applications.updatedAt)).limit(10);
    const resumeCount = await this.db.select({ count: sql<number>`count(*)::int` }).from(resumes).where(eq(resumes.userId, userId));
    const documentCount = await this.db.select({ count: sql<number>`count(*)::int` }).from(documents).where(eq(documents.userId, userId));
    const openTasks = await this.db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.status, "todo"))).orderBy(tasks.dueAt).limit(10);
    const [settings] = await this.db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
    return { savedJobs, applications: apps, resumeCount: resumeCount[0]?.count ?? 0, documentCount: documentCount[0]?.count ?? 0, openTasks, settings: settings ?? null };
  }
}
