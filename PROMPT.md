# JobOS Versioned Implementation Prompts

This file tracks Codex-ready feature prompts by version. Each minor should land in at least one dedicated commit.

## v2 Roadmap Execution Prompt

Use this prompt to implement the roadmap from the next incomplete v1.x minor through v2.0.0.

```text
Implement the JobOS roadmap one minor version at a time from PROMPT.md, starting at the first incomplete entry after the latest recorded commit and continuing through v2.0.0.

Operating rules:
- Work strictly in version order.
- Complete exactly one minor at a time before starting the next.
- Preserve existing user changes. Do not reset, revert, overwrite unrelated work, or use destructive git commands.
- Prefer deterministic/local foundations over real third-party integrations unless credentials and provider setup already exist.
- Ask the user whenever a feature requires external setup, secrets, provider accounts, domains, billing products, email sender configuration, deployment targets, or production behavior choices. Continue with safe local fakes/placeholders only when the feature can remain deterministic without blocking that setup.
- Add database migrations when schema changes are needed.
- Add API integration coverage for new or changed API behavior.
- Add frontend UI when the roadmap explicitly requires user-facing views.
- Add or update documentation when the minor changes operator, deployment, setup, privacy, backup, or release behavior.
- Keep root package.json as the product version and set it to the exact minor being implemented.
- Do not bump every workspace package version unless the repo clearly starts following that pattern.

Checks:
- Before every feature commit, run only the checks relevant to the changed surface, plus any checks required by shared changes:
  - Always run `pnpm typecheck` when TypeScript, schema types, validation, API, worker, shared package, or frontend code changes.
  - Run `pnpm build` when build config, package scripts, Dockerfiles, deployment files, Next.js pages, Nest modules, shared packages, or production behavior changes.
  - Run `pnpm test` when tests, tested code paths, shared behavior, validation, repositories, API behavior, workers, or frontend behavior changes.
  - Run targeted package tests when only one isolated package changed and the root test suite would not add meaningful coverage.
  - If only documentation or PROMPT.md changed, no code checks are required.
- If the minor adds or changes API behavior:
  - start required local services,
  - run migrations,
  - start the local API,
  - run `pnpm test:api` against the live API,
  - stop the API process afterward.
- If the minor adds or changes browser/E2E behavior, run the relevant Playwright/E2E command once it exists.
- If production Docker, deployment, or release behavior changes, run the production-stack smoke command or clearly report why it cannot be run.
- If a check fails, fix the issue and rerun the relevant failed checks.
- If a check cannot be fixed safely, stop and report the blocker.

Commit discipline:
- Each minor must have at least one feature commit.
- After the feature commit, update PROMPT.md with the feature commit hash under that minor.
- Then make a separate PROMPT.md record commit.
- Keep commits local unless the user explicitly asks to push.
- Do not start the next minor until both local commits for the current minor exist.
- Use concise feature commit messages matching the minor, for example:
  - `Add production stack smoke`
  - `Harden auth user scoping`
  - `Add real calendar sync`
  - `Add intelligent job search copilot`
- Use PROMPT.md record commit messages in this format:
  - `Record <minor feature name> commit`

After each minor, report:
- Version completed.
- Feature commit hash.
- PROMPT.md record commit hash.
- Checks run and final result.
- Whether live API smoke tests were run.
- Whether E2E or production-stack smoke tests were run, if applicable.
- Working tree status.

When v2.0.0 is complete:
- Ensure root package.json is `2.0.0`.
- Run full release checks.
- Commit and tag `v2.0.0`.
- Push commits and tags only when the user explicitly asks.
- Provide a final release summary listing all feature commits, all PROMPT.md record commits, final package.json version, final check results, and remaining risks or manual follow-up.
```

Things that are easy to forget:

- Run and document a real production-stack smoke before calling a release deployable.
- Verify auth/user scoping before adding collaboration, teams, billing, or admin features.
- Keep provider integrations testable with deterministic fakes so checks do not depend on paid services or secrets.
- Redact secrets and sensitive user content from logs, metrics, exports, support bundles, and error reporting.
- Add migration rollback notes or recovery guidance for risky schema changes.
- Update seed/reset fixtures when tests depend on new required fields.
- Confirm background jobs are idempotent before adding retries.
- Audit every user-visible mutation, especially copilot/tool actions, sharing, deletion, billing, and admin actions.
- Preserve backward compatibility for existing local data when adding organizations or tenancy.
- Push tags as well as commits for v2.0.0 only when the user explicitly asks.

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

