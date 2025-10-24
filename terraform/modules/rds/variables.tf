# ==============================================================================
# RDS PostgreSQL Module - Variables
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

variable "db_subnet_ids" {
  description = "List of subnet IDs for the DB subnet group"
  type        = list(string)
}

variable "db_security_group_id" {
  description = "Security group ID for the RDS instance"
  type        = string
}

# ==============================================================================
# Database Configuration
# ==============================================================================

variable "database_name" {
  description = "Name of the default database to create"
  type        = string
  default     = "uex_payments"
}

variable "database_port" {
  description = "Port for the database"
  type        = number
  default     = 5432
}

variable "master_username" {
  description = "Master username for the database"
  type        = string
  default     = "dbadmin"
  sensitive   = true
}

variable "master_password" {
  description = "Master password for the database (leave empty to auto-generate)"
  type        = string
  sensitive   = true
}

# ==============================================================================
# Instance Configuration
# ==============================================================================

variable "db_instance_class" {
  description = "Instance class for the RDS instance"
  type        = string
  default     = "db.t3.medium"

  validation {
    condition     = can(regex("^db\\.", var.db_instance_class))
    error_message = "Instance class must start with 'db.'"
  }
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

variable "db_major_version" {
  description = "PostgreSQL major version for option group"
  type        = string
  default     = "15"
}

variable "db_parameter_group_family" {
  description = "Parameter group family"
  type        = string
  default     = "postgres15"
}

# ==============================================================================
# Storage Configuration
# ==============================================================================

variable "allocated_storage" {
  description = "Initial allocated storage in GB"
  type        = number
  default     = 100

  validation {
    condition     = var.allocated_storage >= 20 && var.allocated_storage <= 65536
    error_message = "Allocated storage must be between 20 and 65536 GB"
  }
}

variable "max_allocated_storage" {
  description = "Maximum allocated storage for autoscaling in GB"
  type        = number
  default     = 500

  validation {
    condition     = var.max_allocated_storage >= 20 && var.max_allocated_storage <= 65536
    error_message = "Max allocated storage must be between 20 and 65536 GB"
  }
}

variable "storage_type" {
  description = "Storage type (gp2, gp3, io1, io2)"
  type        = string
  default     = "gp3"

  validation {
    condition     = contains(["gp2", "gp3", "io1", "io2"], var.storage_type)
    error_message = "Storage type must be one of: gp2, gp3, io1, io2"
  }
}

variable "iops" {
  description = "Provisioned IOPS (only for io1/io2 storage types)"
  type        = number
  default     = null
}

# ==============================================================================
# High Availability Configuration
# ==============================================================================

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = true
}

variable "read_replica_count" {
  description = "Number of read replicas to create (0-2)"
  type        = number
  default     = 0

  validation {
    condition     = var.read_replica_count >= 0 && var.read_replica_count <= 2
    error_message = "Read replica count must be between 0 and 2"
  }
}

variable "replica_instance_class" {
  description = "Instance class for read replicas (defaults to same as primary)"
  type        = string
  default     = ""
}

# ==============================================================================
# Backup Configuration
# ==============================================================================

variable "backup_retention_period" {
  description = "Backup retention period in days (0-35)"
  type        = number
  default     = 7

  validation {
    condition     = var.backup_retention_period >= 0 && var.backup_retention_period <= 35
    error_message = "Backup retention period must be between 0 and 35 days"
  }
}

variable "backup_window" {
  description = "Preferred backup window (UTC)"
  type        = string
  default     = "03:00-04:00"

  validation {
    condition     = can(regex("^([0-1][0-9]|2[0-3]):[0-5][0-9]-([0-1][0-9]|2[0-3]):[0-5][0-9]$", var.backup_window))
    error_message = "Backup window must be in format HH:MM-HH:MM"
  }
}

