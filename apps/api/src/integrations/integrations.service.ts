import { Injectable, NotFoundException } from "@nestjs/common";
import {
  classifyEmailMessageSchema,
  createEmailConnectionSchema,
  createEmailMessageSchema,
  createEmailSyncJobSchema,
  updateEmailConnectionSchema
} from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { IntegrationsRepository } from "./integrations.repository.js";

@Injectable()
export class IntegrationsService {
  constructor(private readonly integrations: IntegrationsRepository) {}

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

  createEmailSyncJob(body: unknown) {
    return this.integrations.createEmailSyncJob(parseBody(createEmailSyncJobSchema, body));
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
}