Commit: `e1560ef Add source performance analytics`

### v0.6.2 — Interview and Task Analytics

Implement v0.6.2 interview and task analytics:

- Add interview conversion rates.
- Add task SLA metrics.
- Add overdue, completed, and upcoming task reporting.
- Add dashboard views for follow-up discipline and interview outcomes.
- Keep checks green.
- Commit and push the result.

Commit: `ade0441 Add interview and task analytics`

### v0.6.3 — Document Performance Analytics

Implement v0.6.3 document performance analytics:

- Add CV/version usage statistics.
- Add cover letter usage and outcome statistics.
- Show which resume versions and generated documents are linked to successful stages.
- Add integration coverage for document performance aggregation.
- Keep checks green.
- Commit and push the result.

Commit: `c80b626 Add document performance analytics`

### v0.7.0 — Notifications and Reminders

Implement v0.7.0 notifications and reminders:

- Add notification preference records and reminder delivery placeholders.
- Add due-soon and overdue task notifications.
- Add application follow-up reminder suggestions.
- Add frontend notification center.
- Keep checks green.
- Commit and push the result.

Commit: `ed6f6e8 Add notification center`

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

Commit: `80f3790 Add settings and preferences`

### v0.8.1 — Data Export

Implement v0.8.1 data export:

- Add account export endpoints for profile, jobs, applications, resumes, documents, notes, tasks, and AI artifacts.
- Generate machine-readable JSON export bundles.
- Add UI to request and download exports.
- Add integration coverage for export completeness.
- Keep checks green.
- Commit and push the result.

Commit: `cc19983 Add data export`

### v0.8.2 — Account Deletion and Privacy Controls

Implement v0.8.2 account deletion and privacy controls:

- Add account deletion workflow with confirmation and retention safeguards.
- Add privacy controls for AI artifacts, email bodies, and generated documents.
- Add redaction helpers for sensitive fields in logs and exports.
- Add integration coverage for deletion and privacy settings.
- Keep checks green.
- Commit and push the result.

Commit: `c762f16 Add account privacy controls`

### v0.9.0 — Public Beta Hardening

Implement v0.9.0 public beta hardening:

- Add security review fixes and privacy controls.
- Add account export and deletion workflows.
- Add rate limiting and monitoring.
- Add backup/restore verification documentation.
- Add onboarding flow.
- Keep checks green.
- Commit the result.

Commit: `c93459d Add public beta hardening`

### v1.0.0 — Production Release

Implement v1.0.0 production release:

- Add production Docker images and deployment documentation.
- Add OpenTelemetry traces, Sentry, Prometheus metrics, and audit logs.
- Finalize billing hooks if enabled.
- Verify backup, restore, privacy, and account lifecycle flows.
- Run full release checks.
- Commit and tag the result.

Commit: `0a6ec12 Add production release foundation`

## Roadmap to v2.0.0

### v1.1.0 — Production Stack Smoke

Implement v1.1.0 production stack smoke:

- Build and run `docker-compose.prod.yml` end to end.
- Add a production smoke script that verifies health, migrations, API integration tests, and web boot.
- Fix production Dockerfiles and environment wiring uncovered by the smoke.
- Document the exact release operator flow for build, migrate, smoke, rollback, and shutdown.
- Keep checks green.
- Commit the result.

Commit: `2ea6362 Add production stack smoke`

### v1.1.1 — Auth and User Scoping Hardening

Implement v1.1.1 auth and user scoping hardening:

- Replace dev-user assumptions in repositories with authenticated user context.
- Add route guards for user-owned resources.
- Ensure jobs, applications, resumes, contacts, documents, settings, notifications, and exports are scoped to the current user.
- Add integration coverage proving one user cannot read or mutate another user's data.
- Keep checks green.
- Commit the result.

Commit: `c691004 Harden auth user scoping`

### v1.1.2 — End-to-End UI Test Suite

Implement v1.1.2 end-to-end UI test suite:

- Add Playwright coverage for onboarding, auth, dashboard, manual import, application detail, settings, export, and document approval flows.
- Add deterministic seed/reset setup for browser tests.
- Run E2E tests in CI-friendly headless mode.
- Document how to run and debug UI tests locally.
- Keep checks green.
- Commit the result.

Commit: `2da17ec Add end-to-end UI tests`

### v1.2.0 — Real Calendar Sync

Implement v1.2.0 real calendar sync:

