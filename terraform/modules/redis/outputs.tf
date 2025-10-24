# ==============================================================================
# ElastiCache Redis Module - Outputs
# ==============================================================================

# ==============================================================================
# Replication Group Outputs
# ==============================================================================

output "replication_group_id" {
  description = "Redis replication group identifier"
  value       = aws_elasticache_replication_group.main.id
}

output "replication_group_arn" {
  description = "Redis replication group ARN"
  value       = aws_elasticache_replication_group.main.arn
}

output "replication_group_primary_endpoint_address" {
  description = "Primary endpoint address"
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "replication_group_reader_endpoint_address" {
  description = "Reader endpoint address (for read replicas)"
  value       = aws_elasticache_replication_group.main.reader_endpoint_address
}

output "replication_group_configuration_endpoint_address" {
  description = "Configuration endpoint address (cluster mode only)"
  value       = aws_elasticache_replication_group.main.configuration_endpoint_address
}

output "redis_port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.main.port
}

output "redis_engine_version" {
  description = "Redis engine version"
  value       = aws_elasticache_replication_group.main.engine_version_actual
}

# ==============================================================================
# Member Clusters
# ==============================================================================

output "member_clusters" {
  description = "List of member cluster identifiers"
  value       = aws_elasticache_replication_group.main.member_clusters
}

# ==============================================================================
# Connection Information
# ==============================================================================

output "redis_connection_string" {
  description = "Redis connection string"
  value = var.transit_encryption_enabled ? (
    var.auth_token_enabled ?
      "rediss://:${var.auth_token}@${aws_elasticache_replication_group.main.primary_endpoint_address}:${aws_elasticache_replication_group.main.port}" :
      "rediss://${aws_elasticache_replication_group.main.primary_endpoint_address}:${aws_elasticache_replication_group.main.port}"
  ) : (
    var.auth_token_enabled ?
      "redis://:${var.auth_token}@${aws_elasticache_replication_group.main.primary_endpoint_address}:${aws_elasticache_replication_group.main.port}" :
      "redis://${aws_elasticache_replication_group.main.primary_endpoint_address}:${aws_elasticache_replication_group.main.port}"
  )
  sensitive = true
}

output "redis_connection_info" {
  description = "Redis connection information"
  value = {
    primary_endpoint = aws_elasticache_replication_group.main.primary_endpoint_address
    reader_endpoint  = aws_elasticache_replication_group.main.reader_endpoint_address
    port            = aws_elasticache_replication_group.main.port
    tls_enabled     = var.transit_encryption_enabled
    auth_enabled    = var.auth_token_enabled
    cluster_mode    = var.cluster_mode_enabled
  }
  sensitive = true
}

# ==============================================================================
# Subnet Group Outputs
# ==============================================================================

output "subnet_group_name" {
  description = "Redis subnet group name"
  value       = aws_elasticache_subnet_group.main.name
}

output "subnet_group_arn" {
  description = "Redis subnet group ARN"
  value       = aws_elasticache_subnet_group.main.arn
}

# ==============================================================================
# Parameter Group Outputs
# ==============================================================================

output "parameter_group_id" {
  description = "Redis parameter group ID"
  value       = aws_elasticache_parameter_group.main.id
}

output "parameter_group_arn" {
  description = "Redis parameter group ARN"
  value       = aws_elasticache_parameter_group.main.arn
}

# ==============================================================================
# CloudWatch Log Groups
# ==============================================================================

output "slow_log_group_name" {
  description = "CloudWatch log group name for slow logs"
  value       = aws_cloudwatch_log_group.slow_log.name
}

output "slow_log_group_arn" {
  description = "CloudWatch log group ARN for slow logs"
  value       = aws_cloudwatch_log_group.slow_log.arn
}

output "engine_log_group_name" {
  description = "CloudWatch log group name for engine logs"
  value       = aws_cloudwatch_log_group.engine_log.name
}

output "engine_log_group_arn" {
  description = "CloudWatch log group ARN for engine logs"
  value       = aws_cloudwatch_log_group.engine_log.arn
}

# ==============================================================================
# CloudWatch Alarms Outputs
# ==============================================================================

output "alarm_ids" {
  description = "Map of alarm names to IDs"
  value = var.create_alarms ? {
    cpu_utilization        = aws_cloudwatch_metric_alarm.cpu[0].id
    engine_cpu_utilization = aws_cloudwatch_metric_alarm.engine_cpu[0].id
    memory_utilization     = aws_cloudwatch_metric_alarm.memory[0].id
    evictions             = aws_cloudwatch_metric_alarm.evictions[0].id
    connections           = aws_cloudwatch_metric_alarm.connections[0].id
    cache_hit_rate        = aws_cloudwatch_metric_alarm.cache_hit_rate[0].id
    network_bytes_in      = aws_cloudwatch_metric_alarm.network_bytes_in[0].id
    network_bytes_out     = aws_cloudwatch_metric_alarm.network_bytes_out[0].id
  } : {}
}

