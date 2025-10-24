# ==============================================================================
# CloudWatch Monitoring Module - Main Configuration
# ==============================================================================
#
# This module creates comprehensive monitoring for the UEX Payment Processing System:
# - CloudWatch Dashboard with all key metrics
# - SNS Topics for alerts (Critical, Warning, Info)
# - CloudWatch Alarms for ECS, RDS, Redis, ALB
# - Log Groups with retention policies
# - Metric filters for application logs
# - Cost monitoring and billing alarms
#
# ==============================================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ==============================================================================
# SNS Topics for Alerts
# ==============================================================================

# Critical Alerts (require immediate action)
resource "aws_sns_topic" "critical_alerts" {
  name              = "${var.project_name}-${var.environment}-critical-alerts"
  display_name      = "Critical Alerts - ${var.project_name} ${var.environment}"
  kms_master_key_id = var.kms_key_id

  tags = merge(
    var.tags,
    {
      Name     = "${var.project_name}-${var.environment}-critical-alerts"
      Severity = "critical"
    }
  )
}

# Warning Alerts (review within 1 hour)
resource "aws_sns_topic" "warning_alerts" {
  name              = "${var.project_name}-${var.environment}-warning-alerts"
  display_name      = "Warning Alerts - ${var.project_name} ${var.environment}"
  kms_master_key_id = var.kms_key_id

  tags = merge(
    var.tags,
    {
      Name     = "${var.project_name}-${var.environment}-warning-alerts"
      Severity = "warning"
    }
  )
}

# Info Notifications (informational updates)
resource "aws_sns_topic" "info_notifications" {
  name              = "${var.project_name}-${var.environment}-info-notifications"
  display_name      = "Info Notifications - ${var.project_name} ${var.environment}"
  kms_master_key_id = var.kms_key_id

  tags = merge(
    var.tags,
    {
      Name     = "${var.project_name}-${var.environment}-info-notifications"
      Severity = "info"
    }
  )
}

# ==============================================================================
# SNS Topic Subscriptions
# ==============================================================================

resource "aws_sns_topic_subscription" "critical_email" {
  count = length(var.critical_alert_emails)

  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "email"
  endpoint  = var.critical_alert_emails[count.index]
}

resource "aws_sns_topic_subscription" "warning_email" {
  count = length(var.warning_alert_emails)

  topic_arn = aws_sns_topic.warning_alerts.arn
  protocol  = "email"
  endpoint  = var.warning_alert_emails[count.index]
}

