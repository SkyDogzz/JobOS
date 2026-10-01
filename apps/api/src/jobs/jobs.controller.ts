import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { JobsService } from "./jobs.service.js";

@Controller("jobs")
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  list(@Query() query: unknown) {
    return this.jobs.list(query);
  }

  @Get("filters")
  filters() {
    return this.jobs.filters();
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.jobs.findById(id);
  }

  @Post("dedupe")
  dedupe(@Body() body: unknown) {
    return this.jobs.dedupe(body);
  }

  @Post(":id/merge")
  merge(@Param("id") id: string, @Body() body: unknown) {
    return this.jobs.merge(id, body);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.jobs.create(body);
  }

  @Post("filters")
  saveFilter(@Body() body: unknown) {
    return this.jobs.saveFilter(body);
  }
}
