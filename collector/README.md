# Creator Control collector

Private, write-only intake endpoint for the public GitHub Pages claim form.

## What it does

- accepts one validated public-page claim at `POST /api/claim`
- rejects unknown browser origins, rapid repeat submissions and honeypot spam
- creates a `Claims` record in the Creator Control Airtable base
- never receives, stores or requests platform passwords

## Deployment boundary

Deploy this directory as a separate Vercel project. The public website remains on GitHub Pages.

Set this **encrypted Vercel environment variable** before activating the public form:

- `AIRTABLE_TOKEN`: Airtable personal access token scoped only to create records in this base

Optional:

- `ALLOWED_ORIGINS`: `https://gonzaloramon-ia.github.io`

Use `GET /api/health` after deployment. It returns `configured: true` only when the collector can receive requests.

The Airtable `Claims` table needs a text field called `Goal notes` if free-text notes are collected. It is optional in the request and can be omitted from the public form.
