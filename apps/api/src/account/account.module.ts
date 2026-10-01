import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { AccountController } from "./account.controller.js";
import { AccountRepository } from "./account.repository.js";
import { AccountService } from "./account.service.js";

@Module({
  imports: [DatabaseModule],
  controllers: [AccountController],
  providers: [AccountRepository, AccountService]
})
export class AccountModule {}
