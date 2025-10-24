# ============================================================================
# UEX Payment Processing System - Main Terraform Configuration
# ============================================================================

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
}

# ============================================================================
# Provider Configuration
# ============================================================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "UEX-Payment-Processing"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = var.owner
      CostCenter  = var.cost_center
    }
  }
}

# ============================================================================
# Data Sources
# ============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# ============================================================================
# Random Resources for Unique Naming
# ============================================================================

resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# ============================================================================
# VPC and Networking Module
# ============================================================================

module "vpc" {
  source = "./modules/vpc"

  project_name        = var.project_name
  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  availability_zones  = var.availability_zones
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs_app = var.private_subnet_cidrs_app
  private_subnet_cidrs_data = var.private_subnet_cidrs_data

  enable_nat_gateway = var.enable_nat_gateway
  enable_vpn_gateway = var.enable_vpn_gateway
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = var.tags
}

# ============================================================================
# Security Module (Security Groups, WAF, etc.)
# ============================================================================

module "security" {
  source = "./modules/security"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id

  # CIDR blocks for access control
  allowed_cidr_blocks = var.allowed_cidr_blocks

  tags = var.tags
}

# ============================================================================
# Secrets Manager Module
# ============================================================================

module "secrets" {
  source = "./modules/secrets"

  project_name = var.project_name
  environment  = var.environment

  # Database credentials
  db_master_username = var.db_master_username
  db_master_password = var.db_master_password

  # UEX API credentials
  uex_referral_code = var.uex_referral_code
  uex_client_id     = var.uex_client_id
  uex_secret_key    = var.uex_secret_key
  uex_swap_base_url = var.uex_swap_base_url
  uex_merchant_base_url = var.uex_merchant_base_url

  # Encryption key
  kms_key_id = module.kms.key_id

  tags = var.tags
}

# ============================================================================
# KMS Module for Encryption
# ============================================================================

module "kms" {
  source = "./modules/kms"

  project_name = var.project_name
  environment  = var.environment

  key_administrators = var.kms_key_administrators
  key_users          = var.kms_key_users

  tags = var.tags
}

# ============================================================================
# RDS PostgreSQL Module
# ============================================================================

module "rds" {
  source = "./modules/rds"

  project_name = var.project_name
  environment  = var.environment

  # Database configuration
  engine_version          = var.db_engine_version
  instance_class          = var.db_instance_class
  allocated_storage       = var.db_allocated_storage
  max_allocated_storage   = var.db_max_allocated_storage
  storage_encrypted       = true
  kms_key_id              = module.kms.key_arn

  # Database credentials
  master_username = var.db_master_username
  database_name   = var.db_database_name

  # Networking
  vpc_id                  = module.vpc.vpc_id
  db_subnet_group_name    = module.vpc.database_subnet_group_name
  vpc_security_group_ids  = [module.security.rds_security_group_id]

  # High Availability
  multi_az               = var.db_multi_az
  create_read_replica    = var.db_create_read_replica
  read_replica_count     = var.db_read_replica_count

  # Backup configuration
  backup_retention_period = var.db_backup_retention_period
  backup_window           = var.db_backup_window
  maintenance_window      = var.db_maintenance_window

  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  monitoring_interval             = var.db_monitoring_interval

  # Performance Insights
  performance_insights_enabled = var.db_performance_insights_enabled
  performance_insights_kms_key_id = module.kms.key_id

  tags = var.tags

  depends_on = [module.secrets]
}

# ============================================================================
# ElastiCache Redis Module
# ============================================================================

module "redis" {
  source = "./modules/redis"

  project_name = var.project_name
  environment  = var.environment

  # Redis configuration
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_cache_nodes
  engine_version       = var.redis_engine_version
  port                 = var.redis_port

  # Security
  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.private_subnet_ids_data
  security_group_ids      = [module.security.redis_security_group_id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token_enabled         = var.redis_auth_token_enabled
  kms_key_id              = module.kms.key_arn

  # High Availability
  automatic_failover_enabled = var.redis_automatic_failover_enabled
  multi_az_enabled           = var.redis_multi_az_enabled

  # Maintenance
  snapshot_retention_limit = var.redis_snapshot_retention_limit
  snapshot_window          = var.redis_snapshot_window
  maintenance_window       = var.redis_maintenance_window

  tags = var.tags
}

# ============================================================================
# ECR Repositories Module
# ============================================================================

module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
  environment  = var.environment

  # Repository configuration
  repositories = [
    "presentation",
    "client-tier",
    "management-tier",
    "uex-backend",
    "processing-tier",
    "management-backend"
  ]

