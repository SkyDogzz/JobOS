import { Controller, Get, Query } from "@nestjs/common";
import { AuditService } from "./audit.service.js";

@Controller("audit")
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get("events")
  events(@Query() query: Record<string, string | undefined>) {
    return this.audit.list(query);
  }
}
