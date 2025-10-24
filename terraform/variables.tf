# ============================================================================
# UEX Payment Processing System - Terraform Variables
# ============================================================================

# ============================================================================
# General Configuration
# ============================================================================

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "uex-payments"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "aws_region" {
  description = "AWS region for resources"
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

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}

# ============================================================================
# VPC and Networking Configuration
# ============================================================================

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs_app" {
  description = "CIDR blocks for private app subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "private_subnet_cidrs_data" {
  description = "CIDR blocks for private data subnets"
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

variable "enable_vpn_gateway" {
  description = "Enable VPN Gateway"
  type        = bool
  default     = false
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access ALB"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Restrict in production
}

# ============================================================================
# RDS PostgreSQL Configuration
# ============================================================================

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 100
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for autoscaling"
  type        = number
  default     = 500
}

variable "db_master_username" {
  description = "Master username for database"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for database (auto-generated if not provided)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_database_name" {
  description = "Name of the default database"
  type        = string
  default     = "uex_payments"
}

variable "db_multi_az" {
  description = "Enable multi-AZ deployment"
  type        = bool
  default     = false
}

variable "db_create_read_replica" {
  description = "Create read replica"
  type        = bool
  default     = false
}

variable "db_read_replica_count" {
  description = "Number of read replicas"
  type        = number
  default     = 0
}

variable "db_backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "db_backup_window" {
  description = "Backup window (UTC)"
  type        = string
  default     = "03:00-04:00"
}

