JobOS

An end-to-end operating system for job searching.

JobOS centralizes the entire job-search lifecycle into one application:

job discovery

job aggregation

job saving

CV management

CV versioning

ATS analysis

job ↔ CV matching

CV tailoring

cover-letter generation

application tracking

recruiter/contact management

email synchronization

interview tracking

reminders

analytics

job-search funnel analysis

document generation

AI assistance

Instead of combining a spreadsheet, multiple job boards, several CV files, email, calendar, notes, and AI tools, JobOS provides a single source of truth.

1. Product vision

Most job-search tools solve one isolated problem.

Job boards help discover jobs.

CV builders create CVs.

ATS scanners analyze CVs.

Spreadsheets track applications.

Email contains recruiter communication.

Calendars contain interviews.

AI tools help rewrite documents.

JobOS connects all of them.

The fundamental object in JobOS is the Application.

Job
 │
 ├── Company
 │
 ├── Contacts
 │
 └── Application
      │
      ├── CV version
      ├── Cover letter
      ├── ATS analysis
      ├── Match analysis
      ├── Emails
      ├── Notes
      ├── Tasks
      ├── Interviews
      ├── Events
      └── Outcome

This creates a complete historical record of every application.

2. Core principles

2.1 Never invent candidate information

AI-generated content must never fabricate:

companies

employment

degrees

certifications

skills

achievements

dates

responsibilities

technologies

AI may reformulate existing information but cannot create facts about the user.

2.2 User data is canonical

The user's profile and CV data are the source of truth.

Generated documents reference structured profile data.

Candidate Profile
       ↓
Master Experience Database
       ↓
CV
       ↓
CV Version
       ↓
Application

2.3 Preserve history

Never silently overwrite application documents.

Every significant modification creates a version.

CV
├── v1
├── v2
├── v3
└── v4

Applications reference the exact version submitted.

2.4 Automate repetitive work

JobOS should progressively eliminate:

copying job descriptions

updating spreadsheets

remembering follow-ups

checking application status

searching email manually

choosing between CV versions

repeatedly rewriting the same information

3. Technology stack

Languages

TypeScript
SQL
HTML/CSS

Optional later:

Python

Python should only be introduced if ML/data-processing workloads justify it.

Do not introduce Python simply because the product contains AI.

4. High-level stack

Frontend

Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
TanStack Query
React Hook Form
Zod

Backend

NestJS
Fastify adapter
TypeScript
Zod
OpenAPI

Database

PostgreSQL

ORM

Drizzle ORM

Cache / queues

Redis
BullMQ

Search

Start:

PostgreSQL Full Text Search
pg_trgm

Later if required:

Meilisearch

Do not deploy a dedicated search cluster before PostgreSQL search becomes a measurable limitation.

Object storage

S3-compatible storage:

AWS S3
Cloudflare R2
MinIO (development)

Authentication

Use an established authentication implementation rather than designing authentication cryptography internally.

Required capabilities:

email/password
email verification
password reset
OAuth
session management
optional MFA

AI

Provider abstraction.

OpenAI
Anthropic
local models
future providers

The application must not couple business logic directly to one model provider.

Observability

OpenTelemetry
Sentry
Prometheus
Grafana
structured JSON logs

Infrastructure

Development:

Docker Compose

Production:

Docker
reverse proxy
managed PostgreSQL
managed Redis
S3-compatible storage

Infrastructure as code later:

Terraform / OpenTofu

5. Why a modular monolith

Do NOT begin with microservices.

Initial architecture:

                        ┌───────────────────────┐
                        │      Web Browser      │
                        └───────────┬───────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │       Next.js       │
                         │      Frontend       │
                         └──────────┬──────────┘
                                    │
                              HTTPS / JSON
                                    │
                                    ▼
                      ┌──────────────────────────┐
                      │        API Server        │
                      │     NestJS + Fastify     │
                      │                          │
                      │ Auth                     │
                      │ Jobs                     │
                      │ Applications             │
                      │ CV                       │
                      │ ATS                      │
                      │ Contacts                 │
                      │ Analytics                │
                      │ Integrations             │
                      └───────┬────────┬─────────┘
                              │        │
                 ┌────────────┘        └─────────────┐
                 ▼                                   ▼
        ┌─────────────────┐                 ┌─────────────────┐
        │   PostgreSQL    │                 │      Redis      │
        │                 │                 │                 │
        │ Primary storage │                 │ Cache           │
        │ Search          │                 │ BullMQ queues   │
        └─────────────────┘                 └────────┬────────┘
                                                    │
                                                    ▼
                                          ┌───────────────────┐
                                          │      Workers      │
                                          │                   │
                                          │ AI                │
                                          │ scraping/import   │
                                          │ email sync        │
                                          │ document parsing  │
                                          │ analytics         │
                                          │ notifications     │
                                          └─────────┬─────────┘
                                                    │
                      ┌─────────────────────────────┼─────────────────────┐
                      ▼                             ▼                     ▼
                 AI Providers                 Job Sources            Email APIs

This provides most benefits associated with services without introducing distributed-system complexity.

Modules maintain strict boundaries so they can later become independent services.

6. Monorepo structure

Use pnpm workspaces + Turborepo.

jobos/
│
├── apps/
│   ├── web/
│   │   └── Next.js frontend
│   │
│   ├── api/
│   │   └── NestJS API
│   │
│   └── worker/
│       └── asynchronous workers
│
├── packages/
│   ├── database/
│   ├── contracts/
│   ├── validation/
│   ├── ui/
│   ├── config/
│   ├── logger/
│   ├── auth/
│   ├── ai/
│   ├── job-sources/
│   ├── document-parser/
│   └── eslint-config/
│
├── infrastructure/
│   ├── docker/
│   ├── monitoring/
│   └── terraform/
│
├── docs/
│
├── scripts/
│
├── .github/
│   └── workflows/
│
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md

