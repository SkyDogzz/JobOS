import { Module } from "@nestjs/common";
import { BillingModule } from "../billing/billing.module.js";
import { DatabaseModule } from "../database/database.module.js";
import { JobSourcesController } from "./job-sources.controller.js";
import { JobSourcesRepository } from "./job-sources.repository.js";
import { JobSourcesService } from "./job-sources.service.js";

@Module({ imports: [DatabaseModule, BillingModule], controllers: [JobSourcesController], providers: [JobSourcesRepository, JobSourcesService] })
export class JobSourcesModule {}
