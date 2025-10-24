# ==============================================================================
# Application Load Balancer Module - Outputs
# ==============================================================================

# ==============================================================================
# ALB Outputs
# ==============================================================================

output "alb_id" {
  description = "ALB ID"
  value       = aws_lb.main.id
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_arn_suffix" {
  description = "ALB ARN suffix (for CloudWatch metrics)"
  value       = aws_lb.main.arn_suffix
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB hosted zone ID (for Route53 alias records)"
  value       = aws_lb.main.zone_id
}

# ==============================================================================
# Listener Outputs
# ==============================================================================

output "http_listener_arn" {
  description = "HTTP listener ARN"
  value       = aws_lb_listener.http.arn
}

output "https_listener_arn" {
  description = "HTTPS listener ARN (if enabled)"
  value       = var.enable_https ? aws_lb_listener.https[0].arn : null
}

# ==============================================================================
# Target Group Outputs
# ==============================================================================

output "target_group_arns" {
  description = "Map of service names to target group ARNs"
  value = {
    presentation       = aws_lb_target_group.presentation.arn
    client_tier        = aws_lb_target_group.client_tier.arn
    management_tier    = aws_lb_target_group.management_tier.arn
    uex_backend        = aws_lb_target_group.uex_backend.arn
    processing_tier    = aws_lb_target_group.processing_tier.arn
    management_backend = aws_lb_target_group.management_backend.arn
  }
}

output "target_group_arn_suffixes" {
  description = "Map of service names to target group ARN suffixes"
  value = {
    presentation       = aws_lb_target_group.presentation.arn_suffix
    client_tier        = aws_lb_target_group.client_tier.arn_suffix
    management_tier    = aws_lb_target_group.management_tier.arn_suffix
    uex_backend        = aws_lb_target_group.uex_backend.arn_suffix
    processing_tier    = aws_lb_target_group.processing_tier.arn_suffix
    management_backend = aws_lb_target_group.management_backend.arn_suffix
  }
}

output "target_group_names" {
  description = "Map of service names to target group names"
  value = {
    presentation       = aws_lb_target_group.presentation.name
    client_tier        = aws_lb_target_group.client_tier.name
    management_tier    = aws_lb_target_group.management_tier.name
    uex_backend        = aws_lb_target_group.uex_backend.name
    processing_tier    = aws_lb_target_group.processing_tier.name
    management_backend = aws_lb_target_group.management_backend.name
  }
}

# Individual target group ARNs for convenience
output "presentation_target_group_arn" {
  description = "Presentation service target group ARN"
  value       = aws_lb_target_group.presentation.arn
}

output "client_tier_target_group_arn" {
  description = "Client-tier service target group ARN"
  value       = aws_lb_target_group.client_tier.arn
}

output "management_tier_target_group_arn" {
  description = "Management-tier service target group ARN"
  value       = aws_lb_target_group.management_tier.arn
}

output "uex_backend_target_group_arn" {
  description = "UEX backend service target group ARN"
  value       = aws_lb_target_group.uex_backend.arn
}

output "processing_tier_target_group_arn" {
  description = "Processing-tier service target group ARN"
  value       = aws_lb_target_group.processing_tier.arn
}

output "management_backend_target_group_arn" {
  description = "Management backend service target group ARN"
  value       = aws_lb_target_group.management_backend.arn
}

# ==============================================================================
# Service Endpoints
# ==============================================================================

output "service_endpoints" {
  description = "Map of service names to full HTTPS URLs"
  value = var.enable_https ? {
    presentation       = "https://${aws_lb.main.dns_name}/presentation"
    client_tier        = "https://${aws_lb.main.dns_name}/client"
    management_tier    = "https://${aws_lb.main.dns_name}/management"
    uex_backend        = "https://${aws_lb.main.dns_name}/api/uex"
    processing_tier    = "https://${aws_lb.main.dns_name}/api/processing"
    management_backend = "https://${aws_lb.main.dns_name}/api/mgmt"
  } : {
    presentation       = "http://${aws_lb.main.dns_name}/presentation"
    client_tier        = "http://${aws_lb.main.dns_name}/client"
    management_tier    = "http://${aws_lb.main.dns_name}/management"
    uex_backend        = "http://${aws_lb.main.dns_name}/api/uex"
    processing_tier    = "http://${aws_lb.main.dns_name}/api/processing"
    management_backend = "http://${aws_lb.main.dns_name}/api/mgmt"
  }
}

