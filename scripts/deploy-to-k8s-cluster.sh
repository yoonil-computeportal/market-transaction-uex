#!/bin/bash
# ==============================================================================
# Deploy UEX Payment Processing System to Test Kubernetes Cluster
# ==============================================================================
# Complete deployment automation for cluster at 100.64.0.91-93
#
# Usage:
#   ./scripts/deploy-to-k8s-cluster.sh [OPTIONS]
#
# Options:
#   --skip-build        Skip Docker image build/push
#   --skip-db          Skip database setup
#   --cleanup          Delete existing deployment first
#   --dry-run          Show what would be deployed
# ==============================================================================

set -e

# Configuration
CLUSTER_CONTROLLER="100.64.0.91"
HARBOR_URL="repository.computeportal.app"
NAMESPACE="uex-payments-dev"
SKIP_BUILD=false
SKIP_DB=false
CLEANUP=false
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-db)
            SKIP_DB=true
            shift
            ;;
        --cleanup)
            CLEANUP=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Deploy UEX Payment Processing to Kubernetes Cluster          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Cluster Controller: $CLUSTER_CONTROLLER"
echo "Harbor Registry: $HARBOR_URL"
echo "Namespace: $NAMESPACE"
echo "Skip Build: $SKIP_BUILD"
echo "Skip DB: $SKIP_DB"
echo "Cleanup: $CLEANUP"
echo "Dry Run: $DRY_RUN"
echo ""

# Function to execute kubectl
run_kubectl() {
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN]${NC} kubectl $@"
    else
        kubectl "$@"
    fi
}

# Step 1: Verify cluster access
echo "=========================================="
echo "📡 Step 1: Verify Cluster Access"
echo "=========================================="

if ! kubectl cluster-info > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to Kubernetes cluster${NC}"
    echo "Please configure kubectl to connect to your cluster:"
    echo "  kubectl config set-cluster test-cluster --server=https://$CLUSTER_CONTROLLER:6443"
    exit 1
fi

echo -e "${GREEN}✅ Connected to cluster${NC}"
kubectl cluster-info
echo ""

# Step 2: Build and push Docker images
if [ "$SKIP_BUILD" = false ]; then
    echo "=========================================="
    echo "🔨 Step 2: Build and Push Docker Images"
    echo "=========================================="

    if [ "$DRY_RUN" = false ]; then
        echo "Running: ./scripts/build-and-push-harbor.sh"
        ./scripts/build-and-push-harbor.sh

        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Failed to build/push images${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}[DRY RUN]${NC} Would build and push Docker images"
    fi

    echo -e "${GREEN}✅ Images built and pushed${NC}"
    echo ""
else
    echo -e "${YELLOW}⏭️  Skipping image build (--skip-build flag)${NC}"
    echo ""
fi

# Step 3: Cleanup if requested
if [ "$CLEANUP" = true ]; then
    echo "=========================================="
    echo "🧹 Step 3: Cleanup Existing Deployment"
    echo "=========================================="

    echo "Deleting namespace: $NAMESPACE"
    run_kubectl delete namespace $NAMESPACE --ignore-not-found=true
    sleep 5

    echo -e "${GREEN}✅ Cleanup complete${NC}"
    echo ""
fi

# Step 4: Create namespace
echo "=========================================="
echo "📦 Step 4: Create Namespace"
echo "=========================================="

run_kubectl apply -f kubernetes/namespace.yaml
echo -e "${GREEN}✅ Namespace created${NC}"
echo ""

# Step 5: Create persistent volumes
echo "=========================================="
echo "💾 Step 5: Setup Persistent Volumes"
echo "=========================================="

echo "Creating persistent volumes for PostgreSQL, Redis, and logs..."
run_kubectl apply -f kubernetes/cluster-specific/persistent-volumes.yaml

echo -e "${GREEN}✅ Persistent volumes created${NC}"
echo ""

# Step 6: Deploy Harbor registry secret
echo "=========================================="
echo "🔐 Step 6: Deploy Harbor Registry Secret"
echo "=========================================="

run_kubectl apply -f kubernetes/cluster-specific/harbor-secret.yaml

echo -e "${GREEN}✅ Harbor secret deployed${NC}"
echo ""

# Step 7: Deploy ConfigMaps and Secrets
echo "=========================================="
echo "⚙️  Step 7: Deploy ConfigMaps and Secrets"
echo "=========================================="

run_kubectl apply -f kubernetes/base/configmap.yaml

echo "Creating secrets from template..."
if [ "$DRY_RUN" = false ]; then
    if [ ! -f kubernetes/base/secrets.yaml ]; then
        echo -e "${YELLOW}⚠️  secrets.yaml not found, creating from template...${NC}"
        cp kubernetes/base/secrets.yaml.template kubernetes/base/secrets.yaml
        echo "Please update kubernetes/base/secrets.yaml with actual values"
    fi
    run_kubectl apply -f kubernetes/base/secrets.yaml
else
    echo -e "${YELLOW}[DRY RUN]${NC} Would apply secrets.yaml"
fi

echo -e "${GREEN}✅ ConfigMaps and Secrets deployed${NC}"
echo ""