output "replication_lag_alarm_id" {
  description = "Replication lag alarm ID (if created)"
  value       = var.create_alarms && var.num_cache_nodes > 1 ? aws_cloudwatch_metric_alarm.replication_lag[0].id : null
}

# ==============================================================================
# Configuration Summary
# ==============================================================================

output "configuration_summary" {
  description = "Summary of Redis configuration"
  value = {
    node_type                   = var.node_type
    engine_version              = aws_elasticache_replication_group.main.engine_version_actual
    cluster_mode_enabled        = var.cluster_mode_enabled
    num_cache_nodes            = var.cluster_mode_enabled ? null : var.num_cache_nodes
    num_node_groups            = var.cluster_mode_enabled ? var.num_node_groups : null
    replicas_per_node_group    = var.cluster_mode_enabled ? var.replicas_per_node_group : null
    multi_az_enabled           = var.multi_az_enabled
    automatic_failover_enabled = var.automatic_failover_enabled
    transit_encryption         = var.transit_encryption_enabled
    at_rest_encryption         = true
    auth_token_enabled         = var.auth_token_enabled
    snapshot_retention_limit   = var.snapshot_retention_limit
  }
}

# ==============================================================================
# CLI Commands
# ==============================================================================

output "redis_cli_command" {
  description = "redis-cli command to connect to the cluster"
  value = var.transit_encryption_enabled ? (
    var.auth_token_enabled ?
      "redis-cli -h ${aws_elasticache_replication_group.main.primary_endpoint_address} -p ${aws_elasticache_replication_group.main.port} --tls -a $(aws secretsmanager get-secret-value --secret-id ${var.project_name}/${var.environment}/redis --query SecretString --output text | jq -r .auth_token)" :
      "redis-cli -h ${aws_elasticache_replication_group.main.primary_endpoint_address} -p ${aws_elasticache_replication_group.main.port} --tls"
  ) : (
    var.auth_token_enabled ?
      "redis-cli -h ${aws_elasticache_replication_group.main.primary_endpoint_address} -p ${aws_elasticache_replication_group.main.port} -a $(aws secretsmanager get-secret-value --secret-id ${var.project_name}/${var.environment}/redis --query SecretString --output text | jq -r .auth_token)" :
      "redis-cli -h ${aws_elasticache_replication_group.main.primary_endpoint_address} -p ${aws_elasticache_replication_group.main.port}"
  )
  sensitive = true
}

output "connection_test_command" {
  description = "Command to test Redis connectivity"
  value = var.transit_encryption_enabled ? (
    var.auth_token_enabled ?
      "redis-cli -h ${aws_elasticache_replication_group.main.primary_endpoint_address} -p ${aws_elasticache_replication_group.main.port} --tls -a $(aws secretsmanager get-secret-value --secret-id ${var.project_name}/${var.environment}/redis --query SecretString --output text | jq -r .auth_token) PING" :
      "redis-cli -h ${aws_elasticache_replication_group.main.primary_endpoint_address} -p ${aws_elasticache_replication_group.main.port} --tls PING"
  ) : (
    var.auth_token_enabled ?
      "redis-cli -h ${aws_elasticache_replication_group.main.primary_endpoint_address} -p ${aws_elasticache_replication_group.main.port} -a $(aws secretsmanager get-secret-value --secret-id ${var.project_name}/${var.environment}/redis --query SecretString --output text | jq -r .auth_token) PING" :
      "redis-cli -h ${aws_elasticache_replication_group.main.primary_endpoint_address} -p ${aws_elasticache_replication_group.main.port} PING"
  )
  sensitive = true
}

# ==============================================================================
# Endpoint URLs for Different Languages
# ==============================================================================

output "nodejs_connection_example" {
  description = "Example Node.js connection code"
  value = <<-EOT
    const redis = require('redis');

    const client = redis.createClient({
      socket: {
        host: '${aws_elasticache_replication_group.main.primary_endpoint_address}',
        port: ${aws_elasticache_replication_group.main.port},
        ${var.transit_encryption_enabled ? "tls: true," : ""}
      },
      ${var.auth_token_enabled ? "password: process.env.REDIS_AUTH_TOKEN," : ""}
    });
  EOT
  sensitive = true
}

output "python_connection_example" {
  description = "Example Python connection code"
  value = <<-EOT
    import redis

    client = redis.Redis(
        host='${aws_elasticache_replication_group.main.primary_endpoint_address}',
        port=${aws_elasticache_replication_group.main.port},
        ${var.transit_encryption_enabled ? "ssl=True," : ""}
        ${var.auth_token_enabled ? "password=os.environ['REDIS_AUTH_TOKEN']," : ""}
        decode_responses=True
    )
  EOT
  sensitive = true
}
