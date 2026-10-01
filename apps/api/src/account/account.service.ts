import { Injectable } from "@nestjs/common";
import { AccountRepository } from "./account.repository.js";

@Injectable()
export class AccountService {
  constructor(private readonly account: AccountRepository) {}

  exportBundle() {
    return this.account.exportBundle();
  }
}
