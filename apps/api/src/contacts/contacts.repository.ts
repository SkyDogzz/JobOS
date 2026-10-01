import { Inject, Injectable } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { companies, contacts, users } from "@jobos/database";
import type { CreateContactInput } from "@jobos/validation";
import { devUser } from "../common/dev-user.js";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class ContactsRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async list() {
    return this.db
      .select({
        id: contacts.id,
        companyId: contacts.companyId,
        companyName: companies.name,
        name: contacts.name,
        title: contacts.title,
        email: contacts.email,
        linkedinUrl: contacts.linkedinUrl,
        notes: contacts.notes,
        createdAt: contacts.createdAt
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .orderBy(asc(contacts.name));
  }

  async create(input: CreateContactInput) {
    const userId = await this.ensureDevUser();
    const [contact] = await this.db.insert(contacts).values({ ...input, userId }).returning();
    return contact;
  }

  async update(id: string, input: CreateContactInput) {
    const [contact] = await this.db.update(contacts).set({ ...input, updatedAt: new Date() }).where(eq(contacts.id, id)).returning();
    return contact ?? null;
  }

  private async ensureDevUser() {
    await this.db.insert(users).values(devUser).onConflictDoNothing({ target: users.email });
    const [user] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, devUser.email)).limit(1);
    return user.id;
  }
}

