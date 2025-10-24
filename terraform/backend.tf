# ============================================================================
# UEX Payment Processing System - Terraform Backend Configuration
# ============================================================================
#
# This file configures the Terraform backend for storing state files remotely.
# Remote state enables team collaboration, state locking, and version history.
#
# SETUP INSTRUCTIONS:
# 1. Create an S3 bucket for state storage
# 2. Create a DynamoDB table for state locking
# 3. Update the bucket, key, and region values below
# 4. Run: terraform init -backend-config=backend.tf
#
# ============================================================================

terraform {
  backend "s3" {
    # S3 bucket for storing Terraform state
    # Create this bucket manually before running terraform init
    # Example: uex-payments-terraform-state-<account-id>
    bucket = "uex-payments-terraform-state"

    # Path to the state file within the bucket
    # Use different keys for different environments
    # Example: dev/terraform.tfstate, staging/terraform.tfstate, prod/terraform.tfstate
    key = "terraform.tfstate"

    # AWS region where the S3 bucket is located
    region = "us-east-1"

    # DynamoDB table for state locking
    # Create this table manually before running terraform init
    # Table must have a primary key named 'LockID' with type String
    # Example: uex-payments-terraform-locks
    dynamodb_table = "uex-payments-terraform-locks"

    # Enable encryption at rest
    encrypt = true

    # Optional: KMS key for encryption (use default AWS-managed key if not specified)
    # kms_key_id = "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012"

    # Optional: Server-side encryption algorithm
    # Use "AES256" for AWS-managed encryption or "aws:kms" for KMS encryption
    # sse_customer_algorithm = "AES256"

    # Enable versioning on the S3 bucket (recommended)
    # This is a bucket-level setting, not a backend config
    # versioning {
    #   enabled = true
    # }

    # Workspace key prefix (for multi-workspace setups)
    # workspace_key_prefix = "workspaces"

    # IAM role to assume for backend operations (if using cross-account)
    # role_arn = "arn:aws:iam::123456789012:role/TerraformBackendRole"

    # Skip credentials validation (useful for testing)
    # skip_credentials_validation = false

    # Skip metadata API check (useful for testing)
    # skip_metadata_api_check = false

    # Skip region validation
    # skip_region_validation = false
  }
}

# ============================================================================
# Backend Setup Script
# ============================================================================
#
# Use this script to create the S3 bucket and DynamoDB table:
#
# #!/bin/bash
#
# # Configuration
# AWS_REGION="us-east-1"
# AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
# BUCKET_NAME="uex-payments-terraform-state-${AWS_ACCOUNT_ID}"
# DYNAMODB_TABLE="uex-payments-terraform-locks"
#
# echo "Creating S3 bucket for Terraform state..."
# aws s3api create-bucket \
#   --bucket ${BUCKET_NAME} \
#   --region ${AWS_REGION} \
#   --create-bucket-configuration LocationConstraint=${AWS_REGION}
#
# echo "Enabling versioning on S3 bucket..."
# aws s3api put-bucket-versioning \
#   --bucket ${BUCKET_NAME} \
#   --versioning-configuration Status=Enabled
#
# echo "Enabling encryption on S3 bucket..."
# aws s3api put-bucket-encryption \
#   --bucket ${BUCKET_NAME} \
#   --server-side-encryption-configuration '{
#     "Rules": [{
#       "ApplyServerSideEncryptionByDefault": {
#         "SSEAlgorithm": "AES256"
#       }
#     }]
#   }'
#
# echo "Blocking public access on S3 bucket..."
# aws s3api put-public-access-block \
#   --bucket ${BUCKET_NAME} \
#   --public-access-block-configuration \
#     "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
#
# echo "Creating DynamoDB table for state locking..."
# aws dynamodb create-table \
#   --table-name ${DYNAMODB_TABLE} \
#   --attribute-definitions AttributeName=LockID,AttributeType=S \
#   --key-schema AttributeName=LockID,KeyType=HASH \
#   --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
#   --region ${AWS_REGION} \
#   --tags Key=Project,Value=UEX-Payment-Processing Key=Purpose,Value=TerraformStateLocking
#
# echo "Backend resources created successfully!"
# echo "Bucket: ${BUCKET_NAME}"
# echo "DynamoDB Table: ${DYNAMODB_TABLE}"
# echo ""
# echo "Update your backend.tf with these values:"
# echo "  bucket = \"${BUCKET_NAME}\""
# echo "  dynamodb_table = \"${DYNAMODB_TABLE}\""
#
# ============================================================================