# Step 8: Deploy databases
if [ "$SKIP_DB" = false ]; then
    echo "=========================================="
    echo "🗄️  Step 8: Deploy PostgreSQL and Redis"
    echo "=========================================="

    echo "Deploying PostgreSQL..."
    run_kubectl apply -f kubernetes/base/postgres.yaml

    echo "Deploying Redis..."
    run_kubectl apply -f kubernetes/base/redis.yaml

    echo "Waiting for databases to be ready..."
    if [ "$DRY_RUN" = false ]; then
        kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=120s || true
        kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=120s || true
    fi

    echo -e "${GREEN}✅ Databases deployed${NC}"
    echo ""
else
    echo -e "${YELLOW}⏭️  Skipping database deployment (--skip-db flag)${NC}"
    echo ""
fi

# Step 9: Deploy services
echo "=========================================="
echo "🚀 Step 9: Deploy Application Services"
echo "=========================================="

echo "Deploying services (LoadBalancer/NodePort)..."
run_kubectl apply -f kubernetes/base/services.yaml

echo "Deploying application workloads..."
run_kubectl apply -f kubernetes/cluster-specific/deployments-harbor.yaml

echo -e "${GREEN}✅ Application services deployed${NC}"
echo ""

# Step 10: Deploy HPA and PDB
echo "=========================================="
echo "📈 Step 10: Deploy Auto-scaling (HPA/PDB)"
echo "=========================================="

echo "Deploying Horizontal Pod Autoscalers..."
run_kubectl apply -f kubernetes/base/hpa.yaml

echo "Deploying Pod Disruption Budgets..."
run_kubectl apply -f kubernetes/base/pdb.yaml

echo -e "${GREEN}✅ Auto-scaling configured${NC}"
echo ""

# Step 11: Deploy Ingress
echo "=========================================="
echo "🌐 Step 11: Deploy Ingress"
echo "=========================================="

echo "Deploying ingress configuration..."
run_kubectl apply -f kubernetes/cluster-specific/ingress-cluster.yaml

echo -e "${GREEN}✅ Ingress deployed${NC}"
echo ""

# Step 12: Wait for deployments
echo "=========================================="
echo "⏳ Step 12: Wait for Deployments"
echo "=========================================="

if [ "$DRY_RUN" = false ]; then
    echo "Waiting for all deployments to be ready (this may take a few minutes)..."

    kubectl wait --for=condition=available deployment --all -n $NAMESPACE --timeout=300s || {
        echo -e "${YELLOW}⚠️  Some deployments may not be ready yet${NC}"
    }

    echo ""
    echo "Current deployment status:"
    kubectl get deployments -n $NAMESPACE
else
    echo -e "${YELLOW}[DRY RUN]${NC} Would wait for deployments"
fi

echo ""

# Step 13: Display access information
echo "=========================================="
echo "📋 Step 13: Deployment Summary"
echo "=========================================="

echo ""
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "Access your services:"
echo ""
echo "Via NodePort (Direct Access):"
echo "  Presentation:        http://$CLUSTER_CONTROLLER:30900"
echo "  Client Tier:         http://$CLUSTER_CONTROLLER:30901"
echo "  Management Frontend: http://$CLUSTER_CONTROLLER:30902"
echo "  UEX Backend API:     http://$CLUSTER_CONTROLLER:30903/api/payments/health"
echo "  Processing Tier:     http://$CLUSTER_CONTROLLER:30904"
echo "  Management Backend:  http://$CLUSTER_CONTROLLER:30905"
echo ""
echo "Via Ingress (requires DNS or /etc/hosts):"
echo "  http://uex-payments.local          - Presentation Dashboard"
echo "  http://client.uex-payments.local   - Client Interface"
echo "  http://management.uex-payments.local - Management Dashboard"
echo "  http://api.uex-payments.local/api/payments - API Endpoints"
echo ""
echo "Add to /etc/hosts:"
echo "  echo '$CLUSTER_CONTROLLER uex-payments.local' | sudo tee -a /etc/hosts"
echo "  echo '$CLUSTER_CONTROLLER client.uex-payments.local' | sudo tee -a /etc/hosts"
echo "  echo '$CLUSTER_CONTROLLER management.uex-payments.local' | sudo tee -a /etc/hosts"
echo "  echo '$CLUSTER_CONTROLLER api.uex-payments.local' | sudo tee -a /etc/hosts"
echo ""
echo "Useful commands:"
echo "  kubectl get all -n $NAMESPACE                  - View all resources"
echo "  kubectl get pods -n $NAMESPACE                 - View pods"
echo "  kubectl logs -f deployment/uex-backend -n $NAMESPACE - View UEX backend logs"
echo "  kubectl describe pod <pod-name> -n $NAMESPACE  - Debug pod issues"
echo ""
echo "Next steps:"
echo "  1. Verify health: curl http://$CLUSTER_CONTROLLER:30903/api/payments/health"
echo "  2. List cryptocurrencies: curl http://$CLUSTER_CONTROLLER:30903/api/payments/currencies"
echo "  3. Open dashboard: http://$CLUSTER_CONTROLLER:30900"
echo ""
