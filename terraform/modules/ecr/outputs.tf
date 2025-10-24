# ==============================================================================
# ECR Module - Outputs
# ==============================================================================

output "repository_arns" {
  description = "Map of repository names to ARNs"
  value       = { for k, v in aws_ecr_repository.repositories : k => v.arn }
}

output "repository_urls" {
  description = "Map of repository names to URLs"
  value       = { for k, v in aws_ecr_repository.repositories : k => v.repository_url }
}

output "repository_names" {
  description = "List of repository names"
  value       = [for repo in aws_ecr_repository.repositories : repo.name]
}

output "repository_registry_ids" {
  description = "Map of repository names to registry IDs"
  value       = { for k, v in aws_ecr_repository.repositories : k => v.registry_id }
}

output "ecs_pull_policy_arn" {
  description = "ARN of the IAM policy for ECS tasks to pull images"
  value       = aws_iam_policy.ecs_pull_policy.arn
}

output "ecs_pull_policy_name" {
  description = "Name of the IAM policy for ECS tasks to pull images"
  value       = aws_iam_policy.ecs_pull_policy.name
}

# ==============================================================================
# Docker Commands for Pushing Images
# ==============================================================================

output "docker_push_commands" {
  description = "Docker commands to build and push images to ECR"
  value = { for k, v in aws_ecr_repository.repositories : k => {
    login = "aws ecr get-login-password --region ${split(".", v.repository_url)[3]} | docker login --username AWS --password-stdin ${v.repository_url}"
    build = "docker build -t ${k}:latest ./${k}"
    tag   = "docker tag ${k}:latest ${v.repository_url}:latest"
    push  = "docker push ${v.repository_url}:latest"
    full  = "aws ecr get-login-password --region ${split(".", v.repository_url)[3]} | docker login --username AWS --password-stdin ${v.repository_url} && docker build -t ${k}:latest ./${k} && docker tag ${k}:latest ${v.repository_url}:latest && docker push ${v.repository_url}:latest"
  } }
}

# ==============================================================================
# Service-Specific Repository URLs (for convenience)
# ==============================================================================

output "presentation_repository_url" {
  description = "ECR repository URL for presentation service"
  value       = aws_ecr_repository.repositories["presentation"].repository_url
}

output "client_tier_repository_url" {
  description = "ECR repository URL for client-tier service"
  value       = aws_ecr_repository.repositories["client-tier"].repository_url
}

output "management_tier_repository_url" {
  description = "ECR repository URL for management-tier service"
  value       = aws_ecr_repository.repositories["management-tier"].repository_url
}

output "uex_backend_repository_url" {
  description = "ECR repository URL for uex-backend service"
  value       = aws_ecr_repository.repositories["uex-backend"].repository_url
}

output "processing_tier_repository_url" {
  description = "ECR repository URL for processing-tier service"
  value       = aws_ecr_repository.repositories["processing-tier"].repository_url
}

output "management_backend_repository_url" {
  description = "ECR repository URL for management-backend service"
  value       = aws_ecr_repository.repositories["management-backend"].repository_url
}
