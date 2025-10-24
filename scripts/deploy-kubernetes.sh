#!/bin/bash
# ==============================================================================
# Deploy to Kubernetes
# ==============================================================================
#
# This script deploys the UEX Payment Processing System to Kubernetes
#
# Usage:
#   ./scripts/deploy-kubernetes.sh [environment]
#
# Arguments:
#   environment  - dev, staging, or prod (default: dev)
#
# Examples:
#   ./scripts/deploy-kubernetes.sh dev
#   ./scripts/deploy-kubernetes.sh prod
#
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${1:-dev}"
NAMESPACE="uex-payments-${ENVIRONMENT}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
K8S_DIR="${PROJECT_ROOT}/kubernetes"

# Banner
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}Deploy UEX Payment Processing System to Kubernetes${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo ""
echo "Environment:  ${ENVIRONMENT}"
echo "Namespace:    ${NAMESPACE}"
echo "K8s Dir:      ${K8S_DIR}"
echo ""

# Validate environment
if [[ ! "${ENVIRONMENT}" =~ ^(dev|staging|prod)$ ]]; then
    echo -e "${RED}Error: Invalid environment '${ENVIRONMENT}'. Must be dev, staging, or prod.${NC}"
    exit 1
fi

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

# Check cluster connection
echo -e "${YELLOW}Checking Kubernetes cluster connection...${NC}"
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Connected to cluster${NC}"
echo ""

# Create namespace
echo -e "${YELLOW}Creating namespace: ${NAMESPACE}${NC}"
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✓ Namespace ready${NC}"
echo ""

# Check secrets
echo -e "${YELLOW}Checking secrets...${NC}"
if ! kubectl get secret uex-secrets -n ${NAMESPACE} &> /dev/null; then
    echo -e "${RED}Error: Secrets not found!${NC}"
    echo ""
    echo "Please create secrets first:"
    echo "  kubectl create secret generic uex-secrets \\"
    echo "    --from-literal=DATABASE_PASSWORD='your-db-password' \\"
    echo "    --from-literal=REDIS_PASSWORD='your-redis-password' \\"
    echo "    --from-literal=UEX_REFERRAL_CODE='your-uex-referral-code' \\"
    echo "    --from-literal=UEX_CLIENT_ID='' \\"
    echo "    --from-literal=UEX_SECRET_KEY='' \\"
    echo "    --from-literal=JWT_SECRET='your-jwt-secret' \\"
    echo "    --from-literal=SESSION_SECRET='your-session-secret' \\"
    echo "    --namespace=${NAMESPACE}"
    echo ""
    exit 1
fi
echo -e "${GREEN}✓ Secrets found${NC}"
echo ""

# Deploy ConfigMap
echo -e "${YELLOW}Deploying ConfigMap...${NC}"
kubectl apply -f ${K8S_DIR}/base/configmap.yaml -n ${NAMESPACE}
echo -e "${GREEN}✓ ConfigMap deployed${NC}"
echo ""

# Deploy PostgreSQL
echo -e "${YELLOW}Deploying PostgreSQL...${NC}"
kubectl apply -f ${K8S_DIR}/base/postgres.yaml -n ${NAMESPACE}
echo -e "${GREEN}✓ PostgreSQL deployed${NC}"
echo ""

# Deploy Redis
echo -e "${YELLOW}Deploying Redis...${NC}"
kubectl apply -f ${K8S_DIR}/base/redis.yaml -n ${NAMESPACE}
echo -e "${GREEN}✓ Redis deployed${NC}"
echo ""

# Wait for databases
echo -e "${YELLOW}Waiting for databases to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=postgres -n ${NAMESPACE} --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n ${NAMESPACE} --timeout=300s
echo -e "${GREEN}✓ Databases ready${NC}"
echo ""

# Deploy services
echo -e "${YELLOW}Deploying all services...${NC}"
kubectl apply -f ${K8S_DIR}/base/services.yaml -n ${NAMESPACE}
echo -e "${GREEN}✓ Services deployed${NC}"
echo ""

# Deploy ingress
echo -e "${YELLOW}Deploying ingress...${NC}"
kubectl apply -f ${K8S_DIR}/base/ingress.yaml -n ${NAMESPACE}
echo -e "${GREEN}✓ Ingress deployed${NC}"
echo ""

# Wait for deployments
echo -e "${YELLOW}Waiting for deployments to be ready...${NC}"
kubectl wait --for=condition=available deployment --all -n ${NAMESPACE} --timeout=300s
echo -e "${GREEN}✓ All deployments ready${NC}"
echo ""

# Show status
echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo ""
echo "Resources in namespace ${NAMESPACE}:"
echo ""
kubectl get all -n ${NAMESPACE}
echo ""
echo "Ingress:"
kubectl get ingress -n ${NAMESPACE}
echo ""
echo "Next steps:"
echo "  1. Check pod status: kubectl get pods -n ${NAMESPACE}"
echo "  2. View logs: kubectl logs -f deployment/uex-backend -n ${NAMESPACE}"
echo "  3. Access services via ingress or NodePort"
echo ""
