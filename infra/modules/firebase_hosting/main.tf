resource "google_firebase_project" "this" {
  provider = google-beta
  project  = var.project_id
}

resource "google_firebase_hosting_site" "this" {
  provider = google-beta
  project  = var.project_id
  site_id  = var.site_id

  depends_on = [google_firebase_project.this]
}

resource "terraform_data" "deployment" {
  triggers_replace = var.deployment_id
}

resource "google_firebase_hosting_version" "this" {
  provider = google-beta
  site_id  = google_firebase_hosting_site.this.site_id

  # Firebase caches rewritten responses according to the origin's Cache-Control
  # header. Replace and release the Hosting version whenever the application
  # image changes so a deployment invalidates those cached responses.
  lifecycle {
    create_before_destroy = true
    replace_triggered_by  = [terraform_data.deployment]
  }

  config {
    # Firebase may deduplicate versions whose Hosting configuration is
    # identical. Include a non-sensitive digest of the application deployment
    # so every image produces a distinct version that can be released.
    headers {
      glob = "**"
      headers = {
        "X-Nimloth-Deployment" = sha256(var.deployment_id)
      }
    }

    rewrites {
      glob = "**"

      run {
        service_id = var.cloud_run_service_name
        region     = var.cloud_run_region
      }
    }
  }
}

resource "google_firebase_hosting_release" "this" {
  provider     = google-beta
  site_id      = google_firebase_hosting_site.this.site_id
  version_name = google_firebase_hosting_version.this.name
  message      = "Deploy ${var.deployment_id} through ${var.cloud_run_service_name}."
}

resource "google_firebase_hosting_custom_domain" "primary" {
  provider              = google-beta
  project               = var.project_id
  site_id               = google_firebase_hosting_site.this.site_id
  custom_domain         = var.primary_domain
  wait_dns_verification = false
}

resource "google_firebase_hosting_custom_domain" "redirect" {
  provider              = google-beta
  for_each              = var.redirect_domains
  project               = var.project_id
  site_id               = google_firebase_hosting_site.this.site_id
  custom_domain         = each.value
  redirect_target       = var.primary_domain
  wait_dns_verification = false

  depends_on = [google_firebase_hosting_custom_domain.primary]
}
