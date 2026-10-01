import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
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

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.documents.findById(id);
  }

  @Patch(":id/application")
  assign(@Param("id") id: string, @Body() body: unknown) {
    return this.documents.assign(id, body);
  }
}

