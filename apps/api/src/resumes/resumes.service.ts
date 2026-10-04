import { Injectable, NotFoundException } from "@nestjs/common";
import { parseResumeText } from "@jobos/document-parser";
import { createResumeSchema, createResumeVersionFromParseSchema, createResumeVersionSchema, parseResumeSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { ResumesRepository } from "./resumes.repository.js";
import { BillingService } from "../billing/billing.service.js";

@Injectable()
export class ResumesService {
  constructor(private readonly resumes: ResumesRepository, private readonly billing: BillingService) {}

  list() {
    return this.resumes.list();
  }

  async findById(id: string) {
    const resume = await this.resumes.findById(id);
    if (!resume) {
      throw new NotFoundException("Resume not found.");
    }

    return resume;
  }

  async create(body: unknown) {
    await this.billing.assertUsageAvailable("resumes", 1, { source: "resume_create" });
    const resume = await this.resumes.create(parseBody(createResumeSchema, body));
    await this.billing.consumeUsage("resumes", 1, { source: "resume_create", resumeId: resume.id });
    return resume;
  }

  async createVersion(id: string, body: unknown) {
    const version = await this.resumes.createVersion(id, parseBody(createResumeVersionSchema, body));
    if (!version) {
      throw new NotFoundException("Resume not found.");
    }

    return version;
  }

  parse(body: unknown) {
    const input = parseBody(parseResumeSchema, body);
    return parseResumeText(input.text);
  }

  async createVersionFromParsed(id: string, body: unknown) {
    const version = await this.resumes.createVersionFromParsed(id, parseBody(createResumeVersionFromParseSchema, body));
    if (!version) {
      throw new NotFoundException("Resume not found.");
    }

    return version;
  }
}
