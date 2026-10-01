import { Injectable, NotFoundException } from "@nestjs/common";
import { createContactSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { ContactsRepository } from "./contacts.repository.js";

@Injectable()
export class ContactsService {
  constructor(private readonly contacts: ContactsRepository) {}

  list() {
    return this.contacts.list();
  }

  create(body: unknown) {
    return this.contacts.create(parseBody(createContactSchema, body));
  }

  async update(id: string, body: unknown) {
    const contact = await this.contacts.update(id, parseBody(createContactSchema, body));
    if (!contact) throw new NotFoundException("Contact not found.");
    return contact;
  }
}

