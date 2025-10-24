# ==============================================================================
# ECS Module - Main Configuration
# ==============================================================================
#
# This module creates an ECS Fargate cluster with 6 microservices:
# 1. Presentation (3900)
# 2. Client-Tier (3901)
# 3. Management-Tier (3902)
# 4. UEX Backend (3903) - Main service
# 5. Processing-Tier (8900)
# 6. Management Backend (9000)
#
# Features:
# - ECS Cluster with Container Insights
# - 6 ECS Services with Fargate launch type
# - 6 Task Definitions with secrets and environment variables
# - IAM roles (execution and task roles)
# - Auto Scaling policies
# - CloudWatch Log Groups
# - Load balancer integration
#
# ==============================================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ==============================================================================
# ECS Cluster
# ==============================================================================

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}-cluster"

  setting {
    name  = "containerInsights"
    value = var.enable_container_insights ? "enabled" : "disabled"
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-cluster"
    }
  )
}

# ==============================================================================
# CloudWatch Log Groups
# ==============================================================================

resource "aws_cloudwatch_log_group" "services" {
  for_each = toset(var.service_names)

  name              = "/ecs/${var.project_name}-${var.environment}/${each.key}"
  retention_in_days = var.log_retention_days
  kms_key_id       = var.kms_key_arn

  tags = merge(
    var.tags,
    {
      Name    = "${var.project_name}-${var.environment}-${each.key}-logs"
      Service = each.key
    }
  )
}

# ==============================================================================
# IAM Roles - Task Execution Role
# ==============================================================================

resource "aws_iam_role" "task_execution_role" {
  name = "${var.project_name}-${var.environment}-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-ecs-task-execution-role"
    }
  )
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "task_execution_role_policy" {
  role       = aws_iam_role.task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional policy for Secrets Manager and ECR
resource "aws_iam_role_policy" "task_execution_secrets" {
  name = "${var.project_name}-${var.environment}-ecs-execution-secrets-policy"
  role = aws_iam_role.task_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = var.secrets_arns
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = var.kms_key_arn
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      }
    ]
  })
}

# ==============================================================================
# IAM Roles - Task Role (for application access to AWS services)
# ==============================================================================

resource "aws_iam_role" "task_role" {
  name = "${var.project_name}-${var.environment}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-ecs-task-role"
    }
  )
}

# Policy for application to access RDS, Redis, S3, Secrets Manager
resource "aws_iam_role_policy" "task_role_policy" {
  name = "${var.project_name}-${var.environment}-ecs-task-policy"
  role = aws_iam_role.task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = var.secrets_arns
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = var.kms_key_arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "${var.s3_backups_bucket_arn}",
          "${var.s3_backups_bucket_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/${var.project_name}-${var.environment}/*"
      }
    ]
  })
}

# ==============================================================================
# Task Definitions
# ==============================================================================

# Service configuration map
locals {
  services = {
    presentation = {
      port        = 3900
      cpu         = var.presentation_cpu
      memory      = var.presentation_memory
      environment = var.presentation_environment_vars
      secrets     = var.presentation_secrets
      health_check_path = "/presentation/health"
    }
    client-tier = {
      port        = 3901
      cpu         = var.client_tier_cpu
      memory      = var.client_tier_memory
      environment = var.client_tier_environment_vars
      secrets     = var.client_tier_secrets
      health_check_path = "/client/health"
    }
    management-tier = {
      port        = 3902
      cpu         = var.management_tier_cpu
      memory      = var.management_tier_memory
      environment = var.management_tier_environment_vars
      secrets     = var.management_tier_secrets
      health_check_path = "/management/health"
    }
    uex-backend = {
      port        = 3903
      cpu         = var.uex_backend_cpu
      memory      = var.uex_backend_memory
      environment = var.uex_backend_environment_vars
      secrets     = var.uex_backend_secrets
      health_check_path = "/api/uex/health"
    }
    processing-tier = {
      port        = 8900
      cpu         = var.processing_tier_cpu
      memory      = var.processing_tier_memory
      environment = var.processing_tier_environment_vars
      secrets     = var.processing_tier_secrets
      health_check_path = "/api/processing/health"
    }
    management-backend = {
      port        = 9000
      cpu         = var.management_backend_cpu
      memory      = var.management_backend_memory
      environment = var.management_backend_environment_vars
      secrets     = var.management_backend_secrets
      health_check_path = "/api/mgmt/health"
    }
  }
}

