import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { InterviewsController } from "./interviews.controller.js";
import { InterviewsRepository } from "./interviews.repository.js";
import { InterviewsService } from "./interviews.service.js";

@Module({ imports: [DatabaseModule], controllers: [InterviewsController], providers: [InterviewsRepository, InterviewsService] })
export class InterviewsModule {}
