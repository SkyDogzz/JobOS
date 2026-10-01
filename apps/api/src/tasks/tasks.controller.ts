import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { TasksService } from "./tasks.service.js";

@Controller()
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get("applications/:applicationId/tasks")
  list(@Param("applicationId") applicationId: string) {
    return this.tasks.list(applicationId);
  }

  @Post("applications/:applicationId/tasks")
  create(@Param("applicationId") applicationId: string, @Body() body: unknown) {
    return this.tasks.create(applicationId, body);
  }

  @Patch("tasks/:id/complete")
  complete(@Param("id") id: string) {
    return this.tasks.complete(id);
  }
}

