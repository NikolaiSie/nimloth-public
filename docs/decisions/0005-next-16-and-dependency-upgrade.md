# ADR 0005: Upgrade to Next.js 16 and Current Tooling

## Status

Accepted

## Context

`npm audit` reported 22 vulnerabilities (3 critical, 10 high, 9 moderate) in
the dependency tree. Most could only be fixed with major-version upgrades:
`next` 14, `vitest` 3, `zod` 3 and `eslint-config-next` 14 were all affected.
ESLint 8, required by `eslint-config-next` 14, is no longer supported.

## Decision

- Upgrade `next` and `eslint-config-next` to 16, `vitest` and
  `@vitest/coverage-v8` to 5, `zod` to 4, `jsdom` to 31 and `eslint` to 9.
- Keep React 18, which Next.js 16 still supports, to limit the scope of the
  change.
- Stay on ESLint 9 rather than 10. The plugins bundled with
  `eslint-config-next` 16 (`import`, `jsx-a11y` and `react`) do not yet accept
  ESLint 10 as a peer. ESLint 9 prints a deprecation notice on install; move to
  ESLint 10 once `eslint-config-next` supports it.
- Replace `.eslintrc.json` with a flat `eslint.config.mjs` that applies the
  same `core-web-vitals` rules.
- Rename `middleware.ts` to `proxy.ts`, following the Next.js 16 convention.
  The canonical-host redirect is unchanged.
- Await the dynamic route `params`, which are a promise from Next.js 15 on.
- Rewrite the two effects flagged by the `react-hooks/set-state-in-effect`
  rule: the cumulative chart derives its loading and error state from the
  query of the last settled request, and the heatmap closes its tooltip during
  render when the matrix changes.

## Consequences

- `npm audit` reports no vulnerabilities.
- Route behaviour, response codes and security headers match the previous
  build, checked route by route against it.
- A later move to React 19 and ESLint 10 remains open.