resource "aws_ecs_task_definition" "services" {
  for_each = local.services

  family                   = "${var.project_name}-${var.environment}-${each.key}"
  network_mode            = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                     = each.value.cpu
  memory                  = each.value.memory
  execution_role_arn      = aws_iam_role.task_execution_role.arn
  task_role_arn          = aws_iam_role.task_role.arn

  container_definitions = jsonencode([
    {
      name  = each.key
      image = "${var.ecr_repository_urls[each.key]}:${var.image_tag}"

      portMappings = [
        {
          containerPort = each.value.port
          protocol      = "tcp"
        }
      ]

      environment = concat(
        [
          {
            name  = "NODE_ENV"
            value = var.environment
          },
          {
            name  = "PORT"
            value = tostring(each.value.port)
          },
          {
            name  = "LOG_LEVEL"
            value = var.log_level
          },
          {
            name  = "AWS_REGION"
            value = data.aws_region.current.name
          }
        ],
        each.value.environment
      )

      secrets = each.value.secrets

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.services[each.key].name
          "awslogs-region"        = data.aws_region.current.name
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:${each.value.port}${each.value.health_check_path} || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      essential = true

      stopTimeout = 30
    }
  ])

  tags = merge(
    var.tags,
    {
      Name    = "${var.project_name}-${var.environment}-${each.key}"
      Service = each.key
    }
  )
}

# ==============================================================================
# ECS Services
# ==============================================================================

resource "aws_ecs_service" "services" {
  for_each = local.services

  name            = "${var.project_name}-${var.environment}-${each.key}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.services[each.key].arn
  desired_count   = lookup(var.service_desired_counts, each.key, 2)
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.target_group_arns[each.key]
    container_name   = each.key
    container_port   = each.value.port
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
    deployment_circuit_breaker {
      enable   = true
      rollback = true
    }
  }

  deployment_controller {
    type = "ECS"
  }

  enable_execute_command = var.enable_execute_command

  # Wait for ALB to be ready
  depends_on = [
    aws_iam_role_policy.task_role_policy,
    aws_iam_role_policy.task_execution_secrets
  ]

  tags = merge(
    var.tags,
    {
      Name    = "${var.project_name}-${var.environment}-${each.key}"
      Service = each.key
    }
  )
}

# ==============================================================================
# Auto Scaling
# ==============================================================================

# Auto Scaling Target
resource "aws_appautoscaling_target" "services" {
  for_each = var.enable_autoscaling ? local.services : {}

  max_capacity       = lookup(var.service_max_capacity, each.key, 10)
  min_capacity       = lookup(var.service_min_capacity, each.key, 2)
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.services[each.key].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto Scaling Policy - CPU
resource "aws_appautoscaling_policy" "cpu" {
  for_each = var.enable_autoscaling ? local.services : {}

  name               = "${var.project_name}-${var.environment}-${each.key}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.services[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.services[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.services[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = var.cpu_target_value
    scale_in_cooldown  = var.scale_in_cooldown
    scale_out_cooldown = var.scale_out_cooldown

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}

# Auto Scaling Policy - Memory
resource "aws_appautoscaling_policy" "memory" {
  for_each = var.enable_autoscaling ? local.services : {}

  name               = "${var.project_name}-${var.environment}-${each.key}-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.services[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.services[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.services[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = var.memory_target_value
    scale_in_cooldown  = var.scale_in_cooldown
    scale_out_cooldown = var.scale_out_cooldown

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
  }
}

# Auto Scaling Policy - ALB Request Count
resource "aws_appautoscaling_policy" "request_count" {
  for_each = var.enable_autoscaling && var.enable_request_count_scaling ? local.services : {}

  name               = "${var.project_name}-${var.environment}-${each.key}-request-count-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.services[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.services[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.services[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = var.request_count_target_value
    scale_in_cooldown  = var.scale_in_cooldown
    scale_out_cooldown = var.scale_out_cooldown

    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label        = "${var.alb_arn_suffix}/${var.target_group_arn_suffixes[each.key]}"
    }
  }
}
