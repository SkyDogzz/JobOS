import { Body, Controller, Get, Headers, Post, Query } from "@nestjs/common";
import { AdminService } from "./admin.service.js";

@Controller("admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("users")
  users(@Query() query: Record<string, string | undefined>, @Headers("authorization") authorization?: string) {
    return this.admin.searchUsers(query, authorization);
  }

  @Get("audit")
  audit(@Query() query: Record<string, string | undefined>, @Headers("authorization") authorization?: string) {
    return this.admin.auditTrail(query, authorization);
  }

  @Get("sync-health")
  syncHealth(@Headers("authorization") authorization?: string) {
    return this.admin.syncHealth(authorization);
  }

  @Get("failed-jobs")
  failedJobs(@Headers("authorization") authorization?: string) {
    return this.admin.failedJobs(authorization);
  }

  @Post("support-bundles")
  supportBundle(@Body() body: unknown, @Headers("authorization") authorization?: string) {
    return this.admin.supportBundle(body, authorization);
  }
}
