import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { SharingController } from "./sharing.controller.js";
import { SharingRepository } from "./sharing.repository.js";
import { SharingService } from "./sharing.service.js";

@Module({ imports: [DatabaseModule], controllers: [SharingController], providers: [SharingRepository, SharingService] })
export class SharingModule {}
