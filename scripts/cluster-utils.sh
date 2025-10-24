#!/bin/bash
# ==============================================================================
# Kubernetes Cluster Utilities
# ==============================================================================
# Helper commands for managing the test cluster
#
# Usage:
#   ./scripts/cluster-utils.sh <command>
#
# Commands:
#   status      - Show cluster and deployment status
#   logs        - View logs from all services
#   shell       - Open shell in a pod
#   restart     - Restart a deployment
#   scale       - Scale a deployment
#   cleanup     - Remove all deployments
#   test        - Run health checks
# ==============================================================================

CLUSTER_CONTROLLER="100.64.0.91"
NAMESPACE="uex-payments-dev"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Command: status
cmd_status() {
    echo "📊 Cluster Status"
    echo "=========================================="
    echo ""

    echo "Nodes:"
    kubectl get nodes -o wide
    echo ""

    echo "Namespaces:"
    kubectl get namespaces
    echo ""

    echo "Pods in $NAMESPACE:"
    kubectl get pods -n $NAMESPACE -o wide
    echo ""

    echo "Services in $NAMESPACE:"
    kubectl get svc -n $NAMESPACE
    echo ""

    echo "Deployments in $NAMESPACE:"
    kubectl get deployments -n $NAMESPACE
    echo ""

    echo "HPA Status:"
    kubectl get hpa -n $NAMESPACE
    echo ""

    echo "PV/PVC Status:"
    kubectl get pv,pvc -n $NAMESPACE
    echo ""

    echo "Ingress:"
    kubectl get ingress -n $NAMESPACE
    echo ""
}

# Command: logs
cmd_logs() {
    local service="${1:-uex-backend}"

    echo "📜 Viewing logs for: $service"
    echo "=========================================="

    kubectl logs -f deployment/$service -n $NAMESPACE --tail=100
}

# Command: shell
cmd_shell() {
    local service="${1:-uex-backend}"

    echo "🐚 Opening shell in: $service"
    echo "=========================================="

    local pod=$(kubectl get pod -n $NAMESPACE -l app=$service -o jsonpath='{.items[0].metadata.name}')

    if [ -z "$pod" ]; then
        echo -e "${RED}❌ No pod found for $service${NC}"
        exit 1
    fi

    kubectl exec -it $pod -n $NAMESPACE -- /bin/sh
}

# Command: restart
cmd_restart() {
    local service="${1:-all}"

    echo "🔄 Restarting: $service"
    echo "=========================================="

    if [ "$service" = "all" ]; then
        kubectl rollout restart deployment -n $NAMESPACE
    else
        kubectl rollout restart deployment/$service -n $NAMESPACE
    fi

    echo -e "${GREEN}✅ Restart initiated${NC}"
}

# Command: scale
cmd_scale() {
    local service="${1}"
    local replicas="${2:-2}"

    if [ -z "$service" ]; then
        echo "Usage: $0 scale <service> <replicas>"
        exit 1
    fi

    echo "📈 Scaling $service to $replicas replicas"
    echo "=========================================="

    kubectl scale deployment/$service --replicas=$replicas -n $NAMESPACE

    echo -e "${GREEN}✅ Scaling initiated${NC}"
}

# Command: cleanup
cmd_cleanup() {
    echo -e "${RED}⚠️  WARNING: This will delete all deployments in $NAMESPACE${NC}"
    echo "Are you sure? (yes/no)"
    read -r confirm

    if [ "$confirm" != "yes" ]; then
        echo "Cancelled"
        exit 0
    fi

    echo "🧹 Cleaning up..."
    echo "=========================================="

    kubectl delete namespace $NAMESPACE
    kubectl delete pv postgres-pv redis-pv logs-pv --ignore-not-found=true

    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Command: test
cmd_test() {
    echo "🧪 Running Health Checks"
    echo "=========================================="

    echo ""
    echo "Testing UEX Backend API:"
    curl -s http://$CLUSTER_CONTROLLER:30903/api/payments/health | jq . || echo "Failed to connect"

    echo ""
    echo "Testing Presentation:"
    curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://$CLUSTER_CONTROLLER:30900

    echo ""
    echo "Testing Client Tier:"
    curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://$CLUSTER_CONTROLLER:30901

    echo ""
    echo "Checking pod health:"
    kubectl get pods -n $NAMESPACE | grep -v Running | grep -v Completed || echo -e "${GREEN}All pods running${NC}"

    echo ""
}

# Command: describe
cmd_describe() {
    local resource="${1}"

    if [ -z "$resource" ]; then
        echo "Usage: $0 describe <pod-name>"
        exit 1
    fi

    kubectl describe pod/$resource -n $NAMESPACE
}

# Command: port-forward
cmd_port_forward() {
    local service="${1:-uex-backend}"
    local local_port="${2:-3903}"
    local remote_port="${3:-3903}"

    echo "🔌 Port forwarding $service"
    echo "Local: http://localhost:$local_port"
    echo "Remote: $remote_port"
    echo "=========================================="

    kubectl port-forward -n $NAMESPACE deployment/$service $local_port:$remote_port
}

# Main command dispatcher
case "${1}" in
    status)
        cmd_status
        ;;
    logs)
        cmd_logs "${2}"
        ;;
    shell)
        cmd_shell "${2}"
        ;;
    restart)
        cmd_restart "${2}"
        ;;
    scale)
        cmd_scale "${2}" "${3}"
        ;;
    cleanup)
        cmd_cleanup
        ;;
    test)
        cmd_test
        ;;
    describe)
        cmd_describe "${2}"
        ;;
    port-forward|pf)
        cmd_port_forward "${2}" "${3}" "${4}"
        ;;
    *)
        echo "Usage: $0 {status|logs|shell|restart|scale|cleanup|test|describe|port-forward}"
        echo ""
        echo "Commands:"
        echo "  status              - Show cluster status"
        echo "  logs [service]      - View logs (default: uex-backend)"
        echo "  shell [service]     - Open shell (default: uex-backend)"
        echo "  restart [service]   - Restart deployment (default: all)"
        echo "  scale <svc> <num>   - Scale deployment"
        echo "  cleanup             - Remove all deployments"
        echo "  test                - Run health checks"
        echo "  describe <pod>      - Describe pod"
        echo "  port-forward <svc> <local> <remote> - Port forward"
        exit 1
        ;;
esac