  # Image retention
  image_tag_mutability = "MUTABLE"
  scan_on_push         = true

  # Lifecycle policy
  max_image_count = var.ecr_max_image_count

  tags = var.tags
}

# ============================================================================
# Application Load Balancer Module
# ============================================================================

module "alb" {
  source = "./modules/alb"

  project_name = var.project_name
  environment  = var.environment

  # Load Balancer configuration
  vpc_id          = module.vpc.vpc_id
  subnets         = module.vpc.public_subnet_ids
  security_groups = [module.security.alb_security_group_id]

  # SSL/TLS configuration
  certificate_arn = var.acm_certificate_arn
  ssl_policy      = var.alb_ssl_policy

  # Logging
  enable_access_logs = var.alb_enable_access_logs
  log_bucket_name    = var.alb_log_bucket_name

  # Target groups for each service
  target_groups = {
    presentation = {
      port              = 3900
      health_check_path = "/health"
    }
    client-tier = {
      port              = 3901
      health_check_path = "/health"
    }
    management-tier = {
      port              = 3902
      health_check_path = "/health"
    }
    uex-backend = {
      port              = 3903
      health_check_path = "/api/uex/health"
    }
    processing-tier = {
      port              = 8900
      health_check_path = "/health"
    }
    management-backend = {
      port              = 9000
      health_check_path = "/health"
    }
  }

  tags = var.tags
}

# ============================================================================
# ECS Cluster and Services Module
# ============================================================================

module "ecs" {
  source = "./modules/ecs"

  project_name = var.project_name
  environment  = var.environment

  # ECS Cluster configuration
  cluster_name = "${var.project_name}-${var.environment}"

  # Container Insights
  enable_container_insights = var.ecs_enable_container_insights

  # VPC configuration
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids_app
  security_group_ids  = [module.security.ecs_security_group_id]

  # ALB configuration
  alb_target_group_arns = module.alb.target_group_arns

  # Service definitions
  services = {
    presentation = {
      cpu                    = var.ecs_presentation_cpu
      memory                 = var.ecs_presentation_memory
      desired_count          = var.ecs_presentation_desired_count
      min_capacity           = var.ecs_presentation_min_capacity
      max_capacity           = var.ecs_presentation_max_capacity
      container_port         = 3900
      health_check_path      = "/health"
      image_tag              = var.presentation_image_tag
      environment_variables  = var.presentation_env_vars
    }

    client-tier = {
      cpu                    = var.ecs_client_tier_cpu
      memory                 = var.ecs_client_tier_memory
      desired_count          = var.ecs_client_tier_desired_count
      min_capacity           = var.ecs_client_tier_min_capacity
      max_capacity           = var.ecs_client_tier_max_capacity
      container_port         = 3901
      health_check_path      = "/health"
      image_tag              = var.client_tier_image_tag
      environment_variables  = var.client_tier_env_vars
    }

    management-tier = {
      cpu                    = var.ecs_management_tier_cpu
      memory                 = var.ecs_management_tier_memory
      desired_count          = var.ecs_management_tier_desired_count
      min_capacity           = var.ecs_management_tier_min_capacity
      max_capacity           = var.ecs_management_tier_max_capacity
      container_port         = 3902
      health_check_path      = "/health"
      image_tag              = var.management_tier_image_tag
      environment_variables  = var.management_tier_env_vars
    }

    uex-backend = {
      cpu                    = var.ecs_uex_backend_cpu
      memory                 = var.ecs_uex_backend_memory
      desired_count          = var.ecs_uex_backend_desired_count
      min_capacity           = var.ecs_uex_backend_min_capacity
      max_capacity           = var.ecs_uex_backend_max_capacity
      container_port         = 3903
      health_check_path      = "/api/uex/health"
      image_tag              = var.uex_backend_image_tag
      environment_variables  = var.uex_backend_env_vars
    }

    processing-tier = {
      cpu                    = var.ecs_processing_tier_cpu
      memory                 = var.ecs_processing_tier_memory
      desired_count          = var.ecs_processing_tier_desired_count
      min_capacity           = var.ecs_processing_tier_min_capacity
      max_capacity           = var.ecs_processing_tier_max_capacity
      container_port         = 8900
      health_check_path      = "/health"
      image_tag              = var.processing_tier_image_tag
      environment_variables  = var.processing_tier_env_vars
    }

    management-backend = {
      cpu                    = var.ecs_management_backend_cpu
      memory                 = var.ecs_management_backend_memory
      desired_count          = var.ecs_management_backend_desired_count
      min_capacity           = var.ecs_management_backend_min_capacity
      max_capacity           = var.ecs_management_backend_max_capacity
      container_port         = 9000
      health_check_path      = "/health"
      image_tag              = var.management_backend_image_tag
      environment_variables  = var.management_backend_env_vars
    }
  }

