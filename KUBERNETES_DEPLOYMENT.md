# UEX Payment Processing System - Kubernetes Deployment Guide

## 🎯 Overview

Complete guide for deploying the UEX Payment Processing System to any Kubernetes cluster. This system consists of 6 microservices, PostgreSQL database, and Redis cache.

## 📦 What's Included

### Services
1. **Presentation Dashboard** (Port 3900) - Static HTML dashboard
2. **Client-Tier** (Port 3901) - React frontend for buyers
3. **Management-Tier** (Port 3902) - React frontend for management
4. **UEX Backend** (Port 3903) - Core UEX payment processing ⭐
5. **Processing-Tier** (Port 8900) - Transaction processing
6. **Management Backend** (Port 9000) - Management API

### Infrastructure
- PostgreSQL 15 (StatefulSet with persistent storage)
- Redis 7 (StatefulSet with persistent storage)
- Nginx Ingress Controller
- ConfigMaps for configuration
- Secrets for sensitive data

## 🚀 Quick Start

### Prerequisites

```bash
# Install required tools
brew install kubectl helm

# Verify cluster connection
kubectl cluster-info
kubectl get nodes
```

### 1. Build Docker Images

```bash
# Build all images locally
./scripts/build-images-k8s.sh

# Tag for your registry
export DOCKER_REGISTRY="your-registry.io/uex-payments"

# Push to registry
docker tag uex-payments-presentation:latest $DOCKER_REGISTRY/presentation:latest
docker push $DOCKER_REGISTRY/presentation:latest
# ... repeat for all 6 services
```

### 2. Update Image References

Edit `kubernetes/base/services.yaml` and replace `YOUR_REGISTRY` with your actual registry:

```yaml
image: your-registry.io/uex-payments/presentation:latest
```

### 3. Create Secrets

```bash
kubectl create namespace uex-payments-dev

kubectl create secret generic uex-secrets \
  --from-literal=DATABASE_PASSWORD='SecureDBPassword123!' \
  --from-literal=REDIS_PASSWORD='SecureRedisPassword123!' \
  --from-literal=UEX_REFERRAL_CODE='5drfo01pgq88' \
  --from-literal=UEX_CLIENT_ID='' \
  --from-literal=UEX_SECRET_KEY='' \
  --from-literal=JWT_SECRET='your-jwt-secret-min-32-characters' \
  --from-literal=SESSION_SECRET='your-session-secret' \
  --namespace=uex-payments-dev
```

### 4. Deploy Everything

```bash
# Automated deployment
./scripts/deploy-kubernetes.sh dev

# Or manual deployment
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/base/configmap.yaml -n uex-payments-dev
kubectl apply -f kubernetes/base/postgres.yaml -n uex-payments-dev
kubectl apply -f kubernetes/base/redis.yaml -n uex-payments-dev
kubectl wait --for=condition=ready pod -l app=postgres -n uex-payments-dev --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n uex-payments-dev --timeout=300s
kubectl apply -f kubernetes/base/services.yaml -n uex-payments-dev
kubectl apply -f kubernetes/base/ingress.yaml -n uex-payments-dev
```

### 5. Verify Deployment

```bash
# Check all resources
kubectl get all -n uex-payments-dev

# Check pod status
kubectl get pods -n uex-payments-dev

# Check services
kubectl get svc -n uex-payments-dev

# Check ingress
kubectl get ingress -n uex-payments-dev
```

## 🔍 Access Services

### Via NodePort (Development)

```bash
# Get node IP
kubectl get nodes -o wide

# Access services
http://NODE_IP:30900  # Presentation
http://NODE_IP:30901  # Client-Tier
http://NODE_IP:30902  # Management-Tier
http://NODE_IP:30903  # UEX Backend
http://NODE_IP:30800  # Processing-Tier
http://NODE_IP:30000  # Management Backend
```

### Via Ingress (Production)

