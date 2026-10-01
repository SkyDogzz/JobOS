import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { MatchingService } from "./matching.service.js";

@Controller("matches")
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Post()
  match(@Body() body: unknown) {
    return this.matching.match(body);
  }

  @Get()
  listLatest() {
    return this.matching.listLatest();
  }

  @Get("jobs/:jobId")
  listForJob(@Param("jobId") jobId: string) {
    return this.matching.listForJob(jobId);
  }
}