# ============================================================================
# Environment-Specific Backend Configuration
# ============================================================================
#
# For environment-specific backends, create separate backend config files:
#
# backend-dev.hcl:
# ─────────────────
# bucket         = "uex-payments-terraform-state"
# key            = "dev/terraform.tfstate"
# region         = "us-east-1"
# dynamodb_table = "uex-payments-terraform-locks"
# encrypt        = true
#
# backend-staging.hcl:
# ────────────────────
# bucket         = "uex-payments-terraform-state"
# key            = "staging/terraform.tfstate"
# region         = "us-east-1"
# dynamodb_table = "uex-payments-terraform-locks"
# encrypt        = true
#
# backend-prod.hcl:
# ─────────────────
# bucket         = "uex-payments-terraform-state"
# key            = "prod/terraform.tfstate"
# region         = "us-east-1"
# dynamodb_table = "uex-payments-terraform-locks"
# encrypt        = true
#
# Initialize with specific backend:
# terraform init -backend-config=backend-prod.hcl
#
# ============================================================================

# ============================================================================
# State Migration
# ============================================================================
#
# If you need to migrate from local state to remote state:
#
# 1. Comment out or remove the backend configuration above
# 2. Run: terraform init
# 3. Uncomment the backend configuration
# 4. Run: terraform init -migrate-state
# 5. Confirm the migration when prompted
#
# To migrate between backends:
# terraform init -migrate-state -backend-config=backend-new.hcl
#
# ============================================================================

# ============================================================================
# State Locking
# ============================================================================
#
# DynamoDB table schema for state locking:
#
# Table Name: uex-payments-terraform-locks
# Primary Key: LockID (String)
#
# The LockID format is: <bucket>/<key>
# Example: uex-payments-terraform-state/prod/terraform.tfstate
#
# When terraform acquires a lock, it writes:
# - Info: Information about who has the lock
# - Digest: State file digest
#
# If terraform crashes, manually remove the lock:
# aws dynamodb delete-item \
#   --table-name uex-payments-terraform-locks \
#   --key '{"LockID":{"S":"uex-payments-terraform-state/prod/terraform.tfstate"}}'
#
# ============================================================================

# ============================================================================
# Best Practices
# ============================================================================
#
# 1. Use separate state files for each environment
# 2. Enable versioning on the S3 bucket
# 3. Enable encryption on the S3 bucket
# 4. Block public access on the S3 bucket
# 5. Use IAM policies to restrict access to state files
# 6. Enable MFA Delete on the S3 bucket for production
# 7. Regularly backup state files
# 8. Use state locking to prevent concurrent modifications
# 9. Never commit state files to version control
# 10. Use workspaces for temporary environments only
#
# ============================================================================

# ============================================================================
# IAM Policy for Terraform Backend Access
# ============================================================================
#
# {
#   "Version": "2012-10-17",
#   "Statement": [
#     {
#       "Effect": "Allow",
#       "Action": [
#         "s3:ListBucket",
#         "s3:GetBucketVersioning"
#       ],
#       "Resource": "arn:aws:s3:::uex-payments-terraform-state"
#     },
#     {
#       "Effect": "Allow",
#       "Action": [
#         "s3:GetObject",
#         "s3:PutObject",
#         "s3:DeleteObject"
#       ],
#       "Resource": "arn:aws:s3:::uex-payments-terraform-state/*"
#     },
#     {
#       "Effect": "Allow",
#       "Action": [
#         "dynamodb:GetItem",
#         "dynamodb:PutItem",
#         "dynamodb:DeleteItem"
#       ],
#       "Resource": "arn:aws:dynamodb:us-east-1:*:table/uex-payments-terraform-locks"
#     }
#   ]
# }
#
# ============================================================================
