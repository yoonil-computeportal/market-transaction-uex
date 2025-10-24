# ==============================================================================
# Presentation Dashboard - Dockerfile
# ==============================================================================
# Static HTML dashboard served via nginx
# Port: 3900
# ==============================================================================

FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy static files
COPY . /usr/share/nginx/html/

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 3900

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3900/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
