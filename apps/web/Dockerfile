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

# Set minimal env vars for build (runtime values come from docker-compose)
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sahabatkreator"
ENV BETTER_AUTH_SECRET="dummy-secret-for-build-only-32chars"
ENV BETTER_AUTH_URL="http://localhost:3001"
ENV CORS_ORIGIN="http://localhost:3000"
ENV VAPID_PRIVATE_KEY="dummy-vapid-private-key-for-build"
ENV VAPID_PUBLIC_KEY="dummy-vapid-public-key-for-build"
ENV REDIS_HOST="redis"
ENV REDIS_PORT="6379"

# Build all packages first (needed for workspace deps)
RUN bun run build

# Build Next.js with proper env vars
ENV NEXT_PUBLIC_SERVER_URL=https://api.sahabatkreator.com
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=${NEXT_PUBLIC_VAPID_PUBLIC_KEY:-}
RUN bun run --filter web build

# ── Production Stage ──────────────────────────────────────────────────────────
FROM oven/bun:1-alpine AS production

WORKDIR /app

RUN apk add --no-cache curl

# Copy built Next.js app
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/src ./apps/web/src
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/
COPY --from=builder /app/apps/web/postcss.config.mjs ./apps/web/
COPY --from=builder /app/apps/web/tsconfig.json ./apps/web/

# Copy workspace packages
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/packages/env ./packages/env
COPY --from=builder /app/packages/config ./packages/config
COPY --from=builder /app/packages/api ./packages/api
COPY --from=builder /app/packages/auth ./packages/auth
COPY --from=builder /app/packages/jobs ./packages/jobs
COPY --from=builder /app/packages/payment ./packages/payment
COPY --from=builder /app/packages/platform ./packages/platform

# Copy root package files
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock

# Install production dependencies (Next.js needs bun to run)
RUN bun install --frozen-lockfile --production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000

CMD ["bun", "run", "apps/web/node_modules/.bin/next", "start", "-p", "3000"]
