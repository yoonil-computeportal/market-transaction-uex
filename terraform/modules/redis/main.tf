# ==============================================================================
# ElastiCache Redis Module - Main Configuration
# ==============================================================================
#
# This module creates a production-ready ElastiCache Redis cluster with:
# - Redis 7.0 replication group
# - Multi-AZ with automatic failover
# - Encryption at rest (KMS) and in transit (TLS)
# - Auth token for authentication
# - Automated snapshots
# - CloudWatch alarms
# - Subnet group configuration
#
# ==============================================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ==============================================================================
# ElastiCache Subnet Group
# ==============================================================================

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-redis-subnet-group"
  subnet_ids = var.redis_subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-redis-subnet-group"
    }
  )
}

# ==============================================================================
# ElastiCache Parameter Group
# ==============================================================================

resource "aws_elasticache_parameter_group" "main" {
  name   = "${var.project_name}-${var.environment}-redis-params"
  family = var.redis_parameter_group_family

  # Memory management
  parameter {
    name  = "maxmemory-policy"
    value = var.maxmemory_policy
  }

  # Persistence settings
  dynamic "parameter" {
    for_each = var.enable_snapshots ? [1] : []
    content {
      name  = "appendonly"
      value = "yes"
    }
  }

  # Timeout settings
  parameter {
    name  = "timeout"
    value = var.timeout
  }

  # Connection settings
  parameter {
    name  = "tcp-keepalive"
    value = "300"
  }

  # Notifications
  parameter {
    name  = "notify-keyspace-events"
    value = var.notify_keyspace_events
  }

  # Cluster mode settings (only if cluster mode enabled)
  dynamic "parameter" {
    for_each = var.cluster_mode_enabled ? [1] : []
    content {
      name  = "cluster-enabled"
      value = "yes"
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-redis-params"
    }
  )
}

# ==============================================================================
# ElastiCache Replication Group
# ==============================================================================

resource "aws_elasticache_replication_group" "main" {
  replication_group_id = "${var.project_name}-${var.environment}-redis"
  description          = "${var.project_name} ${var.environment} Redis cluster"

  # Engine configuration
  engine               = "redis"
  engine_version       = var.redis_engine_version
  node_type            = var.node_type
  port                 = var.redis_port
  parameter_group_name = aws_elasticache_parameter_group.main.name

  # Cluster configuration
  num_cache_clusters         = var.cluster_mode_enabled ? null : var.num_cache_nodes
  num_node_groups           = var.cluster_mode_enabled ? var.num_node_groups : null
  replicas_per_node_group   = var.cluster_mode_enabled ? var.replicas_per_node_group : null
  automatic_failover_enabled = var.automatic_failover_enabled
  multi_az_enabled          = var.multi_az_enabled

  # Network configuration
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [var.redis_security_group_id]
  preferred_cache_cluster_azs = var.cluster_mode_enabled ? null : var.preferred_cache_cluster_azs

  # Security configuration
  at_rest_encryption_enabled = true
  kms_key_id                = var.kms_key_arn
  transit_encryption_enabled = var.transit_encryption_enabled
  auth_token_enabled        = var.auth_token_enabled
  auth_token                = var.auth_token_enabled ? var.auth_token : null

  # Backup configuration
  snapshot_retention_limit = var.snapshot_retention_limit
  snapshot_window         = var.snapshot_window
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.project_name}-${var.environment}-redis-final-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Maintenance
  maintenance_window         = var.maintenance_window
  auto_minor_version_upgrade = var.auto_minor_version_upgrade
  apply_immediately         = var.apply_immediately

  # Logging
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.slow_log.name
    destination_type = "cloudwatch-logs"
    log_format      = "json"
    log_type        = "slow-log"
  }

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.engine_log.name
    destination_type = "cloudwatch-logs"
    log_format      = "json"
    log_type        = "engine-log"
  }

  # Notifications
  notification_topic_arn = var.notification_topic_arn

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-redis"
    }
  )

  lifecycle {
    ignore_changes = [
      auth_token,  # Ignore auth token changes as it's managed by Secrets Manager
      final_snapshot_identifier
    ]
  }
}

# ==============================================================================
# CloudWatch Log Groups
# ==============================================================================

