variable "allow_unauthenticated" {
  type        = bool
  description = "Whether the Cloud Run service is public."
  default     = true
}

variable "cpu" {
  type        = string
  description = "CPU limit for the container."
  default     = "1"
}

variable "env_vars" {
  type        = map(string)
  description = "Plain environment variables for the service."
  default     = {}
}

variable "iap_enabled" {
  type        = bool
  description = "Whether direct Cloud Run IAP is enabled for the service."
  default     = false
}

variable "image" {
  type        = string
  description = "Full container image reference."
}

variable "max_instance_count" {
  type        = number
  description = "Maximum instance count."
  default     = 3
}

variable "memory" {
  type        = string
  description = "Memory limit for the container."
  default     = "512Mi"
}

variable "min_instance_count" {
  type        = number
  description = "Minimum instance count."
  default     = 0
}

variable "project_id" {
  type        = string
  description = "Project id."
}

variable "region" {
  type        = string
  description = "Cloud Run region."
}

variable "service_account_email" {
  type        = string
  description = "Runtime service account email."
}

variable "service_name" {
  type        = string
  description = "Cloud Run service name."
}
