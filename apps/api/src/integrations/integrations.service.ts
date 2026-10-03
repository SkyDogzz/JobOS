import { Injectable, NotFoundException } from "@nestjs/common";
import {
  classifyEmailMessageSchema,
  createCalendarConnectionSchema,
  createCalendarEventSchema,
  createCalendarSyncJobSchema,
  createEmailConnectionSchema,
  createEmailMessageSchema,
  createEmailSyncJobSchema,
  syncEmailConnectionSchema,
  syncCalendarConnectionSchema,
  updateEmailConnectionSchema
} from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { BillingService } from "../billing/billing.service.js";
import { IntegrationsRepository } from "./integrations.repository.js";

@Injectable()
export class IntegrationsService {
  constructor(private readonly integrations: IntegrationsRepository, private readonly billing: BillingService) {}

  listEmailConnections() {
    return this.integrations.listEmailConnections();
  }

  createEmailConnection(body: unknown) {
    return this.integrations.createEmailConnection(parseBody(createEmailConnectionSchema, body));
  }

  async updateEmailConnection(id: string, body: unknown) {
    const connection = await this.integrations.updateEmailConnection(id, parseBody(updateEmailConnectionSchema, body));
    if (!connection) throw new NotFoundException("Email connection not found.");
    return connection;
  }

  async createEmailSyncJob(body: unknown) {
    await this.billing.assertEntitlement("providerSync");
    await this.billing.consumeUsage("syncRuns", 1, { kind: "email" });
    const input = parseBody(createEmailSyncJobSchema, body);
    const job = await this.integrations.syncEmailConnection(input.connectionId, { cursor: input.cursor });
    if (!job) throw new NotFoundException("Email connection not found.");
    return job;
  }

  listEmailSyncJobs() {
    return this.integrations.listEmailSyncJobs();
  }

  createEmailMessage(body: unknown) {
    return this.integrations.createEmailMessage(parseBody(createEmailMessageSchema, body));
  }

  listEmailMessages() {
    return this.integrations.listEmailMessages();
  }

  async classifyEmailMessage(id: string, body: unknown) {
    const message = await this.integrations.classifyEmailMessage(id, parseBody(classifyEmailMessageSchema, body));
    if (!message) throw new NotFoundException("Email message not found.");
    return message;
  }

  async syncEmailConnection(id: string, body: unknown) {
    await this.billing.assertEntitlement("providerSync");
    await this.billing.consumeUsage("syncRuns", 1, { kind: "email", connectionId: id });
    const job = await this.integrations.syncEmailConnection(id, parseBody(syncEmailConnectionSchema, body));
    if (!job) throw new NotFoundException("Email connection not found.");
    return job;
  }

  listCalendarConnections() {
    return this.integrations.listCalendarConnections();
  }

  createCalendarConnection(body: unknown) {
    return this.integrations.createCalendarConnection(parseBody(createCalendarConnectionSchema, body));
  }

  async createCalendarSyncJob(body: unknown) {
    await this.billing.assertEntitlement("providerSync");
    await this.billing.consumeUsage("syncRuns", 1, { kind: "calendar" });
    const input = parseBody(createCalendarSyncJobSchema, body);
    const job = await this.integrations.syncCalendarConnection(input.connectionId, { cursor: input.cursor });
    if (!job) throw new NotFoundException("Calendar connection not found.");
    return job;
  }

  listCalendarSyncJobs() {
    return this.integrations.listCalendarSyncJobs();
  }

  createCalendarEvent(body: unknown) {
    return this.integrations.createCalendarEvent(parseBody(createCalendarEventSchema, body));
  }

  listCalendarEvents() {
    return this.integrations.listCalendarEvents();
  }

  async syncCalendarConnection(id: string, body: unknown) {
    await this.billing.assertEntitlement("providerSync");
    await this.billing.consumeUsage("syncRuns", 1, { kind: "calendar", connectionId: id });
    const job = await this.integrations.syncCalendarConnection(id, parseBody(syncCalendarConnectionSchema, body));
    if (!job) throw new NotFoundException("Calendar connection not found.");
    return job;
  }
}
