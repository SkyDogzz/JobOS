# Backup and Restore Verification

JobOS local beta data is stored in Postgres plus generated local artifacts. Verify backups before public beta use.

## Backup

```bash
docker compose exec postgres pg_dump -U jobos jobos > jobos-backup.sql
curl http://localhost:4000/account/export > jobos-export.json
```

## Restore Drill

```bash
docker compose exec -T postgres psql -U jobos jobos < jobos-backup.sql
pnpm db:migrate
API_URL=http://localhost:4000 pnpm test:api
```

## Acceptance

- `/health` returns `status: ok`.
- `/health/metrics` reports version, uptime, memory, and rate limit configuration.
- `pnpm test:api` passes against the restored database.
- A fresh `/account/export` includes jobs, applications, resumes, documents, tasks, and AI artifacts.
