terraform {
  required_version = ">= 1.8.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.45"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 6.45"
    }
  }
}
