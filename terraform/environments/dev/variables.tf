# ==============================================================================
# Development Environment - Variables
# ==============================================================================

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "uex-payments"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "DevOps Team"
}

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "Engineering"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs_app" {
  description = "CIDR blocks for private app subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "private_subnet_cidrs_data" {
  description = "CIDR blocks for private data subnets"
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24"]
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access ALB"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# Database Configuration
variable "db_master_password" {
  description = "Master password for database (leave empty to auto-generate)"
  type        = string
  default     = ""
  sensitive   = true
}

# UEX Configuration
variable "uex_referral_code" {
  description = "UEX referral code"
  type        = string
  sensitive   = true
}

variable "uex_client_id" {
  description = "UEX merchant client ID"
  type        = string
  default     = ""
  sensitive   = true
}

variable "uex_secret_key" {
  description = "UEX merchant secret key"
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

# Service Image Tags
variable "presentation_image_tag" {
  description = "Docker image tag for Presentation service"
  type        = string
  default     = "latest"
}

variable "client_tier_image_tag" {
  description = "Docker image tag for Client Tier service"
  type        = string
  default     = "latest"
}

variable "management_tier_image_tag" {
  description = "Docker image tag for Management Tier service"
  type        = string
  default     = "latest"
}

variable "uex_backend_image_tag" {
  description = "Docker image tag for UEX Backend service"
  type        = string
  default     = "latest"
}

variable "processing_tier_image_tag" {
  description = "Docker image tag for Processing Tier service"
  type        = string
  default     = "latest"
}

variable "management_backend_image_tag" {
  description = "Docker image tag for Management Backend service"
  type        = string
  default     = "latest"
}

# Service Environment Variables
variable "presentation_env_vars" {
  description = "Environment variables for Presentation service"
  type        = map(string)
  default = {
    NODE_ENV = "development"
  }
}

variable "client_tier_env_vars" {
  description = "Environment variables for Client Tier service"
  type        = map(string)
  default = {
    NODE_ENV = "development"
  }
}

variable "management_tier_env_vars" {
  description = "Environment variables for Management Tier service"
  type        = map(string)
  default = {
    NODE_ENV = "development"
  }
}

variable "uex_backend_env_vars" {
  description = "Environment variables for UEX Backend service"
  type        = map(string)
  default = {
    NODE_ENV             = "development"
    UEX_POLLING_ENABLED  = "true"
    UEX_POLLING_INTERVAL = "300000"
    LOG_LEVEL            = "debug"
  }
}

variable "processing_tier_env_vars" {
  description = "Environment variables for Processing Tier service"
  type        = map(string)
  default = {
    NODE_ENV = "development"
  }
}

variable "management_backend_env_vars" {
  description = "Environment variables for Management Backend service"
  type        = map(string)
  default = {
    NODE_ENV = "development"
  }
}

# ALB Configuration
variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for HTTPS"
  type        = string
  default     = ""
}

# KMS Configuration
variable "kms_key_administrators" {
  description = "IAM principals that can administer KMS key"
  type        = list(string)
  default     = []
}

variable "kms_key_users" {
  description = "IAM principals that can use KMS key"
  type        = list(string)
  default     = []
}

# Monitoring Configuration
variable "alert_email_addresses" {
  description = "Email addresses for CloudWatch alarms"
  type        = list(string)
  default     = []
}

# Route53 Configuration
variable "create_route53_records" {
  description = "Create Route53 DNS records"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Domain name for Route53 hosted zone"
  type        = string
  default     = ""
}

# Tags
variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default = {
    Team        = "Platform Engineering"
    Application = "UEX Payment Processing"
    Repository  = "github.com/your-org/uex-payments"
  }
}
