import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { AnalyticsController } from "./analytics.controller.js";
import { AnalyticsRepository } from "./analytics.repository.js";
import { AnalyticsService } from "./analytics.service.js";

@Module({ imports: [DatabaseModule], controllers: [AnalyticsController], providers: [AnalyticsRepository, AnalyticsService] })
export class AnalyticsModule {}
