# Kubernetes Cluster Deployment Guide

Complete guide for deploying the UEX Payment Processing System to your test Kubernetes cluster.

## 📋 Prerequisites

### Cluster Information
- **Controller**: 100.64.0.91 (kcontroller)
- **Workers**: 100.64.0.92 (kworker-001), 100.64.0.93 (kworker-002)
- **Harbor Registry**: https://repository.computeportal.app
- **Credentials**: admin / Rnaehfdl01

### Required Software
- Docker installed locally
- kubectl configured to connect to cluster
- Harbor CLI access (docker login)

---

## 🚀 Quick Start (15 Minutes)

### Step 1: Login to Harbor Registry
```bash
./scripts/harbor-login.sh
```

### Step 2: Build and Push Images
```bash
# Build all services and push to Harbor
./scripts/build-and-push-harbor.sh

# Or build specific service
./scripts/build-and-push-harbor.sh --service uex-backend
```

### Step 3: Deploy to Cluster
```bash
# Full deployment
./scripts/deploy-to-k8s-cluster.sh

# Or with options
./scripts/deploy-to-k8s-cluster.sh --skip-build  # If images already built
./scripts/deploy-to-k8s-cluster.sh --cleanup     # Remove existing deployment first
```

### Step 4: Verify Deployment
```bash
# Check status
./scripts/cluster-utils.sh status

# Test health
./scripts/cluster-utils.sh test
```

### Step 5: Access Services
```bash
# Via NodePort
open http://100.64.0.91:30900  # Presentation Dashboard
open http://100.64.0.91:30903/api/payments/health  # API Health

# Test API
curl http://100.64.0.91:30903/api/payments/currencies
```

---

## 📂 Project Structure

```
kubernetes/
├── namespace.yaml                          # Namespace definition
├── base/
│   ├── configmap.yaml                     # Application configuration
│   ├── secrets.yaml.template              # Secrets template
│   ├── postgres.yaml                      # PostgreSQL StatefulSet
│   ├── redis.yaml                         # Redis StatefulSet
│   ├── services.yaml                      # Service definitions
│   ├── hpa.yaml                           # Auto-scaling
│   └── pdb.yaml                           # Pod Disruption Budgets
└── cluster-specific/
    ├── harbor-secret.yaml                 # Harbor registry credentials
    ├── deployments-harbor.yaml            # Deployments using Harbor
    ├── ingress-cluster.yaml               # Ingress configuration
    └── persistent-volumes.yaml            # PV/PVC for cluster

scripts/
├── harbor-login.sh                        # Login to Harbor
├── build-and-push-harbor.sh               # Build & push images
├── deploy-to-k8s-cluster.sh               # Full deployment
└── cluster-utils.sh                       # Cluster management utilities
```

---

## 🔧 Detailed Deployment Steps

### 1. Prepare Harbor Registry

```bash
# Login to Harbor
./scripts/harbor-login.sh

# Verify login
docker login repository.computeportal.app -u admin
```

### 2. Build Docker Images

The project includes 6 services that need to be containerized:

| Service | Directory | Port | Description |
|---------|-----------|------|-------------|
| presentation | ./presentation | 80 | Main dashboard |
| client-tier | ./client-tier | 80 | Buyer interface |
| management-frontend | ./management-tier/frontend | 80 | Management UI |
| uex-backend | ./uex | 3903 | Payment API |
| processing-tier | ./processing-tier | 8900 | Transaction processing |
| management-backend | ./management-tier/backend | 9000 | Management API |

```bash
# Build all services
./scripts/build-and-push-harbor.sh

# Build with custom tag
TAG=v1.0.0 ./scripts/build-and-push-harbor.sh

# Build without cache
./scripts/build-and-push-harbor.sh --no-cache

# Build specific service
./scripts/build-and-push-harbor.sh --service uex-backend
```

### 3. Configure Kubernetes

#### Update Secrets
```bash
# Copy template
cp kubernetes/base/secrets.yaml.template kubernetes/base/secrets.yaml

# Edit and add your secrets
vim kubernetes/base/secrets.yaml
```

Required secrets:
- `database-url`: PostgreSQL connection string
- `uex-referral-code`: Your UEX referral code
- `uex-webhook-secret`: Random secure string

#### Verify ConfigMap
```bash
# Edit configuration
vim kubernetes/base/configmap.yaml

# Key settings:
# - UEX_SWAP_API_URL
# - UEX_MERCHANT_API_URL
# - UEX_POLL_INTERVAL_MINUTES
```

