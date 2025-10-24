#!/bin/bash
# ==============================================================================
# Terraform Validation Script
# ==============================================================================
#
# This script validates all Terraform configurations across all environments.
#
# Usage:
#   ./scripts/validate.sh [environment]
#
# Arguments:
#   environment  - dev, staging, prod, or all (default: all)
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
ENVIRONMENT="${1:-all}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Validate single environment
validate_environment() {
    local env=$1
    local env_dir="${TERRAFORM_ROOT}/environments/${env}"

    if [ ! -d "${env_dir}" ]; then
        echo -e "${YELLOW}⚠  Environment directory not found: ${env}${NC}"
        return 1
    fi

    echo -e "${BLUE}Validating ${env} environment...${NC}"
    cd "${env_dir}"

    # Initialize if needed
    if [ ! -d ".terraform" ]; then
        echo -e "${YELLOW}  Initializing...${NC}"
        terraform init -backend=false > /dev/null
    fi

    # Validate
    if terraform validate; then
        echo -e "${GREEN}  ✓ ${env} configuration valid${NC}"
        return 0
    else
        echo -e "${RED}  ✗ ${env} configuration invalid${NC}"
        return 1
    fi
}

# Main
echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}Terraform Configuration Validation${NC}"
echo -e "${BLUE}==============================================================================${NC}"
echo ""

FAILED=0

if [ "${ENVIRONMENT}" == "all" ]; then
    # Validate all environments
    for env in dev staging prod; do
        if ! validate_environment "${env}"; then
            FAILED=1
        fi
        echo ""
    done
else
    # Validate specific environment
    if ! validate_environment "${ENVIRONMENT}"; then
        FAILED=1
    fi
fi

# Summary
echo -e "${BLUE}==============================================================================${NC}"
if [ ${FAILED} -eq 0 ]; then
    echo -e "${GREEN}All validations passed!${NC}"
    exit 0
else
    echo -e "${RED}Some validations failed${NC}"
    exit 1
fi
