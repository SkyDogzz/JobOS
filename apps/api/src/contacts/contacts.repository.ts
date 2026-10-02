import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import { applicationContacts, applications, companies, contacts, jobs } from "@jobos/database";
import type { CreateContactInput, LinkContactInput } from "@jobos/validation";
import { requireCurrentUserId } from "../common/current-user.js";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class ContactsRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  async list() {
    const userId = requireCurrentUserId();
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
        followUpAt: contacts.followUpAt,
        createdAt: contacts.createdAt
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .where(eq(contacts.userId, userId))
      .orderBy(asc(contacts.name));
  }

  async findById(id: string) {
    const userId = requireCurrentUserId();
    const [contact] = await this.db
      .select({
        id: contacts.id,
        companyId: contacts.companyId,
        companyName: companies.name,
        name: contacts.name,
        title: contacts.title,
        email: contacts.email,
        linkedinUrl: contacts.linkedinUrl,
        notes: contacts.notes,
        followUpAt: contacts.followUpAt,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt
      })
      .from(contacts)
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
      .limit(1);

    if (!contact) return null;

    const linkedApplications = await this.db
      .select({
        id: applicationContacts.id,
        applicationId: applicationContacts.applicationId,
        relationship: applicationContacts.relationship,
        notes: applicationContacts.notes,
        stage: applications.stage,
        jobTitle: jobs.title,
        companyName: companies.name,
        createdAt: applicationContacts.createdAt
      })
      .from(applicationContacts)
      .innerJoin(applications, eq(applicationContacts.applicationId, applications.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(companies, eq(jobs.companyId, companies.id))
      .where(eq(applicationContacts.contactId, id))
      .orderBy(asc(applicationContacts.createdAt));

    return { ...contact, applications: linkedApplications };
  }

  async create(input: CreateContactInput) {
    const userId = requireCurrentUserId();
    const [contact] = await this.db.insert(contacts).values({ ...contactValues(input), userId }).returning();
    return contact;
  }

  async update(id: string, input: CreateContactInput) {
    const userId = requireCurrentUserId();
    const [contact] = await this.db.update(contacts).set({ ...contactValues(input), updatedAt: new Date() }).where(and(eq(contacts.id, id), eq(contacts.userId, userId))).returning();
    return contact ?? null;
  }

  async delete(id: string) {
    const userId = requireCurrentUserId();
    const [contact] = await this.db.delete(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, userId))).returning({ id: contacts.id });
    return contact ?? null;
  }

  async linkApplication(contactId: string, input: LinkContactInput) {
    const [link] = await this.db
      .insert(applicationContacts)
      .values({
        contactId,
        applicationId: input.applicationId,
        relationship: input.relationship,
        notes: input.notes
      })
      .onConflictDoUpdate({
        target: [applicationContacts.applicationId, applicationContacts.contactId],
        set: { relationship: input.relationship, notes: input.notes, updatedAt: new Date() }
      })
      .returning();
    return link;
  }

  async listForCompany(companyId: string) {
    const userId = requireCurrentUserId();
    return this.db
      .select({
        id: contacts.id,
        companyId: contacts.companyId,
        name: contacts.name,
        title: contacts.title,
        email: contacts.email,
        linkedinUrl: contacts.linkedinUrl,
        notes: contacts.notes,
        followUpAt: contacts.followUpAt
      })
      .from(contacts)
      .where(and(eq(contacts.companyId, companyId), eq(contacts.userId, userId)))
      .orderBy(asc(contacts.name));
  }

  async listForApplication(applicationId: string) {
    const userId = requireCurrentUserId();
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
        followUpAt: contacts.followUpAt,
        relationship: applicationContacts.relationship,
        linkNotes: applicationContacts.notes
      })
      .from(applicationContacts)
      .innerJoin(contacts, eq(applicationContacts.contactId, contacts.id))
      .leftJoin(companies, eq(contacts.companyId, companies.id))
      .where(and(eq(applicationContacts.applicationId, applicationId), eq(contacts.userId, userId)))
      .orderBy(asc(contacts.name));
  }
}

function contactValues(input: CreateContactInput) {
  return {
    ...input,
    followUpAt: input.followUpAt ? new Date(input.followUpAt) : undefined
  };
}
