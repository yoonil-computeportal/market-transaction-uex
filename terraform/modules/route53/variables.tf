# ==============================================================================
# Route53 Module - Variables
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
# Domain Configuration
# ==============================================================================

variable "domain_name" {
  description = "Domain name for the hosted zone"
  type        = string
}

variable "subdomain_prefix" {
  description = "Subdomain prefix for this environment (e.g., 'dev', 'staging', 'prod')"
  type        = string
  default     = ""
}

variable "create_hosted_zone" {
  description = "Create a new hosted zone (false = use existing zone)"
  type        = bool
  default     = false
}

# ==============================================================================
# ALB Configuration
# ==============================================================================

variable "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  type        = string
}

variable "alb_zone_id" {
  description = "Route53 zone ID of the Application Load Balancer"
  type        = string
}

# ==============================================================================
# Health Check Configuration
# ==============================================================================

variable "create_health_checks" {
  description = "Create Route53 health checks"
  type        = bool
  default     = true
}

variable "health_check_path" {
  description = "Path for health check endpoint"
  type        = string
  default     = "/health"
}

variable "health_check_interval" {
  description = "Health check interval in seconds (10 or 30)"
  type        = number
  default     = 30
  validation {
    condition     = contains([10, 30], var.health_check_interval)
    error_message = "Health check interval must be 10 or 30 seconds."
  }
}

variable "health_check_failure_threshold" {
  description = "Number of consecutive health check failures before marking unhealthy"
  type        = number
  default     = 3
  validation {
    condition     = var.health_check_failure_threshold >= 1 && var.health_check_failure_threshold <= 10
    error_message = "Failure threshold must be between 1 and 10."
  }
}

variable "health_check_alarm_sns_topic_arns" {
  description = "SNS topic ARNs for health check alarms"
  type        = list(string)
  default     = []
}

# ==============================================================================
# Service Subdomains Configuration
# ==============================================================================

variable "create_service_subdomains" {
  description = "Create service-specific subdomains"
  type        = bool
  default     = false
}

variable "service_subdomain_names" {
  description = "Map of service names to subdomain prefixes"
  type        = map(string)
  default = {
    presentation        = "dashboard"
    client-tier         = "client"
    management-tier     = "management"
    uex-backend         = "api"
    processing-tier     = "processing"
    management-backend  = "admin"
  }
}

# ==============================================================================
# ACM Certificate Validation
# ==============================================================================

variable "acm_validation_records" {
  description = "Map of ACM validation records to create"
  type = map(object({
    name   = string
    type   = string
    record = string
  }))
  default = {}
}

# ==============================================================================
# Email Configuration
# ==============================================================================

variable "create_spf_record" {
  description = "Create SPF TXT record"
  type        = bool
  default     = false
}

variable "spf_record_value" {
  description = "SPF record value"
  type        = string
  default     = "v=spf1 -all"
}

# ==============================================================================
# DNSSEC Configuration
# ==============================================================================

variable "enable_dnssec" {
  description = "Enable DNSSEC for the hosted zone"
  type        = bool
  default     = false
}

variable "dnssec_kms_key_arn" {
  description = "KMS key ARN for DNSSEC signing"
  type        = string
  default     = ""
}

# ==============================================================================
# Advanced Routing Configuration
# ==============================================================================

variable "enable_latency_routing" {
  description = "Enable latency-based routing for multi-region setup"
  type        = bool
  default     = false
}

variable "enable_failover_routing" {
  description = "Enable failover routing for disaster recovery"
  type        = bool
  default     = false
}

variable "dr_alb_dns_name" {
  description = "DNS name of the DR Application Load Balancer"
  type        = string
  default     = ""
}

variable "dr_alb_zone_id" {
  description = "Route53 zone ID of the DR Application Load Balancer"
  type        = string
  default     = ""
}
