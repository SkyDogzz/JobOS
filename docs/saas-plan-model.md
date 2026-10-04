# SaaS Plan Model

JobOS v2.1.0 defines the public SaaS catalog as deterministic database seed data.

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

## Production Notes

The v2.1 plan catalog intentionally does not require Stripe product or price IDs. Those will be introduced in the Stripe billing integration minor so real provider setup can be mapped explicitly instead of guessed.
