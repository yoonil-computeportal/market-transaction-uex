# ============================================================================
# UEX Payment Processing System - Terraform Outputs
# ============================================================================

# ============================================================================
# VPC Outputs
# ============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids_app" {
  description = "IDs of private app subnets"
  value       = module.vpc.private_subnet_ids_app
}

output "private_subnet_ids_data" {
  description = "IDs of private data subnets"
  value       = module.vpc.private_subnet_ids_data
}

output "nat_gateway_ips" {
  description = "Elastic IPs of NAT gateways"
  value       = module.vpc.nat_gateway_ips
}

# ============================================================================
# RDS Outputs
# ============================================================================

output "rds_instance_id" {
  description = "RDS instance identifier"
  value       = module.rds.db_instance_id
}

output "rds_endpoint" {
  description = "RDS primary endpoint"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS port"
  value       = module.rds.db_instance_port
}

output "rds_database_name" {
  description = "Name of the default database"
  value       = module.rds.db_database_name
}

output "rds_read_replica_endpoints" {
  description = "RDS read replica endpoints"
  value       = module.rds.read_replica_endpoints
  sensitive   = true
}

output "rds_connection_string" {
  description = "PostgreSQL connection string (use with Secrets Manager)"
  value       = "postgresql://${var.db_master_username}:[PASSWORD]@${module.rds.db_instance_endpoint}/${module.rds.db_database_name}"
  sensitive   = true
}

# ============================================================================
# Redis Outputs
# ============================================================================

output "redis_cluster_id" {
  description = "Redis cluster identifier"
  value       = module.redis.cluster_id
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = module.redis.cluster_endpoint
  sensitive   = true
}

output "redis_port" {
  description = "Redis port"
  value       = module.redis.cluster_port
}

output "redis_reader_endpoint" {
  description = "Redis reader endpoint (if cluster mode enabled)"
  value       = module.redis.reader_endpoint
  sensitive   = true
}

# ============================================================================
# ECS Outputs
# ============================================================================

output "ecs_cluster_id" {
  description = "ECS cluster ID"
  value       = module.ecs.cluster_id
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = module.ecs.cluster_arn
}

output "ecs_service_names" {
  description = "ECS service names"
  value       = module.ecs.service_names
}

output "ecs_service_arns" {
  description = "ECS service ARNs"
  value       = module.ecs.service_arns
}

output "ecs_task_execution_role_arn" {
  description = "ECS task execution role ARN"
  value       = module.ecs.task_execution_role_arn
}

output "ecs_task_role_arn" {
  description = "ECS task role ARN"
  value       = module.ecs.task_role_arn
}

# ============================================================================
# ALB Outputs
# ============================================================================

output "alb_id" {
  description = "ALB ID"
  value       = module.alb.alb_id
}

output "alb_arn" {
  description = "ALB ARN"
  value       = module.alb.alb_arn
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "ALB zone ID"
  value       = module.alb.alb_zone_id
}

output "alb_url" {
  description = "ALB URL (HTTPS)"
  value       = "https://${module.alb.alb_dns_name}"
}

output "alb_http_url" {
  description = "ALB URL (HTTP - redirects to HTTPS)"
  value       = "http://${module.alb.alb_dns_name}"
}

output "alb_target_group_arns" {
  description = "ALB target group ARNs"
  value       = module.alb.target_group_arns
}

# ============================================================================
# ECR Outputs
# ============================================================================

output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value       = module.ecr.repository_urls
}

output "ecr_repository_arns" {
  description = "ECR repository ARNs"
  value       = module.ecr.repository_arns
}

# ============================================================================
# Secrets Manager Outputs
# ============================================================================

output "secrets_manager_app_secrets_arn" {
  description = "ARN of the application secrets in Secrets Manager"
  value       = module.secrets.app_secrets_arn
  sensitive   = true
}

output "secrets_manager_app_secrets_name" {
  description = "Name of the application secrets in Secrets Manager"
  value       = module.secrets.app_secrets_name
}

output "secrets_manager_db_secrets_arn" {
  description = "ARN of the database secrets in Secrets Manager"
  value       = module.secrets.db_secrets_arn
  sensitive   = true
}

output "secrets_manager_uex_secrets_arn" {
  description = "ARN of the UEX secrets in Secrets Manager"
  value       = module.secrets.uex_secrets_arn
  sensitive   = true
}

# ============================================================================
# KMS Outputs
# ============================================================================

output "kms_key_id" {
  description = "KMS key ID"
  value       = module.kms.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = module.kms.key_arn
}

output "kms_key_alias" {
  description = "KMS key alias"
  value       = module.kms.key_alias
}

# ============================================================================
# S3 Outputs
# ============================================================================

output "s3_backup_bucket_name" {
  description = "S3 backup bucket name"
  value       = module.s3.bucket_names["backups"]
}

output "s3_backup_bucket_arn" {
  description = "S3 backup bucket ARN"
  value       = module.s3.bucket_arns["backups"]
}

