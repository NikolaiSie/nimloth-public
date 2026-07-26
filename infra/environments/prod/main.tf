provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  project_services = [
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
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
  account_id   = "nimloth-public-web"
  display_name = "Nimloth public website runtime"
  project_roles = [
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
  ]
  depends_on = [module.project_services]
}

module "website" {
  count                 = var.deploy_website ? 1 : 0
  source                = "../../modules/cloud_run_service"
  project_id            = var.project_id
  region                = var.region
  service_name          = "nimloth-public-web"
  service_account_email = module.runtime_service_account.email
  image                 = var.container_image
  env_vars = {
    DATA_API_MODE     = "live"
    DATA_API_BASE_URL = var.data_api_base_url
    DATA_API_AUDIENCE = var.data_api_audience
  }
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
