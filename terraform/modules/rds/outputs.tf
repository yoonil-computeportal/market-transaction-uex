# ==============================================================================
# RDS PostgreSQL Module - Outputs
# ==============================================================================

# ==============================================================================
# Primary Instance Outputs
# ==============================================================================

output "db_instance_id" {
  description = "RDS instance identifier"
  value       = aws_db_instance.primary.id
}

output "db_instance_arn" {
  description = "RDS instance ARN"
  value       = aws_db_instance.primary.arn
}

output "db_instance_endpoint" {
  description = "RDS instance connection endpoint"
  value       = aws_db_instance.primary.endpoint
}

output "db_instance_address" {
  description = "RDS instance hostname"
  value       = aws_db_instance.primary.address
}

output "db_instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.primary.port
}

output "db_instance_status" {
  description = "RDS instance status"
  value       = aws_db_instance.primary.status
}

output "db_instance_resource_id" {
  description = "RDS instance resource ID"
  value       = aws_db_instance.primary.resource_id
}

output "db_instance_availability_zone" {
  description = "RDS instance availability zone"
  value       = aws_db_instance.primary.availability_zone
}

output "db_instance_multi_az" {
  description = "Whether the RDS instance is Multi-AZ"
  value       = aws_db_instance.primary.multi_az
}

# ==============================================================================
# Database Information
# ==============================================================================

output "db_name" {
  description = "Name of the default database"
  value       = aws_db_instance.primary.db_name
}

output "db_master_username" {
  description = "Master username for the database"
  value       = aws_db_instance.primary.username
  sensitive   = true
}

# ==============================================================================
# Read Replica Outputs
# ==============================================================================

output "replica_instance_ids" {
  description = "List of read replica instance identifiers"
  value       = [for replica in aws_db_instance.replica : replica.id]
}

output "replica_instance_endpoints" {
  description = "List of read replica connection endpoints"
  value       = [for replica in aws_db_instance.replica : replica.endpoint]
}

output "replica_instance_addresses" {
  description = "List of read replica hostnames"
  value       = [for replica in aws_db_instance.replica : replica.address]
}

# ==============================================================================
# Connection String Outputs
# ==============================================================================

output "db_connection_string" {
  description = "PostgreSQL connection string (without password)"
  value       = "postgresql://${aws_db_instance.primary.username}@${aws_db_instance.primary.endpoint}/${aws_db_instance.primary.db_name}?sslmode=require"
  sensitive   = true
}

output "db_connection_info" {
  description = "Database connection information"
  value = {
    host     = aws_db_instance.primary.address
    port     = aws_db_instance.primary.port
    database = aws_db_instance.primary.db_name
    username = aws_db_instance.primary.username
    engine   = aws_db_instance.primary.engine
    version  = aws_db_instance.primary.engine_version
  }
  sensitive = true
}

# ==============================================================================
# Subnet Group Outputs
# ==============================================================================

output "db_subnet_group_id" {
  description = "DB subnet group ID"
  value       = aws_db_subnet_group.main.id
}

output "db_subnet_group_arn" {
  description = "DB subnet group ARN"
  value       = aws_db_subnet_group.main.arn
}

# ==============================================================================
# Parameter Group Outputs
# ==============================================================================

output "db_parameter_group_id" {
  description = "DB parameter group ID"
  value       = aws_db_parameter_group.main.id
}

output "db_parameter_group_arn" {
  description = "DB parameter group ARN"
  value       = aws_db_parameter_group.main.arn
}

# ==============================================================================
# Option Group Outputs
# ==============================================================================

output "db_option_group_id" {
  description = "DB option group ID"
  value       = aws_db_option_group.main.id
}

output "db_option_group_arn" {
  description = "DB option group ARN"
  value       = aws_db_option_group.main.arn
}

# ==============================================================================
# Monitoring Outputs
# ==============================================================================

output "enhanced_monitoring_role_arn" {
  description = "ARN of the enhanced monitoring IAM role"
  value       = var.monitoring_interval > 0 ? aws_iam_role.rds_enhanced_monitoring[0].arn : null
}

output "performance_insights_enabled" {
  description = "Whether Performance Insights is enabled"
  value       = aws_db_instance.primary.performance_insights_enabled
}

# ==============================================================================
# CloudWatch Alarms Outputs
# ==============================================================================

output "alarm_ids" {
  description = "Map of alarm names to IDs"
  value = var.create_alarms ? {
    cpu_utilization      = aws_cloudwatch_metric_alarm.primary_cpu[0].id
    free_storage_space   = aws_cloudwatch_metric_alarm.primary_storage[0].id
    database_connections = aws_cloudwatch_metric_alarm.primary_connections[0].id
    read_latency        = aws_cloudwatch_metric_alarm.primary_read_latency[0].id
    write_latency       = aws_cloudwatch_metric_alarm.primary_write_latency[0].id
  } : {}
}

output "replica_alarm_ids" {
  description = "List of replica lag alarm IDs"
  value       = var.create_alarms && var.read_replica_count > 0 ? [for alarm in aws_cloudwatch_metric_alarm.replica_lag : alarm.id] : []
}

# ==============================================================================
# Backup Configuration Outputs
# ==============================================================================

output "backup_retention_period" {
  description = "Backup retention period in days"
  value       = aws_db_instance.primary.backup_retention_period
}

output "backup_window" {
  description = "Backup window"
  value       = aws_db_instance.primary.backup_window
}

output "maintenance_window" {
  description = "Maintenance window"
  value       = aws_db_instance.primary.maintenance_window
}

# ==============================================================================
# CLI Commands
# ==============================================================================

output "psql_command" {
  description = "psql command to connect to the database"
  value       = "PGPASSWORD=$(aws secretsmanager get-secret-value --secret-id ${var.project_name}/${var.environment}/database --query SecretString --output text | jq -r .password) psql -h ${aws_db_instance.primary.address} -p ${aws_db_instance.primary.port} -U ${aws_db_instance.primary.username} -d ${aws_db_instance.primary.db_name}"
  sensitive   = true
}

output "connection_test_command" {
  description = "Command to test database connectivity"
  value       = "pg_isready -h ${aws_db_instance.primary.address} -p ${aws_db_instance.primary.port} -U ${aws_db_instance.primary.username}"
}

# ==============================================================================
# Configuration Summary
# ==============================================================================

output "configuration_summary" {
  description = "Summary of RDS configuration"
  value = {
    instance_class              = aws_db_instance.primary.instance_class
    engine_version              = aws_db_instance.primary.engine_version
    allocated_storage           = aws_db_instance.primary.allocated_storage
    max_allocated_storage       = aws_db_instance.primary.max_allocated_storage
    storage_type                = aws_db_instance.primary.storage_type
    multi_az                    = aws_db_instance.primary.multi_az
    read_replica_count          = var.read_replica_count
    backup_retention_period     = aws_db_instance.primary.backup_retention_period
    performance_insights        = aws_db_instance.primary.performance_insights_enabled
    enhanced_monitoring_interval = var.monitoring_interval
    deletion_protection         = aws_db_instance.primary.deletion_protection
  }
}
