# ==============================================================================
# Monitoring Module - Variables
# ==============================================================================

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

# ==============================================================================
# KMS Configuration
# ==============================================================================

variable "kms_key_id" {
  description = "KMS key ID for encrypting SNS topics"
  type        = string
}

# ==============================================================================
# Alert Email Configuration
# ==============================================================================

variable "critical_alert_emails" {
  description = "Email addresses for critical alerts"
  type        = list(string)
  default     = []
}

variable "warning_alert_emails" {
  description = "Email addresses for warning alerts"
  type        = list(string)
  default     = []
}

# ==============================================================================
# ECS Monitoring Configuration
# ==============================================================================

variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "ecs_service_names" {
  description = "List of ECS service names"
  type        = list(string)
}

variable "ecs_cpu_threshold" {
  description = "ECS CPU utilization alarm threshold (percent)"
  type        = number
  default     = 80
}

variable "ecs_memory_threshold" {
  description = "ECS memory utilization alarm threshold (percent)"
  type        = number
  default     = 85
}

# ==============================================================================
# RDS Monitoring Configuration
# ==============================================================================

variable "rds_instance_id" {
  description = "RDS primary instance identifier"
  type        = string
}

variable "rds_replica_ids" {
  description = "List of RDS read replica identifiers"
  type        = list(string)
  default     = []
}

variable "rds_cpu_threshold" {
  description = "RDS CPU utilization alarm threshold (percent)"
  type        = number
  default     = 85
}

variable "rds_free_storage_threshold" {
  description = "RDS free storage alarm threshold (GB)"
  type        = number
  default     = 20
}

variable "rds_connection_threshold" {
  description = "RDS database connections alarm threshold"
  type        = number
  default     = 160
}

variable "rds_replica_lag_threshold" {
  description = "RDS read replica lag threshold (seconds)"
  type        = number
  default     = 30
}

# ==============================================================================
# Redis Monitoring Configuration
# ==============================================================================

variable "redis_cluster_id" {
  description = "Redis cluster identifier"
  type        = string
}

variable "redis_cpu_threshold" {
  description = "Redis CPU utilization alarm threshold (percent)"
  type        = number
  default     = 75
}

variable "redis_memory_threshold" {
  description = "Redis memory usage alarm threshold (percent)"
  type        = number
  default     = 90
}

variable "redis_evictions_threshold" {
  description = "Redis evictions alarm threshold"
  type        = number
  default     = 100
}

# ==============================================================================
# ALB Monitoring Configuration
# ==============================================================================

variable "alb_arn_suffix" {
  description = "ALB ARN suffix for CloudWatch metrics"
  type        = string
}

variable "target_group_arn_suffixes" {
  description = "Map of target group ARN suffixes"
  type        = map(string)
}

variable "alb_response_time_threshold" {
  description = "ALB response time alarm threshold (seconds)"
  type        = number
  default     = 2
}

variable "alb_5xx_threshold" {
  description = "ALB 5XX error count alarm threshold"
  type        = number
  default     = 50
}

variable "alb_unhealthy_target_threshold" {
  description = "ALB unhealthy target count alarm threshold"
  type        = number
  default     = 1
}

# ==============================================================================
# Billing Monitoring Configuration
# ==============================================================================

variable "enable_billing_alarms" {
  description = "Enable billing alarms"
  type        = bool
  default     = true
}

variable "billing_alarm_threshold" {
  description = "Billing alarm threshold (USD)"
  type        = number
  default     = 500
}
