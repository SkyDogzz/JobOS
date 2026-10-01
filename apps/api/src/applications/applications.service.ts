import { Injectable, NotFoundException } from "@nestjs/common";
import { createApplicationSchema, updateApplicationStageSchema } from "@jobos/validation";
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

  async findById(id: string) {
    const application = await this.applications.findById(id);

    if (!application) {
      throw new NotFoundException("Application not found.");
    }

    return application;
  }

  async updateStage(id: string, body: unknown) {
    const application = await this.applications.updateStage(id, parseBody(updateApplicationStageSchema, body));

    if (!application) {
      throw new NotFoundException("Application not found.");
    }

    return application;
  }
}
