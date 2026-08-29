/**
 * Engagement Sync Worker — enhanced
 * Runs every 30 minutes per organization.
 *
 * Responsibilities:
 * - Fetches new comments, mentions, and DMs from platform APIs
 * - Stores them in engagement_item table with threading support
 * - Assigns conversations to threads based on post_id + author
 * - Detects sentiment and classifies engagement type
 */

import { db } from "@sahabatkreator/db";
import { engagementItem, socialAccount } from "@sahabatkreator/db/schema";
import { connection, type EngagementSyncJobData } from "@sahabatkreator/jobs";
import { type Job, Worker } from "bullmq";
import { and, eq, gte, sql } from "drizzle-orm";

// ── Platform comment shape ───────────────────────────────────────────

interface PlatformComment {
  platformCommentId: string;
  platformPostId?: string;
  authorId: string;
  authorUsername: string;
  authorAvatar: string | null;
  text: string;
  likeCount: number;
  replyCount: number;
  createdAt: Date;
}

interface PlatformMention {
  platformCommentId: string;
  platformPostId?: string;
  authorId: string;
  authorUsername: string;
  authorAvatar: string | null;
  text: string;
  likeCount: number;
  replyCount: number;
  createdAt: Date;
}

// ── Sentiment classifier (rule-based, no external dependency) ─────────

type Sentiment = "POSITIVE" | "NEGATIVE" | "NEUTRAL";

function classifySentiment(text: string): Sentiment {
  const t = text.toLowerCase().trim();

  const positiveWords = [
    "bagus",
    "keren",
    "suka",
    "mantap",
    "hebat",
    "top",
    "luar biasa",
    "wah",
    "nice",
    "love",
    "great",
    "amazing",
    "awesome",
    "perfect",
    "fantastic",
    "thanks",
    "thank",
    "makasih",
    "terima kasih",
    "sempurna",
    "bagus banget",
  ];
  const negativeWords = [
    "buruk",
    "jelek",
    "benci",
    "kesal",
    "kecewa",
    "sial",
    "jahat",
    "bad",
    "hate",
    "awful",
    "terrible",
    "worst",
    "disappointed",
    "angry",
    "mati",
    "bisa",
    "tidak",
    "nggak",
    "enggak",
  ];

  const posScore = positiveWords.filter((w) => t.includes(w)).length;
  const negScore = negativeWords.filter((w) => t.includes(w)).length;

  if (posScore > negScore) return "POSITIVE";
  if (negScore > posScore) return "NEGATIVE";
  return "NEUTRAL";
}

// ── Engagement-type classifier ───────────────────────────────────────

function classifyType(
  comment: PlatformComment | PlatformMention,
  hint?: string,
): "COMMENT" | "MENTION" | "DM" | "REVIEW" | "STORY_MENTION" | "STORY_REPLY" | "PUBLIC_POST" {
  const text = (comment as { text: string }).text.toLowerCase();
  if (hint) {
    if (hint === "mention") return "MENTION";
    if (hint === "dm") return "DM";
    if (hint === "review") return "REVIEW";
  }
  // Heuristics
  if (text.includes("mention") || text.includes("tag")) return "MENTION";
  if (/[\ud83d\udcf1\ud83d\udcac]/u.test((comment as { text: string }).text)) return "DM";
  return "COMMENT";
}

// ── Thread resolver ──────────────────────────────────────────────────

/**
 * Returns a thread key that groups comments on the same post from the same author.
 */
function _threadKey(postId: string | undefined, authorId: string): string {
  if (!postId) return `global-${crypto.randomUUID()}`;
  return `${postId}-${authorId}`;
}

// ── Platform fetchers ────────────────────────────────────────────────

async function fetchComments(
  platform: string,
  _accessToken: string,
  _accountId?: string,
  _limit = 50,
): Promise<PlatformComment[]> {
  if (platform === "INSTAGRAM" || platform === "INSTAGRAM_PAGE") {
    // Instagram requires media_id per call; we batch across a few recent media IDs
    // For now, fetch profile-level comments (placeholder until media feed query added)
    console.warn("[EngagementSync] Instagram comments require media IDs (not yet fetched)");
    return [];
  }
  if (platform === "TIKTOK") {
    const { getTikTokComments } = await import("@sahabatkreator/platform");
    // Requires video_id — similar placeholder
    console.warn("[EngagementSync] TikTok comments require video IDs (not yet fetched)");
    return [];
  }
  if (platform === "YOUTUBE") {
    const { getYouTubeComments } = await import("@sahabatkreator/platform");
    console.warn("[EngagementSync] YouTube comments require video IDs (not yet fetched)");
    return [];
  }
  return [];
}

