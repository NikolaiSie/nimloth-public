resource "google_cloud_run_v2_service" "service" {
  name        = var.service_name
  location    = var.region
  project     = var.project_id
  ingress     = "INGRESS_TRAFFIC_ALL"
  iap_enabled = var.iap_enabled

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
  count    = var.allow_unauthenticated ? 1 : 0
  name     = google_cloud_run_v2_service.service.name
  location = google_cloud_run_v2_service.service.location
  project  = var.project_id
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "service_name" {
  value = google_cloud_run_v2_service.service.name
}

output "service_url" {
  value = google_cloud_run_v2_service.service.uri
}
