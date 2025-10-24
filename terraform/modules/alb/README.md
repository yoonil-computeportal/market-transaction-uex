# Application Load Balancer Module

Production-ready Application Load Balancer with path-based routing for 6 microservices, HTTPS support, health checks, and comprehensive CloudWatch alarms.

## Features

- **Path-based Routing**: Routes traffic to 6 microservices based on URL paths
- **HTTPS Support**: TLS 1.3 with ACM certificate integration
- **HTTP to HTTPS Redirect**: Automatic redirect from HTTP to HTTPS
- **Health Checks**: Per-service health monitoring
- **Access Logs**: ALB logs exported to S3
- **CloudWatch Alarms**: Response time, error rates, unhealthy targets
- **Sticky Sessions**: Optional session affinity support
- **High Availability**: Multi-AZ deployment

## Architecture

```
Internet
    ↓
Application Load Balancer (Multi-AZ)
    ├── HTTP :80  → Redirect to HTTPS
    └── HTTPS :443 → Path-based routing
            ├── /presentation/*      → Presentation Service (3900)
            ├── /client/*            → Client-Tier Service (3901)
            ├── /management/*        → Management-Tier Service (3902)
            ├── /api/uex/*           → UEX Backend Service (3903) ⭐
            ├── /api/processing/*    → Processing-Tier Service (8900)
            └── /api/mgmt/*          → Management Backend Service (9000)
```

## Usage

### Basic Configuration (Development)

```hcl
module "alb" {
  source = "./modules/alb"

  project_name = "uex-payments"
  environment  = "dev"

  # Network
  vpc_id              = module.vpc.vpc_id
  public_subnet_ids   = module.vpc.public_subnet_ids
  alb_security_group_id = module.security.alb_security_group_id

  # HTTPS (optional for dev)
  enable_https    = false
  certificate_arn = ""

  # Access Logs
  enable_access_logs  = false
  access_logs_bucket  = ""

  # Configuration
  enable_deletion_protection = false
  enable_sticky_sessions    = false

  # Alarms
  create_alarms = false

  tags = {
    Environment = "dev"
    Terraform   = "true"
  }
}
```

### Production Configuration

```hcl
module "alb" {
  source = "./modules/alb"

  project_name = "uex-payments"
  environment  = "prod"

  # Network
  vpc_id              = module.vpc.vpc_id
  public_subnet_ids   = module.vpc.public_subnet_ids
  alb_security_group_id = module.security.alb_security_group_id
  internal           = false

  # HTTPS
  enable_https    = true
  certificate_arn = module.acm.certificate_arn
  ssl_policy      = "ELBSecurityPolicy-TLS13-1-2-2021-06"

  # Access Logs
  enable_access_logs  = true
  access_logs_bucket  = module.s3.logs_bucket_name
  access_logs_prefix  = "alb-logs"

  # ALB Configuration
  enable_deletion_protection       = true
  enable_http2                    = true
  enable_cross_zone_load_balancing = true
  idle_timeout                    = 60

  # Target Groups
  deregistration_delay    = 30
  enable_sticky_sessions  = false
  sticky_session_duration = 86400

  # Health Checks
  health_check_healthy_threshold   = 2
  health_check_unhealthy_threshold = 3
  health_check_timeout            = 5
  health_check_interval           = 30

  # Alarms
  create_alarms                 = true
  alarm_sns_topic_arn          = module.sns.critical_topic_arn
  target_response_time_threshold = 2.0
  http_5xx_threshold           = 10
  http_4xx_threshold           = 50
  min_request_count_threshold  = 10

  tags = {
    Environment = "prod"
    Terraform   = "true"
  }
}
```

### Internal ALB Configuration

```hcl
module "alb_internal" {
  source = "./modules/alb"

  project_name = "uex-payments"
  environment  = "prod"

  # Network
  vpc_id              = module.vpc.vpc_id
  public_subnet_ids   = module.vpc.private_app_subnet_ids  # Use private subnets
  alb_security_group_id = module.security.alb_internal_security_group_id
  internal           = true  # Internal ALB

  # HTTPS
  enable_https    = true
  certificate_arn = module.acm.certificate_arn

  # Rest of configuration...

  tags = {
    Environment = "prod"
    Type        = "internal"
    Terraform   = "true"
  }
}
```

## Variables

### Required Variables

| Name | Description | Type |
|------|-------------|------|
| `project_name` | Project name for resource naming | `string` |
| `environment` | Environment (dev/staging/prod) | `string` |
| `vpc_id` | VPC ID for target groups | `string` |
| `public_subnet_ids` | List of public subnet IDs | `list(string)` |
| `alb_security_group_id` | Security group ID for ALB | `string` |

### Optional Variables

