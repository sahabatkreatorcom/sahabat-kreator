# Sahabat Kreator — Production Deployment Guide

## Overview

Deploy Sahabat Kreator ke VPS dengan port yang sudah tersedia.

```
Internet → Cloudflare → Nginx (port 80/443)
                     ├── sahabatkreator.com  → Web (8080) + API (8081)
                     └── app.sahabatkreator.com → Dev/Staging
```

**Port Configuration:**
- Web (Next.js): `8080`
- Server (Hono): `8081`
- PostgreSQL: `5432` (host)
- Redis: `6379` (host)
- Port lain (3000, 3001, 3002, 3100, 3200): SUDAH DIGUNAKAN

---

## Prerequisites

- **Server**: Ubuntu 22.04+ dengan 2GB+ RAM, 2 vCPU
- **Domains**:
  - `sahabatkreator.com` — PRODUCTION
  - `app.sahabatkreator.com` — DEVELOPMENT/STAGING
- **Cloudflare**: Account dengan DNS configured
- **SSL**: Cloudflare Origin Certificate (`origin.crt`, `origin.key`)
- **Docker**: `curl -fsSL https://get.docker.com | sh`
- **Docker Compose**: `docker compose plugin`

---

## Step 1: Clone & Prepare

```bash
ssh root@your-server-ip

git clone https://github.com/sahabatkreatorcom/sahabat-kreator.git /opt/sahabat-kreator
cd /opt/sahabat-kreator

# Create environment
cp .env.example .env.production
nano .env.production  # Fill in all values
```

---

## Step 2: Upload SSL Certificates

```bash
# Create SSL directory
mkdir -p /etc/nginx/ssl/sahabatkreator

# Upload certificates (from your local machine)
scp origin.crt root@your-server-ip:/etc/nginx/ssl/sahabatkreator/
scp origin.key root@your-server-ip:/etc/nginx/ssl/sahabatkreator/

# Set permissions
chmod 600 /etc/nginx/ssl/sahabatkreator/origin.key
```

---

## Step 3: Configure Nginx

### Production (sahabatkreator.com)

```bash
# Copy nginx config
cp /opt/sahabat-kreator/nginx-production.conf /etc/nginx/sites-available/sahabatkreator.com
ln -s /etc/nginx/sites-available/sahabatkreator.com /etc/nginx/sites-enabled/

# Test and reload
nginx -t && systemctl reload nginx
```

### Development (app.sahabatkreator.com)

```bash
# Copy nginx config
cp /opt/sahabat-kreator/nginx-development.conf /etc/nginx/sites-available/app.sahabatkreator.com
ln -s /etc/nginx/sites-available/app.sahabatkreator.com /etc/nginx/sites-enabled/

# Test and reload
nginx -t && systemctl reload nginx
```

---

## Step 4: Deploy with Docker Compose

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f server
docker compose -f docker-compose.prod.yml logs -f web
```

---

## Step 5: Run Database Migrations

```bash
# Connect to server container
docker exec -it sk_server bun run db:migrate

# Or open Drizzle Studio
docker exec -it sk_server bun run db:studio
```

---

## Step 6: Verify Deployment

```bash
# Check server health
curl https://api.sahabatkreator.com/health

# Check web health
curl https://sahabatkreator.com/api/health

# Check worker
docker logs sk_worker --tail 50
```

---

## Maintenance Commands

```bash
# Restart all services
docker compose -f docker-compose.prod.yml restart

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Pull latest and redeploy
git pull
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# Backup database
docker exec sk_postgres pg_dump -U postgres sahabatkreator > backup-$(date +%Y%m%d).sql
```

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Nginx     │────▶│   Web       │────▶│   Server    │
│  (port 80/  │     │  (port 8080 │     │  (port 8081 │
│   443)      │     │   / Next)   │     │   / Hono)   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┘
                    ▼
              ┌─────────────┐     ┌─────────────┐
              │   Worker    │────▶│    Redis    │
              │             │     │   (BullMQ)  │
              └─────────────┘     └─────────────┘
                     │
                     ▼
              ┌─────────────┐
              │  PostgreSQL │
              │   (host:543│
              │    2)       │
              └─────────────┘
```

---

## URL Structure

| Domain | Purpose | Port |
|--------|---------|------|
| `https://sahabatkreator.com` | Production Web App | 8080 |
| `https://sahabatkreator.com/api/*` | Production API | 8081 |
| `https://app.sahabatkreator.com` | Development/Staging | 8080 |
| `https://app.sahabatkreator.com/api/*` | Development API | 8081 |

---

## Troubleshooting

### Containers won't start
```bash
docker logs sk_server
docker logs sk_web
docker logs sk_worker
```

### Port already in use
```bash
# Check what's using the port
netstat -tlnp | grep -E '8080|8081'

# If needed, change port in docker-compose.prod.yml
```

### Database connection failed
```bash
# Check PostgreSQL (host)
pg_isready -h localhost -U postgres

# Check Docker container
docker exec sk_postgres pg_isready -U postgres
```

### Worker not processing jobs
```bash
docker logs sk_worker | grep -i bullmq
```

---

## Quick Deploy Script

```bash
# Make script executable
chmod +x deploy.sh

# Deploy to production
./deploy.sh production

# Check status
./deploy.sh status

# Rollback
./deploy.sh rollback
```
