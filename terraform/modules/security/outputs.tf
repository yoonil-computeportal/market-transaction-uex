# ==============================================================================
# Security Module - Outputs
# ==============================================================================

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "alb_security_group_arn" {
  description = "ARN of the ALB security group"
  value       = aws_security_group.alb.arn
}

output "ecs_security_group_id" {
  description = "ID of the ECS security group"
  value       = aws_security_group.ecs.id
}

output "ecs_security_group_arn" {
  description = "ARN of the ECS security group"
  value       = aws_security_group.ecs.arn
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "rds_security_group_arn" {
  description = "ARN of the RDS security group"
  value       = aws_security_group.rds.arn
}

output "redis_security_group_id" {
  description = "ID of the Redis security group"
  value       = aws_security_group.redis.id
}

output "redis_security_group_arn" {
  description = "ARN of the Redis security group"
  value       = aws_security_group.redis.arn
}

output "vpc_endpoints_security_group_id" {
  description = "ID of the VPC endpoints security group"
  value       = var.enable_vpc_endpoints ? aws_security_group.vpc_endpoints[0].id : null
}

output "bastion_security_group_id" {
  description = "ID of the bastion security group"
  value       = var.enable_bastion ? aws_security_group.bastion[0].id : null
}

output "security_group_ids" {
  description = "Map of all security group IDs"
  value = {
    alb           = aws_security_group.alb.id
    ecs           = aws_security_group.ecs.id
    rds           = aws_security_group.rds.id
    redis         = aws_security_group.redis.id
    vpc_endpoints = var.enable_vpc_endpoints ? aws_security_group.vpc_endpoints[0].id : null
    bastion       = var.enable_bastion ? aws_security_group.bastion[0].id : null
  }
}
