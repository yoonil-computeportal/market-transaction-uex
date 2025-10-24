# ==============================================================================
# S3 Module - Main Configuration
# ==============================================================================
#
# This module creates S3 buckets for:
# - Database and application backups
# - ALB access logs
# - Application logs
# - CloudWatch Logs exports
#
# Features:
# - Server-side encryption with KMS
# - Versioning for backup buckets
# - Lifecycle policies for cost optimization
# - Public access blocking
# - Bucket policies for service access
#
# ==============================================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_elb_service_account" "current" {}

# ==============================================================================
# S3 Buckets
# ==============================================================================

resource "aws_s3_bucket" "buckets" {
  for_each = var.buckets

  bucket = "${var.project_name}-${var.environment}-${each.key}-${data.aws_caller_identity.current.account_id}"

  tags = merge(
    var.tags,
    {
      Name    = "${var.project_name}-${var.environment}-${each.key}"
      Purpose = each.key
    }
  )
}

# ==============================================================================
# S3 Bucket Versioning
# ==============================================================================

resource "aws_s3_bucket_versioning" "buckets" {
  for_each = { for k, v in var.buckets : k => v if lookup(v, "versioning_enabled", false) }

  bucket = aws_s3_bucket.buckets[each.key].id

  versioning_configuration {
    status = "Enabled"
  }
}

# ==============================================================================
# S3 Bucket Encryption
# ==============================================================================

resource "aws_s3_bucket_server_side_encryption_configuration" "buckets" {
  for_each = var.buckets

  bucket = aws_s3_bucket.buckets[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.kms_key_arn
    }
    bucket_key_enabled = true
  }
}

# ==============================================================================
# S3 Bucket Public Access Block
# ==============================================================================

resource "aws_s3_bucket_public_access_block" "buckets" {
  for_each = var.buckets

  bucket = aws_s3_bucket.buckets[each.key].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ==============================================================================
# S3 Bucket Lifecycle Policies
# ==============================================================================

resource "aws_s3_bucket_lifecycle_configuration" "buckets" {
  for_each = { for k, v in var.buckets : k => v if lookup(v, "lifecycle_rules", null) != null }

  bucket = aws_s3_bucket.buckets[each.key].id

  # Transition to Glacier
  dynamic "rule" {
    for_each = lookup(each.value.lifecycle_rules, "transition_to_glacier_days", null) != null ? [1] : []

    content {
      id     = "transition-to-glacier"
      status = "Enabled"

      transition {
        days          = lookup(each.value.lifecycle_rules, "transition_to_glacier_days", 90)
        storage_class = "GLACIER"
      }
    }
  }

  # Expire objects
  dynamic "rule" {
    for_each = lookup(each.value.lifecycle_rules, "expiration_days", null) != null ? [1] : []

    content {
      id     = "expire-objects"
      status = "Enabled"

      expiration {
        days = lookup(each.value.lifecycle_rules, "expiration_days", 365)
      }
    }
  }

  # Delete old versions
  dynamic "rule" {
    for_each = lookup(each.value, "versioning_enabled", false) && lookup(each.value.lifecycle_rules, "noncurrent_version_expiration_days", null) != null ? [1] : []

    content {
      id     = "expire-noncurrent-versions"
      status = "Enabled"

      noncurrent_version_expiration {
        noncurrent_days = lookup(each.value.lifecycle_rules, "noncurrent_version_expiration_days", 90)
      }
    }
  }

  # Intelligent tiering
  dynamic "rule" {
    for_each = lookup(each.value.lifecycle_rules, "enable_intelligent_tiering", false) ? [1] : []

    content {
      id     = "intelligent-tiering"
      status = "Enabled"

      transition {
        days          = 0
        storage_class = "INTELLIGENT_TIERING"
      }
    }
  }
}

# ==============================================================================
# S3 Bucket Policies
# ==============================================================================

# ALB Access Logs Policy
data "aws_iam_policy_document" "alb_logs" {
  statement {
    sid    = "AWSLogDeliveryWrite"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = [data.aws_elb_service_account.current.arn]
    }

    actions = [
      "s3:PutObject"
    ]

    resources = [
      "${aws_s3_bucket.buckets["logs"].arn}/*"
    ]
  }

  statement {
    sid    = "AWSLogDeliveryAclCheck"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["elasticloadbalancing.amazonaws.com"]
    }

    actions = [
      "s3:GetBucketAcl"
    ]

    resources = [
      aws_s3_bucket.buckets["logs"].arn
    ]
  }
}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.buckets["logs"].id
  policy = data.aws_iam_policy_document.alb_logs.json
}

# Backups Bucket Policy
data "aws_iam_policy_document" "backups" {
  # Allow RDS to write backups
  statement {
    sid    = "AllowRDSBackups"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["rds.amazonaws.com"]
    }

    actions = [
      "s3:PutObject",
      "s3:GetObject"
    ]

    resources = [
      "${aws_s3_bucket.buckets["backups"].arn}/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }

  # Allow CloudWatch Logs exports
  statement {
    sid    = "AllowCloudWatchLogsExport"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["logs.${data.aws_region.current.name}.amazonaws.com"]
    }

    actions = [
      "s3:GetBucketAcl"
    ]

    resources = [
      aws_s3_bucket.buckets["backups"].arn
    ]

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }

  statement {
    sid    = "AllowCloudWatchLogsPutObject"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["logs.${data.aws_region.current.name}.amazonaws.com"]
    }

    actions = [
      "s3:PutObject"
    ]

    resources = [
      "${aws_s3_bucket.buckets["backups"].arn}/*"
    ]

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

resource "aws_s3_bucket_policy" "backups" {
  bucket = aws_s3_bucket.buckets["backups"].id
  policy = data.aws_iam_policy_document.backups.json
}

# ==============================================================================
# S3 Bucket Notifications (Optional - for automated processing)
# ==============================================================================

# resource "aws_s3_bucket_notification" "buckets" {
#   for_each = { for k, v in var.buckets : k => v if lookup(v, "enable_notifications", false) }
#
#   bucket = aws_s3_bucket.buckets[each.key].id
#
#   lambda_function {
#     lambda_function_arn = var.notification_lambda_arn
#     events              = ["s3:ObjectCreated:*"]
#   }
# }
