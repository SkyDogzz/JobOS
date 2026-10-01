import { Injectable } from "@nestjs/common";
import { createResumeSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { ResumesRepository } from "./resumes.repository.js";

@Injectable()
export class ResumesService {
  constructor(private readonly resumes: ResumesRepository) {}

  list() {
    return this.resumes.list();
  }

  create(body: unknown) {
    return this.resumes.create(parseBody(createResumeSchema, body));
  }
}
