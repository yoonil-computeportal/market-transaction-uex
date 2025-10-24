# ==============================================================================
# Secrets Manager Module - Variables
# ==============================================================================

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for encrypting secrets"
  type        = string
}

variable "recovery_window_in_days" {
  description = "Number of days to retain deleted secrets"
  type        = number
  default     = 30
  validation {
    condition     = var.recovery_window_in_days >= 7 && var.recovery_window_in_days <= 30
    error_message = "Recovery window must be between 7 and 30 days."
  }
}

# ==============================================================================
# Database Credentials
# ==============================================================================

variable "db_master_username" {
  description = "Master username for database"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for database (leave empty to auto-generate)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_endpoint" {
  description = "Database endpoint"
  type        = string
  default     = ""
}

variable "db_port" {
  description = "Database port"
  type        = number
  default     = 5432
}

variable "db_database_name" {
  description = "Name of the default database"
  type        = string
  default     = "uex_payments"
}

# ==============================================================================
# UEX API Credentials
# ==============================================================================

variable "uex_referral_code" {
  description = "UEX referral code"
  type        = string
  sensitive   = true
}

variable "uex_client_id" {
  description = "UEX merchant client ID (optional)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "uex_secret_key" {
  description = "UEX merchant secret key (optional)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "uex_swap_base_url" {
  description = "UEX swap API base URL"
  type        = string
  default     = "https://uexswap.com"
}

variable "uex_merchant_base_url" {
  description = "UEX merchant API base URL"
  type        = string
  default     = "https://uex.us"
}

# ==============================================================================
# Redis Configuration
# ==============================================================================

variable "redis_endpoint" {
  description = "Redis cluster endpoint"
  type        = string
  default     = ""
}

variable "redis_port" {
  description = "Redis port"
  type        = number
  default     = 6379
}

variable "redis_auth_token" {
  description = "Redis auth token (leave empty to auto-generate)"
  type        = string
  default     = ""
  sensitive   = true
}

# ==============================================================================
# Additional Settings
# ==============================================================================

variable "enable_rotation" {
  description = "Enable automatic secret rotation (requires Lambda setup)"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}
