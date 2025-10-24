# UEX Payment Processing System - Terraform Infrastructure

## Overview

This Terraform configuration deploys the complete UEX Payment Processing System infrastructure on AWS, including:

- **VPC with multi-AZ architecture**
- **RDS PostgreSQL cluster** (primary + read replicas)
- **ECS Fargate** for containerized services
- **Application Load Balancer** with SSL/TLS
- **ElastiCache Redis** for caching
- **CloudWatch** for monitoring and logging
- **Secrets Manager** for credential management
- **Auto-scaling** based on CPU/memory metrics

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          AWS Cloud                               │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      VPC (10.0.0.0/16)                      │ │
│  │                                                              │ │
│  │  ┌─────────────────┐         ┌─────────────────┐           │ │
│  │  │  Public Subnet  │         │  Public Subnet  │           │ │
│  │  │   (us-east-1a)  │         │   (us-east-1b)  │           │ │
│  │  │                 │         │                 │           │ │
│  │  │  ┌───────────┐  │         │  ┌───────────┐  │           │ │
│  │  │  │    ALB    │◄─┼─────────┼──┤    ALB    │  │           │ │
│  │  │  └─────┬─────┘  │         │  └─────┬─────┘  │           │ │
│  │  └────────┼────────┘         └────────┼────────┘           │ │
│  │           │                           │                     │ │
│  │  ┌────────┼───────────────────────────┼────────┐           │ │
│  │  │ Private│Subnet (App Tier)          │        │           │ │
│  │  │        │                           │        │           │ │
│  │  │  ┌─────▼──────┐            ┌──────▼─────┐  │           │ │
│  │  │  │ECS Service │            │ECS Service │  │           │ │
│  │  │  │Presentation│            │Client-Tier │  │           │ │
│  │  │  │  (3900)    │            │   (3901)   │  │           │ │
│  │  │  └────────────┘            └────────────┘  │           │ │
│  │  │                                             │           │ │
│  │  │  ┌────────────┐            ┌────────────┐  │           │ │
│  │  │  │ECS Service │            │ECS Service │  │           │ │
│  │  │  │Mgmt-Tier   │            │UEX Backend │  │           │ │
│  │  │  │  (3902)    │            │   (3903)   │  │           │ │
│  │  │  └────────────┘            └────────────┘  │           │ │
│  │  │                                             │           │ │
│  │  │  ┌────────────┐            ┌────────────┐  │           │ │
│  │  │  │ECS Service │            │ECS Service │  │           │ │
│  │  │  │Process-Tier│            │Mgmt Backend│  │           │ │
│  │  │  │  (8900)    │            │   (9000)   │  │           │ │
│  │  │  └────────────┘            └────────────┘  │           │ │
│  │  └─────────────────────────────────────────┘  │           │ │
│  │                                                │           │ │
│  │  ┌──────────────────────────────────────────┐ │           │ │
│  │  │ Private Subnet (Data Tier)                │ │           │ │
│  │  │                                            │ │           │ │
│  │  │  ┌──────────────┐    ┌─────────────────┐ │ │           │ │
│  │  │  │ RDS Primary  │───►│  RDS Replica    │ │ │           │ │
│  │  │  │ PostgreSQL   │    │  (Read-only)    │ │ │           │ │
│  │  │  └──────────────┘    └─────────────────┘ │ │           │ │
│  │  │                                            │ │           │ │
│  │  │  ┌──────────────┐                         │ │           │ │
│  │  │  │ElastiCache   │                         │ │           │ │
│  │  │  │Redis Cluster │                         │ │           │ │
│  │  │  └──────────────┘                         │ │           │ │
│  │  └──────────────────────────────────────────┘ │           │ │
│  └──────────────────────────────────────────────┘             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  CloudWatch  │  │   Secrets    │  │      S3      │        │
│  │   Logs       │  │   Manager    │  │   (Backups)  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
terraform/
├── README.md                          # This file
├── main.tf                            # Root configuration
├── variables.tf                       # Input variables
├── outputs.tf                         # Output values
├── terraform.tfvars.example           # Example variables file
├── backend.tf                         # Remote state configuration
│
├── modules/
│   ├── vpc/                           # VPC and networking
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── rds/                           # PostgreSQL database
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── ecs/                           # ECS cluster and services
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── alb/                           # Application Load Balancer
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── redis/                         # ElastiCache Redis
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── monitoring/                    # CloudWatch and alarms
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   └── secrets/                       # Secrets Manager
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
│
└── environments/
    ├── dev/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── terraform.tfvars
    │
    ├── staging/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── terraform.tfvars
    │
    └── prod/
        ├── main.tf
        ├── variables.tf
        └── terraform.tfvars
