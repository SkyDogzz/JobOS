import { Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { emailIntegrationConnections, emailMessages, emailSyncJobs, users } from "@jobos/database";
import type {
  ClassifyEmailMessageInput,
  CreateEmailConnectionInput,
  CreateEmailMessageInput,
  CreateEmailSyncJobInput,
  UpdateEmailConnectionInput
} from "@jobos/validation";
import { devUser } from "../common/dev-user.js";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class IntegrationsRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  listEmailConnections() {
    return this.db.select().from(emailIntegrationConnections).orderBy(desc(emailIntegrationConnections.createdAt));
  }

  async createEmailConnection(input: CreateEmailConnectionInput) {
    const userId = await this.ensureDevUser();
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

  private async ensureDevUser() {
    await this.db.insert(users).values(devUser).onConflictDoNothing({ target: users.email });
    const [user] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, devUser.email)).limit(1);
    return user.id;
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
