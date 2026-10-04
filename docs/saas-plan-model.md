# SaaS Plan Model

JobOS v2.1.0 defines the public SaaS catalog as deterministic database seed data.
JobOS v2.1.1 enforces the free-tier usage boundaries through the billing service.

## Plans

- `free`: limited personal use for manual tracking, local AI, small document exports, and a small copilot allowance.
- `premium`: individual paid plan with premium AI entitlement, provider sync, larger copilot and export limits, and document templates.
- `team`: paid team plan with premium features, team workspace entitlement, larger quotas, priority support flag, and five included seats.

The legacy `pro` plan is marked inactive by migration and existing `pro` subscriptions are moved to `premium`.

## Local Billing

Until Stripe is implemented, checkout remains deterministic and local:

- `POST /billing/checkout` accepts `planCode`.
- The default checkout target is `premium`.
- New users receive an active `free` subscription on first billing status read.

## Free Tier Enforcement

The API records usage events and blocks writes before data is mutated when a free plan reaches these limits:

- saved jobs
- applications
- resumes
- copilot messages
- copilot actions
- AI generations
- document exports
- discovered job imports

Limit hits return HTTP 403 with `code: "PLAN_LIMIT_REACHED"`, the blocked metric, the current usage, the limit, `requiredPlan: "premium"`, and `preserveDraft: true`. Clients should keep form/chat state intact and show the upgrade prompt rather than discarding in-progress work.

Entitlement blocks return HTTP 403 with `code: "PLAN_ENTITLEMENT_REQUIRED"` and the required plan.

## Production Notes

The v2.1 plan catalog intentionally does not require Stripe product or price IDs. Those will be introduced in the Stripe billing integration minor so real provider setup can be mapped explicitly instead of guessed.
