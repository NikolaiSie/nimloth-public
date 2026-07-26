# ADR 0002: Content and API Boundary

## Status

Accepted

## Decision

Store blog and research content as Markdown in the repository and access the private data platform only from server-side code.

## Why

- Repository-managed content keeps publishing transparent and easy to review
- Server-side API access prevents browser credential leakage
- Local mock mode keeps development productive without private access

## Tradeoffs

- Non-technical publishing remains Git-based for now
- API integration requires some deployment-time configuration
