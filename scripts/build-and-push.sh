#!/bin/bash
# ==============================================================================
# Build and Push Docker Images to ECR
# ==============================================================================
#
# This script builds all Docker images and pushes them to AWS ECR.
#
# Usage:
#   ./scripts/build-and-push.sh [environment] [services...]
#
# Arguments:
#   environment  - dev, staging, or prod (default: dev)
#   services     - specific services to build (default: all)
#
# Examples:
#   ./scripts/build-and-push.sh dev
#   ./scripts/build-and-push.sh prod uex-backend processing-tier
#   ./scripts/build-and-push.sh staging --all
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
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
PROJECT_NAME="uex-payments"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Service definitions
declare -A SERVICES=(
    ["presentation"]="presentation"
    ["client-tier"]="client-tier"
    ["management-tier"]="management-tier/frontend"
    ["uex-backend"]="uex"
    ["processing-tier"]="processing-tier"
    ["management-backend"]="management-tier/backend"
)

# Banner
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}Build and Push Docker Images${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo ""
echo "Environment:   ${ENVIRONMENT}"
echo "AWS Region:    ${AWS_REGION}"
echo "AWS Account:   ${AWS_ACCOUNT_ID}"
echo "ECR Registry:  ${ECR_REGISTRY}"
echo "Image Tag:     ${IMAGE_TAG}"
echo ""

# Determine which services to build
if [ "$2" == "--all" ] || [ -z "$2" ]; then
    BUILD_SERVICES=("${!SERVICES[@]}")
else
    shift  # Remove environment argument
    BUILD_SERVICES=("$@")
fi

echo -e "${YELLOW}Services to build: ${BUILD_SERVICES[*]}${NC}"
echo ""

# Login to ECR
echo -e "${YELLOW}Logging in to AWS ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | \
    docker login --username AWS --password-stdin ${ECR_REGISTRY}
echo -e "${GREEN}✓ Logged in to ECR${NC}"
echo ""

# Build and push each service
for service in "${BUILD_SERVICES[@]}"; do
    if [ ! -v SERVICES[$service] ]; then
        echo -e "${RED}Error: Unknown service '${service}'${NC}"
        continue
    fi

    service_dir="${SERVICES[$service]}"
    image_name="${PROJECT_NAME}-${ENVIRONMENT}-${service}"
    ecr_url="${ECR_REGISTRY}/${image_name}"

    echo -e "${BLUE}==============================================================================$ {NC}"
    echo -e "${BLUE}Building ${service}${NC}"
    echo -e "${BLUE}==============================================================================${NC}"
    echo "Service Dir:  ${service_dir}"
    echo "Image Name:   ${image_name}"
    echo "ECR URL:      ${ecr_url}:${IMAGE_TAG}"
    echo ""

    # Check if Dockerfile exists
    if [ ! -f "${service_dir}/Dockerfile" ]; then
        echo -e "${RED}Error: Dockerfile not found in ${service_dir}${NC}"
        continue
    fi

    # Create ECR repository if it doesn't exist
    if ! aws ecr describe-repositories --repository-names ${image_name} --region ${AWS_REGION} > /dev/null 2>&1; then
        echo -e "${YELLOW}Creating ECR repository: ${image_name}${NC}"
        aws ecr create-repository \
            --repository-name ${image_name} \
            --region ${AWS_REGION} \
            --image-scanning-configuration scanOnPush=true \
            --tags Key=Project,Value=UEX-Payment-Processing Key=Environment,Value=${ENVIRONMENT} \
            --encryption-configuration encryptionType=AES256
        echo -e "${GREEN}✓ Repository created${NC}"
    fi

    # Build Docker image
    echo -e "${YELLOW}Building Docker image...${NC}"
    docker build -t ${image_name}:${IMAGE_TAG} ${service_dir}
    echo -e "${GREEN}✓ Image built${NC}"
    echo ""

    # Tag image for ECR
    echo -e "${YELLOW}Tagging image for ECR...${NC}"
    docker tag ${image_name}:${IMAGE_TAG} ${ecr_url}:${IMAGE_TAG}
    docker tag ${image_name}:${IMAGE_TAG} ${ecr_url}:$(date +%Y%m%d-%H%M%S)
    echo -e "${GREEN}✓ Image tagged${NC}"
    echo ""

    # Push to ECR
    echo -e "${YELLOW}Pushing to ECR...${NC}"
    docker push ${ecr_url}:${IMAGE_TAG}
    docker push ${ecr_url}:$(date +%Y%m%d-%H%M%S)
    echo -e "${GREEN}✓ Image pushed${NC}"
    echo ""

    echo -e "${GREEN}✓ ${service} complete${NC}"
    echo ""
done

echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}All images built and pushed successfully!${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Deploy services: ./scripts/deploy-services.sh ${ENVIRONMENT}"
echo "  2. View images: aws ecr list-images --repository-name ${PROJECT_NAME}-${ENVIRONMENT}-uex-backend"
echo ""
