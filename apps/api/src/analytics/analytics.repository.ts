import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { applications, companies, jobs, jobSources } from "@jobos/database";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

const stages = ["wishlist", "saved", "applied", "screening", "interviewing", "offer", "rejected", "withdrawn", "accepted"];
const terminalStages = new Set(["rejected", "withdrawn", "accepted"]);

export interface AnalyticsFilters {
  sourceId?: string;
  companyId?: string;
  resumeVersionId?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class AnalyticsRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async funnel(filters: AnalyticsFilters = {}) {
    const rows = await this.applicationRows();
    const filtered = rows.filter((row) => matchesFilters(row, filters));
    const now = Date.now();

    const byStage = stages.map((stage) => {
      const items = filtered.filter((row) => row.stage === stage);
      const totalAgeDays = items.reduce((sum, row) => sum + ageDays(row.createdAt, now), 0);
      return {
        stage,
        count: items.length,
        averageAgeDays: items.length ? Math.round(totalAgeDays / items.length) : 0
      };
    });

    const active = filtered.filter((row) => !terminalStages.has(row.stage));
    const terminal = filtered.filter((row) => terminalStages.has(row.stage));

    return {
      filters,
      totalApplications: filtered.length,
      activeApplications: active.length,
      terminalApplications: terminal.length,
      stageCounts: byStage,
      aging: {
        averageActiveAgeDays: active.length ? Math.round(active.reduce((sum, row) => sum + ageDays(row.createdAt, now), 0) / active.length) : 0,
        oldestActiveAgeDays: active.length ? Math.max(...active.map((row) => ageDays(row.createdAt, now))) : 0
      }
    };
  }

  private applicationRows() {
    return this.db
      .select({
        id: applications.id,
        stage: applications.stage,
        resumeVersionId: applications.resumeVersionId,
        createdAt: applications.createdAt,
        jobId: jobs.id,
        companyId: companies.id,
        companyName: companies.name,
        sourceId: jobSources.id,
        sourceName: jobSources.name
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .leftJoin(jobSources, eq(jobs.sourceId, jobSources.id));
  }
}

type ApplicationRow = Awaited<ReturnType<AnalyticsRepository["applicationRows"]>>[number];

function matchesFilters(row: ApplicationRow, filters: AnalyticsFilters) {
  if (filters.sourceId && row.sourceId !== filters.sourceId) return false;
  if (filters.companyId && row.companyId !== filters.companyId) return false;
  if (filters.resumeVersionId && row.resumeVersionId !== filters.resumeVersionId) return false;
  if (filters.dateFrom && row.createdAt < new Date(filters.dateFrom)) return false;
  if (filters.dateTo && row.createdAt > new Date(filters.dateTo)) return false;
  return true;
}

function ageDays(date: Date, now: number) {
  return Math.max(0, Math.floor((now - date.getTime()) / 86400000));
}
