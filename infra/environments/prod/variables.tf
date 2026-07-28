variable "container_image" {
  type        = string
  description = "Container image to deploy."
  default     = ""
  validation {
    condition     = !var.deploy_website || length(trimspace(var.container_image)) > 0
    error_message = "container_image must be set when deploy_website is true."
  }
}

variable "deploy_website" {
  type        = bool
  description = "Whether to deploy the Cloud Run website service."
  default     = true
}

variable "allow_unauthenticated" {
  type        = bool
  description = "Whether the Cloud Run service is public."
  default     = false
}

variable "iap_enabled" {
  type        = bool
  description = "Whether to protect the Cloud Run service with direct IAP."
  default     = false
}

variable "invoker_iam_disabled" {
  type        = bool
  description = "Whether to disable the Cloud Run invoker IAM check."
  default     = true
}

variable "firebase_site_id" {
  type        = string
  description = "Globally unique Firebase Hosting site id."
  default     = "nimloth-public-prod-site"
}

variable "primary_domain" {
  type        = string
  description = "Canonical production domain."
  default     = "nimlothcapital.com"
}

variable "redirect_domains" {
  type        = set(string)
  description = "Production domains redirected to the canonical domain."
  default     = ["www.nimlothcapital.com"]
}

variable "data_api_audience" {
  type        = string
  description = "Legacy placeholder retained for compatibility with older deploy wiring."
  default     = ""
}

variable "data_api_base_url" {
  type        = string
  description = "Base URL for the private data API."
}

variable "data_api_key" {
  type        = string
  description = "Server-side API key for the private data API."
  default     = ""
  sensitive   = true
}

variable "project_id" {
  type        = string
  description = "GCP project id."
  default     = "nimloth-public-prod"
}

variable "region" {
  type        = string
  description = "GCP region."
  default     = "us-east4"
}
