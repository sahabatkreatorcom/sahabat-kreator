import { db } from "@sahabatkreator/db";
import { socialAccount } from "@sahabatkreator/db/schema";
import { env } from "@sahabatkreator/env/server";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";
import type { PlatformToken } from "./platforms/oauth-helpers";
import {
  buildAuthorizationUrl,
  exchangeCodeForToken,
  getCallbackUrl,
} from "./platforms/oauth-helpers";
import { getPlatformStrategy } from "./platforms/oauth-registry";
import { upsertAccount } from "./platforms/profile-store";
import type { ProfileResponse } from "./platforms/types";

const platformApp = new Hono();
platformApp.use("/*", requireAuth);

// ─── GET /api/platforms/accounts ─────────────────────────────────────────────────
platformApp.get("/accounts", async (c) => {
  const organizationId = getOrganizationId(c);

  const accounts = await db.query.socialAccount.findMany({
    where: eq(socialAccount.organizationId, organizationId),
    orderBy: [desc(socialAccount.createdAt)],
    columns: {
      id: true,
      platform: true,
      name: true,
      username: true,
      isActive: true,
      platformAccountId: true,
      accessToken: false,
      refreshToken: false,
      tokenExpiresAt: true,
      createdAt: true,
    },
  });

  return c.json({ accounts });
});

// ─── GET /api/platforms/cross-platform ───────────────────────────────────────────
platformApp.get("/cross-platform", async (c) => {
  const organizationId = getOrganizationId(c);

  const accounts = await db.query.socialAccount.findMany({
    where: and(eq(socialAccount.organizationId, organizationId), eq(socialAccount.isActive, true)),
    columns: {
      id: true,
      platform: true,
      name: true,
      username: true,
      platformAccountId: true,
      accessToken: true,
    },
  });

  const byPlatform = await Promise.all(
    accounts.map(async (a) => {
      try {
        const strategy = getPlatformStrategy(a.platform);
        if (!strategy.analytics || !a.accessToken) {
          return {
            platform: a.platform,
            followers: 0,
            impressions: 0,
            engagementRate: 0,
            name: a.name,
            username: a.username,
          };
        }
        const metrics = await strategy.analytics(a.accessToken, a.platformAccountId, a.platform);
        return {
          platform: a.platform,
          followers: metrics.followers,
          impressions: metrics.impressions,
          engagementRate: metrics.engagementRate,
          name: a.name,
          username: a.username,
        };
      } catch {
        return {
          platform: a.platform,
          followers: 0,
          impressions: 0,
          engagementRate: 0,
          name: a.name,
          username: a.username,
        };
      }
    }),
  );

  const totalFollowers = byPlatform.reduce((s, p) => s + p.followers, 0);
  const totalImpressions = byPlatform.reduce((s, p) => s + p.impressions, 0);
  const totalReach = byPlatform.reduce((s, p) => s + p.impressions, 0);
  const avgEngagementRate =
    byPlatform.length > 0
      ? byPlatform.reduce((s, p) => s + p.engagementRate, 0) / byPlatform.length
      : 0;

  return c.json({
    stats: {
      totalFollowers,
      totalImpressions,
      totalReach,
      avgEngagementRate,
      byPlatform,
    },
  });
});

// ─── GET /api/platforms/:platform/auth-url ──────────────────────────────────────
const authUrlSchema = z.object({ state: z.string().min(1) });

platformApp.get("/:platform/auth-url", async (c) => {
  const platform = c.req.param("platform").toUpperCase();
  const query = authUrlSchema.safeParse(new URL(c.req.url).searchParams);

  if (!query.success) {
    return c.json({ error: "Missing or invalid 'state' query parameter" }, 400);
  }

  const envVars = env as unknown as Record<string, string | undefined>;
  const clientId = envVars[`PLATFORM_${platform}_CLIENT_ID`];
  const clientSecret = envVars[`PLATFORM_${platform}_CLIENT_SECRET`];

  if (!clientId || !clientSecret) {
    return c.json({ error: `Platform ${platform} is not configured` }, 404);
  }

  const baseUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  const redirectUri = getCallbackUrl(baseUrl, platform);
  const authUrl = buildAuthorizationUrl(platform, clientId, redirectUri, query.data.state);

  return c.json({ authUrl });
});

// ─── POST /api/platforms/:platform/callback ─────────────────────────────────────
const callbackSchema = z.object({ code: z.string().min(1), state: z.string().min(1) });

