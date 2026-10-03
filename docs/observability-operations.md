# Observability and Operations

JobOS exposes deterministic local observability without requiring paid providers.

## Metrics

- `GET /health/metrics` returns process health, request counters, latency buckets, recent traces, and redacted recent errors.
- `GET /health/metrics/prometheus` exposes Prometheus text metrics for API uptime, memory, request totals, failures, job imports, AI generation routes, sync routes, and request latency buckets.

## Redaction

Operational error context redacts keys containing token, password, secret, authorization, cookie, body, or content before storing support-safe diagnostics.

## Suggested Grafana Panels

- API request rate: `rate(jobos_api_requests_total[5m])`
- API failures: `rate(jobos_api_failures_total[5m])`
- Job imports: `rate(jobos_job_imports_total[1h])`
- AI generations: `rate(jobos_ai_generations_total[1h])`
- Sync requests: `rate(jobos_syncs_total[1h])`
- Request latency buckets: `jobos_api_request_duration_ms_bucket`
