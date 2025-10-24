# ==============================================================================
# ECS Module - Outputs
# ==============================================================================

# ==============================================================================
# Cluster Outputs
# ==============================================================================

output "cluster_id" {
  description = "ECS cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

# ==============================================================================
# Service Outputs
# ==============================================================================

output "service_ids" {
  description = "Map of service names to service IDs"
  value       = { for k, v in aws_ecs_service.services : k => v.id }
}

output "service_names" {
  description = "Map of service names to full service names"
  value       = { for k, v in aws_ecs_service.services : k => v.name }
}

output "service_arns" {
  description = "Map of service names to service ARNs"
  value       = { for k, v in aws_ecs_service.services : k => v.arn }
}

output "service_desired_counts" {
  description = "Map of service names to desired counts"
  value       = { for k, v in aws_ecs_service.services : k => v.desired_count }
}

# ==============================================================================
# Task Definition Outputs
# ==============================================================================

output "task_definition_arns" {
  description = "Map of service names to task definition ARNs"
  value       = { for k, v in aws_ecs_task_definition.services : k => v.arn }
}

output "task_definition_families" {
  description = "Map of service names to task definition families"
  value       = { for k, v in aws_ecs_task_definition.services : k => v.family }
}

output "task_definition_revisions" {
  description = "Map of service names to task definition revisions"
  value       = { for k, v in aws_ecs_task_definition.services : k => v.revision }
}

# ==============================================================================
# IAM Role Outputs
# ==============================================================================

output "task_execution_role_arn" {
  description = "ARN of the task execution IAM role"
  value       = aws_iam_role.task_execution_role.arn
}

output "task_execution_role_name" {
  description = "Name of the task execution IAM role"
  value       = aws_iam_role.task_execution_role.name
}

output "task_role_arn" {
  description = "ARN of the task IAM role"
  value       = aws_iam_role.task_role.arn
}

output "task_role_name" {
  description = "Name of the task IAM role"
  value       = aws_iam_role.task_role.name
}

# ==============================================================================
# CloudWatch Log Groups
# ==============================================================================

output "log_group_names" {
  description = "Map of service names to CloudWatch log group names"
  value       = { for k, v in aws_cloudwatch_log_group.services : k => v.name }
}

output "log_group_arns" {
  description = "Map of service names to CloudWatch log group ARNs"
  value       = { for k, v in aws_cloudwatch_log_group.services : k => v.arn }
}

# ==============================================================================
# Auto Scaling Outputs
# ==============================================================================

output "autoscaling_target_ids" {
  description = "Map of service names to autoscaling target resource IDs"
  value       = var.enable_autoscaling ? { for k, v in aws_appautoscaling_target.services : k => v.id } : {}
}

output "autoscaling_cpu_policy_arns" {
  description = "Map of service names to CPU autoscaling policy ARNs"
  value       = var.enable_autoscaling ? { for k, v in aws_appautoscaling_policy.cpu : k => v.arn } : {}
}

output "autoscaling_memory_policy_arns" {
  description = "Map of service names to memory autoscaling policy ARNs"
  value       = var.enable_autoscaling ? { for k, v in aws_appautoscaling_policy.memory : k => v.arn } : {}
}

# ==============================================================================
# Configuration Summary
# ==============================================================================

output "configuration_summary" {
  description = "Summary of ECS configuration"
  value = {
    cluster_name           = aws_ecs_cluster.main.name
    service_count          = length(aws_ecs_service.services)
    container_insights     = var.enable_container_insights
    execute_command        = var.enable_execute_command
    autoscaling_enabled    = var.enable_autoscaling
    log_retention_days     = var.log_retention_days
    image_tag              = var.image_tag
  }
}

# ==============================================================================
# Service Details
# ==============================================================================

output "service_details" {
  description = "Detailed information about each service"
  value = {
    for k, v in local.services : k => {
      name           = aws_ecs_service.services[k].name
      port           = v.port
      cpu            = v.cpu
      memory         = v.memory
      desired_count  = aws_ecs_service.services[k].desired_count
      min_capacity   = var.enable_autoscaling ? lookup(var.service_min_capacity, k, 2) : null
      max_capacity   = var.enable_autoscaling ? lookup(var.service_max_capacity, k, 10) : null
      task_definition = aws_ecs_task_definition.services[k].arn
      log_group      = aws_cloudwatch_log_group.services[k].name
    }
  }
}

# ==============================================================================
# AWS CLI Commands
# ==============================================================================

output "update_service_commands" {
  description = "AWS CLI commands to update each service with new task definition"
  value = { for k, v in aws_ecs_service.services : k =>
    "aws ecs update-service --cluster ${aws_ecs_cluster.main.name} --service ${v.name} --force-new-deployment"
  }
}

output "stop_task_commands" {
  description = "AWS CLI commands to stop running tasks for each service"
  value = { for k, v in aws_ecs_service.services : k =>
    "aws ecs list-tasks --cluster ${aws_ecs_cluster.main.name} --service-name ${v.name} --query 'taskArns[0]' --output text | xargs -I {} aws ecs stop-task --cluster ${aws_ecs_cluster.main.name} --task {}"
  }
}

output "scale_service_commands" {
  description = "AWS CLI commands to scale each service"
  value = { for k, v in aws_ecs_service.services : k =>
    "aws ecs update-service --cluster ${aws_ecs_cluster.main.name} --service ${v.name} --desired-count <COUNT>"
  }
}

output "describe_service_commands" {
  description = "AWS CLI commands to describe each service"
  value = { for k, v in aws_ecs_service.services : k =>
    "aws ecs describe-services --cluster ${aws_ecs_cluster.main.name} --services ${v.name}"
  }
}

output "view_logs_commands" {
  description = "AWS CLI commands to view logs for each service"
  value = { for k, v in aws_cloudwatch_log_group.services : k =>
    "aws logs tail ${v.name} --follow"
  }
}

output "exec_commands" {
  description = "AWS CLI commands to execute commands in running containers"
  value = { for k, v in aws_ecs_service.services : k =>
    "aws ecs execute-command --cluster ${aws_ecs_cluster.main.name} --task <TASK_ARN> --container ${k} --interactive --command '/bin/sh'"
  }
}

# ==============================================================================
# Deployment Information
# ==============================================================================

output "deployment_info" {
  description = "Information needed for CI/CD deployments"
  value = {
    cluster_name            = aws_ecs_cluster.main.name
    task_execution_role_arn = aws_iam_role.task_execution_role.arn
    task_role_arn          = aws_iam_role.task_role.arn
    services = { for k, v in aws_ecs_service.services : k => {
      name                = v.name
      task_definition     = aws_ecs_task_definition.services[k].family
      container_name      = k
      log_group          = aws_cloudwatch_log_group.services[k].name
    }}
  }
}

# ==============================================================================
# Monitoring URLs (for documentation)
# ==============================================================================

output "cloudwatch_dashboard_url" {
  description = "URL to CloudWatch dashboard for ECS cluster"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${var.project_name}-${var.environment}-ecs"
}

output "ecs_console_url" {
  description = "URL to ECS console for the cluster"
  value       = "https://console.aws.amazon.com/ecs/home?region=${data.aws_region.current.name}#/clusters/${aws_ecs_cluster.main.name}/services"
}

# ==============================================================================
# Container Insights Query
# ==============================================================================

output "container_insights_query" {
  description = "CloudWatch Insights query to analyze container metrics"
  value = var.enable_container_insights ? <<-EOT
    fields @timestamp, @message
    | filter ServiceName in [${join(", ", [for k in keys(aws_ecs_service.services) : "\"${aws_ecs_service.services[k].name}\""])}]
    | sort @timestamp desc
    | limit 100
  EOT : "Container Insights not enabled"
}
