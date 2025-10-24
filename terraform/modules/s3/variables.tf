# ==============================================================================
# S3 Module - Variables
# ==============================================================================

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS key ARN for encrypting S3 buckets"
  type        = string
}

variable "buckets" {
  description = "Map of bucket names to their configuration"
  type = map(object({
    versioning_enabled = optional(bool, false)
    lifecycle_rules = optional(object({
      transition_to_glacier_days            = optional(number)
      expiration_days                       = optional(number)
      noncurrent_version_expiration_days    = optional(number)
      enable_intelligent_tiering            = optional(bool, false)
    }))
  }))

  default = {
    backups = {
      versioning_enabled = true
      lifecycle_rules = {
        transition_to_glacier_days         = 90
        expiration_days                    = 365
        noncurrent_version_expiration_days = 90
      }
    }
    logs = {
      versioning_enabled = false
      lifecycle_rules = {
        expiration_days = 90
      }
    }
  }
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}
