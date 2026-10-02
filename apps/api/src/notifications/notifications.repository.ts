import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq, isNull } from "drizzle-orm";
import { applications, companies, jobs, notificationPreferences, notifications, tasks } from "@jobos/database";
import type { UpdateNotificationPreferencesInput } from "@jobos/validation";
import { requireCurrentUserId } from "../common/current-user.js";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class NotificationsRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async preferences() {
    const userId = requireCurrentUserId();
    return this.ensurePreferences(userId);
  }

  async updatePreferences(input: UpdateNotificationPreferencesInput) {
    const userId = requireCurrentUserId();
    await this.ensurePreferences(userId);
    const [preferences] = await this.db
      .update(notificationPreferences)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(notificationPreferences.userId, userId))
      .returning();
    return preferences;
  }

  async list() {
    const userId = requireCurrentUserId();
    await this.generateReminders(userId);
    return this.db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(asc(notifications.scheduledFor), asc(notifications.createdAt));
  }

  async generateReminders(userId?: string) {
    const resolvedUserId = userId ?? requireCurrentUserId();
    const preferences = await this.ensurePreferences(resolvedUserId);
    const now = new Date();
    const dueSoon = new Date(now.getTime() + preferences.dueSoonDays * 86400000);
    const taskRows = await this.db
      .select({
        id: tasks.id,
        applicationId: tasks.applicationId,
        title: tasks.title,
        dueAt: tasks.dueAt,
        jobTitle: jobs.title,
        companyName: companies.name
      })
      .from(tasks)
      .leftJoin(applications, eq(tasks.applicationId, applications.id))
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .where(and(eq(tasks.userId, resolvedUserId), eq(tasks.status, "todo")));

    let created = 0;
    if (preferences.taskRemindersEnabled) {
      for (const task of taskRows.filter((row) => row.dueAt && row.dueAt <= dueSoon)) {
        const kind = task.dueAt && task.dueAt < now ? "task_overdue" : "task_due_soon";
        created += await this.createOnce({
          userId: resolvedUserId,
          applicationId: task.applicationId,
          taskId: task.id,
          kind,
          title: kind === "task_overdue" ? `Overdue: ${task.title}` : `Due soon: ${task.title}`,
          body: task.jobTitle ? `${task.jobTitle} at ${task.companyName ?? "unknown company"}` : "Review this follow-up task.",
          scheduledFor: task.dueAt,
          deliveryChannel: preferences.deliveryChannel,
          metadata: { source: "task_reminder" }
        });
      }
    }

    if (preferences.followUpSuggestionsEnabled) {
      const staleApplications = await this.db
        .select({
          id: applications.id,
          stage: applications.stage,
          updatedAt: applications.updatedAt,
          jobTitle: jobs.title,
          companyName: companies.name
        })
        .from(applications)
        .innerJoin(jobs, eq(applications.jobId, jobs.id))
        .leftJoin(companies, eq(jobs.companyId, companies.id))
        .where(eq(applications.userId, resolvedUserId));
      for (const application of staleApplications.filter((row) => !["rejected", "withdrawn", "accepted"].includes(row.stage) && now.getTime() - row.updatedAt.getTime() >= 7 * 86400000)) {
        created += await this.createOnce({
          userId: resolvedUserId,
          applicationId: application.id,
          taskId: null,
          kind: "follow_up_suggestion",
          title: `Follow up on ${application.jobTitle}`,
          body: `No recent movement for ${application.companyName ?? "this company"}.`,
          scheduledFor: now,
          deliveryChannel: preferences.deliveryChannel,
          metadata: { source: "application_follow_up", stage: application.stage }
        });
      }
    }

    return { created };
  }

  async markRead(id: string) {
    const userId = requireCurrentUserId();
    const [notification] = await this.db
      .update(notifications)
      .set({ status: "read", readAt: new Date(), updatedAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return notification ?? null;
  }

  private async createOnce(input: typeof notifications.$inferInsert) {
    const existing = await this.db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, input.userId), eq(notifications.kind, input.kind), input.taskId ? eq(notifications.taskId, input.taskId) : isNull(notifications.taskId), input.applicationId ? eq(notifications.applicationId, input.applicationId) : isNull(notifications.applicationId)))
      .limit(1);
    if (existing.length) return 0;
    await this.db.insert(notifications).values(input);
    return 1;
  }

  private async ensurePreferences(userId: string) {
    await this.db.insert(notificationPreferences).values({ userId }).onConflictDoNothing({ target: notificationPreferences.userId });
    const [preferences] = await this.db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
    return preferences;
  }
}
