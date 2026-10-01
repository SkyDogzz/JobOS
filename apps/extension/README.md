# JobOS Browser Extension

Minimal WebExtension scaffold for saving the current job page into JobOS.

## Local Development

1. Start JobOS API locally. If the default ports are occupied, use:

```bash
API_PORT=4010 WEB_PORT=3011 NEXT_PUBLIC_API_URL=http://localhost:4010 pnpm dev:local
```

2. Open Chrome or Edge extension settings and load `apps/extension` as an unpacked extension.
3. Open the extension popup.
4. Set API URL to `http://localhost:4000` or your alternate local API URL.
5. Set token to `jobos-dev-extension-token` for local development.
6. Open a job page and choose `Save current page`.

Production deployments must set `EXTENSION_IMPORT_TOKEN` and use that token in the extension popup.

## Import Contract

The popup captures the active tab and posts to:

```http
POST /jobs/import
Authorization: Bearer <EXTENSION_IMPORT_TOKEN>
```

The payload uses contract version `0.4.4` and includes the page URL, page HTML/text, optional extracted title and description, source name, and capture timestamp.
