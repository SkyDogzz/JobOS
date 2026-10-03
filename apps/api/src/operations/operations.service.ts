import { Injectable, NotFoundException } from "@nestjs/common";
import { OperationsRepository } from "./operations.repository.js";

@Injectable()
export class OperationsService {
  constructor(private readonly operations: OperationsRepository) {}

  listBackgroundJobs() {
    return this.operations.listBackgroundJobs();
  }

  async retryBackgroundJob(id: string) {
    const job = await this.operations.retryBackgroundJob(id);
    if (!job) throw new NotFoundException("Background job not found.");
    return job;
  }
}
