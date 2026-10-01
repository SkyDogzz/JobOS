import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { IntegrationsService } from "./integrations.service.js";

@Controller("integrations")
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get("email/connections")
  listEmailConnections() {
    return this.integrations.listEmailConnections();
  }

  @Post("email/connections")
  createEmailConnection(@Body() body: unknown) {
    return this.integrations.createEmailConnection(body);
  }

  @Patch("email/connections/:id")
  updateEmailConnection(@Param("id") id: string, @Body() body: unknown) {
    return this.integrations.updateEmailConnection(id, body);
  }

  @Post("email/sync-jobs")
  createEmailSyncJob(@Body() body: unknown) {
    return this.integrations.createEmailSyncJob(body);
  }

  @Get("email/sync-jobs")
  listEmailSyncJobs() {
    return this.integrations.listEmailSyncJobs();
  }

  @Post("email/messages")
  createEmailMessage(@Body() body: unknown) {
    return this.integrations.createEmailMessage(body);
  }

  @Get("email/messages")
  listEmailMessages() {
    return this.integrations.listEmailMessages();
  }

  @Patch("email/messages/:id/classification")
  classifyEmailMessage(@Param("id") id: string, @Body() body: unknown) {
    return this.integrations.classifyEmailMessage(id, body);
  }
}
