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
npm run dev
npm run check                # lint, typecheck and tests; run before committing
npm run build
```

There is no mock data mode; `DATA_API_MODE` in `.env.example` isn't read by the code. Without `NIMLOTH_DATA_API_BASE_URL` and `NIMLOTH_DATA_API_KEY`, the pages still render and the routes under `app/api/` return 503 with a "temporarily unavailable" message. That's expected in cloud sessions, so check data views on nonprod after a push to `dev`.

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

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
