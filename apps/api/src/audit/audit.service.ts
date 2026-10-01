import { Injectable } from "@nestjs/common";
import { AuditRepository } from "./audit.repository.js";

@Injectable()
export class AuditService {
  constructor(private readonly audit: AuditRepository) {}

  list(query: Record<string, string | undefined>) {
    return this.audit.list({
      applicationId: query.applicationId,
      eventType: query.eventType,
      relatedEntity: query.relatedEntity
    });
  }
}