```

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform** >= 1.5.0
3. **AWS CLI** configured with credentials
4. **Docker images** built and pushed to ECR
5. **UEX Account** with KYC verified and referral code

## Quick Start

### 1. Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: us-east-1
```

### 2. Initialize Terraform

```bash
cd terraform/environments/dev
terraform init
```

### 3. Create Variables File

```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 4. Plan Infrastructure

```bash
terraform plan -out=tfplan
```

### 5. Apply Infrastructure

```bash
terraform apply tfplan
```

### 6. Get Outputs

```bash
terraform output
```

## Environment-Specific Configuration

### Development Environment

- **Purpose**: Local development and testing
- **Cost**: ~$150/month
- **Resources**:
  - RDS: db.t3.medium (2 vCPU, 4GB RAM)
  - ECS: 2 tasks per service (0.5 vCPU, 1GB each)
  - ElastiCache: cache.t3.micro
  - No multi-AZ
  - Daily backups (7-day retention)

```bash
cd terraform/environments/dev
terraform apply
```

### Staging Environment

- **Purpose**: Pre-production testing, UAT
- **Cost**: ~$400/month
- **Resources**:
  - RDS: db.t3.large (2 vCPU, 8GB RAM) + 1 read replica
  - ECS: 3 tasks per service (1 vCPU, 2GB each)
  - ElastiCache: cache.t3.small
  - Multi-AZ enabled
  - Daily backups (14-day retention)

```bash
cd terraform/environments/staging
terraform apply
```

### Production Environment

- **Purpose**: Live system serving real users
- **Cost**: ~$1,200/month
- **Resources**:
  - RDS: db.r5.xlarge (4 vCPU, 32GB RAM) + 2 read replicas
  - ECS: 5-10 tasks per service (2 vCPU, 4GB each, auto-scaling)
  - ElastiCache: cache.r5.large (Redis cluster)
  - Multi-AZ with automatic failover
  - Continuous backups + point-in-time recovery
  - 30-day log retention

```bash
cd terraform/environments/prod
terraform apply
```

## Service Configuration

### Port Mapping

| Service | Internal Port | ALB Target | Health Check |
|---------|--------------|------------|--------------|
| Presentation | 3900 | /presentation/* | /health |
| Client-Tier | 3901 | /client/* | /health |
| Management-Tier | 3902 | /management/* | /health |
| UEX Backend | 3903 | /api/uex/* | /api/uex/health |
| Processing-Tier | 8900 | /api/processing/* | /health |
| Management Backend | 9000 | /api/mgmt/* | /health |

### Auto-Scaling Configuration

```hcl
# Scaling based on CPU utilization
cpu_target_value = 70

# Scaling based on memory utilization
memory_target_value = 75

# Min/Max tasks per environment
dev:     min=1, max=3
staging: min=2, max=5
prod:    min=3, max=10
```

## Database Configuration

### PostgreSQL Version

- **Engine**: PostgreSQL 15
- **Character Set**: UTF-8
- **Timezone**: UTC

### Connection Pooling

```hcl
# RDS Parameter Group Settings
max_connections = 200
shared_buffers = "2GB"
effective_cache_size = "6GB"
work_mem = "10MB"
maintenance_work_mem = "512MB"
```

### Backup Configuration

```hcl
# Development
backup_retention_period = 7
backup_window = "03:00-04:00"  # UTC
maintenance_window = "sun:04:00-sun:05:00"

