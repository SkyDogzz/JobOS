import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { BillingController } from "./billing.controller.js";
import { BillingRepository } from "./billing.repository.js";
import { BillingService } from "./billing.service.js";

@Module({
  imports: [DatabaseModule],
  controllers: [BillingController],
  providers: [BillingRepository, BillingService],
  exports: [BillingService]
})
export class BillingModule {}
