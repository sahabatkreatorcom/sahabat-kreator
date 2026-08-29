import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// Load .env from monorepo root (single source of truth)
const _dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(_dirname, "../../../.env") });

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    // ── Database ──────────────────────────────────────────────
    DATABASE_URL: z.string().min(1),

    // ── Auth (Better Auth) ────────────────────────────────────
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),

    // ── URLs ──────────────────────────────────────────────────
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    CORS_ORIGIN: z.url(),

    // ── Upstash Redis (job queue, rate limit) ─────────────────
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

    // ── Local Redis (BullMQ fallback) ─────────────────────────
    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.coerce.number().int().default(6379),
    REDIS_PASSWORD: z.string().optional(),

    // ── Cloudflare R2 (object storage) ────────────────────────
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET_NAME: z.string().optional(),

    // ── Security ──────────────────────────────────────────────
    // 32+ char string for encrypting stored OAuth tokens.
    ENCRYPTION_KEY: z.string().min(32).optional(),

    // ── Logging ───────────────────────────────────────────────
    LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
    PINO_PRETTY: z.string().optional(),

    // ── Resend (email) ────────────────────────────────────────
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().email().optional(),

    // ── SumoPod Pay ───────────────────────────────────────────
    SUMOPOD_API_KEY: z.string().optional(),
    SUMOPOD_API_SECRET: z.string().optional(),
    SUMOPOD_WEBHOOK_SECRET: z.string().optional(),
    SUMOPOD_WEBHOOK_TOKEN: z.string().optional(),
    SUMOPOD_BASE: z.string().url().optional(),

    // ── AI / OpenRouter ────────────────────────────────────────
    OPENROUTER_API_KEY: z.string().optional(),

    // ── SK AI Advisor ──────────────────────────────────────────
    SK_MODEL: z.string().optional(),
    SK_SYSTEM_PROMPT_OVERRIDE: z.string().optional(),
    SK_TEMPERATURE: z.string().optional(),
    SK_MAX_REPORTS_PER_DAY: z.string().optional(),
    SK_MAX_CHATS_PER_DAY: z.string().optional(),

    // ── VAPID Keys (Web Push) ──────────────────────────────────
    VAPID_PRIVATE_KEY: z.string().min(1),
    VAPID_PUBLIC_KEY: z.string().min(1),

    // ── Runtime ───────────────────────────────────────────────
    PORT: z.string().optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
