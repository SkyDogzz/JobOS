import { Inject, Injectable } from "@nestjs/common";
import { and, asc, desc, eq } from "drizzle-orm";
import { applicationContacts, applicationEvents, applications, atsAnalyses, companies, contacts, jobs, offers, tasks, userSettings } from "@jobos/database";
import type { CreateApplicationInput, CreateOfferInput, UpdateApplicationStageInput } from "@jobos/validation";
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

    const applicationOffers = await this.listOffers(id);

    return { ...application, events, analyses, contacts: linkedContacts, offers: applicationOffers };
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
  }

  async listOffers(applicationId: string) {
    const userId = requireCurrentUserId();
    return this.db
      .select()
      .from(offers)
      .where(and(eq(offers.applicationId, applicationId), eq(offers.userId, userId)))
      .orderBy(desc(offers.decisionScore), asc(offers.deadlineAt));
  }

  async createOffer(applicationId: string, input: CreateOfferInput) {
    const userId = requireCurrentUserId();
    const [application] = await this.db.select({ id: applications.id }).from(applications).where(and(eq(applications.id, applicationId), eq(applications.userId, userId))).limit(1);
    if (!application) return null;

    const [settings] = await this.db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
    const comparison = compareOffer(input, settings?.minimumSalary ?? null);
    const [offer] = await this.db.insert(offers).values({
      applicationId,
      userId,
      baseCompensation: input.baseCompensation,
      currency: input.currency,
      equity: input.equity,
      benefits: input.benefits,
      deadlineAt: input.deadlineAt ? new Date(input.deadlineAt) : undefined,
      negotiationNotes: input.negotiationNotes,
      decisionScore: comparison.score,
      comparison
    }).returning();

    if (input.deadlineAt) {
      await this.db.insert(tasks).values({
        applicationId,
        userId,
        title: `Review ${input.currency} ${input.baseCompensation.toLocaleString()} offer deadline`,
        dueAt: new Date(input.deadlineAt)
      });
    }
    if (input.negotiationNotes) {
      const dueAt = new Date();
      dueAt.setUTCDate(dueAt.getUTCDate() + 2);
      await this.db.insert(tasks).values({ applicationId, userId, title: "Prepare offer negotiation follow-up", dueAt });
    }

    await this.db.insert(applicationEvents).values({
      applicationId,
      kind: "updated",
      payload: { offerId: offer.id, action: "offer_created", decisionScore: comparison.score }
    });
    return offer;
  }}

function compareOffer(input: CreateOfferInput, minimumSalary: string | null) {
  const minimum = parseMoney(minimumSalary);
  const market = input.marketBaseline ?? minimum ?? input.baseCompensation;
  const compensationRatio = market ? input.baseCompensation / market : 1;
  const benefitsBonus = input.benefits ? 10 : 0;
  const equityBonus = input.equity ? 8 : 0;
  const deadlinePenalty = input.deadlineAt && new Date(input.deadlineAt).getTime() - Date.now() < 3 * 86400000 ? 8 : 0;
  const score = Math.max(0, Math.min(100, Math.round(compensationRatio * 70 + benefitsBonus + equityBonus - deadlinePenalty)));
  return {
    score,
    marketBaseline: market,
    minimumSalary: minimum,
    compensationDelta: input.baseCompensation - market,
    notes: score >= 80 ? "Strong offer against current assumptions." : "Review compensation, benefits, and negotiation leverage."
  };
}

function parseMoney(value: string | null) {
  if (!value) return null;
  const match = value.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const amount = Number(match[1]);
  return /k\b/i.test(value) ? Math.round(amount * 1000) : Math.round(amount);
}
