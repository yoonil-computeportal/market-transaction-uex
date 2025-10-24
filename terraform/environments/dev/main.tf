# ==============================================================================
# Development Environment Configuration
# ==============================================================================
#
# This configuration deploys the UEX Payment Processing System to the
# development environment with cost-optimized settings.
#
# Estimated Monthly Cost: ~$150-200
#
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  backend "s3" {
    bucket         = "uex-payments-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "uex-payments-terraform-locks"
    encrypt        = true
  }
}

# ==============================================================================
# Provider Configuration
# ==============================================================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "UEX-Payment-Processing"
      Environment = "dev"
      ManagedBy   = "Terraform"
      Owner       = var.owner
      CostCenter  = var.cost_center
    }
  }
}

# ==============================================================================
# Root Module Reference
# ==============================================================================

module "uex_payments" {
  source = "../../"

  # General Configuration
  project_name = var.project_name
  environment  = "dev"
  aws_region   = var.aws_region
  owner        = var.owner
  cost_center  = var.cost_center

  # VPC Configuration
  vpc_cidr                 = var.vpc_cidr
  availability_zones       = var.availability_zones
  public_subnet_cidrs      = var.public_subnet_cidrs
  private_subnet_cidrs_app = var.private_subnet_cidrs_app
  private_subnet_cidrs_data = var.private_subnet_cidrs_data
  enable_nat_gateway       = true
  enable_vpn_gateway       = false
  allowed_cidr_blocks      = var.allowed_cidr_blocks

  # RDS Configuration - Dev Settings
  db_engine_version          = "15.4"
  db_instance_class          = "db.t3.medium"
  db_allocated_storage       = 50
  db_max_allocated_storage   = 200
  db_master_username         = "admin"
  db_master_password         = var.db_master_password
  db_database_name           = "uex_payments_dev"
  db_multi_az                = false
  db_create_read_replica     = false
  db_read_replica_count      = 0
  db_backup_retention_period = 7
  db_backup_window           = "03:00-04:00"
  db_maintenance_window      = "sun:04:00-sun:05:00"
  db_monitoring_interval     = 60
  db_performance_insights_enabled = true

  # Redis Configuration - Dev Settings
  redis_node_type              = "cache.t3.micro"
  redis_num_cache_nodes        = 1
  redis_engine_version         = "7.0"
  redis_port                   = 6379
  redis_auth_token_enabled     = true
  redis_automatic_failover_enabled = false
  redis_multi_az_enabled       = false
  redis_snapshot_retention_limit = 3
  redis_snapshot_window        = "02:00-03:00"
  redis_maintenance_window     = "sun:05:00-sun:06:00"

  # ECS Configuration - Dev Settings
  ecs_enable_container_insights = true
  ecs_log_retention_in_days     = 7
  ecs_cpu_target_value          = 70
  ecs_memory_target_value       = 75

  # Presentation Service
  ecs_presentation_cpu           = 512
  ecs_presentation_memory        = 1024
  ecs_presentation_desired_count = 1
  ecs_presentation_min_capacity  = 1
  ecs_presentation_max_capacity  = 3
  presentation_image_tag         = var.presentation_image_tag
  presentation_env_vars          = var.presentation_env_vars

  # Client Tier Service
  ecs_client_tier_cpu           = 512
  ecs_client_tier_memory        = 1024
  ecs_client_tier_desired_count = 1
  ecs_client_tier_min_capacity  = 1
  ecs_client_tier_max_capacity  = 3
  client_tier_image_tag         = var.client_tier_image_tag
  client_tier_env_vars          = var.client_tier_env_vars

  # Management Tier Service
  ecs_management_tier_cpu           = 512
  ecs_management_tier_memory        = 1024
  ecs_management_tier_desired_count = 1
  ecs_management_tier_min_capacity  = 1
  ecs_management_tier_max_capacity  = 3
  management_tier_image_tag         = var.management_tier_image_tag
  management_tier_env_vars          = var.management_tier_env_vars

  # UEX Backend Service
  ecs_uex_backend_cpu           = 1024
  ecs_uex_backend_memory        = 2048
  ecs_uex_backend_desired_count = 1
  ecs_uex_backend_min_capacity  = 1
  ecs_uex_backend_max_capacity  = 5
  uex_backend_image_tag         = var.uex_backend_image_tag
  uex_backend_env_vars          = var.uex_backend_env_vars

  # Processing Tier Service
  ecs_processing_tier_cpu           = 1024
  ecs_processing_tier_memory        = 2048
  ecs_processing_tier_desired_count = 1
  ecs_processing_tier_min_capacity  = 1
  ecs_processing_tier_max_capacity  = 3
  processing_tier_image_tag         = var.processing_tier_image_tag
  processing_tier_env_vars          = var.processing_tier_env_vars

  # Management Backend Service
  ecs_management_backend_cpu           = 512
  ecs_management_backend_memory        = 1024
  ecs_management_backend_desired_count = 1
  ecs_management_backend_min_capacity  = 1
  ecs_management_backend_max_capacity  = 3
  management_backend_image_tag         = var.management_backend_image_tag
  management_backend_env_vars          = var.management_backend_env_vars

  # ALB Configuration
  acm_certificate_arn    = var.acm_certificate_arn
  alb_ssl_policy         = "ELBSecurityPolicy-TLS-1-2-2017-01"
  alb_enable_access_logs = false
  alb_log_bucket_name    = ""

  # ECR Configuration
  ecr_max_image_count = 5

  # UEX API Configuration
  uex_referral_code     = var.uex_referral_code
  uex_client_id         = var.uex_client_id
  uex_secret_key        = var.uex_secret_key
  uex_swap_base_url     = var.uex_swap_base_url
  uex_merchant_base_url = var.uex_merchant_base_url

  # KMS Configuration
  kms_key_administrators = var.kms_key_administrators
  kms_key_users          = var.kms_key_users

  # Monitoring Configuration
  alert_email_addresses      = var.alert_email_addresses
  critical_alarm_actions     = []
  warning_alarm_actions      = []
  alarm_ecs_cpu_threshold    = 85
  alarm_ecs_memory_threshold = 90
  alarm_rds_cpu_threshold    = 85
  alarm_rds_storage_threshold      = 10
  alarm_rds_connection_threshold   = 80
  alarm_alb_5xx_threshold          = 100
  alarm_alb_response_time_threshold = 3

  # Route53 Configuration
  create_route53_records = var.create_route53_records
  domain_name            = var.domain_name
  subdomain_prefix       = "dev"

  tags = var.tags
}

# ==============================================================================
# Outputs
# ==============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.uex_payments.vpc_id
}

output "alb_url" {
  description = "Application Load Balancer URL"
  value       = module.uex_payments.alb_url
}

output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value       = module.uex_payments.ecr_repository_urls
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.uex_payments.ecs_cluster_name
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = module.uex_payments.cloudwatch_dashboard_url
}

output "application_url" {
  description = "Application URL"
  value       = module.uex_payments.application_url
}