- Add a provider-backed calendar connection flow using existing calendar placeholders.
- Sync interview and follow-up events from a configured calendar provider.
- Detect conflicts and stale/cancelled calendar events.
- Add UI for connection status, last sync, conflict review, and manual resync.
- Add integration coverage with deterministic provider fakes.
- Keep checks green.
- Commit the result.

Commit: `3417683 Add real calendar sync`

### v1.2.1 — Real Email Sync

Implement v1.2.1 real email sync:

- Add a provider-backed email connection flow using existing email placeholders.
- Sync message metadata and optional bodies according to privacy settings.
- Classify application-related messages and link them to applications.
- Add UI for inbox review, classification correction, and sync status.
- Add integration coverage with deterministic provider fakes.
- Keep checks green.
- Commit the result.

Commit: `f06449f Add real email sync`

### v1.3.0 — Provider AI Integrations

Implement v1.3.0 provider AI integrations:

- Wire OpenAI and Anthropic providers behind the existing AI abstraction.
- Keep local deterministic generation as the default fallback.
- Add encrypted provider key storage or documented environment-only key mode.
- Record provider, model, prompt hash, policy checks, and grounding evidence for every generated artifact.
- Add provider fake tests plus opt-in live provider smoke tests.
- Keep checks green.
- Commit the result.

Commit: `13cb7dd Add provider AI integrations`

### v1.3.1 — Generation Quality Review

Implement v1.3.1 generation quality review:

- Add rubric-based review for tailored CVs and cover letters.
- Score specificity, evidence coverage, role fit, claim risk, and tone.
- Add side-by-side diff, reviewer notes, and approve/reject history.
- Surface risky or unsupported claims before document approval.
- Add integration coverage for review scoring and approval blocking.
- Keep checks green.
- Commit the result.

Commit: `044bfe5 Add generation quality review`

### v1.4.0 — Collaboration and Sharing

Implement v1.4.0 collaboration and sharing:

- Add shareable application packets for mentors, recruiters, or trusted reviewers.
- Support read-only share links with expiration and revocation.
- Add reviewer comments on applications, resumes, and generated documents.
- Audit all sharing, viewing, commenting, and revocation actions.
- Add integration coverage for permissions and expiry.
- Keep checks green.
- Commit the result.

Commit: `024c5b7 Add collaboration sharing`

### v1.4.1 — Document Export and Templates

Implement v1.4.1 document export and templates:

- Add PDF, DOCX, and Markdown export for resumes and cover letters.
- Add editable document templates with deterministic rendering.
- Add preview and download UI for generated and approved documents.
- Preserve generation metadata outside exported user-facing content.
- Add integration and rendering coverage for exports.
- Keep checks green.
- Commit the result.

Commit: `448e550 Add document export templates`

### v1.5.0 — Job Discovery Automation

Implement v1.5.0 job discovery automation:

- Add scheduled job-source checks for saved companies, job boards, and configured searches.
- Import candidate jobs into a review queue instead of auto-saving everything.
- Add source reliability, duplicate, and relevance scoring.
- Add UI for approving, dismissing, or snoozing discovered jobs.
- Add integration coverage with deterministic source fixtures.
- Keep checks green.
- Commit the result.

Commit: `1845eb1 Add job discovery automation`

### v1.5.1 — Browser Extension Full Workflow

Implement v1.5.1 browser extension full workflow:

- Upgrade the extension scaffold into a complete import workflow.
- Add authentication/session handling for the extension.
- Show duplicate warnings, parsed fields, and save status in the extension popup.
- Add extension build, validation, and fixture-based smoke coverage.
- Keep checks green.
- Commit the result.

Commit: `ecc1070 Add browser extension workflow`

### v1.6.0 — Search Strategy Planner

Implement v1.6.0 search strategy planner:

- Add weekly goals for applications, networking, follow-ups, interviews, and resume iterations.
- Recommend next actions based on funnel analytics and stale applications.
- Add calendar/task generation for planned work.
- Add dashboard views for plan progress and missed commitments.
- Add integration coverage for planner recommendations.
- Keep checks green.
- Commit the result.

Commit: `0dcd57f Add search strategy planner`

### v1.6.1 — Offer and Compensation Tracker

Implement v1.6.1 offer and compensation tracker:

- Add offer records with compensation, equity, benefits, deadlines, and negotiation notes.
- Compare offers against job preferences and market assumptions.
- Add decision matrix UI for active offers.
- Add reminder generation for deadlines and negotiation follow-ups.
- Add integration coverage for offer lifecycle flows.
- Keep checks green.
- Commit the result.

