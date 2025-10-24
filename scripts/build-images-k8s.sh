#!/bin/bash
# ==============================================================================
# Build Docker Images for Kubernetes Deployment
# ==============================================================================
#
# This script builds all Docker images for the UEX Payment Processing System
# and optionally pushes them to a container registry.
#
# Usage:
#   ./scripts/build-images-k8s.sh [OPTIONS]
#
# Options:
#   --registry REGISTRY    Container registry URL (e.g., docker.io/username)
#   --tag TAG              Image tag (default: latest)
#   --push                 Push images to registry after building
#   --service SERVICE      Build only specific service (presentation, client-tier, etc.)
#   --no-cache             Build without using cache
#   --help                 Show this help message
#
# Examples:
#   ./scripts/build-images-k8s.sh
#   ./scripts/build-images-k8s.sh --registry docker.io/myuser --tag v1.0.0 --push
#   ./scripts/build-images-k8s.sh --service uex-backend --no-cache
#
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
REGISTRY=""
TAG="latest"
PUSH=false
NO_CACHE=""
SPECIFIC_SERVICE=""

# Service definitions
declare -A SERVICES=(
    ["presentation"]="presentation"
    ["client-tier"]="client-tier"
    ["management-tier"]="management-tier/frontend"
    ["uex-backend"]="uex"
    ["processing-tier"]="processing-tier"
    ["management-backend"]="management-tier/backend"
)

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --tag)
            TAG="$2"
            shift 2
            ;;
        --push)
            PUSH=true
            shift
            ;;
        --service)
            SPECIFIC_SERVICE="$2"
            shift 2
            ;;
        --no-cache)
            NO_CACHE="--no-cache"
            shift
            ;;
        --help)
            grep "^#" "$0" | grep -v "^#!/" | sed 's/^# //' | sed 's/^#//'
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Validate registry if push is enabled
if [ "$PUSH" = true ] && [ -z "$REGISTRY" ]; then
    echo -e "${RED}Error: --registry is required when --push is enabled${NC}"
    exit 1
fi

# Banner
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}Build Docker Images for UEX Payment Processing System${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo ""
echo "Project Root: ${PROJECT_ROOT}"
echo "Registry:     ${REGISTRY:-<none>}"
echo "Tag:          ${TAG}"
echo "Push:         ${PUSH}"
echo "Service:      ${SPECIFIC_SERVICE:-all}"
echo ""

# Function to build a service
build_service() {
    local service_name=$1
    local service_path=$2
    local context_dir="${PROJECT_ROOT}/${service_path}"
    local dockerfile="${context_dir}/Dockerfile"

    # Determine image name
    if [ -n "$REGISTRY" ]; then
        local image_name="${REGISTRY}/uex-payments-${service_name}:${TAG}"
    else
        local image_name="uex-payments-${service_name}:${TAG}"
    fi

    echo -e "${YELLOW}Building ${service_name}...${NC}"
    echo "  Context:    ${context_dir}"
    echo "  Dockerfile: ${dockerfile}"
    echo "  Image:      ${image_name}"

    # Check if Dockerfile exists
    if [ ! -f "$dockerfile" ]; then
        echo -e "${RED}Error: Dockerfile not found at ${dockerfile}${NC}"
        return 1
    fi

    # Build the image
    if docker build $NO_CACHE -t "${image_name}" -f "${dockerfile}" "${context_dir}"; then
        echo -e "${GREEN}✓ Built ${service_name} successfully${NC}"

        # Also tag as latest if not already latest
        if [ "$TAG" != "latest" ] && [ -n "$REGISTRY" ]; then
            docker tag "${image_name}" "${REGISTRY}/uex-payments-${service_name}:latest"
            echo -e "${GREEN}✓ Tagged as latest${NC}"
        fi

        # Push if enabled
        if [ "$PUSH" = true ]; then
            echo -e "${YELLOW}Pushing ${image_name}...${NC}"
            if docker push "${image_name}"; then
                echo -e "${GREEN}✓ Pushed ${service_name} successfully${NC}"

                # Push latest tag too
                if [ "$TAG" != "latest" ]; then
                    docker push "${REGISTRY}/uex-payments-${service_name}:latest"
                    echo -e "${GREEN}✓ Pushed latest tag${NC}"
                fi
            else
                echo -e "${RED}✗ Failed to push ${service_name}${NC}"
                return 1
            fi
        fi

        echo ""
        return 0
    else
        echo -e "${RED}✗ Failed to build ${service_name}${NC}"
        echo ""
        return 1
    fi
}

# Main build process
echo -e "${YELLOW}Starting build process...${NC}"
echo ""

BUILD_ERRORS=0

if [ -n "$SPECIFIC_SERVICE" ]; then
    # Build specific service
    if [ -z "${SERVICES[$SPECIFIC_SERVICE]}" ]; then
        echo -e "${RED}Error: Unknown service '${SPECIFIC_SERVICE}'${NC}"
        echo "Available services: ${!SERVICES[@]}"
        exit 1
    fi

    if ! build_service "$SPECIFIC_SERVICE" "${SERVICES[$SPECIFIC_SERVICE]}"; then
        BUILD_ERRORS=$((BUILD_ERRORS + 1))
    fi
else
    # Build all services
    for service_name in "${!SERVICES[@]}"; do
        if ! build_service "$service_name" "${SERVICES[$service_name]}"; then
            BUILD_ERRORS=$((BUILD_ERRORS + 1))
        fi
    done
fi

# Summary
echo -e "${BLUE}==============================================================================${NC}"
if [ $BUILD_ERRORS -eq 0 ]; then
    echo -e "${GREEN}Build Complete - All images built successfully!${NC}"
    echo -e "${BLUE}==============================================================================${NC}"
    echo ""
    echo "Built images:"
    docker images | grep "uex-payments" | head -n 20
    echo ""

    if [ "$PUSH" = false ] && [ -n "$REGISTRY" ]; then
        echo "To push images to registry, run:"
        echo "  ./scripts/build-images-k8s.sh --registry ${REGISTRY} --tag ${TAG} --push"
        echo ""
    fi

    echo "Next steps:"
    echo "  1. Update kubernetes/base/services.yaml with correct image names"
    echo "  2. Create secrets: kubectl create secret generic uex-secrets ..."
    echo "  3. Deploy: ./scripts/deploy-kubernetes.sh dev"
    echo ""
else
    echo -e "${RED}Build Failed - ${BUILD_ERRORS} error(s) occurred${NC}"
    echo -e "${BLUE}==============================================================================${NC}"
    exit 1
fi
