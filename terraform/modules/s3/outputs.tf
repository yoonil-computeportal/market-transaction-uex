# ==============================================================================
# S3 Module - Outputs
# ==============================================================================

output "bucket_ids" {
  description = "Map of bucket names to IDs"
  value       = { for k, v in aws_s3_bucket.buckets : k => v.id }
}

output "bucket_arns" {
  description = "Map of bucket names to ARNs"
  value       = { for k, v in aws_s3_bucket.buckets : k => v.arn }
}

output "bucket_names" {
  description = "Map of bucket names to full bucket names"
  value       = { for k, v in aws_s3_bucket.buckets : k => v.bucket }
}

output "bucket_regional_domain_names" {
  description = "Map of bucket names to regional domain names"
  value       = { for k, v in aws_s3_bucket.buckets : k => v.bucket_regional_domain_name }
}

# ==============================================================================
# Individual Bucket Outputs (for convenience)
# ==============================================================================

output "backups_bucket_name" {
  description = "Name of the backups bucket"
  value       = aws_s3_bucket.buckets["backups"].bucket
}

output "backups_bucket_arn" {
  description = "ARN of the backups bucket"
  value       = aws_s3_bucket.buckets["backups"].arn
}

output "logs_bucket_name" {
  description = "Name of the logs bucket"
  value       = aws_s3_bucket.buckets["logs"].bucket
}

output "logs_bucket_arn" {
  description = "ARN of the logs bucket"
  value       = aws_s3_bucket.buckets["logs"].arn
}
