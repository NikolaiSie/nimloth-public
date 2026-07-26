resource "google_artifact_registry_repository" "repository" {
  project       = var.project_id
  location      = var.region
  repository_id = var.repository_id
  description   = var.description
  format        = "DOCKER"
}

output "repository_name" {
  value = google_artifact_registry_repository.repository.name
}
