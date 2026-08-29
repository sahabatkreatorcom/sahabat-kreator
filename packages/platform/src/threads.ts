/**
 * Threads API Adapter
 * Handles profile fetching, analytics, comments, and posts via Meta's Threads API.
 *
 * API Reference:
 * - Base URL: https://graph.threads.net/v1.0
 * - Auth: Bearer token in Authorization header
 * - Scopes: threads_basic, threads_manage_comments, threads_manage_replies
 *
 * Latest endpoint changes (v1.0+):
 * - /me → user profile with fields: id, name, username, threads_profile_picture_url, threads_follower_count
 * - /me/threads → user's threads (posts)
 * - /{thread_id}/replies → thread replies/comments
 * - /{user_id}/threads_insights → engagement insights
 */

import { type AccountMetrics, type PlatformProfile, THREADS_API_URL } from "./types";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ThreadsUserResponse {
  id: string;
  name: string;
  username: string;
  threads_profile_picture_url: string;
  threads_follower_count?: number;
  threads_follow_count?: number;
}

interface ThreadsInsightItem {
  name: string;
  total_value?: { value: number };
  values?: Array<{ value: number }>;
  period?: { granularity: string };
}

interface ThreadsInsightsResponse {
  data: ThreadsInsightItem[];
  paging?: { cursors?: { before?: string; after?: string } };
}

interface ThreadsListResponse<T> {
  data: T[];
  paging?: { cursors?: { before?: string; after?: string }; next?: string };
}

interface ThreadsPost {
  id: string;
  text: string;
  timestamp: string;
  like_count?: number;
  reply_count?: number;
  repost_count?: number;
  quote_count?: number;
  view_count?: number;
}

interface ThreadsComment {
  id: string;
  text: string;
  /** Threads uses ISO-8601 `timestamp` (not FB-style `created_time`) */
  timestamp?: string;
  created_time?: string;
  like_count?: number;
  reply_count?: number;
  from?: {
    id: string;
    name: string;
  };
}

// ─── Profile ────────────────────────────────────────────────────────────────────

export async function fetchThreadsProfile(
  accessToken: string,
  _platform?: string,
): Promise<PlatformProfile | null> {
  try {
    // Why: Threads uses Bearer auth header, not access_token query param
    const response = await fetch(
      `${THREADS_API_URL}/me?fields=id,name,username,threads_profile_picture_url,threads_follower_count,threads_follow_count`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Threads] Failed to fetch profile:", errorText);
      return null;
    }

    const data = (await response.json()) as ThreadsUserResponse;

    return {
      platformId: data.id || "",
      name: data.name || "",
      username: data.username || "",
      profilePicture: data.threads_profile_picture_url || null,
      metadata: {
        followerCount: data.threads_follower_count || 0,
        followCount: data.threads_follow_count || 0,
      },
    };
  } catch (error) {
    console.error("[Threads] Profile fetch error:", error);
    return null;
  }
}

// ─── Analytics ──────────────────────────────────────────────────────────────────

export async function getThreadsAnalytics(
  accessToken: string,
  accountId?: string,
  _platform?: string,
): Promise<AccountMetrics> {
  try {
    const userId = accountId || "me";
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    // Fetch profile for follower count
    const profileUrl = `${THREADS_API_URL}/${userId}?fields=threads_follower_count,threads_follow_count`;
    // Fetch insights for engagement metrics
    const insightsUrl = `${THREADS_API_URL}/${userId}/threads_insights?metric=views,likes,replies,reposts,quotes&period=day`;

    const [profileRes, insightsRes] = await Promise.all([
      fetch(profileUrl, { headers: authHeaders }).then(async (r) => {
        if (!r.ok) throw new Error(`Threads profile API returned ${r.status}`);
        return r.json() as Promise<ThreadsUserResponse>;
      }),
      fetch(insightsUrl, { headers: authHeaders }).then(async (r) => {
        if (!r.ok) return { data: [] as ThreadsInsightItem[] }; // Non-fatal: insights may be unavailable
        return r.json() as Promise<ThreadsInsightsResponse>;
      }),
    ]);

    const followers = profileRes.threads_follower_count || 0;
    const following = profileRes.threads_follow_count || 0;

    // Helper to extract metric value from insights response
    const getMetric = (name: string): number => {
      const item = (insightsRes.data || []).find((i) => i.name === name);
      return item?.total_value?.value ?? item?.values?.[0]?.value ?? 0;
    };

    const views = getMetric("views");
    const likes = getMetric("likes");
    const replies = getMetric("replies");
    const reposts = getMetric("reposts");
    const quotes = getMetric("quotes");

    return {
      followers,
      followersChange: 0, // Requires historical data
      following,
      impressions: views,
      reach: views, // Threads uses views as proxy for reach
      engagementRate: views > 0 ? ((likes + replies + reposts + quotes) / views) * 100 : 0,
      profileViews: 0,
      websiteClicks: 0,
      emailClicks: 0,
      platformMetrics: { views, likes, replies, reposts, quotes },
    };
  } catch (error) {
    console.error("[Threads] Analytics error:", error);
    return getDefaultMetrics();
  }
}

