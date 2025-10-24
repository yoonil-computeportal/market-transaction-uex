# ==============================================================================
# Secrets Manager Module - Outputs
# ==============================================================================

# ==============================================================================
# Secret ARNs (for ECS task definitions)
# ==============================================================================

output "database_secret_arn" {
  description = "ARN of the database credentials secret"
  value       = aws_secretsmanager_secret.database.arn
  sensitive   = true
}

output "uex_credentials_secret_arn" {
  description = "ARN of the UEX credentials secret"
  value       = aws_secretsmanager_secret.uex_credentials.arn
  sensitive   = true
}

output "redis_secret_arn" {
  description = "ARN of the Redis connection secret"
  value       = aws_secretsmanager_secret.redis.arn
  sensitive   = true
}

output "app_secrets_arn" {
  description = "ARN of the application secrets bundle"
  value       = aws_secretsmanager_secret.app_secrets.arn
  sensitive   = true
}

# ==============================================================================
# Secret Names (for CLI access)
# ==============================================================================

output "database_secret_name" {
  description = "Name of the database credentials secret"
  value       = aws_secretsmanager_secret.database.name
}

output "uex_credentials_secret_name" {
  description = "Name of the UEX credentials secret"
  value       = aws_secretsmanager_secret.uex_credentials.name
}

output "redis_secret_name" {
  description = "Name of the Redis connection secret"
  value       = aws_secretsmanager_secret.redis.name
}

output "app_secrets_name" {
  description = "Name of the application secrets bundle"
  value       = aws_secretsmanager_secret.app_secrets.name
}

# ==============================================================================
# Individual Secret ARNs for ECS Task Definition References
# ==============================================================================

output "database_connection_string_arn" {
  description = "ARN for database connection string (valueFrom in ECS)"
  value       = "${aws_secretsmanager_secret.app_secrets.arn}:database.connection_string::"
  sensitive   = true
}

output "database_username_arn" {
  description = "ARN for database username (valueFrom in ECS)"
  value       = "${aws_secretsmanager_secret.app_secrets.arn}:database.username::"
  sensitive   = true
}

output "database_password_arn" {
  description = "ARN for database password (valueFrom in ECS)"
  value       = "${aws_secretsmanager_secret.app_secrets.arn}:database.password::"
  sensitive   = true
}

output "database_host_arn" {
  description = "ARN for database host (valueFrom in ECS)"
  value       = "${aws_secretsmanager_secret.app_secrets.arn}:database.host::"
  sensitive   = true
}

output "redis_connection_string_arn" {
  description = "ARN for Redis connection string (valueFrom in ECS)"
  value       = "${aws_secretsmanager_secret.app_secrets.arn}:redis.connection_string::"
  sensitive   = true
}

output "redis_endpoint_arn" {
  description = "ARN for Redis endpoint (valueFrom in ECS)"
  value       = "${aws_secretsmanager_secret.app_secrets.arn}:redis.endpoint::"
  sensitive   = true
}

output "redis_auth_token_arn" {
  description = "ARN for Redis auth token (valueFrom in ECS)"
  value       = "${aws_secretsmanager_secret.app_secrets.arn}:redis.auth_token::"
  sensitive   = true
}

output "uex_referral_code_arn" {
  description = "ARN for UEX referral code (valueFrom in ECS)"
  value       = "${aws_secretsmanager_secret.app_secrets.arn}:uex.referral_code::"
  sensitive   = true
}

output "uex_client_id_arn" {
  description = "ARN for UEX client ID (valueFrom in ECS)"
  value       = "${aws_secretsmanager_secret.app_secrets.arn}:uex.client_id::"
  sensitive   = true
}

output "uex_secret_key_arn" {
  description = "ARN for UEX secret key (valueFrom in ECS)"
  value       = "${aws_secretsmanager_secret.app_secrets.arn}:uex.secret_key::"
  sensitive   = true
}

output "uex_swap_base_url_arn" {
  description = "ARN for UEX swap base URL (valueFrom in ECS)"
  value       = "${aws_secretsmanager_secret.app_secrets.arn}:uex.swap_base_url::"
  sensitive   = true
}

output "uex_merchant_base_url_arn" {
  description = "ARN for UEX merchant base URL (valueFrom in ECS)"
  value       = "${aws_secretsmanager_secret.app_secrets.arn}:uex.merchant_base_url::"
  sensitive   = true
}

# ==============================================================================
# IAM Policy ARN
# ==============================================================================

output "ecs_secrets_access_policy_arn" {
  description = "ARN of the IAM policy for ECS tasks to access secrets"
  value       = aws_iam_policy.ecs_secrets_access.arn
}

output "ecs_secrets_access_policy_name" {
  description = "Name of the IAM policy for ECS tasks to access secrets"
  value       = aws_iam_policy.ecs_secrets_access.name
}

# ==============================================================================
# Generated Passwords (for initial setup only - DO NOT LOG)
# ==============================================================================

output "db_password_generated" {
  description = "Generated database password (only if auto-generated)"
  value       = var.db_master_password == "" ? random_password.db_password[0].result : null
  sensitive   = true
}

output "redis_auth_token_generated" {
  description = "Generated Redis auth token (only if auto-generated)"
  value       = var.redis_auth_token == "" ? (length(random_password.redis_auth_token) > 0 ? random_password.redis_auth_token[0].result : null) : null
  sensitive   = true
}

# ==============================================================================
# CLI Commands for Accessing Secrets
# ==============================================================================

output "cli_commands" {
  description = "AWS CLI commands to retrieve secrets"
  value = {
    database = "aws secretsmanager get-secret-value --secret-id ${aws_secretsmanager_secret.database.name} --query SecretString --output text | jq ."
    uex      = "aws secretsmanager get-secret-value --secret-id ${aws_secretsmanager_secret.uex_credentials.name} --query SecretString --output text | jq ."
    redis    = "aws secretsmanager get-secret-value --secret-id ${aws_secretsmanager_secret.redis.name} --query SecretString --output text | jq ."
    all      = "aws secretsmanager get-secret-value --secret-id ${aws_secretsmanager_secret.app_secrets.name} --query SecretString --output text | jq ."
  }
}
