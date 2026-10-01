import { Injectable } from "@nestjs/common";

@Injectable()
export class ApplicationsService {
  list() {
    return [];
  }

  create(body: unknown) {
    return { id: "pending-persistence", ...this.asRecord(body) };
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
  }
}

