# ADR 0001: Stack and Deployment

## Status

Accepted

## Decision

Use `Next.js` with TypeScript for the public web application and deploy it as a container to `Cloud Run`.

## Why

- The stack is mainstream, well-understood, and easy to present
- It supports a mixed site with static content and dynamic server-side API access
- Container deployment keeps infrastructure explicit and portable

## Tradeoffs

- More moving parts than a purely static site
- Custom domain and edge configuration are a separate concern from the app itself