## Repository bootstrap

This repository has been scaffolded as a pnpm + Turborepo monorepo.

### Prerequisites

- Node.js 22
- pnpm 9
- Docker with Docker Compose

### Local startup

```bash
cp .env.example .env
docker compose up -d postgres redis minio
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

### Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

See [docs/bootstrap-spec.md](docs/bootstrap-spec.md) for the repository-level architecture and [docs/codex-implementation-prompts.md](docs/codex-implementation-prompts.md) for the v0.1 to v1.0 implementation sequence.

7. Backend architecture

Each business domain becomes a module.

apps/api/src/
│
├── auth/
├── users/
├── profiles/
├── companies/
├── contacts/
├── jobs/
├── job-sources/
├── applications/
├── resumes/
├── documents/
├── ats/
├── matching/
├── interviews/
├── notes/
├── tasks/
├── notifications/
├── integrations/
├── analytics/
├── ai/
├── billing/
└── audit/

Each module follows roughly:

applications/
├── application.controller.ts
├── application.service.ts
├── application.repository.ts
├── application.schema.ts
├── application.events.ts
├── application.types.ts
└── application.module.ts

Responsibilities must remain separated.

Controllers:

HTTP
authentication
validation
serialization

Services:

business logic

Repositories:

database access

Workers:

expensive asynchronous operations

8. Frontend architecture

apps/web/src/
│
├── app/
│
├── components/
│   ├── ui/
│   ├── jobs/
│   ├── applications/
│   ├── resumes/
│   └── analytics/
│
├── features/
│   ├── jobs/
│   ├── applications/
│   ├── resumes/
│   ├── ats/
│   ├── matching/
│   └── analytics/
│
├── hooks/
├── lib/
├── stores/
└── types/

Business-specific components belong to features.

Generic reusable components belong to components/ui.

9. Main navigation

Desktop sidebar:

⌂ Dashboard

SEARCH
├── Discover
├── Saved Jobs
└── Companies

APPLICATIONS
├── Pipeline
├── Applications
├── Interviews
└── Tasks

DOCUMENTS
├── CVs
├── Cover Letters
└── Documents

TOOLS
├── ATS Scanner
├── Job Matcher
└── Interview Prep

NETWORK
├── Companies
└── Contacts

INSIGHTS
└── Analytics

SETTINGS
├── Profile
├── Integrations
├── Notifications
├── Billing
└── Privacy

10. Dashboard

Example:

Good morning, Thomas.

────────────────────────────────────────────

Applications      Interviews       Response rate
     47                 3               24%

────────────────────────────────────────────

APPLICATION FUNNEL

Saved            32
Applied          47
Screening        11
Interview         6
Technical         3
Offer             1

────────────────────────────────────────────

UPCOMING

Tomorrow
14:00    Technical interview — Example Corp

Friday
Follow up — Another Corp

────────────────────────────────────────────

RECENT JOBS

Backend Engineer
Systems Engineer
C++ Developer
Embedded Software Engineer

11. Database design

PostgreSQL is the canonical database.

Every user-owned entity must contain ownership information.

Prefer UUIDv7-compatible identifiers.

12. Users

users

id
email
email_verified_at
created_at
updated_at
deleted_at

13. Profiles

profiles

id
user_id

first_name
last_name
headline
summary

city
country

phone
website_url
github_url
linkedin_url

created_at
updated_at

14. Candidate experience database

The CV should not be the only place containing career information.

Store canonical experiences separately.

experiences

id
user_id

company_name
title

employment_type

location

start_date
end_date

description

created_at
updated_at

Achievements:

experience_achievements

id
experience_id

content
position

Technologies:

experience_skills

experience_id
skill_id

This structured information can later generate multiple CV variants.

15. Education

education

id
user_id

institution
degree
field

start_date
end_date

description

16. Skills

skills

id
normalized_name
category

Examples:

C
C++
Rust
Linux
Docker
Kubernetes
PostgreSQL
React
TypeScript
TCP/IP
OpenGL

Candidate relation:

user_skills

user_id
skill_id

level
years_experience
last_used_at

Do not rely entirely on years_experience.

It is often ambiguous.

17. Companies

companies

id

name
normalized_name

website
domain

linkedin_url

industry

employee_count_min
employee_count_max

country

logo_url

created_at
updated_at

Company deduplication is important.

These should ideally resolve to one company:

Google
Google LLC
google
GOOGLE
google.com

18. Jobs

jobs

id
company_id

title
normalized_title

description

location
country

remote_type

employment_type

salary_min
salary_max
salary_currency
salary_period

experience_level

source_id
external_id
source_url

published_at
expires_at

content_hash

created_at
updated_at

19. Job sources

job_sources

id

type
name

base_url

enabled
configuration

created_at
updated_at

Possible types:

API
RSS
ATS
CAREER_PAGE
MANUAL
EXTENSION
IMPORT

20. Job deduplication

The same job may exist on:

company website
LinkedIn
Indeed
Welcome to the Jungle
aggregator

Create:

job_sources_instances

id
job_id
source_id

external_id
url

first_seen_at
last_seen_at

Deduplication signals:

company domain
normalized company
normalized title
location
description similarity
external identifiers
canonical URL

Never deduplicate exclusively on job title.

21. Saved jobs

saved_jobs

id
user_id
job_id

status

notes

created_at

Statuses:

SAVED
IGNORED
APPLIED
ARCHIVED

22. Applications

This is the heart of JobOS.

applications

id
user_id
job_id
company_id

status

source

applied_at
closed_at

salary_expectation
currency

resume_version_id
cover_letter_document_id

created_at
updated_at

23. Application statuses

Use configurable stages eventually.

Initial defaults:

DRAFT
SAVED
APPLIED
SCREENING
RECRUITER_INTERVIEW
HIRING_MANAGER
TECHNICAL
TAKE_HOME
ONSITE
FINAL_INTERVIEW
OFFER
ACCEPTED
REJECTED
WITHDRAWN
GHOSTED

Do not store only the current state.

Store history.

24. Application events

application_events

id
application_id

type

from_status
to_status

metadata

occurred_at
created_at

Examples:

APPLICATION_CREATED
APPLICATION_SUBMITTED
STATUS_CHANGED
EMAIL_RECEIVED
EMAIL_SENT
INTERVIEW_SCHEDULED
DOCUMENT_ATTACHED
NOTE_CREATED
FOLLOW_UP_SENT
OFFER_RECEIVED
REJECTION_RECEIVED

This produces the application timeline.

25. CV architecture

resumes

id
user_id

name
language

target_role

created_at
updated_at

Example:

Software Engineer — EN
Systems/C++ — EN
Backend — EN
Software Engineer — FR
Embedded — EN

26. CV versions

resume_versions

id
resume_id

version

content_json

source_file_id
generated_file_id

created_at

Never modify historical versions.

Creating a significant modification produces:

v1 → v2

27. Structured CV format

Internally store CVs as JSON.

Example:

{
    "basics": {},
    "summary": "",
    "experience": [],
    "education": [],
    "skills": [],
    "projects": [],
    "certifications": [],
    "languages": []
}

Then render:

JSON
 ↓
template
 ↓
HTML
 ↓
PDF

This makes CV generation deterministic and versionable.

28. File storage

Database:

metadata
ownership
relationships
hash
MIME type
size

Object storage:

actual bytes

Never store large PDFs directly inside PostgreSQL unless there is a compelling reason.

Example object key:

users/{userId}/resumes/{resumeId}/{versionId}/resume.pdf

29. ATS scanner

The ATS scanner must NOT pretend to reproduce every commercial ATS.

There is no universal ATS scoring algorithm.

Instead, analyze concrete properties.

Categories:

Parsing
Structure
Contact information
Sections
Experience
Skills
Keywords
Formatting
Job alignment

30. ATS parsing pipeline

Upload PDF/DOCX
      ↓
Validate
      ↓
Malware/security checks
      ↓
Extract text
      ↓
Detect sections
      ↓
Parse structure
      ↓
Extract entities
      ↓
Analyze formatting
      ↓
Compare with job
      ↓
Generate findings

31. ATS findings

Example:

{
    "type": "missing_keyword",
    "severity": "medium",
    "keyword": "PostgreSQL",
    "evidence": {
        "job": true,
        "resume": false
    }
}

Another:

{
    "type": "missing_section",
    "severity": "high",
    "section": "experience"
}

32. ATS scoring

If a score is displayed, make it explainable.

Example:

Parsing             95
Structure           90
Job terminology     72
Skills alignment    81
Experience signals  78
──────────────────────
Overall             83

Every point deduction should correspond to findings.

Avoid fake precision such as claiming:

You have an 83% chance of passing ATS.

JobOS cannot know that.

33. Job ↔ CV matching

Pipeline:

Job description
      ↓
normalize
      ↓
extract:
    skills
    technologies
    seniority
    responsibilities
    domain
    education
    languages
      ↓
compare
      ↓
candidate profile + CV
      ↓
match report

34. Matching output

Example:

Strong matches

✓ C++
✓ Linux
✓ networking
✓ Docker

Partial

~ PostgreSQL
~ CI/CD

Missing

✗ Kubernetes
✗ AWS

Potential terminology mismatch

"REST API development"
vs
"HTTP backend services"

Important distinction:

missing from CV

does NOT necessarily mean:

candidate does not know it

The UI must distinguish these.

35. Matching engine

Do not rely solely on an LLM.

Use a hybrid pipeline.

deterministic extraction
+
skill dictionary
+
synonym normalization
+
PostgreSQL matching
+
embeddings when useful
+
LLM semantic analysis

Example:

JS
Javascript
JavaScript
ECMAScript

normalize to:

javascript

Likewise:

Postgres
PostgreSQL

36. AI architecture

Create an abstraction:

packages/ai/

Interface concept:

interface AIProvider {
    generateText(...): Promise<...>;
    generateStructured<T>(...): Promise<T>;
}

Implementations:

OpenAIProvider
AnthropicProvider
LocalProvider

Business code should request:

analyzeJob()
tailorResume()
extractSkills()
generateCoverLetter()

not:

callSpecificModel()

37. Structured AI outputs

Never parse random prose when structured data is required.

Require schema-validated output.

LLM
 ↓
JSON
 ↓
Zod validation
 ↓
business logic

Invalid output:

retry / repair / fail safely

38. Prompt versioning

Prompts are production code.

Store:

prompt name
version
model
parameters
schema
created_at

Example:

job_skill_extraction:v3
resume_tailoring:v7
email_classification:v4

This makes AI regressions debuggable.

39. AI auditability

For important transformations store:

model
provider
prompt version
input hash
output
latency
token usage
estimated cost
timestamp

Avoid storing unnecessary sensitive prompt content indefinitely.

40. CV tailoring

Input:

job
candidate profile
selected resume version

Output:

suggestions

NOT immediate destructive modification.

Example:

- Developed network applications in C++.
+ Developed Linux networking applications in C++ using TCP/IP.

Only allow this if the underlying profile supports the added information.

User approves changes.

Then:

Create CV version

41. Hallucination protection

Before accepting generated CV content:

generated claim
      ↓
claim extraction
      ↓
compare against candidate knowledge base
      ↓
supported?

Possible results:

SUPPORTED
REFORMULATION
UNVERIFIED
CONTRADICTORY

Unverified claims require explicit user confirmation.

42. Cover letters

Generation uses:

candidate profile
company
job
selected CV
user preferences

Allow styles:

concise
standard
technical
startup
formal

Keep historical versions associated with applications.

43. Application pipeline

Kanban:

Saved
  │
  ▼
Applied
  │
  ▼
Screening
  │
  ▼
Interview
  │
  ▼
Technical
  │
  ▼
Final
  │
  ├── Offer
  │
  └── Rejected

Drag-and-drop creates an application_event.

Do not simply mutate status.

44. Application timeline

Example:

SEP 21

09:34
Application submitted

SEP 24

14:18
Email received from recruiter

SEP 25

10:00
Recruiter interview scheduled

SEP 27

10:00
Recruiter interview completed

SEP 30

16:42
Moved to technical interview

45. Contacts / recruiter CRM

contacts

id
user_id
company_id

first_name
last_name

role

email
linkedin_url

notes

created_at
updated_at

Relations:

application_contacts

application_id
contact_id
relationship

Relationships:

RECRUITER
HIRING_MANAGER
INTERVIEWER
REFERRAL
EMPLOYEE
OTHER

46. Email integration

Eventually support:

Gmail
Microsoft Outlook

OAuth only.

Never request the user's raw email password.

Architecture:

Email provider
      ↓
sync adapter
      ↓
email metadata
      ↓
classification
      ↓
application matcher
      ↓
application event

47. Email classification

Possible classes:

APPLICATION_CONFIRMATION
RECRUITER_MESSAGE
INTERVIEW_REQUEST
INTERVIEW_CONFIRMATION
REJECTION
OFFER
FOLLOW_UP
UNKNOWN

Classification should contain confidence.

{
    "type": "INTERVIEW_REQUEST",
    "confidence": 0.94
}

Low confidence:

do not mutate application automatically

Ask the user instead.

48. Email privacy

Store the minimum required data.

Where possible:

provider message ID
thread ID
sender
subject
timestamp
classification
short extracted metadata

Avoid indefinitely duplicating complete mailboxes.

Users must be able to disconnect integrations and delete imported data.

49. Calendar integration

Support:

Google Calendar
Microsoft Calendar

Interview events can create:

interview record
application event
reminder
calendar event

50. Interviews

interviews

id
application_id

type

starts_at
ends_at

location
meeting_url

notes

created_at
updated_at

Types:

RECRUITER
HIRING_MANAGER
TECHNICAL
SYSTEM_DESIGN
BEHAVIORAL
PAIR_PROGRAMMING
TAKE_HOME_REVIEW
FINAL
OTHER

51. Interview preparation

For each interview:

job description
company information
candidate CV
interview type

Generate:

likely topics
questions
CV areas likely to be discussed
technical revision checklist
questions to ask interviewer
STAR story suggestions

Again: no invented company facts.

52. Tasks

tasks

id
user_id
application_id

type
title
description

due_at

completed_at

created_at

Examples:

Apply
Follow up
Prepare interview
Send thank-you
Complete take-home
Check response

53. Follow-up engine

Rules:

application submitted
      ↓
no response for N days
      ↓
suggest follow-up

Do not automatically spam recruiters.

Default behavior:

remind user

Optional automation should always be deliberate.

54. Notifications

Channels:

in-app
email
push later

Examples:

Interview tomorrow
Follow-up due
Application inactive
New matching jobs
CV analysis complete
Import complete

55. Analytics

Core metrics:

applications
responses
interviews
technical interviews
offers
rejections
withdrawals

Funnels:

Applied
  ↓
Response
  ↓
Screening
  ↓
Interview
  ↓
Technical
  ↓
Offer

56. CV analytics

Because applications reference exact CV versions:

CV                 Applied   Responses   Interviews

Systems EN v3        31         10           5
Backend EN v2        22          4           2
General EN v5        18          2           1

Present this as historical descriptive data, not proof of causality.

Many variables affect outcomes.

57. Source analytics

Source               Applications   Responses

Company website           22           8
LinkedIn                  31           6
Indeed                    17           2
Referral                   5           4

58. Application autopsy

One of the key features.

Instead of:

You were rejected.

Analyze:

where applications tend to end.

Example:

100 applications

100 Applied
 ↓
28 responses
 ↓
16 recruiter interviews
 ↓
9 technical interviews
 ↓
4 final interviews
 ↓
2 offers

JobOS can surface:

Your largest observed drop-off is between
Applied → Response.

It can then suggest relevant tools without claiming a causal explanation.

59. Job discovery

Sources should implement a common interface.

interface JobSource {
    search(query: JobSearchQuery): Promise<JobSourceResult[]>;
    fetch(id: string): Promise<JobSourceResult | null>;
}

Possible adapters:

Greenhouse
Lever
Ashby
company career pages
public APIs
RSS feeds
manual URLs
browser extension

Respect each source's terms, robots policies, API restrictions, and applicable law.

Do not build the business around fragile circumvention of anti-bot systems.

60. ATS platform connectors

A particularly useful source is company ATS career pages.

Adapters:

GreenhouseAdapter
LeverAdapter
AshbyAdapter
WorkableAdapter
SmartRecruitersAdapter

Each adapter converts external data into:

NormalizedJob

61. Browser extension

Build after the core product.

apps/extension/

Chrome/Firefox WebExtension.

Button:

Save to JobOS

Extract:

title
company
description
location
salary
URL
source

Then:

POST /jobs/import

The user reviews extracted data before saving when extraction confidence is poor.

62. Job ingestion architecture

SOURCE
  ↓
FETCH
  ↓
RAW JOB
  ↓
NORMALIZATION
  ↓
VALIDATION
  ↓
DEDUPLICATION
  ↓
ENRICHMENT
  ↓
DATABASE
  ↓
SEARCH INDEX

Keep raw source data temporarily for debugging where permitted.

63. Background workers

Heavy tasks belong outside HTTP requests.

Queues:

job-import
job-normalization
job-deduplication

document-processing

ats-analysis
job-matching

ai-generation

email-sync
email-classification

notifications

analytics

64. BullMQ

Redis-backed BullMQ provides:

retry
backoff
delayed jobs
concurrency
failure handling
job inspection

Example:

API

POST /ats/analyze

        ↓

create analysis

        ↓

queue.add()

        ↓

202 Accepted

        ↓

worker

        ↓

analysis

        ↓

database update

        ↓

frontend notification

Never keep an HTTP request open for a 45-second AI operation.

65. Idempotency

Workers must tolerate retries.

Bad:

retry email sync
→ create duplicate emails

Good:

provider_message_id UNIQUE

Same principle for:

jobs
notifications
application events
billing events
webhooks

66. API design

Prefix:

/api/v1

Examples:

GET    /api/v1/jobs
GET    /api/v1/jobs/:id

POST   /api/v1/jobs/import

GET    /api/v1/applications
POST   /api/v1/applications

GET    /api/v1/applications/:id
PATCH  /api/v1/applications/:id

POST   /api/v1/applications/:id/events

GET    /api/v1/resumes
POST   /api/v1/resumes

POST   /api/v1/resumes/:id/versions

POST   /api/v1/ats/analyses
GET    /api/v1/ats/analyses/:id

POST   /api/v1/matches

GET    /api/v1/analytics/funnel

67. API contracts

Keep shared contracts in:

packages/contracts

Never manually maintain separate frontend/backend representations.

Use:

Zod

for runtime validation where appropriate.

Generate OpenAPI documentation from the API.

68. Pagination

Never return 10,000 jobs.

Prefer cursor pagination.

{
    "data": [],
    "nextCursor": "..."
}

Avoid deep OFFSET pagination on large tables.

69. Filtering

Job filters:

query
location
remote
salary
employment type
experience level
company
skills
source
published date

Applications:

status
company
date
CV
source
contact

70. Search

Phase 1:

PostgreSQL:

tsvector
GIN indexes
pg_trgm

Search:

title
company
description
skills
location

Only introduce Meilisearch/OpenSearch after measuring a real limitation.

71. Caching

Redis is NOT the source of truth.

Cache:

frequent searches
company enrichment
expensive statistics
rate-limit counters
temporary OAuth state

Never depend on cached data for permanent application state.

72. Authentication architecture

Use secure HTTP-only cookies.

Prefer server-managed sessions for the web application.

Cookie:

HttpOnly
Secure
SameSite

Do not store long-lived authentication tokens in localStorage.

73. Authorization

Authentication answers:

Who are you?

Authorization answers:

Can you access this resource?

Every user-owned database query must enforce ownership.

Never rely solely on:

frontend hiding buttons

74. Security

Minimum security baseline:

TLS everywhere
secure cookies
CSRF protection where applicable
strict input validation
rate limiting
authorization checks
OAuth state validation
secure password hashing
secret rotation
dependency scanning
audit logs
database backups
encrypted storage

75. File upload security

CV uploads are hostile input.

Validate:

size
MIME
magic bytes
extension
parser limits

Do not trust:

resume.pdf

simply because the filename ends with .pdf.

Set strict parser timeouts and memory limits.

76. SSRF protection

Job URL importing introduces SSRF risk.

Never allow backend fetches to arbitrary network destinations without validation.

Block:

localhost
127.0.0.0/8
private IPv4 ranges
link-local
IPv6 local/private ranges
cloud metadata endpoints

Resolve DNS safely and protect against DNS rebinding.

77. XSS protection

Job descriptions contain third-party HTML.

Never render arbitrary imported HTML directly.

Sanitize or transform it into a safe representation.

78. Rate limiting

Different limits by endpoint.

Examples:

login
password reset
AI generation
URL import
job search
document upload

AI endpoints especially need quotas because they cost money.

79. Secrets

Never commit:

API keys
OAuth secrets
database credentials
JWT/session secrets
S3 credentials

Development:

.env

Production:

secret manager

Commit:

.env.example

80. Audit log

Important security-sensitive actions:

audit_logs

id
user_id

action
resource_type
resource_id

metadata

ip_hash
user_agent

created_at

Examples:

LOGIN
PASSWORD_CHANGED
INTEGRATION_CONNECTED
INTEGRATION_DISCONNECTED
DATA_EXPORT_REQUESTED
ACCOUNT_DELETED

81. Privacy

This application processes extremely sensitive professional information.

Users must have:

data export
account deletion
integration disconnection
document deletion
AI privacy controls
email synchronization controls

Document data retention explicitly.

82. GDPR

For European users, design around GDPR requirements from the beginning.

Document:

data categories
processing purposes
retention periods
subprocessors
legal bases
user rights
deletion procedures
export procedures

Avoid collecting data simply because it might become useful later.

83. Billing

Possible model:

FREE

application tracking
limited CVs
manual jobs
basic ATS
basic analytics

PRO

unlimited CVs
advanced matching
AI tailoring
email integration
advanced analytics
interview preparation
automations

Potential price:

€9–15/month

Consider allowing users to pause subscriptions while not job searching.

84. Subscription data

subscriptions

id
user_id

provider
provider_customer_id
provider_subscription_id

plan
status

current_period_start
current_period_end

created_at
updated_at

Never trust billing state sent by the browser.

Billing provider webhooks update subscription state.

85. Feature flags

Introduce feature flags early.

Examples:

gmail_sync
ai_tailoring
browser_extension
job_recommendations
advanced_analytics

This makes progressive rollout substantially easier.

86. Observability

Every production request gets:

request ID
user ID when appropriate
route
status
duration

Logs are structured JSON.

Example:

{
    "level": "info",
    "requestId": "...",
    "method": "POST",
    "route": "/api/v1/applications",
    "status": 201,
    "durationMs": 42
}

Never log:

passwords
OAuth tokens
full CV content
complete email bodies
API keys

87. Metrics

Prometheus metrics:

http_requests_total
http_request_duration_seconds

worker_jobs_total
worker_job_duration_seconds
worker_failures_total

ai_requests_total
ai_tokens_total
ai_cost_total

job_import_total
job_import_failures_total

email_sync_total

88. Error monitoring

Use Sentry for:

frontend crashes
backend exceptions
worker failures
performance traces

Attach:

request ID
release
environment

Avoid attaching sensitive candidate content.

89. Health endpoints

GET /health/live
GET /health/ready

live:

process alive?

ready:

database available?
redis available?
required dependencies available?

90. Testing strategy

Use several layers.

Unit
Integration
API
End-to-end

Do not attempt to solve everything with E2E tests.

91. Unit tests

Test:

normalizers
matching rules
status transitions
salary parsing
skill normalization
deduplication
permissions

92. Integration tests

Use real ephemeral services when possible.

PostgreSQL
Redis

Test:

repositories
transactions
queues
database constraints

93. API tests

Test:

authentication
authorization
validation
pagination
rate limiting
error responses

Especially:

User A cannot access User B's application.

94. E2E

Use Playwright.

Critical flows:

register
login

create CV

save job

create application

move application

upload CV

run ATS analysis

view analytics

delete account

95. AI tests

AI functionality requires its own evaluation suite.

Create fixtures:

tests/ai/

Cases:

backend engineer
C++ systems developer
junior developer
senior engineer
French CV
English CV
poorly formatted CV
missing experience

Validate:

schema correctness
skill extraction
hallucination rate
claim preservation
language

Do not rely on "looks good to me."

96. Database migrations

All schema changes go through migrations.

Never manually change production schemas.

migration
 ↓
code
 ↓
review
 ↓
CI
 ↓
deployment

97. Backups

Production PostgreSQL requires:

automatic backups
point-in-time recovery
retention policy
restore testing

A backup that has never been restored is not proven to work.

98. Docker development

Services:

services:

  postgres:

  redis:

  minio:

  api:

  worker:

  web:

Developers should be able to run:

docker compose up -d
pnpm install
pnpm dev

99. Local development

Requirements:

Node.js
pnpm
Docker
Git

Clone:

git clone <repository>
cd jobos

Install:

corepack enable
pnpm install

Environment:

cp .env.example .env

Infrastructure:

docker compose up -d postgres redis minio

Migrations:

pnpm db:migrate

Development:

pnpm dev

100. Environment variables

Example:

NODE_ENV=development

DATABASE_URL=

REDIS_URL=

APP_URL=
API_URL=

SESSION_SECRET=

S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=

OPENAI_API_KEY=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

SENTRY_DSN=

Never provide real secrets in .env.example.

101. CI

GitHub Actions pipeline:

install
 ↓
lint
 ↓
typecheck
 ↓
unit tests
 ↓
integration tests
 ↓
build
 ↓
security checks

Pull requests cannot merge if required checks fail.

102. CD

Production:

merge main
   ↓
CI
   ↓
Docker images
   ↓
container registry
   ↓
migration
   ↓
deployment
   ↓
health checks

Use immutable image tags:

jobos-api:<git-sha>

not only:

latest

103. Environments

Maintain:

development
staging
production

Never use production user data for local development.

104. Git workflow

Branches:

main
feature/*
fix/*
refactor/*

Example:

feature/application-pipeline
feature/ats-parser
fix/job-deduplication

Use pull requests even if initially working alone.

It forces architecture changes to remain reviewable.

105. Commit convention

Use Conventional Commits.

feat:
fix:
refactor:
docs:
test:
build:
ci:
chore:

Example:

feat(applications): add pipeline status history

106. Code quality

Required:

ESLint
Prettier
TypeScript strict mode

Avoid:

any

unless explicitly justified.

Enable:

{
    "strict": true,
    "noUncheckedIndexedAccess": true
}

107. Database constraints

Never rely exclusively on application validation.

Use:

NOT NULL
FOREIGN KEY
UNIQUE
CHECK

where appropriate.

Example:

provider_message_id UNIQUE

is far more reliable than hoping the worker never duplicates an email.

108. Transactions

Operations that must happen together belong in transactions.

Example:

change application status
+
create application event

must be atomic.

109. Events

Internal domain events:

application.created
application.status_changed

interview.created

resume.version_created

email.classified

job.imported

Initially these can remain inside the monolith.

Later they provide natural service boundaries.

110. Architecture evolution

Start:

MODULAR MONOLITH

If scale requires:

              API
               │
       ┌───────┼─────────┐
       ▼       ▼         ▼
    Core    Ingestion    AI
             Service   Service

Likely extraction candidates:

job ingestion
email synchronization
AI/document processing
notifications

Do NOT extract them until there is an operational reason.

111. Performance targets

Initial objectives:

normal API p95       < 300 ms
search p95           < 500 ms
dashboard p95        < 800 ms

async expensive operations:
progress displayed

Do not make the UI wait synchronously for AI.

112. Accessibility

Target:

WCAG 2.2 AA

Support:

keyboard navigation
screen readers
visible focus
semantic HTML
sufficient contrast
reduced motion

Kanban must be usable without drag-and-drop.

113. Responsive design

Primary:

desktop

But core workflows must work on mobile:

check applications
save job
read job
update status
view interview
complete task

114. Design language

JobOS should feel like a professional productivity tool rather than a generic AI wrapper.

Think:

Linear
Notion
Raycast
GitHub
modern CRM

Characteristics:

dense but readable
keyboard friendly
fast
minimal animation
excellent dark mode
clear hierarchy

115. Command palette

Add:

Ctrl/Cmd + K

Commands:

New application
Add job
Search jobs
Open pipeline
Create CV
Run ATS scan
Add interview
Add contact

Power users should be able to navigate extremely quickly.

116. Global search

Search:

jobs
applications
companies
contacts
CVs
notes

Shortcut:

/

or:

Cmd/Ctrl + K

117. MVP

Do NOT implement everything immediately.

MVP 0 — Foundation

Build:

monorepo
database
authentication
UI shell
CI
Docker
logging

118. MVP 1 — Application tracker

Build:

companies
jobs
manual job creation
applications
Kanban
application timeline
notes
tasks
dashboard

At this point JobOS is already usable.

119. MVP 2 — CV system

Build:

profile
experiences
education
skills
CV storage
CV versions
PDF upload
document extraction

120. MVP 3 — ATS

Build:

CV parsing
section detection
keyword extraction
format checks
ATS findings
job comparison

Avoid AI initially where deterministic analysis works.

121. MVP 4 — AI matching

Build:

skill extraction
job requirement extraction
CV matching
semantic analysis
CV improvement suggestions

122. MVP 5 — CV tailoring

Build:

tailoring suggestions
diff interface
claim verification
approval workflow
new CV version
PDF generation

123. MVP 6 — Job ingestion

Start with:

manual URL
browser extension
a few ATS sources

Then:

search
filters
deduplication
saved jobs

124. MVP 7 — Email

Build:

Gmail OAuth
email matching
classification
application events

Then Outlook.

125. MVP 8 — Interviews

Build:

calendar
interviews
preparation
reminders

126. MVP 9 — Analytics

Build:

funnel
CV performance
source performance
response time
stage drop-off
application autopsy

127. MVP 10 — Monetization

Only after the product provides repeatable value:

billing
plans
usage limits
AI quotas
subscription management

128. Recommended implementation order

01 repository
02 monorepo
03 Docker environment
04 database
05 authentication
06 profile

07 companies
08 jobs
09 applications
10 status events
11 Kanban
12 notes/tasks

13 CV storage
14 CV parsing
15 CV versions

16 ATS analysis
17 job matching
18 AI abstraction

19 CV tailoring
20 document generation

21 job ingestion
22 browser extension
23 deduplication

24 contacts
25 Gmail
26 email classification

27 interviews
28 calendar

29 analytics
30 billing

31 observability improvements
32 scaling

129. First database indexes

Important candidates:

applications(user_id, status)
applications(user_id, created_at)

jobs(company_id)
jobs(published_at)

saved_jobs(user_id, job_id)

application_events(application_id, occurred_at)

resume_versions(resume_id, version)

contacts(user_id, company_id)

Search-specific GIN indexes should be added to normalized searchable job fields.

Use EXPLAIN ANALYZE.

Do not blindly create indexes.

130. Important invariants

These rules should eventually have automated tests.

An application belongs to exactly one user.

A user cannot access another user's application.

An application references immutable submitted CV versions.

Application status changes create events.

Historical CV versions are immutable.

External imports are idempotent.

AI cannot silently modify candidate facts.

AI-generated claims must be traceable.

Jobs may have multiple external sources.

Deleting an integration revokes its credentials.

Webhook processing is idempotent.

131. What NOT to build initially

Do not start with:

Kubernetes
Kafka
microservices
Elasticsearch
custom authentication
custom payment infrastructure
native mobile application
20 job scrapers
your own LLM
complex recommendation ML

None of these determine whether people want JobOS.

132. Initial infrastructure

A perfectly credible early production architecture:

                    INTERNET
                       │
                       ▼
                 Reverse Proxy
                       │
              ┌────────┴────────┐
              ▼                 ▼
          Next.js             API
                                  │
                         ┌────────┴────────┐
                         ▼                 ▼
                    PostgreSQL          Redis
                                           │
                                           ▼
                                         Worker
                                           │
                              ┌────────────┼───────────┐
                              ▼            ▼           ▼
                              S3          AI APIs    External APIs

This can support a substantial number of users before architectural changes become necessary.

133. Future architecture

Only after proven demand:

                        API Gateway
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
       ▼                    ▼                    ▼
 Application Service   Job Service       Document Service
       │                    │                    │
       └────────────── Event Bus ────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
       AI Workers       Email Workers    Analytics Workers

Possible event infrastructure:

Kafka
NATS
RabbitMQ

But only introduce it when BullMQ + PostgreSQL no longer satisfy actual requirements.

134. Product moat

The moat is NOT:

"We use AI."

Anyone can call an LLM API.

The valuable dataset is the user's structured job-search history:

profile
+
skills
+
CV versions
+
jobs
+
applications
+
contacts
+
communications
+
interviews
+
outcomes

This creates increasingly useful contextual intelligence.

135. Long-term intelligent layer

Eventually JobOS understands:

what jobs the user targets
what CVs they use
what skills those jobs request
where applications progress
where applications stop
which companies responded
what interview stages occur

This enables useful observations such as:

"PostgreSQL appears in 37% of your saved backend roles
but isn't currently mentioned in your backend CV."

or:

"12 applications have had no activity for more than
10 days."

These are concrete observations derived from user data rather than generic AI advice.

136. Potential future features

Career profile

Persistent structured career knowledge base.

Skill gap analysis

Compare:

desired jobs
vs
current profile

Company intelligence

Track:

applications
contacts
previous interviews
notes
job history

Duplicate detection

Warn:

You applied to this company 4 months ago.

Salary tracking

Store:

listed salary
expected salary
offer

Offer comparison

Compare offers across:

salary
bonus
equity
remote policy
location
benefits

without pretending subjective preferences have a universal score.

Networking CRM

Track:

recruiters
employees
referrals
conversations
follow-ups

Job alerts

Saved searches:

C++ AND Linux
France OR Remote
Junior/Mid

Data export

JSON
CSV
PDF

No vendor lock-in.

137. Browser extension architecture

Eventually:

jobos-extension/
│
├── manifest.json
├── background/
├── content/
├── popup/
└── extractors/

Generic extraction:

JSON-LD JobPosting

first.

Then domain-specific extractors.

Greenhouse
Lever
Ashby
etc.

Fallback:

DOM + user confirmation

138. Import confidence

Imported information should carry confidence.

Example:

{
    "title": {
        "value": "Software Engineer",
        "confidence": 0.99
    },
    "salary": {
        "value": null,
        "confidence": 0
    }
}

Low-confidence extraction should be reviewable.

139. Job expiration

Jobs disappear.

Track:

first_seen_at
last_seen_at
expires_at
source_status

Never delete a job simply because the original listing disappears.

Applications need historical job information.

140. Job snapshots

When an application is submitted, create a snapshot.

Why?

The employer may modify or remove the posting later.

application_job_snapshots

application_id

title
company
description
salary
location

captured_at

This preserves exactly what the candidate applied to.

141. Document snapshots

Similarly:

application
 ├── job snapshot
 ├── CV version
 └── cover letter version

Years later, the user can reconstruct the complete application.

142. Application creation workflow

Ideal UX:

User opens job
       ↓
Apply
       ↓
JobOS suggests CVs
       ↓
User chooses CV
       ↓
Match analysis
       ↓
Optional tailoring
       ↓
Review
       ↓
Generate documents
       ↓
User applies externally
       ↓
Mark submitted
       ↓
Application timeline begins

Later integrations can automate parts of this, but JobOS should avoid uncontrolled automated mass application.

143. Repository documentation

Maintain:

docs/
├── architecture.md
├── database.md
├── api.md
├── security.md
├── privacy.md
├── ai.md
├── job-ingestion.md
├── development.md
├── deployment.md
└── adr/

144. Architecture Decision Records

Important decisions belong in:

docs/adr/

Example:

0001-modular-monolith.md
0002-postgresql.md
0003-bullmq.md
0004-structured-resume-format.md
0005-ai-provider-abstraction.md

Format:

Context
Decision
Alternatives
Consequences

This prevents future contributors from asking:

Why the hell did we do this?

145. Definition of Done

A feature is not finished when:

"it works on my machine"

It is finished when:

implementation complete
types correct
validation implemented
permissions checked
tests passing
errors handled
loading state implemented
empty state implemented
responsive
accessible
logging added
documentation updated
migration included if necessary

146. First milestone

The first genuinely useful release should contain:

authentication

profile

companies

jobs
 └── manual creation

applications
 ├── create
 ├── edit
 ├── archive
 ├── status
 └── timeline

Kanban

CVs
 ├── upload
 ├── store
 └── associate with application

tasks

basic dashboard

Call it:

v0.1.0

Do not wait for AI.

147. Second milestone

v0.2.0

CV parsing
CV versions
ATS scanner
job/CV matching

148. Third milestone

v0.3.0

AI provider
CV tailoring
cover letters
diff/approval system

149. Fourth milestone

v0.4.0

job import
ATS job sources
browser extension
search
deduplication

150. Fifth milestone

v0.5.0

Gmail
email classification
contacts
interviews
calendar

151. Sixth milestone

v0.6.0

advanced analytics
application autopsy
CV statistics
source statistics

152. Public beta

v0.9.0

security review
privacy controls
exports
account deletion
billing
rate limiting
monitoring
backup verification
onboarding

Then:

v1.0.0

153. Development philosophy

For every feature ask:

Does this reduce the amount of manual work required to find a job?

Does this improve information the user can act on?

Does this connect previously fragmented information?

Can the result be explained?

Can the user correct it?

Can the user export it?

Can the user delete it?

If the answer to most of these is no, reconsider the feature.

154. Final architecture philosophy

Start simple:

Next.js
    +
NestJS/Fastify
    +
PostgreSQL
    +
Redis/BullMQ
    +
S3

Keep boundaries strong.

Use asynchronous processing for expensive operations.

Treat PostgreSQL as the source of truth.

Treat CV versions and application history as immutable records.

Treat AI as an assistant, not the database.

Treat imported content as untrusted.

Treat job-source integrations as replaceable adapters.

Treat user professional data as sensitive.

Measure before scaling.

Do not build distributed infrastructure before the product needs distributed infrastructure.

155. The final product

The end goal is not:

another job board.

Nor:

another ATS scanner.

Nor:

another AI CV generator.

The end goal is:

                         ┌─────────────┐
                         │   PROFILE   │
                         └──────┬──────┘
                                │
                  ┌─────────────┼─────────────┐
                  ▼             ▼             ▼
                CVs          Skills       Experience
                  │             │             │
                  └─────────────┼─────────────┘
                                ▼
                         JOB MATCHING
                                │
                                ▼
JOB SOURCES ───────────────► JOB DISCOVERY
                                │
                                ▼
                           APPLICATION
                                │
             ┌──────────────────┼───────────────────┐
             ▼                  ▼                   ▼
          DOCUMENTS          CONTACTS             EMAIL
             │                  │                   │
             └──────────────────┼───────────────────┘
                                ▼
                            INTERVIEWS
                                │
                                ▼
                             OUTCOME
                                │
                                ▼
                            ANALYTICS
                                │
                                ▼
                      BETTER INFORMATION
                       FOR THE NEXT SEARCH

One system containing the complete history and context of a person's job search.

That is JobOS.

License

Choose before public release.

For a proprietary SaaS:

All Rights Reserved

Keep the repository private initially if the product itself is intended to become commercial.

Status

🧪 Pre-alpha

Current objective:

v0.1.0 — Application Tracking Foundation

First implementation target:

pnpm install
pnpm dev

and have a fully functional local environment containing:

web
api
worker
postgres
redis
object storage

From there, build vertically:

Job
 ↓
Application
 ↓
CV
 ↓
ATS
 ↓
Matching
 ↓
Automation
 ↓
Analytics

One production-quality slice at a time.

JobOS — Your job search, as a system.~
# JobOS
