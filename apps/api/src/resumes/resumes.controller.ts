import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ResumesService } from "./resumes.service.js";

@Controller("resumes")
export class ResumesController {
  constructor(private readonly resumes: ResumesService) {}

  @Get()
  list() {
    return this.resumes.list();
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.resumes.findById(id);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.resumes.create(body);
  }

  @Post(":id/versions")
  createVersion(@Param("id") id: string, @Body() body: unknown) {
    return this.resumes.createVersion(id, body);
  }
}
