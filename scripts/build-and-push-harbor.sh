#!/bin/bash
# ==============================================================================
# Build and Push All Docker Images to Harbor Registry
# ==============================================================================
# Builds all 6 service images and pushes them to Harbor
#
# Usage:
#   ./scripts/build-and-push-harbor.sh [OPTIONS]
#
# Options:
#   --service <name>    Build only specific service
#   --tag <version>     Custom tag (default: latest)
#   --no-cache          Build without cache
#   --skip-push         Build only, don't push
# ==============================================================================

set -e

# Configuration
HARBOR_URL="repository.computeportal.app"
HARBOR_PROJECT="uex-payments"
TAG="${TAG:-latest}"
NO_CACHE=""
SKIP_PUSH=false
SPECIFIC_SERVICE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --service)
            SPECIFIC_SERVICE="$2"
            shift 2
            ;;
        --tag)
            TAG="$2"
            shift 2
            ;;
        --no-cache)
            NO_CACHE="--no-cache"
            shift
            ;;
        --skip-push)
            SKIP_PUSH=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Service definitions
declare -A SERVICES=(
    ["presentation"]="./presentation"
    ["client-tier"]="./client-tier"
    ["management-frontend"]="./management-tier/frontend"
    ["uex-backend"]="./uex"
    ["processing-tier"]="./processing-tier"
    ["management-backend"]="./management-tier/backend"
)

# Function to build and push a service
build_and_push_service() {
    local service_name=$1
    local service_path=$2
    local image_name="$HARBOR_URL/$HARBOR_PROJECT/$service_name:$TAG"

    echo ""
    echo "=========================================="
    echo "📦 Building: $service_name"
    echo "=========================================="
    echo "Path: $service_path"
    echo "Image: $image_name"
    echo "Tag: $TAG"

    # Check if Dockerfile exists
    if [ ! -f "$service_path/Dockerfile" ]; then
        echo -e "${RED}❌ Dockerfile not found: $service_path/Dockerfile${NC}"
        return 1
    fi

    # Build the image
    echo ""
    echo "🔨 Building Docker image..."
    docker build $NO_CACHE -t $image_name -f $service_path/Dockerfile $service_path

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to build $service_name${NC}"
        return 1
    fi

    echo -e "${GREEN}✅ Successfully built $service_name${NC}"

    # Push to Harbor
    if [ "$SKIP_PUSH" = false ]; then
        echo ""
        echo "🚀 Pushing to Harbor registry..."
        docker push $image_name

        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Failed to push $service_name${NC}"
            return 1
        fi

        echo -e "${GREEN}✅ Successfully pushed $service_name${NC}"
    else
        echo -e "${YELLOW}⏭️  Skipping push (--skip-push flag)${NC}"
    fi

    # Also tag as latest if not already
    if [ "$TAG" != "latest" ]; then
        local latest_image="$HARBOR_URL/$HARBOR_PROJECT/$service_name:latest"
        echo ""
        echo "🏷️  Tagging as latest..."
        docker tag $image_name $latest_image

        if [ "$SKIP_PUSH" = false ]; then
            docker push $latest_image
            echo -e "${GREEN}✅ Also pushed as latest${NC}"
        fi
    fi

    return 0
}

# Main execution
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Build and Push to Harbor Registry                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Registry: https://$HARBOR_URL"
echo "Project: $HARBOR_PROJECT"
echo "Tag: $TAG"
echo "No Cache: ${NO_CACHE:-false}"
echo "Skip Push: $SKIP_PUSH"

# Check if logged into Harbor
echo ""
echo "🔐 Checking Harbor login status..."
docker login $HARBOR_URL --password-stdin <<< "Rnaehfdl01" -u admin > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Not logged into Harbor. Run ./scripts/harbor-login.sh first${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Harbor login verified${NC}"

# Build services
SUCCESS_COUNT=0
FAIL_COUNT=0
TOTAL_COUNT=0

if [ -n "$SPECIFIC_SERVICE" ]; then
    # Build only specific service
    if [ -z "${SERVICES[$SPECIFIC_SERVICE]}" ]; then
        echo -e "${RED}❌ Unknown service: $SPECIFIC_SERVICE${NC}"
        echo "Available services: ${!SERVICES[@]}"
        exit 1
    fi

    TOTAL_COUNT=1
    if build_and_push_service "$SPECIFIC_SERVICE" "${SERVICES[$SPECIFIC_SERVICE]}"; then
        SUCCESS_COUNT=1
    else
        FAIL_COUNT=1
    fi
else
    # Build all services
    TOTAL_COUNT=${#SERVICES[@]}

    for service_name in "${!SERVICES[@]}"; do
        if build_and_push_service "$service_name" "${SERVICES[$service_name]}"; then
            ((SUCCESS_COUNT++))
        else
            ((FAIL_COUNT++))
        fi
    done
fi

# Summary
echo ""
echo "=========================================="
echo "📊 Build Summary"
echo "=========================================="
echo "Total Services: $TOTAL_COUNT"
echo -e "${GREEN}✅ Successful: $SUCCESS_COUNT${NC}"
echo -e "${RED}❌ Failed: $FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 All images built and pushed successfully!${NC}"
    echo ""
    echo "📝 Images available at:"
    for service_name in "${!SERVICES[@]}"; do
        if [ -z "$SPECIFIC_SERVICE" ] || [ "$SPECIFIC_SERVICE" = "$service_name" ]; then
            echo "  - $HARBOR_URL/$HARBOR_PROJECT/$service_name:$TAG"
        fi
    done
    echo ""
    echo "Next step: Run ./scripts/deploy-to-k8s-cluster.sh"
    exit 0
else
    echo -e "${RED}⚠️  Some images failed to build/push${NC}"
    exit 1
fi
