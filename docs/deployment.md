# Deployment Guide

## Environment model

- `dev` branch auto-deploys to `nimloth-public-nonprod`
- `main` branch targets `nimloth-public-prod`

This repository assumes non-production is the place to test infrastructure and application changes before promoting them to production through a merge into `main`.

Non-production does not require a separate copy of the data platform. The intended model is for the non-production website to call a safe read-only production data API surface.

## Deployment shape

1. Bootstrap the target environment so required APIs, Artifact Registry, and the runtime service account exist
2. Build the Next.js application into a container image
3. Push that image to Artifact Registry in the target project
4. Apply the Terraform root for the target environment with the new image reference
5. Let the Cloud Run service pick up the new image
6. In production, release a Firebase Hosting configuration that rewrites requests to Cloud Run

## Bootstrap requirements

GitHub-based deployments require:

1. The existing remote Terraform state bucket for each environment
2. The existing GitHub Workload Identity Federation provider
3. GitHub environment variables and secrets for each project
4. Billing enabled on both GCP projects
5. `roles/firebase.admin` on the production GitHub deployer service account

Grant the production deployer its additional Firebase permission once:

```bash
gcloud projects add-iam-policy-binding nimloth-public-prod \
  --member="serviceAccount:<production-deployer-service-account>" \
  --role="roles/firebase.admin"
```

The existing service usage permission remains responsible for enabling
`firebase.googleapis.com` and `firebasehosting.googleapis.com`.

## Suggested GitHub environment variables

### Nonprod

- `GCP_PROJECT_ID=nimloth-public-nonprod`
- `GCP_REGION=us-east4`
- `TF_STATE_BUCKET=<nonprod-state-bucket>`
- `NIMLOTH_DATA_API_BASE_URL=<prod-read-only-data-api-base-url>`

### Production

- `GCP_PROJECT_ID=nimloth-public-prod`
- `GCP_REGION=us-east4`
- `TF_STATE_BUCKET=<prod-state-bucket>`
- `NIMLOTH_DATA_API_BASE_URL=<prod-private-api-base-url>`

## Suggested GitHub secrets or protected variables

- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_DEPLOYER_SERVICE_ACCOUNT`
- `NIMLOTH_DATA_API_KEY`

## What the nonprod workflow now expects

The nonprod workflow is designed to run on every push to `dev` and uses two Terraform applies:

1. A targeted bootstrap apply with `deploy_website=false` so APIs, Artifact Registry, and the runtime service account exist before the image build without removing the existing website from persistent state
2. A full apply with `deploy_website=true` and the pushed image URI

That removes the first-deploy circular dependency between Artifact Registry and the Cloud Run service image reference.
The workflow also imports known singleton resources into Terraform state before apply so reruns can recover from partially-created non-production infrastructure instead of repeatedly failing with `409 already exists`.

By default, non-production does not grant `allUsers` invoke access. This avoids deployment failure in GCP organizations that block public IAM members through org policy.
Non-production now also enables direct Cloud Run IAP in Terraform, so browser access is preserved across deploys instead of relying on manual console state. Terraform also grants the project IAP service agent permission to invoke the service.

## What the production workflow now expects

The production workflow mirrors nonprod with a separate backend prefix and project:

1. A targeted bootstrap apply with `deploy_website=false`
2. A build and push into the prod Artifact Registry repository
3. A full apply with `deploy_website=true`
4. A Firebase Hosting release that routes both production domains to Cloud Run

Like nonprod, it imports known singleton resources into Terraform state before apply so reruns can recover from partially-created production infrastructure instead of failing on `409 already exists`.
Production disables direct Cloud Run IAP and disables the Cloud Run invoker IAM check. This provides public access without an `allUsers` IAM binding, which the organization policy rejects. Firebase Hosting supplies the custom-domain edge, managed certificate, and `www` redirect.

## First custom-domain rollout

The first successful `main` deployment creates Firebase associations for
`nimlothcapital.com` and `www.nimlothcapital.com` without waiting for DNS.
The workflow's final step prints `firebase_required_dns_updates`.

1. Open the production deployment log and copy only the records under each
   `desired` DNS block.
2. Add those records at the domain's current authoritative DNS provider.
3. Remove only website records that directly conflict with Firebase's requested
   A, AAAA, or CNAME records.
4. Preserve all Google Workspace MX, SPF, DKIM, DMARC, and unrelated TXT
   records.
5. Do not change the domain's nameservers.
6. Allow up to 24 hours for DNS verification and managed certificate issuance.

The next Terraform apply refreshes `firebase_domain_status`. Both domains are
ready when ownership and host state are active. `www.nimlothcapital.com`
returns a permanent redirect to `nimlothcapital.com`.

## Manual local Terraform flow

```bash
cd infra/environments/nonprod
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

Use the corresponding `prod` directory only after non-production is validated.

## Infrastructure validation

CI formats and validates both environment roots. Native Terraform tests also
verify Cloud Run access-mode invariants and the Firebase-to-Cloud-Run routing
configuration with mocked providers, so tests never create cloud resources.

## Access rule for nonprod to prod data

If the production data API is hosted on Cloud Run, the clean default is:

1. Give the non-production website its own runtime service account in `nimloth-public-nonprod`
2. Store the shared API key only in the website environment secret store, never in client code
3. Keep write paths and sensitive endpoints behind separate services, routes, or authorization checks

The current Terraform defaults create the runtime service account as `nimloth-public-site@<project-id>.iam.gserviceaccount.com`.
If the API key is not set yet, the website stays in mock mode rather than failing deployment.
