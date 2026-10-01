import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
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

  @Patch(":id/stage")
  updateStage(@Param("id") id: string, @Body() body: unknown) {
    return this.applications.updateStage(id, body);
  }
}