Commit: `26ac99e Add offer compensation tracker`

### v1.7.0 — Observability and Operations

Implement v1.7.0 observability and operations:

- Add OpenTelemetry tracing across API requests, database operations, and AI generation workflows.
- Add Sentry error reporting with redaction of sensitive payloads.
- Add Prometheus counters and histograms for API latency, job imports, generation, syncs, and failures.
- Add operational dashboards or documented Grafana panels.
- Add smoke coverage for metrics and redaction behavior.
- Keep checks green.
- Commit the result.

Commit: `b690960 Add observability operations metrics`

### v1.7.1 — Background Worker Reliability

Implement v1.7.1 background worker reliability:

- Implement durable queues for email sync, calendar sync, notifications, analytics refresh, and document generation.
- Add retries, dead-letter handling, idempotency keys, and job status visibility.
- Add worker dashboard views for recent jobs and failures.
- Add integration coverage for retry and idempotency behavior.
- Keep checks green.
- Commit the result.

Commit: `623fe98 Add background worker reliability`

### v1.8.0 — Billing and Subscription Foundation

Implement v1.8.0 billing and subscription foundation:

- Add billing plans, subscription status, limits, and entitlement checks.
- Support a deterministic local billing fake plus optional Stripe integration.
- Gate premium AI/provider/sync features behind entitlements.
- Add account settings UI for plan and usage.
- Add integration coverage for entitlement enforcement.
- Keep checks green.
- Commit the result.

Commit: `f0375c4 Add billing subscription foundation`

### v1.8.1 — Usage Limits and Cost Controls

Implement v1.8.1 usage limits and cost controls:

- Track AI generations, provider calls, sync volume, document exports, and discovered job imports.
- Add configurable usage limits and admin/operator overrides.
- Show usage warnings before expensive or limited actions.
- Add audit events for limit hits and overrides.
- Add integration coverage for usage accounting.
- Keep checks green.
- Commit the result.

Commit: `35319dc Add usage limits and cost controls`

### v1.9.0 — Team and Multi-Tenant Readiness

Implement v1.9.0 team and multi-tenant readiness:

- Add organizations, memberships, roles, and team settings.
- Support personal and team workspaces.
- Scope resources by owner workspace with migration paths for existing personal data.
- Add role-based permissions for viewing, editing, exporting, and deleting data.
- Add integration coverage for tenant isolation.
- Keep checks green.
- Commit the result.

Commit: `d1d69df Add team multi-tenant readiness`

### v1.9.1 — Admin and Support Tools

Implement v1.9.1 admin and support tools:

- Add admin views for user lookup, audit trails, sync health, and failed background jobs.
- Add support-safe impersonation or diagnostic bundles with strict audit logging.
- Add privacy-preserving support export bundles.
- Add integration coverage for admin permissions and audit events.
- Keep checks green.
- Commit the result.

Commit: `4b4df98 Add admin support tools`

### v2.0.0 — Intelligent Job Search Copilot

Implement v2.0.0 intelligent job search copilot:

- Add a conversational copilot that can inspect the user's jobs, resumes, applications, analytics, documents, and settings.
- Let the copilot propose actions, drafts, follow-ups, and weekly plans while requiring approval before mutations.
- Ground every recommendation in stored user data, job data, or explicit user preferences.
- Add tool-call audit logs, approval history, and rollback-friendly mutation records.
- Add UI for copilot chat, pending actions, accepted actions, and rejected recommendations.
- Add integration and E2E coverage for grounded recommendations and approval-gated actions.
- Run full release checks.
- Commit and tag the result.

Commit: `26b0d32 Add intelligent job search copilot`

## Roadmap to v3.0.0

### v2.1.0 — SaaS Plan Model

Implement v2.1.0 SaaS plan model:

- Define public free, premium, and team plans with explicit limits and entitlements.
- Replace placeholder/local-only plan assumptions with a production-ready plan catalog.
- Add migration-safe plan seed/update behavior for existing users and subscriptions.
- Show plan limits and premium feature locks clearly in account settings.
- Add integration coverage for plan resolution, default free assignment, and premium entitlement reads.
- Keep checks green.
- Commit the result.

Commit: `be64a90 Add SaaS plan model`

### v2.1.1 — Free Tier Limit Enforcement

Implement v2.1.1 free tier limit enforcement:

