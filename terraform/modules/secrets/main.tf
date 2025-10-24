# ==============================================================================
# Secrets Manager Module - Main Configuration
# ==============================================================================
#
# This module creates and manages secrets in AWS Secrets Manager:
# - Database credentials (username, password, endpoint)
# - UEX API credentials (referral code, client ID, secret key)
# - Redis connection information
# - Application secrets bundle
#
# All secrets are encrypted using the provided KMS key.
#
# ==============================================================================

data "aws_region" "current" {}

# ==============================================================================
# Random Password Generation
# ==============================================================================

resource "random_password" "db_password" {
  count = var.db_master_password == "" ? 1 : 0

  length  = 32
  special = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "random_password" "redis_auth_token" {
  count = var.redis_auth_token == "" ? 1 : 0

  length  = 64
  special = false  # Redis auth token doesn't support special characters
}

# ==============================================================================
# Database Credentials Secret
# ==============================================================================

resource "aws_secretsmanager_secret" "database" {
  name        = "${var.project_name}/${var.environment}/database"
  description = "Database credentials for ${var.project_name}-${var.environment}"
  kms_key_id  = var.kms_key_id

  recovery_window_in_days = var.recovery_window_in_days

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-db-credentials"
    }
  )
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id

  secret_string = jsonencode({
    username = var.db_master_username
    password = var.db_master_password != "" ? var.db_master_password : random_password.db_password[0].result
    host     = var.db_endpoint
    port     = var.db_port
    database = var.db_database_name
    engine   = "postgresql"
  })
}

# ==============================================================================
# UEX API Credentials Secret
# ==============================================================================

resource "aws_secretsmanager_secret" "uex_credentials" {
  name        = "${var.project_name}/${var.environment}/uex-credentials"
  description = "UEX API credentials for ${var.project_name}-${var.environment}"
  kms_key_id  = var.kms_key_id

  recovery_window_in_days = var.recovery_window_in_days

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-uex-credentials"
    }
  )
}

resource "aws_secretsmanager_secret_version" "uex_credentials" {
  secret_id = aws_secretsmanager_secret.uex_credentials.id

  secret_string = jsonencode({
    referral_code      = var.uex_referral_code
    client_id          = var.uex_client_id
    secret_key         = var.uex_secret_key
    swap_base_url      = var.uex_swap_base_url
    merchant_base_url  = var.uex_merchant_base_url
  })
}

# ==============================================================================
# Redis Connection Secret
# ==============================================================================

resource "aws_secretsmanager_secret" "redis" {
  name        = "${var.project_name}/${var.environment}/redis"
  description = "Redis connection information for ${var.project_name}-${var.environment}"
  kms_key_id  = var.kms_key_id

  recovery_window_in_days = var.recovery_window_in_days

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-redis"
    }
  )
}

resource "aws_secretsmanager_secret_version" "redis" {
  secret_id = aws_secretsmanager_secret.redis.id

  secret_string = jsonencode({
    endpoint   = var.redis_endpoint
    port       = var.redis_port
    auth_token = var.redis_auth_token != "" ? var.redis_auth_token : (length(random_password.redis_auth_token) > 0 ? random_password.redis_auth_token[0].result : "")
  })
}

# ==============================================================================
# Application Secrets Bundle
# ==============================================================================

resource "aws_secretsmanager_secret" "app_secrets" {
  name        = "${var.project_name}/${var.environment}/app-secrets"
  description = "Application secrets bundle for ${var.project_name}-${var.environment}"
  kms_key_id  = var.kms_key_id

  recovery_window_in_days = var.recovery_window_in_days

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-app-secrets"
    }
  )
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id

  secret_string = jsonencode({
    database = {
      connection_string = "postgresql://${var.db_master_username}:${var.db_master_password != "" ? var.db_master_password : random_password.db_password[0].result}@${var.db_endpoint}:${var.db_port}/${var.db_database_name}"
      username = var.db_master_username
      password = var.db_master_password != "" ? var.db_master_password : random_password.db_password[0].result
      host     = var.db_endpoint
      port     = var.db_port
      database = var.db_database_name
    }
    redis = {
      connection_string = var.redis_auth_token != "" || length(random_password.redis_auth_token) > 0 ? "rediss://:${var.redis_auth_token != "" ? var.redis_auth_token : random_password.redis_auth_token[0].result}@${var.redis_endpoint}:${var.redis_port}" : "redis://${var.redis_endpoint}:${var.redis_port}"
      endpoint   = var.redis_endpoint
      port       = var.redis_port
      auth_token = var.redis_auth_token != "" ? var.redis_auth_token : (length(random_password.redis_auth_token) > 0 ? random_password.redis_auth_token[0].result : "")
    }
    uex = {
      referral_code     = var.uex_referral_code
      client_id         = var.uex_client_id
      secret_key        = var.uex_secret_key
      swap_base_url     = var.uex_swap_base_url
      merchant_base_url = var.uex_merchant_base_url
    }
  })
}

# ==============================================================================
# Secret Rotation Configuration (Future Enhancement)
# ==============================================================================

# NOTE: Automatic secret rotation requires Lambda functions
# This can be added as a future enhancement when needed

# resource "aws_secretsmanager_secret_rotation" "database" {
#   count = var.enable_rotation ? 1 : 0
#
#   secret_id           = aws_secretsmanager_secret.database.id
#   rotation_lambda_arn = aws_lambda_function.rotate_secret[0].arn
#
#   rotation_rules {
#     automatically_after_days = 30
#   }
# }

# ==============================================================================
# IAM Policy for ECS Tasks to Access Secrets
# ==============================================================================

data "aws_iam_policy_document" "ecs_secrets_access" {
  statement {
    sid    = "AllowECSTasksToReadSecrets"
    effect = "Allow"

    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]

    resources = [
      aws_secretsmanager_secret.database.arn,
      aws_secretsmanager_secret.uex_credentials.arn,
      aws_secretsmanager_secret.redis.arn,
      aws_secretsmanager_secret.app_secrets.arn
    ]
  }

  statement {
    sid    = "AllowECSTasksToDecryptSecrets"
    effect = "Allow"

    actions = [
      "kms:Decrypt",
      "kms:DescribeKey"
    ]

    resources = [var.kms_key_id]
  }
}

resource "aws_iam_policy" "ecs_secrets_access" {
  name        = "${var.project_name}-${var.environment}-ecs-secrets-access"
  description = "Allow ECS tasks to access Secrets Manager secrets"
  policy      = data.aws_iam_policy_document.ecs_secrets_access.json

  tags = var.tags
}

# ==============================================================================
# Outputs for Connection Strings (as Secret ARNs)
# ==============================================================================

# These ARNs can be referenced in ECS task definitions
# ECS will automatically inject the secret values as environment variables
