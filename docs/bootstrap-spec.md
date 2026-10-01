# JobOS Repository Bootstrap Specification

JobOS starts as a TypeScript modular monolith in a pnpm + Turborepo workspace.

## Folder Tree

```text
apps/
  web/       Next.js frontend
  api/       NestJS Fastify API
  worker/    BullMQ background workers
packages/
  database/  Drizzle schema, migrations, database client
  contracts/ shared API contracts and domain DTOs
  validation/ reusable Zod schemas
  config/    environment parsing
  logger/    structured logging
  ai/        provider abstraction
  auth/      auth helpers and policies
  ui/        shared UI primitives
  job-sources/
  document-parser/
  eslint-config/
infrastructure/
docs/
scripts/
```

## Local Services

Docker Compose provides PostgreSQL, Redis, and MinIO. PostgreSQL enables `pg_trgm` and `uuid-ossp` for fuzzy job/company search and UUID defaults.

## Core Database Model

The canonical chain is:

```text
users -> candidate_profiles -> resumes -> resume_versions -> applications
```

Applications reference immutable document versions. AI output is stored with provenance and policy metadata so generated content can be audited against the "never invent candidate information" rule.

## API Modules

NestJS modules map to product domains: auth, users, profiles, companies, contacts, jobs, applications, resumes, documents, ATS, matching, interviews, notes, tasks, notifications, integrations, analytics, AI, and audit.

Initial HTTP surface:

- `GET /health`
- `GET /applications`
- `POST /applications`
- `GET /jobs`
- `POST /jobs`
- `GET /resumes`
- `POST /resumes`

## Frontend Routes

- `/` dashboard
- `/discover`
- `/jobs/saved`
- `/companies`
- `/applications/pipeline`
- `/applications`
- `/interviews`
- `/tasks`
- `/resumes`
- `/cover-letters`
- `/documents`
- `/tools/ats`
- `/tools/matcher`
- `/tools/interview-prep`
- `/contacts`
- `/analytics`
- `/settings/profile`
- `/settings/integrations`
- `/settings/notifications`
- `/settings/billing`

## Environment Variables

See `.env.example` for required local configuration.

