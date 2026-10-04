import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { TeamsModule } from "../teams/teams.module.js";
import { BillingModule } from "../billing/billing.module.js";
import { JobsController } from "./jobs.controller.js";
import { JobsRepository } from "./jobs.repository.js";
import { JobsService } from "./jobs.service.js";

@Module({ imports: [DatabaseModule, TeamsModule, BillingModule], controllers: [JobsController], providers: [JobsRepository, JobsService] })
export class JobsModule {}
