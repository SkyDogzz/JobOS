import { Module } from "@nestjs/common";
import { BillingModule } from "../billing/billing.module.js";
import { DatabaseModule } from "../database/database.module.js";
import { DocumentsController } from "./documents.controller.js";
import { DocumentsRepository } from "./documents.repository.js";
import { DocumentsService } from "./documents.service.js";

@Module({ imports: [DatabaseModule, BillingModule], controllers: [DocumentsController], providers: [DocumentsRepository, DocumentsService] })
export class DocumentsModule {}
