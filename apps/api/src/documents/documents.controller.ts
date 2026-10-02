import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { DocumentsService } from "./documents.service.js";

@Controller("documents")
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  list(@Query() query: unknown) {
    return this.documents.list(query);
  }

  @Get("artifacts")
  artifacts(@Query() query: unknown) {
    return this.documents.artifacts(query);
  }

  @Get("templates/list")
  templates(@Query("kind") kind?: string) {
    return this.documents.templates(kind);
  }

  @Post("templates")
  createTemplate(@Body() body: unknown) {
    return this.documents.createTemplate(body);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.documents.findById(id);
  }

  @Get(":id/export")
  export(@Param("id") id: string, @Query("format") format = "markdown", @Query("templateId") templateId?: string) {
    return this.documents.export(id, format, templateId);
  }

  @Patch(":id/application")
  assign(@Param("id") id: string, @Body() body: unknown) {
    return this.documents.assign(id, body);
  }
}
