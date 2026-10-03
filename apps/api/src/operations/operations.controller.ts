import { Controller, Get, Param, Post } from "@nestjs/common";
import { OperationsService } from "./operations.service.js";

@Controller("operations")
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}

  @Get("background-jobs")
  listBackgroundJobs() {
    return this.operations.listBackgroundJobs();
  }

  @Post("background-jobs/:id/retry")
  retryBackgroundJob(@Param("id") id: string) {
    return this.operations.retryBackgroundJob(id);
  }
}
