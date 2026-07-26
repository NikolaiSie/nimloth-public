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

## Bootstrap steps still required

Before full GitHub-based deployments can be turned on, the following need to exist:

1. A remote Terraform state bucket for each environment, or a consciously shared backend with clear locking and access control
2. A GitHub to GCP authentication path, ideally Workload Identity Federation
3. Repository or environment variables describing project ids, region, workload identity provider, and deployer service account
4. Billing enabled on the GCP project
5. A decision on whether custom domain resources will be managed in this repository or in shared infrastructure

## Suggested GitHub environment variables

### Nonprod

- `GCP_PROJECT_ID=nimloth-public-nonprod`
- `GCP_REGION=us-east4`
- `TF_STATE_BUCKET=<nonprod-state-bucket>`
- `DATA_API_BASE_URL=<prod-read-only-data-api-base-url>`
- `DATA_API_AUDIENCE=<prod-read-only-data-api-audience>`

### Prod

- `GCP_PROJECT_ID=nimloth-public-prod`
- `GCP_REGION=us-east4`
- `TF_STATE_BUCKET=<prod-state-bucket>`
- `DATA_API_BASE_URL=<prod-private-api-base-url>`
- `DATA_API_AUDIENCE=<prod-private-api-audience>`

## Suggested GitHub secrets or protected variables

- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_DEPLOYER_SERVICE_ACCOUNT`

## What the nonprod workflow now expects

The nonprod workflow is designed to run on every push to `dev` and uses two Terraform applies:

1. A bootstrap apply with `deploy_website=false` so Artifact Registry and the runtime service account exist before the image build
2. A full apply with `deploy_website=true` and the pushed image URI

That removes the first-deploy circular dependency between Artifact Registry and the Cloud Run service image reference.

By default, non-production does not grant `allUsers` invoke access. This avoids deployment failure in GCP organizations that block public IAM members through org policy. Production can still be configured as public later.

## Manual local Terraform flow

```bash
cd infra/environments/nonprod
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

Use the corresponding `prod` directory only after non-production is validated.

## Why the workflows are still conservative

The repository includes CI and environment-specific workflow entry points, but it does not pretend the deployment problem is solved until backend state and GitHub-to-GCP auth are wired correctly. That is deliberate: a readable repository should not hide bootstrap assumptions in half-working automation.

## Access rule for nonprod to prod data

If the production data API is hosted on Cloud Run, the clean default is:

1. Give the non-production website its own runtime service account in `nimloth-public-nonprod`
2. Allow that identity to invoke only the production API service or gateway that exposes public-safe read-only summaries
3. Keep write paths and sensitive endpoints behind separate services, routes, or authorization checks

The current Terraform defaults create the runtime service account as `nimloth-public-site@<project-id>.iam.gserviceaccount.com`.
