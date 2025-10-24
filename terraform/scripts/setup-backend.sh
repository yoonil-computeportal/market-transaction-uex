#!/bin/bash
# ==============================================================================
# Setup Terraform Backend
# ==============================================================================
#
# This script creates the S3 bucket and DynamoDB table required for
# Terraform remote state management.
#
# Usage:
#   ./scripts/setup-backend.sh [region]
#
# ==============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${1:-us-east-1}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET_NAME="uex-payments-terraform-state-${AWS_ACCOUNT_ID}"
DYNAMODB_TABLE="uex-payments-terraform-locks"

echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}Setting up Terraform Backend${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo ""
echo "AWS Region:      ${AWS_REGION}"
echo "AWS Account ID:  ${AWS_ACCOUNT_ID}"
echo "S3 Bucket:       ${BUCKET_NAME}"
echo "DynamoDB Table:  ${DYNAMODB_TABLE}"
echo ""

# Check if bucket already exists
if aws s3 ls "s3://${BUCKET_NAME}" 2>&1 | grep -q 'NoSuchBucket'; then
    echo -e "${YELLOW}Creating S3 bucket for Terraform state...${NC}"

    if [ "${AWS_REGION}" == "us-east-1" ]; then
        aws s3api create-bucket \
          --bucket "${BUCKET_NAME}" \
          --region "${AWS_REGION}"
    else
        aws s3api create-bucket \
          --bucket "${BUCKET_NAME}" \
          --region "${AWS_REGION}" \
          --create-bucket-configuration LocationConstraint="${AWS_REGION}"
    fi
    echo -e "${GREEN}✓ S3 bucket created${NC}"
else
    echo -e "${GREEN}✓ S3 bucket already exists${NC}"
fi

# Enable versioning
echo -e "${YELLOW}Enabling versioning on S3 bucket...${NC}"
aws s3api put-bucket-versioning \
  --bucket "${BUCKET_NAME}" \
  --versioning-configuration Status=Enabled
echo -e "${GREEN}✓ Versioning enabled${NC}"

# Enable encryption
echo -e "${YELLOW}Enabling encryption on S3 bucket...${NC}"
aws s3api put-bucket-encryption \
  --bucket "${BUCKET_NAME}" \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
echo -e "${GREEN}✓ Encryption enabled${NC}"

# Block public access
echo -e "${YELLOW}Blocking public access on S3 bucket...${NC}"
aws s3api put-public-access-block \
  --bucket "${BUCKET_NAME}" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
echo -e "${GREEN}✓ Public access blocked${NC}"

# Check if DynamoDB table exists
if aws dynamodb describe-table --table-name "${DYNAMODB_TABLE}" --region "${AWS_REGION}" 2>&1 | grep -q 'ResourceNotFoundException'; then
    echo -e "${YELLOW}Creating DynamoDB table for state locking...${NC}"
    aws dynamodb create-table \
      --table-name "${DYNAMODB_TABLE}" \
      --attribute-definitions AttributeName=LockID,AttributeType=S \
      --key-schema AttributeName=LockID,KeyType=HASH \
      --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
      --region "${AWS_REGION}" \
      --tags Key=Project,Value=UEX-Payment-Processing Key=Purpose,Value=TerraformStateLocking

    echo -e "${YELLOW}Waiting for table to be active...${NC}"
    aws dynamodb wait table-exists --table-name "${DYNAMODB_TABLE}" --region "${AWS_REGION}"
    echo -e "${GREEN}✓ DynamoDB table created${NC}"
else
    echo -e "${GREEN}✓ DynamoDB table already exists${NC}"
fi

echo ""
echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}Backend Setup Complete!${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo ""
echo "Update your backend.tf with these values:"
echo ""
echo "  bucket         = \"${BUCKET_NAME}\""
echo "  dynamodb_table = \"${DYNAMODB_TABLE}\""
echo "  region         = \"${AWS_REGION}\""
echo ""
echo "Next steps:"
echo "  1. Update backend.tf with the values above"
echo "  2. Run: terraform init"
echo ""
