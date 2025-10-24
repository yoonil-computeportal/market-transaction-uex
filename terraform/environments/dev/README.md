# Development Environment

## Overview

This directory contains the Terraform configuration for the UEX Payment Processing System **Development** environment.

## Configuration

- **Environment**: `dev`
- **AWS Region**: `us-east-1`
- **Estimated Monthly Cost**: ~$150-200

## Resource Configuration

### Database (RDS PostgreSQL)
- **Instance Class**: `db.t3.medium`
- **Storage**: 50GB (auto-scaling up to 200GB)
- **Multi-AZ**: Disabled
- **Read Replicas**: 0
- **Backup Retention**: 7 days

### Cache (ElastiCache Redis)
- **Node Type**: `cache.t3.micro`
- **Nodes**: 1
- **Multi-AZ**: Disabled

### Compute (ECS Fargate)
- **Services**: 6
- **Desired Count**: 1 per service
- **CPU/Memory**: 512-1024 CPU, 1024-2048 MB
- **Auto-scaling**: 1-3 tasks per service

## Quick Start

### 1. Configure Variables

```bash
# Copy example file
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
vim terraform.tfvars
```

Required variables:
- `uex_referral_code` - Your UEX referral code from https://uex.us/referrals

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Review Plan

```bash
terraform plan -out=tfplan
```

### 4. Apply Configuration

```bash
terraform apply tfplan
```

### 5. Get Outputs

```bash
# All outputs
terraform output

# ALB URL
terraform output alb_url

# ECR repositories
terraform output ecr_repository_urls
```

## Deploying Services

After infrastructure is created:

```bash
# Build and push Docker images
cd ../../..
./scripts/build-and-push.sh dev

# Update ECS services
./scripts/deploy-services.sh dev
```

## Useful Commands

```bash
# View ECS service status
aws ecs describe-services \
  --cluster uex-payments-dev-cluster \
  --services $(terraform output -json ecs_service_names | jq -r '.[]' | tr '\n' ' ') \
  --region us-east-1

# View logs
aws logs tail /ecs/uex-payments-dev/uex-backend --follow

# Force new deployment
aws ecs update-service \
  --cluster uex-payments-dev-cluster \
  --service uex-payments-dev-uex-backend \
  --force-new-deployment
```

## Tearing Down

```bash
# Destroy all resources
terraform destroy

# Or plan destruction first
terraform plan -destroy -out=destroy.tfplan
terraform apply destroy.tfplan
```

## Notes

- This is a development environment - not production-ready
- Single AZ deployment for cost savings
- No read replicas
- Shorter backup retention
- Debug logging enabled
- Lower alarm thresholds
