# ==============================================================================
# ECS Module - Variables
# ==============================================================================

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

# ==============================================================================
# Network Configuration
# ==============================================================================

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "ecs_security_group_id" {
  description = "Security group ID for ECS tasks"
  type        = string
}

# ==============================================================================
# Cluster Configuration
# ==============================================================================

variable "enable_container_insights" {
  description = "Enable Container Insights for the ECS cluster"
  type        = bool
  default     = true
}

variable "enable_execute_command" {
  description = "Enable ECS Exec for debugging"
  type        = bool
  default     = true
}

# ==============================================================================
# Service Names
# ==============================================================================

variable "service_names" {
  description = "List of service names"
  type        = list(string)
  default     = ["presentation", "client-tier", "management-tier", "uex-backend", "processing-tier", "management-backend"]
}

# ==============================================================================
# Container Images
# ==============================================================================

variable "ecr_repository_urls" {
  description = "Map of service names to ECR repository URLs"
  type        = map(string)
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

# ==============================================================================
# IAM and Secrets
# ==============================================================================

variable "secrets_arns" {
  description = "List of Secrets Manager ARNs that tasks need access to"
  type        = list(string)
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

variable "s3_backups_bucket_arn" {
  description = "S3 backups bucket ARN for task access"
  type        = string
}

# ==============================================================================
# Load Balancer Integration
# ==============================================================================

variable "target_group_arns" {
  description = "Map of service names to target group ARNs"
  type        = map(string)
}

variable "target_group_arn_suffixes" {
  description = "Map of service names to target group ARN suffixes (for autoscaling)"
  type        = map(string)
  default     = {}
}

variable "alb_arn_suffix" {
  description = "ALB ARN suffix (for autoscaling metrics)"
  type        = string
  default     = ""
}

# ==============================================================================
# Logging Configuration
# ==============================================================================

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 30

  validation {
    condition = contains([
      1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653
    ], var.log_retention_days)
    error_message = "Log retention must be a valid value"
  }
}

variable "log_level" {
  description = "Application log level"
  type        = string
  default     = "info"

  validation {
    condition     = contains(["debug", "info", "warn", "error"], var.log_level)
    error_message = "Log level must be one of: debug, info, warn, error"
  }
}

# ==============================================================================
# Service Capacity Configuration
# ==============================================================================

variable "service_desired_counts" {
  description = "Map of service names to desired task counts"
  type        = map(number)
  default = {
    presentation       = 2
    client-tier        = 2
    management-tier    = 2
    uex-backend        = 3
    processing-tier    = 2
    management-backend = 2
  }
}

variable "service_min_capacity" {
  description = "Map of service names to minimum task counts for autoscaling"
  type        = map(number)
  default = {
    presentation       = 2
    client-tier        = 2
    management-tier    = 2
    uex-backend        = 2
    processing-tier    = 2
    management-backend = 2
  }
}

variable "service_max_capacity" {
  description = "Map of service names to maximum task counts for autoscaling"
  type        = map(number)
  default = {
    presentation       = 10
    client-tier        = 10
    management-tier    = 10
    uex-backend        = 20
    processing-tier    = 10
    management-backend = 10
  }
}

# ==============================================================================
# Presentation Service Configuration
# ==============================================================================

variable "presentation_cpu" {
  description = "CPU units for presentation service (1024 = 1 vCPU)"
  type        = number
  default     = 256
}

variable "presentation_memory" {
  description = "Memory for presentation service (MB)"
  type        = number
  default     = 512
}

variable "presentation_environment_vars" {
  description = "Environment variables for presentation service"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "presentation_secrets" {
  description = "Secrets for presentation service"
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

# ==============================================================================
# Client-Tier Service Configuration
# ==============================================================================

variable "client_tier_cpu" {
  description = "CPU units for client-tier service"
  type        = number
  default     = 512
}

variable "client_tier_memory" {
  description = "Memory for client-tier service (MB)"
  type        = number
  default     = 1024
}

variable "client_tier_environment_vars" {
  description = "Environment variables for client-tier service"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "client_tier_secrets" {
  description = "Secrets for client-tier service"
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

# ==============================================================================
# Management-Tier Service Configuration
# ==============================================================================

variable "management_tier_cpu" {
  description = "CPU units for management-tier service"
  type        = number
  default     = 512
}

variable "management_tier_memory" {
  description = "Memory for management-tier service (MB)"
  type        = number
  default     = 1024
}

variable "management_tier_environment_vars" {
  description = "Environment variables for management-tier service"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "management_tier_secrets" {
  description = "Secrets for management-tier service"
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

# ==============================================================================
# UEX Backend Service Configuration (Main Service)
# ==============================================================================

variable "uex_backend_cpu" {
  description = "CPU units for uex-backend service"
  type        = number
  default     = 1024
}

variable "uex_backend_memory" {
  description = "Memory for uex-backend service (MB)"
  type        = number
  default     = 2048
}

variable "uex_backend_environment_vars" {
  description = "Environment variables for uex-backend service"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "uex_backend_secrets" {
  description = "Secrets for uex-backend service"
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

# ==============================================================================
# Processing-Tier Service Configuration
# ==============================================================================

variable "processing_tier_cpu" {
  description = "CPU units for processing-tier service"
  type        = number
  default     = 512
}

variable "processing_tier_memory" {
  description = "Memory for processing-tier service (MB)"
  type        = number
  default     = 1024
}

variable "processing_tier_environment_vars" {
  description = "Environment variables for processing-tier service"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "processing_tier_secrets" {
  description = "Secrets for processing-tier service"
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

# ==============================================================================
# Management Backend Service Configuration
# ==============================================================================

variable "management_backend_cpu" {
  description = "CPU units for management-backend service"
  type        = number
  default     = 512
}

variable "management_backend_memory" {
  description = "Memory for management-backend service (MB)"
  type        = number
  default     = 1024
}

variable "management_backend_environment_vars" {
  description = "Environment variables for management-backend service"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "management_backend_secrets" {
  description = "Secrets for management-backend service"
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

# ==============================================================================
# Auto Scaling Configuration
# ==============================================================================

variable "enable_autoscaling" {
  description = "Enable auto scaling for ECS services"
  type        = bool
  default     = true
}

variable "cpu_target_value" {
  description = "Target CPU utilization percentage for scaling"
  type        = number
  default     = 70

  validation {
    condition     = var.cpu_target_value > 0 && var.cpu_target_value <= 100
    error_message = "CPU target value must be between 1 and 100"
  }
}

variable "memory_target_value" {
  description = "Target memory utilization percentage for scaling"
  type        = number
  default     = 80

  validation {
    condition     = var.memory_target_value > 0 && var.memory_target_value <= 100
    error_message = "Memory target value must be between 1 and 100"
  }
}

variable "enable_request_count_scaling" {
  description = "Enable scaling based on ALB request count"
  type        = bool
  default     = false
}

variable "request_count_target_value" {
  description = "Target request count per task for scaling"
  type        = number
  default     = 1000
}

variable "scale_in_cooldown" {
  description = "Cooldown period (seconds) after scale in"
  type        = number
  default     = 300
}

variable "scale_out_cooldown" {
  description = "Cooldown period (seconds) after scale out"
  type        = number
  default     = 60
}

# ==============================================================================
# Tags
# ==============================================================================

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}
