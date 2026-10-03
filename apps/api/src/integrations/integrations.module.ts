import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { BillingModule } from "../billing/billing.module.js";
import { OperationsModule } from "../operations/operations.module.js";
import { IntegrationsController } from "./integrations.controller.js";
import { IntegrationsRepository } from "./integrations.repository.js";
import { IntegrationsService } from "./integrations.service.js";

@Module({ imports: [DatabaseModule, OperationsModule, BillingModule], controllers: [IntegrationsController], providers: [IntegrationsRepository, IntegrationsService] })
export class IntegrationsModule {}
