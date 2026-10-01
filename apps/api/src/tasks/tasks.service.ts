import { Injectable, NotFoundException } from "@nestjs/common";
import { createTaskSchema } from "@jobos/validation";
import { parseBody } from "../common/validation.js";
import { TasksRepository } from "./tasks.repository.js";

@Injectable()
export class TasksService {
  constructor(private readonly tasks: TasksRepository) {}

  list(applicationId: string) {
    return this.tasks.list(applicationId);
  }

  create(applicationId: string, body: unknown) {
    return this.tasks.create(applicationId, parseBody(createTaskSchema, body));
  }

  async complete(id: string) {
    const task = await this.tasks.complete(id);
    if (!task) throw new NotFoundException("Task not found.");
    return task;
  }
}

