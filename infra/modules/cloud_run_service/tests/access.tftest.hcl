mock_provider "google-beta" {}

variables {
  allow_unauthenticated = false
  image                 = "us-east4-docker.pkg.dev/example/site/image:test"
  project_id            = "example-project"
  region                = "us-east4"
  service_account_email = "runtime@example-project.iam.gserviceaccount.com"
  service_name          = "example-site"
}

run "public_service_disables_invoker_check" {
  command = plan

  variables {
    iap_enabled          = false
    invoker_iam_disabled = true
  }

  assert {
    condition     = google_cloud_run_v2_service.service.invoker_iam_disabled
    error_message = "The public service must disable the Cloud Run invoker IAM check."
  }

  assert {
    condition     = length(google_cloud_run_v2_service_iam_member.public_invoker) == 0
    error_message = "Public access must not create an allUsers IAM binding."
  }
}

run "iap_service_keeps_invoker_check" {
  command = plan

  variables {
    iap_enabled          = true
    invoker_iam_disabled = false
  }

  assert {
    condition     = !google_cloud_run_v2_service.service.invoker_iam_disabled
    error_message = "An IAP-protected service must retain the Cloud Run invoker IAM check."
  }

  assert {
    condition     = length(google_cloud_run_v2_service_iam_member.iap_invoker) == 1
    error_message = "An IAP-protected service must grant its IAP service agent invoke access."
  }
}

run "rejects_conflicting_access_modes" {
  command = plan

  variables {
    iap_enabled          = true
    invoker_iam_disabled = true
  }

  expect_failures = [google_cloud_run_v2_service.service]
}
