# ==============================================================================
# ElastiCache Redis Module - Variables
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

variable "redis_subnet_ids" {
  description = "List of subnet IDs for the Redis subnet group"
  type        = list(string)
}

variable "redis_security_group_id" {
  description = "Security group ID for the Redis cluster"
  type        = string
}

variable "preferred_cache_cluster_azs" {
  description = "List of availability zones for cache clusters (non-cluster mode)"
  type        = list(string)
  default     = []
}

# ==============================================================================
# Redis Configuration
# ==============================================================================

variable "redis_port" {
  description = "Port for Redis"
  type        = number
  default     = 6379
}

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "redis_parameter_group_family" {
  description = "Parameter group family"
  type        = string
  default     = "redis7"
}

variable "node_type" {
  description = "Node type for Redis cluster"
  type        = string
  default     = "cache.t3.medium"

  validation {
    condition     = can(regex("^cache\\.", var.node_type))
    error_message = "Node type must start with 'cache.'"
  }
}

# ==============================================================================
# Cluster Configuration
# ==============================================================================

variable "cluster_mode_enabled" {
  description = "Enable cluster mode (sharding)"
  type        = bool
  default     = false
}

variable "num_cache_nodes" {
  description = "Number of cache nodes (non-cluster mode, including primary)"
  type        = number
  default     = 2

  validation {
    condition     = var.num_cache_nodes >= 1 && var.num_cache_nodes <= 6
    error_message = "Number of cache nodes must be between 1 and 6"
  }
}

variable "num_node_groups" {
  description = "Number of node groups (shards) for cluster mode"
  type        = number
  default     = 1

  validation {
    condition     = var.num_node_groups >= 1 && var.num_node_groups <= 500
    error_message = "Number of node groups must be between 1 and 500"
  }
}

variable "replicas_per_node_group" {
  description = "Number of replica nodes per shard (cluster mode)"
  type        = number
  default     = 1

  validation {
    condition     = var.replicas_per_node_group >= 0 && var.replicas_per_node_group <= 5
    error_message = "Replicas per node group must be between 0 and 5"
  }
}

variable "automatic_failover_enabled" {
  description = "Enable automatic failover (requires Multi-AZ)"
  type        = bool
  default     = true
}

variable "multi_az_enabled" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = true
}

# ==============================================================================
# Security Configuration
# ==============================================================================

variable "transit_encryption_enabled" {
  description = "Enable encryption in transit (TLS)"
  type        = bool
  default     = true
}

variable "auth_token_enabled" {
  description = "Enable auth token (password) for Redis"
  type        = bool
  default     = true
}

variable "auth_token" {
  description = "Auth token (password) for Redis (leave empty to disable auth)"
  type        = string
  default     = ""
  sensitive   = true

  validation {
    condition     = var.auth_token == "" || (length(var.auth_token) >= 16 && length(var.auth_token) <= 128)
    error_message = "Auth token must be between 16 and 128 characters"
  }
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption at rest"
  type        = string
}

# ==============================================================================
# Backup Configuration
# ==============================================================================

variable "enable_snapshots" {
  description = "Enable automated snapshots"
  type        = bool
  default     = true
}

variable "snapshot_retention_limit" {
  description = "Number of days to retain snapshots (0 to disable)"
  type        = number
  default     = 7

  validation {
    condition     = var.snapshot_retention_limit >= 0 && var.snapshot_retention_limit <= 35
    error_message = "Snapshot retention limit must be between 0 and 35 days"
  }
}

variable "snapshot_window" {
  description = "Preferred snapshot window (UTC)"
  type        = string
  default     = "03:00-05:00"

  validation {
    condition     = can(regex("^([0-1][0-9]|2[0-3]):[0-5][0-9]-([0-1][0-9]|2[0-3]):[0-5][0-9]$", var.snapshot_window))
    error_message = "Snapshot window must be in format HH:MM-HH:MM"
  }
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot when destroying the cluster"
  type        = bool
  default     = false
}

# ==============================================================================
# Maintenance Configuration
# ==============================================================================

variable "maintenance_window" {
  description = "Preferred maintenance window (UTC)"
  type        = string
  default     = "sun:05:00-sun:07:00"

  validation {
    condition     = can(regex("^(mon|tue|wed|thu|fri|sat|sun):[0-2][0-9]:[0-5][0-9]-(mon|tue|wed|thu|fri|sat|sun):[0-2][0-9]:[0-5][0-9]$", var.maintenance_window))
    error_message = "Maintenance window must be in format ddd:HH:MM-ddd:HH:MM"
  }
}

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

# ==============================================================================
# Parameter Group Settings
# ==============================================================================

variable "maxmemory_policy" {
  description = "Eviction policy when maxmemory is reached"
  type        = string
  default     = "allkeys-lru"

  validation {
    condition = contains([
      "volatile-lru", "allkeys-lru", "volatile-lfu", "allkeys-lfu",
      "volatile-random", "allkeys-random", "volatile-ttl", "noeviction"
    ], var.maxmemory_policy)
    error_message = "Invalid maxmemory policy"
  }
}

variable "timeout" {
  description = "Connection timeout in seconds (0 to disable)"
  type        = string
  default     = "300"
}

variable "notify_keyspace_events" {
  description = "Keyspace notifications configuration"
  type        = string
  default     = ""
}

# ==============================================================================
# Monitoring Configuration
# ==============================================================================

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

variable "notification_topic_arn" {
  description = "SNS topic ARN for ElastiCache notifications"
  type        = string
  default     = ""
}

# ==============================================================================
# CloudWatch Alarms Configuration
# ==============================================================================

variable "create_alarms" {
  description = "Create CloudWatch alarms for the Redis cluster"
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
  default     = 80
}

variable "engine_cpu_utilization_threshold" {
  description = "Engine CPU utilization alarm threshold (percentage)"
  type        = number
  default     = 90
}

variable "memory_utilization_threshold" {
  description = "Memory utilization alarm threshold (percentage)"
  type        = number
  default     = 85
}

variable "evictions_threshold" {
  description = "Evictions alarm threshold (count per 5 minutes)"
  type        = number
  default     = 100
}

variable "curr_connections_threshold" {
  description = "Current connections alarm threshold"
  type        = number
  default     = 500
}

variable "replication_lag_threshold" {
  description = "Replication lag alarm threshold (seconds)"
  type        = number
  default     = 30
}

variable "cache_hit_rate_threshold" {
  description = "Cache hit rate alarm threshold (percentage, minimum acceptable)"
  type        = number
  default     = 80
}

variable "network_bytes_in_threshold" {
  description = "Network bytes in alarm threshold (bytes per 5 minutes)"
  type        = number
  default     = 5000000000  # 5GB
}

variable "network_bytes_out_threshold" {
  description = "Network bytes out alarm threshold (bytes per 5 minutes)"
  type        = number
  default     = 5000000000  # 5GB
}

# ==============================================================================
# Tags
# ==============================================================================

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}
