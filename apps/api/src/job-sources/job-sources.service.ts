import { Injectable, NotFoundException } from "@nestjs/common";
import { parseJobPosting } from "@jobos/job-sources";
import { discoveredJobActionSchema, parseJobPostingSchema, runJobSourceCheckSchema, upsertJobSourceSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { BillingService } from "../billing/billing.service.js";
import { JobSourcesRepository } from "./job-sources.repository.js";

@Injectable()
export class JobSourcesService {
  constructor(private readonly sources: JobSourcesRepository, private readonly billing: BillingService) {}

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

  discovered() {
    return this.sources.discovered();
  }

  async runChecks(body: unknown) {
    const input = parseBody(runJobSourceCheckSchema, body);
    if (input.fixtures?.length) await this.billing.assertUsageAvailable("discoveredJobImports", input.fixtures.length, { source: "job_source_check", sourceId: input.sourceId });
    const result = await this.sources.runChecks(input);
    if (result.imported > 0) await this.billing.consumeUsage("discoveredJobImports", result.imported, { checkedSources: result.checkedSources });
    return result;
  }

  async approveDiscovered(id: string) {
    const job = await this.sources.approveDiscovered(id);
    if (!job) throw new NotFoundException("Discovered job not found.");
    return job;
  }

  async dismissDiscovered(id: string) {
    const job = await this.sources.dismissDiscovered(id);
    if (!job) throw new NotFoundException("Discovered job not found.");
    return job;
  }

  async snoozeDiscovered(id: string, body: unknown) {
    const job = await this.sources.snoozeDiscovered(id, parseBody(discoveredJobActionSchema, body));
    if (!job) throw new NotFoundException("Discovered job not found.");
    return job;
  }
}
