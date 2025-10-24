# ==============================================================================
# Monitoring Module - Outputs
# ==============================================================================

# ==============================================================================
# SNS Topic Outputs
# ==============================================================================

output "critical_topic_arn" {
  description = "ARN of the critical alerts SNS topic"
  value       = aws_sns_topic.critical_alerts.arn
}

output "warning_topic_arn" {
  description = "ARN of the warning alerts SNS topic"
  value       = aws_sns_topic.warning_alerts.arn
}

output "info_topic_arn" {
  description = "ARN of the info notifications SNS topic"
  value       = aws_sns_topic.info_notifications.arn
}

# ==============================================================================
# CloudWatch Dashboard Outputs
# ==============================================================================

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

# ==============================================================================
# Log Group Outputs
# ==============================================================================

output "log_group_names" {
  description = "Map of log group names"
  value = {
    ecs_services = [for service in var.ecs_service_names : "/ecs/${var.project_name}-${var.environment}/${service}"]
  }
}

# ==============================================================================
# Alarm Outputs
# ==============================================================================

output "alarm_arns" {
  description = "Map of all CloudWatch alarm ARNs"
  value = {
    ecs_cpu_alarms    = { for k, v in aws_cloudwatch_metric_alarm.ecs_cpu_high : k => v.arn }
    ecs_memory_alarms = { for k, v in aws_cloudwatch_metric_alarm.ecs_memory_high : k => v.arn }
    rds_cpu_alarm     = aws_cloudwatch_metric_alarm.rds_cpu_high.arn
    rds_storage_alarm = aws_cloudwatch_metric_alarm.rds_storage_low.arn
    alb_5xx_alarm     = aws_cloudwatch_metric_alarm.alb_5xx_high.arn
  }
}
