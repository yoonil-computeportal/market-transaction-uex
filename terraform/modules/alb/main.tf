# ==============================================================================
# Application Load Balancer Module - Main Configuration
# ==============================================================================
#
# This module creates an Application Load Balancer with:
# - HTTP listener (redirect to HTTPS)
# - HTTPS listener with ACM certificate
# - 6 Target groups (one per microservice)
# - Path-based routing rules
# - Health checks per service
# - Access logs to S3
# - CloudWatch metrics
#
# Services and ports:
# - Presentation: 3900
# - Client-Tier: 3901
# - Management-Tier: 3902
# - UEX Backend: 3903
# - Processing-Tier: 8900
# - Management Backend: 9000
#
# ==============================================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ==============================================================================
# Application Load Balancer
# ==============================================================================

resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = var.internal
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = var.enable_deletion_protection
  enable_http2              = var.enable_http2
  enable_cross_zone_load_balancing = var.enable_cross_zone_load_balancing
  idle_timeout              = var.idle_timeout

  # Access logs
  dynamic "access_logs" {
    for_each = var.enable_access_logs ? [1] : []
    content {
      bucket  = var.access_logs_bucket
      prefix  = var.access_logs_prefix
      enabled = true
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.project_name}-${var.environment}-alb"
    }
  )
}

# ==============================================================================
# Target Groups
# ==============================================================================

# Presentation Service - Port 3900
resource "aws_lb_target_group" "presentation" {
  name     = "${var.project_name}-${var.environment}-presentation-tg"
  port     = 3900
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = var.health_check_healthy_threshold
    unhealthy_threshold = var.health_check_unhealthy_threshold
    timeout            = var.health_check_timeout
    interval           = var.health_check_interval
    path               = "/presentation/health"
    protocol           = "HTTP"
    matcher            = "200"
  }

  deregistration_delay = var.deregistration_delay

  stickiness {
    enabled         = var.enable_sticky_sessions
    type           = "lb_cookie"
    cookie_duration = var.sticky_session_duration
  }

  tags = merge(
    var.tags,
    {
      Name    = "${var.project_name}-${var.environment}-presentation-tg"
      Service = "presentation"
    }
  )
}

# Client-Tier Service - Port 3901
resource "aws_lb_target_group" "client_tier" {
  name     = "${var.project_name}-${var.environment}-client-tier-tg"
  port     = 3901
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = var.health_check_healthy_threshold
    unhealthy_threshold = var.health_check_unhealthy_threshold
    timeout            = var.health_check_timeout
    interval           = var.health_check_interval
    path               = "/client/health"
    protocol           = "HTTP"
    matcher            = "200"
  }

  deregistration_delay = var.deregistration_delay

  stickiness {
    enabled         = var.enable_sticky_sessions
    type           = "lb_cookie"
    cookie_duration = var.sticky_session_duration
  }

  tags = merge(
    var.tags,
    {
      Name    = "${var.project_name}-${var.environment}-client-tier-tg"
      Service = "client-tier"
    }
  )
}

# Management-Tier Service - Port 3902
resource "aws_lb_target_group" "management_tier" {
  name     = "${var.project_name}-${var.environment}-mgmt-tier-tg"
  port     = 3902
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = var.health_check_healthy_threshold
    unhealthy_threshold = var.health_check_unhealthy_threshold
    timeout            = var.health_check_timeout
    interval           = var.health_check_interval
    path               = "/management/health"
    protocol           = "HTTP"
    matcher            = "200"
  }

  deregistration_delay = var.deregistration_delay

  stickiness {
    enabled         = var.enable_sticky_sessions
    type           = "lb_cookie"
    cookie_duration = var.sticky_session_duration
  }

  tags = merge(
    var.tags,
    {
      Name    = "${var.project_name}-${var.environment}-mgmt-tier-tg"
      Service = "management-tier"
    }
  )
}

# UEX Backend Service - Port 3903 (Main service)
resource "aws_lb_target_group" "uex_backend" {
  name     = "${var.project_name}-${var.environment}-uex-backend-tg"
  port     = 3903
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = var.health_check_healthy_threshold
    unhealthy_threshold = var.health_check_unhealthy_threshold
    timeout            = var.health_check_timeout
    interval           = var.health_check_interval
    path               = "/api/uex/health"
    protocol           = "HTTP"
    matcher            = "200"
  }

  deregistration_delay = var.deregistration_delay

  stickiness {
    enabled         = var.enable_sticky_sessions
    type           = "lb_cookie"
    cookie_duration = var.sticky_session_duration
  }

  tags = merge(
    var.tags,
    {
      Name    = "${var.project_name}-${var.environment}-uex-backend-tg"
      Service = "uex-backend"
    }
  )
}