platformApp.post("/:platform/callback", async (c) => {
  const organizationId = getOrganizationId(c);
  const platform = c.req.param("platform").toUpperCase();
  const body = callbackSchema.safeParse(await c.req.json());

  if (!body.success) {
    return c.json({ error: "Missing or invalid 'code' in request body" }, 400);
  }

  const envVars = env as unknown as Record<string, string | undefined>;
  const clientId = envVars[`PLATFORM_${platform}_CLIENT_ID`];
  const clientSecret = envVars[`PLATFORM_${platform}_CLIENT_SECRET`];

  if (!clientId || !clientSecret) {
    return c.json({ error: `Platform ${platform} is not configured` }, 404);
  }

  const baseUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  const redirectUri = getCallbackUrl(baseUrl, platform);

  try {
    const token = await exchangeCodeForToken(
      platform,
      body.data.code,
      redirectUri,
      clientId,
      clientSecret,
    );
    const strategy = getPlatformStrategy(platform);
    const profile = await strategy.profile(token.accessToken, platform);

    if (!profile) {
      return c.json({ error: "Failed to fetch profile from platform" }, 500);
    }

    const account = await upsertAccount({
      organizationId,
      platform,
      profile: profile as ProfileResponse,
      token: token as PlatformToken,
    });

    return c.json({ success: true, account });
  } catch (error) {
    console.error(`[Platform] ${platform} callback error:`, error);
    return c.json({ error: "Failed to complete OAuth callback" }, 500);
  }
});

// ─── GET /api/platforms/:platform/analytics ─────────────────────────────────────
const analyticsSchema = z.object({ days: z.number().min(1).max(365).default(30) });

platformApp.get("/:platform/analytics", async (c) => {
  const organizationId = getOrganizationId(c);
  const platform = c.req.param("platform").toUpperCase();
  const query = analyticsSchema.safeParse(new URL(c.req.url).searchParams);
  const days = query.success ? query.data.days : 30;
  void days;

  const [account] = await db
    .select()
    .from(socialAccount)
    .where(
      and(
        eq(socialAccount.organizationId, organizationId),
        eq(socialAccount.platform, platform as any),
        eq(socialAccount.isActive, true),
      ),
    )
    .limit(1);

  if (!account) {
    return c.json({ error: `No active ${platform} account connected` }, 404);
  }

  if (!account.accessToken) {
    return c.json({ error: `Access token missing for ${platform}` }, 400);
  }

  const strategy = getPlatformStrategy(platform);
  if (!strategy.analytics) {
    return c.json({ error: `Analytics not supported for ${platform}` }, 400);
  }

  try {
    const analytics = await strategy.analytics(
      account.accessToken,
      account.platformAccountId,
      platform,
    );
    return c.json({ analytics });
  } catch (error) {
    console.error(`[Platform] ${platform} analytics error:`, error);
    return c.json({ error: "Failed to fetch analytics" }, 500);
  }
});

// ─── GET /api/platforms/:platform/comments ──────────────────────────────────────
const commentsSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  threadId: z.string().optional(),
});

type CommentRow = {
  id: string;
  text: string;
  author: string;
  authorUsername: string;
  likeCount: number;
  replyCount: number;
  createdAt: string;
};

platformApp.get("/:platform/comments", async (c) => {
  const organizationId = getOrganizationId(c);
  const platform = c.req.param("platform").toUpperCase();
  const query = commentsSchema.safeParse(new URL(c.req.url).searchParams);
  const limit = query.success ? query.data.limit : 20;
  const threadId = query.success ? query.data.threadId : undefined;

  const [account] = await db
    .select()
    .from(socialAccount)
    .where(
      and(
        eq(socialAccount.organizationId, organizationId),
        eq(socialAccount.platform, platform as any),
        eq(socialAccount.isActive, true),
      ),
    )
    .limit(1);

  if (!account) {
    return c.json({ error: `No active ${platform} account connected` }, 404);
  }

  if (!account.accessToken) {
    return c.json({ error: `Access token missing for ${platform}` }, 400);
  }

  // Fetch comments based on platform
  if (platform === "THREADS") {
    const { getAccountComments, getThreadComments } = await import("@sahabatkreator/platform");
    let rawComments;
    if (threadId) {
      // Fetch comments for a specific thread
      rawComments = await getThreadComments(account.accessToken, threadId, limit);
    } else {
      // Fetch comments across recent threads
      rawComments = await getAccountComments(account.accessToken, account.platformAccountId, limit);
    }
    const comments: CommentRow[] = rawComments.map((c) => ({
      id: c.id,
      text: c.text,
      author: c.from?.name || "Unknown",
      authorUsername: "",
      likeCount: c.like_count || 0,
      replyCount: c.reply_count || 0,
      createdAt: c.timestamp || c.created_time || "",
    }));
    return c.json({ comments });
  }

  if (platform === "INSTAGRAM" || platform === "INSTAGRAM_PAGE") {
    const { getInstagramComments } = await import("@sahabatkreator/platform");
    if (!threadId) {
      return c.json({ error: "instagram post ID required for comments", comments: [] }, 400);
    }
    const raw = await getInstagramComments(account.accessToken, threadId, limit, platform);
    const comments: CommentRow[] = raw.map((c) => ({
      id: c.platformCommentId,
      text: c.text,
      author: c.authorUsername,
      authorUsername: c.authorUsername,
      likeCount: c.likeCount,
      replyCount: c.replyCount,
      createdAt: c.createdAt.toISOString(),
    }));
    return c.json({ comments });
  }

  if (platform === "FACEBOOK") {
    const { getFacebookComments, getFacebookPosts } = await import("@sahabatkreator/platform");
    // If no post ID, fetch latest post first
    let postId = threadId;
    if (!postId) {
      const posts = await getFacebookPosts(account.accessToken, account.platformAccountId, 1);
      postId = posts[0]?.id;
    }
    if (!postId) {
      return c.json({ error: "No posts found", comments: [] }, 404);
    }
    const raw = await getFacebookComments(account.accessToken, postId, limit);
    const comments: CommentRow[] = raw.map((c) => ({
      id: c.platformCommentId,
      text: c.text,
      author: c.authorUsername,
      authorUsername: c.authorUsername,
      likeCount: c.likeCount,
      replyCount: c.replyCount,
      createdAt: c.createdAt.toISOString(),
    }));
    return c.json({ comments });
  }

  if (platform === "TIKTOK") {
    const { getTikTokComments } = await import("@sahabatkreator/platform");
    if (!threadId) {
      return c.json({ error: "TikTok video ID required", comments: [] }, 400);
    }
    const raw = await getTikTokComments(account.accessToken, threadId, limit);
    const comments: CommentRow[] = raw.map((c) => ({
      id: c.platformCommentId,
      text: c.text,
      author: c.authorUsername,
      authorUsername: c.authorUsername,
      likeCount: c.likeCount,
      replyCount: c.replyCount,
      createdAt: c.createdAt.toISOString(),
    }));
    return c.json({ comments });
  }

  if (platform === "YOUTUBE") {
    const { getYouTubeComments } = await import("@sahabatkreator/platform");
    if (!threadId) {
      return c.json({ error: "YouTube video ID required", comments: [] }, 400);
    }
    const raw = await getYouTubeComments(account.accessToken, threadId, limit);
    const comments: CommentRow[] = raw.map((c) => ({
      id: c.platformCommentId,
      text: c.text,
      author: c.authorUsername,
      authorUsername: c.authorUsername,
      likeCount: c.likeCount,
      replyCount: c.replyCount,
      createdAt: c.createdAt.toISOString(),
    }));
    return c.json({ comments });
  }

  // Default: return empty for now
  const comments: CommentRow[] = [];
  return c.json({ comments });
});

