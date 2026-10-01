import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { NotesService } from "./notes.service.js";

@Controller("applications/:applicationId/notes")
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  list(@Param("applicationId") applicationId: string) {
    return this.notes.list(applicationId);
  }

  @Post()
  create(@Param("applicationId") applicationId: string, @Body() body: unknown) {
    return this.notes.create(applicationId, body);
  }
}

