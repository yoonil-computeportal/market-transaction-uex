# ==============================================================================
# Route53 Module - Outputs
# ==============================================================================

# ==============================================================================
# Hosted Zone Outputs
# ==============================================================================

output "zone_id" {
  description = "Route53 hosted zone ID"
  value       = local.zone_id
}

output "zone_name" {
  description = "Route53 hosted zone name"
  value       = var.domain_name
}

output "name_servers" {
  description = "Name servers for the hosted zone"
  value       = var.create_hosted_zone ? aws_route53_zone.main[0].name_servers : data.aws_route53_zone.main[0].name_servers
}

# ==============================================================================
# DNS Record Outputs
# ==============================================================================

output "fqdn" {
  description = "Fully qualified domain name"
  value       = aws_route53_record.alb.fqdn
}

output "record_name" {
  description = "DNS record name"
  value       = aws_route53_record.alb.name
}

output "application_url" {
  description = "Full HTTPS URL to the application"
  value       = "https://${aws_route53_record.alb.fqdn}"
}

# ==============================================================================
# Service Subdomain Outputs
# ==============================================================================

output "service_fqdns" {
  description = "Map of service FQDNs"
  value = var.create_service_subdomains ? {
    for k, v in aws_route53_record.services : k => v.fqdn
  } : {}
}

output "service_urls" {
  description = "Map of service HTTPS URLs"
  value = var.create_service_subdomains ? {
    for k, v in aws_route53_record.services : k => "https://${v.fqdn}"
  } : {}
}

# ==============================================================================
# Health Check Outputs
# ==============================================================================

output "health_check_id" {
  description = "Route53 health check ID"
  value       = var.create_health_checks ? aws_route53_health_check.alb_health[0].id : null
}

output "health_check_arn" {
  description = "Route53 health check ARN"
  value       = var.create_health_checks ? aws_route53_health_check.alb_health[0].arn : null
}

# ==============================================================================
# DNSSEC Outputs
# ==============================================================================

output "dnssec_enabled" {
  description = "Whether DNSSEC is enabled"
  value       = var.enable_dnssec
}

output "dnssec_status" {
  description = "DNSSEC signing status"
  value       = var.enable_dnssec ? aws_route53_hosted_zone_dnssec.main[0].id : null
}
