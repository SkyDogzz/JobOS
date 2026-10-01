import { Injectable } from "@nestjs/common";
import { AnalyticsRepository } from "./analytics.repository.js";

@Injectable()
export class AnalyticsService {
  constructor(private readonly analytics: AnalyticsRepository) {}

  funnel(query: Record<string, string | undefined>) {
    return this.analytics.funnel({
      companyId: query.companyId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      resumeVersionId: query.resumeVersionId,
      sourceId: query.sourceId
    });
  }

  sources(query: Record<string, string | undefined>) {
    return this.analytics.sources({
      companyId: query.companyId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      resumeVersionId: query.resumeVersionId,
      sourceId: query.sourceId
    });
  }
}
