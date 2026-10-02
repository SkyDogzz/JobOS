import postgres from "postgres";

const databaseName = process.env.E2E_DATABASE_NAME ?? "jobos_e2e";
const adminUrl = process.env.E2E_ADMIN_DATABASE_URL ?? "postgres://jobos:jobos@localhost:5432/postgres";
const sql = postgres(adminUrl, { max: 1 });

async function waitForPostgres() {
  const deadline = Date.now() + 30_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      await sql`select 1`;
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }

  throw lastError;
}

try {
  await waitForPostgres();
  const existing = await sql`
    select 1 from pg_database where datname = ${databaseName}
  `;

  if (existing.length === 0) {
    await sql.unsafe(`create database "${databaseName.replace(/"/g, "\"\"")}"`);
    console.log(`Created ${databaseName} for E2E.`);
  } else {
    console.log(`${databaseName} already exists for E2E.`);
  }
} finally {
  await sql.end();
}
