import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, ne, notInArray } from "drizzle-orm";
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
  SyncEmailConnectionInput,
  SyncCalendarConnectionInput,
  UpdateEmailConnectionInput
} from "@jobos/validation";
import { requireCurrentUserId } from "../common/current-user.js";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";
import { OperationsRepository } from "../operations/operations.repository.js";

@Injectable()
export class IntegrationsRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase, private readonly operations: OperationsRepository) {}

  listEmailConnections() {
    const userId = requireCurrentUserId();
    return this.db
      .select()
      .from(emailIntegrationConnections)
      .where(eq(emailIntegrationConnections.userId, userId))
      .orderBy(desc(emailIntegrationConnections.createdAt));
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
        excludeBodies: input.excludeBodies,
        syncState: input.syncState
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
      .where(eq(emailIntegrationConnections.userId, requireCurrentUserId()))
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
    return this.db
      .select()
      .from(emailMessages)
      .innerJoin(emailIntegrationConnections, eq(emailMessages.connectionId, emailIntegrationConnections.id))
      .where(eq(emailIntegrationConnections.userId, requireCurrentUserId()))
      .orderBy(desc(emailMessages.receivedAt), desc(emailMessages.createdAt))
      .then((rows) => rows.map((row) => row.email_messages));
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

  async syncEmailConnection(connectionId: string, input: SyncEmailConnectionInput) {
    const userId = requireCurrentUserId();
    const now = new Date();
    const [connection] = await this.db
      .select()
      .from(emailIntegrationConnections)
      .where(and(eq(emailIntegrationConnections.id, connectionId), eq(emailIntegrationConnections.userId, userId)))
      .limit(1);
    if (!connection) return null;

    const [job] = await this.db
      .insert(emailSyncJobs)
      .values({ connectionId, cursor: input.cursor, status: "running", startedAt: now })
      .returning();
    const providerMessages = readProviderMessages(connection.syncState);

    for (const message of providerMessages) {
      await this.createEmailMessage({
        connectionId,
        applicationId: message.applicationId ?? inferApplicationId(message),
        providerMessageId: message.providerMessageId,
        threadId: message.threadId,
        fromAddress: message.fromAddress,
        toAddresses: message.toAddresses ?? [],
        subject: message.subject,
        snippet: message.snippet,
        body: message.body,
        receivedAt: message.receivedAt
      });
    }

    const finishedAt = new Date();
    const [updatedJob] = await this.db
      .update(emailSyncJobs)
      .set({ status: "completed", finishedAt, cursor: input.cursor ?? `synced:${finishedAt.toISOString()}` })
      .where(eq(emailSyncJobs.id, job.id))
      .returning();
    await this.db
      .update(emailIntegrationConnections)
      .set({
        status: "connected",
        lastSyncedAt: finishedAt,
        syncState: { ...connection.syncState, lastCursor: updatedJob.cursor, lastSyncedMessageCount: providerMessages.length },
        updatedAt: finishedAt
      })
      .where(eq(emailIntegrationConnections.id, connectionId));
    await this.operations.recordBackgroundJob({
      queueName: "email-sync",
      jobName: "sync-email-connection",
      idempotencyKey: `email-sync:${connectionId}:${input.cursor ?? "latest"}`,
      status: "completed",
      payload: { connectionId, cursor: updatedJob.cursor, messageCount: providerMessages.length }
    });
    return updatedJob;
  }

  listCalendarConnections() {
    const userId = requireCurrentUserId();
    return this.db
      .select()
      .from(calendarIntegrationConnections)
      .where(eq(calendarIntegrationConnections.userId, userId))
      .orderBy(desc(calendarIntegrationConnections.createdAt));
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
        status: input.status,
        syncState: input.syncState
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
      .where(eq(calendarIntegrationConnections.userId, requireCurrentUserId()))
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
    return this.db
      .select()
      .from(calendarEvents)
      .innerJoin(calendarIntegrationConnections, eq(calendarEvents.connectionId, calendarIntegrationConnections.id))
      .where(eq(calendarIntegrationConnections.userId, requireCurrentUserId()))
      .orderBy(desc(calendarEvents.startsAt), desc(calendarEvents.createdAt))
      .then((rows) => rows.map((row) => row.calendar_events));
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
  }

  async syncCalendarConnection(connectionId: string, input: SyncCalendarConnectionInput) {
    const userId = requireCurrentUserId();
    const now = new Date();
    const [connection] = await this.db
      .select()
      .from(calendarIntegrationConnections)
      .where(and(eq(calendarIntegrationConnections.id, connectionId), eq(calendarIntegrationConnections.userId, userId)))
      .limit(1);
    if (!connection) return null;

    const [job] = await this.db
      .insert(calendarSyncJobs)
      .values({ connectionId, cursor: input.cursor, status: "running", startedAt: now })
      .returning();
    const providerEvents = readProviderEvents(connection.syncState);
    const syncedProviderIds: string[] = [];

    for (const event of providerEvents) {
      syncedProviderIds.push(event.providerEventId);
      await this.createCalendarEvent({
        connectionId,
        interviewId: event.interviewId,
        taskId: event.taskId,
        providerEventId: event.providerEventId,
        title: event.title,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        location: event.location,
        status: event.status ?? "confirmed",
        conflictStatus: event.conflictStatus ?? inferCalendarConflict(event),
        metadata: { providerSync: true, ...event.metadata }
      });
    }

    if (syncedProviderIds.length > 0) {
      await this.db
        .update(calendarEvents)
        .set({ status: "cancelled", conflictStatus: "stale", updatedAt: now })
        .where(and(
          eq(calendarEvents.connectionId, connectionId),
          notInArray(calendarEvents.providerEventId, syncedProviderIds),
          ne(calendarEvents.status, "cancelled")
        ));
    }

    const finishedAt = new Date();
    const [updatedJob] = await this.db
      .update(calendarSyncJobs)
      .set({ status: "completed", finishedAt, cursor: input.cursor ?? `synced:${finishedAt.toISOString()}` })
      .where(eq(calendarSyncJobs.id, job.id))
      .returning();
    await this.db
      .update(calendarIntegrationConnections)
      .set({
        status: "connected",
        lastSyncedAt: finishedAt,
        syncState: { ...connection.syncState, lastCursor: updatedJob.cursor, lastSyncedEventCount: providerEvents.length },
        updatedAt: finishedAt
      })
      .where(eq(calendarIntegrationConnections.id, connectionId));
    await this.operations.recordBackgroundJob({
      queueName: "calendar-sync",
      jobName: "sync-calendar-connection",
      idempotencyKey: `calendar-sync:${connectionId}:${input.cursor ?? "latest"}`,
      status: "completed",
      payload: { connectionId, cursor: updatedJob.cursor, eventCount: providerEvents.length }
    });
    return updatedJob;
  }
}