output "health_check_urls" {
  description = "Map of service names to health check URLs"
  value = var.enable_https ? {
    presentation       = "https://${aws_lb.main.dns_name}/presentation/health"
    client_tier        = "https://${aws_lb.main.dns_name}/client/health"
    management_tier    = "https://${aws_lb.main.dns_name}/management/health"
    uex_backend        = "https://${aws_lb.main.dns_name}/api/uex/health"
    processing_tier    = "https://${aws_lb.main.dns_name}/api/processing/health"
    management_backend = "https://${aws_lb.main.dns_name}/api/mgmt/health"
  } : {
    presentation       = "http://${aws_lb.main.dns_name}/presentation/health"
    client_tier        = "http://${aws_lb.main.dns_name}/client/health"
    management_tier    = "http://${aws_lb.main.dns_name}/management/health"
    uex_backend        = "http://${aws_lb.main.dns_name}/api/uex/health"
    processing_tier    = "http://${aws_lb.main.dns_name}/api/processing/health"
    management_backend = "http://${aws_lb.main.dns_name}/api/mgmt/health"
  }
}

# ==============================================================================
# CloudWatch Alarms
# ==============================================================================

output "alarm_ids" {
  description = "Map of alarm types to alarm IDs"
  value = var.create_alarms ? {
    http_5xx      = aws_cloudwatch_metric_alarm.http_5xx[0].id
    http_4xx      = aws_cloudwatch_metric_alarm.http_4xx[0].id
    request_count = aws_cloudwatch_metric_alarm.request_count[0].id
  } : {}
}

output "unhealthy_target_alarm_ids" {
  description = "Map of service names to unhealthy target alarm IDs"
  value       = var.create_alarms ? { for k, v in aws_cloudwatch_metric_alarm.unhealthy_targets : k => v.id } : {}
}

output "response_time_alarm_ids" {
  description = "Map of service names to response time alarm IDs"
  value       = var.create_alarms ? { for k, v in aws_cloudwatch_metric_alarm.target_response_time : k => v.id } : {}
}

# ==============================================================================
# Configuration Summary
# ==============================================================================

output "configuration_summary" {
  description = "Summary of ALB configuration"
  value = {
    alb_dns_name               = aws_lb.main.dns_name
    internal                   = var.internal
    https_enabled              = var.enable_https
    deletion_protection        = var.enable_deletion_protection
    access_logs_enabled        = var.enable_access_logs
    sticky_sessions_enabled    = var.enable_sticky_sessions
    health_check_interval      = var.health_check_interval
    deregistration_delay       = var.deregistration_delay
    target_groups_count        = 6
    listener_rules_count       = var.enable_https ? 6 : 0
  }
}

# ==============================================================================
# Routing Configuration
# ==============================================================================

output "routing_rules" {
  description = "ALB routing rules summary"
  value = {
    "/presentation/*"     = "presentation:3900"
    "/client/*"           = "client-tier:3901"
    "/management/*"       = "management-tier:3902"
    "/api/uex/*"          = "uex-backend:3903"
    "/api/processing/*"   = "processing-tier:8900"
    "/api/mgmt/*"         = "management-backend:9000"
  }
}

# ==============================================================================
# Testing Commands
# ==============================================================================

output "test_commands" {
  description = "Commands to test ALB endpoints"
  value = {
    presentation       = "curl -i https://${aws_lb.main.dns_name}/presentation/health"
    client_tier        = "curl -i https://${aws_lb.main.dns_name}/client/health"
    management_tier    = "curl -i https://${aws_lb.main.dns_name}/management/health"
    uex_backend        = "curl -i https://${aws_lb.main.dns_name}/api/uex/health"
    processing_tier    = "curl -i https://${aws_lb.main.dns_name}/api/processing/health"
    management_backend = "curl -i https://${aws_lb.main.dns_name}/api/mgmt/health"
  }
}

# ==============================================================================
# AWS CLI Commands
# ==============================================================================

output "describe_alb_command" {
  description = "AWS CLI command to describe the ALB"
  value       = "aws elbv2 describe-load-balancers --load-balancer-arns ${aws_lb.main.arn}"
}

output "describe_target_health_command" {
  description = "AWS CLI commands to check target health for each service"
  value = {
    presentation       = "aws elbv2 describe-target-health --target-group-arn ${aws_lb_target_group.presentation.arn}"
    client_tier        = "aws elbv2 describe-target-health --target-group-arn ${aws_lb_target_group.client_tier.arn}"
    management_tier    = "aws elbv2 describe-target-health --target-group-arn ${aws_lb_target_group.management_tier.arn}"
    uex_backend        = "aws elbv2 describe-target-health --target-group-arn ${aws_lb_target_group.uex_backend.arn}"
    processing_tier    = "aws elbv2 describe-target-health --target-group-arn ${aws_lb_target_group.processing_tier.arn}"
    management_backend = "aws elbv2 describe-target-health --target-group-arn ${aws_lb_target_group.management_backend.arn}"
  }
}
