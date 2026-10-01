import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { users } from "@jobos/database";
import type { RegisterInput } from "@jobos/validation";
import { DATABASE } from "../database/database.module.js";
import type { JobOsDatabase } from "../database/database.types.js";

@Injectable()
export class AuthRepository {
  constructor(@Inject(DATABASE) private readonly db: JobOsDatabase) {}

  findByEmail(email: string) {
    return this.db.select().from(users).where(eq(users.email, email)).limit(1).then(([user]) => user ?? null);
  }

  findById(id: string) {
    return this.db.select().from(users).where(eq(users.id, id)).limit(1).then(([user]) => user ?? null);
  }

  async create(input: RegisterInput, passwordHash: string) {
    const [user] = await this.db.insert(users).values({
      email: input.email,
      name: input.name,
      passwordHash
    }).returning({
      id: users.id,
      email: users.email,
      name: users.name
    });
    return user;
  }
}

