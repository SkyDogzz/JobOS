import { Injectable, NotFoundException } from "@nestjs/common";
import { upsertCompanySchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { CompaniesRepository } from "./companies.repository.js";

@Injectable()
export class CompaniesService {
  constructor(private readonly companies: CompaniesRepository) {}

  list() {
    return this.companies.list();
  }

  async findById(id: string) {
    const company = await this.companies.findById(id);
    if (!company) throw new NotFoundException("Company not found.");
    return company;
  }

  create(body: unknown) {
    return this.companies.create(parseBody(upsertCompanySchema, body));
  }

  async update(id: string, body: unknown) {
    const company = await this.companies.update(id, parseBody(upsertCompanySchema, body));
    if (!company) throw new NotFoundException("Company not found.");
    return company;
  }
}

