import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { AiController } from "./ai.controller.js";
import { AiRepository } from "./ai.repository.js";
import { AiService } from "./ai.service.js";

@Module({ imports: [DatabaseModule], controllers: [AiController], providers: [AiRepository, AiService] })
export class AiModule {}
