# UEX Payment Processing System - Monitoring & Observability

Complete monitoring setup for the UEX Payment Processing System using Prometheus, Grafana, and Kubernetes metrics.

## Overview

This monitoring stack provides:
- **Metrics Collection**: Prometheus for scraping and storing metrics
- **Visualization**: Grafana dashboards for real-time monitoring
- **Alerting**: Alert rules for critical system events
- **Auto-scaling**: HPA based on resource utilization
- **High Availability**: PodDisruptionBudgets for service continuity

## Components

### 1. Prometheus
- **Purpose**: Metrics collection and storage
- **Scrapes**: Kubernetes metrics, application metrics, database metrics
- **Retention**: 15 days (configurable)
- **Scrape Interval**: 30 seconds

### 2. Grafana
- **Purpose**: Metrics visualization and dashboards
- **Pre-configured Dashboards**: UEX Payment System overview
- **Access**: Web UI with authentication

### 3. Horizontal Pod Autoscaler (HPA)
- **Purpose**: Automatic pod scaling based on CPU/memory
- **Targets**: All backend services
- **Metrics Server**: Required for HPA to function

### 4. Pod Disruption Budgets (PDB)
- **Purpose**: Ensure minimum availability during updates
- **Protection**: Prevents all pods from being terminated simultaneously

## Quick Start

### 1. Install Metrics Server (Required for HPA)

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### 2. Install Prometheus and Grafana using Helm

```bash
# Add Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Create monitoring namespace
kubectl create namespace monitoring

# Install Prometheus stack (includes Grafana)
helm install prometheus prometheus-community/kube-prometheus-stack \
  -n monitoring \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set grafana.adminPassword=admin
```

### 3. Deploy Monitoring Configurations

```bash
# Deploy HPA
kubectl apply -f kubernetes/monitoring/hpa.yaml

# Deploy PDB
kubectl apply -f kubernetes/monitoring/pdb.yaml

# Deploy ServiceMonitors
kubectl apply -f kubernetes/monitoring/servicemonitors.yaml

# Deploy Prometheus config (if not using Helm)
kubectl apply -f kubernetes/monitoring/prometheus-config.yaml
```

### 4. Import Grafana Dashboard

```bash
# Port-forward to Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Open browser: http://localhost:3000
# Login: admin / admin
# Import dashboard from kubernetes/monitoring/grafana-dashboard.json
```

## Access Services

### Prometheus UI

```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
# Open: http://localhost:9090
```

### Grafana UI

```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Open: http://localhost:3000
# Login: admin / admin (or password set during installation)
```

### AlertManager UI

```bash
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-alertmanager 9093:9093
# Open: http://localhost:9093
```

## Horizontal Pod Autoscaler (HPA)

### Configuration

| Service | Min Replicas | Max Replicas | CPU Target | Memory Target |
|---------|--------------|--------------|------------|---------------|
| uex-backend | 2 | 10 | 70% | 80% |
| processing-tier | 2 | 8 | 70% | 80% |
| management-backend | 1 | 5 | 75% | 80% |
| client-tier | 1 | 5 | 75% | - |
| management-tier | 1 | 5 | 75% | - |
| presentation | 1 | 3 | 80% | - |

### Check HPA Status

```bash
# View all HPAs
kubectl get hpa -n uex-payments-dev

# Detailed HPA info
kubectl describe hpa uex-backend-hpa -n uex-payments-dev

# Watch HPA in real-time
kubectl get hpa -n uex-payments-dev -w
```

### Manual Scaling (overrides HPA temporarily)

```bash
# Scale specific deployment
kubectl scale deployment uex-backend --replicas=5 -n uex-payments-dev

# HPA will resume control after stabilization period
```

## Pod Disruption Budgets (PDB)

### Configuration

PDBs ensure minimum availability during:
- Node maintenance
- Cluster upgrades
- Rolling updates
- Voluntary disruptions

### Check PDB Status

```bash
# View all PDBs
kubectl get pdb -n uex-payments-dev

# Detailed PDB info
kubectl describe pdb uex-backend-pdb -n uex-payments-dev
```

## Metrics and Alerts

### Key Metrics

1. **Service Health**
   - `up{namespace="uex-payments-dev"}` - Service availability
   - `kube_pod_status_phase` - Pod status

2. **Resource Usage**
   - `container_cpu_usage_seconds_total` - CPU usage
   - `container_memory_usage_bytes` - Memory usage
   - `container_network_*_bytes_total` - Network I/O

3. **Application Metrics**
   - `http_requests_total` - HTTP request count
   - `http_request_duration_seconds` - Request latency
   - `uex_transactions_total` - Payment transactions
   - `uex_active_sessions` - Active payment sessions

4. **Database Metrics**
   - `pg_stat_database_numbackends` - PostgreSQL connections
   - `redis_memory_used_bytes` - Redis memory usage

### Alert Rules

Critical alerts configured:
- **HighCPUUsage**: CPU > 80% for 5 minutes
- **HighMemoryUsage**: Memory > 90% for 5 minutes
- **PodRestarting**: Pod restarting frequently
- **PodNotReady**: Pod not ready for 5 minutes
- **ServiceDown**: Service unreachable for 2 minutes
- **DatabaseConnectionFailed**: Database unreachable
- **HighErrorRate**: Error rate > 5%
- **SlowResponseTime**: 95th percentile > 2 seconds