### 4. Deploy to Cluster

```bash
# Full deployment
./scripts/deploy-to-k8s-cluster.sh
```

This script will:
1. ✅ Verify cluster access
2. ✅ Build and push Docker images
3. ✅ Create namespace
4. ✅ Setup persistent volumes
5. ✅ Deploy Harbor secret
6. ✅ Deploy ConfigMaps and Secrets
7. ✅ Deploy PostgreSQL and Redis
8. ✅ Deploy application services
9. ✅ Configure auto-scaling (HPA/PDB)
10. ✅ Deploy ingress
11. ✅ Wait for deployments
12. ✅ Display access information

### 5. Verify Deployment

```bash
# Check all resources
kubectl get all -n uex-payments-dev

# Check pod status
kubectl get pods -n uex-payments-dev -o wide

# Check services
kubectl get svc -n uex-payments-dev

# Check persistent volumes
kubectl get pv,pvc -n uex-payments-dev

# View logs
kubectl logs -f deployment/uex-backend -n uex-payments-dev
```

---

## 🌐 Accessing Services

### Via NodePort (Recommended)

Direct access using cluster IP and NodePort:

```bash
# Presentation Dashboard
http://100.64.0.91:30900

# Client Tier
http://100.64.0.91:30901

# Management Frontend
http://100.64.0.91:30902

# UEX Backend API
http://100.64.0.91:30903

# Processing Tier
http://100.64.0.91:30904

# Management Backend
http://100.64.0.91:30905
```

### Via Ingress (Requires DNS)

If you have DNS or want to use /etc/hosts:

```bash
# Add to /etc/hosts
echo '100.64.0.91 uex-payments.local' | sudo tee -a /etc/hosts
echo '100.64.0.91 client.uex-payments.local' | sudo tee -a /etc/hosts
echo '100.64.0.91 management.uex-payments.local' | sudo tee -a /etc/hosts
echo '100.64.0.91 api.uex-payments.local' | sudo tee -a /etc/hosts

# Then access via:
http://uex-payments.local
http://client.uex-payments.local
http://management.uex-payments.local
http://api.uex-payments.local/api/payments
```

### Test API Endpoints

```bash
# Health check
curl http://100.64.0.91:30903/api/payments/health | jq

# List cryptocurrencies
curl http://100.64.0.91:30903/api/payments/currencies | jq

# Estimate conversion
curl -X POST http://100.64.0.91:30903/api/payments/estimate \
  -H "Content-Type: application/json" \
  -d '{
    "from_currency": "BTC",
    "from_network": "BTC",
    "to_currency": "USDT",
    "to_network": "TRX",
    "amount": 0.5
  }' | jq
```

---

## 🛠️ Management Commands

### Using cluster-utils.sh

```bash
# View cluster status
./scripts/cluster-utils.sh status

# View logs
./scripts/cluster-utils.sh logs uex-backend

# Open shell in pod
./scripts/cluster-utils.sh shell uex-backend

# Restart deployment
./scripts/cluster-utils.sh restart uex-backend

# Scale deployment
./scripts/cluster-utils.sh scale uex-backend 5

# Run health checks
./scripts/cluster-utils.sh test

# Port forward
./scripts/cluster-utils.sh port-forward uex-backend 3903 3903
```

### Manual kubectl Commands

```bash
# Get all resources
kubectl get all -n uex-payments-dev

# Describe pod
kubectl describe pod <pod-name> -n uex-payments-dev

# View logs
kubectl logs -f <pod-name> -n uex-payments-dev

# Execute command in pod
kubectl exec -it <pod-name> -n uex-payments-dev -- /bin/sh

# Port forward
kubectl port-forward deployment/uex-backend 3903:3903 -n uex-payments-dev

# Scale deployment
kubectl scale deployment uex-backend --replicas=5 -n uex-payments-dev

# Restart deployment
kubectl rollout restart deployment/uex-backend -n uex-payments-dev

# View HPA status
kubectl get hpa -n uex-payments-dev

# View events
kubectl get events -n uex-payments-dev --sort-by='.lastTimestamp'
```

---

## 🔍 Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n uex-payments-dev

# Describe problematic pod
kubectl describe pod <pod-name> -n uex-payments-dev

# View logs
kubectl logs <pod-name> -n uex-payments-dev

