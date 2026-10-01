import { Injectable, NotFoundException } from "@nestjs/common";
import { createJobSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { JobsRepository } from "./jobs.repository.js";

@Injectable()
export class JobsService {
  constructor(private readonly jobs: JobsRepository) {}

  list() {
    return this.jobs.list();
  }

  async findById(id: string) {
    const job = await this.jobs.findById(id);
    if (!job) throw new NotFoundException("Job not found.");
    return job;
  }

  create(body: unknown) {
    return this.jobs.create(parseBody(createJobSchema, body));
  }
}
