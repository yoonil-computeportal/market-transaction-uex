# ==============================================================================
# Security Module - Main Configuration
# ==============================================================================
#
# This module creates security groups for all infrastructure components:
# - ALB Security Group (allows 80, 443 from internet)
# - ECS Security Group (allows traffic from ALB only)
# - RDS Security Group (allows 5432 from ECS only)
# - Redis Security Group (allows 6379 from ECS only)
# - VPC Endpoints Security Group (for private AWS service access)
#
# ==============================================================================

# ==============================================================================
# ALB Security Group
# ==============================================================================

resource "aws_security_group" "alb" {
  name        = "${var.project_name}-${var.environment}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-alb-sg"
    }
  )
}

# Ingress: HTTP (redirect to HTTPS)
resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  security_group_id = aws_security_group.alb.id
  description       = "Allow HTTP from internet"

  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 80
  to_port     = 80
  ip_protocol = "tcp"

  tags = {
    Name = "Allow HTTP"
  }
}

# Ingress: HTTPS
resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  security_group_id = aws_security_group.alb.id
  description       = "Allow HTTPS from internet"

  cidr_ipv4   = "0.0.0.0/0"
  from_port   = 443
  to_port     = 443
  ip_protocol = "tcp"

  tags = {
    Name = "Allow HTTPS"
  }
}

# Ingress: Restricted access (if specified)
resource "aws_vpc_security_group_ingress_rule" "alb_restricted" {
  count = length(var.allowed_cidr_blocks) > 0 && !contains(var.allowed_cidr_blocks, "0.0.0.0/0") ? length(var.allowed_cidr_blocks) : 0

  security_group_id = aws_security_group.alb.id
  description       = "Allow HTTPS from restricted CIDR ${var.allowed_cidr_blocks[count.index]}"

  cidr_ipv4   = var.allowed_cidr_blocks[count.index]
  from_port   = 443
  to_port     = 443
  ip_protocol = "tcp"

  tags = {
    Name = "Allow HTTPS - Restricted"
  }
}

# Egress: All traffic to ECS
resource "aws_vpc_security_group_egress_rule" "alb_to_ecs" {
  security_group_id = aws_security_group.alb.id
  description       = "Allow all traffic to ECS services"

  referenced_security_group_id = aws_security_group.ecs.id
  ip_protocol                  = "-1"

  tags = {
    Name = "To ECS Services"
  }
}

# ==============================================================================
# ECS Security Group
# ==============================================================================

resource "aws_security_group" "ecs" {
  name        = "${var.project_name}-${var.environment}-ecs-sg"
  description = "Security group for ECS services"
  vpc_id      = var.vpc_id

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-ecs-sg"
    }
  )
}

# Ingress: From ALB on all service ports
resource "aws_vpc_security_group_ingress_rule" "ecs_from_alb" {
  security_group_id = aws_security_group.ecs.id
  description       = "Allow traffic from ALB"

  referenced_security_group_id = aws_security_group.alb.id
  from_port                    = 0
  to_port                      = 65535
  ip_protocol                  = "tcp"

  tags = {
    Name = "From ALB"
  }
}

# Ingress: Service-to-service communication within ECS
resource "aws_vpc_security_group_ingress_rule" "ecs_internal" {
  security_group_id = aws_security_group.ecs.id
  description       = "Allow ECS service-to-service communication"

  referenced_security_group_id = aws_security_group.ecs.id
  ip_protocol                  = "-1"

  tags = {
    Name = "ECS Internal"
  }
}

# Egress: To RDS
resource "aws_vpc_security_group_egress_rule" "ecs_to_rds" {
  security_group_id = aws_security_group.ecs.id
  description       = "Allow traffic to RDS"

  referenced_security_group_id = aws_security_group.rds.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"

  tags = {
    Name = "To RDS"
  }
}

# Egress: To Redis
resource "aws_vpc_security_group_egress_rule" "ecs_to_redis" {
  security_group_id = aws_security_group.ecs.id
  description       = "Allow traffic to Redis"

  referenced_security_group_id = aws_security_group.redis.id
  from_port                    = 6379
  to_port                      = 6379
  ip_protocol                  = "tcp"

  tags = {
    Name = "To Redis"
  }
}

# Egress: To internet (for UEX API calls, npm installs, etc.)
resource "aws_vpc_security_group_egress_rule" "ecs_to_internet" {
  security_group_id = aws_security_group.ecs.id
  description       = "Allow outbound internet access"

  cidr_ipv4   = "0.0.0.0/0"
  ip_protocol = "-1"

  tags = {
    Name = "To Internet"
  }
}

