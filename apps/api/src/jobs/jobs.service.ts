import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { parseJobPosting } from "@jobos/job-sources";
import {
  createJobSchema,
  dedupeJobSchema,
  extensionJobImportPreviewSchema,
  extensionJobImportSchema,
  jobSearchSchema,
  mergeJobSchema,
  saveJobFilterSchema
} from "@jobos/validation";
import type { CreateJobInput, ExtensionJobImportInput } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { runWithCurrentUser } from "../common/current-user.js";
import { JobsRepository } from "./jobs.repository.js";
import { TeamsService } from "../teams/teams.service.js";
import { BillingService } from "../billing/billing.service.js";

@Injectable()
export class JobsService {
  constructor(private readonly jobs: JobsRepository, private readonly teams: TeamsService, private readonly billing: BillingService) {}

  list(query: unknown) {
    return this.jobs.list(jobSearchSchema.parse(query));
  }

  async findById(id: string) {
    const job = await this.jobs.findById(id);
    if (!job) throw new NotFoundException("Job not found.");
    return job;
  }

  async create(body: unknown) {
    const parsed = parseBody(createJobSchema, body);
    const workspaceId = body && typeof body === "object" && typeof (body as Record<string, unknown>).workspaceId === "string" ? (body as Record<string, string>).workspaceId : null;
    if (workspaceId) await this.teams.assertPermission(workspaceId, "edit");
    await this.billing.assertUsageAvailable("savedJobs", 1, { source: "manual_job_create" });
    const job = await this.jobs.create({ ...parsed, workspaceId });
    await this.billing.consumeUsage("savedJobs", 1, { source: "manual_job_create", jobId: job.id });
    return job;
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

  async importFromExtension(authorization: string | undefined, body: unknown) {
    if (!isAuthorizedExtension(authorization)) throw new UnauthorizedException("Invalid extension import token.");
    const input = parseBody(extensionJobImportSchema, body);
    const userId = await this.jobs.ensureExtensionUser();
    return runWithCurrentUser(userId, async () => {
      const incoming = toIncomingJob(input);
      const duplicates = await this.jobs.findDuplicates(incoming);
      const exact = duplicates.find((job) => job.sourceUrl === input.pageUrl);
      if (exact) {
        const job = await this.jobs.merge(exact.id, incoming, "update_existing");
        return { contractVersion: "0.4.4", status: "updated", job, parsed: incoming, duplicates, duplicateCount: duplicates.length };
      }
      await this.billing.assertUsageAvailable("savedJobs", 1, { source: "extension_import", pageUrl: input.pageUrl });
      const job = await this.jobs.create(incoming);
      await this.billing.consumeUsage("savedJobs", 1, { source: "extension_import", jobId: job.id, pageUrl: input.pageUrl });
      return { contractVersion: "0.4.4", status: "created", job, parsed: incoming, duplicates, duplicateCount: duplicates.length };
    });
  }

  async previewExtensionImport(authorization: string | undefined, body: unknown) {
    if (!isAuthorizedExtension(authorization)) throw new UnauthorizedException("Invalid extension import token.");
    const input = parseBody(extensionJobImportPreviewSchema, body);
    const userId = await this.jobs.ensureExtensionUser();
    return runWithCurrentUser(userId, async () => {
      const incoming = toIncomingJob(input);
      const duplicates = await this.jobs.findDuplicates(incoming);
      const exact = duplicates.find((job) => job.sourceUrl === input.pageUrl);
      return {
        contractVersion: "0.4.4",
        status: exact ? "duplicate" : "ready",
        parsed: incoming,
        duplicates,
        duplicateCount: duplicates.length
      };
    });
  }

  filters() {
    return this.jobs.listFilters();
  }

  saveFilter(body: unknown) {
    return this.jobs.saveFilter(parseBody(saveJobFilterSchema, body));
  }
}

function toIncomingJob(input: ExtensionJobImportInput): CreateJobInput {
  const parsed = parseJobPosting({ url: input.pageUrl, html: input.html, text: input.text ?? input.description });
  return {
    title: input.title ?? parsed.title,
    companyName: input.companyName ?? parsed.companyName,
    location: input.location ?? parsed.location,
    description: input.description ?? parsed.description,
    sourceUrl: input.pageUrl,
    sourceName: input.sourceName,
    remotePolicy: input.remotePolicy ?? parsed.remotePolicy,
    salaryText: input.salaryText ?? parsed.salaryText
  };
}

function isAuthorizedExtension(authorization: string | undefined) {
  const token = process.env.EXTENSION_IMPORT_TOKEN ?? (process.env.NODE_ENV === "production" ? undefined : "jobos-dev-extension-token");
  if (!token || !authorization?.startsWith("Bearer ")) return false;
  return authorization.slice("Bearer ".length) === token;
}