# ==============================================================================
# CloudWatch Dashboard
# ==============================================================================

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}-dashboard"

  dashboard_body = jsonencode({
    widgets = concat(
      # ECS Metrics
      [
        {
          type = "metric"
          properties = {
            metrics = [
              for service in var.ecs_service_names : [
                "AWS/ECS", "CPUUtilization",
                { "stat" : "Average" },
                { "dimensions" : { "ServiceName" : service, "ClusterName" : var.ecs_cluster_name } }
              ]
            ]
            period  = 300
            stat    = "Average"
            region  = data.aws_region.current.name
            title   = "ECS CPU Utilization"
            yAxis = {
              left = {
                min = 0
                max = 100
              }
            }
          }
        },
        {
          type = "metric"
          properties = {
            metrics = [
              for service in var.ecs_service_names : [
                "AWS/ECS", "MemoryUtilization",
                { "stat" : "Average" },
                { "dimensions" : { "ServiceName" : service, "ClusterName" : var.ecs_cluster_name } }
              ]
            ]
            period  = 300
            stat    = "Average"
            region  = data.aws_region.current.name
            title   = "ECS Memory Utilization"
            yAxis = {
              left = {
                min = 0
                max = 100
              }
            }
          }
        }
      ],
      # RDS Metrics
      [
        {
          type = "metric"
          properties = {
            metrics = [
              ["AWS/RDS", "CPUUtilization", { "dimensions" : { "DBInstanceIdentifier" : var.rds_instance_id } }],
              [".", "DatabaseConnections", { "dimensions" : { "DBInstanceIdentifier" : var.rds_instance_id } }],
              [".", "FreeStorageSpace", { "dimensions" : { "DBInstanceIdentifier" : var.rds_instance_id } }]
            ]
            period = 300
            stat   = "Average"
            region = data.aws_region.current.name
            title  = "RDS Primary Metrics"
          }
        }
      ],
      # Redis Metrics
      [
        {
          type = "metric"
          properties = {
            metrics = [
              ["AWS/ElastiCache", "CPUUtilization", { "dimensions" : { "CacheClusterId" : var.redis_cluster_id } }],
              [".", "DatabaseMemoryUsagePercentage", { "dimensions" : { "CacheClusterId" : var.redis_cluster_id } }],
              [".", "NetworkBytesIn", { "dimensions" : { "CacheClusterId" : var.redis_cluster_id } }],
              [".", "NetworkBytesOut", { "dimensions" : { "CacheClusterId" : var.redis_cluster_id } }]
            ]
            period = 300
            stat   = "Average"
            region = data.aws_region.current.name
            title  = "Redis Metrics"
          }
        }
      ],
      # ALB Metrics
      [
        {
          type = "metric"
          properties = {
            metrics = [
              ["AWS/ApplicationELB", "TargetResponseTime", { "dimensions" : { "LoadBalancer" : var.alb_arn_suffix }, "stat" : "Average" }],
              [".", "RequestCount", { "dimensions" : { "LoadBalancer" : var.alb_arn_suffix }, "stat" : "Sum" }],
              [".", "HTTPCode_Target_2XX_Count", { "dimensions" : { "LoadBalancer" : var.alb_arn_suffix }, "stat" : "Sum" }],
              [".", "HTTPCode_Target_4XX_Count", { "dimensions" : { "LoadBalancer" : var.alb_arn_suffix }, "stat" : "Sum" }],
              [".", "HTTPCode_Target_5XX_Count", { "dimensions" : { "LoadBalancer" : var.alb_arn_suffix }, "stat" : "Sum" }]
            ]
            period = 300
            region = data.aws_region.current.name
            title  = "ALB Metrics"
          }
        }
      ]
    )
  })
}

# ==============================================================================
# CloudWatch Alarms - ECS Services
# ==============================================================================

# ECS CPU Utilization Alarms
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  for_each = toset(var.ecs_service_names)

  alarm_name          = "${var.project_name}-${var.environment}-ecs-${each.key}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.ecs_cpu_threshold
  alarm_description   = "ECS service ${each.key} CPU utilization is above ${var.ecs_cpu_threshold}%"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  ok_actions          = [aws_sns_topic.info_notifications.arn]

  dimensions = {
    ServiceName = each.key
    ClusterName = var.ecs_cluster_name
  }

  tags = var.tags
}

# ECS Memory Utilization Alarms
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  for_each = toset(var.ecs_service_names)

  alarm_name          = "${var.project_name}-${var.environment}-ecs-${each.key}-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.ecs_memory_threshold
  alarm_description   = "ECS service ${each.key} memory utilization is above ${var.ecs_memory_threshold}%"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  ok_actions          = [aws_sns_topic.info_notifications.arn]

  dimensions = {
    ServiceName = each.key
    ClusterName = var.ecs_cluster_name
  }

  tags = var.tags
}

# ==============================================================================
# CloudWatch Alarms - RDS Primary
# ==============================================================================

# RDS CPU Utilization
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-primary-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.rds_cpu_threshold
  alarm_description   = "RDS primary instance CPU utilization is above ${var.rds_cpu_threshold}%"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  ok_actions          = [aws_sns_topic.info_notifications.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  tags = var.tags
}

# RDS Free Storage Space
resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-primary-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.rds_free_storage_threshold * 1024 * 1024 * 1024 # Convert GB to bytes
  alarm_description   = "RDS primary instance free storage is below ${var.rds_free_storage_threshold}GB"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  ok_actions          = [aws_sns_topic.info_notifications.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  tags = var.tags
}

# RDS Database Connections
resource "aws_cloudwatch_metric_alarm" "rds_connections_high" {
  alarm_name          = "${var.project_name}-${var.environment}-rds-primary-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.rds_connection_threshold
  alarm_description   = "RDS primary instance connection count is above ${var.rds_connection_threshold}"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]
  ok_actions          = [aws_sns_topic.info_notifications.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  tags = var.tags
}

