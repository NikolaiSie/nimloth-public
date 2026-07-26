variable "project_id" {
  type        = string
  description = "Project where APIs should be enabled."
}

variable "services" {
  type        = list(string)
  description = "List of service APIs to enable."
}
