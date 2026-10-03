import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { StrategyController } from "./strategy.controller.js";
import { StrategyRepository } from "./strategy.repository.js";
import { StrategyService } from "./strategy.service.js";

@Module({ imports: [DatabaseModule], controllers: [StrategyController], providers: [StrategyRepository, StrategyService] })
export class StrategyModule {}
