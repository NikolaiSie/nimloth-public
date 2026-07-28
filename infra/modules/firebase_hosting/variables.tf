variable "cloud_run_region" {
  type        = string
  description = "Region of the Cloud Run service receiving Hosting rewrites."
}

variable "cloud_run_service_name" {
  type        = string
  description = "Name of the Cloud Run service receiving Hosting rewrites."
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