- Enforce free limits for saved jobs, applications, resumes, copilot messages/actions, AI generations, document exports, and discovery imports.
- Add user-facing upgrade prompts at limit boundaries without losing in-progress work.
- Add audit and usage events for limit hits.
- Add integration coverage for every enforced free-tier boundary.
- Keep checks green.
- Commit the result.

Commit: `821b0e6 Enforce free tier limits`

### v2.2.0 — Stripe Billing Integration

Implement v2.2.0 Stripe billing integration:

- Add Stripe checkout sessions, customer mapping, subscription mapping, and customer portal links.
- Keep deterministic local billing fakes for tests and local development.
- Add webhook handling for subscription created, updated, canceled, payment failed, and checkout completed events.
- Make webhook processing idempotent and audit every billing state transition.
- Add integration coverage with signed local webhook fixtures.
- Update billing setup documentation and required environment variables.
- Keep checks green.
- Commit the result.

Commit: `ff61492 Add Stripe billing integration`

### v2.2.1 — Billing Recovery and Dunning

Implement v2.2.1 billing recovery and dunning:

- Add past-due, unpaid, canceled, trialing, and grace-period subscription states.
- Gate premium features according to recoverable and terminal billing states.
- Add account UI for failed payments, grace periods, plan changes, and cancellation status.
- Add notification events for payment failure and grace-period expiration.
- Add integration coverage for dunning state transitions and entitlement changes.
- Keep checks green.
- Commit the result.

Commit: `a39f003 Add billing recovery and dunning`

### v2.3.0 — Production Auth Hardening

Implement v2.3.0 production auth hardening:

- Add email verification flow with deterministic local email capture.
- Add password reset flow with expiring, single-use tokens.
- Harden session cookies, logout behavior, session rotation, and production cookie settings.
- Add account security UI for email status, password reset, and active session metadata.
- Add integration and E2E coverage for registration, verification, reset, and protected routes.
- Update auth setup and operations documentation.
- Keep checks green.
- Commit the result.

### v2.3.1 — Abuse Prevention and Rate Limits

Implement v2.3.1 abuse prevention and rate limits:

- Add per-IP and per-user rate limits for auth, copilot, AI generation, imports, exports, and webhook endpoints.
- Add bot-resistant throttling and lockout behavior for repeated auth failures.
- Add operator-visible abuse events with sensitive data redaction.
- Add integration coverage for rate-limit responses and recovery windows.
- Update operations documentation with tuning guidance.
- Keep checks green.
- Commit the result.

### v2.4.0 — Public Marketing and Pricing Site

Implement v2.4.0 public marketing and pricing site:

- Add public landing, pricing, features, FAQ, and contact pages.
- Add clear free-vs-premium copy tied to the actual plan catalog.
- Add unauthenticated navigation that routes users to login, registration, and checkout intent.
- Add responsive, accessible design suitable for a public SaaS launch.
- Add E2E coverage for public navigation, pricing visibility, and registration entry points.
- Keep checks green.
- Commit the result.

### v2.4.1 — Legal, Privacy, and Consent

Implement v2.4.1 legal, privacy, and consent:

- Add Terms of Service, Privacy Policy, Cookie Policy, and AI usage disclosure pages.
- Add registration-time acceptance tracking with policy version metadata.
- Add settings UI for privacy controls, export, deletion, and communication preferences.
- Ensure exports, support bundles, logs, and analytics redact sensitive user content.
- Add integration coverage for consent recording and privacy controls.
- Update privacy and operator documentation.
- Keep checks green.
- Commit the result.

### v2.5.0 — SaaS Onboarding and Activation

Implement v2.5.0 SaaS onboarding and activation:

- Add first-run onboarding for goals, target roles, locations, resume import, and first saved job.
- Add guided free-tier activation flow ending in the dashboard and copilot.
- Add upgrade prompts only after the user reaches meaningful value moments.
- Add onboarding progress persistence and skip/resume behavior.
- Add E2E coverage for new-user onboarding and first-value workflow.
- Keep checks green.
- Commit the result.

### v2.5.1 — Lifecycle Emails and Product Notifications

Implement v2.5.1 lifecycle emails and product notifications:

- Add deterministic local email provider plus production provider abstraction.
- Send verification, reset, billing, onboarding, limit warning, and weekly summary emails.
- Respect notification preferences and unsubscribe/transactional boundaries.
- Add email event audit logs with no secret or sensitive body leakage.
- Add integration coverage for email rendering, queuing, preferences, and suppression.
- Keep checks green.
- Commit the result.

### v2.6.0 — Production Deployment Pipeline

Implement v2.6.0 production deployment pipeline:

