import { Inject, Injectable } from "@nestjs/common";
import { and, asc, desc, eq, gte, lt, lte } from "drizzle-orm";
import { applications, contacts, interviews, resumes, resumeVersions, searchStrategyPlans, tasks } from "@jobos/database";
import type { StrategyGoalsInput } from "@jobos/validation";
import { requireCurrentUserId } from "../common/current-user.js";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class StrategyRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async current(weekStartsAt: Date) {
    const userId = requireCurrentUserId();
    const [plan] = await this.db.select().from(searchStrategyPlans).where(and(eq(searchStrategyPlans.userId, userId), eq(searchStrategyPlans.weekStartsAt, weekStartsAt))).limit(1);
    return plan ?? null;
  }

  async upsert(input: StrategyGoalsInput, snapshot: StrategySnapshot) {
    const userId = requireCurrentUserId();
    const weekStartsAt = input.weekStartsAt ? new Date(input.weekStartsAt) : startOfWeek(new Date());
    const goals = resolveGoals(input.goals);
    const recommendations = recommend(goals, snapshot);
    const progress = summarizeProgress(goals, snapshot);
    const existing = await this.current(weekStartsAt);

    if (existing) {
      const [plan] = await this.db
        .update(searchStrategyPlans)
        .set({ goals, recommendations, progress, updatedAt: new Date() })
        .where(and(eq(searchStrategyPlans.userId, userId), eq(searchStrategyPlans.weekStartsAt, weekStartsAt)))
        .returning();
      return plan;
    }

    const [plan] = await this.db.insert(searchStrategyPlans).values({ userId, weekStartsAt, goals, recommendations, progress }).returning();
    return plan;
  }

  async snapshot(weekStartsAt: Date) {
    const userId = requireCurrentUserId();
    const weekEndsAt = new Date(weekStartsAt);
    weekEndsAt.setUTCDate(weekEndsAt.getUTCDate() + 7);
    const staleBefore = new Date();
    staleBefore.setUTCDate(staleBefore.getUTCDate() - 10);

    const [userApplications, weekTasks, weekInterviews, userContacts, weekResumeVersions, staleApplications] = await Promise.all([
      this.db.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.createdAt)),
      this.db.select().from(tasks).where(and(eq(tasks.userId, userId), gte(tasks.createdAt, weekStartsAt), lt(tasks.createdAt, weekEndsAt))).orderBy(asc(tasks.createdAt)),
      this.db
        .select({ id: interviews.id, startsAt: interviews.startsAt })
        .from(interviews)
        .innerJoin(applications, eq(interviews.applicationId, applications.id))
        .where(and(eq(applications.userId, userId), gte(interviews.startsAt, weekStartsAt), lt(interviews.startsAt, weekEndsAt))),
      this.db.select().from(contacts).where(eq(contacts.userId, userId)),
      this.db
        .select({ id: resumeVersions.id, createdAt: resumeVersions.createdAt })
        .from(resumeVersions)
        .innerJoin(resumes, eq(resumeVersions.resumeId, resumes.id))
        .where(and(eq(resumes.userId, userId), gte(resumeVersions.createdAt, weekStartsAt))),
      this.db.select().from(applications).where(and(eq(applications.userId, userId), lte(applications.updatedAt, staleBefore)))
    ]);

    return { applications: userApplications, tasks: weekTasks, interviews: weekInterviews, contacts: userContacts, resumeVersions: weekResumeVersions, staleApplications };
  }

  async createGeneratedTasks(planId: string, recommendations: Array<Record<string, unknown>>) {
    const userId = requireCurrentUserId();
    const dueAt = new Date();
    dueAt.setUTCDate(dueAt.getUTCDate() + 2);
    const created = [];
    for (const item of recommendations.slice(0, 5)) {
      const title = typeof item.title === "string" ? item.title : "Review search strategy recommendation";
      const [task] = await this.db.insert(tasks).values({ userId, title, dueAt }).returning();
      created.push(task);
    }
    await this.db.update(searchStrategyPlans).set({ generatedTaskIds: created.map((task) => task.id), updatedAt: new Date() }).where(eq(searchStrategyPlans.id, planId));
    return created;
  }
}

type StrategySnapshot = Awaited<ReturnType<StrategyRepository["snapshot"]>>;

function resolveGoals(goals?: Partial<Record<string, number>>) {
  return {
    applications: goals?.applications ?? 5,
    networking: goals?.networking ?? 3,
    followUps: goals?.followUps ?? 3,
    interviews: goals?.interviews ?? 1,
    resumeIterations: goals?.resumeIterations ?? 1
  };
}

function summarizeProgress(goals: ReturnType<typeof resolveGoals>, snapshot: StrategySnapshot) {
  const applications = snapshot.applications.filter((item) => item.stage !== "saved").length;
  const followUps = snapshot.tasks.filter((task) => /follow|check|reply/i.test(task.title)).length;
  const progress = {
    applications,
    networking: snapshot.contacts.length,
    followUps,
    interviews: snapshot.interviews.length,
    resumeIterations: snapshot.resumeVersions.length
  };
  return {
    ...progress,
    missedCommitments: Object.entries(goals).filter(([key, value]) => (progress as Record<string, number>)[key] < value).map(([key]) => key),
    staleApplicationCount: snapshot.staleApplications.length
  };
}

function recommend(goals: ReturnType<typeof resolveGoals>, snapshot: StrategySnapshot) {
  const progress = summarizeProgress(goals, snapshot) as Record<string, unknown>;
  const items: Array<Record<string, unknown>> = [];
  if ((progress.applications as number) < goals.applications) items.push({ kind: "application", title: "Apply to the strongest saved role", reason: "Application pace is below this week's target." });
  if ((progress.networking as number) < goals.networking) items.push({ kind: "networking", title: "Add one recruiter or teammate contact", reason: "Networking target is behind plan." });
  if ((progress.followUps as number) < goals.followUps || snapshot.staleApplications.length) items.push({ kind: "follow_up", title: "Send follow-ups for stale applications", reason: `${snapshot.staleApplications.length} active applications need attention.` });
  if ((progress.interviews as number) < goals.interviews) items.push({ kind: "interview", title: "Create interview prep blocks", reason: "Interview preparation goal is not met." });
  if ((progress.resumeIterations as number) < goals.resumeIterations) items.push({ kind: "resume", title: "Tailor one CV version for a priority role", reason: "Resume iteration goal is behind plan." });
  return items;
}

function startOfWeek(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = start.getUTCDay();
  start.setUTCDate(start.getUTCDate() - ((day + 6) % 7));
  return start;
}
