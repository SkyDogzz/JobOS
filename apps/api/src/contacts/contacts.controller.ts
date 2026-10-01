import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ContactsService } from "./contacts.service.js";

@Controller("contacts")
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Get()
  list() {
    return this.contacts.list();
  }

  @Post()
  create(@Body() body: unknown) {
    return this.contacts.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.contacts.update(id, body);
  }
}

