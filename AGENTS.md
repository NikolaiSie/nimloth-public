# nimloth-public

The public Nimloth Capital website: a Next.js site (App Router, TypeScript) with a blog, long-form research and market data views, deployed to Cloud Run with Terraform. This repository is public.

## Layout

| Path | What it holds |
| --- | --- |
| `app/` | Routes, including the server-side routes under `app/api/`. |
| `components/` | Shared UI. |
| `content/` | Markdown (not MDX) for `blog/` and `research/`. |
| `lib/` | Content loading, the data API client, and the momentum chart logic. |
| `infra/` | Terraform modules and the `nonprod` and `prod` environment roots. |
| `docs/` | Architecture, deployment, the design system, and decision records in `docs/decisions/`. |
| `tests/` | Vitest unit tests. |

## Commands

Node 24 or later.

```bash
npm install
cp .env.example .env.local   # mock data by default, no private access needed
npm run dev
npm run check                # lint, typecheck and tests; run before committing
npm run build
```

## Branches and deploys

- Work on `dev`. Commit and push only when the user asks, and only to `dev`. The user merges to `main`.
- Every push to `dev` deploys to nonprod. A push to `main` deploys production.
- Stage the files you changed by name. Don't `git add -A`.

## Security

This repository is public.

- Never commit secrets, API keys, `.env.local` or service account files.
- Don't add details of the private data platform beyond what `docs/` already says: no internal URLs, bucket or table names, or credentials.
- The data API is called from the server only, with `NIMLOTH_DATA_API_KEY` in the `X-API-Key` header. Nothing private reaches the browser.

## Conventions

- Follow `docs/design-system.md`: plain CSS with no CSS framework, and the palette and type defined there.
- Check layouts at phone width. Charts and tooltips must not clip on small screens.
- Record significant decisions as a new numbered file in `docs/decisions/`.
- Commit Terraform provider lock files along with provider changes.
