#!/bin/bash
# ==============================================================================
# Terraform Deployment Script
# ==============================================================================
#
# This script automates the deployment of the UEX Payment Processing System
# infrastructure using Terraform.
#
# Usage:
#   ./scripts/deploy.sh <environment> [action]
#
# Arguments:
#   environment  - dev, staging, or prod
#   action       - plan, apply, or destroy (default: plan)
#
# Examples:
#   ./scripts/deploy.sh dev plan
#   ./scripts/deploy.sh prod apply
#   ./scripts/deploy.sh staging destroy
#
# ==============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-}"
ACTION="${2:-plan}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TERRAFORM_DIR="${PROJECT_ROOT}/terraform/environments/${ENVIRONMENT}"

# Function to print usage
usage() {
    echo "Usage: $0 <environment> [action]"
    echo ""
    echo "Arguments:"
    echo "  environment  - dev, staging, or prod"
    echo "  action       - plan, apply, or destroy (default: plan)"
    echo ""
    echo "Examples:"
    echo "  $0 dev plan"
    echo "  $0 prod apply"
    echo "  $0 staging destroy"
    exit 1
}

# Function to print banner
print_banner() {
    echo -e "${BLUE}==============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}==============================================================================${NC}"
    echo ""
}

# Validate arguments
if [ -z "${ENVIRONMENT}" ]; then
    echo -e "${RED}Error: Environment is required${NC}"
    usage
fi

if [[ ! "${ENVIRONMENT}" =~ ^(dev|staging|prod)$ ]]; then
    echo -e "${RED}Error: Invalid environment '${ENVIRONMENT}'. Must be dev, staging, or prod.${NC}"
    usage
fi

if [[ ! "${ACTION}" =~ ^(plan|apply|destroy)$ ]]; then
    echo -e "${RED}Error: Invalid action '${ACTION}'. Must be plan, apply, or destroy.${NC}"
    usage
fi

# Check if terraform directory exists
if [ ! -d "${TERRAFORM_DIR}" ]; then
    echo -e "${RED}Error: Terraform directory not found: ${TERRAFORM_DIR}${NC}"
    exit 1
fi

# Change to terraform directory
cd "${TERRAFORM_DIR}"

print_banner "Terraform Deployment - ${ENVIRONMENT}"
echo "Environment:  ${ENVIRONMENT}"
echo "Action:       ${ACTION}"
echo "Directory:    ${TERRAFORM_DIR}"
echo ""

# Initialize Terraform if needed
if [ ! -d ".terraform" ]; then
    echo -e "${YELLOW}Initializing Terraform...${NC}"
    terraform init
    echo -e "${GREEN}✓ Terraform initialized${NC}"
    echo ""
fi

# Validate configuration
echo -e "${YELLOW}Validating Terraform configuration...${NC}"
terraform validate
echo -e "${GREEN}✓ Configuration valid${NC}"
echo ""

# Format check
echo -e "${YELLOW}Checking Terraform formatting...${NC}"
if ! terraform fmt -check -recursive; then
    echo -e "${YELLOW}⚠ Files need formatting. Run 'terraform fmt -recursive' to fix.${NC}"
fi
echo ""

# Execute action
case "${ACTION}" in
    plan)
        print_banner "Creating Terraform Plan"
        terraform plan -out=tfplan
        echo ""
        echo -e "${GREEN}✓ Plan created successfully${NC}"
        echo ""
        echo "To apply this plan, run:"
        echo "  cd ${TERRAFORM_DIR}"
        echo "  terraform apply tfplan"
        echo ""
        echo "Or use:"
        echo "  $0 ${ENVIRONMENT} apply"
        ;;

    apply)
        print_banner "Applying Terraform Configuration"

        # Production safety check
        if [ "${ENVIRONMENT}" == "prod" ]; then
            echo -e "${RED}⚠  WARNING: You are about to deploy to PRODUCTION!${NC}"
            echo ""
            read -p "Type 'yes' to continue: " confirm
            if [ "${confirm}" != "yes" ]; then
                echo -e "${YELLOW}Deployment cancelled${NC}"
                exit 0
            fi
            echo ""
        fi

        # Check if plan exists
        if [ -f "tfplan" ]; then
            echo -e "${YELLOW}Applying existing plan...${NC}"
            terraform apply tfplan
            rm -f tfplan
        else
            echo -e "${YELLOW}No plan file found. Creating and applying...${NC}"
            terraform apply
        fi

        echo ""
        echo -e "${GREEN}==============================================================================${NC}"
        echo -e "${GREEN}Deployment Complete!${NC}"
        echo -e "${GREEN}==============================================================================${NC}"
        echo ""
        echo "To view outputs:"
        echo "  terraform output"
        echo ""
        echo "To view ALB URL:"
        echo "  terraform output alb_url"
        echo ""
        echo "To view CloudWatch dashboard:"
        echo "  terraform output cloudwatch_dashboard_url"
        ;;

    destroy)
        print_banner "Destroying Terraform Resources"

        echo -e "${RED}⚠  WARNING: You are about to DESTROY all resources in ${ENVIRONMENT}!${NC}"
        echo ""
        echo -e "${RED}This action cannot be undone!${NC}"
        echo ""
        read -p "Type 'destroy-${ENVIRONMENT}' to continue: " confirm
        if [ "${confirm}" != "destroy-${ENVIRONMENT}" ]; then
            echo -e "${YELLOW}Destruction cancelled${NC}"
            exit 0
        fi
        echo ""

        terraform destroy

        echo ""
        echo -e "${GREEN}All resources destroyed${NC}"
        ;;
esac
