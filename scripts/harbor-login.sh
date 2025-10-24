#!/bin/bash
# ==============================================================================
# Harbor Registry Login Script
# ==============================================================================
# Logs into Harbor container registry at repository.computeportal.app
#
# Usage:
#   ./scripts/harbor-login.sh
# ==============================================================================

set -e

HARBOR_URL="repository.computeportal.app"
HARBOR_USERNAME="admin"
HARBOR_PASSWORD="Rnaehfdl01"

echo "🔐 Logging into Harbor registry..."
echo "Registry: https://$HARBOR_URL"
echo "Username: $HARBOR_USERNAME"

# Login to Harbor
echo "$HARBOR_PASSWORD" | docker login $HARBOR_URL -u $HARBOR_USERNAME --password-stdin

if [ $? -eq 0 ]; then
    echo "✅ Successfully logged into Harbor registry"
    echo "📦 You can now push images to: $HARBOR_URL"
else
    echo "❌ Failed to login to Harbor registry"
    exit 1
fi

# Test connection
echo ""
echo "🧪 Testing registry connection..."
docker pull $HARBOR_URL/library/hello-world:latest 2>/dev/null || echo "⚠️  Note: Test image not found (this is normal for new registry)"

echo ""
echo "✅ Harbor login complete!"
echo "Next step: Run ./scripts/build-and-push-harbor.sh"