# Production
backup_retention_period = 30
backup_window = "03:00-04:00"  # UTC
maintenance_window = "sun:04:00-sun:05:00"
point_in_time_recovery_enabled = true
```

## Secrets Management

All sensitive credentials are stored in AWS Secrets Manager:

```json
{
  "database": {
    "host": "uex-payments-prod.xxxxx.us-east-1.rds.amazonaws.com",
    "port": 5432,
    "username": "admin",
    "password": "auto-generated-secure-password",
    "database": "uex_payments"
  },
  "uex": {
    "referral_code": "5drfo01pgq88",
    "client_id": "your_merchant_client_id",
    "secret_key": "your_merchant_secret_key",
    "swap_base_url": "https://uexswap.com",
    "merchant_base_url": "https://uex.us"
  },
  "redis": {
    "endpoint": "uex-payments-redis.xxxxx.cache.amazonaws.com",
    "port": 6379
  }
}
```

Access secrets in application:

```bash
aws secretsmanager get-secret-value \
  --secret-id uex-payments/prod/app-secrets \
  --query SecretString \
  --output text
```

## Monitoring and Alerting

### CloudWatch Dashboards

```
/aws/ecs/uex-payments-presentation
/aws/ecs/uex-payments-client-tier
/aws/ecs/uex-payments-management-tier
/aws/ecs/uex-payments-uex-backend
/aws/ecs/uex-payments-processing-tier
/aws/ecs/uex-payments-management-backend
```

### CloudWatch Alarms

#### Critical Alarms (Immediate notification)

- ECS CPU > 80% for 5 minutes
- ECS Memory > 85% for 5 minutes
- RDS CPU > 85% for 10 minutes
- RDS Storage < 20% free
- ALB Target Health < 50%
- 5xx Error Rate > 5%
- RDS Connection Count > 80% of max

#### Warning Alarms (Review within 1 hour)

- ECS CPU > 70% for 10 minutes
- RDS CPU > 70% for 15 minutes
- ALB Response Time > 2 seconds (P95)
- Redis Eviction Rate > 100/min

### SNS Topics

```
uex-payments-prod-critical-alerts
uex-payments-prod-warning-alerts
uex-payments-prod-info-notifications
```

## Security Configuration

### IAM Roles

```
uex-payments-ecs-task-role        # Task execution permissions
uex-payments-ecs-execution-role   # ECS service permissions
uex-payments-rds-monitoring-role  # Enhanced monitoring
```

### Security Groups

```
uex-payments-alb-sg              # Allow 443 from Internet
uex-payments-ecs-sg              # Allow from ALB only
uex-payments-rds-sg              # Allow 5432 from ECS only
uex-payments-redis-sg            # Allow 6379 from ECS only
```

### SSL/TLS Configuration

```hcl
# ACM Certificate for HTTPS
certificate_arn = "arn:aws:acm:us-east-1:xxxx:certificate/xxxx"

# Minimum TLS version
ssl_policy = "ELBSecurityPolicy-TLS-1-2-2017-01"

# HSTS enabled
hsts_max_age = 31536000
```

## Cost Estimation

### Development Environment (~$150/month)

| Resource | Specification | Monthly Cost |
|----------|--------------|--------------|
| RDS PostgreSQL | db.t3.medium | $60 |
| ECS Fargate | 12 tasks (0.5 vCPU, 1GB) | $45 |
| ALB | 1 ALB, minimal traffic | $20 |
| ElastiCache | cache.t3.micro | $15 |
| CloudWatch | Logs + Metrics | $10 |
| **Total** | | **~$150** |

### Staging Environment (~$400/month)

| Resource | Specification | Monthly Cost |
|----------|--------------|--------------|
| RDS PostgreSQL | db.t3.large + replica | $180 |
| ECS Fargate | 18 tasks (1 vCPU, 2GB) | $135 |
| ALB | 1 ALB, moderate traffic | $25 |
| ElastiCache | cache.t3.small | $30 |
| CloudWatch | Logs + Metrics + Alarms | $20 |
| Secrets Manager | 10 secrets | $10 |
| **Total** | | **~$400** |

### Production Environment (~$1,200/month)

| Resource | Specification | Monthly Cost |
|----------|--------------|--------------|
| RDS PostgreSQL | db.r5.xlarge + 2 replicas | $600 |
| ECS Fargate | 30-60 tasks (2 vCPU, 4GB) | $400 |
| ALB | 1 ALB, high traffic | $50 |
| ElastiCache | cache.r5.large cluster | $100 |
| CloudWatch | Logs + Metrics + Alarms | $30 |
| Secrets Manager | 10 secrets | $10 |
| S3 Backups | 1TB storage | $25 |
| **Total** | | **~$1,215** |

## Deployment Process

### Initial Deployment

```bash
# 1. Set up remote state backend
cd terraform
terraform init