- Add documented deployment pipeline for API, web, worker, database migrations, and static assets.
- Add environment validation for required production secrets and provider credentials.
- Add zero-downtime migration guidance and rollback notes.
- Add release checklist automation for build, migrations, smoke tests, and tag verification.
- Add staging deployment documentation and smoke-test scripts.
- Keep checks green.
- Commit the result.

### v2.6.1 — Backups, Restore, and Data Retention

Implement v2.6.1 backups, restore, and data retention:

- Add production backup schedules for database and object/document storage.
- Add restore verification scripts and operator documentation.
- Add retention policies for deleted accounts, AI artifacts, support bundles, logs, and exports.
- Add admin-visible backup health and last-restore verification status.
- Add integration or smoke coverage for backup metadata and retention policy behavior.
- Keep checks green.
- Commit the result.

### v2.7.0 — Observability for Public SaaS

Implement v2.7.0 observability for public SaaS:

- Add production-ready error reporting, metrics, traces, uptime checks, and alert routing.
- Add business metrics for activation, conversion, retention, churn, usage, and billing events.
- Add dashboards for API health, worker health, sync health, billing health, and copilot usage.
- Redact secrets and sensitive user content from every telemetry surface.
- Add smoke coverage for metrics endpoints and redaction behavior.
- Update observability operations documentation.
- Keep checks green.
- Commit the result.

### v2.7.1 — Support Operations Console

Implement v2.7.1 support operations console:

- Expand admin support tools into a production-safe console for lookup, diagnostics, audit review, and billing status.
- Add support role permissions separate from normal team roles.
- Add strict audit logs for every support action, export, diagnostic bundle, and impersonation-like flow.
- Add support-safe diagnostic views that never expose raw resume, message, email body, or secret content.
- Add integration coverage for support permissions, audit logs, and redaction.
- Keep checks green.
- Commit the result.

### v2.8.0 — Security Review and Tenant Isolation

Implement v2.8.0 security review and tenant isolation:

- Audit every API endpoint for authentication, user scoping, workspace scoping, and role permissions.
- Add tenant isolation tests for jobs, applications, resumes, documents, tasks, billing, copilot, analytics, integrations, and support tools.
- Harden unsafe local defaults for production environments.
- Add security headers, CORS rules, CSP, and secure cookie defaults suitable for public SaaS.
- Document security posture, known limitations, and disclosure process.
- Keep checks green.
- Commit the result.

### v2.8.1 — Compliance and Data Processing Readiness

Implement v2.8.1 compliance and data processing readiness:

- Add data inventory for user profile data, resumes, job content, AI artifacts, billing data, and support metadata.
- Add DPA-ready subprocessors documentation and provider configuration notes.
- Add user data export and deletion verification coverage.
- Add operator workflows for legal holds, deletion requests, and account recovery.
- Add documentation for AI data handling and provider retention assumptions.
- Keep checks green.
- Commit the result.

### v2.9.0 — Private Beta Launch

Implement v2.9.0 private beta launch:

- Add beta access controls, invite codes, and waitlist capture.
- Add onboarding analytics for first job saved, first application created, first resume imported, and first copilot plan generated.
- Add feedback capture and support escalation flows.
- Add beta operator dashboard for activation, errors, billing readiness, and usage limits.
- Add E2E coverage for invite registration, onboarding, feedback, and upgrade prompts.
- Keep checks green.
- Commit the result.

### v2.9.1 — Launch Candidate Hardening

Implement v2.9.1 launch candidate hardening:

- Fix beta feedback, polish key activation flows, and close launch-blocking security or billing gaps.
- Add load and concurrency smoke coverage for auth, dashboard, copilot, checkout, and webhooks.
- Run restore verification, production-stack smoke, and release checklist automation.
- Update public docs, operator runbooks, release notes, and known-risk register.
- Freeze non-critical feature work until v3.0.0 release verification is complete.
- Keep checks green.
- Commit the result.

### v3.0.0 — Public SaaS Launch

Implement v3.0.0 public SaaS launch:

- Ensure production billing, free/premium enforcement, auth hardening, onboarding, legal pages, observability, backups, and support workflows are complete.
- Run full release checks including typecheck, build, test, live API integration, E2E, production-stack smoke, restore verification, and release checklist automation.
- Verify root package.json is `3.0.0`.
- Create final public launch release notes with free and premium feature boundaries.
- Commit and tag `v3.0.0`.
- Push commits and tags only when the user explicitly asks.
