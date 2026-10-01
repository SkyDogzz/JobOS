import { Injectable, NotFoundException } from "@nestjs/common";
import { parseJobPosting } from "@jobos/job-sources";
import { parseJobPostingSchema, upsertJobSourceSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { JobSourcesRepository } from "./job-sources.repository.js";

@Injectable()
export class JobSourcesService {
  constructor(private readonly sources: JobSourcesRepository) {}

  list() {
    return this.sources.list();
  }

  create(body: unknown) {
    return this.sources.create(parseBody(upsertJobSourceSchema, body));
  }

  async update(id: string, body: unknown) {
    const source = await this.sources.update(id, parseBody(upsertJobSourceSchema, body));
    if (!source) throw new NotFoundException("Job source not found.");
    return source;
  }

  parse(body: unknown) {
    return parseJobPosting(parseBody(parseJobPostingSchema, body));
  }
}