| Name | Description | Type | Default |
|------|-------------|------|---------|
| `internal` | Internal ALB (not internet-facing) | `bool` | `false` |
| `enable_https` | Enable HTTPS listener | `bool` | `true` |
| `certificate_arn` | ACM certificate ARN | `string` | `""` |
| `ssl_policy` | SSL/TLS policy | `string` | `"ELBSecurityPolicy-TLS13-1-2-2021-06"` |
| `enable_access_logs` | Enable access logs to S3 | `bool` | `true` |
| `access_logs_bucket` | S3 bucket for logs | `string` | `""` |
| `enable_deletion_protection` | Prevent accidental deletion | `bool` | `true` |
| `enable_sticky_sessions` | Enable session affinity | `bool` | `false` |
| `deregistration_delay` | Target deregistration delay (sec) | `number` | `30` |
| `health_check_interval` | Health check interval (sec) | `number` | `30` |
| `create_alarms` | Create CloudWatch alarms | `bool` | `true` |

See [variables.tf](./variables.tf) for complete list with validation rules.

## Outputs

### ALB Information

| Name | Description |
|------|-------------|
| `alb_dns_name` | ALB DNS name |
| `alb_arn` | ALB ARN |
| `alb_zone_id` | Hosted zone ID for Route53 |
| `http_listener_arn` | HTTP listener ARN |
| `https_listener_arn` | HTTPS listener ARN |

### Target Groups

| Name | Description |
|------|-------------|
| `target_group_arns` | Map of service names to TG ARNs |
| `target_group_names` | Map of service names to TG names |
| `presentation_target_group_arn` | Presentation TG ARN |
| `uex_backend_target_group_arn` | UEX Backend TG ARN |
| ... | (and 4 more services) |

### Service Endpoints

| Name | Description |
|------|-------------|
| `service_endpoints` | Map of full service URLs |
| `health_check_urls` | Map of health check URLs |
| `routing_rules` | Routing configuration summary |

### Commands

| Name | Description |
|------|-------------|
| `test_commands` | curl commands to test each service |
| `describe_target_health_command` | AWS CLI commands to check health |

## Path-based Routing

The ALB routes traffic based on URL paths:

| Path Pattern | Target Service | Port | Priority |
|--------------|----------------|------|----------|
| `/presentation/*` | Presentation | 3900 | 100 |
| `/client/*` | Client-Tier | 3901 | 200 |
| `/management/*` | Management-Tier | 3902 | 300 |
| `/api/uex/*` | UEX Backend | 3903 | 400 |
| `/api/processing/*` | Processing-Tier | 8900 | 500 |
| `/api/mgmt/*` | Management Backend | 9000 | 600 |
| `/*` (default) | 404 Response | - | - |

## Health Checks

Each target group has its own health check endpoint:

| Service | Health Check Path | Expected Status |
|---------|------------------|-----------------|
| Presentation | `/presentation/health` | 200 |
| Client-Tier | `/client/health` | 200 |
| Management-Tier | `/management/health` | 200 |
| UEX Backend | `/api/uex/health` | 200 |
| Processing-Tier | `/api/processing/health` | 200 |
| Management Backend | `/api/mgmt/health` | 200 |

**Health Check Configuration:**
- Interval: 30 seconds (configurable)
- Timeout: 5 seconds
- Healthy threshold: 2 consecutive successes
- Unhealthy threshold: 3 consecutive failures

## CloudWatch Alarms

The module creates these alarms when `create_alarms = true`:

### Per-Service Alarms

1. **Unhealthy Targets** - Triggers when any target is unhealthy
2. **High Response Time** - Triggers when P95 response time > 2 seconds

### ALB-wide Alarms

3. **5xx Errors** - Triggers when 5xx count > 10 per 5 minutes
4. **4xx Errors** - Triggers when 4xx count > 50 per 5 minutes
5. **Low Request Count** - Triggers when requests < 10 (possible outage)

## SSL/TLS Configuration

### Supported SSL Policies

| Policy | TLS Versions | Use Case |
|--------|-------------|----------|
| `ELBSecurityPolicy-TLS13-1-2-2021-06` | TLS 1.3, 1.2 | **Recommended** - Best security |
| `ELBSecurityPolicy-TLS-1-2-2017-01` | TLS 1.2 | Legacy compatibility |
| `ELBSecurityPolicy-TLS-1-1-2017-01` | TLS 1.1, 1.0 | Very old clients |

### ACM Certificate Setup

```bash
# Request certificate
aws acm request-certificate \
  --domain-name api.example.com \
  --validation-method DNS \
  --subject-alternative-names "*.api.example.com"

# Validate via DNS (add CNAME records from ACM console)

# Get certificate ARN
aws acm list-certificates
```

## Access Logs

Access logs are stored in S3 with the following format:

```
s3://bucket-name/alb-logs/AWSLogs/account-id/elasticloadbalancing/region/yyyy/mm/dd/
```

**Log Fields:**
- Request time
- Client IP
- Request path
- Response status
- Response time
- Target IP
- User agent

**Query with Athena:**

```sql
CREATE EXTERNAL TABLE IF NOT EXISTS alb_logs (
  type string,
  time string,
  elb string,
  client_ip string,
  target_ip string,
  request_processing_time double,
  target_processing_time double,
  response_processing_time double,
  elb_status_code int,
  target_status_code int,
  received_bytes bigint,
  sent_bytes bigint,
  request_verb string,
  request_url string,
  request_proto string,
  user_agent string
)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.RegexSerDe'
WITH SERDEPROPERTIES (
  'serialization.format' = '1',
  'input.regex' = '...'
)
LOCATION 's3://bucket-name/alb-logs/';
```

