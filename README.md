# nimloth-public

`nimloth-public` is the public website and infrastructure repository for Nimloth Capital. It is designed to be understandable at first read, runnable locally, and deployable to GCP with Terraform-managed infrastructure.

## What is in this repository

- A public website with a welcome page, blog, and long-form research section
- A server-side integration layer for calling private data infrastructure securely
- Terraform for two GCP environments:
  - `nimloth-public-nonprod`
  - `nimloth-public-prod`
- Tests, CI, and deployment workflow scaffolding
- Architecture notes and a lightweight decision log

## Technology choices

- `Next.js` with the App Router and TypeScript
- Repo-managed Markdown content for blog and research publishing
- `Cloud Run` as the initial hosting target
- `Terraform` for all application infrastructure
- `GitHub Actions` for CI and environment deployments

These choices are documented in [docs/architecture.md](docs/architecture.md) and [docs/decisions/](docs/decisions/).
Deployment setup is outlined in [docs/deployment.md](docs/deployment.md).

## Local development

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

The default local mode uses mock data so the site works without access to the private data platform.

## Quality checks

```bash
npm run check
```

## Repository layout

```text
app/                  Next.js routes
components/           Shared UI
content/              Markdown source for blog and research
docs/                 Architecture and design decisions
infra/                Terraform modules and environment roots
lib/                  Content loading and secure API access logic
tests/                Unit tests
```

## Branching and environments

- `dev` is the main development branch
- `main` is the production branch
- `dev` auto-deploys to `nimloth-public-nonprod`
- `main` is intended to deploy `nimloth-public-prod`

## Current deployment assumptions

The site is built as a container and deployed to `Cloud Run`. The public app talks to the separate data platform only from the server side. In GCP, the recommended default is workload identity based service-to-service authentication, not browser credentials and not embedded shared secrets.

To avoid duplicating infrastructure cost, the non-production website is expected to read from a narrow, read-only production data API surface. That integration should be explicitly scoped so the non-production service account can only call safe public-summary endpoints.

## Next design decisions to review together

- Whether blog and research publishing should remain repo-managed Markdown or move to a CMS later