function getDefaultMetrics(): AccountMetrics {
  return {
    followers: 0,
    followersChange: 0,
    following: 0,
    impressions: 0,
    reach: 0,
    engagementRate: 0,
    profileViews: 0,
    websiteClicks: 0,
    emailClicks: 0,
  };
}

// ─── Posts ──────────────────────────────────────────────────────────────────────

export async function getThreadsPosts(
  accessToken: string,
  limit = 10,
  accountId?: string,
): Promise<ThreadsPost[]> {
  try {
    const userId = accountId || "me";
    // Why: Threads uses Bearer auth, and the post field is `timestamp` not `created_time`
    const url = `${THREADS_API_URL}/${userId}/threads?limit=${limit}&fields=id,text,timestamp,like_count,reply_count,repost_count,quote_count,view_count`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error("[Threads] Failed to fetch posts:", await response.text());
      return [];
    }

    const data = (await response.json()) as ThreadsListResponse<ThreadsPost>;
    return data.data || [];
  } catch (error) {
    console.error("[Threads] Posts error:", error);
    return [];
  }
}

// ─── Comments / Replies ─────────────────────────────────────────────────────────

export async function getThreadComments(
  accessToken: string,
  threadId: string,
  limit = 20,
): Promise<ThreadsComment[]> {
  try {
    // Why: replies are thread objects — `timestamp` (ISO-8601), not `created_time`
    const url = `${THREADS_API_URL}/${threadId}/replies?limit=${limit}&fields=id,text,timestamp,like_count,reply_count`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error("[Threads] Failed to fetch comments:", await response.text());
      return [];
    }

    const data = (await response.json()) as ThreadsListResponse<ThreadsComment>;
    return data.data || [];
  } catch (error) {
    console.error("[Threads] Comments error:", error);
    return [];
  }
}

export async function getAccountComments(
  accessToken: string,
  accountId?: string,
  limit = 20,
): Promise<ThreadsComment[]> {
  try {
    const userId = accountId || "me";
    // Fetch recent threads first, then get their replies
    const threads = await getThreadsPosts(accessToken, limit, userId);
    const comments: ThreadsComment[] = [];

    for (const thread of threads.slice(0, 5)) {
      const threadComments = await getThreadComments(accessToken, thread.id, limit);
      comments.push(...threadComments);
    }

    return comments;
  } catch (error) {
    console.error("[Threads] Account comments error:", error);
    return [];
  }
}

// ─── Create Thread (Two-Step Publish Flow) ─────────────────────────────────────
//
// Threads uses a 2-step publishing flow (per Meta docs):
//   1. POST /me/threads  → creates an unsent "container" → returns { id, threading_type }
//   2. POST /me/threads_publish?thread_id=<id> → actually publishes the thread
//
// Without step 2, the thread stays as a draft and never appears on the profile.

interface CreateContainerResult {
  id: string;
  threading_type: string;
}

export async function createThread(
  accessToken: string,
  text: string,
  mediaId?: string,
): Promise<{ id: string; permalink: string; status: "published" | "failed"; error?: string }> {
  try {
    // Step 1: Create container (draft)
    const body: Record<string, unknown> = { text };
    if (mediaId) {
      body.media_id = mediaId;
    }

    const containerResp = await fetch(`${THREADS_API_URL}/me/threads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!containerResp.ok) {
      const errText = await containerResp.text();
      console.error("[Threads] Container creation failed:", errText);
      return { id: "", permalink: "", status: "failed", error: errText };
    }

    const container = (await containerResp.json()) as CreateContainerResult;
    if (!container.id) {
      return { id: "", permalink: "", status: "failed", error: "No ID in container response" };
    }

    // Step 2: Publish the container (make it live)
    const publishResp = await fetch(
      `${THREADS_API_URL}/me/threads_publish?thread_id=${encodeURIComponent(container.id)}`,
      { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!publishResp.ok) {
      const errText = await publishResp.text();
      console.error("[Threads] Publish failed:", errText);
      return { id: container.id, permalink: "", status: "failed", error: errText };
    }

    return {
      id: container.id,
      permalink: `https://www.threads.net/@${container.id}`,
      status: "published",
    };
  } catch (error) {
    console.error("[Threads] Create thread error:", error);
    return { id: "", permalink: "", status: "failed", error: String(error) };
  }
}