variable "maintenance_window" {
  description = "Preferred maintenance window (UTC)"
  type        = string
  default     = "sun:04:00-sun:05:00"

  validation {
    condition     = can(regex("^(mon|tue|wed|thu|fri|sat|sun):[0-2][0-9]:[0-5][0-9]-(mon|tue|wed|thu|fri|sat|sun):[0-2][0-9]:[0-5][0-9]$", var.maintenance_window))
    error_message = "Maintenance window must be in format ddd:HH:MM-ddd:HH:MM"
  }
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot when destroying the database"
  type        = bool
  default     = false
}

variable "delete_automated_backups" {
  description = "Delete automated backups when the DB instance is deleted"
  type        = bool
  default     = true
}

# ==============================================================================
# Monitoring Configuration
# ==============================================================================

variable "monitoring_interval" {
  description = "Enhanced monitoring interval in seconds (0, 1, 5, 10, 15, 30, 60)"
  type        = number
  default     = 60

  validation {
    condition     = contains([0, 1, 5, 10, 15, 30, 60], var.monitoring_interval)
    error_message = "Monitoring interval must be one of: 0, 1, 5, 10, 15, 30, 60"
  }
}

variable "performance_insights_enabled" {
  description = "Enable Performance Insights"
  type        = bool
  default     = true
}

variable "performance_insights_retention_period" {
  description = "Performance Insights retention period in days (7 or 731)"
  type        = number
  default     = 7

  validation {
    condition     = contains([7, 731], var.performance_insights_retention_period)
    error_message = "Performance Insights retention must be 7 or 731 days"
  }
}

variable "enabled_cloudwatch_logs_exports" {
  description = "Enable CloudWatch Logs exports"
  type        = bool
  default     = true
}

variable "cloudwatch_log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 30

  validation {
    condition = contains([
      1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653
    ], var.cloudwatch_log_retention_days)
    error_message = "CloudWatch log retention must be a valid value"
  }
}

# ==============================================================================
# Parameter Group Settings
# ==============================================================================

variable "max_connections" {
  description = "Maximum number of database connections"
  type        = number
  default     = 200
}

variable "log_statement" {
  description = "Log statement type (none, ddl, mod, all)"
  type        = string
  default     = "ddl"

  validation {
    condition     = contains(["none", "ddl", "mod", "all"], var.log_statement)
    error_message = "Log statement must be one of: none, ddl, mod, all"
  }
}

variable "log_min_duration_statement" {
  description = "Minimum execution time in ms to log queries (-1 to disable)"
  type        = number
  default     = 1000
}

variable "force_ssl" {
  description = "Force SSL connections"
  type        = bool
  default     = true
}

# ==============================================================================
# Maintenance Configuration
# ==============================================================================

variable "auto_minor_version_upgrade" {
  description = "Enable automatic minor version upgrades"
  type        = bool
  default     = true
}

variable "apply_immediately" {
  description = "Apply changes immediately (use with caution)"
  type        = bool
  default     = false
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

# ==============================================================================
# Encryption Configuration
# ==============================================================================

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

# ==============================================================================
# CloudWatch Alarms Configuration
# ==============================================================================

variable "create_alarms" {
  description = "Create CloudWatch alarms for the RDS instance"
  type        = bool
  default     = true
}

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for alarm notifications"
  type        = string
  default     = ""
}

variable "cpu_utilization_threshold" {
  description = "CPU utilization alarm threshold (percentage)"
  type        = number
  default     = 85
}

variable "free_storage_space_threshold" {
  description = "Free storage space alarm threshold (bytes)"
  type        = number
  default     = 21474836480  # 20GB in bytes
}

variable "database_connections_threshold" {
  description = "Database connections alarm threshold"
  type        = number
  default     = 160  # 80% of default max_connections (200)
}

variable "read_latency_threshold" {
  description = "Read latency alarm threshold (seconds)"
  type        = number
  default     = 0.1
}

variable "write_latency_threshold" {
  description = "Write latency alarm threshold (seconds)"
  type        = number
  default     = 0.2
}

variable "replica_lag_threshold" {
  description = "Replica lag alarm threshold (seconds)"
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
