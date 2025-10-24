# ==============================================================================
# ECR Module - Main Configuration
# ==============================================================================
#
# This module creates ECR repositories for all microservices:
# - presentation (port 3900)
# - client-tier (port 3901)
# - management-tier (port 3902)
# - uex-backend (port 3903) - Main service
# - processing-tier (port 8900)
# - management-backend (port 9000)
#
# Features:
# - Image scanning on push
# - Lifecycle policies to manage image retention
# - Encryption at rest
# - Repository policies for access control
#
# ==============================================================================

# ==============================================================================
# ECR Repositories
# ==============================================================================

resource "aws_ecr_repository" "repositories" {
  for_each = toset(var.repositories)

  name                 = "${var.project_name}-${var.environment}-${each.key}"
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = var.kms_key_id
  }

  tags = merge(
    var.tags,
    {
      Name    = "${var.project_name}-${var.environment}-${each.key}"
      Service = each.key
    }
  )
}

# ==============================================================================
# Lifecycle Policies
# ==============================================================================

resource "aws_ecr_lifecycle_policy" "repositories" {
  for_each = toset(var.repositories)

  repository = aws_ecr_repository.repositories[each.key].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.max_image_count} images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v", "latest"]
          countType     = "imageCountMoreThan"
          countNumber   = var.max_image_count
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Remove untagged images after ${var.untagged_image_retention_days} days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = var.untagged_image_retention_days
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# ==============================================================================
# Repository Policies
# ==============================================================================

data "aws_iam_policy_document" "ecr_policy" {
  for_each = var.enable_cross_account_access ? toset(var.repositories) : toset([])

  # Allow cross-account pull
  dynamic "statement" {
    for_each = length(var.cross_account_ids) > 0 ? [1] : []

    content {
      sid    = "AllowCrossAccountPull"
      effect = "Allow"

      principals {
        type        = "AWS"
        identifiers = [for account_id in var.cross_account_ids : "arn:aws:iam::${account_id}:root"]
      }

      actions = [
        "ecr:BatchCheckLayerAvailability",
        "ecr:BatchGetImage",
        "ecr:GetDownloadUrlForLayer"
      ]
    }
  }

  # Allow cross-account push (if enabled)
  dynamic "statement" {
    for_each = var.allow_cross_account_push && length(var.cross_account_ids) > 0 ? [1] : []

    content {
      sid    = "AllowCrossAccountPush"
      effect = "Allow"

      principals {
        type        = "AWS"
        identifiers = [for account_id in var.cross_account_ids : "arn:aws:iam::${account_id}:root"]
      }

      actions = [
        "ecr:BatchCheckLayerAvailability",
        "ecr:CompleteLayerUpload",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart"
      ]
    }
  }
}

resource "aws_ecr_repository_policy" "repositories" {
  for_each = var.enable_cross_account_access ? toset(var.repositories) : toset([])

  repository = aws_ecr_repository.repositories[each.key].name
  policy     = data.aws_iam_policy_document.ecr_policy[each.key].json
}

# ==============================================================================
# IAM Policy for ECS Task Execution Role
# ==============================================================================

data "aws_iam_policy_document" "ecs_pull_policy" {
  statement {
    sid    = "AllowECSTasksToPullImages"
    effect = "Allow"

    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage"
    ]

    resources = [for repo in aws_ecr_repository.repositories : repo.arn]
  }

  statement {
    sid    = "AllowECSTasksToGetAuthToken"
    effect = "Allow"

    actions = [
      "ecr:GetAuthorizationToken"
    ]

    resources = ["*"]
  }
}

resource "aws_iam_policy" "ecs_pull_policy" {
  name        = "${var.project_name}-${var.environment}-ecr-pull-policy"
  description = "Allow ECS tasks to pull images from ECR"
  policy      = data.aws_iam_policy_document.ecs_pull_policy.json

  tags = var.tags
}
