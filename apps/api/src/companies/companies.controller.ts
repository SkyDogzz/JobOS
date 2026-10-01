import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { CompaniesService } from "./companies.service.js";

@Controller("companies")
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  list() {
    return this.companies.list();
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.companies.findById(id);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.companies.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.companies.update(id, body);
  }
}

