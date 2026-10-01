import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { applicationEvents, tasks, users } from "@jobos/database";
import type { CreateTaskInput } from "@jobos/validation";
import { devUser } from "../common/dev-user.js";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class TasksRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  list(applicationId: string) {
    return this.db.select().from(tasks).where(eq(tasks.applicationId, applicationId)).orderBy(asc(tasks.createdAt));
  }

  async create(applicationId: string, input: CreateTaskInput) {
    const userId = await this.ensureDevUser();
    const [task] = await this.db.insert(tasks).values({
      applicationId,
      userId,
      title: input.title,
      dueAt: input.dueAt ? new Date(input.dueAt) : undefined
    }).returning();
    await this.db.insert(applicationEvents).values({
      applicationId,
      kind: "updated",
      payload: { taskId: task.id, action: "task_created" }
    });
    return task;
  }

  async complete(id: string) {
    const [task] = await this.db.update(tasks).set({ status: "done", updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
    if (task?.applicationId) {
      await this.db.insert(applicationEvents).values({
        applicationId: task.applicationId,
        kind: "updated",
        payload: { taskId: task.id, action: "task_completed" }
      });
    }
    return task ?? null;
  }

  private async ensureDevUser() {
    await this.db.insert(users).values(devUser).onConflictDoNothing({ target: users.email });
    const [user] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, devUser.email)).limit(1);
    return user.id;
  }
}

