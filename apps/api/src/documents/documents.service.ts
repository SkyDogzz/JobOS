import { Injectable, NotFoundException } from "@nestjs/common";
import { assignDocumentSchema, documentFiltersSchema, exportFormatSchema, upsertDocumentTemplateSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { BillingService } from "../billing/billing.service.js";
import { DocumentsRepository } from "./documents.repository.js";

@Injectable()
export class DocumentsService {
  constructor(private readonly documents: DocumentsRepository, private readonly billing: BillingService) {}

  list(query: unknown) {
    return this.documents.list(documentFiltersSchema.parse(query));
  }

  artifacts(query: unknown) {
    return this.documents.listArtifacts(documentFiltersSchema.parse(query));
  }

  async findById(id: string) {
    const document = await this.documents.findById(id);
    if (!document) throw new NotFoundException("Document not found.");
    return document;
  }

  async export(id: string, format: string, templateId?: string) {
    await this.billing.consumeUsage("documentExports", 1, { format, documentId: id });
    const document = await this.documents.findById(id);
    if (!document) throw new NotFoundException("Document not found.");
    const template = templateId ? await this.documents.findTemplateById(templateId) : await this.documents.defaultTemplate(document.kind);
    return renderDocumentExport(document, exportFormatSchema.parse(format), template?.body);
  }

  templates(kind?: string) {
    return this.documents.listTemplates(kind);
  }

  createTemplate(body: unknown) {
    return this.documents.createTemplate(parseBody(upsertDocumentTemplateSchema, body));
  }

  async assign(id: string, body: unknown) {
    const document = await this.documents.assign(id, parseBody(assignDocumentSchema, body));
    if (!document) throw new NotFoundException("Document or application not found.");
    return document;
  }
}

function renderDocumentExport(document: Awaited<ReturnType<DocumentsRepository["findById"]>>, format: "markdown" | "pdf" | "docx", templateBody?: string) {
  if (!document) throw new NotFoundException("Document not found.");
  const content = { ...document.content };
  const metadata = typeof content.metadata === "object" && content.metadata ? content.metadata as Record<string, unknown> : {};
  delete content.metadata;
  const markdown = renderMarkdown(document.name, document.kind, content, templateBody);
  const html = markdownToHtml(markdown);
  const rendered = format === "markdown" ? markdown : `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(document.name)}</title></head><body>${html}</body></html>`;
  return {
    filename: `${slug(document.name)}.${format === "markdown" ? "md" : format}`,
    format,
    mimeType: format === "markdown" ? "text/markdown; charset=utf-8" : format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    content: rendered,
    metadataSidecar: {
      documentId: document.id,
      contentHash: document.contentHash,
      applicationId: document.applicationId,
      generatedMetadata: metadata
    }
  };
}

function renderMarkdown(name: string, kind: string, content: Record<string, unknown>, templateBody?: string) {
  const values = flattenContent(name, kind, content);
  if (templateBody) {
    return templateBody.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, key: string) => String(values[key] ?? ""));
  }
  if (kind === "cover_letter") return `# ${name}\n\n${values.body ?? ""}\n\n## Grounded claims\n${(values.groundedClaimsList as string | undefined) ?? "- None"}`;
  return `# ${name}\n\n${JSON.stringify(content, null, 2)}\n`;
}

function flattenContent(name: string, kind: string, content: Record<string, unknown>) {
  const groundedClaims = Array.isArray(content.groundedClaims) ? content.groundedClaims.map(String) : [];
  const values: Record<string, string> = {
    name,
    kind,
    title: typeof content.title === "string" ? content.title : name,
    body: typeof content.body === "string" ? content.body : JSON.stringify(content, null, 2),
    tone: typeof content.tone === "string" ? content.tone : "",
    groundedClaimsList: groundedClaims.map((claim) => `- ${claim}`).join("\n")
  };
  return values;
}

function markdownToHtml(markdown: string) {
  return markdown.split("\n").map((line) => {
    if (line.startsWith("# ")) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
    if (line.startsWith("## ")) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
    if (line.startsWith("- ")) return `<li>${escapeHtml(line.slice(2))}</li>`;
    return line.trim() ? `<p>${escapeHtml(line)}</p>` : "";
  }).join("\n");
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "document";
}
