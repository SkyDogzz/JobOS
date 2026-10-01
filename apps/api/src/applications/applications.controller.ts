import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApplicationsService } from "./applications.service.js";

@Controller("applications")
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Get()
  list() {
    return this.applications.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.applications.create(body);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.applications.findById(id);
  }
}
