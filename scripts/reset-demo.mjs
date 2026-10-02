import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL ?? "postgres://jobos:jobos@localhost:5432/jobos";
const sql = postgres(databaseUrl, { max: 1 });

async function main() {
  await sql`truncate table reviewer_comments, application_share_packets, application_events, applications, resume_versions, resumes, jobs, companies, candidate_profiles, users restart identity cascade`;
  console.log("Demo data reset.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
