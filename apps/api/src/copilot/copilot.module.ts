import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { BillingModule } from "../billing/billing.module.js";
import { CopilotController } from "./copilot.controller.js";
import { CopilotRepository } from "./copilot.repository.js";
import { CopilotService } from "./copilot.service.js";

@Module({
  imports: [DatabaseModule, BillingModule],
  controllers: [CopilotController],
  providers: [CopilotRepository, CopilotService]
})
export class CopilotModule {}