## Sticky Sessions

Enable sticky sessions for stateful applications:

```hcl
enable_sticky_sessions  = true
sticky_session_duration = 86400  # 24 hours
```

**When to use:**
- Shopping carts
- Session-based authentication (prefer JWT instead)
- WebSocket connections

**Not recommended for:**
- Stateless REST APIs
- Services with JWT authentication
- High-traffic APIs (reduces load distribution)

## Testing

### Test Health Endpoints

```bash
# Set ALB DNS
ALB_DNS="uex-payments-prod-alb-1234567890.us-east-1.elb.amazonaws.com"

# Test all services
curl -i https://${ALB_DNS}/presentation/health
curl -i https://${ALB_DNS}/client/health
curl -i https://${ALB_DNS}/management/health
curl -i https://${ALB_DNS}/api/uex/health
curl -i https://${ALB_DNS}/api/processing/health
curl -i https://${ALB_DNS}/api/mgmt/health
```

### Check Target Health

```bash
# Get target group ARN
TG_ARN=$(aws elbv2 describe-target-groups \
  --names uex-payments-prod-uex-backend-tg \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

# Check health
aws elbv2 describe-target-health --target-group-arn $TG_ARN
```

### Load Testing

```bash
# Using Apache Bench
ab -n 10000 -c 100 https://${ALB_DNS}/api/uex/health

# Using hey
hey -n 10000 -c 100 https://${ALB_DNS}/api/uex/health

# Using wrk
wrk -t10 -c100 -d30s https://${ALB_DNS}/api/uex/health
```

## Monitoring

### View ALB Metrics

```bash
# Request count
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name RequestCount \
  --dimensions Name=LoadBalancer,Value=app/uex-payments-prod-alb/xxx \
  --start-time 2025-01-20T00:00:00Z \
  --end-time 2025-01-20T23:59:59Z \
  --period 300 \
  --statistics Sum

# Target response time
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=app/uex-payments-prod-alb/xxx \
  --start-time 2025-01-20T00:00:00Z \
  --end-time 2025-01-20T23:59:59Z \
  --period 300 \
  --statistics Average,p95,p99
```

### View Access Logs

```bash
# Download recent logs
aws s3 sync s3://bucket-name/alb-logs/ ./logs/ \
  --exclude "*" \
  --include "*/2025/01/20/*"

# Parse logs
cat logs/*.log | grep "/api/uex/" | cut -d' ' -f9 | sort | uniq -c
```

## Troubleshooting

### 502 Bad Gateway

**Causes:**
- Target is unhealthy
- Target is not listening on the correct port
- Security group blocking traffic
- Target returning invalid response

**Debug:**
```bash
# Check target health
aws elbv2 describe-target-health --target-group-arn $TG_ARN

# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxx

# Check ECS task logs
aws logs tail /aws/ecs/uex-payments-prod-uex-backend
```

### 503 Service Unavailable

**Causes:**
- No healthy targets
- Target group empty
- All targets deregistering

**Debug:**
```bash
# Check target count
aws elbv2 describe-target-health --target-group-arn $TG_ARN

# Check ECS service
aws ecs describe-services --cluster xxx --services uex-backend
```

### 504 Gateway Timeout

**Causes:**
- Target taking too long to respond
- Idle timeout too low
- Target connection issues

**Debug:**
```bash
# Increase idle timeout
terraform apply -var="idle_timeout=120"

# Check target response time
aws cloudwatch get-metric-statistics \
  --metric-name TargetResponseTime \
  --namespace AWS/ApplicationELB
```

### Unhealthy Targets

**Causes:**
- Health check path returns non-200 status
- Health check timeout too short
- Application not ready

**Debug:**
```bash
# Test health check from within VPC
curl -i http://target-ip:3903/api/uex/health

# Check health check configuration
aws elbv2 describe-target-groups --target-group-arns $TG_ARN
```

## Cost Optimization

1. **Right-size ALB**: Consider using Network Load Balancer for simple TCP routing (cheaper)
2. **Access logs**: Disable for dev/staging to reduce S3 costs
3. **Idle timeout**: Reduce for short-lived connections
4. **Cross-zone load balancing**: Disable if all targets in same AZ (saves data transfer costs)

**Typical Costs:**
- ALB: ~$22/month base + $0.008 per LCU-hour
- Data processing: $0.008 per GB
- Access logs storage: $0.023 per GB/month (S3)

## Dependencies

This module requires:
- VPC module (for VPC ID and subnet IDs)
- Security module (for ALB security group)
- S3 module (for access logs)
- ACM certificate (for HTTPS)

## Notes

- ACM certificate must be in the same region as the ALB
- Health check paths must return 200 status code
- Sticky sessions use cookies (not suitable for APIs consumed by mobile apps)
- Deletion protection prevents accidental deletion (recommended for production)
- Use internal ALB for backend-to-backend communication
- Path patterns are case-sensitive

## References

- [Application Load Balancer Documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
- [ALB Best Practices](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-best-practices.html)
- [Target Group Health Checks](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html)
