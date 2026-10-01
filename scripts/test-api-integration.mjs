import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const apiUrl = process.env.API_URL ?? "http://localhost:4000";
const extensionToken = process.env.EXTENSION_IMPORT_TOKEN ?? "jobos-dev-extension-token";
const extensionFixturesDir = new URL("../apps/extension/fixtures", import.meta.url);

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
    body: JSON.stringify({ companyId: company.id, name: "Integration Recruiter", title: "Recruiter", email: "recruiter@example.com", notes: "Initial recruiter note" })
  });
  if (!contact.id) throw new Error("Contact creation failed.");
  const followUpAt = new Date(Date.now() + 86400000).toISOString();
  const updatedContact = await request(`/contacts/${contact.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId: company.id, name: "Integration Recruiter", title: "Senior Recruiter", email: "recruiter@example.com", notes: "Follow up after screen.", followUpAt })
  });
  if (updatedContact.title !== "Senior Recruiter" || !updatedContact.followUpAt) throw new Error("Contact update or follow-up reminder failed.");
  const contactDetail = await request(`/contacts/${contact.id}`);
  if (contactDetail.companyName !== company.name) throw new Error("Contact detail did not include company context.");

  const attributedJob = await request("/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Attributed Integration Role",
      companyName: company.name,
      description: "Validate source attribution.",
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: "https://jobs.example.com/attributed-integration-role"
    })
  });
  const attributedDetail = await request(`/jobs/${attributedJob.id}`);
  if (attributedDetail.sourceId !== source.id) throw new Error("Job source attribution was not persisted.");
  if (!attributedDetail.contacts.some((item) => item.id === contact.id)) throw new Error("Job detail did not include company contacts.");
  const companyDetail = await request(`/companies/${company.id}`);
  if (!companyDetail.contacts.some((item) => item.id === contact.id)) throw new Error("Company detail did not include contacts.");
  if (!companyDetail.jobs.some((item) => item.id === attributedJob.id)) throw new Error("Company detail did not include jobs.");

  const exactDuplicates = await request("/jobs/dedupe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Attributed Integration Role",
      companyName: company.name,
      description: "Validate source attribution.",
      sourceUrl: "https://jobs.example.com/attributed-integration-role",
      sourceName: source.name
    })
  });
  if (!exactDuplicates.some((item) => item.id === attributedJob.id && item.duplicateReasons.includes("Exact source URL match"))) {
    throw new Error("Exact job duplicate was not detected.");
  }

  const fuzzyJob = await request("/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Senior Duplicate Engineer",
      companyName: "FuzzyCo Integration",
      description: "Build duplicate detection pipelines with TypeScript, scoring, normalization, and review workflows.",
      location: "Remote"
    })
  });
  const fuzzyDuplicates = await request("/jobs/dedupe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Senior Duplicate Engineer",
      companyName: "FuzzyCo Integration",
      description: "Build duplicate detection pipelines with TypeScript normalization scoring and user review workflows.",
      location: "Remote"
    })
  });
  if (!fuzzyDuplicates.some((item) => item.id === fuzzyJob.id && item.duplicateReasons.includes("Similar description fingerprint"))) {
    throw new Error("Fuzzy job duplicate was not detected.");
  }

  const mergedJob = await request(`/jobs/${fuzzyJob.id}/merge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      incoming: {
        title: "Senior Duplicate Engineer",
        companyName: "FuzzyCo Integration",
        description: "Updated duplicate import with richer salary context.",
        location: "Hybrid",
        salaryText: "$150k - $175k"
      },
      strategy: "update_existing"
    })
  });
  if (mergedJob.location !== "Hybrid" || mergedJob.salaryText !== "$150k - $175k") throw new Error("Duplicate merge did not update the existing job.");

  const unauthorizedImport = await fetch(`${apiUrl}/jobs/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pageUrl: "https://boards.greenhouse.io/extension/jobs/unauthorized",
      html: "<html><body><h1>Unauthorized Import</h1><p>Should fail authentication.</p></body></html>"
    })
  });
  if (unauthorizedImport.status !== 401) throw new Error("Extension import endpoint did not require authentication.");

  const extensionPageUrl = `https://boards.greenhouse.io/extensionco/jobs/${Date.now()}`;
  const extensionImport = await request("/jobs/import", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer jobos-dev-extension-token" },
    body: JSON.stringify({
      contractVersion: "0.4.4",
      pageUrl: extensionPageUrl,
      html: `<html><head><meta property="og:title" content="Extension Import Engineer"><script type="application/ld+json">{"@type":"JobPosting","title":"Extension Import Engineer","hiringOrganization":{"name":"ExtensionCo"},"jobLocation":{"address":{"addressLocality":"Remote"}},"description":"Import current browser pages into JobOS with deterministic contracts."}</script></head><body>Extension payload</body></html>`,
      sourceName: "browser_extension"
    })
  });
  if (extensionImport.status !== "created") throw new Error("Extension import did not create a job.");
  if (extensionImport.parsed.sourceUrl !== extensionPageUrl) throw new Error("Extension import did not preserve the page URL.");

  const extensionUpdate = await request("/jobs/import", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer jobos-dev-extension-token" },
    body: JSON.stringify({
      contractVersion: "0.4.4",
      pageUrl: extensionPageUrl,
      title: "Extension Import Engineer",
      companyName: "ExtensionCo",
      description: "Updated browser extension import with salary.",
      salaryText: "$130k - $160k",
      sourceName: "browser_extension"
    })
  });
  if (extensionUpdate.status !== "updated") throw new Error("Extension import did not update a duplicate source URL.");
  if (extensionUpdate.job.id !== extensionImport.job.id) throw new Error("Extension import update created a duplicate job.");
  if (extensionUpdate.job.salaryText !== "$130k - $160k") throw new Error("Extension import update did not persist changed fields.");

  for (const file of readdirSync(extensionFixturesDir).filter((name) => name.endsWith(".json")).sort()) {
    const payload = JSON.parse(readFileSync(join(extensionFixturesDir.pathname, file), "utf8"));
    const fixtureImport = await request("/jobs/import", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${extensionToken}` },
      body: JSON.stringify(payload)
    });
    if (!["created", "updated"].includes(fixtureImport.status)) throw new Error(`${file} extension fixture import failed.`);
    const fixtureUpdate = await request("/jobs/import", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${extensionToken}` },
      body: JSON.stringify(payload)
    });
    if (fixtureUpdate.status !== "updated") throw new Error(`${file} extension fixture did not update on repeat import.`);
    if (fixtureUpdate.job.id !== fixtureImport.job.id) throw new Error(`${file} extension fixture created a duplicate job.`);
  }

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
  const linkedContact = await request(`/contacts/${contact.id}/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applicationId: application.id, relationship: "recruiter", notes: "Primary application contact" })
  });
  if (linkedContact.applicationId !== application.id) throw new Error("Contact was not linked to application.");

  const [jobs, resumes, applications] = await Promise.all([
    request("/jobs"),
    request("/resumes"),
    request("/applications")
  ]);

  if (!jobs.some((item) => item.id === job.id)) throw new Error("Created job not found in list.");
  if (!resumes.some((item) => item.id === resume.id)) throw new Error("Created resume not found in list.");
  if (!applications.some((item) => item.id === application.id)) throw new Error("Created application not found in list.");

  const applicationContactDetail = await request(`/applications/${application.id}`);
  if (!applicationContactDetail.contacts.some((item) => item.id === contact.id && item.relationship === "recruiter")) {
    throw new Error("Application detail did not include linked contact.");
  }

  const interviewStartsAt = new Date(Date.now() + 172800000).toISOString();
  const interview = await request("/interviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      applicationId: application.id,
      startsAt: interviewStartsAt,
      format: "video",
      location: "https://meet.example.com/integration",
      participants: ["Integration Recruiter", "Hiring Manager"],
      preparationNotes: "Review integration flow and saved job context."
    })
  });
  if (interview.applicationId !== application.id || interview.participants.length !== 2) throw new Error("Interview creation failed.");
  const applicationInterviews = await request(`/applications/${application.id}/interviews`);
  if (!applicationInterviews.some((item) => item.id === interview.id)) throw new Error("Application interview list did not include the scheduled interview.");
  const allInterviews = await request("/interviews");
  if (!allInterviews.some((item) => item.id === interview.id)) throw new Error("Interview list did not include the scheduled interview.");
  const generatedTasks = await request(`/applications/${application.id}/tasks`);
  if (!generatedTasks.some((item) => item.title.includes("Prepare for video interview"))) {
    throw new Error("Interview scheduling did not generate a preparation task.");
  }
  const updatedInterview = await request(`/interviews/${interview.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      applicationId: application.id,
      startsAt: interviewStartsAt,
      format: "video",
      location: "https://meet.example.com/integration",
      participants: ["Integration Recruiter", "Hiring Manager"],
      preparationNotes: "Review integration flow and saved job context.",
      outcome: "Moved to final round"
    })
  });
  if (updatedInterview.outcome !== "Moved to final round") throw new Error("Interview update did not persist outcome.");
  const tempInterview = await request("/interviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applicationId: application.id, startsAt: new Date(Date.now() + 259200000).toISOString(), format: "phone" })
  });
  const deletedInterview = await fetch(`${apiUrl}/interviews/${tempInterview.id}`, { method: "DELETE" });
  if (!deletedInterview.ok) throw new Error("Interview delete failed.");

  const emailConnection = await request("/integrations/email/connections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider: "gmail", accountEmail: "integration-inbox@example.com", excludeBodies: true })
  });
  if (!emailConnection.id || emailConnection.excludeBodies !== true) throw new Error("Email connection creation failed.");
  const emailSyncJob = await request("/integrations/email/sync-jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ connectionId: emailConnection.id, cursor: "integration-cursor" })
  });
  if (emailSyncJob.status !== "queued") throw new Error("Email sync placeholder was not queued.");
  const emailMessage = await request("/integrations/email/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      connectionId: emailConnection.id,
      applicationId: application.id,
      providerMessageId: `integration-message-${Date.now()}`,
      fromAddress: "recruiter@example.com",
      toAddresses: ["integration-inbox@example.com"],
      subject: "Interview invitation",
      snippet: "We would like to schedule an interview.",
      body: "Sensitive message body",
      receivedAt: new Date().toISOString()
    })
  });
  if (emailMessage.body !== null) throw new Error("Email privacy control did not exclude message body storage.");
  if (emailMessage.classification !== "interview") throw new Error("Email metadata classification failed.");
  const reviewedEmail = await request(`/integrations/email/messages/${emailMessage.id}/classification`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ classification: "application_related", classificationReason: "Linked to integration application.", applicationId: application.id })
  });
  if (reviewedEmail.classification !== "application_related" || reviewedEmail.applicationId !== application.id) {
    throw new Error("Email classification review failed.");
  }
  const [emailConnections, emailJobs, emailMessages] = await Promise.all([
    request("/integrations/email/connections"),
    request("/integrations/email/sync-jobs"),
    request("/integrations/email/messages")
  ]);
  if (!emailConnections.some((item) => item.id === emailConnection.id)) throw new Error("Email connection was not listed.");
  if (!emailJobs.some((item) => item.id === emailSyncJob.id)) throw new Error("Email sync job was not listed.");
  if (!emailMessages.some((item) => item.id === emailMessage.id)) throw new Error("Email message was not listed.");

  const resumeDetail = await request(`/resumes/${resume.id}`);
  if (resumeDetail.id !== resume.id) throw new Error("Resume detail returned the wrong record.");
  if (!resumeDetail.versions.some((item) => item.id === resume.currentVersion.id)) throw new Error("Resume detail did not include the initial version.");
  if (!resumeDetail.applications.some((item) => item.id === application.id)) throw new Error("Resume detail did not include linked applications.");

  const tempContact = await request("/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId: company.id, name: "Temporary Recruiter", email: "temp-recruiter@example.com" })
  });
  const deletedContact = await fetch(`${apiUrl}/contacts/${tempContact.id}`, { method: "DELETE" });
  if (!deletedContact.ok) throw new Error("Contact delete failed.");

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
