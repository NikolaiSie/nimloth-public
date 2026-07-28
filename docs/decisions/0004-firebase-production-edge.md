# ADR 0004: Firebase Hosting as the Production Edge

## Status

Accepted

## Context

The public site needs managed TLS and the custom domains
`nimlothcapital.com` and `www.nimlothcapital.com`. A global external load
balancer is the most flexible Google Cloud option, but its fixed monthly cost
is disproportionate for the site's expected traffic. Direct Cloud Run domain
mapping has no fixed charge but remains a preview feature that Google does not
recommend for production.

The domain also carries Google Workspace mail. Replacing its authoritative DNS
configuration without first migrating every existing MX and TXT record could
interrupt email.

## Decision

Production uses Firebase Hosting as the public edge and rewrites all application
paths to the existing Cloud Run service in `us-east4`.

- Non-production remains protected by direct Cloud Run IAP.
- Production disables IAP and disables the Cloud Run invoker IAM check.
- Production does not add an `allUsers` IAM member because the organization
  policy rejects that principal.
- Terraform manages the Firebase project integration, Hosting site, release,
  rewrite, primary domain, and `www` redirect.
- Authoritative DNS remains at its current provider. Terraform outputs the
  exact Firebase-required records, which are added without removing mail
  records.

## Consequences

- Managed TLS, custom-domain routing, and CDN delivery have no fixed load
  balancer charge.
- Production Cloud Run's generated URL is also publicly callable. The
  application must therefore enforce any application-level access controls
  itself.
- The first production deployment creates domain associations before DNS is
  ready. Firebase reconciles ownership and certificate state after the records
  are added.
- DNS remains an explicit external boundary until its existing records can be
  inventoried and safely migrated into Terraform.
