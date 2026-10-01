import { Injectable } from "@nestjs/common";
import { accountDeletionSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { AccountRepository } from "./account.repository.js";

@Injectable()
export class AccountService {
  constructor(private readonly account: AccountRepository) {}

  exportBundle() {
    return this.account.exportBundle();
  }

  delete(body: unknown) {
    return this.account.deletionPreview(parseBody(accountDeletionSchema, body));
  }
}
