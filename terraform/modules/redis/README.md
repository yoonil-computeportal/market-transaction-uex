# ElastiCache Redis Module

Production-ready ElastiCache Redis module with high availability, automatic failover, encryption, and comprehensive monitoring.

## Features

- **High Availability**: Multi-AZ deployment with automatic failover
- **Cluster Mode**: Optional sharding for horizontal scaling
- **Encryption**: KMS encryption at rest and TLS encryption in transit
- **Authentication**: Auth token support for secure connections
- **Automated Backups**: Daily snapshots with configurable retention
- **CloudWatch Monitoring**: Comprehensive metrics and alarms
- **Logging**: Slow log and engine log exported to CloudWatch
- **Performance**: Optimized parameter groups for production workloads

## Usage

### Basic Configuration (Development)

```hcl
module "redis" {
  source = "./modules/redis"

  project_name = "uex-payments"
  environment  = "dev"

  # Network
  redis_subnet_ids         = module.vpc.private_data_subnet_ids
  redis_security_group_id  = module.security.redis_security_group_id

  # Redis Configuration
  node_type           = "cache.t3.medium"
  redis_engine_version = "7.0"

  # Cluster (non-cluster mode, single primary)
  cluster_mode_enabled       = false
  num_cache_nodes           = 1
  automatic_failover_enabled = false
  multi_az_enabled          = false

  # Security
  kms_key_arn                 = module.kms.key_arn
  transit_encryption_enabled  = true
  auth_token_enabled         = true
  auth_token                 = var.redis_auth_token

  # Backups
  enable_snapshots          = false
  snapshot_retention_limit  = 0

  # Monitoring
  create_alarms = false

  tags = {
    Environment = "dev"
    Terraform   = "true"
  }
}
```

### Production Configuration

```hcl
module "redis" {
  source = "./modules/redis"

  project_name = "uex-payments"
  environment  = "prod"

  # Network
  redis_subnet_ids         = module.vpc.private_data_subnet_ids
  redis_security_group_id  = module.security.redis_security_group_id
  preferred_cache_cluster_azs = module.vpc.availability_zones

  # Redis Configuration
  node_type           = "cache.r6g.large"
  redis_engine_version = "7.0"

  # Cluster (non-cluster mode with replicas)
  cluster_mode_enabled       = false
  num_cache_nodes           = 3  # 1 primary + 2 replicas
  automatic_failover_enabled = true
  multi_az_enabled          = true

  # Security
  kms_key_arn                 = module.kms.key_arn
  transit_encryption_enabled  = true
  auth_token_enabled         = true
  auth_token                 = var.redis_auth_token

  # Backups
  enable_snapshots          = true
  snapshot_retention_limit  = 7
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "sun:05:00-sun:07:00"
  skip_final_snapshot      = false

  # Parameter tuning
  maxmemory_policy = "allkeys-lru"
  timeout         = "300"

  # Monitoring
  create_alarms            = true
  alarm_sns_topic_arn      = module.sns.critical_topic_arn
  notification_topic_arn   = module.sns.info_topic_arn
  cloudwatch_log_retention_days = 90

  tags = {
    Environment = "prod"
    Terraform   = "true"
    Backup      = "daily"
  }
}
```

### Cluster Mode Configuration (Sharding)

```hcl
module "redis" {
  source = "./modules/redis"

  project_name = "uex-payments"
  environment  = "prod"

  # Network
  redis_subnet_ids         = module.vpc.private_data_subnet_ids
  redis_security_group_id  = module.security.redis_security_group_id

  # Redis Configuration
  node_type           = "cache.r6g.xlarge"
  redis_engine_version = "7.0"

  # Cluster mode (sharding enabled)
  cluster_mode_enabled       = true
  num_node_groups           = 3  # 3 shards
  replicas_per_node_group   = 2  # 2 replicas per shard
  automatic_failover_enabled = true
  multi_az_enabled          = true

  # Security
  kms_key_arn                 = module.kms.key_arn
  transit_encryption_enabled  = true
  auth_token_enabled         = true
  auth_token                 = var.redis_auth_token

  # Backups
  enable_snapshots          = true
  snapshot_retention_limit  = 14

  # Monitoring
  create_alarms       = true
  alarm_sns_topic_arn = module.sns.critical_topic_arn

  tags = {
    Environment = "prod"
    Terraform   = "true"
  }
}
```