# Common issues:
# 1. Image pull errors - Check Harbor credentials
# 2. CrashLoopBackOff - Check application logs
# 3. Pending - Check PV/PVC status
```

### Image Pull Errors

```bash
# Verify Harbor secret
kubectl get secret harbor-registry-secret -n uex-payments-dev -o yaml

# Re-create secret
kubectl delete secret harbor-registry-secret -n uex-payments-dev
kubectl apply -f kubernetes/cluster-specific/harbor-secret.yaml

# Manually test image pull
docker pull repository.computeportal.app/uex-payments/uex-backend:latest
```

### Database Connection Issues

```bash
# Check PostgreSQL pod
kubectl get pod -l app=postgres -n uex-payments-dev

# View PostgreSQL logs
kubectl logs -f statefulset/postgres -n uex-payments-dev

# Test database connection
kubectl exec -it deployment/uex-backend -n uex-payments-dev -- \
  psql $DATABASE_URL -c "SELECT 1"
```

### Service Not Accessible

```bash
# Check service
kubectl get svc uex-backend -n uex-payments-dev

# Check endpoints
kubectl get endpoints uex-backend -n uex-payments-dev

# Test from within cluster
kubectl run -it --rm debug --image=alpine --restart=Never -n uex-payments-dev -- \
  wget -qO- http://uex-backend:3903/api/payments/health
```

### Persistent Volume Issues

```bash
# Check PV status
kubectl get pv

# Check PVC status
kubectl get pvc -n uex-payments-dev

# SSH to worker node and create directories
sshpass -p 0135 ssh vboxuser@100.64.0.92 "sudo mkdir -p /mnt/data/postgres && sudo chmod 777 /mnt/data/postgres"
sshpass -p 0135 ssh vboxuser@100.64.0.93 "sudo mkdir -p /mnt/data/redis && sudo chmod 777 /mnt/data/redis"
```

---

## 📊 Monitoring

### Check Resource Usage

```bash
# Pod resource usage
kubectl top pods -n uex-payments-dev

# Node resource usage
kubectl top nodes

# HPA status
kubectl get hpa -n uex-payments-dev -w
```

### View Metrics

```bash
# Install metrics-server if not present
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# View metrics
kubectl get --raw /apis/metrics.k8s.io/v1beta1/nodes
kubectl get --raw /apis/metrics.k8s.io/v1beta1/pods
```

---

## 🔄 Updates and Rollbacks

### Update Application

```bash
# Build new version
TAG=v1.1.0 ./scripts/build-and-push-harbor.sh

# Update image in deployment
kubectl set image deployment/uex-backend \
  uex-backend=repository.computeportal.app/uex-payments/uex-backend:v1.1.0 \
  -n uex-payments-dev

# Check rollout status
kubectl rollout status deployment/uex-backend -n uex-payments-dev
```

### Rollback

```bash
# View rollout history
kubectl rollout history deployment/uex-backend -n uex-payments-dev

# Rollback to previous version
kubectl rollout undo deployment/uex-backend -n uex-payments-dev

# Rollback to specific revision
kubectl rollout undo deployment/uex-backend --to-revision=2 -n uex-payments-dev
```

---

## 🧹 Cleanup

### Remove Deployment

```bash
# Using script
./scripts/cluster-utils.sh cleanup

# Or manually
kubectl delete namespace uex-payments-dev
kubectl delete pv postgres-pv redis-pv logs-pv
```

### Clean Harbor Registry

```bash
# Login to Harbor web UI
open https://repository.computeportal.app

# Navigate to uex-payments project
# Delete old image tags
```

---

## 📚 Additional Resources

- **Kubernetes Manifests**: `/kubernetes`
- **Deployment Scripts**: `/scripts`
- **UEX Integration**: `/UEX_IMPLEMENTATION_FINAL_SUMMARY.md`
- **API Documentation**: `/uex/UEX_SERVICE_README.md`

---

## ✅ Deployment Checklist

- [ ] Harbor login successful
- [ ] All Docker images built and pushed
- [ ] kubectl configured for cluster
- [ ] Secrets configured
- [ ] Namespace created
- [ ] Persistent volumes created
- [ ] PostgreSQL deployed and running
- [ ] Redis deployed and running
- [ ] All application pods running
- [ ] Services accessible via NodePort
- [ ] Health checks passing
- [ ] API endpoints responding
- [ ] Auto-scaling configured
- [ ] Monitoring enabled

---

**Your UEX Payment Processing System is ready to run on Kubernetes!** 🚀
