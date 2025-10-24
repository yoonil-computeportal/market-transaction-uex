# Kubernetes Deployment for UEX Payment Processing System

## Overview

This directory contains Kubernetes manifests and Helm charts for deploying the UEX Payment Processing System to any Kubernetes cluster.

## Architecture

The system consists of:
- **6 Microservices** running in separate pods
- **PostgreSQL Database** (StatefulSet)
- **Redis Cache** (StatefulSet)
- **Ingress Controller** for external access
- **ConfigMaps** for configuration
- **Secrets** for sensitive data
- **PersistentVolumes** for data storage
- **HorizontalPodAutoscaler** for auto-scaling

## Directory Structure

```
kubernetes/
├── README.md                    # This file
├── namespace.yaml               # Namespace definition
├── base/                        # Base Kubernetes manifests
│   ├── configmap.yaml          # Configuration
│   ├── secrets.yaml            # Secrets (template)
│   ├── postgres.yaml           # PostgreSQL StatefulSet
│   ├── redis.yaml              # Redis StatefulSet
│   ├── services/               # Service manifests
│   │   ├── presentation.yaml
│   │   ├── client-tier.yaml
│   │   ├── management-tier.yaml
│   │   ├── uex-backend.yaml
│   │   ├── processing-tier.yaml
│   │   └── management-backend.yaml
│   ├── ingress.yaml            # Ingress rules
│   └── kustomization.yaml      # Kustomize config
├── overlays/                    # Environment-specific configs
│   ├── dev/
│   │   ├── kustomization.yaml
│   │   └── patches/
│   ├── staging/
│   │   ├── kustomization.yaml
│   │   └── patches/
│   └── prod/
│       ├── kustomization.yaml
│       └── patches/
└── helm/                        # Helm chart
    └── uex-payments/
        ├── Chart.yaml
        ├── values.yaml
        ├── values-dev.yaml
        ├── values-staging.yaml
        ├── values-prod.yaml
        └── templates/

```

## Prerequisites

### Required Tools
- `kubectl` (v1.24+)
- `helm` (v3.10+) - for Helm deployment
- `kustomize` (v4.5+) - for Kustomize deployment
- Docker registry access (Docker Hub, GCR, or private registry)

### Kubernetes Cluster
- Kubernetes v1.24+
- At least 3 worker nodes (for production)
- Storage provisioner (for PersistentVolumes)
- Ingress controller (nginx, traefik, etc.)

## Quick Start

### Method 1: Using Kubectl + Kustomize (Recommended)

```bash
# 1. Create namespace
kubectl apply -f kubernetes/namespace.yaml

# 2. Update secrets
cp kubernetes/base/secrets.yaml.template kubernetes/base/secrets.yaml
# Edit secrets.yaml with your values

# 3. Deploy to development
kubectl apply -k kubernetes/overlays/dev

# 4. Check deployment
kubectl get pods -n uex-payments-dev
kubectl get svc -n uex-payments-dev
kubectl get ingress -n uex-payments-dev
```

### Method 2: Using Helm

```bash
# 1. Build and push Docker images
./scripts/build-images.sh

# 2. Install with Helm
helm install uex-payments kubernetes/helm/uex-payments \
  --namespace uex-payments-dev \
  --create-namespace \
  --values kubernetes/helm/uex-payments/values-dev.yaml

# 3. Check deployment
helm status uex-payments -n uex-payments-dev
kubectl get pods -n uex-payments-dev
```

## Deployment Steps

### 1. Build and Push Docker Images

```bash
# Build all images
./scripts/build-images.sh

# Push to your registry
./scripts/push-images.sh YOUR_REGISTRY
```

### 2. Configure Secrets

```bash
# Create secrets
kubectl create secret generic uex-secrets \
  --from-literal=db-password='YOUR_DB_PASSWORD' \
  --from-literal=redis-password='YOUR_REDIS_PASSWORD' \
  --from-literal=uex-referral-code='YOUR_UEX_REFERRAL_CODE' \
  --from-literal=uex-client-id='YOUR_CLIENT_ID' \
  --from-literal=uex-secret-key='YOUR_SECRET_KEY' \
  --namespace=uex-payments-dev
```

### 3. Deploy Database and Cache

```bash
# Deploy PostgreSQL
kubectl apply -f kubernetes/base/postgres.yaml -n uex-payments-dev

# Deploy Redis
kubectl apply -f kubernetes/base/redis.yaml -n uex-payments-dev

# Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n uex-payments-dev --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n uex-payments-dev --timeout=300s
```

### 4. Run Database Migrations

```bash
# Run migrations as a Kubernetes Job
kubectl apply -f kubernetes/base/migrations-job.yaml -n uex-payments-dev

# Check migration logs
kubectl logs -f job/database-migrations -n uex-payments-dev
```

### 5. Deploy Services

```bash
# Deploy all services
kubectl apply -k kubernetes/overlays/dev

# Or deploy individually
kubectl apply -f kubernetes/base/services/uex-backend.yaml -n uex-payments-dev
kubectl apply -f kubernetes/base/services/processing-tier.yaml -n uex-payments-dev
# ... etc
```

### 6. Deploy Ingress

