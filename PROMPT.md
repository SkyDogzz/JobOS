# JobOS Versioned Implementation Prompts

This file tracks Codex-ready feature prompts by version. Each minor should land in at least one dedicated commit.

## Implemented

### v0.1.0 — Database-Backed JobOS Foundation

Implement v0.1 database-backed JobOS foundation:

- Start Docker Compose services.
- Generate and apply Drizzle migrations.
- Add NestJS `DatabaseModule`.
- Implement repositories and validated CRUD for jobs, resumes, and applications.
- Update frontend dashboard to fetch from the API.
- Keep all checks green.
- Commit the result.

Commit: `7ce4121 Implement database-backed v0.1 foundation`

### v0.1.1 — Interactive Dashboard

Implement v0.1.1 interactive dashboard:

- Add frontend forms for jobs, resumes, and applications.
- Wire form submissions to the existing API.
- Add loading, error, empty, and success states.
- Add a local seed script for demo jobs/resumes/applications.
- Keep checks green.
- Commit the result.

Commit: `80e159a Implement interactive dashboard forms`

### v0.1.2 — Local Dev Polish

Implement v0.1.2 local development polish:

- Add one-command local startup helpers.
- Document the local Docker, migration, dev, seed, and smoke-test workflow.
- Make demo reset/seed flows easy to rerun.
- Keep checks green.
- Commit the result.

Commit: `22f3d21 Add local dev polish`

### v0.1.3 — Application Detail Foundation

Implement v0.1.3 application detail foundation:

- Add an API route for application detail.
- Include job metadata and application event history.
- Add a frontend application detail route.
- Link dashboard pipeline items to application detail pages.
- Keep checks green.
- Commit the result.

Commit: `3f4b303 Add application detail foundation`

### v0.1.4 — Application Stage Updates

Implement v0.1.4 application stage updates:

- Add a validated API route for changing application stages.
- Persist stage-change events.
- Add frontend controls for updating stage from the dashboard and detail page.
- Keep checks green.
- Commit the result.

Commit: `78274dc Add application stage updates`

### v0.1.5 — Application Notes and Tasks

Implement v0.1.5 application notes and tasks:

- Add repositories and validated API routes for application notes.
- Add repositories and validated API routes for application tasks.
- Add application detail UI for notes and tasks.
- Add task completion behavior.
- Keep checks green.
- Commit the result.

Commit: `286791d Add application notes and tasks`

### v0.1.6 — Job and CV List Pages

Implement v0.1.6 job and CV list pages:

- Add `/jobs` and `/resumes` frontend routes.
- Fetch saved jobs and CV versions from the API.
- Link dashboard sections to their full list pages.
- Add empty states.
- Keep checks green.
- Commit the result.

Commit: `14d1964 Add job and CV list pages`

### v0.1.7 — Candidate Profile Foundation

Implement v0.1.7 candidate profile foundation:

- Add validated API routes for reading and updating the candidate profile.
- Persist headline, summary, location, skills, and experience data.
- Add a frontend settings/profile page.
- Link profile editing into the local workflow.
- Keep checks green.
- Commit the result.

Commit: `b4d0ce1 Add candidate profile foundation`

### v0.1.8 — Auth Foundation

Implement v0.1.8 auth foundation:

- Add database-backed users with password hashes.
- Add validated registration, login, logout, and session routes.
- Register cookie handling in NestJS.
- Add frontend login/register UI.
- Document that route protection and user scoping are the next hardening step.
- Keep checks green.
- Commit the result.

Commit: `e7ed93d Add auth foundation`

### v0.1.9 — Manual Job Import

Implement v0.1.9 manual job import workflow:

- Add a frontend route for manually importing pasted job postings.
- Parse pasted job text into title, company, location, source, remote policy, salary, and description fields.
- Let the user review and edit parsed fields before saving.
- Warn on likely duplicates using existing saved jobs.
- Submit confirmed jobs to the existing API.
- Keep checks green.
- Commit the result.

Commit: `a2de54e Add manual job import`

