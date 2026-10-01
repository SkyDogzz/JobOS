import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { ContactsController } from "./contacts.controller.js";
import { ContactsRepository } from "./contacts.repository.js";
import { ContactsService } from "./contacts.service.js";

@Module({ imports: [DatabaseModule], controllers: [ContactsController], providers: [ContactsRepository, ContactsService] })
export class ContactsModule {}
