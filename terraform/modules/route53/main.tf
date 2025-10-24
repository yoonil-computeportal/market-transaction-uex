# ==============================================================================
# Route53 DNS Module - Main Configuration
# ==============================================================================
#
# This module creates and manages Route53 DNS records for the UEX Payment
# Processing System. It creates A records pointing to the Application Load
# Balancer for each environment.
#
# Features:
# - Hosted zone lookup or creation
# - ALB alias records
# - Health checks for critical endpoints
# - Subdomain records for each environment
# - DNSSEC support (optional)
#
# ==============================================================================

data "aws_region" "current" {}

# ==============================================================================
# Route53 Hosted Zone
# ==============================================================================

# Look up existing hosted zone or create new one
data "aws_route53_zone" "main" {
  count = var.create_hosted_zone ? 0 : 1

  name         = var.domain_name
  private_zone = false
}

resource "aws_route53_zone" "main" {
  count = var.create_hosted_zone ? 1 : 0

  name    = var.domain_name
  comment = "Hosted zone for ${var.project_name} ${var.environment}"

  tags = merge(
    var.tags,
    {
      Name        = "${var.project_name}-${var.environment}-hosted-zone"
      Environment = var.environment
    }
  )
}

locals {
  zone_id = var.create_hosted_zone ? aws_route53_zone.main[0].zone_id : data.aws_route53_zone.main[0].zone_id
}

# ==============================================================================
# ALB Alias Record
# ==============================================================================

# Main domain or subdomain record pointing to ALB
resource "aws_route53_record" "alb" {
  zone_id = local.zone_id
  name    = var.subdomain_prefix != "" ? "${var.subdomain_prefix}.${var.domain_name}" : var.domain_name
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# ==============================================================================
# Health Checks for Critical Endpoints
# ==============================================================================

# Health check for main application endpoint
resource "aws_route53_health_check" "alb_health" {
  count = var.create_health_checks ? 1 : 0

  fqdn              = aws_route53_record.alb.fqdn
  port              = 443
  type              = "HTTPS"
  resource_path     = var.health_check_path
  failure_threshold = var.health_check_failure_threshold
  request_interval  = var.health_check_interval

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-alb-health-check"
    }
  )
}

# Health check alarm (sends to CloudWatch)
resource "aws_cloudwatch_metric_alarm" "health_check" {
  count = var.create_health_checks ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-route53-health-check-failed"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "Route53 health check for ${aws_route53_record.alb.fqdn} has failed"
  alarm_actions       = var.health_check_alarm_sns_topic_arns

  dimensions = {
    HealthCheckId = aws_route53_health_check.alb_health[0].id
  }

  tags = var.tags
}

# ==============================================================================
# Service-Specific Subdomains (Optional)
# ==============================================================================

# Create service-specific subdomains if enabled
resource "aws_route53_record" "services" {
  for_each = var.create_service_subdomains ? var.service_subdomain_names : {}

  zone_id = local.zone_id
  name    = "${each.value}.${var.subdomain_prefix != "" ? "${var.subdomain_prefix}." : ""}${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# ==============================================================================
# TXT Records for Domain Verification (Optional)
# ==============================================================================

# ACM domain verification record
resource "aws_route53_record" "acm_validation" {
  for_each = var.acm_validation_records

  zone_id = local.zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
}

# SPF record for email (if needed)
resource "aws_route53_record" "spf" {
  count = var.create_spf_record ? 1 : 0

  zone_id = local.zone_id
  name    = var.subdomain_prefix != "" ? "${var.subdomain_prefix}.${var.domain_name}" : var.domain_name
  type    = "TXT"
  ttl     = 300
  records = [var.spf_record_value]
}

# ==============================================================================
# DNSSEC Configuration (Optional)
# ==============================================================================

# Enable DNSSEC signing for the hosted zone
resource "aws_route53_key_signing_key" "main" {
  count = var.enable_dnssec ? 1 : 0

  hosted_zone_id             = local.zone_id
  key_management_service_arn = var.dnssec_kms_key_arn
  name                       = "${var.project_name}-${var.environment}-ksk"
}

resource "aws_route53_hosted_zone_dnssec" "main" {
  count = var.enable_dnssec ? 1 : 0

  hosted_zone_id = local.zone_id

  depends_on = [aws_route53_key_signing_key.main]
}

# ==============================================================================
# Latency-Based Routing (Multi-Region Setup)
# ==============================================================================

# This section would be used for multi-region deployments
# Uncomment and configure if deploying to multiple AWS regions

# resource "aws_route53_record" "alb_latency" {
#   count = var.enable_latency_routing ? 1 : 0
#
#   zone_id        = local.zone_id
#   name           = var.subdomain_prefix != "" ? "${var.subdomain_prefix}.${var.domain_name}" : var.domain_name
#   type           = "A"
#   set_identifier = "${data.aws_region.current.name}-primary"
#
#   alias {
#     name                   = var.alb_dns_name
#     zone_id                = var.alb_zone_id
#     evaluate_target_health = true
#   }
#
#   latency_routing_policy {
#     region = data.aws_region.current.name
#   }
# }

# ==============================================================================
# Failover Routing (DR Configuration)
# ==============================================================================

# Failover records for disaster recovery
# Uncomment if you have a DR environment in another region

# resource "aws_route53_record" "alb_primary" {
#   count = var.enable_failover_routing ? 1 : 0
#
#   zone_id        = local.zone_id
#   name           = var.subdomain_prefix != "" ? "${var.subdomain_prefix}.${var.domain_name}" : var.domain_name
#   type           = "A"
#   set_identifier = "primary"
#
#   alias {
#     name                   = var.alb_dns_name
#     zone_id                = var.alb_zone_id
#     evaluate_target_health = true
#   }
#
#   failover_routing_policy {
#     type = "PRIMARY"
#   }
#
#   health_check_id = aws_route53_health_check.alb_health[0].id
# }
#
# resource "aws_route53_record" "alb_secondary" {
#   count = var.enable_failover_routing ? 1 : 0
#
#   zone_id        = local.zone_id
#   name           = var.subdomain_prefix != "" ? "${var.subdomain_prefix}.${var.domain_name}" : var.domain_name
#   type           = "A"
#   set_identifier = "secondary"
#
#   alias {
#     name                   = var.dr_alb_dns_name
#     zone_id                = var.dr_alb_zone_id
#     evaluate_target_health = true
#   }
#
#   failover_routing_policy {
#     type = "SECONDARY"
#   }
# }