### v0.2.0 — Resume Versioning Workflow

Implement v0.2.0 resume versioning workflow:

- Add API routes for resume detail and creating new resume versions.
- Return resume versions and applications linked to those versions.
- Add a frontend resume detail route.
- Add UI for creating a new immutable resume version.
- Prevent mutating versions attached to applications by only allowing new version creation.
- Add integration smoke coverage for resume detail/version creation.
- Keep checks green.
- Commit the result.

Commit: `4d07264 Add resume versioning workflow`

## Backlog

### v0.2.1 — Resume Parser

Implement v0.2.1 resume parser:

- Add a local resume paste/import workflow.
- Extract summary, skills, experience, education, links, and contact fields into structured JSON.
- Save parsed output as a new resume version after user review.
- Preserve the original pasted text in version content metadata.
- Add validation and integration coverage.
- Keep checks green.
- Commit the result.

Commit: `a11e9f0 Add resume intelligence workflows`

### v0.2.2 — ATS Scanner

Implement v0.2.2 ATS scanner:

- Add ATS analysis records for a job and resume version pair.
- Score keyword coverage, role alignment, missing evidence, and formatting risk.
- Show findings on application and resume detail pages.
- Persist analysis inputs and deterministic outputs.
- Keep checks green.
- Commit the result.

Commit: `a11e9f0 Add resume intelligence workflows`

### v0.2.3 — Job/CV Matching

Implement v0.2.3 job/CV matching:

- Add a matching endpoint that compares saved jobs to resume versions.
- Persist match scores and recommendations.
- Add dashboard and job detail UI for best resume version suggestions.
- Keep checks green.
- Commit the result.

Commit: `a11e9f0 Add resume intelligence workflows`

### v0.3.0 — AI Provider Layer

Implement v0.3.0 AI provider layer:

- Add provider abstraction for OpenAI, Anthropic, and local providers.
- Add configuration for provider keys and model selection.
- Persist provider/model metadata for generated artifacts.
- Add policy checks that prevent generated candidate claims unless grounded in candidate profile or resume data.
- Keep checks green.
- Commit the result.

Commit: `a11e9f0 Add resume intelligence workflows`

### v0.3.1 — CV Tailoring

Implement v0.3.1 CV tailoring:

- Generate tailored CV drafts from a job and source resume version.
- Ground every generated claim in candidate profile or resume content.
- Add diff and approval UI before saving a new resume version.
- Persist prompt hash, source version, target job, and output metadata.
- Keep checks green.
- Commit the result.

Commit: `a11e9f0 Add resume intelligence workflows`

### v0.3.2 — Cover Letters

Implement v0.3.2 cover letters:

- Generate multiple grounded cover letter draft variants from candidate profile, job, and selected resume version.
- Support distinct tones such as concise, narrative, technical, and recruiter-friendly.
- Add user-editable drafts, variant comparison, and approval state.
- Persist cover letter documents and AI artifact metadata.
- Link cover letters to applications.
- Keep checks green.
- Commit the result.

Commit: `50e68e4 Add cover letter variant generation`

### v0.3.3 — Generated Document Library

Implement v0.3.3 generated document library:

- Add document detail pages for approved cover letters and generated artifacts.
- Add filtering by document kind, application, job, provider, model, and approval state.
- Add reuse controls for assigning an approved document to an application.
- Show generation metadata without exposing raw provider secrets.
- Keep checks green.
- Commit and push the result.

Commit: `1192b58 Add generated document library`

### v0.3.4 — Grounding Review Workflow

Implement v0.3.4 grounding review workflow:

- Add a claim review view for generated CV and cover letter drafts.
- Show each generated claim alongside the profile or resume evidence that grounds it.
- Block approval when required evidence is missing or unresolved.
- Persist reviewer decisions, overrides, and audit events.
- Keep checks green.
- Commit and push the result.

Commit: `1629082 Add grounding review workflow`

### v0.4.0 — Job Sources CRUD

Implement v0.4.0 job sources CRUD:

