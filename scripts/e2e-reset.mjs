import postgres from "postgres";

const databaseUrl = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? "postgres://jobos:jobos@localhost:5432/jobos_e2e";

const appTables = [
  "grounding_reviews",
  "ai_artifacts",
  "calendar_events",
  "calendar_sync_jobs",
  "calendar_integration_connections",
  "email_messages",
  "email_sync_jobs",
  "email_integration_connections",
  "interviews",
  "notifications",
  "user_settings",
  "notification_preferences",
  "tasks",
  "notes",
  "documents",
  "application_contacts",
  "application_events",
  "applications",
  "job_resume_matches",
  "ats_analyses",
  "resume_versions",
  "resumes",
  "jobs",
  "saved_job_filters",
  "contacts",
  "job_sources",
  "companies",
  "candidate_profiles",
  "users"
];

const sql = postgres(databaseUrl, { max: 1 });

try {
  await sql`select 1`;
  await sql.unsafe(`truncate table ${appTables.map((table) => `"${table}"`).join(", ")} restart identity cascade`);
  console.log(`Reset ${appTables.length} application tables for E2E.`);
} finally {
  await sql.end();
}
