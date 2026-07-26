# Infrastructure

This directory contains Terraform for the public website.

## Layout

- `bootstrap/`: optional first-step resources such as Terraform state buckets
- `modules/`: reusable building blocks
- `environments/nonprod/`: root module for `nimloth-public-nonprod`
- `environments/prod/`: root module for `nimloth-public-prod`

## Deployment model

- `dev` branch auto-deploys `nimloth-public-nonprod`
- `main` branch is intended to deploy `nimloth-public-prod`

## What this repository manages today

- Required Google APIs
- Artifact Registry repository for the app image
- Runtime service account and project roles
- Cloud Run service for the public website

## Not yet included

- Custom domain and load balancer resources
- DNS record management
- Monitoring and alerting
- GitHub to GCP workload identity bootstrap
