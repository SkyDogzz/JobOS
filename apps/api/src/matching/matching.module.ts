import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { MatchingController } from "./matching.controller.js";
import { MatchingRepository } from "./matching.repository.js";
import { MatchingService } from "./matching.service.js";

@Module({ imports: [DatabaseModule], controllers: [MatchingController], providers: [MatchingRepository, MatchingService], exports: [MatchingService] })
export class MatchingModule {}
