variable "bucket_name" {
  type        = string
  description = "Name of the Terraform state bucket."
}

variable "project_id" {
  type        = string
  description = "GCP project for the state bucket."
}

variable "region" {
  type        = string
  description = "Bucket region."
}
