# End-to-End Testing

JobOS uses Playwright for browser coverage of the authenticated product flows.

Run the suite locally:

```sh
pnpm test:e2e
```

The Playwright web server command starts Postgres and Redis with Docker Compose, creates a dedicated `jobos_e2e` database when needed, runs migrations against that database, resets application data there, then launches the API and web apps. The reset script truncates app-owned tables while leaving migration metadata intact.

Useful variants:

```sh
pnpm test:e2e -- --headed
pnpm test:e2e -- --debug
pnpm test:e2e:reset
```

Ports default to `4000` for the API and `3000` for the web app. Override them with `E2E_API_PORT` and `E2E_WEB_PORT` when another local process is already using those ports. The isolated database defaults to `postgres://jobos:jobos@localhost:5432/jobos_e2e`; override it with `E2E_DATABASE_URL`.
