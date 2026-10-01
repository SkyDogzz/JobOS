import { Body, Controller, Get, Post } from "@nestjs/common";
import { ResumesService } from "./resumes.service.js";

@Controller("resumes")
export class ResumesController {
  constructor(private readonly resumes: ResumesService) {}

  @Get()
  list() {
    return this.resumes.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.resumes.create(body);
  }
}

