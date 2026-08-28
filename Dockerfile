# ── Build Stage ───────────────────────────────────────────────────────────────
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git curl

# Copy monorepo structure
COPY package.json bun.lock ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY apps/worker/package.json apps/worker/
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

# Generate .env for build-time validation
RUN cat > .env <<'EOF'
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sahabatkreator
BETTER_AUTH_SECRET=dummy-secret-for-build-only-32chars-long
BETTER_AUTH_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3000
VAPID_PRIVATE_KEY=dummy-vapid-private-key-for-build
VAPID_PUBLIC_KEY=dummy-vapid-public-key-for-build
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=production
EOF

# Build all packages
RUN bun run build

# ── Server Production Stage ───────────────────────────────────────────────────
FROM oven/bun:1-alpine AS server-production

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl

# Copy only necessary files
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/packages/env ./packages/env
COPY --from=builder /app/packages/config ./packages/config
COPY --from=builder /app/packages/api ./packages/api
COPY --from=builder /app/packages/auth ./packages/auth
COPY --from=builder /app/packages/jobs ./packages/jobs
COPY --from=builder /app/packages/payment ./packages/payment
COPY --from=builder /app/packages/platform ./packages/platform

# Install production dependencies
COPY --from=builder /app/bun.lock ./bun.lock
COPY --from=builder /app/package.json ./package.json
RUN bun install --frozen-lockfile --production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

EXPOSE 3001

CMD ["bun", "run", "apps/server/src/index.ts"]

# ── Web (Next.js) Production Stage ───────────────────────────────────────────
FROM oven/bun:1-alpine AS web-production

WORKDIR /app

# Copy built Next.js app
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/
COPY --from=builder /app/apps/web/postcss.config.mjs ./apps/web/
COPY --from=builder /app/apps/web/tsconfig.json ./apps/web/
COPY --from=builder /app/apps/web/src ./apps/web/src

# Install production dependencies
COPY --from=builder /app/bun.lock ./bun.lock
COPY --from=builder /app/package.json ./package.json
RUN bun install --frozen-lockfile --production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

CMD ["bun", "run", "apps/web/node_modules/.bin/next", "start", "-p", "3000"]
