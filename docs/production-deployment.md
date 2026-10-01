# Production Deployment

JobOS v1.0.0 ships production Docker targets for the API and web app plus `docker-compose.prod.yml` for a single-host deployment.

## Required Environment

```bash
POSTGRES_PASSWORD=
EXTENSION_IMPORT_TOKEN=
NEXT_PUBLIC_API_URL=https://api.example.com
RATE_LIMIT_MAX=300
RATE_LIMIT_WINDOW_MS=60000
```

## Build and Start

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec api pnpm db:migrate
```

## Monitoring

- JSON health: `GET /health`
- JSON runtime metrics: `GET /health/metrics`
- Prometheus text metrics: `GET /health/metrics/prometheus`

## Release Verification

Run `pnpm build`, `pnpm typecheck`, `pnpm test`, apply migrations, start the API, and run `API_URL=<api-url> pnpm test:api`.