# Processing-Tier Service - Port 8900
resource "aws_lb_target_group" "processing_tier" {
  name     = "${var.project_name}-${var.environment}-proc-tier-tg"
  port     = 8900
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = var.health_check_healthy_threshold
    unhealthy_threshold = var.health_check_unhealthy_threshold
    timeout            = var.health_check_timeout
    interval           = var.health_check_interval
    path               = "/api/processing/health"
    protocol           = "HTTP"
    matcher            = "200"
  }

  deregistration_delay = var.deregistration_delay

  stickiness {
    enabled         = var.enable_sticky_sessions
    type           = "lb_cookie"
    cookie_duration = var.sticky_session_duration
  }

  tags = merge(
    var.tags,
    {
      Name    = "${var.project_name}-${var.environment}-proc-tier-tg"
      Service = "processing-tier"
    }
  )
}

# Management Backend Service - Port 9000
resource "aws_lb_target_group" "management_backend" {
  name     = "${var.project_name}-${var.environment}-mgmt-backend-tg"
  port     = 9000
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = var.health_check_healthy_threshold
    unhealthy_threshold = var.health_check_unhealthy_threshold
    timeout            = var.health_check_timeout
    interval           = var.health_check_interval
    path               = "/api/mgmt/health"
    protocol           = "HTTP"
    matcher            = "200"
  }

  deregistration_delay = var.deregistration_delay

  stickiness {
    enabled         = var.enable_sticky_sessions
    type           = "lb_cookie"
    cookie_duration = var.sticky_session_duration
  }

  tags = merge(
    var.tags,
    {
      Name    = "${var.project_name}-${var.environment}-mgmt-backend-tg"
      Service = "management-backend"
    }
  )
}

# ==============================================================================
# HTTP Listener (Redirect to HTTPS)
# ==============================================================================

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = var.tags
}

# ==============================================================================
# HTTPS Listener
# ==============================================================================

resource "aws_lb_listener" "https" {
  count = var.enable_https ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = var.ssl_policy
  certificate_arn   = var.certificate_arn

  # Default action - return 404 for unmatched paths
  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "application/json"
      message_body = jsonencode({
        error = "Not Found"
        message = "The requested resource was not found"
      })
      status_code = "404"
    }
  }

  tags = var.tags
}

# ==============================================================================
# Listener Rules - Path-based Routing
# ==============================================================================

# Presentation Service - /presentation/*
resource "aws_lb_listener_rule" "presentation" {
  count = var.enable_https ? 1 : 0

  listener_arn = aws_lb_listener.https[0].arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.presentation.arn
  }

  condition {
    path_pattern {
      values = ["/presentation", "/presentation/*"]
    }
  }

  tags = merge(
    var.tags,
    {
      Service = "presentation"
    }
  )
}

# Client-Tier Service - /client/*
resource "aws_lb_listener_rule" "client_tier" {
  count = var.enable_https ? 1 : 0

  listener_arn = aws_lb_listener.https[0].arn
  priority     = 200

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.client_tier.arn
  }

  condition {
    path_pattern {
      values = ["/client", "/client/*"]
    }
  }

  tags = merge(
    var.tags,
    {
      Service = "client-tier"
    }
  )
}

# Management-Tier Service - /management/*
resource "aws_lb_listener_rule" "management_tier" {
  count = var.enable_https ? 1 : 0

  listener_arn = aws_lb_listener.https[0].arn
  priority     = 300

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.management_tier.arn
  }

  condition {
    path_pattern {
      values = ["/management", "/management/*"]
    }
  }

  tags = merge(
    var.tags,
    {
      Service = "management-tier"
    }
  )
}

# UEX Backend Service - /api/uex/*
resource "aws_lb_listener_rule" "uex_backend" {
  count = var.enable_https ? 1 : 0

  listener_arn = aws_lb_listener.https[0].arn
  priority     = 400

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.uex_backend.arn
  }

  condition {
    path_pattern {
      values = ["/api/uex", "/api/uex/*"]
    }
  }

  tags = merge(
    var.tags,
    {
      Service = "uex-backend"
    }
  )
}

