variable "description" {
  type        = string
  description = "Repository description."
}

variable "project_id" {
  type        = string
  description = "Project hosting the Artifact Registry repository."
}

variable "region" {
  type        = string
  description = "Artifact Registry region."
}

variable "repository_id" {
  type        = string
  description = "Artifact Registry repository id."
}
