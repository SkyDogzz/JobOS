import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { ResumesController } from "./resumes.controller.js";
import { ResumesRepository } from "./resumes.repository.js";
import { ResumesService } from "./resumes.service.js";

@Module({ imports: [DatabaseModule], controllers: [ResumesController], providers: [ResumesRepository, ResumesService] })
export class ResumesModule {}
