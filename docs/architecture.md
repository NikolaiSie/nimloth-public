# Architecture Overview

## Goals

- Keep the public repository clean enough to use as an academic portfolio artifact
- Make the site runnable locally without private infrastructure access
- Preserve a secure boundary between the browser and the separate data platform
- Keep deployment and cloud resources fully described in Terraform

## Application architecture

The application is a `Next.js` server-rendered site deployed as a container. Public content lives in the repository as Markdown files, which keeps authorship and review transparent. The server layer exposes a narrow internal API route for market or research snapshots and calls the private data platform from the server side only.

```text
Browser
  -> Firebase Hosting (production custom domain and managed TLS)
    -> Public Next.js application on Cloud Run
    -> Internal server route /api/market-snapshot
      -> Private data API
```

## Security model

- The browser never receives private API credentials
- Local development defaults to mock mode
- In deployed environments, the public service authenticates to the private API with a server-side API key header
- The public website service account is intentionally isolated so its permissions can stay minimal
- If non-production reads production data, it must read only through a curated read-only API path and receive only the exact permission needed for that path

## Infrastructure layout

The Terraform code is split into reusable modules and environment-specific roots.

- `infra/modules/project_services`: enables required Google APIs
- `infra/modules/artifact_registry`: creates a Docker repository
- `infra/modules/service_account`: creates the runtime identity and grants roles
- `infra/modules/cloud_run_service`: deploys the public application
- `infra/modules/firebase_hosting`: routes the production domains to Cloud Run
- `infra/environments/nonprod`: root for `nimloth-public-nonprod`
- `infra/environments/prod`: root for `nimloth-public-prod`

## Design principles used here

- Prefer clear files over clever abstractions
- Keep infrastructure modules narrow and composable
- Make the local development path frictionless
- Document major decisions where they are made
