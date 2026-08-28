/**
 * YouTube API Adapter
 * Handles channel analytics, video metrics, and comments
 */

import {
  type AccountMetrics,
  type PlatformComment,
  type PlatformProfile,
  YOUTUBE_ANALYTICS_API_URL,
  YOUTUBE_DATA_API_URL,
} from "./types";

// ─── Profile ────────────────────────────────────────────────────────────────────

export async function fetchYouTubeChannel(
  accessToken: string,
  channelId?: string,
): Promise<PlatformProfile | null> {
  try {
    const url = `${YOUTUBE_DATA_API_URL}/channels?part=snippet,statistics&mine=${!channelId}&id=${channelId || ""}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error("[YouTube] Failed to fetch channel:", await response.text());
      return null;
    }

    const data = (await response.json()) as {
      items?: Array<{
        id: string;
        snippet?: {
          title?: string;
          customUrl?: string;
          thumbnails?: { default?: { url?: string } };
        };
        statistics?: { subscriberCount?: string; videoCount?: string; viewCount?: string };
      }>;
    };
    const channel = data.items?.[0];

    if (!channel) {
      return null;
    }

    return {
      platformId: channel.id,
      name: channel.snippet?.title || "",
      username: channel.snippet?.customUrl?.replace("@", "") || "",
      profilePicture: channel.snippet?.thumbnails?.default?.url || null,
      metadata: {
        subscriberCount: channel.statistics?.subscriberCount,
        videoCount: channel.statistics?.videoCount,
        viewCount: channel.statistics?.viewCount,
      },
    };
  } catch (error) {
    console.error("[YouTube] Channel fetch error:", error);
    return null;
  }
}

// ─── Analytics ──────────────────────────────────────────────────────────────────

export async function getYouTubeChannelAnalytics(
  accessToken: string,
  channelId?: string,
): Promise<AccountMetrics> {
  try {
    // Get channel stats
    const channelUrl = `${YOUTUBE_DATA_API_URL}/channels?part=statistics&mine=${!channelId}&id=${channelId || ""}`;
    const channelResponse = await fetch(channelUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!channelResponse.ok) {
      return getDefaultMetrics();
    }

    const channelData = (await channelResponse.json()) as {
      items?: Array<{ statistics?: Record<string, string> }>;
    };
    const stats = channelData.items?.[0]?.statistics || {};

    // Get recent analytics from reporting API
    const today = new Date().toISOString().split("T")[0];
    const analyticsUrl = `${YOUTUBE_ANALYTICS_API_URL}/reports?ids=channel==MINE&startDate=2020-01-01&endDate=${today}&metrics=subscribersGained,subscribersLost,views&dimensions=day&sort=-day&maxResults=1`;
    const analyticsResponse = await fetch(analyticsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let subscribersChange = 0;
    if (analyticsResponse.ok) {
      const analyticsData = (await analyticsResponse.json()) as { rows?: Array<Array<number>> };
      const row = analyticsData.rows?.[0] || [];
      subscribersChange = (row[1] || 0) - (row[2] || 0);
    }

    return {
      followers: Number.parseInt(stats.subscriberCount || "0", 10),
      followersChange: subscribersChange,
      following: 0,
      impressions: Number.parseInt(stats.viewCount || "0", 10),
      reach: 0,
      engagementRate: 0,
      profileViews: Number.parseInt(stats.viewCount || "0", 10),
      websiteClicks: 0,
      emailClicks: 0,
      platformMetrics: {
        video_count: Number.parseInt(stats.videoCount || "0", 10),
        total_views: Number.parseInt(stats.viewCount || "0", 10),
        total_likes: Number.parseInt(stats.likeCount || "0", 10),
        total_comments: Number.parseInt(stats.commentCount || "0", 10),
      },
    };
  } catch (error) {
    console.error("[YouTube] Analytics error:", error);
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

export async function getYouTubeVideoAnalytics(
  accessToken: string,
  videoIds: string[],
): Promise<any[]> {
  try {
    const url = `${YOUTUBE_DATA_API_URL}/videos?part=statistics,contentDetails&forUsername=${videoIds.join(",")}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { items?: any[] };
    return data.items || [];
  } catch (error) {
    console.error("[YouTube] Video analytics error:", error);
    return [];
  }
}

// ─── Comments ───────────────────────────────────────────────────────────────────

export async function getYouTubeComments(
  accessToken: string,
  videoId: string,
  limit = 20,
): Promise<PlatformComment[]> {
  try {
    const url = `${YOUTUBE_DATA_API_URL}/commentThreads?part=snippet&videoId=${videoId}&maxResults=${limit}&order=relevance`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { items?: Array<any> };

    return (data.items || []).map((item: any) => {
      const snippet = item.snippet?.topLevelComment?.snippet;
      return {
        platformCommentId: item.id,
        platformPostId: videoId,
        authorId: snippet?.authorChannelId || "",
        authorUsername: snippet?.authorDisplayName || "",
        authorAvatar: snippet?.authorProfileImageUrl || null,
        text: snippet?.textDisplay || "",
        likeCount: snippet?.likeCount || 0,
        replyCount: item.snippet?.totalReplyCount || 0,
        createdAt: new Date(snippet?.publishedAt || Date.now()),
      };
    });
  } catch (error) {
    console.error("[YouTube] Comments error:", error);
    return [];
  }
}

// ─── Playlist Items ─────────────────────────────────────────────────────────────

export async function getYouTubePlaylistItems(
  accessToken: string,
  playlistId: string,
  limit = 50,
): Promise<any[]> {
  try {
    const url = `${YOUTUBE_DATA_API_URL}/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${limit}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { items?: any[] };
    return data.items || [];
  } catch (error) {
    console.error("[YouTube] Playlist error:", error);
    return [];
  }
}
