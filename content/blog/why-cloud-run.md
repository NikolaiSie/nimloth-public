---
title: Why Cloud Run is the first deployment target
summary: The deployment target should support secure server-side code without turning the public site into an infrastructure science project.
publishedAt: 2026-07-20
tags:
  - gcp
  - deployment
featured: true
---

Choosing a first hosting target is partly a technical question and partly a discipline question.

The site needs server-side execution because the browser is not allowed to call private infrastructure directly. A static host would push complexity somewhere else. Cloud Run provides a direct path from source code to container to public service without forcing an early commitment to Kubernetes.

For a public repository, that simplicity matters. Professors and future collaborators should be able to understand the deployment shape quickly.
