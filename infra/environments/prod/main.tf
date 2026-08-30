provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

locals {
  project_services = [
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "firebase.googleapis.com",
    "firebasehosting.googleapis.com",
    "iap.googleapis.com",
    "run.googleapis.com",
  ]
}

module "project_services" {
  source     = "../../modules/project_services"
  project_id = var.project_id
  services   = local.project_services
}

module "artifact_registry" {
  source        = "../../modules/artifact_registry"
  project_id    = var.project_id
  region        = var.region
  repository_id = "nimloth-public"
  description   = "Artifact Registry repository for Nimloth public web images."
  depends_on    = [module.project_services]
}

module "runtime_service_account" {
  source       = "../../modules/service_account"
  project_id   = var.project_id
  account_id   = "nimloth-public-site"
  display_name = "Nimloth public website runtime"
  project_roles = [
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
  ]
  depends_on = [module.project_services]
}

module "website" {
  count  = var.deploy_website ? 1 : 0
  source = "../../modules/cloud_run_service"
  providers = {
    google-beta = google-beta
  }
  allow_unauthenticated = var.allow_unauthenticated
  iap_enabled           = var.iap_enabled
  invoker_iam_disabled  = var.invoker_iam_disabled
  project_id            = var.project_id
  region                = var.region
  service_name          = "nimloth-public-web"
  service_account_email = module.runtime_service_account.email
  image                 = var.container_image
  env_vars = {
    DATA_API_MODE             = var.data_api_key != "" ? "live" : "mock"
    NIMLOTH_CANONICAL_ORIGIN  = "https://${var.primary_domain}"
    NIMLOTH_DATA_API_BASE_URL = var.data_api_base_url
    NIMLOTH_DATA_API_KEY      = var.data_api_key
  }
  depends_on = [module.project_services]
}

module "firebase_hosting" {
  count  = var.deploy_website ? 1 : 0
  source = "../../modules/firebase_hosting"
  providers = {
    google-beta = google-beta
  }

  cloud_run_region       = var.region
  cloud_run_service_name = module.website[0].service_name
  deployment_id          = var.container_image
  primary_domain         = var.primary_domain
  project_id             = var.project_id
  redirect_domains       = var.redirect_domains
  site_id                = var.firebase_site_id

  depends_on = [module.project_services]
}

output "artifact_registry_repository" {
  value = module.artifact_registry.repository_name
}

output "public_runtime_service_account_email" {
  value = module.runtime_service_account.email
}

output "service_url" {
  value = var.deploy_website ? module.website[0].service_url : null
}

output "firebase_hosting_url" {
  value = var.deploy_website ? module.firebase_hosting[0].hosting_url : null
}

output "firebase_domain_status" {
  value = var.deploy_website ? module.firebase_hosting[0].domain_status : {}
}

output "firebase_required_dns_updates" {
  description = "Add these records at the current authoritative DNS provider without replacing existing mail records."
  value       = var.deploy_website ? module.firebase_hosting[0].required_dns_updates : {}
}