  # Shared environment variables (from Secrets Manager)
  shared_secrets = {
    DATABASE_URL        = module.secrets.database_connection_string_arn
    REDIS_URL           = module.secrets.redis_connection_string_arn
    UEX_REFERRAL_CODE   = module.secrets.uex_referral_code_arn
    UEX_CLIENT_ID       = module.secrets.uex_client_id_arn
    UEX_SECRET_KEY      = module.secrets.uex_secret_key_arn
    UEX_SWAP_BASE_URL   = module.secrets.uex_swap_base_url_arn
    UEX_MERCHANT_BASE_URL = module.secrets.uex_merchant_base_url_arn
  }

  # Auto-scaling configuration
  cpu_target_value    = var.ecs_cpu_target_value
  memory_target_value = var.ecs_memory_target_value

  # Deployment configuration
  deployment_maximum_percent         = var.ecs_deployment_maximum_percent
  deployment_minimum_healthy_percent = var.ecs_deployment_minimum_healthy_percent

  # CloudWatch Logs
  log_retention_in_days = var.ecs_log_retention_in_days

  tags = var.tags

  depends_on = [
    module.rds,
    module.redis,
    module.alb
  ]
}

# ============================================================================
# CloudWatch Monitoring Module
# ============================================================================

module "monitoring" {
  source = "./modules/monitoring"

  project_name = var.project_name
  environment  = var.environment

  # ECS monitoring
  ecs_cluster_name = module.ecs.cluster_name
  ecs_service_names = module.ecs.service_names

  # RDS monitoring
  rds_instance_id = module.rds.db_instance_id
  rds_replica_ids = module.rds.read_replica_ids

  # Redis monitoring
  redis_cluster_id = module.redis.cluster_id

  # ALB monitoring
  alb_arn_suffix = module.alb.alb_arn_suffix
  target_group_arn_suffixes = module.alb.target_group_arn_suffixes

  # SNS notification
  alert_email_addresses = var.alert_email_addresses
  critical_alarm_actions = var.critical_alarm_actions
  warning_alarm_actions  = var.warning_alarm_actions

  # Alarm thresholds
  ecs_cpu_threshold           = var.alarm_ecs_cpu_threshold
  ecs_memory_threshold        = var.alarm_ecs_memory_threshold
  rds_cpu_threshold           = var.alarm_rds_cpu_threshold
  rds_storage_threshold       = var.alarm_rds_storage_threshold
  rds_connection_threshold    = var.alarm_rds_connection_threshold
  alb_5xx_threshold           = var.alarm_alb_5xx_threshold
  alb_response_time_threshold = var.alarm_alb_response_time_threshold

  tags = var.tags
}

# ============================================================================
# S3 Buckets Module (for backups, logs, etc.)
# ============================================================================

module "s3" {
  source = "./modules/s3"

  project_name = var.project_name
  environment  = var.environment

  # Buckets to create
  buckets = {
    backups = {
      versioning_enabled = true
      lifecycle_rules = {
        transition_to_glacier_days = 90
        expiration_days            = 365
      }
    }
    logs = {
      versioning_enabled = false
      lifecycle_rules = {
        expiration_days = 90
      }
    }
  }

  # Encryption
  kms_key_id = module.kms.key_arn

  tags = var.tags
}

# ============================================================================
# Route53 DNS Module (Optional)
# ============================================================================

module "route53" {
  source = "./modules/route53"
  count  = var.create_route53_records ? 1 : 0

  project_name = var.project_name
  environment  = var.environment

  # Hosted zone
  domain_name = var.domain_name

  # ALB DNS
  alb_dns_name = module.alb.alb_dns_name
  alb_zone_id  = module.alb.alb_zone_id

  # Subdomain records
  subdomain_prefix = var.subdomain_prefix

  tags = var.tags
}

# ============================================================================
# Outputs
# ============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "rds_endpoint" {
  description = "RDS primary endpoint"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = module.redis.cluster_endpoint
  sensitive   = true
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_url" {
  description = "ALB URL"
  value       = "https://${module.alb.alb_dns_name}"
}

output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value       = module.ecr.repository_urls
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_service_names" {
  description = "ECS service names"
  value       = module.ecs.service_names
}

output "secrets_manager_secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = module.secrets.app_secrets_arn
  sensitive   = true
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = module.monitoring.dashboard_url
}
