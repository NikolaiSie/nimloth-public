variable "account_id" {
  type        = string
  description = "Service account id."
}

variable "display_name" {
  type        = string
  description = "Human readable service account name."
}

variable "project_id" {
  type        = string
  description = "Project id."
}

variable "project_roles" {
  type        = list(string)
  description = "Project-level roles for the service account."
  default     = []
}