# 2. Deploy VPC and networking
terraform apply -target=module.vpc

# 3. Deploy RDS database
terraform apply -target=module.rds

# 4. Run database migrations
./scripts/run-migrations.sh

# 5. Deploy ECS services
terraform apply -target=module.ecs

# 6. Deploy ALB and configure routing
terraform apply -target=module.alb

# 7. Deploy monitoring
terraform apply -target=module.monitoring

# 8. Verify deployment
./scripts/health-check.sh
```

### Update Deployment

```bash
# 1. Build new Docker images
docker build -t uex-payments-presentation:v2 .
docker push xxxxx.dkr.ecr.us-east-1.amazonaws.com/uex-payments-presentation:v2

# 2. Update ECS task definition
terraform apply -target=module.ecs.aws_ecs_task_definition.presentation

# 3. Force new deployment (blue-green)
aws ecs update-service \
  --cluster uex-payments-prod \
  --service presentation \
  --force-new-deployment

# 4. Monitor rollout
./scripts/monitor-deployment.sh
```

### Rollback Procedure

```bash
# 1. Identify previous task definition
aws ecs describe-services \
  --cluster uex-payments-prod \
  --services presentation

# 2. Revert to previous version
aws ecs update-service \
  --cluster uex-payments-prod \
  --service presentation \
  --task-definition uex-payments-presentation:45

# 3. Verify rollback
./scripts/health-check.sh
```

## Disaster Recovery

### Backup Strategy

```
Daily automated backups (RDS + S3)
30-day retention for production
Point-in-time recovery enabled
Cross-region backup replication
```

### Recovery Procedures

#### RDS Failure

```bash
# 1. Promote read replica to primary
aws rds promote-read-replica \
  --db-instance-identifier uex-payments-prod-replica-1

# 2. Update connection strings
terraform apply -var="db_endpoint=new-endpoint"

# 3. Restart ECS services
aws ecs update-service --force-new-deployment
```

#### Region Failure

```bash
# 1. Switch to DR region (us-west-2)
cd terraform/environments/prod-dr
terraform apply

# 2. Restore database from backup
aws rds restore-db-instance-from-snapshot

# 3. Update Route53 to point to DR region
terraform apply -target=module.route53
```

## Maintenance Windows

### Scheduled Maintenance

```
Weekly: Sunday 04:00-05:00 UTC
Monthly: First Sunday of month, 02:00-06:00 UTC
```

### Maintenance Tasks

- Database minor version updates
- OS patching (ECS host instances)
- Security group rule updates
- Certificate renewals (automated)

## Troubleshooting

### Common Issues

#### ECS Tasks Failing to Start

```bash
# Check task logs
aws logs tail /aws/ecs/uex-payments-prod --follow

# Check task definition
aws ecs describe-task-definition \
  --task-definition uex-payments-presentation

# Check IAM permissions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::xxxx:role/uex-payments-ecs-task-role
```

#### Database Connection Issues

```bash
# Test connectivity from ECS task
aws ecs execute-command \
  --cluster uex-payments-prod \
  --task xxx \
  --command "psql -h $DB_HOST -U $DB_USER -d $DB_NAME"

# Check security group rules
aws ec2 describe-security-groups \
  --group-ids sg-xxx
```

#### High Memory Usage

```bash
# Check memory metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization

# Increase task memory
terraform apply -var="task_memory=4096"
```

## Support and Documentation

### Internal Documentation

- Architecture diagrams: `/Specifications/`
- API documentation: Generated by OpenAPI
- Runbooks: `/docs/runbooks/`

### External Resources

- Terraform AWS Provider: https://registry.terraform.io/providers/hashicorp/aws/latest/docs
- AWS ECS Best Practices: https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/
- UEX API Documentation: https://uex-us.stoplight.io/docs/uex

### Team Contacts

- Infrastructure Team: infra@yourcompany.com
- DevOps On-Call: oncall@yourcompany.com
- AWS Support: Enterprise Support Plan

---

## Next Steps

1. Review and customize `terraform.tfvars.example`
2. Set up AWS credentials and S3 backend
3. Deploy to development environment first
4. Run integration tests
5. Deploy to staging for UAT
6. Schedule production deployment

**Important**: Always run `terraform plan` before `terraform apply` to review changes!
