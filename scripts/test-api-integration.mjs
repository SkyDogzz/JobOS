const apiUrl = process.env.API_URL ?? "http://localhost:4000";

async function request(path, options) {
  const response = await fetch(`${apiUrl}${path}`, options);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${path} failed with ${response.status}: ${body}`);
  }

  return response.json();
}

async function main() {
  try {
    await request("/health");
  } catch {
    console.log("API integration tests skipped: API is not running.");
    return;
  }

  const job = await request("/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Integration Test Engineer",
      companyName: "JobOS Test Co",
      description: "Validate API integration flow.",
      location: "Remote",
      sourceName: "integration-test"
    })
  });

  const resume = await request("/resumes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Integration CV",
      title: "Integration CV v1",
      content: { summary: "Integration test profile." }
    })
  });

  const application = await request("/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: job.id,
      resumeVersionId: resume.currentVersion.id,
      stage: "saved"
    })
  });

  const [jobs, resumes, applications] = await Promise.all([
    request("/jobs"),
    request("/resumes"),
    request("/applications")
  ]);

  if (!jobs.some((item) => item.id === job.id)) throw new Error("Created job not found in list.");
  if (!resumes.some((item) => item.id === resume.id)) throw new Error("Created resume not found in list.");
  if (!applications.some((item) => item.id === application.id)) throw new Error("Created application not found in list.");

  const detail = await request(`/applications/${application.id}`);
  if (detail.id !== application.id) throw new Error("Application detail returned the wrong record.");
  if (!Array.isArray(detail.events)) throw new Error("Application detail did not include events.");

  const updated = await request(`/applications/${application.id}/stage`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stage: "interviewing" })
  });
  if (updated.stage !== "interviewing") throw new Error("Application stage update failed.");

  const note = await request(`/applications/${application.id}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: "Integration note" })
  });
  if (!note.id) throw new Error("Note creation failed.");

  const task = await request(`/applications/${application.id}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Integration task" })
  });
  const completed = await request(`/tasks/${task.id}/complete`, { method: "PATCH" });
  if (completed.status !== "done") throw new Error("Task completion failed.");

  const profile = await request("/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ headline: "Integration Candidate", skills: "TypeScript, PostgreSQL" })
  });
  if (profile.headline !== "Integration Candidate") throw new Error("Profile upsert failed.");

  const authEmail = `integration-${Date.now()}@jobos.local`;
  const registered = await request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: authEmail, password: "password123", name: "Integration User" })
  });
  if (registered.user.email !== authEmail) throw new Error("Auth registration failed.");

  console.log("API integration tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
