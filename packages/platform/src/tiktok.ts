/**
 * TikTok API Adapter
 * Handles analytics, comments, and profile fetching
 */

import {
  type AccountMetrics,
  type PlatformComment,
  type PlatformProfile,
  TIKTOK_API_URL,
} from "./types";

// ─── Profile ────────────────────────────────────────────────────────────────────

export async function fetchTikTokProfile(accessToken: string): Promise<PlatformProfile | null> {
  try {
    const response = await fetch(
      `${TIKTOK_API_URL}/user/info/?fields=open_id,unique_id,display_name,avatar_url`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      console.error("[TikTok] Failed to fetch profile:", await response.text());
      return null;
    }

    const data = (await response.json()) as { data?: { user?: any } };
    const user = data.data?.user || {};

    return {
      platformId: user.open_id || "",
      name: user.display_name || "",
      username: user.unique_id || "",
      profilePicture: user.avatar_url || null,
      metadata: {
        follower_count: user.follower_count,
        following_count: user.following_count,
        likes_count: user.likes_count,
        video_count: user.video_count,
      },
    };
  } catch (error) {
    console.error("[TikTok] Profile fetch error:", error);
    return null;
  }
}

// ─── Analytics ──────────────────────────────────────────────────────────────────

export async function getTikTokAnalytics(accessToken: string): Promise<AccountMetrics> {
  try {
    const response = await fetch(
      `${TIKTOK_API_URL}/user/info/?fields=follower_count,following_count,likes_count,video_count`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      return getDefaultMetrics();
    }

    const data = (await response.json()) as { data?: { user?: any } };
    const user = data.data?.user || {};

    return {
      followers: user.follower_count || 0,
      followersChange: 0,
      following: user.following_count || 0,
      impressions: 0,
      reach: 0,
      engagementRate: 0,
      profileViews: 0,
      websiteClicks: 0,
      emailClicks: 0,
      platformMetrics: {
        likes_count: user.likes_count || 0,
        video_count: user.video_count || 0,
      },
    };
  } catch (error) {
    console.error("[TikTok] Analytics error:", error);
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

// ─── Video Analytics ────────────────────────────────────────────────────────────

export async function getTikTokVideoAnalytics(
  accessToken: string,
  videoIds: string[],
): Promise<any[]> {
  try {
    const response = await fetch(
      `${TIKTOK_API_URL}/video/query/?fields=id,like_count,comment_count,share_count,view_count`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ video_ids: videoIds }),
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { data?: { videos?: any[] } };
    return data.data?.videos || [];
  } catch (error) {
    console.error("[TikTok] Video analytics error:", error);
    return [];
  }
}

// ─── Comments ───────────────────────────────────────────────────────────────────

export async function getTikTokComments(
  accessToken: string,
  videoId: string,
  limit = 20,
): Promise<PlatformComment[]> {
  try {
    const url = `${TIKTOK_API_URL}/comment/list/?video_id=${videoId}&count=${limit}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { data?: any[] };

    return (data.data || []).map((comment: any) => ({
      platformCommentId: comment.id,
      platformPostId: videoId,
      authorId: comment.user?.open_id || "",
      authorUsername: comment.user?.unique_id || "",
      authorAvatar: comment.user?.avatar_url || null,
      text: comment.text || "",
      likeCount: comment.digg_count || 0,
      replyCount: comment.reply_count || 0,
      createdAt: new Date(comment.create_time * 1000),
    }));
  } catch (error) {
    console.error("[TikTok] Comments error:", error);
    return [];
  }
}