Add to `/etc/hosts`:
```
INGRESS_IP uex-payments.local
```

Access:
- http://uex-payments.local/presentation
- http://uex-payments.local/client
- http://uex-payments.local/management
- http://uex-payments.local/api/uex
- http://uex-payments.local/api/processing
- http://uex-payments.local/api/mgmt

### Via Port Forward

```bash
# Forward UEX Backend
kubectl port-forward svc/uex-backend-service 3903:3903 -n uex-payments-dev

# Access at http://localhost:3903
```

## 📊 Monitoring & Logs

### View Logs

```bash
# Real-time logs for UEX Backend
kubectl logs -f deployment/uex-backend -n uex-payments-dev

# All containers for a service
kubectl logs -f -l app=processing-tier -n uex-payments-dev

# Previous container logs (after crash)
kubectl logs --previous deployment/uex-backend -n uex-payments-dev

# Tail last 100 lines
kubectl logs --tail=100 deployment/uex-backend -n uex-payments-dev
```

### Check Status

```bash
# Pod status
kubectl get pods -n uex-payments-dev

# Detailed pod info
kubectl describe pod POD_NAME -n uex-payments-dev

# Events
kubectl get events -n uex-payments-dev --sort-by='.lastTimestamp'

# Resource usage (requires metrics-server)
kubectl top pods -n uex-payments-dev
kubectl top nodes
```

### Health Checks

```bash
# Check all deployments
kubectl get deployments -n uex-payments-dev

# Check service endpoints
kubectl get endpoints -n uex-payments-dev

# Test service from within cluster
kubectl run -it --rm debug --image=alpine --restart=Never -n uex-payments-dev -- sh
# Then inside container:
# apk add curl
# curl http://uex-backend-service:3903/api/uex/health
```

## 🔧 Common Operations

### Scale Services

```bash
# Scale UEX Backend to 5 replicas
kubectl scale deployment uex-backend --replicas=5 -n uex-payments-dev

# Scale all services
kubectl scale deployment --all --replicas=3 -n uex-payments-dev
```

### Update Images

```bash
# Update UEX Backend image
kubectl set image deployment/uex-backend \
  uex-backend=your-registry.io/uex-payments/uex-backend:v2.0 \
  -n uex-payments-dev

# Rollout status
kubectl rollout status deployment/uex-backend -n uex-payments-dev

# Rollback if needed
kubectl rollout undo deployment/uex-backend -n uex-payments-dev
```

### Restart Services

```bash
# Restart all pods in deployment
kubectl rollout restart deployment/uex-backend -n uex-payments-dev

# Delete pod (will be recreated automatically)
kubectl delete pod POD_NAME -n uex-payments-dev
```

### Database Operations

```bash
# Connect to PostgreSQL
kubectl exec -it postgres-0 -n uex-payments-dev -- psql -U admin -d uex_payments

# Run SQL from file
kubectl exec -i postgres-0 -n uex-payments-dev -- psql -U admin -d uex_payments < migration.sql

# Backup database
kubectl exec postgres-0 -n uex-payments-dev -- \
  pg_dump -U admin uex_payments > backup-$(date +%Y%m%d).sql

# Restore database
kubectl exec -i postgres-0 -n uex-payments-dev -- \
  psql -U admin uex_payments < backup-20241023.sql
```

### Redis Operations

```bash
# Connect to Redis
kubectl exec -it redis-0 -n uex-payments-dev -- redis-cli

# Check Redis with password
kubectl exec -it redis-0 -n uex-payments-dev -- \
  redis-cli -a $(kubectl get secret uex-secrets -n uex-payments-dev -o jsonpath='{.data.REDIS_PASSWORD}' | base64 -d)

# Flush Redis (careful!)
kubectl exec redis-0 -n uex-payments-dev -- redis-cli -a PASSWORD FLUSHALL
```

## 🔐 Security

### Update Secrets