resource "aws_cloudwatch_log_group" "slow_log" {
  name              = "/aws/elasticache/${var.project_name}-${var.environment}-redis/slow-log"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id       = var.kms_key_arn

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-redis-slow-log"
    }
  )
}

resource "aws_cloudwatch_log_group" "engine_log" {
  name              = "/aws/elasticache/${var.project_name}-${var.environment}-redis/engine-log"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id       = var.kms_key_arn

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-redis-engine-log"
    }
  )
}

# ==============================================================================
# CloudWatch Alarms
# ==============================================================================

# CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "cpu" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-redis-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/ElastiCache"
  period             = "300"
  statistic          = "Average"
  threshold          = var.cpu_utilization_threshold
  alarm_description  = "This metric monitors Redis CPU utilization"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.main.id
  }

  tags = var.tags
}

# Engine CPU Utilization Alarm (for cluster mode)
resource "aws_cloudwatch_metric_alarm" "engine_cpu" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-redis-engine-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "EngineCPUUtilization"
  namespace          = "AWS/ElastiCache"
  period             = "300"
  statistic          = "Average"
  threshold          = var.engine_cpu_utilization_threshold
  alarm_description  = "This metric monitors Redis engine CPU utilization"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.main.id
  }

  tags = var.tags
}

# Memory Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "memory" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-redis-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "DatabaseMemoryUsagePercentage"
  namespace          = "AWS/ElastiCache"
  period             = "300"
  statistic          = "Average"
  threshold          = var.memory_utilization_threshold
  alarm_description  = "This metric monitors Redis memory utilization"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.main.id
  }

  tags = var.tags
}

# Evictions Alarm
resource "aws_cloudwatch_metric_alarm" "evictions" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-redis-evictions-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "Evictions"
  namespace          = "AWS/ElastiCache"
  period             = "300"
  statistic          = "Sum"
  threshold          = var.evictions_threshold
  alarm_description  = "This metric monitors Redis evictions"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.main.id
  }

  tags = var.tags
}

# Current Connections Alarm
resource "aws_cloudwatch_metric_alarm" "connections" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-redis-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CurrConnections"
  namespace          = "AWS/ElastiCache"
  period             = "300"
  statistic          = "Average"
  threshold          = var.curr_connections_threshold
  alarm_description  = "This metric monitors Redis current connections"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.main.id
  }

  tags = var.tags
}

# Replication Lag Alarm
resource "aws_cloudwatch_metric_alarm" "replication_lag" {
  count = var.create_alarms && var.num_cache_nodes > 1 ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-redis-replication-lag-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "ReplicationLag"
  namespace          = "AWS/ElastiCache"
  period             = "300"
  statistic          = "Average"
  threshold          = var.replication_lag_threshold
  alarm_description  = "This metric monitors Redis replication lag"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.main.id
  }

  tags = var.tags
}

# Cache Hit Rate Alarm
resource "aws_cloudwatch_metric_alarm" "cache_hit_rate" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-redis-cache-hit-rate-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CacheHitRate"
  namespace          = "AWS/ElastiCache"
  period             = "300"
  statistic          = "Average"
  threshold          = var.cache_hit_rate_threshold
  alarm_description  = "This metric monitors Redis cache hit rate"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.main.id
  }

  tags = var.tags
}

# Network Bytes In Alarm
resource "aws_cloudwatch_metric_alarm" "network_bytes_in" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-redis-network-in-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "NetworkBytesIn"
  namespace          = "AWS/ElastiCache"
  period             = "300"
  statistic          = "Average"
  threshold          = var.network_bytes_in_threshold
  alarm_description  = "This metric monitors Redis network bytes in"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.main.id
  }

  tags = var.tags
}

# Network Bytes Out Alarm
resource "aws_cloudwatch_metric_alarm" "network_bytes_out" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-redis-network-out-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "NetworkBytesOut"
  namespace          = "AWS/ElastiCache"
  period             = "300"
  statistic          = "Average"
  threshold          = var.network_bytes_out_threshold
  alarm_description  = "This metric monitors Redis network bytes out"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    ReplicationGroupId = aws_elasticache_replication_group.main.id
  }

  tags = var.tags
}
