# Codex-Ready Implementation Prompts

## v0.1 Repository Foundation

Implement the initial monorepo foundation. Install dependencies, make all workspace scripts pass, wire Docker Compose services, and generate the first Drizzle migration from `packages/database/src/schema.ts`.

## v0.2 Auth and Profile

Add production-grade authentication using an established library. Implement user registration, email verification hooks, password reset hooks, session handling, and candidate profile CRUD. Do not implement custom password cryptography.

## v0.3 Jobs and Companies

Implement job, company, saved job, and contact CRUD. Add PostgreSQL full text and trigram search for jobs and companies. Include API tests and frontend list/detail views.

## v0.4 Resumes and Versioning

Implement resumes, resume versions, document storage metadata, and immutable version selection for applications. Ensure editing a submitted resume creates a new version rather than mutating the submitted version.

## v0.5 Applications Pipeline

Implement applications, pipeline stages, notes, tasks, interviews, reminders, and event history. Build board and table views with filters.

## v0.6 AI Provider Layer

Implement provider abstraction for OpenAI, Anthropic, and local providers. Add policy checks that prevent generated candidate claims unless they are grounded in candidate profile or resume data.

## v0.7 ATS and Matching

Implement ATS analysis and job-to-resume matching. Persist analysis inputs, model/provider metadata, scores, findings, and generated recommendations.

## v0.8 Integrations

Add email and calendar integration interfaces, sync jobs through BullMQ, and connect emails/interviews/events to applications.

## v0.9 Analytics

Implement funnel analytics, source performance, interview conversion rates, task SLA metrics, and outcome reports.

## v1.0 Hardening

Add OpenTelemetry traces, Sentry, Prometheus metrics, audit logs, backup/restore documentation, production Docker images, and deployment documentation.

