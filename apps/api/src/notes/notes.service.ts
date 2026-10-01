import { Injectable } from "@nestjs/common";
import { createNoteSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { NotesRepository } from "./notes.repository.js";

@Injectable()
export class NotesService {
  constructor(private readonly notes: NotesRepository) {}

  list(applicationId: string) {
    return this.notes.list(applicationId);
  }

  create(applicationId: string, body: unknown) {
    return this.notes.create(applicationId, parseBody(createNoteSchema, body));
  }
}

