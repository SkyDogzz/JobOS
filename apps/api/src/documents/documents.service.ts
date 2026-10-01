import { Injectable, NotFoundException } from "@nestjs/common";
import { assignDocumentSchema, documentFiltersSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { DocumentsRepository } from "./documents.repository.js";

@Injectable()
export class DocumentsService {
  constructor(private readonly documents: DocumentsRepository) {}

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

  async assign(id: string, body: unknown) {
    const document = await this.documents.assign(id, parseBody(assignDocumentSchema, body));
    if (!document) throw new NotFoundException("Document or application not found.");
    return document;
  }
}

