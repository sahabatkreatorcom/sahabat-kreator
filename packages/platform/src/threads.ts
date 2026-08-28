/**
 * Threads API Adapter
 * Handles profile fetching via Meta Graph API for Threads
 */

import { type AccountMetrics, GRAPH_API_URL, type PlatformProfile } from "./types";

// ─── Profile ────────────────────────────────────────────────────────────────────

export async function fetchThreadsProfile(accessToken: string): Promise<PlatformProfile | null> {
  try {
    const response = await fetch(
      `${GRAPH_API_URL}/me?fields=id,name,username,profile_picture_url&access_token=${accessToken}`,
    );

    if (!response.ok) {
      console.error("[Threads] Failed to fetch profile:", await response.text());
      return null;
    }

    const data = (await response.json()) as {
      id?: string;
      name?: string;
      username?: string;
      profile_picture_url?: string;
    };

    return {
      platformId: data.id || "",
      name: data.name || "",
      username: data.username || "",
      profilePicture: data.profile_picture_url || null,
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
): Promise<AccountMetrics> {
  try {
    // Threads uses Meta Graph API similar to Instagram
    const pageId = accountId || "me";

    // Try to get follower count via insights
    const insightsUrl = `${GRAPH_API_URL}/${pageId}/insights?metric=follower_count&access_token=${accessToken}`;
    const insightsResponse = await fetch(insightsUrl);

    let followers = 0;
    if (insightsResponse.ok) {
      const data = (await insightsResponse.json()) as {
        data?: Array<{ name?: string; values?: Array<{ value?: number }> }>;
      };
      const values = data.data || [];
      for (const metric of values) {
        if (metric.name === "follower_count") {
          followers = metric.values?.[0]?.value || 0;
        }
      }
    }

    return {
      followers,
      followersChange: 0,
      following: 0,
      impressions: 0,
      reach: 0,
      engagementRate: 0,
      profileViews: 0,
      websiteClicks: 0,
      emailClicks: 0,
      platformMetrics: {
        threads_count: 0,
      },
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

export async function getThreadsPosts(accessToken: string, limit = 10): Promise<any[]> {
  try {
    const url = `${GRAPH_API_URL}/me/threads?limit=${limit}&fields=id,text,created_time,like_count,reply_count&access_token=${accessToken}`;
    const response = await fetch(url);

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { data?: any[] };
    return data.data || [];
  } catch (error) {
    console.error("[Threads] Posts error:", error);
    return [];
  }
}
