import { Controller, Get, Query } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service.js";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get("funnel")
  funnel(@Query() query: Record<string, string | undefined>) {
    return this.analytics.funnel(query);
  }

  @Get("sources")
  sources(@Query() query: Record<string, string | undefined>) {
    return this.analytics.sources(query);
  }

  @Get("operations")
  operations(@Query() query: Record<string, string | undefined>) {
    return this.analytics.operations(query);
  }
}
