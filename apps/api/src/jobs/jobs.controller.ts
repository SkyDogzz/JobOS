import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { JobsService } from "./jobs.service.js";

@Controller("jobs")
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  list() {
    return this.jobs.list();
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.jobs.findById(id);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.jobs.create(body);
  }
}
