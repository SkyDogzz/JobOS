import { Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import {
  calendarEvents,
  calendarIntegrationConnections,
  calendarSyncJobs,
  emailIntegrationConnections,
  emailMessages,
  emailSyncJobs,
  users
} from "@jobos/database";
import type {
  ClassifyEmailMessageInput,
  CreateCalendarConnectionInput,
  CreateCalendarEventInput,
  CreateCalendarSyncJobInput,
  CreateEmailConnectionInput,
  CreateEmailMessageInput,
  CreateEmailSyncJobInput,
  UpdateEmailConnectionInput
} from "@jobos/validation";
import { requireCurrentUserId } from "../common/current-user.js";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class IntegrationsRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  listEmailConnections() {
    return this.db.select().from(emailIntegrationConnections).orderBy(desc(emailIntegrationConnections.createdAt));
  }

  async createEmailConnection(input: CreateEmailConnectionInput) {
    const userId = requireCurrentUserId();
    const [connection] = await this.db
      .insert(emailIntegrationConnections)
      .values({
        userId,
        provider: input.provider,
        accountEmail: input.accountEmail,
        status: input.status,
        excludeBodies: input.excludeBodies
      })
      .returning();
    return connection;
  }

  async updateEmailConnection(id: string, input: UpdateEmailConnectionInput) {
    const [connection] = await this.db
      .update(emailIntegrationConnections)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(emailIntegrationConnections.id, id))
      .returning();
    return connection ?? null;
  }

  listEmailSyncJobs() {
    return this.db
      .select({
        id: emailSyncJobs.id,
        connectionId: emailSyncJobs.connectionId,
        status: emailSyncJobs.status,
        cursor: emailSyncJobs.cursor,
        error: emailSyncJobs.error,
        startedAt: emailSyncJobs.startedAt,
        finishedAt: emailSyncJobs.finishedAt,
        provider: emailIntegrationConnections.provider,
        accountEmail: emailIntegrationConnections.accountEmail,
        createdAt: emailSyncJobs.createdAt
      })
      .from(emailSyncJobs)
      .innerJoin(emailIntegrationConnections, eq(emailSyncJobs.connectionId, emailIntegrationConnections.id))
      .orderBy(desc(emailSyncJobs.createdAt));
  }

  async createEmailSyncJob(input: CreateEmailSyncJobInput) {
    const [job] = await this.db
      .insert(emailSyncJobs)
      .values({
        connectionId: input.connectionId,
        cursor: input.cursor,
        status: "queued"
      })
      .returning();
    return job;
  }

  listEmailMessages() {
    return this.db.select().from(emailMessages).orderBy(desc(emailMessages.receivedAt), desc(emailMessages.createdAt));
  }

  async createEmailMessage(input: CreateEmailMessageInput) {
    const [connection] = await this.db
      .select({ excludeBodies: emailIntegrationConnections.excludeBodies })
      .from(emailIntegrationConnections)
      .where(eq(emailIntegrationConnections.id, input.connectionId))
      .limit(1);

    const [message] = await this.db
      .insert(emailMessages)
      .values({
        connectionId: input.connectionId,
        applicationId: input.applicationId,
        providerMessageId: input.providerMessageId,
        threadId: input.threadId,
        fromAddress: input.fromAddress,
        toAddresses: input.toAddresses,
        subject: input.subject,
        snippet: input.snippet,
        body: connection?.excludeBodies ? undefined : input.body,
        classification: classifyFromMetadata(input),
        classificationReason: "Initial deterministic metadata classification.",
        receivedAt: input.receivedAt ? new Date(input.receivedAt) : undefined
      })
      .onConflictDoUpdate({
        target: [emailMessages.connectionId, emailMessages.providerMessageId],
        set: {
          applicationId: input.applicationId,
          threadId: input.threadId,
          fromAddress: input.fromAddress,
          toAddresses: input.toAddresses,
          subject: input.subject,
          snippet: input.snippet,
          body: connection?.excludeBodies ? null : input.body,
          updatedAt: new Date()
        }
      })
      .returning();
    return message;
  }

  async classifyEmailMessage(id: string, input: ClassifyEmailMessageInput) {
    const [message] = await this.db
      .update(emailMessages)
      .set({
        classification: input.classification,
        classificationReason: input.classificationReason,
        applicationId: input.applicationId === undefined ? undefined : input.applicationId,
        updatedAt: new Date()
      })
      .where(eq(emailMessages.id, id))
      .returning();
    return message ?? null;
  }

  listCalendarConnections() {
    return this.db.select().from(calendarIntegrationConnections).orderBy(desc(calendarIntegrationConnections.createdAt));
  }

  async createCalendarConnection(input: CreateCalendarConnectionInput) {
    const userId = requireCurrentUserId();
    const [connection] = await this.db
      .insert(calendarIntegrationConnections)
      .values({
        userId,
        provider: input.provider,
        accountEmail: input.accountEmail,
        calendarName: input.calendarName,
        status: input.status
      })
      .returning();
    return connection;
  }

  listCalendarSyncJobs() {
    return this.db
      .select({
        id: calendarSyncJobs.id,
        connectionId: calendarSyncJobs.connectionId,
        status: calendarSyncJobs.status,
        cursor: calendarSyncJobs.cursor,
        error: calendarSyncJobs.error,
        startedAt: calendarSyncJobs.startedAt,
        finishedAt: calendarSyncJobs.finishedAt,
        provider: calendarIntegrationConnections.provider,
        accountEmail: calendarIntegrationConnections.accountEmail,
        createdAt: calendarSyncJobs.createdAt
      })
      .from(calendarSyncJobs)
      .innerJoin(calendarIntegrationConnections, eq(calendarSyncJobs.connectionId, calendarIntegrationConnections.id))
      .orderBy(desc(calendarSyncJobs.createdAt));
  }

  async createCalendarSyncJob(input: CreateCalendarSyncJobInput) {
    const [job] = await this.db
      .insert(calendarSyncJobs)
      .values({ connectionId: input.connectionId, cursor: input.cursor, status: "queued" })
      .returning();
    return job;
  }

  listCalendarEvents() {
    return this.db.select().from(calendarEvents).orderBy(desc(calendarEvents.startsAt), desc(calendarEvents.createdAt));
  }

  async createCalendarEvent(input: CreateCalendarEventInput) {
    const [event] = await this.db
      .insert(calendarEvents)
      .values(calendarEventValues(input))
      .onConflictDoUpdate({
        target: [calendarEvents.connectionId, calendarEvents.providerEventId],
        set: { ...calendarEventValues(input), updatedAt: new Date() }
      })
      .returning();
    return event;
  }}

function classifyFromMetadata(input: CreateEmailMessageInput) {
  const haystack = `${input.subject ?? ""} ${input.snippet ?? ""}`.toLowerCase();
  if (haystack.includes("interview")) return "interview";
  if (haystack.includes("offer")) return "offer";
  if (haystack.includes("unfortunately") || haystack.includes("not moving forward")) return "rejection";
  if (input.applicationId) return "application_related";
  if (input.fromAddress?.includes("recruit")) return "recruiter";
  return "unclassified";
}

function calendarEventValues(input: CreateCalendarEventInput) {
  return {
    connectionId: input.connectionId,
    interviewId: input.interviewId,
    taskId: input.taskId,
    providerEventId: input.providerEventId,
    title: input.title,
    startsAt: new Date(input.startsAt),
    endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
    location: input.location,
    status: input.status,
    conflictStatus: input.conflictStatus,
    metadata: input.metadata
  };
}
