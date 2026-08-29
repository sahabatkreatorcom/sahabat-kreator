# ── Build Stage ───────────────────────────────────────────────────────────────
FROM oven/bun:1-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git curl

# Install monorepo dependencies
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY apps/server/package.json apps/server/
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

# Copy source
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
NEXT_PUBLIC_SERVER_URL=https://api.sahabatkreator.com
EOF

# Build all packages first (needed for workspace deps)
RUN bun run build

# Build Next.js (output: standalone generates .next/standalone/)
RUN bun run --filter web build

# ── Production Stage ──────────────────────────────────────────────────────────
FROM oven/bun:1-alpine AS production

WORKDIR /app

RUN apk add --no-cache curl

# Copy standalone output (node_modules tree for only used deps)
COPY --from=builder /app/apps/web/.next/standalone/ .

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000

# Standalone output for monorepo: server.js at apps/web/server.js
CMD ["bun", "apps/web/server.js"]