output "s3_logs_bucket_name" {
  description = "S3 logs bucket name"
  value       = module.s3.bucket_names["logs"]
}

output "s3_logs_bucket_arn" {
  description = "S3 logs bucket ARN"
  value       = module.s3.bucket_arns["logs"]
}

# ============================================================================
# CloudWatch Monitoring Outputs
# ============================================================================

output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = module.monitoring.dashboard_name
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = module.monitoring.dashboard_url
}

output "cloudwatch_log_group_names" {
  description = "CloudWatch log group names"
  value       = module.monitoring.log_group_names
}

output "sns_critical_topic_arn" {
  description = "SNS topic ARN for critical alerts"
  value       = module.monitoring.critical_topic_arn
}

output "sns_warning_topic_arn" {
  description = "SNS topic ARN for warning alerts"
  value       = module.monitoring.warning_topic_arn
}

# ============================================================================
# Route53 Outputs (if enabled)
# ============================================================================

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = var.create_route53_records ? module.route53[0].zone_id : null
}

output "route53_zone_name" {
  description = "Route53 hosted zone name"
  value       = var.create_route53_records ? module.route53[0].zone_name : null
}

output "route53_name_servers" {
  description = "Route53 name servers"
  value       = var.create_route53_records ? module.route53[0].name_servers : null
}

output "application_url" {
  description = "Application URL (custom domain if Route53 enabled, otherwise ALB DNS)"
  value       = var.create_route53_records ? "https://${var.subdomain_prefix != "" ? "${var.subdomain_prefix}." : ""}${var.domain_name}" : "https://${module.alb.alb_dns_name}"
}

# ============================================================================
# Service Endpoints
# ============================================================================

output "service_endpoints" {
  description = "Service endpoints for each microservice"
  value = {
    presentation        = "https://${module.alb.alb_dns_name}/presentation"
    client_tier         = "https://${module.alb.alb_dns_name}/client"
    management_tier     = "https://${module.alb.alb_dns_name}/management"
    uex_backend         = "https://${module.alb.alb_dns_name}/api/uex"
    processing_tier     = "https://${module.alb.alb_dns_name}/api/processing"
    management_backend  = "https://${module.alb.alb_dns_name}/api/mgmt"
  }
}

# ============================================================================
# Deployment Information
# ============================================================================

output "deployment_info" {
  description = "Deployment information"
  value = {
    environment         = var.environment
    region              = var.aws_region
    availability_zones  = var.availability_zones
    deployed_by         = data.aws_caller_identity.current.arn
    deployment_time     = timestamp()
  }
}

# ============================================================================
# Quick Start Commands
# ============================================================================

output "quick_start_commands" {
  description = "Quick start commands for working with this infrastructure"
  value = <<-EOT
    # Connect to RDS (requires bastion host or VPN)
    psql -h ${module.rds.db_instance_endpoint} -U ${var.db_master_username} -d ${module.rds.db_database_name}

    # View ECS service status
    aws ecs describe-services --cluster ${module.ecs.cluster_name} --services ${join(" ", module.ecs.service_names)} --region ${var.aws_region}

    # View CloudWatch logs
    aws logs tail /aws/ecs/${module.ecs.cluster_name} --follow --region ${var.aws_region}

    # Get secrets from Secrets Manager
    aws secretsmanager get-secret-value --secret-id ${module.secrets.app_secrets_name} --region ${var.aws_region}

    # Force new ECS deployment
    aws ecs update-service --cluster ${module.ecs.cluster_name} --service uex-backend --force-new-deployment --region ${var.aws_region}

    # View ALB target health
    aws elbv2 describe-target-health --target-group-arn <target-group-arn> --region ${var.aws_region}

    # Access CloudWatch Dashboard
    ${module.monitoring.dashboard_url}
  EOT
}

# ============================================================================
# Cost Estimation
# ============================================================================

output "estimated_monthly_cost" {
  description = "Estimated monthly cost (USD)"
  value = {
    environment = var.environment
    estimate    = var.environment == "prod" ? "$1,200" : var.environment == "staging" ? "$400" : "$150"
    note        = "Actual costs may vary based on usage"
  }
}

# ============================================================================
# Security Information
# ============================================================================

output "security_groups" {
  description = "Security group IDs"
  value = {
    alb_security_group_id   = module.security.alb_security_group_id
    ecs_security_group_id   = module.security.ecs_security_group_id
    rds_security_group_id   = module.security.rds_security_group_id
    redis_security_group_id = module.security.redis_security_group_id
  }
}

# ============================================================================
# Backup Information
# ============================================================================

output "backup_info" {
  description = "Backup configuration information"
  value = {
    rds_backup_retention_days = var.db_backup_retention_period
    rds_backup_window         = var.db_backup_window
    redis_snapshot_retention  = var.redis_snapshot_retention_limit
    s3_backup_bucket          = module.s3.bucket_names["backups"]
  }
}
