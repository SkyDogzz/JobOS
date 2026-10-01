import { Controller, Get, Header } from "@nestjs/common";
import { AccountService } from "./account.service.js";

@Controller("account")
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get("export")
  @Header("Content-Disposition", "attachment; filename=\"jobos-export.json\"")
  exportBundle() {
    return this.account.exportBundle();
  }
}
