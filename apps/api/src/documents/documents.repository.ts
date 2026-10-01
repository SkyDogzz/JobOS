import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import { aiArtifacts, applications, documents } from "@jobos/database";
import type { AssignDocumentInput, DocumentFiltersInput } from "@jobos/validation";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class DocumentsRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async list(filters: DocumentFiltersInput) {
    const conditions = [
      filters.kind ? eq(documents.kind, filters.kind) : undefined,
      filters.applicationId ? eq(documents.applicationId, filters.applicationId) : undefined
    ].filter(Boolean);
    const rows = await this.db
      .select({
        id: documents.id,
        applicationId: documents.applicationId,
        kind: documents.kind,
        name: documents.name,
        contentHash: documents.contentHash,
        content: documents.content,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt
      })
      .from(documents)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(documents.createdAt));
    return rows.filter((row) => matchesContentFilters(row.content, filters));
  }

  async findById(id: string) {
    const [document] = await this.db.select().from(documents).where(eq(documents.id, id)).limit(1);
    return document ?? null;
  }

  async assign(id: string, input: AssignDocumentInput) {
    if (input.applicationId) {
      const [application] = await this.db.select({ id: applications.id }).from(applications).where(eq(applications.id, input.applicationId)).limit(1);
      if (!application) return null;
    }
    const [document] = await this.db.update(documents).set({ applicationId: input.applicationId, updatedAt: new Date() }).where(eq(documents.id, id)).returning();
    return document ?? null;
  }

  async listArtifacts(filters: DocumentFiltersInput) {
    const rows = await this.db
      .select({
        id: aiArtifacts.id,
        applicationId: aiArtifacts.applicationId,
        provider: aiArtifacts.provider,
        model: aiArtifacts.model,
        purpose: aiArtifacts.purpose,
        promptHash: aiArtifacts.promptHash,
        output: aiArtifacts.output,
        groundedInProfile: aiArtifacts.groundedInProfile,
        createdAt: aiArtifacts.createdAt
      })
      .from(aiArtifacts)
      .orderBy(desc(aiArtifacts.createdAt));
    return rows.filter((row) => {
      if (filters.applicationId && row.applicationId !== filters.applicationId) return false;
      if (filters.provider && row.provider !== filters.provider) return false;
      if (filters.model && row.model !== filters.model) return false;
      if (filters.approvalState && JSON.stringify(row.output).toLowerCase().includes(`"approvalstate":"${filters.approvalState.toLowerCase()}"`) === false) return false;
      return true;
    });
  }
}

function matchesContentFilters(content: Record<string, unknown>, filters: DocumentFiltersInput) {
  const metadata = typeof content.metadata === "object" && content.metadata ? content.metadata as Record<string, unknown> : {};
  if (filters.provider && metadata.provider !== filters.provider) return false;
  if (filters.model && metadata.model !== filters.model) return false;
  if (filters.approvalState && content.approvalState !== filters.approvalState) return false;
  return true;
}

