# Sahabat Kreator — Deployment Script
# ====================================
# Script untuk deploy ke VPS dengan port yang sudah tersedia
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

echo "================================================"
echo "Deploying to $ENV ($DOMAIN)"
echo "Port: Web=$WEB_PORT, Server=$SERVER_PORT"
echo "================================================"

case "$ENV" in
    production|staging)
        echo "🚀 Building and deploying..."
        
        # Stop existing containers
        echo "Stopping existing containers..."
        docker compose -f $COMPOSE_FILE down
        
        # Build and start
        echo "Building images..."
        docker compose -f $COMPOSE_FILE build --no-cache
        
        echo "Starting services..."
        docker compose -f $COMPOSE_FILE up -d
        
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
        
        # Show status
        echo ""
        echo "📊 Service Status:"
        docker compose -f $COMPOSE_FILE ps
        
        echo ""
        echo "✅ Deployment to $DOMAIN completed!"
        echo "   Web: https://$DOMAIN"
        echo "   API: https://api.$DOMAIN"
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
        echo "⚠️  Rolling back to previous version..."
        docker compose -f $COMPOSE_FILE down
        docker pull ghcr.io/your-org/sahabat-kreator/server:previous
        docker pull ghcr.io/your-org/sahabat-kreator/web:previous
        docker pull ghcr.io/your-org/sahabat-kreator/worker:previous
        docker compose -f $COMPOSE_FILE up -d
        echo "✅ Rollback completed!"
        ;;
esac
