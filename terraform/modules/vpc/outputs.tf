# ==============================================================================
# VPC Module - Outputs
# ==============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "vpc_arn" {
  description = "ARN of the VPC"
  value       = aws_vpc.main.arn
}

# ==============================================================================
# Internet Gateway
# ==============================================================================

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

# ==============================================================================
# Subnets
# ==============================================================================

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "public_subnet_cidrs" {
  description = "CIDR blocks of public subnets"
  value       = aws_subnet.public[*].cidr_block
}

output "private_subnet_ids_app" {
  description = "IDs of private application subnets"
  value       = aws_subnet.private_app[*].id
}

output "private_subnet_cidrs_app" {
  description = "CIDR blocks of private application subnets"
  value       = aws_subnet.private_app[*].cidr_block
}

output "private_subnet_ids_data" {
  description = "IDs of private data subnets"
  value       = aws_subnet.private_data[*].id
}

output "private_subnet_cidrs_data" {
  description = "CIDR blocks of private data subnets"
  value       = aws_subnet.private_data[*].cidr_block
}

# ==============================================================================
# NAT Gateways
# ==============================================================================

output "nat_gateway_ids" {
  description = "IDs of NAT Gateways"
  value       = var.enable_nat_gateway ? aws_nat_gateway.main[*].id : []
}

output "nat_gateway_ips" {
  description = "Elastic IPs of NAT Gateways"
  value       = var.enable_nat_gateway ? aws_eip.nat[*].public_ip : []
}

# ==============================================================================
# Route Tables
# ==============================================================================

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids_app" {
  description = "IDs of private application route tables"
  value       = aws_route_table.private_app[*].id
}

output "private_route_table_ids_data" {
  description = "IDs of private data route tables"
  value       = aws_route_table.private_data[*].id
}

# ==============================================================================
# Subnet Groups
# ==============================================================================

output "database_subnet_group_name" {
  description = "Name of the database subnet group"
  value       = aws_db_subnet_group.main.name
}

output "database_subnet_group_id" {
  description = "ID of the database subnet group"
  value       = aws_db_subnet_group.main.id
}

output "elasticache_subnet_group_name" {
  description = "Name of the ElastiCache subnet group"
  value       = aws_elasticache_subnet_group.main.name
}

output "elasticache_subnet_group_id" {
  description = "ID of the ElastiCache subnet group"
  value       = aws_elasticache_subnet_group.main.id
}

# ==============================================================================
# VPN Gateway
# ==============================================================================

output "vpn_gateway_id" {
  description = "ID of the VPN Gateway"
  value       = var.enable_vpn_gateway ? aws_vpn_gateway.main[0].id : null
}

# ==============================================================================
# Flow Logs
# ==============================================================================

output "flow_logs_log_group_name" {
  description = "Name of the CloudWatch Log Group for VPC Flow Logs"
  value       = var.enable_flow_logs ? aws_cloudwatch_log_group.flow_logs[0].name : null
}

output "flow_logs_iam_role_arn" {
  description = "ARN of the IAM role for VPC Flow Logs"
  value       = var.enable_flow_logs ? aws_iam_role.flow_logs[0].arn : null
}

# ==============================================================================
# Availability Zones
# ==============================================================================

output "availability_zones" {
  description = "List of availability zones used"
  value       = var.availability_zones
}
