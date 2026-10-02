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

  @Get("discovered")
  discovered() {
    return this.sources.discovered();
  }

  @Post("checks/run")
  runChecks(@Body() body: unknown) {
    return this.sources.runChecks(body);
  }

  @Post("discovered/:id/approve")
  approveDiscovered(@Param("id") id: string) {
    return this.sources.approveDiscovered(id);
  }

  @Post("discovered/:id/dismiss")
  dismissDiscovered(@Param("id") id: string) {
    return this.sources.dismissDiscovered(id);
  }

  @Post("discovered/:id/snooze")
  snoozeDiscovered(@Param("id") id: string, @Body() body: unknown) {
    return this.sources.snoozeDiscovered(id, body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.sources.update(id, body);
  }
}
