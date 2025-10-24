# RDS PostgreSQL Module

Production-ready RDS PostgreSQL module with high availability, automated backups, performance monitoring, and comprehensive CloudWatch alarms.

## Features

- **High Availability**: Multi-AZ deployment with automatic failover
- **Read Replicas**: Support for 0-2 read replicas for read scaling
- **Automated Backups**: Point-in-time recovery with configurable retention
- **Performance Monitoring**: Performance Insights and Enhanced Monitoring
- **CloudWatch Alarms**: CPU, storage, connections, latency, and replica lag alarms
- **Security**: KMS encryption at rest, SSL/TLS in transit, private subnets
- **Logging**: PostgreSQL and upgrade logs exported to CloudWatch
- **Storage Autoscaling**: Automatic storage scaling based on usage
- **Parameter Optimization**: Tuned parameter group for production workloads

## Usage

### Basic Configuration (Development)

```hcl
module "rds" {
  source = "./modules/rds"

  project_name = "uex-payments"
  environment  = "dev"

  # Network
  db_subnet_ids         = module.vpc.private_data_subnet_ids
  db_security_group_id  = module.security.rds_security_group_id

  # Database
  database_name   = "uex_payments_dev"
  master_username = "dbadmin"
  master_password = var.db_master_password

  # Instance
  db_instance_class = "db.t3.medium"
  allocated_storage = 100
  max_allocated_storage = 200

  # High Availability
  multi_az           = false  # Single-AZ for dev
  read_replica_count = 0

  # Encryption
  kms_key_arn = module.kms.key_arn

  # Monitoring
  monitoring_interval          = 60
  performance_insights_enabled = true
  create_alarms               = false  # Disable alarms for dev

  tags = {
    Environment = "dev"
    Terraform   = "true"
  }
}
```

### Production Configuration

```hcl
module "rds" {
  source = "./modules/rds"

  project_name = "uex-payments"
  environment  = "prod"

  # Network
  db_subnet_ids         = module.vpc.private_data_subnet_ids
  db_security_group_id  = module.security.rds_security_group_id

  # Database
  database_name   = "uex_payments"
  master_username = "dbadmin"
  master_password = var.db_master_password

  # Instance
  db_instance_class = "db.r6g.xlarge"
  allocated_storage = 500
  max_allocated_storage = 2000
  storage_type     = "gp3"

  # High Availability
  multi_az           = true
  read_replica_count = 2
  replica_instance_class = "db.r6g.large"

  # Encryption
  kms_key_arn = module.kms.key_arn

  # Backups
  backup_retention_period = 14
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  skip_final_snapshot    = false
  deletion_protection    = true

  # Monitoring
  monitoring_interval                    = 60
  performance_insights_enabled           = true
  performance_insights_retention_period  = 731  # 2 years
  enabled_cloudwatch_logs_exports        = true
  cloudwatch_log_retention_days          = 90

  # Alarms
  create_alarms       = true
  alarm_sns_topic_arn = module.sns.critical_topic_arn

  # Performance Tuning
  max_connections = 500
  log_statement  = "ddl"
  log_min_duration_statement = 1000  # Log queries > 1 second
  force_ssl = true

  tags = {
    Environment = "prod"
    Terraform   = "true"
    Backup      = "daily"
  }
}
```

### Staging Configuration with Read Replicas

