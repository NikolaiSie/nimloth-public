data "google_project" "current" {
  provider   = google-beta
  project_id = var.project_id
}

resource "google_cloud_run_v2_service" "service" {
  provider             = google-beta
  name                 = var.service_name
  location             = var.region
  project              = var.project_id
  ingress              = "INGRESS_TRAFFIC_ALL"
  launch_stage         = var.iap_enabled ? "BETA" : null
  iap_enabled          = var.iap_enabled
  invoker_iam_disabled = var.invoker_iam_disabled

  lifecycle {
    precondition {
      condition     = !(var.iap_enabled && var.invoker_iam_disabled)
      error_message = "IAP and a disabled Cloud Run invoker IAM check cannot be enabled together."
    }
  }

  template {
    service_account = var.service_account_email

    scaling {
      min_instance_count = var.min_instance_count
      max_instance_count = var.max_instance_count
    }

    containers {
      image = var.image

      ports {
        container_port = 8080
      }

      dynamic "env" {
        for_each = var.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
      }
    }
  }
}

resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  provider = google-beta
  count    = var.allow_unauthenticated ? 1 : 0
  name     = google_cloud_run_v2_service.service.name
  location = google_cloud_run_v2_service.service.location
  project  = var.project_id
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "iap_invoker" {
  provider = google-beta
  count    = var.iap_enabled ? 1 : 0
  name     = google_cloud_run_v2_service.service.name
  location = google_cloud_run_v2_service.service.location
  project  = var.project_id
  role     = "roles/run.invoker"
  member   = "serviceAccount:service-${data.google_project.current.number}@gcp-sa-iap.iam.gserviceaccount.com"
}

output "service_name" {
  value = google_cloud_run_v2_service.service.name
}

output "service_url" {
  value = google_cloud_run_v2_service.service.uri
}
