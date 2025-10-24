# ==============================================================================
# KMS Module - Outputs
# ==============================================================================

output "key_id" {
  description = "KMS key ID"
  value       = aws_kms_key.main.key_id
}

output "key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.main.arn
}

output "key_alias" {
  description = "KMS key alias"
  value       = aws_kms_alias.main.name
}

output "key_alias_arn" {
  description = "KMS key alias ARN"
  value       = aws_kms_alias.main.arn
}