### Staging Configuration

```hcl
module "redis" {
  source = "./modules/redis"

  project_name = "uex-payments"
  environment  = "staging"

  # Network
  redis_subnet_ids         = module.vpc.private_data_subnet_ids
  redis_security_group_id  = module.security.redis_security_group_id

  # Redis Configuration
  node_type           = "cache.t3.large"
  redis_engine_version = "7.0"

  # Cluster (with replicas)
  cluster_mode_enabled       = false
  num_cache_nodes           = 2
  automatic_failover_enabled = true
  multi_az_enabled          = true

  # Security
  kms_key_arn                 = module.kms.key_arn
  transit_encryption_enabled  = true
  auth_token_enabled         = true
  auth_token                 = var.redis_auth_token

  # Backups
  snapshot_retention_limit  = 3

  # Monitoring
  create_alarms       = true
  alarm_sns_topic_arn = module.sns.warning_topic_arn

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
| `redis_subnet_ids` | List of subnet IDs for Redis subnet group | `list(string)` |
| `redis_security_group_id` | Security group ID for Redis | `string` |
| `kms_key_arn` | KMS key ARN for encryption | `string` |

### Optional Variables

| Name | Description | Type | Default |
|------|-------------|------|---------|
| `redis_port` | Redis port | `number` | `6379` |
| `redis_engine_version` | Redis version | `string` | `"7.0"` |
| `node_type` | Node type | `string` | `"cache.t3.medium"` |
| `cluster_mode_enabled` | Enable cluster mode (sharding) | `bool` | `false` |
| `num_cache_nodes` | Number of nodes (non-cluster) | `number` | `2` |
| `num_node_groups` | Number of shards (cluster mode) | `number` | `1` |
| `replicas_per_node_group` | Replicas per shard | `number` | `1` |
| `multi_az_enabled` | Enable Multi-AZ | `bool` | `true` |
| `automatic_failover_enabled` | Enable automatic failover | `bool` | `true` |
| `transit_encryption_enabled` | Enable TLS | `bool` | `true` |
| `auth_token_enabled` | Enable auth token | `bool` | `true` |
| `auth_token` | Auth token/password | `string` | `""` |
| `snapshot_retention_limit` | Snapshot retention (days) | `number` | `7` |
| `snapshot_window` | Snapshot window (UTC) | `string` | `"03:00-05:00"` |
| `maintenance_window` | Maintenance window (UTC) | `string` | `"sun:05:00-sun:07:00"` |
| `maxmemory_policy` | Eviction policy | `string` | `"allkeys-lru"` |
| `create_alarms` | Create CloudWatch alarms | `bool` | `true` |

See [variables.tf](./variables.tf) for complete list with validation rules.

## Outputs

### Connection Information

| Name | Description |
|------|-------------|
| `replication_group_primary_endpoint_address` | Primary endpoint hostname |
| `replication_group_reader_endpoint_address` | Reader endpoint (for replicas) |
| `redis_port` | Redis port |
| `redis_connection_string` | Full connection string |
| `redis_connection_info` | Complete connection info object |

### Resource Information

| Name | Description |
|------|-------------|
| `replication_group_id` | Replication group identifier |
| `replication_group_arn` | Replication group ARN |
| `member_clusters` | List of cluster identifiers |
| `configuration_summary` | Complete configuration summary |

### CLI Commands

| Name | Description |
|------|-------------|
| `redis_cli_command` | Command to connect via redis-cli |
| `connection_test_command` | Command to test connectivity |
| `nodejs_connection_example` | Node.js connection code |
| `python_connection_example` | Python connection code |

## CloudWatch Alarms

The module creates these alarms when `create_alarms = true`:

1. **CPU Utilization** - Triggers when CPU > 80%
2. **Engine CPU Utilization** - Triggers when engine CPU > 90%
3. **Memory Utilization** - Triggers when memory > 85%
4. **Evictions** - Triggers when evictions > 100 per 5 minutes
5. **Current Connections** - Triggers when connections > 500
6. **Replication Lag** - Triggers when lag > 30 seconds (with replicas)
7. **Cache Hit Rate** - Triggers when hit rate < 80%
8. **Network Bytes In** - Triggers when network in > 5GB per 5 minutes
9. **Network Bytes Out** - Triggers when network out > 5GB per 5 minutes

## Cluster Mode vs Non-Cluster Mode

### Non-Cluster Mode (Default)
- **Use Case**: Most applications, simple caching
- **Scaling**: Vertical (larger nodes) and read replicas
- **Max Nodes**: 6 (1 primary + 5 replicas)
- **Sharding**: No
- **Failover**: Automatic to replica

### Cluster Mode (Sharding)
- **Use Case**: Large datasets, write scaling
- **Scaling**: Horizontal sharding across node groups
- **Max Capacity**: Up to 500 shards
- **Sharding**: Yes (data distributed across shards)
- **Failover**: Automatic per shard

## Eviction Policies

| Policy | Description | Use Case |
|--------|-------------|----------|
| `allkeys-lru` | Evict least recently used keys | General caching |
| `allkeys-lfu` | Evict least frequently used keys | Frequency-based caching |
| `volatile-lru` | Evict LRU keys with TTL | Mixed persistent/cache data |
| `volatile-ttl` | Evict keys with shortest TTL | Time-sensitive data |
| `noeviction` | Return errors when memory full | Persistent data store |

## Security Best Practices

1. **Encryption**
   - KMS encryption at rest
   - TLS encryption in transit
   - Auth token for authentication

2. **Network**
   - Deployed in private subnets
   - Security group restricts access to ECS only
   - No public accessibility

3. **Access Control**
   - Auth token stored in Secrets Manager
   - Strong auth token (16-128 characters)
   - IAM authentication (optional)

4. **Monitoring**
   - Slow log exported to CloudWatch
   - Engine log exported to CloudWatch
   - Comprehensive alarms

## Connection Examples

### Using redis-cli

```bash
# Get auth token from Secrets Manager
export REDIS_AUTH_TOKEN=$(aws secretsmanager get-secret-value \
  --secret-id uex-payments/prod/redis \
  --query SecretString --output text | jq -r .auth_token)

