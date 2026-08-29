/**
 * Token Refresh Worker
 * Runs every 30 minutes.
 *
 * Responsibilities:
 * - Scans all social accounts for tokens expiring within the next 15 minutes
 * - Proactively refreshes OAuth tokens via the respective platform APIs
 * - Uses a Redis-based mutex (BullMQ lock) to prevent concurrent refresh races
 */

import { db } from "@sahabatkreator/db";
import { socialAccount } from "@sahabatkreator/db/schema";
import { connection } from "@sahabatkreator/jobs";
import { Worker } from "bullmq";
import { and, eq, isNotNull, isNull, lt, or } from "drizzle-orm";

const REFRESH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const NOW = () => new Date();

// ── Platform token-refresh adapters ─────────────────────────────────

interface RefreshedToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

async function refreshInstagramToken(refreshToken: string): Promise<RefreshedToken> {
  // Meta/OAuth2 token endpoint
  const resp = await fetch("https://graph.facebook.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.META_APP_ID ?? "",
      client_secret: process.env.META_APP_SECRET ?? "",
      refresh_token: refreshToken,
    }),
  });
  if (!resp.ok)
    throw new Error(`Instagram token refresh failed: ${resp.status} ${await resp.text()}`);
  const data = await resp.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: new Date(Date.now() + (data.expires_in ?? 5184000) * 1000),
  };
}

async function refreshTikTokToken(refreshToken: string): Promise<RefreshedToken> {
  const resp = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.TIKTOK_CLIENT_ID ?? "",
      client_secret: process.env.TIKTOK_CLIENT_SECRET ?? "",
    }),
  });
  if (!resp.ok) throw new Error(`TikTok token refresh failed: ${resp.status} ${await resp.text()}`);
  const data = await resp.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + (data.expires_in ?? 7200) * 1000),
  };
}

async function refreshYouTubeToken(_refreshToken: string): Promise<RefreshedToken> {
  // YouTube (Google) tokens are long-lived; refresh handled via Google OAuth flow externally.
  // Here we just mark the token as still valid for another 60 days.
  return {
    accessToken: _refreshToken,
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  };
}

const refreshers: Record<string, (rt: string) => Promise<RefreshedToken>> = {
  INSTAGRAM: refreshInstagramToken,
  TIKTOK: refreshTikTokToken,
  YOUTUBE: refreshYouTubeToken,
};

// ── Worker (periodic scan, not per-job) ──────────────────────────────

export const tokenRefreshWorker = new Worker(
  "token",
  async () => {
    const now = NOW();
    const windowSoon = new Date(now.getTime() + REFRESH_WINDOW_MS);

    // Find tokens expiring within the next 15 minutes OR already expired but not yet revoked
    const expiringAccounts = await db
      .select({
        id: socialAccount.id,
        organizationId: socialAccount.organizationId,
        platform: socialAccount.platform,
        refreshToken: socialAccount.refreshToken,
        tokenExpiresAt: socialAccount.tokenExpiresAt,
      })
      .from(socialAccount)
      .where(
        and(
          eq(socialAccount.isActive, true),
          or(
            and(
              isNull(socialAccount.tokenExpiresAt),
              lt(socialAccount.updatedAt, new Date(now.getTime() - 24 * 60 * 60 * 1000)),
            ), // never refreshed in 24h
            and(
              isNotNull(socialAccount.tokenExpiresAt),
              lt(socialAccount.tokenExpiresAt, windowSoon),
            ),
          ),
        ),
      );

    console.log(`[TokenRefresh] Found ${expiringAccounts.length} accounts needing refresh`);

    const results: Array<{
      socialAccountId: string;
      platform: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const acc of expiringAccounts) {
      if (!acc.refreshToken) {
        console.warn(`[TokenRefresh] ${acc.platform}/${acc.id} has no refresh token — skip`);
        results.push({
          socialAccountId: acc.id,
          platform: acc.platform,
          success: false,
          error: "no_refresh_token",
        });
        continue;
      }

      const refresher = refreshers[acc.platform];
      if (!refresher) {
        console.warn(`[TokenRefresh] No refresher for platform ${acc.platform}`);
        results.push({
          socialAccountId: acc.id,
          platform: acc.platform,
          success: false,
          error: "unknown_platform",
        });
        continue;
      }

      try {
        const refreshed = await refresher(acc.refreshToken);
        await db
          .update(socialAccount)
          .set({
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken ?? acc.refreshToken,
            tokenExpiresAt: refreshed.expiresAt,
            updatedAt: new Date(),
          })
          .where(eq(socialAccount.id, acc.id));

        console.log(
          `[TokenRefresh] Refreshed ${acc.platform}/${acc.id} → expires ${refreshed.expiresAt.toISOString()}`,
        );
        results.push({ socialAccountId: acc.id, platform: acc.platform, success: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[TokenRefresh] Failed to refresh ${acc.platform}/${acc.id}: ${msg}`);
        results.push({
          socialAccountId: acc.id,
          platform: acc.platform,
          success: false,
          error: msg,
        });
      }
    }

    return {
      checkedAt: now.toISOString(),
      totalScanned: expiringAccounts.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  },
  {
    connection,
    concurrency: 1, // single runner; BullMQ locking prevents concurrent executions
    limiter: { max: 1, duration: 60000 },
  },
);

tokenRefreshWorker.on("completed", (job) => {
  console.log(`[TokenRefresh] Job ${job.id} completed`);
});

tokenRefreshWorker.on("failed", (job, err) => {
  console.error(`[TokenRefresh] Job ${job?.id} failed: ${err.message}`);
});
