/**
 * Facebook API Adapter
 * Handles analytics, comments, and profile fetching via Meta Graph API
 */

import {
  type AccountMetrics,
  GRAPH_API_URL,
  type PlatformComment,
  type PlatformProfile,
} from "./types";

// ─── Profile ────────────────────────────────────────────────────────────────────

export async function fetchFacebookProfile(accessToken: string): Promise<PlatformProfile | null> {
  try {
    const response = await fetch(
      `${GRAPH_API_URL}/me?fields=id,name,picture.type(large),about,website&access_token=${accessToken}`,
    );

    if (!response.ok) {
      console.error("[Facebook] Failed to fetch profile:", await response.text());
      return null;
    }

    const data = (await response.json()) as {
      id?: string;
      name?: string;
      picture?: { data?: { url?: string } };
      about?: string;
      website?: string;
    };

    return {
      platformId: data.id || "",
      name: data.name || "",
      username: "",
      profilePicture: data.picture?.data?.url || null,
      metadata: {
        about: data.about || "",
        website: data.website || "",
      },
    };
  } catch (error) {
    console.error("[Facebook] Profile fetch error:", error);
    return null;
  }
}

// ─── Page Analytics ─────────────────────────────────────────────────────────────

export async function fetchFacebookPage(
  accessToken: string,
  pageId?: string,
): Promise<PlatformProfile | null> {
  try {
    const url = `${GRAPH_API_URL}/${pageId || "me"}?fields=id,name,username,fan_count,about,website,verification_status,picture.type(large)&access_token=${accessToken}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error("[Facebook] Failed to fetch page:", await response.text());
      return null;
    }

    const data = (await response.json()) as {
      id?: string;
      name?: string;
      username?: string;
      picture?: { data?: { url?: string } };
      fan_count?: number;
      about?: string;
      website?: string;
      verification_status?: string;
    };

    return {
      platformId: data.id || "",
      name: data.name || "",
      username: data.username || "",
      profilePicture: data.picture?.data?.url || null,
      metadata: {
        fans: data.fan_count || 0,
        about: data.about || "",
        website: data.website || "",
        verificationStatus: data.verification_status || "",
      },
    };
  } catch (error) {
    console.error("[Facebook] Page fetch error:", error);
    return null;
  }
}

// ─── Analytics ──────────────────────────────────────────────────────────────────

export async function getFacebookAnalytics(
  accessToken: string,
  accountId?: string,
): Promise<AccountMetrics> {
  try {
    const pageId = accountId || "me";

    // Get page insights
    const insightsUrl = `${GRAPH_API_URL}/${pageId}/insights?metric=fan_count,page_fans_churning,page_impressions,page_posts_impressions,page_posts_engaged_users,page_post_engagements,page_story_engaged_users&access_token=${accessToken}`;
    const insightsResponse = await fetch(insightsUrl);

    let followers = 0;
    let impressions = 0;
    let engagedUsers = 0;

    if (insightsResponse.ok) {
      const data = (await insightsResponse.json()) as {
        data?: Array<{ name?: string; values?: Array<{ value?: number }> }>;
      };
      const values = data.data || [];

      // Find relevant metrics
      for (const metric of values) {
        const name = metric.name;
        const value = metric.values?.[0]?.value || 0;

        if (name === "fan_count") {
          followers = value;
        } else if (name === "page_impressions") {
          impressions = value;
        } else if (name === "page_post_engaged_users" || name === "page_story_engaged_users") {
          engagedUsers += value;
        }
      }
    }

    const engagementRate = followers > 0 ? (engagedUsers / followers) * 100 : 0;

    return {
      followers,
      followersChange: 0,
      following: 0,
      impressions,
      reach: impressions,
      engagementRate,
      profileViews: 0,
      websiteClicks: 0,
      emailClicks: 0,
      platformMetrics: {
        total_likes: engagedUsers,
        total_impressions: impressions,
      },
    };
  } catch (error) {
    console.error("[Facebook] Analytics error:", error);
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

// ─── Comments ────────────────────────────────────────────────────────────────���──

export async function getFacebookComments(
  accessToken: string,
  postId: string,
  limit = 20,
): Promise<PlatformComment[]> {
  try {
    const url = `${GRAPH_API_URL}/${postId}/comments?limit=${limit}&fields=id,message,from,created_time,like_count&access_token=${accessToken}`;
    const response = await fetch(url);

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { data?: Array<any> };

    return (data.data || []).map((comment: any) => ({
      platformCommentId: comment.id,
      platformPostId: postId,
      authorId: comment.from?.id || "",
      authorUsername: comment.from?.name || "",
      authorAvatar: null,
      text: comment.message || "",
      likeCount: comment.like_count || 0,
      replyCount: comment.comment_count || 0,
      createdAt: new Date(comment.created_time || Date.now()),
    }));
  } catch (error) {
    console.error("[Facebook] Comments error:", error);
    return [];
  }
}

// ─── Posts ──────────────────────────────────────────────────────────────────────

export async function getFacebookPosts(
  accessToken: string,
  pageId?: string,
  limit = 10,
): Promise<any[]> {
  try {
    const url = `${GRAPH_API_URL}/${pageId || "me"}/posts?limit=${limit}&fields=id,message,created_time,likes.summary(true),comments.summary(true),shares&access_token=${accessToken}`;
    const response = await fetch(url);

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { data?: Array<any> };
    return data.data || [];
  } catch (error) {
    console.error("[Facebook] Posts error:", error);
    return [];
  }
}
