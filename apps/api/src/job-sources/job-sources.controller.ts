import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { JobSourcesService } from "./job-sources.service.js";

@Controller("job-sources")
export class JobSourcesController {
  constructor(private readonly sources: JobSourcesService) {}

  @Get()
  list() {
    return this.sources.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.sources.create(body);
  }

  @Post("parse")
  parse(@Body() body: unknown) {
    return this.sources.parse(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.sources.update(id, body);
  }
}
