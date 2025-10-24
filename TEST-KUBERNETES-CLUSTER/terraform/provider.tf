terraform {
  required_version = ">= 1.0"

  required_providers {
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
}

# Using null provider for executing remote commands via SSH
# This is suitable for bare metal/VM deployments
provider "null" {}
