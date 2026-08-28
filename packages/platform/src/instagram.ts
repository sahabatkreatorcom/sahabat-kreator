/**
 * Instagram API Adapter
 * Handles analytics, comments, mentions, and profile fetching
 */

import {
  type AccountMetrics,
  GRAPH_API_URL,
  type PlatformComment,
  type PlatformProfile,
} from "./types";

// ─── Profile ────────────────────────────────────────────────────────────────────

export async function fetchInstagramProfile(accessToken: string): Promise<PlatformProfile | null> {
  try {
    const response = await fetch(
      `${GRAPH_API_URL}/me?fields=id,name,username,profile_picture&access_token=${accessToken}`,
    );

    if (!response.ok) {
      console.error("[Instagram] Failed to fetch profile:", await response.text());
      return null;
    }

    const data = (await response.json()) as {
      id?: string;
      name?: string;
      username?: string;
      profile_picture?: string;
    };

    return {
      platformId: data.id || "",
      name: data.name || "",
      username: data.username || "",
      profilePicture: data.profile_picture || null,
    };
  } catch (error) {
    console.error("[Instagram] Profile fetch error:", error);
    return null;
  }
}

// ─── Analytics ──────────────────────────────────────────────────────────────────

export async function getInstagramAnalytics(
  accessToken: string,
  accountId?: string,
): Promise<AccountMetrics> {
  try {
    // Get account insights
    const insightsUrl = `${GRAPH_API_URL}/${accountId || "me"}?fields=follower_count&access_token=${accessToken}`;
    const insightsResponse = await fetch(insightsUrl);

    if (!insightsResponse.ok) {
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

    const data = (await insightsResponse.json()) as { follower_count?: number };
    const followers = data.follower_count || 0;

    // Get media insights for the last 7 days
    const mediaInsightsUrl = `${GRAPH_API_URL}/${accountId || "me"}/media?fields=id,media_type,caption,permalink,likes,count_comments,impressions,reach&limit=10&access_token=${accessToken}`;
    const mediaResponse = await fetch(mediaInsightsUrl);

    let totalLikes = 0;
    let totalComments = 0;
    let totalImpressions = 0;
    let totalReach = 0;
    let mediaData: any = null;

    if (mediaResponse.ok) {
      mediaData = await mediaResponse.json();
      for (const media of mediaData.data || []) {
        totalLikes += media.likes?.count || 0;
        totalComments += media.count_comments || 0;
        totalImpressions += media.impressions || 0;
        totalReach += media.reach || 0;
      }
    }

    const engagementRate = totalReach > 0 ? ((totalLikes + totalComments) / totalReach) * 100 : 0;

    return {
      followers,
      followersChange: 0, // Requires historical data
      following: 0,
      impressions: totalImpressions,
      reach: totalReach,
      engagementRate,
      profileViews: 0,
      websiteClicks: 0,
      emailClicks: 0,
      platformMetrics: {
        posts: mediaData?.data?.length || 0,
        total_likes: totalLikes,
        total_comments: totalComments,
      },
    };
  } catch (error) {
    console.error("[Instagram] Analytics error:", error);
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
}

// ─── Comments ───────────────────────────────────────────────────────────────────

export async function getInstagramComments(
  accessToken: string,
  mediaId: string,
  limit = 20,
): Promise<PlatformComment[]> {
  try {
    const url = `${GRAPH_API_URL}/${mediaId}/comments?limit=${limit}&access_token=${accessToken}`;
    const response = await fetch(url);

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { data?: Array<any> };

    return (data.data || []).map((comment: any) => ({
      platformCommentId: comment.id,
      platformPostId: mediaId,
      authorId: comment.from?.id || "",
      authorUsername: comment.from?.username || "",
      authorAvatar: comment.from?.profile_picture || null,
      text: comment.message || "",
      likeCount: comment.like_count || 0,
      replyCount: 0,
      createdAt: new Date(comment.created_time || Date.now()),
    }));
  } catch (error) {
    console.error("[Instagram] Comments error:", error);
    return [];
  }
}

// ─── Mentions ───────────────────────────────────────────────────────────────────

export async function getInstagramMentions(
  accessToken: string,
  limit = 20,
): Promise<PlatformComment[]> {
  try {
    const url = `${GRAPH_API_URL}/me/tags?limit=${limit}&access_token=${accessToken}`;
    const response = await fetch(url);

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { data?: Array<any> };

    return (data.data || []).map((item: any) => ({
      platformCommentId: item.id,
      platformPostId: item.media?.id || "",
      authorId: item.user?.id || "",
      authorUsername: item.user?.username || "",
      authorAvatar: item.user?.profile_picture || null,
      text: item.caption?.text || "",
      likeCount: item.like_count || 0,
      replyCount: 0,
      createdAt: new Date(item.created_time || Date.now()),
    }));
  } catch (error) {
    console.error("[Instagram] Mentions error:", error);
    return [];
  }
}

// ─── Hashtag Search ─────────────────────────────────────────────────────────────

export async function searchInstagramHashtag(accessToken: string, hashtag: string) {
  try {
    const url = `${GRAPH_API_URL}/hashtag-search?q=${hashtag}&access_token=${accessToken}`;
    const response = await fetch(url);

    if (!response.ok) {
      return { hashtags: [], topMedia: [], recentMedia: [] };
    }

    const data = (await response.json()) as { data?: Array<any> };

    return {
      hashtags: data.data || [],
      topMedia: [],
      recentMedia: [],
    };
  } catch (error) {
    console.error("[Instagram] Hashtag search error:", error);
    return { hashtags: [], topMedia: [], recentMedia: [] };
  }
}
