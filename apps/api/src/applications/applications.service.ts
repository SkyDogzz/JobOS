import { Injectable } from "@nestjs/common";
import { createApplicationSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { ApplicationsRepository } from "./applications.repository.js";

@Injectable()
export class ApplicationsService {
  constructor(private readonly applications: ApplicationsRepository) {}

  list() {
    return this.applications.list();
  }

  create(body: unknown) {
    return this.applications.create(parseBody(createApplicationSchema, body));
  }
}