```hcl
module "rds" {
  source = "./modules/rds"

  project_name = "uex-payments"
  environment  = "staging"

  # Network
  db_subnet_ids         = module.vpc.private_data_subnet_ids
  db_security_group_id  = module.security.rds_security_group_id

  # Database
  database_name   = "uex_payments_staging"
  master_username = "dbadmin"
  master_password = var.db_master_password

  # Instance
  db_instance_class = "db.t3.large"
  allocated_storage = 200
  max_allocated_storage = 500

  # High Availability
  multi_az           = true
  read_replica_count = 1

  # Encryption
  kms_key_arn = module.kms.key_arn

  # Backups
  backup_retention_period = 7
  deletion_protection    = true

  # Monitoring
  monitoring_interval          = 60
  performance_insights_enabled = true
  create_alarms               = true
  alarm_sns_topic_arn         = module.sns.warning_topic_arn

  tags = {
    Environment = "staging"
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
| `db_subnet_ids` | List of subnet IDs for DB subnet group | `list(string)` |
| `db_security_group_id` | Security group ID for RDS | `string` |
| `master_password` | Master password for database | `string` |
| `kms_key_arn` | KMS key ARN for encryption | `string` |

### Optional Variables

| Name | Description | Type | Default |
|------|-------------|------|---------|
| `database_name` | Default database name | `string` | `"uex_payments"` |
| `database_port` | Database port | `number` | `5432` |
| `master_username` | Master username | `string` | `"dbadmin"` |
| `db_instance_class` | RDS instance class | `string` | `"db.t3.medium"` |
| `db_engine_version` | PostgreSQL version | `string` | `"15.4"` |
| `allocated_storage` | Initial storage (GB) | `number` | `100` |
| `max_allocated_storage` | Max storage for autoscaling (GB) | `number` | `500` |
| `storage_type` | Storage type (gp2/gp3/io1/io2) | `string` | `"gp3"` |
| `multi_az` | Enable Multi-AZ | `bool` | `true` |
| `read_replica_count` | Number of read replicas (0-2) | `number` | `0` |
| `backup_retention_period` | Backup retention (days) | `number` | `7` |
| `backup_window` | Backup window (UTC) | `string` | `"03:00-04:00"` |
| `maintenance_window` | Maintenance window (UTC) | `string` | `"sun:04:00-sun:05:00"` |
| `monitoring_interval` | Enhanced monitoring interval (seconds) | `number` | `60` |
| `performance_insights_enabled` | Enable Performance Insights | `bool` | `true` |
| `create_alarms` | Create CloudWatch alarms | `bool` | `true` |
| `deletion_protection` | Enable deletion protection | `bool` | `true` |

See [variables.tf](./variables.tf) for complete list with validation rules.

## Outputs

### Connection Information

| Name | Description |
|------|-------------|
| `db_instance_endpoint` | Primary instance endpoint (host:port) |
| `db_instance_address` | Primary instance hostname |
| `db_instance_port` | Database port |
| `db_connection_string` | PostgreSQL connection string |
| `db_connection_info` | Complete connection info object |
| `replica_instance_endpoints` | List of replica endpoints |

### Resource Information

| Name | Description |
|------|-------------|
| `db_instance_id` | RDS instance identifier |
| `db_instance_arn` | RDS instance ARN |
| `db_instance_status` | Current instance status |
| `db_name` | Database name |
| `replica_instance_ids` | List of replica identifiers |

### Monitoring

| Name | Description |
|------|-------------|
| `alarm_ids` | Map of alarm names to IDs |
| `replica_alarm_ids` | List of replica lag alarm IDs |
| `performance_insights_enabled` | PI status |
| `enhanced_monitoring_role_arn` | Monitoring IAM role ARN |

### Commands

| Name | Description |
|------|-------------|
| `psql_command` | Command to connect via psql |
| `connection_test_command` | Command to test connectivity |

## CloudWatch Alarms

The module creates the following alarms when `create_alarms = true`:

### Primary Instance Alarms

1. **CPU Utilization** - Triggers when CPU > 85% for 10 minutes
2. **Free Storage Space** - Triggers when storage < 20GB
3. **Database Connections** - Triggers when connections > 160 (80% of max)
4. **Read Latency** - Triggers when read latency > 100ms
5. **Write Latency** - Triggers when write latency > 200ms

### Read Replica Alarms

1. **Replica Lag** - Triggers when replica lag > 60 seconds

All alarms send notifications to the specified SNS topic.

## Performance Insights

Performance Insights is enabled by default and provides:
- Top SQL queries by execution time
- Wait event analysis
- Database load monitoring
- Query-level performance metrics

Retention options:
- **7 days** (free tier)
- **731 days** (24 months, additional cost)

## Enhanced Monitoring

Enhanced Monitoring provides:
- OS-level metrics (CPU, memory, disk I/O)
- Process monitoring
- File system usage
- Network statistics

Available intervals: 1, 5, 10, 15, 30, 60 seconds

## Parameter Group Tuning

The module configures these optimized parameters:

```hcl
shared_buffers              = 25% of instance memory
effective_cache_size        = 75% of instance memory
maintenance_work_mem        = 2GB
work_mem                    = 16MB
max_connections             = 200 (configurable)
log_min_duration_statement  = 1000ms (log slow queries)
rds.force_ssl              = 1 (enforce SSL)
```

## Security Best Practices

1. **Encryption**
   - KMS encryption at rest
   - SSL/TLS enforced for connections
   - Encrypted Performance Insights

2. **Network**
   - Deployed in private subnets
   - No public accessibility
   - Security group restricts access to ECS only

3. **Access Control**
   - Master password stored in Secrets Manager
   - IAM database authentication (optional)
   - Deletion protection enabled

4. **Monitoring**
   - All logs exported to CloudWatch
   - Enhanced monitoring at 60-second intervals
   - Comprehensive alarms

## Backup and Recovery

### Automated Backups
- Daily automated snapshots
- Configurable retention (1-35 days)
- Point-in-time recovery (PITR) within retention period
- Backups stored in S3 with encryption

### Manual Snapshots
```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier uex-payments-prod-db-primary \
  --db-snapshot-identifier manual-snapshot-$(date +%Y%m%d)

# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier uex-payments-prod-db-primary

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier restored-instance \
  --db-snapshot-identifier manual-snapshot-20250101
```

## Maintenance Windows

- **Backup Window**: 03:00-04:00 UTC (default)
- **Maintenance Window**: Sunday 04:00-05:00 UTC (default)

Choose times during low-traffic periods for your application.

## Connection Examples

### Using psql
```bash
# Get password from Secrets Manager
export PGPASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id uex-payments/prod/database \
  --query SecretString --output text | jq -r .password)

# Connect to database
psql -h <db-instance-address> -p 5432 -U dbadmin -d uex_payments
```

### Using Node.js (pg library)
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: 'uex_payments',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: true
  }
});
```

### Using Python (psycopg2)
```python
import psycopg2

conn = psycopg2.connect(
    host=os.environ['DB_HOST'],
    port=5432,
    database='uex_payments',
    user=os.environ['DB_USER'],
    password=os.environ['DB_PASSWORD'],
    sslmode='require'
)
```

## Read Replica Usage

Read replicas are ideal for:
- Offloading read-heavy workloads
- Running analytics queries
- Disaster recovery (promote to primary)

**Connection Strategy:**
```
Primary:  Write operations, critical reads
Replica1: Read-only queries, reporting
Replica2: Analytics, backups
```

## Monitoring and Troubleshooting

### Check Instance Status
```bash
aws rds describe-db-instances \
  --db-instance-identifier uex-payments-prod-db-primary
```

### View Performance Insights
```bash
# Via AWS Console
# RDS > Performance Insights > Select your instance

# View metrics
aws pi get-resource-metrics \
  --service-type RDS \
  --identifier db-XXXXXXXXXXXXXX
```

### View CloudWatch Logs
```bash
# List log files
aws rds describe-db-log-files \
  --db-instance-identifier uex-payments-prod-db-primary

# Download log
aws rds download-db-log-file-portion \
  --db-instance-identifier uex-payments-prod-db-primary \
  --log-file-name error/postgresql.log.2025-01-20-00
```

### Check Replication Lag
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name ReplicaLag \
  --dimensions Name=DBInstanceIdentifier,Value=uex-payments-prod-db-replica-1 \
  --start-time 2025-01-20T00:00:00Z \
  --end-time 2025-01-20T23:59:59Z \
  --period 3600 \
  --statistics Average
```

## Cost Optimization

1. **Right-size instances**: Start with t3/t4g for dev, scale to r6g for prod
2. **Storage autoscaling**: Only pay for storage you use
3. **Replica placement**: Use smaller instances for replicas if possible
4. **Performance Insights**: Use 7-day retention (free) unless long-term analysis needed
5. **Snapshot lifecycle**: Delete old manual snapshots regularly

## Dependencies

This module requires:
- VPC module (for subnet IDs)
- Security module (for security group ID)
- KMS module (for encryption key)

## Notes

- Master password should be stored in Secrets Manager (not directly in tfvars)
- Enable Multi-AZ for production workloads
- Configure alarms SNS topic before enabling alarms
- Test backup restoration regularly
- Monitor storage autoscaling to avoid surprises
- Use read replicas for scaling reads, not for backup

## Migration from Existing Database

```bash
# Dump existing database
pg_dump -h old-host -U user -d database > backup.sql

# Restore to new RDS instance
psql -h new-rds-endpoint -U dbadmin -d uex_payments < backup.sql

# Or use AWS DMS for minimal downtime migration
```

## References

- [Amazon RDS for PostgreSQL Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [PostgreSQL on RDS Performance](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html#PostgreSQL.Concepts.General.FeatureSupport)
