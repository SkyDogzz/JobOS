import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { TeamsController } from "./teams.controller.js";
import { TeamsRepository } from "./teams.repository.js";
import { TeamsService } from "./teams.service.js";

@Module({
  imports: [DatabaseModule],
  controllers: [TeamsController],
  providers: [TeamsRepository, TeamsService],
  exports: [TeamsService]
})
export class TeamsModule {}