variable "db_maintenance_window" {
  description = "Maintenance window (UTC)"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "db_monitoring_interval" {
  description = "Enhanced monitoring interval in seconds"
  type        = number
  default     = 60
}

variable "db_performance_insights_enabled" {
  description = "Enable Performance Insights"
  type        = bool
  default     = true
}

# ============================================================================
# ElastiCache Redis Configuration
# ============================================================================

variable "redis_node_type" {
  description = "Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "redis_port" {
  description = "Redis port"
  type        = number
  default     = 6379
}

variable "redis_auth_token_enabled" {
  description = "Enable Redis AUTH token"
  type        = bool
  default     = true
}

variable "redis_automatic_failover_enabled" {
  description = "Enable automatic failover"
  type        = bool
  default     = false
}

variable "redis_multi_az_enabled" {
  description = "Enable multi-AZ"
  type        = bool
  default     = false
}

variable "redis_snapshot_retention_limit" {
  description = "Snapshot retention limit in days"
  type        = number
  default     = 5
}

variable "redis_snapshot_window" {
  description = "Snapshot window (UTC)"
  type        = string
  default     = "02:00-03:00"
}

variable "redis_maintenance_window" {
  description = "Maintenance window (UTC)"
  type        = string
  default     = "sun:05:00-sun:06:00"
}

# ============================================================================
# ECS Configuration
# ============================================================================

variable "ecs_enable_container_insights" {
  description = "Enable Container Insights"
  type        = bool
  default     = true
}

variable "ecs_log_retention_in_days" {
  description = "CloudWatch log retention period"
  type        = number
  default     = 30
}

variable "ecs_cpu_target_value" {
  description = "Target CPU utilization for auto-scaling"
  type        = number
  default     = 70
}

variable "ecs_memory_target_value" {
  description = "Target memory utilization for auto-scaling"
  type        = number
  default     = 75
}

variable "ecs_deployment_maximum_percent" {
  description = "Maximum percent of tasks during deployment"
  type        = number
  default     = 200
}

variable "ecs_deployment_minimum_healthy_percent" {
  description = "Minimum healthy percent during deployment"
  type        = number
  default     = 100
}

# Presentation Service
variable "ecs_presentation_cpu" {
  description = "CPU units for Presentation service"
  type        = number
  default     = 512
}

variable "ecs_presentation_memory" {
  description = "Memory for Presentation service (MB)"
  type        = number
  default     = 1024
}

variable "ecs_presentation_desired_count" {
  description = "Desired task count for Presentation service"
  type        = number
  default     = 2
}

variable "ecs_presentation_min_capacity" {
  description = "Minimum task count for Presentation service"
  type        = number
  default     = 1
}

variable "ecs_presentation_max_capacity" {
  description = "Maximum task count for Presentation service"
  type        = number
  default     = 5
}

variable "presentation_image_tag" {
  description = "Docker image tag for Presentation service"
  type        = string
  default     = "latest"
}

variable "presentation_env_vars" {
  description = "Environment variables for Presentation service"
  type        = map(string)
  default     = {}
}

# Client Tier Service
variable "ecs_client_tier_cpu" {
  description = "CPU units for Client Tier service"
  type        = number
  default     = 512
}

variable "ecs_client_tier_memory" {
  description = "Memory for Client Tier service (MB)"
  type        = number
  default     = 1024
}

variable "ecs_client_tier_desired_count" {
  description = "Desired task count for Client Tier service"
  type        = number
  default     = 2
}

variable "ecs_client_tier_min_capacity" {
  description = "Minimum task count for Client Tier service"
  type        = number
  default     = 1
}

variable "ecs_client_tier_max_capacity" {
  description = "Maximum task count for Client Tier service"
  type        = number
  default     = 5
}

variable "client_tier_image_tag" {
  description = "Docker image tag for Client Tier service"
  type        = string
  default     = "latest"
}

variable "client_tier_env_vars" {
  description = "Environment variables for Client Tier service"
  type        = map(string)
  default     = {}
}

# Management Tier Service
variable "ecs_management_tier_cpu" {
  description = "CPU units for Management Tier service"
  type        = number
  default     = 512
}

variable "ecs_management_tier_memory" {
  description = "Memory for Management Tier service (MB)"
  type        = number
  default     = 1024
}

variable "ecs_management_tier_desired_count" {
  description = "Desired task count for Management Tier service"
  type        = number
  default     = 2
}

variable "ecs_management_tier_min_capacity" {
  description = "Minimum task count for Management Tier service"
  type        = number
  default     = 1
}

variable "ecs_management_tier_max_capacity" {
  description = "Maximum task count for Management Tier service"
  type        = number
  default     = 5
}

variable "management_tier_image_tag" {
  description = "Docker image tag for Management Tier service"
  type        = string
  default     = "latest"
}

variable "management_tier_env_vars" {
  description = "Environment variables for Management Tier service"
  type        = map(string)
  default     = {}
}

# UEX Backend Service
variable "ecs_uex_backend_cpu" {
  description = "CPU units for UEX Backend service"
  type        = number
  default     = 1024
}

variable "ecs_uex_backend_memory" {
  description = "Memory for UEX Backend service (MB)"
  type        = number
  default     = 2048
}

variable "ecs_uex_backend_desired_count" {
  description = "Desired task count for UEX Backend service"
  type        = number
  default     = 2
}

variable "ecs_uex_backend_min_capacity" {
  description = "Minimum task count for UEX Backend service"
  type        = number
  default     = 1
}

variable "ecs_uex_backend_max_capacity" {
  description = "Maximum task count for UEX Backend service"
  type        = number
  default     = 10
}

variable "uex_backend_image_tag" {
  description = "Docker image tag for UEX Backend service"
  type        = string
  default     = "latest"
}

variable "uex_backend_env_vars" {
  description = "Environment variables for UEX Backend service"
  type        = map(string)
  default     = {}
}

# Processing Tier Service
variable "ecs_processing_tier_cpu" {
  description = "CPU units for Processing Tier service"
  type        = number
  default     = 1024
}

variable "ecs_processing_tier_memory" {
  description = "Memory for Processing Tier service (MB)"
  type        = number
  default     = 2048
}

variable "ecs_processing_tier_desired_count" {
  description = "Desired task count for Processing Tier service"
  type        = number
  default     = 2
}

variable "ecs_processing_tier_min_capacity" {
  description = "Minimum task count for Processing Tier service"
  type        = number
  default     = 1
}

variable "ecs_processing_tier_max_capacity" {
  description = "Maximum task count for Processing Tier service"
  type        = number
  default     = 5
}

variable "processing_tier_image_tag" {
  description = "Docker image tag for Processing Tier service"
  type        = string
  default     = "latest"
}

variable "processing_tier_env_vars" {
  description = "Environment variables for Processing Tier service"
  type        = map(string)
  default     = {}
}

# Management Backend Service
variable "ecs_management_backend_cpu" {
  description = "CPU units for Management Backend service"
  type        = number
  default     = 512
}

variable "ecs_management_backend_memory" {
  description = "Memory for Management Backend service (MB)"
  type        = number
  default     = 1024
}

variable "ecs_management_backend_desired_count" {
  description = "Desired task count for Management Backend service"
  type        = number
  default     = 2
}

variable "ecs_management_backend_min_capacity" {
  description = "Minimum task count for Management Backend service"
  type        = number
  default     = 1
}

variable "ecs_management_backend_max_capacity" {
  description = "Maximum task count for Management Backend service"
  type        = number
  default     = 5
}

variable "management_backend_image_tag" {
  description = "Docker image tag for Management Backend service"
  type        = string
  default     = "latest"
}

variable "management_backend_env_vars" {
  description = "Environment variables for Management Backend service"
  type        = map(string)
  default     = {}
}

# ============================================================================
# ALB Configuration
# ============================================================================

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for HTTPS"
  type        = string
  default     = ""
}

