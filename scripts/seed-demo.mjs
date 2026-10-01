const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:4000";

async function post(path, payload) {
  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${path} failed: ${response.status} ${body}`);
  }

  return response.json();
}

async function main() {
  const job = await post("/jobs", {
    title: "Product-minded Backend Engineer",
    companyName: "Northstar Systems",
    description: "Build reliable TypeScript APIs, own PostgreSQL data models, and improve hiring workflow automation.",
    location: "Remote",
    sourceName: "demo-seed",
    remotePolicy: "remote",
    salaryText: "$140k-$175k"
  });

  const resume = await post("/resumes", {
    name: "Backend Platform CV",
    title: "Backend Platform CV v1",
    content: {
      summary: "TypeScript backend engineer focused on APIs, PostgreSQL, queues, and product-quality delivery."
    }
  });

  const application = await post("/applications", {
    jobId: job.id,
    resumeVersionId: resume.currentVersion.id,
    stage: "applied"
  });

  console.log(JSON.stringify({ jobId: job.id, resumeId: resume.id, applicationId: application.id }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

