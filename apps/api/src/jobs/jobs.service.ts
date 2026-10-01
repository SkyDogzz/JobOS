import { Injectable, NotFoundException } from "@nestjs/common";
import { createJobSchema, dedupeJobSchema, jobSearchSchema, mergeJobSchema, saveJobFilterSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { JobsRepository } from "./jobs.repository.js";

@Injectable()
export class JobsService {
  constructor(private readonly jobs: JobsRepository) {}

  list(query: unknown) {
    return this.jobs.list(jobSearchSchema.parse(query));
  }

  async findById(id: string) {
    const job = await this.jobs.findById(id);
    if (!job) throw new NotFoundException("Job not found.");
    return job;
  }

  create(body: unknown) {
    return this.jobs.create(parseBody(createJobSchema, body));
  }

  dedupe(body: unknown) {
    return this.jobs.findDuplicates(parseBody(dedupeJobSchema, body));
  }

  async merge(id: string, body: unknown) {
    const input = parseBody(mergeJobSchema, body);
    const job = await this.jobs.merge(id, input.incoming, input.strategy);
    if (!job) throw new NotFoundException("Job not found.");
    return job;
  }

  filters() {
    return this.jobs.listFilters();
  }

  saveFilter(body: unknown) {
    return this.jobs.saveFilter(parseBody(saveJobFilterSchema, body));
  }
}
