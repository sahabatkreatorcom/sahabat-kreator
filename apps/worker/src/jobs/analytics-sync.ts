/**
 * Analytics Sync Worker
 * Runs every 6 hours per organization.
 *
 * Responsibilities:
 * - Fetches latest analytics from platform APIs (Instagram, TikTok, YouTube)
 * - Stores daily snapshots in post_analytics table
 * - Calculates best time to post based on historical engagement data
 * - Generates period-over-period comparisons
 */

import { db } from "@sahabatkreator/db";
import {
  analyticsPeriodSnapshot,
  bestTimeSchedule,
  postAnalytics,
  socialAccount,
} from "@sahabatkreator/db/schema";
import { type AnalyticsSyncJobData, connection } from "@sahabatkreator/jobs";
import { type Job, Worker } from "bullmq";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";

// ── Platform fetchers ───────────────────────────────────────────────

interface AccountMetrics {
  followers: number;
  followersChange: number;
  following: number;
  impressions: number;
  reach: number;
  engagementRate: number;
  profileViews: number;
  websiteClicks: number;
  emailClicks: number;
  platformMetrics?: Record<string, unknown>;
}

async function fetchAnalytics(
  platform: string,
  accessToken: string,
  accountId?: string,
): Promise<AccountMetrics | null> {
  if (platform === "INSTAGRAM" || platform === "INSTAGRAM_PAGE") {
    const { getInstagramAnalytics } = await import("@sahabatkreator/platform");
    return getInstagramAnalytics(accessToken, accountId, platform);
  }
  if (platform === "FACEBOOK") {
    const { getFacebookAnalytics } = await import("@sahabatkreator/platform");
    return getFacebookAnalytics(accessToken, accountId);
  }
  if (platform === "THREADS") {
    const { getThreadsAnalytics } = await import("@sahabatkreator/platform");
    return getThreadsAnalytics(accessToken, accountId);
  }
  if (platform === "TIKTOK") {
    const { getTikTokAnalytics } = await import("@sahabatkreator/platform");
    return getTikTokAnalytics(accessToken);
  }
  if (platform === "YOUTUBE") {
    const { getYouTubeChannelAnalytics } = await import("@sahabatkreator/platform");
    return getYouTubeChannelAnalytics(accessToken, accountId);
  }
  if (platform === "PINTEREST") {
    const { getPinterestAnalytics } = await import("@sahabatkreator/platform");
    return getPinterestAnalytics(accessToken);
  }
  if (platform === "LINKEDIN") {
    const { getLinkedInAnalytics } = await import("@sahabatkreator/platform");
    return getLinkedInAnalytics(accessToken, accountId);
  }
  if (platform === "BLUESKY") {
    const { getBlueskyAnalytics } = await import("@sahabatkreator/platform");
    return getBlueskyAnalytics(accessToken, accountId);
  }
  if (platform === "GOOGLE_BUSINESS") {
    const { getGoogleBusinessAnalytics } = await import("@sahabatkreator/platform");
    return getGoogleBusinessAnalytics(accessToken, accountId);
  }
  return null;
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Upserts a daily analytics snapshot for a given social account.
 * Returns { views, likes, comments, shares } after normalization.
 */
async function storeDailySnapshot(
  orgId: string,
  socialAccountId: string,
  platform: string,
  metrics: AccountMetrics,
  date: Date,
): Promise<void> {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Map metrics to the post_analytics shape — one row per platform per day
  // (postId is null when aggregating at account level)
  await db
    .insert(postAnalytics)
    .values({
      id: `${socialAccountId}-${today.toISOString().split("T")[0]}`,
      postId: sql`null`,
      organizationId: orgId,
      platform: platform as
        | "INSTAGRAM"
        | "INSTAGRAM_PAGE"
        | "TIKTOK"
        | "YOUTUBE"
        | "MANUAL"
        | "FACEBOOK"
        | "THREADS"
        | "LINKEDIN"
        | "PINTEREST"
        | "BLUESKY"
        | "GOOGLE_BUSINESS",
      date: today,
      views: metrics.impressions,
      likes: (metrics.platformMetrics?.total_likes as number) ?? 0,
      comments: (metrics.platformMetrics?.total_comments as number) ?? 0,
      shares: 0,
      engagementRate: Math.round(metrics.engagementRate * 100), // store as basis points
    })
    .onConflictDoUpdate({
      target: [postAnalytics.id],
      set: {
        views: sql`${postAnalytics.views} + EXCLUDED.views`,
        likes: sql`${postAnalytics.likes} + EXCLUDED.likes`,
        comments: sql`${postAnalytics.comments} + EXCLUDED.comments`,
        engagementRate: sql`${postAnalytics.engagementRate} + EXCLUDED.engagementRate`,
        updatedAt: new Date(),
      },
    });
}

/**
 * Computes best time to post for an org+platform from recent analytics.
 * Uses engagement counts weighted by hour-of-day and day-of-week.
 */
async function computeBestTimes(orgId: string, platform: string): Promise<void> {
  // Pull last 30 days of per-day aggregated engagement
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const rows = await db
    .select({
      date: postAnalytics.date,
      likes: postAnalytics.likes,
      comments: postAnalytics.comments,
      shares: postAnalytics.shares,
    })
    .from(postAnalytics)
    .where(
      and(
        eq(postAnalytics.organizationId, orgId),
        eq(postAnalytics.platform, platform as any),
        gte(postAnalytics.date, thirtyDaysAgo),
      ),
    )
    .orderBy(desc(postAnalytics.date));

  if (rows.length === 0) return;

  // Aggregate by day-of-week + hour slot (assume even hourly sampling → sum engagements)
  const buckets: Record<string, { score: number; points: number }> = {};
  for (const row of rows) {
    const d = row.date instanceof Date ? row.date : new Date(row.date);
    const dow = d.getDay(); // 0=Sun … 6=Sat
    // For simplicity treat each row as one day's total; assign to hour 12 (noon)
    const key = `${dow}-12`;
    const engagement = row.likes + row.comments + row.shares;
    if (!buckets[key]) buckets[key] = { score: 0, points: 0 };
    buckets[key].score += engagement;
    buckets[key].points += 1;
  }

  // Insert top 3 combos, upsert existing schedule rows
  const entries = Object.entries(buckets)
    .map(([k, v]) => ({ key: k, avg: v.score / Math.max(v.points, 1) }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3);

  for (const { key, avg } of entries) {
    const [dow, hour] = key.split("-").map(Number);
    await db
      .insert(bestTimeSchedule)
      .values({
        id: `${orgId}-${platform}-${dow}-${hour}`,
        organizationId: orgId,
        platform: platform as any,
        dayOfWeek: dow,
        hourOfDay: hour,
        engagementScore: Math.round(avg),
        dataPoints: 1,
        computedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [bestTimeSchedule.id],
        set: {
          engagementScore: sql`${bestTimeSchedule.engagementScore} + EXCLUDED.engagementScore`,
          dataPoints: sql`${bestTimeSchedule.dataPoints} + EXCLUDED.dataPoints`,
          updatedAt: new Date(),
        },
      });
  }
}

/**
 * Computes a weekly period snapshot and its prior-period comparison.
 */
async function computePeriodSnapshot(orgId: string, endDate: Date): Promise<void> {
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const periodStart = new Date(endDate.getTime() - weekMs);
  const prevStart = new Date(periodStart.getTime() - weekMs);
  const prevEnd =
    endDate.getTime() <= periodStart.getTime() ? periodStart : new Date(periodStart.getTime() - 1);

  // Current week totals
  const currentRows = await db
    .select({
      totalViews: sql<number>`COALESCE(SUM(${postAnalytics.views}), 0)`,
      totalLikes: sql<number>`COALESCE(SUM(${postAnalytics.likes}), 0)`,
      totalComments: sql<number>`COALESCE(SUM(${postAnalytics.comments}), 0)`,
      totalShares: sql<number>`COALESCE(SUM(${postAnalytics.shares}), 0)`,
    })
    .from(postAnalytics)
    .where(
      and(
        eq(postAnalytics.organizationId, orgId),
        gte(postAnalytics.date, periodStart),
        lt(postAnalytics.date, endDate),
      ),
    );

  // Previous week totals
  const prevRows = await db
    .select({
      totalViews: sql<number>`COALESCE(SUM(${postAnalytics.views}), 0)`,
      totalLikes: sql<number>`COALESCE(SUM(${postAnalytics.likes}), 0)`,
      totalComments: sql<number>`COALESCE(SUM(${postAnalytics.comments}), 0)`,
    })
    .from(postAnalytics)
    .where(
      and(
        eq(postAnalytics.organizationId, orgId),
        gte(postAnalytics.date, prevStart),
        lt(postAnalytics.date, prevEnd),
      ),
    );

  const c = currentRows[0] ?? { totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0 };
  const p = prevRows[0] ?? { totalViews: 0, totalLikes: 0, totalComments: 0 };

  const pct = (cur: number, base: number) =>
    base === 0 ? 0 : Math.round(((cur - base) / base) * 100);

  await db.insert(analyticsPeriodSnapshot).values({
    id: `${orgId}-week-${periodStart.toISOString().split("T")[0]}`,
    organizationId: orgId,
    periodStart,
    periodEnd: endDate,
    totalPosts: 0, // populated separately by post-count query if needed
    totalViews: c.totalViews,
    totalLikes: c.totalLikes,
    totalComments: c.totalComments,
    totalShares: c.totalShares,
    avgEngagementRate: null,
    previousPeriodTotalViews: p.totalViews,
    previousPeriodTotalLikes: p.totalLikes,
    previousPeriodTotalComments: p.totalComments,
    viewsGrowthPercent: pct(c.totalViews, p.totalViews),
    likesGrowthPercent: pct(c.totalLikes, p.totalLikes),
    commentsGrowthPercent: pct(c.totalComments, p.totalComments),
  });
}

// ── Worker ───────────────────────────────────────────────────────────

export const analyticsSyncWorker = new Worker<AnalyticsSyncJobData>(
  "analytics",
  async (job: Job<AnalyticsSyncJobData>) => {
    const { organizationId, socialAccountId, platform, range } = job.data;
    console.log(`[AnalyticsSync] job=${job.id} org=${organizationId} platform=${platform}`);

    const account = await db.query.socialAccount.findFirst({
      where: eq(socialAccount.id, socialAccountId),
    });
    if (!account) throw new Error(`Social account ${socialAccountId} not found`);
    if (!account.isActive) {
      console.log(`[AnalyticsSync] Account ${socialAccountId} inactive, skipping`);
      return { skipped: true, socialAccountId, reason: "inactive" };
    }
    if (!account.accessToken) {
      console.log(`[AnalyticsSync] No access token for ${socialAccountId}, skipping`);
      return { skipped: true, socialAccountId, reason: "no_token" };
    }

    const now = new Date();
    const endDate = range ? new Date(range) : now;

    // 1. Fetch latest metrics from platform
    const metrics = await fetchAnalytics(
      platform,
      account.accessToken,
      account.platformAccountId,
    );
    if (!metrics) {
      console.warn(`[AnalyticsSync] No metrics returned for ${platform}/${socialAccountId}`);
      throw new Error(`Platform returned no analytics for ${platform}`);
    }

    // 2. Store daily snapshot
    await storeDailySnapshot(organizationId, socialAccountId, platform, metrics, endDate);
    console.log(
      `[AnalyticsSync] Snapshot stored for ${platform} on ${endDate.toISOString().split("T")[0]}`,
    );

    // 3. Recompute best-time schedules for this org+platform
    await computeBestTimes(organizationId, platform);

    // 4. Update period snapshot (weekly)
    await computePeriodSnapshot(organizationId, endDate);

    // 5. Touch account timestamp
    await db
      .update(socialAccount)
      .set({ updatedAt: new Date() })
      .where(eq(socialAccount.id, socialAccountId));

    console.log(`[AnalyticsSync] Completed for ${platform}/${socialAccountId}`);
    return {
      synced: true,
      platform,
      socialAccountId,
      followers: metrics.followers,
      engagementRate: metrics.engagementRate,
      timestamp: new Date().toISOString(),
    };
  },
  {
    connection,
    concurrency: 3,
    limiter: { max: 10, duration: 60000 },
  },
);

analyticsSyncWorker.on("completed", (job) => {
  console.log(`[AnalyticsSync] Job ${job.id} completed`);
});

analyticsSyncWorker.on("failed", (job, err) => {
  console.error(`[AnalyticsSync] Job ${job?.id} failed: ${err.message}`);
});
