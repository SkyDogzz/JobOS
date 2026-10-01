import { Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import { aiArtifacts, applicationEvents, applications, companies, jobs } from "@jobos/database";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

export interface AuditFilters {
  eventType?: string;
  relatedEntity?: string;
  applicationId?: string;
}

@Injectable()
export class AuditRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async list(filters: AuditFilters = {}) {
    const events = await this.applicationEvents();
    const artifacts = await this.artifactEvents();
    return [...events, ...artifacts]
      .filter((event) => matchesFilters(event, filters))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 100);
  }

  private applicationEvents() {
    return this.db
      .select({
        id: applicationEvents.id,
        eventType: applicationEvents.kind,
        applicationId: applicationEvents.applicationId,
        payload: applicationEvents.payload,
        createdAt: applicationEvents.createdAt,
        jobTitle: jobs.title,
        companyName: companies.name
      })
      .from(applicationEvents)
      .innerJoin(applications, eq(applicationEvents.applicationId, applications.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .orderBy(desc(applicationEvents.createdAt))
      .then((rows) => rows.map((row) => ({
        id: row.id,
        eventType: row.eventType,
        relatedEntity: "application",
        relatedEntityId: row.applicationId,
        applicationId: row.applicationId,
        title: titleForApplicationEvent(row.eventType, row.jobTitle),
        description: descriptionForPayload(row.payload, row.companyName),
        payload: row.payload,
        createdAt: row.createdAt
      })));
  }

  private artifactEvents() {
    return this.db
      .select({
        id: aiArtifacts.id,
        applicationId: aiArtifacts.applicationId,
        purpose: aiArtifacts.purpose,
        provider: aiArtifacts.provider,
        model: aiArtifacts.model,
        promptHash: aiArtifacts.promptHash,
        createdAt: aiArtifacts.createdAt
      })
      .from(aiArtifacts)
      .orderBy(desc(aiArtifacts.createdAt))
      .then((rows) => rows.map((row) => ({
        id: row.id,
        eventType: "ai_generated",
        relatedEntity: "ai_artifact",
        relatedEntityId: row.id,
        applicationId: row.applicationId,
        title: `Generated ${row.purpose.replaceAll("_", " ")}`,
        description: `${row.provider}/${row.model}`,
        payload: { promptHash: row.promptHash, purpose: row.purpose },
        createdAt: row.createdAt
      })));
  }
}

type AuditEvent = Awaited<ReturnType<AuditRepository["applicationEvents"]>>[number] | Awaited<ReturnType<AuditRepository["artifactEvents"]>>[number];

function matchesFilters(event: AuditEvent, filters: AuditFilters) {
  if (filters.eventType && event.eventType !== filters.eventType) return false;
  if (filters.relatedEntity && event.relatedEntity !== filters.relatedEntity) return false;
  if (filters.applicationId && event.applicationId !== filters.applicationId) return false;
  return true;
}

function titleForApplicationEvent(kind: string, jobTitle: string) {
  if (kind === "created") return `Created application for ${jobTitle}`;
  if (kind === "stage_changed") return `Changed stage for ${jobTitle}`;
  if (kind === "note") return `Added note for ${jobTitle}`;
  if (kind === "updated") return `Updated ${jobTitle}`;
  return `${kind.replaceAll("_", " ")} for ${jobTitle}`;
}

function descriptionForPayload(payload: Record<string, unknown>, companyName: string | null) {
  if (typeof payload.from === "string" && typeof payload.to === "string") return `${payload.from} to ${payload.to}`;
  if (typeof payload.action === "string") return `${payload.action.replaceAll("_", " ")}${companyName ? ` at ${companyName}` : ""}`;
  return companyName ?? "Application activity";
}
