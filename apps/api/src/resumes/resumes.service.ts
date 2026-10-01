import { Injectable, NotFoundException } from "@nestjs/common";
import { createResumeSchema, createResumeVersionSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { ResumesRepository } from "./resumes.repository.js";

@Injectable()
export class ResumesService {
  constructor(private readonly resumes: ResumesRepository) {}

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

  create(body: unknown) {
    return this.resumes.create(parseBody(createResumeSchema, body));
  }

  async createVersion(id: string, body: unknown) {
    const version = await this.resumes.createVersion(id, parseBody(createResumeVersionSchema, body));
    if (!version) {
      throw new NotFoundException("Resume not found.");
    }

    return version;
  }
}
