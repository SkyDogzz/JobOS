import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ContactsService } from "./contacts.service.js";

@Controller("contacts")
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Get()
  list() {
    return this.contacts.list();
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.contacts.findById(id);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.contacts.create(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: unknown) {
    return this.contacts.update(id, body);
  }

  @Post(":id/applications")
  linkApplication(@Param("id") id: string, @Body() body: unknown) {
    return this.contacts.linkApplication(id, body);
  }

  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.contacts.delete(id);
  }
}
