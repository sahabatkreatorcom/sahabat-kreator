# Sahabat Kreator — Deployment Script
# ====================================
# Script untuk deploy ke VPS dengan port yang sudah tersedia
#
# DEPLOYMENT FLOW:
#   1. git pull (sync source code)
#   2. docker compose pull (ambil image terbaru dari GHCR)
#   3. docker compose up -d (jalankan containers)
#   4. health check
#
# CI/CD INTEGRATION:
#   - GitHub Actions: lint, type check, build, push image ke GHCR
#   - Deploy script: pull image dari GHCR, bukan build lokal
#
# PORT CONFIGURATION:
#   Web (Next.js)    : 8080
#   Server (Hono)    : 8081
#   Port lain (3000, 3001, 3002, 3100, 3200, 6379, 5432) - SUDAH DIGUNAKAN
#
# USAGE:
#   chmod +x deploy.sh
#   ./deploy.sh production
#   ./deploy.sh staging
#   ./deploy.sh status
#   ./deploy.sh rollback
#
# ENV VARS:
#   GITHUB_TOKEN      - Required for pulling from GHCR (set in .env.production.local)
#   IMAGE_REGISTRY    - Override default registry (default: ghcr.io/sahabatkreatorcom/sahabat-kreator)
#   IMAGE_TAG         - Override image tag (default: latest, or commit SHA)

set -e

ENV=${1:-production}

if [ "$ENV" = "production" ]; then
    DOMAIN="sahabatkreator.com"
    COMPOSE_FILE="docker-compose.prod.yml"
    WEB_PORT=8080
    SERVER_PORT=8081
elif [ "$ENV" = "staging" ]; then
    DOMAIN="app.sahabatkreator.com"
    COMPOSE_FILE="docker-compose.prod.yml"
    WEB_PORT=8080
    SERVER_PORT=8081
else
    echo "Usage: $0 {production|staging|status|rollback}"
    exit 1
fi

# Source environment file if it exists
if [ -f ".env.production.local" ]; then
    set -a
    source .env.production.local
    set +a
    echo "📄 Loaded .env.production.local"
fi

echo "================================================"
echo "Deploying to $ENV ($DOMAIN)"
echo "Port: Web=$WEB_PORT, Server=$SERVER_PORT"
echo "Image Tag: $IMAGE_TAG"
echo "================================================"

# Detect current git commit for image tagging
CURRENT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
export IMAGE_TAG="${2:-latest}"

case "$ENV" in
    production|staging)
        echo "🚀 Deploying from registry ($IMAGE_TAG)..."
        
        # Sync source code
        echo "Syncing source code..."
        git config --global --add safe.directory /opt/sahabat-kreator
        git pull --ff-only 2>/dev/null || echo "⚠️  Git pull failed, continuing with existing code"
        
        # Stop existing containers
        echo "Stopping existing containers..."
        docker compose -f $COMPOSE_FILE down
        
        # Stop any old Sahabat containers from previous deployments
        echo "Cleaning up old containers..."
        for old in sk_server sk_worker sk_web sk_postgres sk_redis; do
            if docker ps -a --format "{{.Names}}" | grep -q "^${old}$"; then
                echo "  Stopping $old..."
                docker stop $old 2>/dev/null || true
                docker rm $old 2>/dev/null || true
            fi
        done
        
        # Login to GitHub Container Registry if token available
        if [ -n "$GITHUB_TOKEN" ]; then
            echo "Logging in to GHCR..."
            echo "$GITHUB_TOKEN" | docker login ghcr.io -u sahabatkreatorcom --password-stdin
        else
            echo "⚠️  GITHUB_TOKEN not found in environment"
            echo "   Set it in .env.production.local or export before running"
        fi
        
        # Pull images from registry (force fresh pull)
        echo "Pulling images from registry..."
        docker compose -f $COMPOSE_FILE pull || {
            echo "❌ Failed to pull images from registry"
            echo "   Make sure GITHUB_TOKEN is set correctly"
            exit 1
        }
        
        # Start services
        echo "Starting services..."
        docker compose -f $COMPOSE_FILE up -d
        
        # Wait for postgres to be ready
        echo "Waiting for PostgreSQL to be ready..."
        PG_DB="${PGDATABASE:-sahabatkreator}"
        for i in {1..30}; do
            if docker exec sk_postgres pg_isready -U ${PGUSER:-postgres} -d "$PG_DB" > /dev/null 2>&1; then
                echo "✅ PostgreSQL is ready!"
                break
            fi
            if [ $i -eq 30 ]; then
                echo "❌ PostgreSQL not ready after 30 attempts"
                exit 1
            fi
            sleep 2
            echo "Waiting... ($i/30)"
        done
        
        # Run database migrations if migration file exists
        MIGRATION_FILE="packages/db/src/migrations/0000_clumsy_rafael_vega.sql"
        if [ -f "$MIGRATION_FILE" ]; then
            echo "Running database migrations..."
            docker exec -i sk_postgres psql -U ${PGUSER:-postgres} -d "$PG_DB" < "$MIGRATION_FILE" || echo "⚠️  Migration may have failed, check logs"
            echo "✅ Database migrations completed"
        fi
        
        # Health check
        echo "Checking health..."
        for i in {1..30}; do
            if docker exec sk_server curl -sf http://localhost:3001/health > /dev/null 2>&1; then
                echo "✅ Server is healthy!"
                break
            fi
            if [ $i -eq 30 ]; then
                echo "❌ Health check failed after 30 attempts"
                docker compose -f $COMPOSE_FILE logs --tail=100 server
                exit 1
            fi
            sleep 2
            echo "Waiting... ($i/30)"
        done
        
        # Verify image versions
        echo ""
        echo "📋 Image Versions:"
        docker compose -f $COMPOSE_FILE ps --format "table {{.Name}}\t{{.Image}}\t{{.Status}}"
        
        # Show status
        echo ""
        echo "📊 Service Status:"
        docker compose -f $COMPOSE_FILE ps
        
        echo ""
        echo "✅ Deployment to $DOMAIN completed!"
        echo "   Web: https://$DOMAIN"
        echo "   API: https://api.$DOMAIN"
        echo "   Commit: $CURRENT_SHA"
        ;;
    
    status)
        echo "📊 Current Status:"
        docker compose -f docker-compose.prod.yml ps
        echo ""
        echo "📈 Port Usage:"
        echo "   Web (Next.js):    :$WEB_PORT"
        echo "   Server (Hono):    :$SERVER_PORT"
        echo "   PostgreSQL:       5432 (host)"
        echo "   Redis:            6379 (host)"
        echo ""
        echo "📋 Recent Logs:"
        docker compose -f $COMPOSE_FILE logs --tail=20
        ;;
    
    rollback)
        echo "⚠️  Rolling back app containers only (postgres & redis preserved)..."
        # Only restart app services — never touch infra (postgres, redis) during rollback
        docker compose -f $COMPOSE_FILE up -d server worker web --force-recreate
        echo "✅ Rollback completed!"
        ;;
esac
