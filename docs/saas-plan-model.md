# SaaS Plan Model

JobOS v2.1.0 defines the public SaaS catalog as deterministic database seed data.
JobOS v2.1.1 enforces the free-tier usage boundaries through the billing service.
JobOS v2.2.0 adds the Stripe integration contract while keeping deterministic local fakes for development and tests.

## Plans

- `free`: limited personal use for manual tracking, local AI, small document exports, and a small copilot allowance.
- `premium`: individual paid plan with premium AI entitlement, provider sync, larger copilot and export limits, and document templates.
- `team`: paid team plan with premium features, team workspace entitlement, larger quotas, priority support flag, and five included seats.

The legacy `pro` plan is marked inactive by migration and existing `pro` subscriptions are moved to `premium`.

## Local Billing

Without `STRIPE_SECRET_KEY`, checkout remains deterministic and local:

- `POST /billing/checkout` accepts `planCode`.
- The default checkout target is `premium`.
- New users receive an active `free` subscription on first billing status read.

When `STRIPE_SECRET_KEY` is set, `POST /billing/checkout` returns a deterministic Stripe-mode checkout session descriptor and stores the customer/subscription mapping as `incomplete`. Entitlements change after a signed webhook confirms the subscription state.

`POST /billing/portal` returns a customer portal URL. In local mode it uses `jobos://billing/local-portal`; in Stripe mode it uses `BILLING_PUBLIC_URL`.

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

Set these environment variables before using real Stripe billing:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PREMIUM`
- `STRIPE_PRICE_TEAM`
- `BILLING_PUBLIC_URL`
- `BILLING_PORTAL_RETURN_URL`
- `APP_BASE_URL`

Webhook payloads are accepted at `POST /billing/webhook`. Local fixtures sign the stable JSON payload with HMAC-SHA256 in `x-jobos-webhook-signature`; Stripe deployments should pass the Stripe webhook signing secret through `STRIPE_WEBHOOK_SECRET`.

The webhook processor records provider event IDs in `billing_webhook_events` before applying state changes, so replayed events are acknowledged as duplicates and skipped. Billing state transitions are audited in `billing_usage_events` with `metric: "billing_state"`.
