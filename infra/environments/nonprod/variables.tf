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
  default     = true
}

variable "invoker_iam_disabled" {
  type        = bool
  description = "Whether to disable the Cloud Run invoker IAM check."
  default     = false
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
  default     = "nimloth-public-nonprod"
}

variable "region" {
  type        = string
  description = "GCP region."
  default     = "us-east4"
}
