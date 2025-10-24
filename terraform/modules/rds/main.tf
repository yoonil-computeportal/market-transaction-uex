# ==============================================================================
# RDS PostgreSQL Module - Main Configuration
# ==============================================================================
#
# This module creates a production-ready RDS PostgreSQL database cluster with:
# - Primary RDS instance
# - Optional read replicas (0-2)
# - Automated backups and point-in-time recovery
# - Performance Insights
# - Enhanced monitoring
# - CloudWatch alarms
# - Multi-AZ configuration
# - KMS encryption
# - Secrets Manager integration
#
# ==============================================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ==============================================================================
# DB Subnet Group
# ==============================================================================

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group"
  subnet_ids = var.db_subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-db-subnet-group"
    }
  )
}

# ==============================================================================
# DB Parameter Group
# ==============================================================================

resource "aws_db_parameter_group" "main" {
  name   = "${var.project_name}-${var.environment}-db-params"
  family = var.db_parameter_group_family

  # Performance and connection settings
  parameter {
    name  = "max_connections"
    value = var.max_connections
  }

  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/10240}"  # 25% of instance memory
  }

  parameter {
    name  = "effective_cache_size"
    value = "{DBInstanceClassMemory/5120}"   # 75% of instance memory
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "2097152"  # 2GB in KB
  }

  parameter {
    name  = "work_mem"
    value = "16384"    # 16MB in KB
  }

  # Logging settings
  parameter {
    name  = "log_statement"
    value = var.log_statement
  }

  parameter {
    name  = "log_min_duration_statement"
    value = var.log_min_duration_statement
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_lock_waits"
    value = "1"
  }

  # SSL/TLS enforcement
  parameter {
    name  = "rds.force_ssl"
    value = var.force_ssl ? "1" : "0"
  }

  # WAL and replication settings
  parameter {
    name  = "wal_buffers"
    value = "2048"  # 16MB in 8KB pages
  }

  parameter {
    name  = "checkpoint_completion_target"
    value = "0.9"
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-db-params"
    }
  )
}

# ==============================================================================
# DB Option Group (PostgreSQL doesn't have many options)
# ==============================================================================

resource "aws_db_option_group" "main" {
  name                     = "${var.project_name}-${var.environment}-db-options"
  option_group_description = "Option group for ${var.project_name} ${var.environment}"
  engine_name              = "postgres"
  major_engine_version     = var.db_major_version

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-db-options"
    }
  )
}

# ==============================================================================
# Enhanced Monitoring IAM Role
# ==============================================================================

resource "aws_iam_role" "rds_enhanced_monitoring" {
  count = var.enabled_cloudwatch_logs_exports ? 1 : 0

  name = "${var.project_name}-${var.environment}-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-rds-monitoring-role"
    }
  )
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  count = var.enabled_cloudwatch_logs_exports ? 1 : 0

  role       = aws_iam_role.rds_enhanced_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# ==============================================================================
# Primary RDS Instance
# ==============================================================================

resource "aws_db_instance" "primary" {
  identifier = "${var.project_name}-${var.environment}-db-primary"

  # Engine configuration
  engine               = "postgres"
  engine_version       = var.db_engine_version
  instance_class       = var.db_instance_class
  allocated_storage    = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type         = var.storage_type
  storage_encrypted    = true
  kms_key_id          = var.kms_key_arn
  iops                = var.storage_type == "io1" || var.storage_type == "io2" ? var.iops : null

  # Database configuration
  db_name  = var.database_name
  username = var.master_username
  password = var.master_password
  port     = var.database_port

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.db_security_group_id]
  publicly_accessible    = false
  multi_az              = var.multi_az

  # Parameter and option groups
  parameter_group_name = aws_db_parameter_group.main.name
  option_group_name    = aws_db_option_group.main.name

  # Backup configuration
  backup_retention_period   = var.backup_retention_period
  backup_window            = var.backup_window
  maintenance_window       = var.maintenance_window
  copy_tags_to_snapshot    = true
  skip_final_snapshot      = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.project_name}-${var.environment}-db-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  delete_automated_backups = var.delete_automated_backups

  # Monitoring
  enabled_cloudwatch_logs_exports = var.enabled_cloudwatch_logs_exports ? ["postgresql", "upgrade"] : []
  monitoring_interval             = var.monitoring_interval
  monitoring_role_arn            = var.monitoring_interval > 0 ? aws_iam_role.rds_enhanced_monitoring[0].arn : null
  performance_insights_enabled    = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_enabled ? var.performance_insights_retention_period : null
  performance_insights_kms_key_id       = var.performance_insights_enabled ? var.kms_key_arn : null

  # Maintenance and updates
  auto_minor_version_upgrade = var.auto_minor_version_upgrade
  apply_immediately         = var.apply_immediately

  # Deletion protection
  deletion_protection = var.deletion_protection

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-db-primary"
      Role = "primary"
    }
  )

  lifecycle {
    ignore_changes = [
      password,  # Ignore password changes as it's managed by Secrets Manager
      final_snapshot_identifier
    ]
  }
}

