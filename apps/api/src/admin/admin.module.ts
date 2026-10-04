import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { AdminController } from "./admin.controller.js";
import { AdminRepository } from "./admin.repository.js";
import { AdminService } from "./admin.service.js";

@Module({
  imports: [DatabaseModule],
  controllers: [AdminController],
  providers: [AdminRepository, AdminService]
})
export class AdminModule {}
