import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { applicationEvents, notes } from "@jobos/database";
import type { CreateNoteInput } from "@jobos/validation";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class NotesRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  list(applicationId: string) {
    return this.db.select().from(notes).where(eq(notes.applicationId, applicationId)).orderBy(asc(notes.createdAt));
  }

  async create(applicationId: string, input: CreateNoteInput) {
    const [note] = await this.db.insert(notes).values({ applicationId, body: input.body }).returning();
    await this.db.insert(applicationEvents).values({
      applicationId,
      kind: "note",
      payload: { noteId: note.id }
    });
    return note;
  }
}