### View Active Alerts

```bash
# Via Prometheus UI
# Go to: http://localhost:9090/alerts

# Via AlertManager UI
# Go to: http://localhost:9093

# Via kubectl
kubectl get prometheusrule -n monitoring
```

## Grafana Dashboards

### Pre-configured Dashboard

The included dashboard provides:
1. **Service Status**: Real-time service availability
2. **CPU Usage**: Per-service CPU consumption
3. **Memory Usage**: Per-service memory consumption
4. **HTTP Metrics**: Request rate and response times
5. **Pod Restarts**: Container restart counts
6. **Database Metrics**: PostgreSQL and Redis statistics
7. **Network I/O**: Network traffic per service
8. **UEX Transactions**: Payment-specific metrics
9. **Error Rate**: System-wide error percentage

### Import Dashboard

1. Open Grafana UI (port-forward to port 3000)
2. Click "+" → "Import"
3. Upload `grafana-dashboard.json`
4. Select Prometheus data source
5. Click "Import"

### Create Custom Dashboards

Use these common queries:

```promql
# CPU usage by pod
rate(container_cpu_usage_seconds_total{namespace="uex-payments-dev"}[5m])

# Memory usage by pod
container_memory_usage_bytes{namespace="uex-payments-dev"}

# HTTP request rate
rate(http_requests_total{namespace="uex-payments-dev"}[5m])

# Error rate
rate(http_requests_total{status=~"5..",namespace="uex-payments-dev"}[5m])

# Response time (95th percentile)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

## Service Monitors

ServiceMonitor resources configured for:
- UEX Backend (port 3903, /metrics)
- Processing-Tier (port 8900, /metrics)
- Management Backend (port 9000, /metrics)
- PostgreSQL (via postgres-exporter)
- Redis (via redis-exporter)

### Add Metrics to Your Application

To expose metrics from Node.js services, add:

```javascript
const promClient = require('prom-client');

// Create registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## Troubleshooting

### Metrics Server Not Working

```bash
# Check metrics server
kubectl get deployment metrics-server -n kube-system

# Check if metrics are available
kubectl top nodes
kubectl top pods -n uex-payments-dev

# If not working, try patching for development:
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'
```

### HPA Not Scaling

```bash
# Check HPA status
kubectl describe hpa uex-backend-hpa -n uex-payments-dev

# Common issues:
# 1. Metrics server not running
# 2. No resource requests defined in deployment
# 3. Current usage below threshold
```

### Prometheus Not Scraping

```bash
# Check ServiceMonitor
kubectl get servicemonitor -n uex-payments-dev

# Check Prometheus targets
# Go to: http://localhost:9090/targets

# Check service labels match ServiceMonitor selector
kubectl get svc uex-backend-service -n uex-payments-dev -o yaml
```

### Missing Metrics

```bash
# Check if /metrics endpoint exists
kubectl port-forward svc/uex-backend-service 3903:3903 -n uex-payments-dev
curl http://localhost:3903/metrics

# Check Prometheus logs
kubectl logs -n monitoring deployment/prometheus-kube-prometheus-operator
```

## Advanced Configuration

### Custom Alert Rules

Add to `prometheus-config.yaml`:

```yaml
- alert: CustomAlert
  expr: your_metric > threshold
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Custom alert description"
```

### Slack Notifications

Configure AlertManager:

```yaml
receivers:
  - name: 'slack'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#alerts'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

### Long-term Metrics Storage

For production, consider:
- **Thanos**: Long-term storage for Prometheus
- **Cortex**: Horizontally scalable Prometheus
- **VictoriaMetrics**: High-performance metrics storage

## Resource Requirements

### Metrics Server
- CPU: 100m
- Memory: 200Mi

### Prometheus
- CPU: 500m - 2000m
- Memory: 2Gi - 8Gi (depends on retention and scrape frequency)

### Grafana
- CPU: 100m - 500m
- Memory: 128Mi - 512Mi

## Best Practices

1. **Set Resource Requests/Limits**: Required for HPA to work
2. **Monitor Disk Space**: Prometheus requires storage for metrics
3. **Regular Backups**: Backup Grafana dashboards and Prometheus config
4. **Alert Fatigue**: Tune alert thresholds to reduce noise
5. **Dashboard Organization**: Create role-specific dashboards
6. **Metrics Retention**: Balance retention vs. storage costs
7. **High Availability**: Run multiple Prometheus replicas in production

## Next Steps

1. ✅ Install metrics-server
2. ✅ Deploy Prometheus and Grafana
3. ✅ Apply HPA and PDB configurations
4. ✅ Import Grafana dashboards
5. ✅ Configure alert notifications
6. ⏭️ Add custom application metrics
7. ⏭️ Set up long-term metrics storage
8. ⏭️ Create runbooks for alerts
9. ⏭️ Implement log aggregation (ELK/Loki)
10. ⏭️ Set up distributed tracing (Jaeger/Tempo)

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Kubernetes HPA](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [Kubernetes Metrics Server](https://github.com/kubernetes-sigs/metrics-server)
- [Prometheus Operator](https://github.com/prometheus-operator/prometheus-operator)

---

**Your UEX Payment Processing System now has complete monitoring and observability!** 📊
