import { Body, Controller, Get, Post } from "@nestjs/common";
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
}