- Add company CRUD with contacts and source attribution.
- Add job source metadata for manual imports, job boards, referrals, and direct company pages.
- Add source health/status fields and frontend management views.
- Add validation and integration coverage for company/source updates.
- Keep checks green.
- Commit and push the result.

Commit: `1f81e5e Add job source management`

### v0.4.1 — Job Search and Filtering

Implement v0.4.1 job search and filtering:

- Add full-text and trigram search for jobs and companies.
- Add filters for company, location, remote policy, salary text, source, application status, and date saved.
- Add frontend search and filtering on saved jobs and dashboard views.
- Persist reusable saved filters for the current user.
- Keep checks green.
- Commit and push the result.

Commit: `f2c44a7 Add job search and saved filters`

### v0.4.2 — Job Board Parsing

Implement v0.4.2 job board parsing:

- Add deterministic parser adapters for Greenhouse, Lever, Ashby, Workday-style pages, LinkedIn pasted HTML, and Indeed pasted HTML.
- Add a `POST /job-sources/parse` endpoint that accepts pasted URL and/or HTML.
- Extract title, company, location, description, source URL, source name, remote policy, and salary text.
- Add frontend paste/import review UI before saving the parsed job.
- Add parser fixtures and integration coverage for representative job boards.
- Keep checks green.
- Commit and push the result.

Commit: `3d72f43 Add job board parsing workflow`

### v0.4.3 — Job Deduplication

Implement v0.4.3 job deduplication:

- Add duplicate detection for imported jobs using source URL, company/title similarity, and normalized description fingerprints.
- Add merge/update behavior for duplicate imports.
- Add UI to review potential duplicates before merging.
- Add integration coverage for exact and fuzzy duplicate cases.
- Keep checks green.
- Commit and push the result.

Commit: `886f9e6 Add job deduplication workflow`

### v0.4.4 — Browser Extension Import Contract

Implement v0.4.4 browser extension import contract:

- Add an authenticated API endpoint for browser extension job imports.
- Define request/response contracts for importing the current page.
- Add source URL deduplication and update behavior.
- Document extension integration requirements.
- Keep checks green.
- Commit and push the result.

Commit: `eb59afd Add browser extension import contract`

### v0.4.5 — Browser Extension Companion App

Implement v0.4.5 browser extension companion app:

- Add a minimal extension package or documented scaffold for saving the current job page into JobOS.
- Add local development instructions for extension authentication and API URL configuration.
- Add fixtures for common ATS job page payloads.
- Add smoke coverage for the import contract using fixture payloads.
- Keep checks green.
- Commit and push the result.

Commit: `b64cd24 Add browser extension companion app`

### v0.5.0 — Contacts and Recruiters

Implement v0.5.0 contacts and recruiters:

- Add full contacts CRUD with company links and application links.
- Add recruiter/contact notes and follow-up reminders.
- Show contacts on company, job, and application detail pages.
- Add integration coverage for contact lifecycle flows.
- Keep checks green.
- Commit and push the result.

Commit: `c787aad Add contacts and recruiter workflows`

### v0.5.1 — Interviews

Implement v0.5.1 interviews:

- Add interview scheduling records with format, location, participants, preparation notes, and outcome.
- Add frontend interview list and application detail interview timeline.
- Add task generation for interview preparation follow-ups.
- Add integration coverage for interview CRUD and application linking.
- Keep checks green.
- Commit and push the result.

Commit: `7574b01 Add interview scheduling workflow`

### v0.5.2 — Email Sync Foundation

Implement v0.5.2 email sync foundation:

- Add email integration connection records and sync job placeholders.
- Add email classification interfaces for application-related messages.
- Persist inbound message metadata, provider IDs, classification state, and linked application IDs.
- Add privacy controls for excluding message bodies from storage.
- Keep checks green.
- Commit and push the result.

Commit: `1d795a9 Add email sync foundation`

### v0.5.3 — Calendar Integration Foundation

Implement v0.5.3 calendar integration foundation:

- Add calendar connection records and sync job placeholders.
- Add calendar event metadata for interviews and follow-ups.
- Add conflict/status indicators on interview detail views.
- Add integration coverage for calendar event linking.
- Keep checks green.
- Commit and push the result.

Commit: `d902280 Add calendar integration foundation`

### v0.6.0 — Funnel Analytics

Implement v0.6.0 funnel analytics:

- Add funnel analytics by application stage.
- Add dashboard charts and summary cards for stage counts and aging.
- Add filters by source, company, date range, and resume version.
- Add integration coverage for analytics aggregation.
- Keep checks green.
- Commit and push the result.

Commit: `40bf7d1 Add funnel analytics`

### v0.6.1 — Source Performance Analytics

Implement v0.6.1 source performance analytics:

- Add source performance reports.
- Add response, interview, offer, and rejection rates by source.
- Add source quality notes and ranking UI.
- Add integration coverage for source performance calculations.
- Keep checks green.
- Commit and push the result.

### v0.6.2 — Interview and Task Analytics

Implement v0.6.2 interview and task analytics:

- Add interview conversion rates.
- Add task SLA metrics.
- Add overdue, completed, and upcoming task reporting.
- Add dashboard views for follow-up discipline and interview outcomes.
- Keep checks green.
- Commit and push the result.

### v0.6.3 — Document Performance Analytics

Implement v0.6.3 document performance analytics:

- Add CV/version usage statistics.
- Add cover letter usage and outcome statistics.
- Show which resume versions and generated documents are linked to successful stages.
- Add integration coverage for document performance aggregation.
- Keep checks green.
- Commit and push the result.

### v0.7.0 — Notifications and Reminders

Implement v0.7.0 notifications and reminders:

- Add notification preference records and reminder delivery placeholders.
- Add due-soon and overdue task notifications.
- Add application follow-up reminder suggestions.
- Add frontend notification center.
- Keep checks green.
- Commit and push the result.

### v0.7.1 — Audit and Activity Feed

Implement v0.7.1 audit and activity feed:

- Add audit events for user-visible create, update, delete, import, generation, and approval actions.
- Add application and dashboard activity feeds.
- Add filters by event type and related entity.
- Add integration coverage for audit event creation.
- Keep checks green.
- Commit and push the result.

### v0.8.0 — Settings and Preferences

Implement v0.8.0 settings and preferences:

- Add user settings for timezone, job search preferences, notification preferences, and AI defaults.
- Add frontend settings pages with validation.
- Use preferences in matching, reminders, and generated document defaults.
- Add integration coverage for settings persistence.
- Keep checks green.
- Commit and push the result.

### v0.8.1 — Data Export

Implement v0.8.1 data export:

- Add account export endpoints for profile, jobs, applications, resumes, documents, notes, tasks, and AI artifacts.
- Generate machine-readable JSON export bundles.
- Add UI to request and download exports.
- Add integration coverage for export completeness.
- Keep checks green.
- Commit and push the result.

### v0.8.2 — Account Deletion and Privacy Controls

Implement v0.8.2 account deletion and privacy controls:

- Add account deletion workflow with confirmation and retention safeguards.
- Add privacy controls for AI artifacts, email bodies, and generated documents.
- Add redaction helpers for sensitive fields in logs and exports.
- Add integration coverage for deletion and privacy settings.
- Keep checks green.
- Commit and push the result.

### v0.9.0 — Public Beta Hardening

Implement v0.9.0 public beta hardening:

- Add security review fixes and privacy controls.
- Add account export and deletion workflows.
- Add rate limiting and monitoring.
- Add backup/restore verification documentation.
- Add onboarding flow.
- Keep checks green.
- Commit the result.

### v1.0.0 — Production Release

Implement v1.0.0 production release:

- Add production Docker images and deployment documentation.
- Add OpenTelemetry traces, Sentry, Prometheus metrics, and audit logs.
- Finalize billing hooks if enabled.
- Verify backup, restore, privacy, and account lifecycle flows.
- Run full release checks.
- Commit and tag the result.