# Connect with TLS and auth
redis-cli -h <primary-endpoint> -p 6379 --tls -a $REDIS_AUTH_TOKEN

# Test connection
redis-cli -h <primary-endpoint> -p 6379 --tls -a $REDIS_AUTH_TOKEN PING
```

### Using Node.js (ioredis)

```javascript
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  password: process.env.REDIS_AUTH_TOKEN,
  tls: {
    rejectUnauthorized: true
  }
});

// Test connection
redis.ping().then(result => {
  console.log('Redis PING:', result);
});
```

### Using Node.js (redis library v4+)

```javascript
const redis = require('redis');

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: 6379,
    tls: true
  },
  password: process.env.REDIS_AUTH_TOKEN
});

await client.connect();
await client.ping();
```

### Using Python (redis-py)

```python
import redis
import os

client = redis.Redis(
    host=os.environ['REDIS_HOST'],
    port=6379,
    password=os.environ['REDIS_AUTH_TOKEN'],
    ssl=True,
    ssl_cert_reqs='required',
    decode_responses=True
)

# Test connection
print(client.ping())
```

### Using Go (go-redis)

```go
import (
    "github.com/go-redis/redis/v8"
    "crypto/tls"
)

client := redis.NewClient(&redis.Options{
    Addr:     os.Getenv("REDIS_HOST") + ":6379",
    Password: os.Getenv("REDIS_AUTH_TOKEN"),
    TLSConfig: &tls.Config{
        MinVersion: tls.VersionTLS12,
    },
})

pong, err := client.Ping(ctx).Result()
```

## Read Replicas Usage

### Read/Write Split Strategy

```javascript
// Primary for writes
const primary = new Redis({
  host: process.env.REDIS_PRIMARY_ENDPOINT,
  port: 6379,
  password: process.env.REDIS_AUTH_TOKEN,
  tls: true
});

// Reader endpoint for reads
const replica = new Redis({
  host: process.env.REDIS_READER_ENDPOINT,
  port: 6379,
  password: process.env.REDIS_AUTH_TOKEN,
  tls: true
});

