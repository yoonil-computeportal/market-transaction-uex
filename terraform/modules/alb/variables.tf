# ==============================================================================
# Application Load Balancer Module - Variables
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

variable "vpc_id" {
  description = "VPC ID for the target groups"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for the ALB"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "Security group ID for the ALB"
  type        = string
}

variable "internal" {
  description = "Whether the load balancer is internal"
  type        = bool
  default     = false
}

# ==============================================================================
# ALB Configuration
# ==============================================================================

variable "enable_deletion_protection" {
  description = "Enable deletion protection for the ALB"
  type        = bool
  default     = true
}

variable "enable_http2" {
  description = "Enable HTTP/2 on the ALB"
  type        = bool
  default     = true
}

variable "enable_cross_zone_load_balancing" {
  description = "Enable cross-zone load balancing"
  type        = bool
  default     = true
}

variable "idle_timeout" {
  description = "Idle timeout in seconds"
  type        = number
  default     = 60

  validation {
    condition     = var.idle_timeout >= 1 && var.idle_timeout <= 4000
    error_message = "Idle timeout must be between 1 and 4000 seconds"
  }
}

# ==============================================================================
# HTTPS Configuration
# ==============================================================================

variable "enable_https" {
  description = "Enable HTTPS listener"
  type        = bool
  default     = true
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate for HTTPS"
  type        = string
  default     = ""
}

variable "ssl_policy" {
  description = "SSL policy for HTTPS listener"
  type        = string
  default     = "ELBSecurityPolicy-TLS13-1-2-2021-06"

  validation {
    condition     = can(regex("^ELBSecurityPolicy-", var.ssl_policy))
    error_message = "SSL policy must be a valid ELB security policy"
  }
}

# ==============================================================================
# Access Logs Configuration
# ==============================================================================

variable "enable_access_logs" {
  description = "Enable ALB access logs to S3"
  type        = bool
  default     = true
}

variable "access_logs_bucket" {
  description = "S3 bucket name for ALB access logs"
  type        = string
  default     = ""
}

variable "access_logs_prefix" {
  description = "S3 prefix for ALB access logs"
  type        = string
  default     = "alb-logs"
}

# ==============================================================================
# Target Group Configuration
# ==============================================================================

variable "deregistration_delay" {
  description = "Target deregistration delay in seconds"
  type        = number
  default     = 30

  validation {
    condition     = var.deregistration_delay >= 0 && var.deregistration_delay <= 3600
    error_message = "Deregistration delay must be between 0 and 3600 seconds"
  }
}

variable "enable_sticky_sessions" {
  description = "Enable sticky sessions"
  type        = bool
  default     = false
}

variable "sticky_session_duration" {
  description = "Sticky session duration in seconds"
  type        = number
  default     = 86400  # 24 hours

  validation {
    condition     = var.sticky_session_duration >= 1 && var.sticky_session_duration <= 604800
    error_message = "Sticky session duration must be between 1 and 604800 seconds (7 days)"
  }
}

# ==============================================================================
# Health Check Configuration
# ==============================================================================

variable "health_check_healthy_threshold" {
  description = "Number of consecutive successful health checks before marking target healthy"
  type        = number
  default     = 2

  validation {
    condition     = var.health_check_healthy_threshold >= 2 && var.health_check_healthy_threshold <= 10
    error_message = "Healthy threshold must be between 2 and 10"
  }
}

variable "health_check_unhealthy_threshold" {
  description = "Number of consecutive failed health checks before marking target unhealthy"
  type        = number
  default     = 3

  validation {
    condition     = var.health_check_unhealthy_threshold >= 2 && var.health_check_unhealthy_threshold <= 10
    error_message = "Unhealthy threshold must be between 2 and 10"
  }
}

variable "health_check_timeout" {
  description = "Health check timeout in seconds"
  type        = number
  default     = 5

  validation {
    condition     = var.health_check_timeout >= 2 && var.health_check_timeout <= 120
    error_message = "Health check timeout must be between 2 and 120 seconds"
  }
}

variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30

  validation {
    condition     = var.health_check_interval >= 5 && var.health_check_interval <= 300
    error_message = "Health check interval must be between 5 and 300 seconds"
  }
}

# ==============================================================================
# CloudWatch Alarms Configuration
# ==============================================================================

variable "create_alarms" {
  description = "Create CloudWatch alarms for the ALB"
  type        = bool
  default     = true
}

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for alarm notifications"
  type        = string
  default     = ""
}

variable "target_response_time_threshold" {
  description = "Target response time alarm threshold in seconds (P95)"
  type        = number
  default     = 2.0
}

variable "http_5xx_threshold" {
  description = "5xx error count alarm threshold"
  type        = number
  default     = 10
}

variable "http_4xx_threshold" {
  description = "4xx error count alarm threshold"
  type        = number
  default     = 50
}

variable "min_request_count_threshold" {
  description = "Minimum request count threshold (to detect outages)"
  type        = number
  default     = 10
}

# ==============================================================================
# Tags
# ==============================================================================

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}