function classifyFromMetadata(input: CreateEmailMessageInput) {
  const haystack = `${input.subject ?? ""} ${input.snippet ?? ""}`.toLowerCase();
  if (haystack.includes("interview")) return "interview";
  if (haystack.includes("offer")) return "offer";
  if (haystack.includes("unfortunately") || haystack.includes("not moving forward")) return "rejection";
  if (input.applicationId) return "application_related";
  if (input.fromAddress?.includes("recruit")) return "recruiter";
  return "unclassified";
}

type ProviderEmailMessage = Omit<CreateEmailMessageInput, "connectionId"> & { metadata?: Record<string, unknown> };

function readProviderMessages(syncState: Record<string, unknown>) {
  const messages = Array.isArray(syncState.providerMessages) ? syncState.providerMessages : [];
  return messages
    .map((message) => message as Partial<ProviderEmailMessage>)
    .filter((message): message is ProviderEmailMessage => Boolean(message.providerMessageId));
}

function inferApplicationId(message: ProviderEmailMessage) {
  const value = message.metadata?.applicationId;
  return typeof value === "string" ? value : undefined;
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

type ProviderCalendarEvent = Omit<CreateCalendarEventInput, "connectionId">;

function readProviderEvents(syncState: Record<string, unknown>) {
  const events = Array.isArray(syncState.providerEvents) ? syncState.providerEvents : [];
  return events
    .map((event) => event as Partial<ProviderCalendarEvent>)
    .filter((event): event is ProviderCalendarEvent => Boolean(event.providerEventId && event.title && event.startsAt));
}

function inferCalendarConflict(event: ProviderCalendarEvent) {
  if (event.status === "cancelled") return "cancelled";
  if (event.conflictStatus) return event.conflictStatus;
  if (event.metadata?.conflict === true) return "conflict";
  return "clear";
}