variable "alb_ssl_policy" {
  description = "SSL policy for ALB"
  type        = string
  default     = "ELBSecurityPolicy-TLS-1-2-2017-01"
}

variable "alb_enable_access_logs" {
  description = "Enable ALB access logs"
  type        = bool
  default     = true
}

variable "alb_log_bucket_name" {
  description = "S3 bucket name for ALB access logs"
  type        = string
  default     = ""
}

# ============================================================================
# ECR Configuration
# ============================================================================

variable "ecr_max_image_count" {
  description = "Maximum number of images to keep in ECR"
  type        = number
  default     = 10
}

# ============================================================================
# UEX API Configuration
# ============================================================================

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

# ============================================================================
# KMS Configuration
# ============================================================================

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

# ============================================================================
# Monitoring and Alerting Configuration
# ============================================================================

variable "alert_email_addresses" {
  description = "Email addresses for CloudWatch alarms"
  type        = list(string)
  default     = []
}

variable "critical_alarm_actions" {
  description = "SNS topic ARNs for critical alarms"
  type        = list(string)
  default     = []
}

variable "warning_alarm_actions" {
  description = "SNS topic ARNs for warning alarms"
  type        = list(string)
  default     = []
}

variable "alarm_ecs_cpu_threshold" {
  description = "ECS CPU alarm threshold"
  type        = number
  default     = 80
}

variable "alarm_ecs_memory_threshold" {
  description = "ECS memory alarm threshold"
  type        = number
  default     = 85
}

variable "alarm_rds_cpu_threshold" {
  description = "RDS CPU alarm threshold"
  type        = number
  default     = 85
}

variable "alarm_rds_storage_threshold" {
  description = "RDS free storage alarm threshold (GB)"
  type        = number
  default     = 20
}

variable "alarm_rds_connection_threshold" {
  description = "RDS connection count alarm threshold"
  type        = number
  default     = 160
}

variable "alarm_alb_5xx_threshold" {
  description = "ALB 5xx error rate threshold"
  type        = number
  default     = 5
}

variable "alarm_alb_response_time_threshold" {
  description = "ALB response time threshold in seconds"
  type        = number
  default     = 2
}

# ============================================================================
# Route53 Configuration
# ============================================================================

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

variable "subdomain_prefix" {
  description = "Subdomain prefix for this environment"
  type        = string
  default     = ""
}
