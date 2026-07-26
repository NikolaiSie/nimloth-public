---
title: Designing the boundary between public web and private data infrastructure
summary: The public site should be useful without becoming a tunnel into the private platform.
publishedAt: 2026-07-18
tags:
  - security
  - systems
featured: true
---

## Constraint

The website is public. The data platform is not. That means the browser cannot be a trusted client.

## Resulting architecture

The site can expose a narrow server-side route that fetches a curated public summary from the internal platform. In GCP, the clean default is service-to-service authentication using the workload identity of the public app.

## Why not direct browser calls

Direct browser calls create avoidable risk:

- credentials leak into client code or browser storage,
- CORS and origin checks become an illusion of security,
- and the shape of the private API gets exposed more widely than necessary.

The better pattern is to keep the public app as an application boundary, not just a rendering layer.
