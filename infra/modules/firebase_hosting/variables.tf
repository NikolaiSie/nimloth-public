variable "cloud_run_region" {
  type        = string
  description = "Region of the Cloud Run service receiving Hosting rewrites."
}

variable "cloud_run_service_name" {
  type        = string
  description = "Name of the Cloud Run service receiving Hosting rewrites."
}

variable "deployment_id" {
  type        = string
  description = "Identifier that changes with each application deployment and forces a fresh Hosting release."

  validation {
    condition     = length(trimspace(var.deployment_id)) > 0
    error_message = "deployment_id must not be empty."
  }
}

variable "primary_domain" {
  type        = string
  description = "Canonical public domain served by Firebase Hosting."
}

variable "project_id" {
  type        = string
  description = "Google Cloud project id."
}

variable "redirect_domains" {
  type        = set(string)
  description = "Additional domains that redirect to the canonical domain."
  default     = []
}

variable "site_id" {
  type        = string
  description = "Globally unique Firebase Hosting site id."
}
