#!/bin/bash
# ==============================================================================
# Deploy Services to ECS
# ==============================================================================
#
# This script updates ECS services to use the latest Docker images from ECR.
#
# Usage:
#   ./scripts/deploy-services.sh [environment] [services...]
#
# Examples:
#   ./scripts/deploy-services.sh dev
#   ./scripts/deploy-services.sh prod uex-backend
#   ./scripts/deploy-services.sh staging --all
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
AWS_REGION="${AWS_REGION:-us-east-1}"
PROJECT_NAME="uex-payments"
CLUSTER_NAME="${PROJECT_NAME}-${ENVIRONMENT}-cluster"

# Service list
SERVICES=(
    "presentation"
    "client-tier"
    "management-tier"
    "uex-backend"
    "processing-tier"
    "management-backend"
)

# Banner
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}Deploy Services to ECS${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo ""
echo "Environment:  ${ENVIRONMENT}"
echo "Cluster:      ${CLUSTER_NAME}"
echo "AWS Region:   ${AWS_REGION}"
echo ""

# Determine which services to deploy
if [ "$2" == "--all" ] || [ -z "$2" ]; then
    DEPLOY_SERVICES=("${SERVICES[@]}")
else
    shift
    DEPLOY_SERVICES=("$@")
fi

echo -e "${YELLOW}Services to deploy: ${DEPLOY_SERVICES[*]}${NC}"
echo ""

# Deploy each service
for service in "${DEPLOY_SERVICES[@]}"; do
    service_name="${PROJECT_NAME}-${ENVIRONMENT}-${service}"

    echo -e "${BLUE}==============================================================================${NC}"
    echo -e "${BLUE}Deploying ${service}${NC}"
    echo -e "${BLUE}==============================================================================${NC}"
    echo "Service Name: ${service_name}"
    echo ""

    # Check if service exists
    if ! aws ecs describe-services \
        --cluster ${CLUSTER_NAME} \
        --services ${service_name} \
        --region ${AWS_REGION} \
        --query 'services[0].status' \
        --output text 2>/dev/null | grep -q "ACTIVE"; then
        echo -e "${RED}Error: Service ${service_name} not found or not active${NC}"
        echo -e "${YELLOW}Skipping...${NC}"
        echo ""
        continue
    fi

    # Force new deployment
    echo -e "${YELLOW}Forcing new deployment...${NC}"
    aws ecs update-service \
        --cluster ${CLUSTER_NAME} \
        --service ${service_name} \
        --force-new-deployment \
        --region ${AWS_REGION} \
        --output json > /dev/null

    echo -e "${GREEN}✓ Deployment initiated${NC}"
    echo ""

    # Wait for deployment to stabilize (optional)
    if [ "${WAIT_FOR_STABLE}" == "true" ]; then
        echo -e "${YELLOW}Waiting for service to stabilize...${NC}"
        aws ecs wait services-stable \
            --cluster ${CLUSTER_NAME} \
            --services ${service_name} \
            --region ${AWS_REGION}
        echo -e "${GREEN}✓ Service stabilized${NC}"
    fi

    echo -e "${GREEN}✓ ${service} deployed${NC}"
    echo ""
done

echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}All services deployed successfully!${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo ""
echo "Monitor deployments:"
echo "  aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${PROJECT_NAME}-${ENVIRONMENT}-uex-backend"
echo ""
echo "View logs:"
echo "  aws logs tail /ecs/${PROJECT_NAME}-${ENVIRONMENT}/uex-backend --follow"
echo ""