```bash
# Deploy ingress rules
kubectl apply -f kubernetes/base/ingress.yaml -n uex-payments-dev

# Get ingress IP/hostname
kubectl get ingress -n uex-payments-dev
```

## Service Ports

| Service | Internal Port | NodePort | Purpose |
|---------|--------------|----------|---------|
| presentation | 3900 | 30900 | Dashboard |
| client-tier | 3901 | 30901 | Buyer UI |
| management-tier | 3902 | 30902 | Management UI |
| uex-backend | 3903 | 30903 | UEX API |
| processing-tier | 8900 | 30800 | Transaction Processing |
| management-backend | 9000 | 30000 | Management API |
| postgres | 5432 | - | Database |
| redis | 6379 | - | Cache |

## Environment-Specific Configuration

### Development
- 1 replica per service
- Small resource requests/limits
- NodePort services
- No auto-scaling

```bash
kubectl apply -k kubernetes/overlays/dev
```

### Staging
- 2 replicas per service
- Medium resource requests/limits
- LoadBalancer services
- Auto-scaling enabled

```bash
kubectl apply -k kubernetes/overlays/staging
```

### Production
- 3+ replicas per service
- High resource requests/limits
- LoadBalancer services
- Auto-scaling with strict limits
- Pod disruption budgets
- Network policies

```bash
kubectl apply -k kubernetes/overlays/prod
```

## Monitoring and Logs

### View Logs

```bash
# All pods in namespace
kubectl logs -f -l app=uex-backend -n uex-payments-dev

# Specific service
kubectl logs -f deployment/uex-backend -n uex-payments-dev

# Tail logs
kubectl logs --tail=100 -f deployment/processing-tier -n uex-payments-dev
```

### Check Pod Status

```bash
# All pods
kubectl get pods -n uex-payments-dev

# Detailed info
kubectl describe pod POD_NAME -n uex-payments-dev

# Events
kubectl get events -n uex-payments-dev --sort-by='.lastTimestamp'
```

### Resource Usage

```bash
# CPU and Memory usage
kubectl top pods -n uex-payments-dev
kubectl top nodes
```

## Scaling

### Manual Scaling

```bash
# Scale specific service
kubectl scale deployment uex-backend --replicas=5 -n uex-payments-dev

# Scale all services
kubectl scale deployment --all --replicas=3 -n uex-payments-dev
```

### Auto-scaling

```bash
# Create HPA
kubectl autoscale deployment uex-backend \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n uex-payments-dev

# Check HPA status
kubectl get hpa -n uex-payments-dev
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod POD_NAME -n uex-payments-dev

# Check logs
kubectl logs POD_NAME -n uex-payments-dev

# Check events
kubectl get events -n uex-payments-dev
```

### Service Not Accessible

```bash
# Check service
kubectl get svc -n uex-payments-dev
kubectl describe svc SERVICE_NAME -n uex-payments-dev

# Check endpoints
kubectl get endpoints -n uex-payments-dev

# Test from within cluster
kubectl run -it --rm debug --image=alpine --restart=Never -n uex-payments-dev -- sh
# Then: wget -O- http://uex-backend:3903/api/uex/health
```

### Database Connection Issues

```bash
# Check database pod
kubectl get pods -l app=postgres -n uex-payments-dev
kubectl logs -f postgres-0 -n uex-payments-dev

# Test connection
kubectl exec -it postgres-0 -n uex-payments-dev -- psql -U admin -d uex_payments
```

## Backup and Restore

### Backup Database

```bash
# Create backup
kubectl exec postgres-0 -n uex-payments-dev -- \
  pg_dump -U admin uex_payments > backup-$(date +%Y%m%d).sql

# Or use backup job
kubectl apply -f kubernetes/base/backup-job.yaml -n uex-payments-dev
```

### Restore Database

```bash
# Restore from backup
kubectl exec -i postgres-0 -n uex-payments-dev -- \
  psql -U admin uex_payments < backup-20241023.sql
```

## Cleanup

### Remove Specific Deployment

```bash
kubectl delete -k kubernetes/overlays/dev
```

### Remove Everything

```bash
kubectl delete namespace uex-payments-dev
```

## CI/CD Integration

### GitLab CI

```yaml
deploy:
  stage: deploy
  script:
    - kubectl apply -k kubernetes/overlays/${CI_COMMIT_BRANCH}
  only:
    - dev
    - staging
    - main
```

### GitHub Actions

```yaml
- name: Deploy to Kubernetes
  run: |
    kubectl apply -k kubernetes/overlays/${{ github.ref_name }}
```

## Security Best Practices

1. **Secrets Management**: Use external secret managers (Vault, Sealed Secrets)
2. **Network Policies**: Restrict pod-to-pod communication
3. **RBAC**: Implement role-based access control
4. **Pod Security**: Use PodSecurityPolicies or PodSecurityStandards
5. **Image Scanning**: Scan images for vulnerabilities
6. **TLS**: Enable TLS for all external communications

## Support

For issues and questions:
- Check logs: `kubectl logs -f deployment/SERVICE_NAME -n NAMESPACE`
- Check events: `kubectl get events -n NAMESPACE`
- Describe resources: `kubectl describe TYPE NAME -n NAMESPACE`

---

**Ready to deploy to Kubernetes!** 🚀
