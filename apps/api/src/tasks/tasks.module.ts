import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { TasksController } from "./tasks.controller.js";
import { TasksRepository } from "./tasks.repository.js";
import { TasksService } from "./tasks.service.js";

@Module({ imports: [DatabaseModule], controllers: [TasksController], providers: [TasksRepository, TasksService] })
export class TasksModule {}