# ==============================================================================
# CloudWatch Alarms - RDS Read Replicas
# ==============================================================================

resource "aws_cloudwatch_metric_alarm" "rds_replica_lag" {
  count = length(var.rds_replica_ids)

  alarm_name          = "${var.project_name}-${var.environment}-rds-replica-${count.index + 1}-lag-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReplicaLag"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.rds_replica_lag_threshold
  alarm_description   = "RDS replica ${count.index + 1} lag is above ${var.rds_replica_lag_threshold} seconds"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]
  ok_actions          = [aws_sns_topic.info_notifications.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_replica_ids[count.index]
  }

  tags = var.tags
}

# ==============================================================================
# CloudWatch Alarms - Redis
# ==============================================================================

# Redis CPU Utilization
resource "aws_cloudwatch_metric_alarm" "redis_cpu_high" {
  alarm_name          = "${var.project_name}-${var.environment}-redis-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = var.redis_cpu_threshold
  alarm_description   = "Redis cluster CPU utilization is above ${var.redis_cpu_threshold}%"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]
  ok_actions          = [aws_sns_topic.info_notifications.arn]

  dimensions = {
    CacheClusterId = var.redis_cluster_id
  }

  tags = var.tags
}

# Redis Memory Usage
resource "aws_cloudwatch_metric_alarm" "redis_memory_high" {
  alarm_name          = "${var.project_name}-${var.environment}-redis-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = var.redis_memory_threshold
  alarm_description   = "Redis cluster memory usage is above ${var.redis_memory_threshold}%"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]
  ok_actions          = [aws_sns_topic.info_notifications.arn]

  dimensions = {
    CacheClusterId = var.redis_cluster_id
  }

  tags = var.tags
}

# Redis Evictions
resource "aws_cloudwatch_metric_alarm" "redis_evictions" {
  alarm_name          = "${var.project_name}-${var.environment}-redis-evictions-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Evictions"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.redis_evictions_threshold
  alarm_description   = "Redis cluster evictions are above ${var.redis_evictions_threshold}"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]
  ok_actions          = [aws_sns_topic.info_notifications.arn]

  dimensions = {
    CacheClusterId = var.redis_cluster_id
  }

  tags = var.tags
}

# ==============================================================================
# CloudWatch Alarms - ALB
# ==============================================================================

# ALB Target Response Time
resource "aws_cloudwatch_metric_alarm" "alb_response_time_high" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-response-time-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = var.alb_response_time_threshold
  alarm_description   = "ALB average response time is above ${var.alb_response_time_threshold} seconds"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]
  ok_actions          = [aws_sns_topic.info_notifications.arn]

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  tags = var.tags
}

# ALB 5XX Error Rate
resource "aws_cloudwatch_metric_alarm" "alb_5xx_high" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-5xx-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.alb_5xx_threshold
  alarm_description   = "ALB 5XX error count is above ${var.alb_5xx_threshold}"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  ok_actions          = [aws_sns_topic.info_notifications.arn]

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  tags = var.tags
}

# ALB Unhealthy Target Count
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_targets" {
  for_each = var.target_group_arn_suffixes

  alarm_name          = "${var.project_name}-${var.environment}-alb-${each.key}-unhealthy-targets"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = var.alb_unhealthy_target_threshold
  alarm_description   = "ALB target group ${each.key} has unhealthy targets"
  alarm_actions       = [aws_sns_topic.critical_alerts.arn]
  ok_actions          = [aws_sns_topic.info_notifications.arn]

  dimensions = {
    TargetGroup  = each.value
    LoadBalancer = var.alb_arn_suffix
  }

  tags = var.tags
}

# ==============================================================================
# Cost Monitoring - Billing Alarms
# ==============================================================================

resource "aws_cloudwatch_metric_alarm" "estimated_charges" {
  count = var.enable_billing_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-estimated-charges-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "EstimatedCharges"
  namespace           = "AWS/Billing"
  period              = "21600" # 6 hours
  statistic           = "Maximum"
  threshold           = var.billing_alarm_threshold
  alarm_description   = "Estimated AWS charges are above $${var.billing_alarm_threshold}"
  alarm_actions       = [aws_sns_topic.warning_alerts.arn]

  dimensions = {
    Currency = "USD"
  }

  tags = var.tags
}
