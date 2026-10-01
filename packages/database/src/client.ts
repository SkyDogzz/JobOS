import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export function createDatabaseClient(databaseUrl: string) {
  const sql = postgres(databaseUrl, { max: 10 });
  return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof createDatabaseClient>;

