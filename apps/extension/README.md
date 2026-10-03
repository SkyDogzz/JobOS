# JobOS Browser Extension

WebExtension workflow for reviewing and saving the current job page into JobOS.

## Local Development

1. Start JobOS API locally. If the default ports are occupied, use:

```bash
API_PORT=4010 WEB_PORT=3011 NEXT_PUBLIC_API_URL=http://localhost:4010 pnpm dev:local
```

2. Open Chrome or Edge extension settings and load `apps/extension` as an unpacked extension.
3. Open the extension popup.
4. Set API URL to `http://localhost:4000` or your alternate local API URL.
5. Set token to `jobos-dev-extension-token` for local development.
6. Open a job page and choose `Preview current page`.
7. Review the parsed fields and possible duplicate warning, then choose `Save to JobOS`.

Production deployments must set `EXTENSION_IMPORT_TOKEN` and use that token in the extension popup. Imports are scoped to `EXTENSION_IMPORT_USER_EMAIL` when set, or the local JobOS dev user otherwise.

## Import Contract

The popup captures the active tab and first posts to:

```http
POST /jobs/import/preview
Authorization: Bearer <EXTENSION_IMPORT_TOKEN>
```

Preview validates the extension session, parses role fields, and returns duplicate candidates without creating or updating a job. Saving then posts the same captured payload to:

```http
POST /jobs/import
Authorization: Bearer <EXTENSION_IMPORT_TOKEN>
```

The payload uses contract version `0.4.4` and includes the page URL, page HTML/text, optional extracted title and description, source name, and capture timestamp. Duplicate source URLs update the existing JobOS job; new source URLs create a job.
