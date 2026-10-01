# v1.0.0 Release Verification

Before tagging a production release:

- Confirm `package.json` is `1.0.0`.
- Run `pnpm build`.
- Run `pnpm typecheck`.
- Run `pnpm test`.
- Apply database migrations against the release database.
- Run `API_URL=<release-api> pnpm test:api`.
- Verify `/health/metrics/prometheus` is scrapeable.
- Create a fresh `/account/export` and store it with the release backup.
- Complete a restore drill from `docs/backup-restore-verification.md`.
