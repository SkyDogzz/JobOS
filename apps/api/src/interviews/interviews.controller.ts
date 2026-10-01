import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { InterviewsService } from "./interviews.service.js";

@Controller()
export class InterviewsController {
  constructor(private readonly interviews: InterviewsService) {}

  @Get("interviews")
  list() {
    return this.interviews.list();
  }

  @Post("interviews")
  create(@Body() body: unknown) {
    return this.interviews.create(body);
  }

  @Get("interviews/:id")
  findById(@Param("id") id: string) {
    return this.interviews.findById(id);
  }

  @Patch("interviews/:id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.interviews.update(id, body);
  }

  @Delete("interviews/:id")
  delete(@Param("id") id: string) {
    return this.interviews.delete(id);
  }

  @Get("applications/:applicationId/interviews")
  listForApplication(@Param("applicationId") applicationId: string) {
    return this.interviews.listForApplication(applicationId);
  }
}
