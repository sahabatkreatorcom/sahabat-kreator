# GitHub Actions — Deployment Guide

## Workflow Overview

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   CI          │    │  Build       │    │   Deploy     │
│  (Lint/Test)  │───▶│  (Docker)    │───▶│   (VPS)      │
└──────────────┘    └──────────────┘    └──────────────┘
      PR/Main              Main branch           Manual/Auto
```

---

## Workflows

### 1. CI (`.github/workflows/ci.yml`)
- **Trigger**: Push to `main`/`master`, Pull Request
- **Jobs**:
  - Lint with Biome
  - Type check with TypeScript
  - Build all apps
  - Run tests
- **Caching**: Bun install cache for faster builds

### 2. Build (`.github/workflows/build.yml`)
- **Trigger**: Push to `main`/`master`, Manual dispatch
- **Jobs**:
  - Build Docker images for server, web, worker
  - Push to GitHub Container Registry (GHCR)
  - Use BuildKit cache for faster subsequent builds

### 3. Deploy Production (`.github/workflows/deploy.yml`)
- **Trigger**: After successful build, or manual dispatch
- **Jobs**:
  - Deploy to production VPS (`sahabatkreator.com`)
  - Health check validation
  - Rollback on failure

### 4. Deploy Staging (`.github/workflows/deploy-staging.yml`)
- **Trigger**: Push to `develop`/`staging` branch
- **Jobs**:
  - Deploy to staging VPS (`app.sahabatkreator.com`)

---

## Repository Secrets

| Secret | Description | Example |
|--------|-------------|---------|
| `PRODUCTION_VPS_HOST` | Production server IP/hostname | `192.168.1.100` |
| `PRODUCTION_VPS_USER` | SSH username | `deploy` |
| `PRODUCTION_VPS_SSH_KEY` | SSH private key | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PRODUCTION_VPS_PORT` | SSH port | `22` |
| `STAGING_VPS_HOST` | Staging server IP/hostname | `192.168.1.101` |
| `STAGING_VPS_USER` | SSH username | `deploy` |
| `STAGING_VPS_SSH_KEY` | SSH private key | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `STAGING_VPS_PORT` | SSH port | `22` |

### How to Add Secrets

1. Go to GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret from the table above

---

## GitHub Container Registry (GHCR)

Images are pushed to:
```
ghcr.io/your-org/sahabat-kreator/server:latest
ghcr.io/your-org/sahabat-kreator/web:latest
ghcr.io/your-org/sahabat-kreator/worker:latest
```

### Accessing Images Locally

```bash
# Login to GHCR
docker login ghcr.io
# Username: your-github-username
# Password: your-github-token (Personal Access Token with `read:packages` scope)

# Pull images
docker pull ghcr.io/your-org/sahabat-kreator/server:latest
docker pull ghcr.io/your-org/sahabat-kreator/web:latest
docker pull ghcr.io/your-org/sahabat-kreator/worker:latest
```

---

## Local Testing (Optional)

### Test Docker Build Locally

```bash
# Build all images
docker build -t sahabatkreator/server:latest -f Dockerfile .
docker build -t sahabatkreator/web:latest -f apps/web/Dockerfile .
docker build -t sahabatkreator/worker:latest -f apps/worker/Dockerfile .

# Run locally
docker compose -f docker-compose.prod.yml up -d

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

### Test with GitHub Actions Locally

```bash
# Install act (run GitHub Actions locally)
brew install act

# Run CI workflow
act -j ci

# Run build workflow
act -j build

# Run deploy workflow (dry-run)
act -j deploy --dryrun
```

---

## Port Configuration

| Service | Container Port | Host Port | Note |
|---------|---------------|-----------|------|
| Web (Next.js) | 3000 | 8080 | Untuk menghindari konflik dengan port lain |
| Server (Hono) | 3001 | 8081 | Untuk menghindari konflik dengan port lain |
| PostgreSQL | 5432 | 5432 | Host-based (sudah ada di server) |
| Redis | 6379 | 6379 | Host-based (sudah ada di server) |

**Port yang SUDAH DIGUNAKAN di server:** 3000, 3001, 3002, 3100, 3200

---

## Deployment Status

Check workflow status:
1. Go to GitHub repo → Actions
2. Select the workflow
3. Click on the run to see logs

---

## Rollback

If deployment fails, rollback immediately:

```bash
# SSH to VPS
ssh deploy@your-vps-host

# Rollback to previous image
docker compose -f docker-compose.prod.yml down
docker pull ghcr.io/your-org/sahabat-kreator/server:previous-tag
docker pull ghcr.io/your-org/sahabat-kreator/web:previous-tag
docker pull ghcr.io/your-org/sahabat-kreator/worker:previous-tag
docker compose -f docker-compose.prod.yml up -d
```

Or trigger the previous successful workflow run:
1. Go to Actions → Select previous successful run
2. Click "Re-run jobs"
