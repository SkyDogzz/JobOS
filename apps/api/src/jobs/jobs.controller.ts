import { Body, Controller, Get, Post } from "@nestjs/common";
import { JobsService } from "./jobs.service.js";

@Controller("jobs")
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  list() {
    return this.jobs.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.jobs.create(body);
  }
}

