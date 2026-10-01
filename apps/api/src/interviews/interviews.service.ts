import { Injectable, NotFoundException } from "@nestjs/common";
import { upsertInterviewSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { InterviewsRepository } from "./interviews.repository.js";

@Injectable()
export class InterviewsService {
  constructor(private readonly interviews: InterviewsRepository) {}

  list() {
    return this.interviews.list();
  }

  listForApplication(applicationId: string) {
    return this.interviews.listForApplication(applicationId);
  }

  async findById(id: string) {
    const interview = await this.interviews.findById(id);
    if (!interview) throw new NotFoundException("Interview not found.");
    return interview;
  }

  create(body: unknown) {
    return this.interviews.create(parseBody(upsertInterviewSchema, body));
  }

  async update(id: string, body: unknown) {
    const interview = await this.interviews.update(id, parseBody(upsertInterviewSchema, body));
    if (!interview) throw new NotFoundException("Interview not found.");
    return interview;
  }

  async delete(id: string) {
    const interview = await this.interviews.delete(id);
    if (!interview) throw new NotFoundException("Interview not found.");
    return { ok: true };
  }
}
