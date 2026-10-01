import { Module } from "@nestjs/common";
import { createDatabaseClient } from "@jobos/database";

export const DATABASE = Symbol("DATABASE");

@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: () => createDatabaseClient(process.env.DATABASE_URL ?? "postgres://jobos:jobos@localhost:5432/jobos")
    }
  ],
  exports: [DATABASE]
})
export class DatabaseModule {}