# Processing-Tier Service - /api/processing/*
resource "aws_lb_listener_rule" "processing_tier" {
  count = var.enable_https ? 1 : 0

  listener_arn = aws_lb_listener.https[0].arn
  priority     = 500

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.processing_tier.arn
  }

  condition {
    path_pattern {
      values = ["/api/processing", "/api/processing/*"]
    }
  }

  tags = merge(
    var.tags,
    {
      Service = "processing-tier"
    }
  )
}

# Management Backend Service - /api/mgmt/*
resource "aws_lb_listener_rule" "management_backend" {
  count = var.enable_https ? 1 : 0

  listener_arn = aws_lb_listener.https[0].arn
  priority     = 600

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.management_backend.arn
  }

  condition {
    path_pattern {
      values = ["/api/mgmt", "/api/mgmt/*"]
    }
  }

  tags = merge(
    var.tags,
    {
      Service = "management-backend"
    }
  )
}

# ==============================================================================
# CloudWatch Alarms
# ==============================================================================

# ALB Unhealthy Target Count
resource "aws_cloudwatch_metric_alarm" "unhealthy_targets" {
  for_each = var.create_alarms ? {
    presentation       = aws_lb_target_group.presentation.arn_suffix
    client_tier        = aws_lb_target_group.client_tier.arn_suffix
    management_tier    = aws_lb_target_group.management_tier.arn_suffix
    uex_backend        = aws_lb_target_group.uex_backend.arn_suffix
    processing_tier    = aws_lb_target_group.processing_tier.arn_suffix
    management_backend = aws_lb_target_group.management_backend.arn_suffix
  } : {}

  alarm_name          = "${var.project_name}-${var.environment}-alb-${each.key}-unhealthy"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "UnHealthyHostCount"
  namespace          = "AWS/ApplicationELB"
  period             = "60"
  statistic          = "Maximum"
  threshold          = "0"
  alarm_description  = "Unhealthy targets detected in ${each.key} target group"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = each.value
  }

  tags = var.tags
}

# ALB Target Response Time (P95)
resource "aws_cloudwatch_metric_alarm" "target_response_time" {
  for_each = var.create_alarms ? {
    presentation       = aws_lb_target_group.presentation.arn_suffix
    client_tier        = aws_lb_target_group.client_tier.arn_suffix
    management_tier    = aws_lb_target_group.management_tier.arn_suffix
    uex_backend        = aws_lb_target_group.uex_backend.arn_suffix
    processing_tier    = aws_lb_target_group.processing_tier.arn_suffix
    management_backend = aws_lb_target_group.management_backend.arn_suffix
  } : {}

  alarm_name          = "${var.project_name}-${var.environment}-alb-${each.key}-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "TargetResponseTime"
  namespace          = "AWS/ApplicationELB"
  period             = "300"
  statistic          = "p95"
  threshold          = var.target_response_time_threshold
  alarm_description  = "High response time detected for ${each.key}"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
    TargetGroup  = each.value
  }

  tags = var.tags
}

# ALB 5xx Error Rate
resource "aws_cloudwatch_metric_alarm" "http_5xx" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-alb-5xx-errors-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "HTTPCode_Target_5XX_Count"
  namespace          = "AWS/ApplicationELB"
  period             = "300"
  statistic          = "Sum"
  threshold          = var.http_5xx_threshold
  alarm_description  = "High 5xx error rate detected"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
  treat_missing_data = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = var.tags
}

# ALB 4xx Error Rate
resource "aws_cloudwatch_metric_alarm" "http_4xx" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-alb-4xx-errors-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "HTTPCode_Target_4XX_Count"
  namespace          = "AWS/ApplicationELB"
  period             = "300"
  statistic          = "Sum"
  threshold          = var.http_4xx_threshold
  alarm_description  = "High 4xx error rate detected"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
  treat_missing_data = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = var.tags
}

# ALB Request Count
resource "aws_cloudwatch_metric_alarm" "request_count" {
  count = var.create_alarms ? 1 : 0

  alarm_name          = "${var.project_name}-${var.environment}-alb-requests-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "RequestCount"
  namespace          = "AWS/ApplicationELB"
  period             = "300"
  statistic          = "Sum"
  threshold          = var.min_request_count_threshold
  alarm_description  = "Unusually low request count (possible outage)"
  alarm_actions      = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
  treat_missing_data = "breaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = var.tags
}
