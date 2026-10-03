import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import { backgroundJobs } from "@jobos/database";
import { requireCurrentUserId } from "../common/current-user.js";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class OperationsRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  listBackgroundJobs() {
    const userId = requireCurrentUserId();
    return this.db
      .select()
      .from(backgroundJobs)
      .where(eq(backgroundJobs.userId, userId))
      .orderBy(desc(backgroundJobs.createdAt))
      .limit(50);
  }

  async retryBackgroundJob(id: string) {
    const userId = requireCurrentUserId();
    const [job] = await this.db
      .update(backgroundJobs)
      .set({ status: "queued", lastError: null, deadLetteredAt: null, updatedAt: new Date() })
      .where(and(eq(backgroundJobs.id, id), eq(backgroundJobs.userId, userId)))
      .returning();
    return job ?? null;
  }

  async recordBackgroundJob(input: {
    queueName: string;
    jobName: string;
    idempotencyKey: string;
    payload?: Record<string, unknown>;
    status?: string;
    error?: string | null;
  }) {
    const userId = requireCurrentUserId();
    const now = new Date();
    const [job] = await this.db
      .insert(backgroundJobs)
      .values({
        userId,
        queueName: input.queueName,
        jobName: input.jobName,
        idempotencyKey: input.idempotencyKey,
        payload: input.payload ?? {},
        status: input.status ?? "queued",
        attempts: input.status === "completed" ? 1 : 0,
        startedAt: input.status === "completed" ? now : undefined,
        finishedAt: input.status === "completed" ? now : undefined,
        lastError: input.error ?? undefined
      })
      .onConflictDoUpdate({
        target: backgroundJobs.idempotencyKey,
        set: {
          status: input.status ?? "queued",
          payload: input.payload ?? {},
          attempts: input.status === "completed" ? 1 : undefined,
          startedAt: input.status === "completed" ? now : undefined,
          finishedAt: input.status === "completed" ? now : undefined,
          lastError: input.error ?? null,
          updatedAt: now
        }
      })
      .returning();
    return job;
  }
}
