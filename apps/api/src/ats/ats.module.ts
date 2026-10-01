import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { AtsController } from "./ats.controller.js";
import { AtsRepository } from "./ats.repository.js";
import { AtsService } from "./ats.service.js";

@Module({ imports: [DatabaseModule], controllers: [AtsController], providers: [AtsRepository, AtsService] })
export class AtsModule {}