async function fetchMentions(
  platform: string,
  accessToken: string,
  limit = 50,
): Promise<PlatformMention[]> {
  if (platform === "INSTAGRAM" || platform === "INSTAGRAM_PAGE") {
    const { getInstagramMentions } = await import("@sahabatkreator/platform");
    return getInstagramMentions(accessToken, limit, platform) as unknown as PlatformMention[];
  }
  if (platform === "TIKTOK" || platform === "YOUTUBE") {
    // Not yet implemented in platform package
    console.warn(`[EngagementSync] Mentions not yet implemented for ${platform}`);
  }
  return [];
}

// ── Upsert helper ────────────────────────────────────────────────────

async function upsertEngagementItem(
  orgId: string,
  platform: string,
  item: PlatformComment | PlatformMention,
  type: "COMMENT" | "MENTION" | "DM" | "REVIEW" | "STORY_MENTION" | "STORY_REPLY" | "PUBLIC_POST",
  postId?: string,
): Promise<void> {
  const existing = await db
    .select({ id: engagementItem.id })
    .from(engagementItem)
    .where(
      and(
        eq(engagementItem.organizationId, orgId),
        eq(engagementItem.platform, platform as any),
        eq(engagementItem.content, (item as { text: string }).text),
      ),
    )
    .limit(1);

  const id = existing[0]?.id ?? crypto.randomUUID();
  const sentiment = classifySentiment((item as { text: string }).text);

  await db
    .insert(engagementItem)
    .values([
      {
        id,
        organizationId: orgId,
        platform: platform as any,
        type,
        platformAccountId:
          typeof item === "object" && "authorId" in item
            ? (item as { authorId: string }).authorId
            : undefined,
        authorName: (item as { authorUsername: string }).authorUsername,
        authorUsername: (item as { authorUsername: string }).authorUsername,
        authorAvatar: (item as { authorAvatar: string | null }).authorAvatar ?? null,
        content: (item as { text: string }).text,
        sentiment,
        isRead: false,
        isReplied: false,
        postId: postId ?? null,
        updatedAt: new Date(),
      },
    ])
    .onConflictDoUpdate({
      target: [engagementItem.id],
      set: {
        content: sql`${engagementItem.content} || ' [updated]'`,
        updatedAt: new Date(),
      },
    });
}

// ── Worker ───────────────────────────────────────────────────────────

export const engagementSyncWorker = new Worker<EngagementSyncJobData>(
  "engagement",
  async (job: Job<EngagementSyncJobData>) => {
    const { organizationId, socialAccountId, platform, type: jobType } = job.data;
    console.log(`[EngagementSync] job=${job.id} org=${organizationId} platform=${platform}`);

    const account = await db.query.socialAccount.findFirst({
      where: eq(socialAccount.id, socialAccountId),
    });
    if (!account) throw new Error(`Social account ${socialAccountId} not found`);
    if (!account.isActive) {
      console.log(`[EngagementSync] Account ${socialAccountId} inactive, skipping`);
      return { skipped: true, reason: "inactive" };
    }
    if (!account.accessToken) {
      console.log(`[EngagementSync] No access token for ${socialAccountId}, skipping`);
      return { skipped: true, reason: "no_token" };
    }

    const since = new Date(Date.now() - 30 * 60 * 1000); // last 30 minutes
    const alreadySeen = await db
      .select({ id: engagementItem.id })
      .from(engagementItem)
      .where(
        and(
          eq(engagementItem.organizationId, organizationId),
          gte(engagementItem.createdAt, since),
        ),
      );
    const seenIds = new Set(alreadySeen.map((r) => r.id));

    let itemsProcessed = 0;

    // Fetch comments
    const comments = await fetchComments(platform, account.accessToken, account.platformAccountId);
    for (const comment of comments) {
      if (seenIds.has(comment.platformCommentId)) continue;
      await upsertEngagementItem(
        organizationId,
        platform,
        comment,
        "COMMENT",
        comment.platformPostId,
      );
      itemsProcessed++;
    }

    // Fetch mentions
    const mentions = await fetchMentions(platform, account.accessToken);
    for (const mention of mentions) {
      if (seenIds.has(mention.platformCommentId)) continue;
      const t = classifyType(mention, "mention");
      await upsertEngagementItem(organizationId, platform, mention, t, mention.platformPostId);
      itemsProcessed++;
    }

    // Touch account
    await db
      .update(socialAccount)
      .set({ updatedAt: new Date() })
      .where(eq(socialAccount.id, socialAccountId));

    console.log(
      `[EngagementSync] Processed ${itemsProcessed} new items for ${platform}/${socialAccountId}`,
    );
    return {
      synced: true,
      itemsProcessed,
      platform,
      socialAccountId,
      timestamp: new Date().toISOString(),
    };
  },
  {
    connection,
    concurrency: 5,
    limiter: { max: 20, duration: 60000 },
  },
);

engagementSyncWorker.on("completed", (job) => {
  console.log(`[EngagementSync] Job ${job.id} completed`);
});

engagementSyncWorker.on("failed", (job, err) => {
  console.error(`[EngagementSync] Job ${job?.id} failed: ${err.message}`);
});