// ─── POST /api/platforms/:platform/threads ─────────────────────────────────────
const threadCreateSchema = z.object({
  text: z.string().min(1).max(500),
  mediaId: z.string().optional(),
});

platformApp.post("/:platform/threads", async (c) => {
  const organizationId = getOrganizationId(c);
  const platform = c.req.param("platform").toUpperCase();
  const body = threadCreateSchema.safeParse(await c.req.json());

  if (!body.success) {
    return c.json({ error: "Missing or invalid 'text' in request body" }, 400);
  }

  const [account] = await db
    .select()
    .from(socialAccount)
    .where(
      and(
        eq(socialAccount.organizationId, organizationId),
        eq(socialAccount.platform, platform as any),
        eq(socialAccount.isActive, true),
      ),
    )
    .limit(1);

  if (!account) {
    return c.json({ error: `No active ${platform} account connected` }, 404);
  }

  if (!account.accessToken) {
    return c.json({ error: `Access token missing for ${platform}` }, 400);
  }

  // Create thread for Threads platform
  if (platform === "THREADS") {
    const { createThread } = await import("@sahabatkreator/platform");
    const result = await createThread(account.accessToken, body.data.text, body.data.mediaId);

    if (result.status === "failed") {
      return c.json({ error: result.error || "Failed to create thread" }, 500);
    }

    return c.json({ success: true, thread: result });
  }

  return c.json({ error: `Thread creation not supported for ${platform}` }, 400);
});

// ─── GET /api/platforms/:platform/likes ───────────────────────────────────────
const likesSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
});

type LikeRow = {
  id: string;
  username: string;
  avatar?: string | null;
  createdAt?: string;
};

platformApp.get("/:platform/likes", async (c) => {
  const organizationId = getOrganizationId(c);
  const platform = c.req.param("platform").toUpperCase();
  const query = likesSchema.safeParse(new URL(c.req.url).searchParams);
  const limit = query.success ? query.data.limit : 20;

  const [account] = await db
    .select()
    .from(socialAccount)
    .where(
      and(
        eq(socialAccount.organizationId, organizationId),
        eq(socialAccount.platform, platform as any),
        eq(socialAccount.isActive, true),
      ),
    )
    .limit(1);

  if (!account) {
    return c.json({ error: `No active ${platform} account connected` }, 404);
  }

  if (!account.accessToken) {
    return c.json({ error: `Access token missing for ${platform}` }, 400);
  }

  // Fetch likes based on platform
  if (platform === "INSTAGRAM" || platform === "INSTAGRAM_PAGE") {
    const { getInstagramMentions } = await import("@sahabatkreator/platform");
    const raw = await getInstagramMentions(account.accessToken, limit, platform);
    const likes: LikeRow[] = raw
      .filter((c) => c.likeCount > 0)
      .slice(0, limit)
      .map((c) => ({
        id: c.platformPostId || c.platformCommentId || "",
        username: c.authorUsername,
        avatar: c.authorAvatar,
        createdAt: c.createdAt.toISOString(),
      }));
    return c.json({ likes });
  }

  // Default: return empty for now
  const likes: LikeRow[] = [];
  return c.json({ likes });
});

export default platformApp;
