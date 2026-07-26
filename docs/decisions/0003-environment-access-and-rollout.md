# ADR 0003: Environment Access and Rollout

## Status

Accepted

## Decision

- Every push to `dev` should auto-deploy to `nimloth-public-nonprod`
- The non-production website may read production data, but only through a narrow read-only API surface designed for public-safe summaries

## Why

- Continuous deployment to non-production keeps iteration fast
- Duplicating the data layer across environments would add cost without much benefit for this public site
- The website is a presentation layer, so the important boundary is read-only scope and least-privilege access, not full data-environment duplication

## Constraints this creates

- Non-production must not get broad access to production systems
- The production data API must separate safe read-only endpoints from sensitive internal capabilities
- IAM should grant the non-production website identity only the minimum access required
