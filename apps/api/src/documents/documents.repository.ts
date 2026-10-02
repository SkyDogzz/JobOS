import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq } from "drizzle-orm";
import { aiArtifacts, applications, documents, documentTemplates } from "@jobos/database";
import type { AssignDocumentInput, DocumentFiltersInput, UpsertDocumentTemplateInput } from "@jobos/validation";
import { requireCurrentUserId } from "../common/current-user.js";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class DocumentsRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async list(filters: DocumentFiltersInput) {
    const userId = requireCurrentUserId();
    const conditions = [
      eq(documents.userId, userId),
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
    const userId = requireCurrentUserId();
    const [document] = await this.db.select().from(documents).where(and(eq(documents.id, id), eq(documents.userId, userId))).limit(1);
    return document ?? null;
  }

  async assign(id: string, input: AssignDocumentInput) {
    const userId = requireCurrentUserId();
    if (input.applicationId) {
      const [application] = await this.db.select({ id: applications.id }).from(applications).where(and(eq(applications.id, input.applicationId), eq(applications.userId, userId))).limit(1);
      if (!application) return null;
    }
    const [document] = await this.db.update(documents).set({ applicationId: input.applicationId, updatedAt: new Date() }).where(and(eq(documents.id, id), eq(documents.userId, userId))).returning();
    return document ?? null;
  }

  listTemplates(kind?: string) {
    const userId = requireCurrentUserId();
    return this.db.select().from(documentTemplates).where(and(eq(documentTemplates.userId, userId), kind ? eq(documentTemplates.kind, kind as typeof documentTemplates.$inferSelect.kind) : undefined)).orderBy(desc(documentTemplates.updatedAt));
  }

  async findTemplateById(id: string) {
    const userId = requireCurrentUserId();
    const [template] = await this.db.select().from(documentTemplates).where(and(eq(documentTemplates.id, id), eq(documentTemplates.userId, userId))).limit(1);
    return template ?? null;
  }

  async defaultTemplate(kind: typeof documentTemplates.$inferSelect.kind) {
    const userId = requireCurrentUserId();
    const [template] = await this.db.select().from(documentTemplates).where(and(eq(documentTemplates.userId, userId), eq(documentTemplates.kind, kind))).orderBy(desc(documentTemplates.updatedAt)).limit(1);
    return template ?? null;
  }

  createTemplate(input: UpsertDocumentTemplateInput) {
    const userId = requireCurrentUserId();
    return this.db.insert(documentTemplates).values({ userId, ...input }).returning().then(([template]) => template);
  }

  async listArtifacts(filters: DocumentFiltersInput) {
    const userId = requireCurrentUserId();
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
      .where(eq(aiArtifacts.userId, userId))
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
