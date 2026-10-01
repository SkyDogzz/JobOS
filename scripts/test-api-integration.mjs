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

  const source = await request("/job-sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: `Integration Source ${Date.now()}`, kind: "job_board", baseUrl: "https://jobs.example.com", status: "active" })
  });
  const updatedSource = await request(`/job-sources/${source.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: source.name, kind: "job_board", baseUrl: "https://jobs.example.com", status: "needs_review", notes: "Integration check" })
  });
  if (updatedSource.status !== "needs_review") throw new Error("Job source update failed.");

  const parsedPosting = await request("/job-sources/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: "https://boards.greenhouse.io/exampleco/jobs/123",
      html: `<html><head><meta property="og:title" content="Senior Parser Engineer"><script type="application/ld+json">{"@type":"JobPosting","title":"Senior Parser Engineer","hiringOrganization":{"name":"ParserCo"},"jobLocation":{"address":{"addressLocality":"Remote, US"}},"description":"Build parser adapters with TypeScript. Compensation $140k - $170k."}</script></head><body>Greenhouse</body></html>`
    })
  });
  if (parsedPosting.title !== "Senior Parser Engineer") throw new Error("Job board parser did not extract the title.");
  if (parsedPosting.companyName !== "ParserCo") throw new Error("Job board parser did not extract the company.");
  if (parsedPosting.parser !== "greenhouse") throw new Error("Job board parser did not detect Greenhouse.");

  const company = await request("/companies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: `Integration Company ${Date.now()}`, website: "https://company.example.com", description: "Integration company" })
  });
  const contact = await request("/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId: company.id, name: "Integration Recruiter", title: "Recruiter", email: "recruiter@example.com" })
  });
  if (!contact.id) throw new Error("Contact creation failed.");

  const attributedJob = await request("/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Attributed Integration Role",
      companyName: company.name,
      description: "Validate source attribution.",
      sourceId: source.id,
      sourceName: source.name
    })
  });
  const attributedDetail = await request(`/jobs/${attributedJob.id}`);
  if (attributedDetail.sourceId !== source.id) throw new Error("Job source attribution was not persisted.");

  const searchedJobs = await request(`/jobs?q=${encodeURIComponent("Attributed Integration")}&sourceId=${source.id}`);
  if (!searchedJobs.some((item) => item.id === attributedJob.id)) throw new Error("Job search did not return the attributed job.");

  const savedFilter = await request("/jobs/filters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Integration source filter", filters: { q: "Attributed", sourceId: source.id } })
  });
  if (savedFilter.filters.sourceId !== source.id) throw new Error("Saved job filter was not persisted.");
  const savedFilters = await request("/jobs/filters");
  if (!savedFilters.some((item) => item.id === savedFilter.id)) throw new Error("Saved job filter was not listed.");

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

  const resumeDetail = await request(`/resumes/${resume.id}`);
  if (resumeDetail.id !== resume.id) throw new Error("Resume detail returned the wrong record.");
  if (!resumeDetail.versions.some((item) => item.id === resume.currentVersion.id)) throw new Error("Resume detail did not include the initial version.");
  if (!resumeDetail.applications.some((item) => item.id === application.id)) throw new Error("Resume detail did not include linked applications.");

  const secondVersion = await request(`/resumes/${resume.id}/versions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Integration CV v2",
      content: { summary: "Second immutable version." }
    })
  });
  if (secondVersion.versionNumber !== 2) throw new Error("Resume version creation did not increment version number.");

  const pastedText = `Integration Candidate
integration@example.com
Summary
TypeScript engineer with PostgreSQL API experience building integration workflows.
Skills
TypeScript, PostgreSQL, NestJS, API testing
Experience
Engineer - JobOS Test Co
- Built deterministic API integration coverage.
Education
BS Computer Science - Test University
https://example.com/profile`;
  const parsed = await request("/resumes/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: pastedText })
  });
  if (!parsed.skills.includes("TypeScript")) throw new Error("Resume parser did not extract skills.");

  const parsedVersion = await request(`/resumes/${resume.id}/versions/from-parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Parsed integration CV", parsed, originalText: pastedText })
  });
  if (parsedVersion.content.metadata.originalText !== pastedText) throw new Error("Parsed resume version did not preserve original text.");

  const analysis = await request("/ats/analyses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: job.id, resumeVersionId: parsedVersion.id })
  });
  if (typeof analysis.scores.keywordCoverage !== "number") throw new Error("ATS analysis did not score keyword coverage.");

  const matches = await request("/matches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: job.id, resumeVersionIds: [resume.currentVersion.id, parsedVersion.id] })
  });
  if (!Array.isArray(matches) || matches.length === 0) throw new Error("Matching did not persist results.");

  const tailored = await request("/ai/tailor-resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: job.id, resumeVersionId: parsedVersion.id })
  });
  if (!tailored.promptHash || !tailored.draft) throw new Error("Tailoring did not return a draft with metadata.");

  const approved = await request("/ai/tailor-resume/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resumeId: resume.id,
      title: "Tailored integration CV",
      draft: tailored.draft,
      sourceVersionId: parsedVersion.id,
      jobId: job.id,
      promptHash: tailored.promptHash,
      metadata: { provider: tailored.provider, model: tailored.model }
    })
  });
  if (approved.content.metadata.source !== "cv_tailoring") throw new Error("Approved tailoring did not create a tailored resume version.");

  const coverLetters = await request("/ai/cover-letters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: job.id,
      resumeVersionId: parsedVersion.id,
      applicationId: application.id,
      tones: ["concise", "narrative", "technical", "recruiter_friendly"]
    })
  });
  if (coverLetters.variants.length !== 4) throw new Error("Cover letter generation did not return all requested variants.");
  if (!coverLetters.variants.every((variant) => Array.isArray(variant.groundedClaims))) throw new Error("Cover letter variants are missing grounded claims.");

  const groundingReviews = await request(`/ai/artifacts/${coverLetters.artifactId}/grounding-reviews`);
  if (!Array.isArray(groundingReviews) || groundingReviews.length === 0) throw new Error("Cover letter generation did not create grounding reviews.");
  const reviewedClaim = await request(`/ai/grounding-reviews/${groundingReviews[0].id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "approved", reviewerNote: "Integration review" })
  });
  if (reviewedClaim.status !== "approved") throw new Error("Grounding review decision was not persisted.");

  const approvedCoverLetter = await request("/ai/cover-letters/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      applicationId: application.id,
      name: "Integration cover letter",
      variant: coverLetters.variants[0],
      jobId: job.id,
      resumeVersionId: parsedVersion.id,
      artifactId: coverLetters.artifactId,
      promptHash: coverLetters.promptHash,
      metadata: { provider: coverLetters.provider, model: coverLetters.model }
    })
  });
  if (approvedCoverLetter.kind !== "cover_letter") throw new Error("Approved cover letter was not persisted as a cover letter document.");

  const [documents, artifacts] = await Promise.all([
    request("/documents?kind=cover_letter"),
    request("/documents/artifacts")
  ]);
  if (!documents.some((item) => item.id === approvedCoverLetter.id)) throw new Error("Approved cover letter was not listed in the document library.");
  if (!artifacts.some((item) => item.id === coverLetters.artifactId)) throw new Error("Cover letter artifact was not listed in generated artifacts.");

  const documentDetail = await request(`/documents/${approvedCoverLetter.id}`);
  if (documentDetail.content.metadata.promptHash !== coverLetters.promptHash) throw new Error("Document detail did not include generation metadata.");

  const unassignedDocument = await request(`/documents/${approvedCoverLetter.id}/application`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applicationId: null })
  });
  if (unassignedDocument.applicationId !== null) throw new Error("Document assignment removal failed.");

  const detail = await request(`/applications/${application.id}`);
  if (detail.id !== application.id) throw new Error("Application detail returned the wrong record.");
  if (!Array.isArray(detail.events)) throw new Error("Application detail did not include events.");
  if (!Array.isArray(detail.analyses)) throw new Error("Application detail did not include ATS analyses.");

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
