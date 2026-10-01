import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { applicationEvents, applications, companies, interviews, jobs, tasks, users } from "@jobos/database";
import type { UpsertInterviewInput } from "@jobos/validation";
import { devUser } from "../common/dev-user.js";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class InterviewsRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  list() {
    return this.baseSelect().orderBy(asc(interviews.startsAt));
  }

  listForApplication(applicationId: string) {
    return this.baseSelect().where(eq(interviews.applicationId, applicationId)).orderBy(asc(interviews.startsAt));
  }

  async findById(id: string) {
    const [interview] = await this.baseSelect().where(eq(interviews.id, id)).limit(1);
    return interview ?? null;
  }

  async create(input: UpsertInterviewInput) {
    const userId = await this.ensureDevUser();
    const [interview] = await this.db.insert(interviews).values(interviewValues(input)).returning();

    await this.db.insert(applicationEvents).values({
      applicationId: interview.applicationId,
      kind: "updated",
      payload: { action: "interview_scheduled", interviewId: interview.id, startsAt: interview.startsAt.toISOString() }
    });

    await this.db.insert(tasks).values({
      applicationId: interview.applicationId,
      userId,
      title: `Prepare for ${interview.format ?? "interview"} interview`,
      dueAt: preparationTaskDueAt(interview.startsAt)
    });

    return interview;
  }

  async update(id: string, input: UpsertInterviewInput) {
    const [interview] = await this.db
      .update(interviews)
      .set({ ...interviewValues(input), updatedAt: new Date() })
      .where(eq(interviews.id, id))
      .returning();

    if (interview) {
      await this.db.insert(applicationEvents).values({
        applicationId: interview.applicationId,
        kind: "updated",
        payload: { action: "interview_updated", interviewId: interview.id }
      });
    }

    return interview ?? null;
  }

  async delete(id: string) {
    const [interview] = await this.db.delete(interviews).where(eq(interviews.id, id)).returning({
      id: interviews.id,
      applicationId: interviews.applicationId
    });

    if (interview) {
      await this.db.insert(applicationEvents).values({
        applicationId: interview.applicationId,
        kind: "updated",
        payload: { action: "interview_deleted", interviewId: interview.id }
      });
    }

    return interview ?? null;
  }

  private baseSelect() {
    return this.db
      .select({
        id: interviews.id,
        applicationId: interviews.applicationId,
        startsAt: interviews.startsAt,
        endsAt: interviews.endsAt,
        format: interviews.format,
        location: interviews.location,
        participants: interviews.participants,
        preparationNotes: interviews.preparationNotes,
        outcome: interviews.outcome,
        notes: interviews.notes,
        jobTitle: jobs.title,
        companyName: companies.name,
        stage: applications.stage,
        createdAt: interviews.createdAt,
        updatedAt: interviews.updatedAt
      })
      .from(interviews)
      .innerJoin(applications, eq(interviews.applicationId, applications.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(companies, eq(jobs.companyId, companies.id));
  }

  private async ensureDevUser() {
    await this.db.insert(users).values(devUser).onConflictDoNothing({ target: users.email });
    const [user] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, devUser.email)).limit(1);
    return user.id;
  }
}

function interviewValues(input: UpsertInterviewInput) {
  return {
    applicationId: input.applicationId,
    startsAt: new Date(input.startsAt),
    endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
    format: input.format,
    location: input.location,
    participants: input.participants,
    preparationNotes: input.preparationNotes,
    outcome: input.outcome,
    notes: input.notes
  };
}

function preparationTaskDueAt(startsAt: Date) {
  const dueAt = new Date(startsAt);
  dueAt.setDate(dueAt.getDate() - 1);
  return dueAt;
}
