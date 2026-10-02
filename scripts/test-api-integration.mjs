import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const apiUrl = process.env.API_URL ?? "http://localhost:4000";
const extensionToken = process.env.EXTENSION_IMPORT_TOKEN ?? "jobos-dev-extension-token";
const extensionFixturesDir = new URL("../apps/extension/fixtures", import.meta.url);
const productVersion = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;
let sessionCookie = "";

async function request(path, options) {
  const headers = new Headers(options?.headers);
  if (sessionCookie && !headers.has("Cookie")) headers.set("Cookie", sessionCookie);
  const response = await fetch(`${apiUrl}${path}`, { ...options, headers });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) sessionCookie = setCookie.split(";")[0];

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
  const metrics = await request("/health/metrics");
  if (metrics.version !== productVersion || typeof metrics.monitoring.rateLimitMax !== "number") {
    throw new Error("Health metrics did not expose monitoring data.");
  }
  const prometheusMetrics = await fetch(`${apiUrl}/health/metrics/prometheus`).then((response) => response.text());
  if (!prometheusMetrics.includes("jobos_api_uptime_seconds")) throw new Error("Prometheus metrics were not exposed.");

  const primaryEmail = `integration-primary-${Date.now()}@jobos.local`;
  const primaryAuth = await request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: primaryEmail, password: "password123", name: "Primary Integration User" })
  });
  if (primaryAuth.user.email !== primaryEmail) throw new Error("Primary auth registration failed.");
  const primarySession = sessionCookie;

  const secondaryEmail = `integration-secondary-${Date.now()}@jobos.local`;
  const secondaryAuth = await request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: secondaryEmail, password: "password123", name: "Secondary Integration User" })
  });
  if (secondaryAuth.user.email !== secondaryEmail) throw new Error("Secondary auth registration failed.");
  const secondarySession = sessionCookie;

  const privateJob = await request("/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: secondarySession },
    body: JSON.stringify({
      title: "Private Secondary Role",
      companyName: "Secondary Only Co",
      description: "This job should not be visible to the primary user.",
      location: "Remote",
      sourceName: "integration-test"
    })
  });
  sessionCookie = primarySession;
  const primaryJobsBefore = await request("/jobs");
  if (primaryJobsBefore.some((item) => item.id === privateJob.id)) throw new Error("Primary user could list a secondary user's job.");
  const privateJobDetail = await fetch(`${apiUrl}/jobs/${privateJob.id}`, { headers: { Cookie: primarySession } });
  if (privateJobDetail.ok) throw new Error("Primary user could read a secondary user's job detail.");

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

  const sourceAnalyticsApplication = await request("/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobId: attributedJob.id,
      stage: "interviewing"
    })
  });
  if (sourceAnalyticsApplication.stage !== "interviewing") throw new Error("Source analytics fixture application was not created.");
  const sourcePerformance = await request("/analytics/sources");
  const integrationSourcePerformance = sourcePerformance.sources.find((item) => item.sourceId === source.id);
  if (!integrationSourcePerformance) throw new Error("Source performance analytics did not include the integration source.");
  if (integrationSourcePerformance.interviewRate < 1) throw new Error("Source performance analytics did not calculate interview rate.");
  if (!integrationSourcePerformance.qualityNote) throw new Error("Source performance analytics did not include source quality notes.");

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
  const deletedInterview = await fetch(`${apiUrl}/interviews/${tempInterview.id}`, { method: "DELETE", headers: { Cookie: sessionCookie } });
  if (!deletedInterview.ok) throw new Error("Interview delete failed.");

  const emailConnection = await request("/integrations/email/connections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "gmail",
      accountEmail: "integration-inbox@example.com",
      excludeBodies: true,
      syncState: {
        providerMessages: [{
          providerMessageId: `provider-message-${Date.now()}`,
          threadId: "provider-thread-1",
          fromAddress: "recruiter@example.com",
          toAddresses: ["integration-inbox@example.com"],
          subject: "Interview invitation",
          snippet: "We would like to schedule an interview.",
          body: "Sensitive provider body",
          receivedAt: new Date().toISOString(),
          metadata: { applicationId: application.id }
        }]
      }
    })
  });
  if (!emailConnection.id || emailConnection.excludeBodies !== true) throw new Error("Email connection creation failed.");
  const emailSyncJob = await request("/integrations/email/sync-jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ connectionId: emailConnection.id, cursor: "integration-cursor" })
  });
  if (emailSyncJob.status !== "completed" || !emailSyncJob.finishedAt) throw new Error("Email provider sync did not complete.");
  const syncedEmailMessages = await request("/integrations/email/messages");
  const syncedEmailMessage = syncedEmailMessages.find((item) => item.threadId === "provider-thread-1");
  if (!syncedEmailMessage) throw new Error("Email provider sync did not import a message.");
  if (syncedEmailMessage.body !== null) throw new Error("Email provider sync did not honor body exclusion.");
  if (syncedEmailMessage.classification !== "interview" || syncedEmailMessage.applicationId !== application.id) {
    throw new Error("Email provider sync did not classify or link imported message.");
  }
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

  const calendarConnection = await request("/integrations/calendar/connections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "google_calendar",
      accountEmail: "integration-calendar@example.com",
      calendarName: "JobOS Interviews",
      syncState: {
        providerEvents: [{
          interviewId: interview.id,
          providerEventId: `calendar-event-${Date.now()}`,
          title: "Integration interview",
          startsAt: interviewStartsAt,
          endsAt: new Date(new Date(interviewStartsAt).getTime() + 3600000).toISOString(),
          location: "https://meet.example.com/integration",
          status: "confirmed",
          metadata: { conflict: true, source: "integration-test" }
        }]
      }
    })
  });
  if (!calendarConnection.id) throw new Error("Calendar connection creation failed.");
  const staleCalendarEvent = await request("/integrations/calendar/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      connectionId: calendarConnection.id,
      providerEventId: `stale-calendar-event-${Date.now()}`,
      title: "Old hold",
      startsAt: new Date(new Date(interviewStartsAt).getTime() + 7200000).toISOString(),
      status: "confirmed",
      conflictStatus: "clear",
      metadata: { source: "stale-seed" }
    })
  });
  const calendarSyncJob = await request("/integrations/calendar/sync-jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ connectionId: calendarConnection.id, cursor: "calendar-cursor" })
  });
  if (calendarSyncJob.status !== "completed" || !calendarSyncJob.finishedAt) throw new Error("Calendar provider sync did not complete.");
  const syncedEvents = await request("/integrations/calendar/events");
  const calendarEvent = syncedEvents.find((item) => item.interviewId === interview.id);
  const staleSyncedEvent = syncedEvents.find((item) => item.id === staleCalendarEvent.id);
  if (!calendarEvent) throw new Error("Calendar provider sync did not import the interview event.");
  if (calendarEvent.interviewId !== interview.id || calendarEvent.conflictStatus !== "conflict") {
    throw new Error("Calendar event did not link to interview with conflict status.");
  }
  if (staleSyncedEvent?.status !== "cancelled" || staleSyncedEvent.conflictStatus !== "stale") {
    throw new Error("Calendar sync did not mark missing provider events as stale.");
  }
  const interviewWithCalendar = await request(`/interviews/${interview.id}`);
  if (interviewWithCalendar.calendarConflictStatus !== "conflict") {
    throw new Error("Interview detail did not expose calendar conflict status.");
  }
  const [calendarConnections, calendarJobs, calendarEvents] = await Promise.all([
    request("/integrations/calendar/connections"),
    request("/integrations/calendar/sync-jobs"),
    request("/integrations/calendar/events")
  ]);
  if (!calendarConnections.some((item) => item.id === calendarConnection.id)) throw new Error("Calendar connection was not listed.");
  if (!calendarJobs.some((item) => item.id === calendarSyncJob.id)) throw new Error("Calendar sync job was not listed.");
  if (!calendarEvents.some((item) => item.id === calendarEvent.id)) throw new Error("Calendar event was not listed.");

  const resumeDetail = await request(`/resumes/${resume.id}`);
  if (resumeDetail.id !== resume.id) throw new Error("Resume detail returned the wrong record.");
  if (!resumeDetail.versions.some((item) => item.id === resume.currentVersion.id)) throw new Error("Resume detail did not include the initial version.");
  if (!resumeDetail.applications.some((item) => item.id === application.id)) throw new Error("Resume detail did not include linked applications.");

  const tempContact = await request("/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyId: company.id, name: "Temporary Recruiter", email: "temp-recruiter@example.com" })
  });
  const deletedContact = await fetch(`${apiUrl}/contacts/${tempContact.id}`, { method: "DELETE", headers: { Cookie: sessionCookie } });
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
  if (!tailored.qualityReview?.rubric || !tailored.qualityReview.riskLevel) throw new Error("Tailoring did not return a quality review.");

  const riskyResumeApproval = await fetch(`${apiUrl}/ai/tailor-resume/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sessionCookie },
    body: JSON.stringify({
      resumeId: resume.id,
      title: "Risky tailored integration CV",
      draft: tailored.draft,
      sourceVersionId: parsedVersion.id,
      jobId: job.id,
      promptHash: tailored.promptHash,
      metadata: { qualityReview: { riskLevel: "high" } }
    })
  });
  if (riskyResumeApproval.ok) throw new Error("High-risk resume approval was not blocked.");

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
      metadata: { provider: tailored.provider, model: tailored.model, qualityReview: tailored.qualityReview }
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
  if (!coverLetters.variants.every((variant) => variant.qualityReview?.rubric)) throw new Error("Cover letter variants are missing quality reviews.");

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
      metadata: { provider: coverLetters.provider, model: coverLetters.model, qualityReview: coverLetters.variants[0].qualityReview }
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

  const sharePacket = await request(`/applications/${application.id}/share-packets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audience: "mentor",
      recipientName: "Integration Mentor",
      recipientEmail: "mentor@example.com",
      expiresAt: new Date(Date.now() + 86400000).toISOString()
    })
  });
  if (!sharePacket.token || sharePacket.applicationId !== application.id) throw new Error("Share packet was not created for the application.");
  const secondaryShareList = await request(`/applications/${application.id}/share-packets`, {
    headers: { Cookie: secondarySession }
  });
  if (secondaryShareList.length !== 0) throw new Error("Secondary user could list another user's share packets.");
  const sharedView = await request(`/shares/${sharePacket.token}`);
  if (sharedView.application.id !== application.id || sharedView.packet.token) throw new Error("Shared packet did not expose the read-only application view.");
  const reviewerComment = await request(`/shares/${sharePacket.token}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ authorName: "Integration Mentor", targetType: "application", body: "Clarify the recruiter follow-up plan." })
  });
  if (reviewerComment.applicationId !== application.id || reviewerComment.targetType !== "application") throw new Error("Reviewer comment was not attached to the shared application.");
  const sharedViewWithComment = await request(`/shares/${sharePacket.token}`);
  if (!sharedViewWithComment.comments.some((item) => item.id === reviewerComment.id)) throw new Error("Shared packet did not include reviewer comments.");
  const revokedShare = await request(`/applications/share-packets/${sharePacket.id}/revoke`, { method: "POST" });
  if (!revokedShare.revokedAt) throw new Error("Share packet revocation did not set revokedAt.");
  const revokedView = await fetch(`${apiUrl}/shares/${sharePacket.token}`);
  if (revokedView.status !== 410) throw new Error("Revoked share link was not blocked.");
  const expiredShare = await request(`/applications/${application.id}/share-packets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audience: "trusted_reviewer",
      recipientName: "Expired Reviewer",
      expiresAt: new Date(Date.now() - 60000).toISOString()
    })
  });
  const expiredView = await fetch(`${apiUrl}/shares/${expiredShare.token}`);
  if (expiredView.status !== 410) throw new Error("Expired share link was not blocked.");

  const auditEvents = await request("/audit/events");
  if (!auditEvents.some((item) => item.applicationId === application.id && item.eventType === "created")) {
    throw new Error("Audit feed did not include application creation.");
  }
  if (!auditEvents.some((item) => item.applicationId === application.id && item.eventType === "share_commented")) {
    throw new Error("Audit feed did not include reviewer comment activity.");
  }
  const filteredAuditEvents = await request(`/audit/events?applicationId=${application.id}&relatedEntity=application`);
  if (!filteredAuditEvents.every((item) => item.applicationId === application.id && item.relatedEntity === "application")) {
    throw new Error("Audit feed filters did not constrain application events.");
  }

  const updated = await request(`/applications/${application.id}/stage`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stage: "interviewing" })
  });
  if (updated.stage !== "interviewing") throw new Error("Application stage update failed.");

  const funnelAnalytics = await request("/analytics/funnel");
  if (!funnelAnalytics.stageCounts.some((item) => item.stage === "interviewing" && item.count >= 1)) {
    throw new Error("Funnel analytics did not aggregate application stages.");
  }
  const filteredFunnel = await request(`/analytics/funnel?sourceId=${source.id}`);
  if (typeof filteredFunnel.totalApplications !== "number") throw new Error("Filtered funnel analytics did not return totals.");
  const operationsAnalytics = await request("/analytics/operations");
  if (typeof operationsAnalytics.interviews.interviewConversionRate !== "number") {
    throw new Error("Interview analytics did not return conversion metrics.");
  }
  if (typeof operationsAnalytics.tasks.completionRate !== "number") {
    throw new Error("Task analytics did not return completion metrics.");
  }
  const documentAnalytics = await request("/analytics/documents");
  if (!Array.isArray(documentAnalytics.resumeVersions)) {
    throw new Error("Document performance analytics did not return resume version usage.");
  }
  if (!Array.isArray(documentAnalytics.documents)) {
    throw new Error("Document performance analytics did not return document usage.");
  }

  const note = await request(`/applications/${application.id}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body: "Integration note" })
  });
  if (!note.id) throw new Error("Note creation failed.");

  const task = await request(`/applications/${application.id}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Integration task", dueAt: new Date(Date.now() + 86400000).toISOString() })
  });
  const notificationPreferences = await request("/notifications/preferences");
  if (notificationPreferences.deliveryChannel !== "in_app") throw new Error("Notification preferences were not initialized.");
  const updatedNotificationPreferences = await request("/notifications/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dueSoonDays: 5, taskRemindersEnabled: true, followUpSuggestionsEnabled: true })
  });
  if (updatedNotificationPreferences.dueSoonDays !== 5) throw new Error("Notification preferences update failed.");
  const settings = await request("/settings");
  if (!settings.timezone || !settings.defaultAiProvider || !settings.notificationPreferences) throw new Error("User settings were not initialized.");
  const updatedSettings = await request("/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      timezone: "America/New_York",
      preferredLocations: ["Remote", "New York"],
      remotePreference: "remote",
      minimumSalary: "$140k",
      preferredSources: ["referral", "company_page"],
      defaultAiProvider: "local",
      defaultAiModel: "deterministic-v2",
      redactSensitiveExports: true,
      storeEmailBodies: false,
      aiArtifactRetention: "redact_on_export",
      notificationPreferences: { dueSoonDays: 2, deliveryChannel: "in_app" }
    })
  });
  if (updatedSettings.timezone !== "America/New_York") throw new Error("User settings update failed.");
  if (!updatedSettings.preferredLocations.includes("Remote")) throw new Error("Job search preferences were not persisted.");
  if (updatedSettings.defaultAiModel !== "deterministic-v2") throw new Error("AI defaults were not persisted.");
  if (updatedSettings.notificationPreferences.dueSoonDays !== 2) throw new Error("Settings endpoint did not update notification preferences.");
  if (updatedSettings.aiArtifactRetention !== "redact_on_export") throw new Error("Privacy controls were not persisted.");
  const exportBundle = await request("/account/export");
  if (exportBundle.formatVersion !== "0.8.2") throw new Error("Account export returned the wrong format version.");
  if (exportBundle.user.email !== "[redacted]") throw new Error("Account export did not redact sensitive user fields.");
  if (!exportBundle.jobs.some((item) => item.id === job.id)) throw new Error("Account export did not include jobs.");
  if (!exportBundle.applications.some((item) => item.id === application.id)) throw new Error("Account export did not include applications.");
  if (!exportBundle.resumes.some((item) => item.id === resume.id)) throw new Error("Account export did not include resumes.");
  if (!exportBundle.documents.some((item) => item.id === approvedCoverLetter.id)) throw new Error("Account export did not include documents.");
  if (!exportBundle.aiArtifacts.some((item) => item.id === coverLetters.artifactId)) throw new Error("Account export did not include AI artifacts.");
  const deletionPreview = await request("/account", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmEmail: primaryEmail, dryRun: true })
  });
  if (deletionPreview.status !== "dry_run" || deletionPreview.deleted !== false) throw new Error("Account deletion dry run failed.");
  if (deletionPreview.counts.applications < 1) throw new Error("Account deletion preview did not include lifecycle counts.");
  const regeneratedNotifications = await request("/notifications/regenerate", { method: "POST" });
  if (typeof regeneratedNotifications.created !== "number") throw new Error("Notification regeneration did not return a count.");
  const notifications = await request("/notifications");
  if (!notifications.some((item) => item.taskId === task.id && item.kind === "task_due_soon")) throw new Error("Task reminder notification was not generated.");
  const readNotification = await request(`/notifications/${notifications[0].id}/read`, { method: "PATCH" });
  if (readNotification.status !== "read") throw new Error("Notification read state failed.");
  const completed = await request(`/tasks/${task.id}/complete`, { method: "PATCH" });
  if (completed.status !== "done") throw new Error("Task completion failed.");

  const profile = await request("/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ headline: "Integration Candidate", skills: "TypeScript, PostgreSQL" })
  });
  if (profile.headline !== "Integration Candidate") throw new Error("Profile upsert failed.");

  console.log("API integration tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
