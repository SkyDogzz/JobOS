import { Injectable, NotFoundException } from "@nestjs/common";
import { createContactSchema, linkContactSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { ContactsRepository } from "./contacts.repository.js";

@Injectable()
export class ContactsService {
  constructor(private readonly contacts: ContactsRepository) {}

  list() {
    return this.contacts.list();
  }

  async findById(id: string) {
    const contact = await this.contacts.findById(id);
    if (!contact) throw new NotFoundException("Contact not found.");
    return contact;
  }

  create(body: unknown) {
    return this.contacts.create(parseBody(createContactSchema, body));
  }

  async update(id: string, body: unknown) {
    const contact = await this.contacts.update(id, parseBody(createContactSchema, body));
    if (!contact) throw new NotFoundException("Contact not found.");
    return contact;
  }

  async delete(id: string) {
    const contact = await this.contacts.delete(id);
    if (!contact) throw new NotFoundException("Contact not found.");
    return { ok: true };
  }

  async linkApplication(id: string, body: unknown) {
    const contact = await this.contacts.findById(id);
    if (!contact) throw new NotFoundException("Contact not found.");
    return this.contacts.linkApplication(id, parseBody(linkContactSchema, body));
  }
}
