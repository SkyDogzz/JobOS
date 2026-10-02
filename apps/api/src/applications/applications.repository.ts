import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import { applicationContacts, applicationEvents, applications, atsAnalyses, companies, contacts, jobs } from "@jobos/database";
import type { CreateApplicationInput, UpdateApplicationStageInput } from "@jobos/validation";
import { requireCurrentUserId } from "../common/current-user.js";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class ApplicationsRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async list() {
    const userId = requireCurrentUserId();
    return this.db
      .select({
        id: applications.id,
        stage: applications.stage,
        appliedAt: applications.appliedAt,
        outcome: applications.outcome,
        jobId: jobs.id,
        jobTitle: jobs.title,
        companyName: companies.name,
        resumeVersionId: applications.resumeVersionId,
        createdAt: applications.createdAt
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .where(eq(applications.userId, userId))
      .orderBy(asc(applications.createdAt));
  }

  async findById(id: string) {
    const userId = requireCurrentUserId();
    const [application] = await this.db
      .select({
        id: applications.id,
        stage: applications.stage,
        appliedAt: applications.appliedAt,
        outcome: applications.outcome,
        jobId: jobs.id,
        jobTitle: jobs.title,
        jobDescription: jobs.description,
        jobLocation: jobs.location,
        companyName: companies.name,
        resumeVersionId: applications.resumeVersionId,
        createdAt: applications.createdAt
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .limit(1);

    if (!application) {
      return null;
    }

    const events = await this.db
      .select({
        id: applicationEvents.id,
        kind: applicationEvents.kind,
        payload: applicationEvents.payload,
        createdAt: applicationEvents.createdAt
      })
      .from(applicationEvents)
      .where(eq(applicationEvents.applicationId, id))
      .orderBy(asc(applicationEvents.createdAt));

    const analyses = application.resumeVersionId
      ? await this.db
          .select({
            id: atsAnalyses.id,
            scores: atsAnalyses.scores,
            findings: atsAnalyses.findings,
            createdAt: atsAnalyses.createdAt
          })
          .from(atsAnalyses)
          .where(eq(atsAnalyses.resumeVersionId, application.resumeVersionId))
          .orderBy(asc(atsAnalyses.createdAt))
      : [];

    const linkedContacts = await this.db
      .select({
        id: contacts.id,
        companyId: contacts.companyId,
        companyName: companies.name,
        name: contacts.name,
        title: contacts.title,
        email: contacts.email,
        linkedinUrl: contacts.linkedinUrl,
        notes: contacts.notes,
        followUpAt: contacts.followUpAt,
        relationship: applicationContacts.relationship,
        linkNotes: applicationContacts.notes
      })
      .from(applicationContacts)
      .innerJoin(contacts, eq(applicationContacts.contactId, contacts.id))
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .where(eq(applicationContacts.applicationId, id))
      .orderBy(asc(contacts.name));

    return { ...application, events, analyses, contacts: linkedContacts };
  }

  async create(input: CreateApplicationInput) {
    const userId = requireCurrentUserId();
    const [application] = await this.db
      .insert(applications)
      .values({
        userId,
        jobId: input.jobId,
        resumeVersionId: input.resumeVersionId,
        stage: input.stage ?? "saved"
      })
      .returning();

    await this.db.insert(applicationEvents).values({
      applicationId: application.id,
      kind: "created",
      payload: { jobId: input.jobId, resumeVersionId: input.resumeVersionId ?? null }
    });

    return application;
  }

  async updateStage(id: string, input: UpdateApplicationStageInput) {
    const userId = requireCurrentUserId();
    const [before] = await this.db.select({ stage: applications.stage }).from(applications).where(and(eq(applications.id, id), eq(applications.userId, userId))).limit(1);

    if (!before) {
      return null;
    }

    const [application] = await this.db
      .update(applications)
      .set({ stage: input.stage, updatedAt: new Date() })
      .where(and(eq(applications.id, id), eq(applications.userId, userId)))
      .returning();

    await this.db.insert(applicationEvents).values({
      applicationId: id,
      kind: "stage_changed",
      payload: { from: before.stage, to: input.stage }
    });

    return application;
  }}
