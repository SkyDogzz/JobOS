import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { BillingModule } from "../billing/billing.module.js";
import { ApplicationsController } from "./applications.controller.js";
import { ApplicationsRepository } from "./applications.repository.js";
import { ApplicationsService } from "./applications.service.js";

@Module({ imports: [DatabaseModule, BillingModule], controllers: [ApplicationsController], providers: [ApplicationsRepository, ApplicationsService] })
export class ApplicationsModule {}
