import { Injectable } from "@nestjs/common";
import { createJobSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { JobsRepository } from "./jobs.repository.js";

@Injectable()
export class JobsService {
  constructor(private readonly jobs: JobsRepository) {}

  list() {
    return this.jobs.list();
  }

  create(body: unknown) {
    return this.jobs.create(parseBody(createJobSchema, body));
  }
}
