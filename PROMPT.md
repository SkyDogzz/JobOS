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

- Generate cover letter drafts from candidate profile, job, and selected resume version.
- Add user-editable drafts and approval state.
- Persist cover letter documents and AI artifact metadata.
- Link cover letters to applications.
- Keep checks green.
- Commit the result.

### v0.4.0 — Job Sources and Search

Implement v0.4.0 job sources and search:

- Add company CRUD and job source metadata.
- Add full-text and trigram search for jobs and companies.
- Add duplicate detection for imported jobs.
- Add frontend search and filtering.
- Keep checks green.
- Commit the result.

### v0.4.1 — Browser Extension Import Contract

Implement v0.4.1 browser extension import contract:

- Add an authenticated API endpoint for browser extension job imports.
- Define request/response contracts for importing the current page.
- Add source URL deduplication and update behavior.
- Document extension integration requirements.
- Keep checks green.
- Commit the result.

### v0.5.0 — Email, Contacts, Interviews, Calendar

Implement v0.5.0 integrations foundation:

- Add contacts CRUD.
- Add interview scheduling records and frontend views.
- Add email classification interfaces for application-related messages.
- Add calendar integration interfaces and sync job placeholders.
- Keep checks green.
- Commit the result.

### v0.6.0 — Analytics

Implement v0.6.0 analytics:

- Add funnel analytics by application stage.
- Add source performance reports.
- Add interview conversion rates.
- Add task SLA metrics.
- Add CV/version usage statistics.
- Keep checks green.
- Commit the result.

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
