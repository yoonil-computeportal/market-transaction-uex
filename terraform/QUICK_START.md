# Terraform Quick Start Guide

## 🚀 Get Started in 15 Minutes

This guide will help you deploy the UEX Payment Processing System infrastructure to AWS using Terraform.

---

## Prerequisites Checklist

- [ ] AWS Account with admin access
- [ ] Terraform 1.5+ installed (`terraform version`)
- [ ] AWS CLI installed and configured (`aws sts get-caller-identity`)
- [ ] UEX referral code (get from https://uex.us/referrals)
- [ ] Docker images built and pushed to ECR (optional for initial setup)

---

## Step 1: Set Up AWS Backend (5 minutes)

Create S3 bucket and DynamoDB table for Terraform state:

```bash
# Set your AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION="us-east-1"

# Create S3 bucket for state
aws s3api create-bucket \
  --bucket uex-payments-terraform-state-${AWS_ACCOUNT_ID} \
  --region ${AWS_REGION}

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket uex-payments-terraform-state-${AWS_ACCOUNT_ID} \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket uex-payments-terraform-state-${AWS_ACCOUNT_ID} \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket uex-payments-terraform-state-${AWS_ACCOUNT_ID} \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name uex-payments-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region ${AWS_REGION}

echo "✅ Backend resources created!"
```

---

## Step 2: Configure Variables (3 minutes)

```bash
cd terraform

# Copy example file
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
vim terraform.tfvars
```

**Minimum required values:**

```hcl
# terraform.tfvars
project_name = "uex-payments"
environment  = "dev"
aws_region   = "us-east-1"

# UEX Configuration (REQUIRED)
uex_referral_code = "YOUR_REFERRAL_CODE_HERE"  # Get from https://uex.us/referrals

# Database (auto-generates password if left empty)
db_master_password = ""

# Networking
vpc_cidr             = "10.0.0.0/16"
availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs_app  = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
private_subnet_cidrs_data = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]
```

---

## Step 3: Update Backend Configuration (2 minutes)

Edit `backend.tf`:

```hcl
terraform {
  backend "s3" {
    bucket         = "uex-payments-terraform-state-<YOUR_ACCOUNT_ID>"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "uex-payments-terraform-locks"
    encrypt        = true
  }
}
```

---

## Step 4: Initialize Terraform (1 minute)

```bash
terraform init
```

Expected output:
```
Initializing the backend...
Successfully configured the backend "s3"!
...
Terraform has been successfully initialized!
```

---

## Step 5: Plan Deployment (2 minutes)

```bash
terraform plan -out=tfplan
```

Review the plan. You should see resources to be created:
- VPC and subnets
- RDS PostgreSQL instance
- ElastiCache Redis cluster
- ECS cluster and services
- Application Load Balancer
- Security groups
- And more...

---

## Step 6: Apply Infrastructure (10-15 minutes)

```bash
terraform apply tfplan
```

Type `yes` when prompted.

**Expected time**: 10-15 minutes (RDS takes the longest)

---

## Step 7: Verify Deployment (2 minutes)

```bash
# Get all outputs
terraform output

# Get ALB URL
terraform output alb_url

# Test ALB health
curl $(terraform output -raw alb_url)
```

---

## Step 8: Access Services

### Get Connection Information

```bash
# Database endpoint (use Secrets Manager for password)
terraform output rds_endpoint

# Redis endpoint
terraform output redis_endpoint

# ALB URL
terraform output alb_url

# ECR repositories
terraform output ecr_repository_urls

# CloudWatch dashboard
terraform output cloudwatch_dashboard_url
```

### Get Secrets

```bash
# Get database password
aws secretsmanager get-secret-value \
  --secret-id uex-payments/dev/database \
  --query SecretString \
  --output text | jq -r .password

# Get all UEX credentials
aws secretsmanager get-secret-value \
  --secret-id uex-payments/dev/uex-credentials \
  --query SecretString \
  --output text | jq .
```

---

## Next Steps

### 1. Deploy Application

```bash
# Build Docker images
cd ../
docker-compose build

# Push to ECR
./scripts/push-to-ecr.sh

# Force ECS redeployment
aws ecs update-service \
  --cluster uex-payments-dev \
  --service uex-backend \
  --force-new-deployment
```

### 2. Run Database Migrations

```bash
# Get database endpoint
DB_ENDPOINT=$(terraform output -raw rds_endpoint)

# Run migrations
npm run migrate
```

### 3. Configure Monitoring

```bash
# Open CloudWatch dashboard
open $(terraform output -raw cloudwatch_dashboard_url)

# Set up email alerts
aws sns subscribe \
  --topic-arn $(terraform output -raw sns_critical_topic_arn) \
  --protocol email \
  --notification-endpoint your-email@example.com
```

---

## Troubleshooting

### Issue: Terraform init fails

**Error**: `Error configuring the backend "s3"`

**Solution**:
```bash
# Verify S3 bucket exists
aws s3 ls s3://uex-payments-terraform-state-${AWS_ACCOUNT_ID}

# Verify DynamoDB table exists
aws dynamodb describe-table --table-name uex-payments-terraform-locks
```

### Issue: Apply fails with "Insufficient permissions"

**Solution**:
```bash
# Check your AWS credentials
aws sts get-caller-identity

# Verify you have admin access
aws iam list-attached-user-policies --user-name $(aws sts get-caller-identity --query Arn --output text | cut -d'/' -f2)
```

### Issue: RDS creation takes too long

**Normal behavior**: RDS instances take 10-15 minutes to create. Be patient!

To monitor progress:
```bash
watch -n 30 'aws rds describe-db-instances --db-instance-identifier uex-payments-dev | jq .DBInstances[0].DBInstanceStatus'
```

---

## Cleaning Up

### Destroy Infrastructure

```bash
# Plan destruction
terraform plan -destroy -out=destroy.tfplan

# Review what will be destroyed
terraform show destroy.tfplan

# Execute destruction
terraform apply destroy.tfplan
```

**Warning**: This will delete:
- All databases (backups retained based on retention policy)
- All ECS services and tasks
- All network infrastructure
- All monitoring and logs

---

## Cost Estimation

### Development Environment: ~$150/month

- VPC: $32 (NAT Gateways)
- RDS: $60 (db.t3.medium)
- Redis: $15 (cache.t3.micro)
- ECS: $45 (Fargate tasks)
- ALB: $20
- CloudWatch: $10
- S3: $3
- Secrets Manager: $5

**Total**: ~$190/month

### Staging Environment: ~$400/month

- Larger instances
- Read replicas
- More tasks
- Multi-AZ

### Production Environment: ~$1,200/month

- Production-grade instances
- Multiple replicas
- High availability
- Advanced monitoring

---

## Useful Commands

```bash
# Show current state
terraform show

# List all resources
terraform state list

# Get specific output
terraform output -raw alb_url

# Refresh state
terraform refresh

# Format all .tf files
terraform fmt -recursive

# Validate configuration
terraform validate

# Create dependency graph
terraform graph | dot -Tpng > graph.png

# Import existing resource
terraform import aws_vpc.main vpc-xxxxx

# Taint resource (force recreation)
terraform taint aws_instance.example

# Show plan in JSON
terraform show -json tfplan | jq .
```

---

## Environment-Specific Deployments

### Development
```bash
cd environments/dev
terraform init
terraform apply
```

### Staging
```bash
cd environments/staging
terraform init
terraform apply
```

### Production
```bash
cd environments/prod
terraform init
terraform apply
```

---

## Support

- **Documentation**: See `README.md` and `TERRAFORM_IMPLEMENTATION_PLAN.md`
- **Issues**: Open a GitHub issue
- **Email**: devops@yourcompany.com

---

## Checklist for Production

Before deploying to production:

- [ ] Review all security groups (restrict access)
- [ ] Enable Multi-AZ for RDS and Redis
- [ ] Set up automated backups
- [ ] Configure CloudWatch alarms
- [ ] Set up SNS email notifications
- [ ] Test disaster recovery procedures
- [ ] Document runbooks
- [ ] Conduct security audit
- [ ] Load test the infrastructure
- [ ] Get stakeholder sign-off

---

**Happy Deploying! 🚀**