```bash
# Update existing secret
kubectl create secret generic uex-secrets \
  --from-literal=DATABASE_PASSWORD='NewPassword123!' \
  --from-literal=REDIS_PASSWORD='NewRedisPass123!' \
  --namespace=uex-payments-dev \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart pods to pick up new secrets
kubectl rollout restart deployment --all -n uex-payments-dev
```

### Network Policies

```yaml
# Restrict database access
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: postgres-policy
  namespace: uex-payments-dev
spec:
  podSelector:
    matchLabels:
      app: postgres
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          tier: backend
    ports:
    - protocol: TCP
      port: 5432
```

## 🚨 Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod POD_NAME -n uex-payments-dev

# Common issues:
# - Image pull errors: Check image name and registry credentials
# - Resource constraints: Check node resources
# - Configuration errors: Check ConfigMap and Secrets
```

### Service Not Accessible

```bash
# Check service
kubectl get svc SERVICE_NAME -n uex-payments-dev
kubectl describe svc SERVICE_NAME -n uex-payments-dev

# Check endpoints
kubectl get endpoints SERVICE_NAME -n uex-payments-dev

# Test connectivity
kubectl run -it --rm debug --image=alpine -n uex-payments-dev -- sh
# wget -O- http://SERVICE_NAME:PORT/health
```

### Database Connection Issues

```bash
# Check database pod
kubectl get pods -l app=postgres -n uex-payments-dev
kubectl logs postgres-0 -n uex-payments-dev

# Test connection
kubectl exec -it postgres-0 -n uex-payments-dev -- \
  psql -U admin -d uex_payments -c "SELECT 1"

# Check secrets
kubectl get secret uex-secrets -n uex-payments-dev -o yaml
```

### High Resource Usage

```bash
# Check resource usage
kubectl top pods -n uex-payments-dev
kubectl top nodes

# Check pod limits
kubectl describe pod POD_NAME -n uex-payments-dev | grep -A 5 "Limits"

# Increase resources
kubectl set resources deployment/uex-backend \
  --limits=cpu=2,memory=2Gi \
  --requests=cpu=1,memory=1Gi \
  -n uex-payments-dev
```

## 🗑️ Cleanup

### Delete Specific Resources

```bash
# Delete services only
kubectl delete -f kubernetes/base/services.yaml -n uex-payments-dev

# Delete databases
kubectl delete -f kubernetes/base/postgres.yaml -n uex-payments-dev
kubectl delete -f kubernetes/base/redis.yaml -n uex-payments-dev
```

### Delete Everything

```bash
# Delete entire namespace (WARNING: destroys all data!)
kubectl delete namespace uex-payments-dev

# PersistentVolumes may need manual deletion
kubectl get pv
kubectl delete pv PV_NAME
```

## 📋 Production Checklist

Before deploying to production:

- [ ] Use production-grade storage class
- [ ] Enable database backups
- [ ] Set up monitoring (Prometheus, Grafana)
- [ ] Configure log aggregation (ELK, Loki)
- [ ] Implement network policies
- [ ] Use TLS/SSL certificates
- [ ] Set resource limits properly
- [ ] Configure HorizontalPodAutoscaler
- [ ] Set up PodDisruptionBudgets
- [ ] Enable RBAC
- [ ] Use external secret management (Vault)
- [ ] Configure ingress with proper domain
- [ ] Test disaster recovery procedures
- [ ] Set up CI/CD pipeline
- [ ] Performance testing completed
- [ ] Security audit completed

## 📚 Additional Resources

- Kubernetes Documentation: https://kubernetes.io/docs/
- kubectl Cheat Sheet: https://kubernetes.io/docs/reference/kubectl/cheatsheet/
- Docker Documentation: https://docs.docker.com/
- UEX API Docs: https://uex-us.stoplight.io/docs/uex

---

**Your UEX Payment Processing System is ready for Kubernetes!** 🎉
