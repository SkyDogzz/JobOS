import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { CompaniesController } from "./companies.controller.js";
import { CompaniesRepository } from "./companies.repository.js";
import { CompaniesService } from "./companies.service.js";

@Module({ imports: [DatabaseModule], controllers: [CompaniesController], providers: [CompaniesRepository, CompaniesService] })
export class CompaniesModule {}