# ==============================================================================
# Read Replicas
# ==============================================================================

resource "aws_db_instance" "replica" {
  count = var.read_replica_count

  identifier = "${var.project_name}-${var.environment}-db-replica-${count.index + 1}"

  # Replica configuration
  replicate_source_db = aws_db_instance.primary.identifier
  instance_class      = var.replica_instance_class != "" ? var.replica_instance_class : var.db_instance_class
  storage_encrypted   = true
  kms_key_id         = var.kms_key_arn

  # Network configuration
  vpc_security_group_ids = [var.db_security_group_id]
  publicly_accessible    = false
  multi_az              = false  # Replicas are typically single-AZ

  # Parameter group
  parameter_group_name = aws_db_parameter_group.main.name

  # Backup configuration (replicas can have their own backup settings)
  backup_retention_period = 0  # Replicas don't need separate backups
  skip_final_snapshot     = true

  # Monitoring
  enabled_cloudwatch_logs_exports = var.enabled_cloudwatch_logs_exports ? ["postgresql", "upgrade"] : []
  monitoring_interval             = var.monitoring_interval
  monitoring_role_arn            = var.monitoring_interval > 0 ? aws_iam_role.rds_enhanced_monitoring[0].arn : null
  performance_insights_enabled    = var.performance_insights_enabled
  performance_insights_retention_period = var.performance_insights_enabled ? var.performance_insights_retention_period : null
  performance_insights_kms_key_id       = var.performance_insights_enabled ? var.kms_key_arn : null

  # Maintenance and updates
  auto_minor_version_upgrade = var.auto_minor_version_upgrade
  apply_immediately         = var.apply_immediately

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-db-replica-${count.index + 1}"
      Role = "replica"
    }
  )
}

# ==============================================================================
# CloudWatch Log Groups (for PostgreSQL logs)
# ==============================================================================

resource "aws_cloudwatch_log_group" "postgresql" {
  count = var.enabled_cloudwatch_logs_exports ? 1 : 0

  name              = "/aws/rds/instance/${aws_db_instance.primary.identifier}/postgresql"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id       = var.kms_key_arn

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-db-postgresql-logs"
    }
  )
}

resource "aws_cloudwatch_log_group" "upgrade" {
  count = var.enabled_cloudwatch_logs_exports ? 1 : 0

  name              = "/aws/rds/instance/${aws_db_instance.primary.identifier}/upgrade"
  retention_in_days = var.cloudwatch_log_retention_days
  kms_key_id       = var.kms_key_arn

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-db-upgrade-logs"
    }
  )
}

# ==============================================================================
# CloudWatch Alarms - Primary Instance
# ==============================================================================

# CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "primary_cpu" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-db-primary-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = var.cpu_utilization_threshold
  alarm_description  = "This metric monitors RDS CPU utilization"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }

  tags = var.tags
}

# Free Storage Space Alarm
resource "aws_cloudwatch_metric_alarm" "primary_storage" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-db-primary-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "FreeStorageSpace"
  namespace          = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = var.free_storage_space_threshold
  alarm_description  = "This metric monitors RDS free storage space"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }

  tags = var.tags
}

# Database Connections Alarm
resource "aws_cloudwatch_metric_alarm" "primary_connections" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-db-primary-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "DatabaseConnections"
  namespace          = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = var.database_connections_threshold
  alarm_description  = "This metric monitors RDS database connections"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }

  tags = var.tags
}

# Read Latency Alarm
resource "aws_cloudwatch_metric_alarm" "primary_read_latency" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-db-primary-read-latency-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "ReadLatency"
  namespace          = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = var.read_latency_threshold
  alarm_description  = "This metric monitors RDS read latency"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }

  tags = var.tags
}

# Write Latency Alarm
resource "aws_cloudwatch_metric_alarm" "primary_write_latency" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-db-primary-write-latency-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "WriteLatency"
  namespace          = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = var.write_latency_threshold
  alarm_description  = "This metric monitors RDS write latency"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.primary.identifier
  }

  tags = var.tags
}

# ==============================================================================
# CloudWatch Alarms - Read Replicas
# ==============================================================================

# Replica Lag Alarm
resource "aws_cloudwatch_metric_alarm" "replica_lag" {
  count = var.create_alarms && var.read_replica_count > 0 ? var.read_replica_count : 0

  alarm_name          = "${var.project_name}-${var.environment}-db-replica-${count.index + 1}-lag-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "ReplicaLag"
  namespace          = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = var.replica_lag_threshold
  alarm_description  = "This metric monitors RDS replica lag"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.replica[count.index].identifier
  }

  tags = var.tags
}
