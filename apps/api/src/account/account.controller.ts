import { Body, Controller, Delete, Get, Header } from "@nestjs/common";
import { AccountService } from "./account.service.js";

@Controller("account")
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get("export")
  @Header("Content-Disposition", "attachment; filename=\"jobos-export.json\"")
  exportBundle() {
    return this.account.exportBundle();
  }

  @Delete()
  delete(@Body() body: unknown) {
    return this.account.delete(body);
  }
}
