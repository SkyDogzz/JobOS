import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { applications, companies, jobs, jobSources } from "@jobos/database";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

const stages = ["wishlist", "saved", "applied", "screening", "interviewing", "offer", "rejected", "withdrawn", "accepted"];
const terminalStages = new Set(["rejected", "withdrawn", "accepted"]);
const responseStages = new Set(["screening", "interviewing", "offer", "rejected", "withdrawn", "accepted"]);
const interviewStages = new Set(["interviewing", "offer", "rejected", "withdrawn", "accepted"]);

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

  async sources(filters: AnalyticsFilters = {}) {
    const rows = (await this.applicationRows()).filter((row) => matchesFilters(row, filters));
    const groups = new Map<string, ApplicationRow[]>();

    for (const row of rows) {
      const key = row.sourceId ?? `source-name:${row.sourceName ?? "Unknown"}`;
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }

    const sources = [...groups.values()]
      .map((items) => {
        const first = items[0];
        const total = items.length;
        const responseCount = items.filter((row) => responseStages.has(row.stage)).length;
        const interviewCount = items.filter((row) => interviewStages.has(row.stage)).length;
        const offerCount = items.filter((row) => row.stage === "offer" || row.stage === "accepted").length;
        const rejectionCount = items.filter((row) => row.stage === "rejected").length;
        const rankScore = Math.round((responseCount / total) * 35 + (interviewCount / total) * 30 + (offerCount / total) * 25 - (rejectionCount / total) * 10);

        return {
          sourceId: first.sourceId,
          sourceName: first.sourceName ?? "Unknown",
          sourceStatus: first.sourceStatus,
          sourceNotes: first.sourceNotes,
          applicationCount: total,
          responseRate: rate(responseCount, total),
          interviewRate: rate(interviewCount, total),
          offerRate: rate(offerCount, total),
          rejectionRate: rate(rejectionCount, total),
          rankScore: Math.max(0, Math.min(100, rankScore)),
          qualityNote: qualityNote(responseCount, interviewCount, offerCount, rejectionCount, total)
        };
      })
      .sort((a, b) => b.rankScore - a.rankScore || b.applicationCount - a.applicationCount || a.sourceName.localeCompare(b.sourceName));

    return {
      filters,
      totalSources: sources.length,
      sources
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
        sourceName: jobSources.name,
        sourceStatus: jobSources.status,
        sourceNotes: jobSources.notes
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

function rate(count: number, total: number) {
  return total ? Math.round((count / total) * 100) : 0;
}

function qualityNote(responseCount: number, interviewCount: number, offerCount: number, rejectionCount: number, total: number) {
  if (offerCount > 0) return "Strong source: produced offer-stage outcomes.";
  if (interviewCount / total >= 0.5) return "High quality: interviews are converting from this source.";
  if (responseCount / total >= 0.5) return "Responsive source: replies or later-stage movement are common.";
  if (rejectionCount / total >= 0.5) return "Watch closely: rejection rate is elevated.";
  return "Needs more data before ranking confidently.";
}