// Write to primary
await primary.set('user:123', JSON.stringify(userData));

// Read from replica
const data = await replica.get('user:123');
```

## Monitoring and Troubleshooting

### Check Cluster Status

```bash
aws elasticache describe-replication-groups \
  --replication-group-id uex-payments-prod-redis
```

### View CloudWatch Metrics

```bash
# CPU utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ElastiCache \
  --metric-name CPUUtilization \
  --dimensions Name=ReplicationGroupId,Value=uex-payments-prod-redis \
  --start-time 2025-01-20T00:00:00Z \
  --end-time 2025-01-20T23:59:59Z \
  --period 300 \
  --statistics Average

# Memory utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ElastiCache \
  --metric-name DatabaseMemoryUsagePercentage \
  --dimensions Name=ReplicationGroupId,Value=uex-payments-prod-redis \
  --start-time 2025-01-20T00:00:00Z \
  --end-time 2025-01-20T23:59:59Z \
  --period 300 \
  --statistics Average
```

### View Logs

```bash
# View slow log
aws logs tail /aws/elasticache/uex-payments-prod-redis/slow-log --follow

# View engine log
aws logs tail /aws/elasticache/uex-payments-prod-redis/engine-log --follow
```

### Check Cache Hit Rate

```bash
redis-cli -h <endpoint> -p 6379 --tls -a $REDIS_AUTH_TOKEN INFO stats | grep keyspace
```

## Performance Tuning

### Node Type Selection

| Workload | Node Type | Memory | vCPUs |
|----------|-----------|--------|-------|
| Development | cache.t3.micro | 0.5 GB | 2 |
| Small | cache.t3.medium | 3.09 GB | 2 |
| Medium | cache.r6g.large | 13.07 GB | 2 |
| Large | cache.r6g.xlarge | 26.32 GB | 4 |
| X-Large | cache.r6g.2xlarge | 52.82 GB | 8 |

### Parameter Optimization

```hcl
# For session store
maxmemory_policy = "allkeys-lru"
timeout         = "300"

# For cache with TTL
maxmemory_policy = "volatile-lru"
timeout         = "0"

# For queue/pub-sub
maxmemory_policy = "noeviction"
notify_keyspace_events = "Ex"  # Keyspace events for expired keys
```

## Backup and Recovery

### Automated Backups

Snapshots are taken daily during the snapshot window and retained based on `snapshot_retention_limit`.

### Manual Snapshots

```bash
# Create manual snapshot
aws elasticache create-snapshot \
  --replication-group-id uex-payments-prod-redis \
  --snapshot-name manual-snapshot-$(date +%Y%m%d)

# List snapshots
aws elasticache describe-snapshots \
  --replication-group-id uex-payments-prod-redis

# Restore from snapshot
aws elasticache create-replication-group \
  --replication-group-id restored-cluster \
  --snapshot-name manual-snapshot-20250101 \
  --engine redis
```

## Cost Optimization

1. **Right-size nodes**: Start with t3 for dev, r6g for prod
2. **Snapshot retention**: Keep only necessary backups
3. **Use Graviton**: r6g instances are 40% cheaper than r5
4. **Reserved instances**: Up to 55% savings for 1-3 year commitments
5. **Data tiering**: Use Redis on Flash for cost savings (not available on all node types)

## Dependencies

This module requires:
- VPC module (for subnet IDs)
- Security module (for security group ID)
- KMS module (for encryption key)
- Secrets Manager module (for auth token storage)

## Migration from Self-Hosted Redis

```bash
# Export data from self-hosted
redis-cli --rdb dump.rdb

# Use redis-cli with --pipe for import
cat commands.txt | redis-cli -h <elasticache-endpoint> -p 6379 --tls -a $TOKEN --pipe

# Or use AWS DMS for live migration
```

## Notes

- Auth token must be 16-128 characters
- Automatic failover requires Multi-AZ and at least 2 nodes
- Cluster mode can't be disabled after creation
- TLS has ~15% performance overhead but is recommended
- Use reader endpoint for read replicas
- Monitor evictions to detect memory pressure

## References

- [Amazon ElastiCache for Redis Documentation](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/)
- [Redis Best Practices](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/BestPractices.html)
- [Redis Commands](https://redis.io/commands)
