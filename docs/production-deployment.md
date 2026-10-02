# Production Deployment

JobOS v1.1.0 ships production Docker targets for the API and web app plus `docker-compose.prod.yml` for a single-host deployment.

## Required Environment

```bash
POSTGRES_PASSWORD=
EXTENSION_IMPORT_TOKEN=
NEXT_PUBLIC_API_URL=https://api.example.com
RATE_LIMIT_MAX=300
RATE_LIMIT_WINDOW_MS=60000
API_HOST_PORT=4000
WEB_HOST_PORT=3000
```

## Build and Start

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec api pnpm db:migrate
```

## Production Smoke

Run the full single-host release smoke before promoting a release:

```bash
pnpm smoke:prod
```

The smoke command builds `docker-compose.prod.yml`, starts Postgres, Redis, API, and web, waits for API health, applies migrations inside the API container, runs `pnpm test:api` against the live production API, verifies the web server responds, and shuts the stack down. It defaults to host ports `4100` and `3100` so it can run beside local dev services. Production operators should export real values for `POSTGRES_PASSWORD`, `EXTENSION_IMPORT_TOKEN`, `NEXT_PUBLIC_API_URL`, `API_HOST_PORT`, and `WEB_HOST_PORT`.

## Monitoring

- JSON health: `GET /health`
- JSON runtime metrics: `GET /health/metrics`
- Prometheus text metrics: `GET /health/metrics/prometheus`

## Rollback and Shutdown

If a smoke or release deploy fails, capture logs first:

```bash
docker compose -f docker-compose.prod.yml logs --tail=200 api web postgres redis
```

Then shut the stack down:

```bash
docker compose -f docker-compose.prod.yml down
```

To roll back, redeploy the previous image or commit, rerun migrations only if its release notes require them, and rerun `pnpm smoke:prod` before returning traffic.

## Release Verification

Run `pnpm build`, `pnpm typecheck`, `pnpm test`, apply migrations, start the API, run `API_URL=<api-url> pnpm test:api`, and run `pnpm smoke:prod`.
