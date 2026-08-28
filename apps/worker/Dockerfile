# ── Build Stage ───────────────────────────────────────────────────────────────
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git curl

# Copy monorepo structure
COPY package.json bun.lock ./
COPY apps/worker/package.json apps/worker/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/*/*/package.json packages/*/
COPY packages/db/package.json packages/db/
COPY packages/env/package.json packages/env/
COPY packages/config/package.json packages/config/
COPY packages/api/package.json packages/api/
COPY packages/auth/package.json packages/auth/
COPY packages/jobs/package.json packages/jobs/
COPY packages/payment/package.json packages/payment/
COPY packages/platform/package.json packages/platform/

# Retry installation with exponential backoff for network issues
RUN for i in 1 2 3; do \
      bun install || sleep $((i * 5)); \
    done

# Copy source code
COPY . .

# Set minimal env vars for build (runtime values come from docker-compose)
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sahabatkreator"
ENV BETTER_AUTH_SECRET="dummy-secret-for-build-only-32chars"
ENV BETTER_AUTH_URL="http://localhost:3001"
ENV CORS_ORIGIN="http://localhost:3000"
ENV VAPID_PRIVATE_KEY="dummy-vapid-private-key-for-build"
ENV VAPID_PUBLIC_KEY="dummy-vapid-public-key-for-build"
ENV REDIS_HOST="redis"
ENV REDIS_PORT="6379"

# Build all packages
RUN bun run build

# ── Production Stage ──────────────────────────────────────────────────────────
FROM oven/bun:1-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY --from=builder /app/bun.lock ./bun.lock
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/worker/package.json ./apps/worker/
COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/packages/env/package.json ./packages/env/
COPY --from=builder /app/packages/config/package.json ./packages/config/
COPY --from=builder /app/packages/jobs/package.json ./packages/jobs/
COPY --from=builder /app/packages/platform/package.json ./packages/platform/

RUN bun install --frozen-lockfile --production

# Copy built code
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/packages/env ./packages/env
COPY --from=builder /app/packages/config ./packages/config
COPY --from=builder /app/packages/jobs ./packages/jobs
COPY --from=builder /app/packages/platform ./packages/platform

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# Worker runs on port 3001 (same as server, but different process)
EXPOSE 3001

CMD ["bun", "run", "apps/worker/src/index.ts"]
