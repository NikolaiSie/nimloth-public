mock_provider "google-beta" {}

variables {
  cloud_run_region       = "us-east4"
  cloud_run_service_name = "nimloth-public-web"
  primary_domain         = "nimlothcapital.com"
  project_id             = "nimloth-public-prod"
  redirect_domains       = ["www.nimlothcapital.com"]
  site_id                = "nimloth-public-prod-site"
}

run "routes_public_site_to_cloud_run" {
  command = plan

  assert {
    condition     = google_firebase_hosting_version.this.config[0].rewrites[0].glob == "**"
    error_message = "Firebase Hosting must rewrite every application path."
  }

  assert {
    condition     = google_firebase_hosting_version.this.config[0].rewrites[0].run[0].service_id == "nimloth-public-web"
    error_message = "Firebase Hosting must target the production Cloud Run service."
  }

  assert {
    condition     = google_firebase_hosting_version.this.config[0].rewrites[0].run[0].region == "us-east4"
    error_message = "Firebase Hosting must preserve the us-east4 default region."
  }

  assert {
    condition     = google_firebase_hosting_custom_domain.redirect["www.nimlothcapital.com"].redirect_target == "nimlothcapital.com"
    error_message = "The www domain must redirect to the canonical apex domain."
  }
}
