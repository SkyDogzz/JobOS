import { Injectable, NotFoundException } from "@nestjs/common";
import { createApplicationSchema, createOfferSchema, updateApplicationStageSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { ApplicationsRepository } from "./applications.repository.js";
import { BillingService } from "../billing/billing.service.js";

@Injectable()
export class ApplicationsService {
  constructor(private readonly applications: ApplicationsRepository, private readonly billing: BillingService) {}

  list() {
    return this.applications.list();
  }

  async create(body: unknown) {
    await this.billing.assertUsageAvailable("applications", 1, { source: "application_create" });
    const application = await this.applications.create(parseBody(createApplicationSchema, body));
    await this.billing.consumeUsage("applications", 1, { source: "application_create", applicationId: application.id });
    return application;
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

  listOffers(id: string) {
    return this.applications.listOffers(id);
  }

  async createOffer(id: string, body: unknown) {
    const offer = await this.applications.createOffer(id, parseBody(createOfferSchema, body));
    if (!offer) throw new NotFoundException("Application not found.");
    return offer;
  }
}