# Egress: To VPC endpoints
resource "aws_vpc_security_group_egress_rule" "ecs_to_vpc_endpoints" {
  count = var.enable_vpc_endpoints ? 1 : 0

  security_group_id = aws_security_group.ecs.id
  description       = "Allow traffic to VPC endpoints"

  referenced_security_group_id = aws_security_group.vpc_endpoints[0].id
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"

  tags = {
    Name = "To VPC Endpoints"
  }
}

# ==============================================================================
# RDS Security Group
# ==============================================================================

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-${var.environment}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-rds-sg"
    }
  )
}

# Ingress: From ECS on PostgreSQL port
resource "aws_vpc_security_group_ingress_rule" "rds_from_ecs" {
  security_group_id = aws_security_group.rds.id
  description       = "Allow PostgreSQL traffic from ECS"

  referenced_security_group_id = aws_security_group.ecs.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"

  tags = {
    Name = "From ECS"
  }
}

# Ingress: From bastion (if enabled)
resource "aws_vpc_security_group_ingress_rule" "rds_from_bastion" {
  count = var.enable_bastion ? 1 : 0

  security_group_id = aws_security_group.rds.id
  description       = "Allow PostgreSQL traffic from bastion"

  referenced_security_group_id = aws_security_group.bastion[0].id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"

  tags = {
    Name = "From Bastion"
  }
}

# Egress: Not needed for RDS (no outbound connections required)

# ==============================================================================
# Redis Security Group
# ==============================================================================

resource "aws_security_group" "redis" {
  name        = "${var.project_name}-${var.environment}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = var.vpc_id

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-redis-sg"
    }
  )
}

# Ingress: From ECS on Redis port
resource "aws_vpc_security_group_ingress_rule" "redis_from_ecs" {
  security_group_id = aws_security_group.redis.id
  description       = "Allow Redis traffic from ECS"

  referenced_security_group_id = aws_security_group.ecs.id
  from_port                    = 6379
  to_port                      = 6379
  ip_protocol                  = "tcp"

  tags = {
    Name = "From ECS"
  }
}

# Egress: Not needed for Redis

# ==============================================================================
# VPC Endpoints Security Group (Optional)
# ==============================================================================

resource "aws_security_group" "vpc_endpoints" {
  count = var.enable_vpc_endpoints ? 1 : 0

  name        = "${var.project_name}-${var.environment}-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = var.vpc_id

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-vpc-endpoints-sg"
    }
  )
}

# Ingress: From ECS on HTTPS
resource "aws_vpc_security_group_ingress_rule" "vpc_endpoints_from_ecs" {
  count = var.enable_vpc_endpoints ? 1 : 0

  security_group_id = aws_security_group.vpc_endpoints[0].id
  description       = "Allow HTTPS from ECS"

  referenced_security_group_id = aws_security_group.ecs.id
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"

  tags = {
    Name = "From ECS"
  }
}

# ==============================================================================
# Bastion Security Group (Optional)
# ==============================================================================

resource "aws_security_group" "bastion" {
  count = var.enable_bastion ? 1 : 0

  name        = "${var.project_name}-${var.environment}-bastion-sg"
  description = "Security group for bastion host"
  vpc_id      = var.vpc_id

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-bastion-sg"
    }
  )
}

# Ingress: SSH from allowed CIDR blocks
resource "aws_vpc_security_group_ingress_rule" "bastion_ssh" {
  for_each = var.enable_bastion ? toset(var.bastion_allowed_cidr_blocks) : toset([])

  security_group_id = aws_security_group.bastion[0].id
  description       = "Allow SSH from ${each.value}"

  cidr_ipv4   = each.value
  from_port   = 22
  to_port     = 22
  ip_protocol = "tcp"

  tags = {
    Name = "SSH from ${each.value}"
  }
}

# Egress: To RDS
resource "aws_vpc_security_group_egress_rule" "bastion_to_rds" {
  count = var.enable_bastion ? 1 : 0

  security_group_id = aws_security_group.bastion[0].id
  description       = "Allow PostgreSQL to RDS"

  referenced_security_group_id = aws_security_group.rds.id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"

  tags = {
    Name = "To RDS"
  }
}

# Egress: To Redis
resource "aws_vpc_security_group_egress_rule" "bastion_to_redis" {
  count = var.enable_bastion ? 1 : 0

  security_group_id = aws_security_group.bastion[0].id
  description       = "Allow Redis to cache"

  referenced_security_group_id = aws_security_group.redis.id
  from_port                    = 6379
  to_port                      = 6379
  ip_protocol                  = "tcp"

  tags = {
    Name = "To Redis"
  }
}

# Egress: To internet (for updates)
resource "aws_vpc_security_group_egress_rule" "bastion_to_internet" {
  count = var.enable_bastion ? 1 : 0

  security_group_id = aws_security_group.bastion[0].id
  description       = "Allow outbound internet access"

  cidr_ipv4   = "0.0.0.0/0"
  ip_protocol = "-1"

  tags = {
    Name = "To Internet"
  }
}
