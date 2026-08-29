/**
 * Instagram API Adapter
 *
 * Supports two connection modes — distinguished by the platform value stored
 * in social_account:
 *
 * 1. INSTAGRAM (standalone)
 *    - Host: graph.instagram.com/v26.0
 *    - Requires: Instagram Professional account only (no FB Page)
 *    - Scopes: instagram_business_basic, instagram_business_content_publish,
 *              instagram_business_manage_comments, instagram_business_manage_messages
 *    - No hashtag search, no product tagging
 *
 * 2. INSTAGRAM_PAGE (Facebook Login, legacy)
 *    - Host: graph.facebook.com/v26.0
 *    - Requires: Instagram Professional account linked to a Facebook Page
 *    - Scopes: instagram_basic, instagram_content_publish, instagram_manage_comments,
 *              instagram_manage_insights, instagram_manage_messages,
 *              pages_show_list, pages_read_engagement, business_management
 *    - Extras: hashtag search, product tagging, business discovery
 *
 * The mode is determined by the `platform` field:
 *   - "INSTAGRAM"     → standalone (graph.instagram.com)
 *   - "INSTAGRAM_PAGE" → FB-connected (graph.facebook.com)
 */

import {
  type AccountMetrics,
  GRAPH_API_URL,
  GRAPH_INSTAGRAM_URL,
  type InstagramConnectMode,
  type PlatformComment,
  type PlatformProfile,
} from "./types";

// ─── Helpers ────────────────────────────────────────────────────────────────────

const IS_STANDALONE = new Set(["INSTAGRAM"]);

/** Returns the internal connect mode for the given platform string. */
function resolveMode(platform: string): InstagramConnectMode {
  return IS_STANDALONE.has(platform) ? "instagram_login" : "facebook_login";
}

/** Build fetch options based on connect mode.
 *  Standalone flow: Authorization Bearer header.
 *  Facebook Login flow: access_token in query string.
 */
function getFetchOptions(accessToken: string, mode: InstagramConnectMode): RequestInit {
  if (mode === "instagram_login") {
    return { headers: { Authorization: `Bearer ${accessToken}` } };
  }
  return {};
}

function appendAccessToken(mode: InstagramConnectMode, url: string, accessToken: string): string {
  if (mode === "instagram_login") return url; // token via header
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}access_token=${accessToken}`;
}

function handleApiError(url: string, response: Response): void {
  console.error(`[Instagram] API error ${response.status} for ${url}:`, response.statusText);
}

// ─── Profile ───────────────────────────────────────────────────────────────────

/**
 * Fetch Instagram profile using the correct host and field names for the mode.
 *
 * STANDALONE (INSTAGRAM)  → fields: user_id, username, profile_picture_url, account_type
 * FACEBOOK LOGIN (INSTAGRAM_PAGE) → fields: id, name, username, profile_picture_url
 */
export async function fetchInstagramProfile(
  accessToken: string,
  platform: string,
): Promise<PlatformProfile | null> {
  try {
    const mode = resolveMode(platform);
    const baseUrl = mode === "instagram_login" ? GRAPH_INSTAGRAM_URL : GRAPH_API_URL;
    const fields =
      mode === "instagram_login"
        ? "user_id,username,profile_picture_url,account_type"
        : "id,name,username,profile_picture_url";
    const url = appendAccessToken(mode, `${baseUrl}/me?fields=${fields}`, accessToken);
    const options = getFetchOptions(accessToken, mode);

    const response = await fetch(url, options);
    if (!response.ok) {
      handleApiError(url, response);
      return null;
    }

    const data = (await response.json()) as {
      id?: string;
      user_id?: string;
      name?: string;
      username?: string;
      profile_picture_url?: string;
      account_type?: string;
    };

    return {
      platformId: data.user_id || data.id || "",
      name: data.name || "",
      username: data.username || "",
      profilePicture: data.profile_picture_url || null,
      metadata: data.account_type ? { accountType: data.account_type } : undefined,
    };
  } catch (error) {
    console.error("[Instagram] Profile fetch error:", error);
    return null;
  }
}

// ─── Analytics ─────────────────────────────────────────────────────────────────

/**
 * Fetch Instagram analytics following the official Meta docs.
 *
 * Followers: read from IG User node field `followers_count` (NOT insights endpoint).
 * Media insights: fetched from /media?fields=... for recent posts.
 */
export async function getInstagramAnalytics(
  accessToken: string,
  accountId?: string,
  platform?: string,
): Promise<AccountMetrics> {
  try {
    // Infer mode from platform string (defaults to standalone if unknown)
    const mode = platform ? resolveMode(platform) : "instagram_login";
    const baseUrl = mode === "instagram_login" ? GRAPH_INSTAGRAM_URL : GRAPH_API_URL;
    const accountIdOrMe = accountId || "me";
    const authOptions = getFetchOptions(accessToken, mode);

    // ── Step 1: Get follower count from IG User node ─────────────────────────
    const profileFields =
      mode === "instagram_login" ? "user_id,followers_count,account_type" : "id,followers_count";
    const profileUrl = appendAccessToken(
      mode,
      `${baseUrl}/${accountIdOrMe}?fields=${profileFields}`,
      accessToken,
    );
    const profileResponse = await fetch(profileUrl, authOptions);

    let followers = 0;
    if (profileResponse.ok) {
      const profileData = await profileResponse.json() as {
        followers_count?: number;
        user_id?: string;
        id?: string;
      };
      followers = profileData.followers_count || 0;
    } else {
      handleApiError(profileUrl, profileResponse);
    }

    // ── Step 2: Fetch recent media with engagement data ─��────────────────────
    const mediaFields =
      mode === "instagram_login"
        ? "id,media_type,permalink,likes.count,comments_count,impressions,reach,timestamp"
        : "id,media_type,permalink,likes.count,comments_count,impressions,reach,timestamp";
    const mediaUrl = appendAccessToken(
      mode,
      `${baseUrl}/${accountIdOrMe}/media?fields=${mediaFields}&limit=10`,
      accessToken,
    );
    const mediaResponse = await fetch(mediaUrl, authOptions);

    let totalLikes = 0;
    let totalComments = 0;
    let totalImpressions = 0;
    let totalReach = 0;
    let postCount = 0;

    if (mediaResponse.ok) {
      const mediaData = (await mediaResponse.json()) as { data?: Array<any> };
      const mediaList = mediaData.data || [];
      postCount = mediaList.length;

      for (const media of mediaList) {
        totalLikes += media.likes?.count || 0;
        totalComments += media.comments_count || 0;
        totalImpressions += media.impressions || 0;
        totalReach += media.reach || 0;
      }
    }

    const engagementRate = totalReach > 0
      ? ((totalLikes + totalComments) / totalReach) * 100
      : 0;

    return {
      followers,
      followersChange: 0,
      following: 0,
      impressions: totalImpressions,
      reach: totalReach,
      engagementRate,
      profileViews: 0,
      websiteClicks: 0,
      emailClicks: 0,
      platformMetrics: {
        posts: postCount,
        total_likes: totalLikes,
        total_comments: totalComments,
        mode,
      },
    };
  } catch (error) {
    console.error("[Instagram] Analytics error:", error);
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

// ─── Comments ──────────────────────────────────────────────────────────────────

/**
 * Fetch comments on an Instagram media post.
 *
 * Correct field paths per Meta docs:
 *   - authorId:    comment.from{id}
 *   - authorUsername: comment.from{username}
 *   - authorAvatar:  comment.from{profile_picture_url}
 *   - text:         comment.text
 *   - createdAt:    comment.timestamp
 */
export async function getInstagramComments(
  accessToken: string,
  mediaId: string,
  limit = 20,
  platform?: string,
): Promise<PlatformComment[]> {
  try {
    const mode = platform ? resolveMode(platform) : "instagram_login";
    const baseUrl = mode === "instagram_login" ? GRAPH_INSTAGRAM_URL : GRAPH_API_URL;
    const fields = "id,text,timestamp,like_count,from{id,username,profile_picture_url},child_comment_count";
    const url = appendAccessToken(
      mode,
      `${baseUrl}/${mediaId}/comments?limit=${limit}&fields=${fields}`,
      accessToken,
    );
    const options = getFetchOptions(accessToken, mode);

    const response = await fetch(url, options);
    if (!response.ok) {
      handleApiError(url, response);
      return [];
    }

    const data = (await response.json()) as { data?: Array<any> };

    return (data.data || []).map((comment: any) => ({
      platformCommentId: comment.id,
      platformPostId: mediaId,
      authorId: comment.from?.id || "",
      authorUsername: comment.from?.username || "",
      authorAvatar: comment.from?.profile_picture_url || null,
      text: comment.text || "",
      likeCount: comment.like_count || 0,
      replyCount: comment.child_comment_count || 0,
      createdAt: new Date(comment.timestamp || Date.now()),
    }));
  } catch (error) {
    console.error("[Instagram] Comments error:", error);
    return [];
  }
}

// ─── Mentions ──��───────────────────────────────────────────────────────────────

/**
 * Fetch @mentions for the authenticated user.
 *
 * Standalone flow: /me/mentions endpoint.
 * Facebook Login flow: /me/tags endpoint (legacy).
 */
export async function getInstagramMentions(
  accessToken: string,
  limit = 20,
  platform?: string,
): Promise<PlatformComment[]> {
  try {
    const mode = platform ? resolveMode(platform) : "instagram_login";
    const baseUrl = mode === "instagram_login" ? GRAPH_INSTAGRAM_URL : GRAPH_API_URL;
    const endpoint = mode === "instagram_login" ? "mentions" : "tags";
    const url = appendAccessToken(
      mode,
      `${baseUrl}/me/${endpoint}?limit=${limit}&fields=id,caption,text,timestamp,like_count,user{id,username,profile_picture_url},media{id}`,
      accessToken,
    );
    const options = getFetchOptions(accessToken, mode);

    const response = await fetch(url, options);
    if (!response.ok) {
      handleApiError(url, response);
      return [];
    }

    const data = (await response.json()) as { data?: Array<any> };

    return (data.data || []).map((item: any) => ({
      platformCommentId: item.id,
      platformPostId: item.media?.id || "",
      authorId: item.user?.id || "",
      authorUsername: item.user?.username || "",
      authorAvatar: item.user?.profile_picture_url || null,
      text: item.text || item.caption?.text || "",
      likeCount: item.like_count || 0,
      replyCount: 0,
      createdAt: new Date(item.timestamp || Date.now()),
    }));
  } catch (error) {
    console.error("[Instagram] Mentions error:", error);
    return [];
  }
}

// ─── Hashtag Search ─────────────────────────────────────────────────────────────

/**
 * Search Instagram hashtags and discover top/recent media.
 *
 * ONLY available for Facebook Login flow (INSTAGRAM_PAGE).
 * Not available for standalone (INSTAGRAM) flow.
 */
export async function searchInstagramHashtag(
  accessToken: string,
  hashtag: string,
  platform?: string,
) {
  // Hashtag search not available for standalone
  if (platform && IS_STANDALONE.has(platform)) {
    console.warn("[Instagram] Hashtag search is not available for standalone Instagram accounts");
    return { hashtags: [], topMedia: [], recentMedia: [] };
  }

  try {
    const url = appendAccessToken(
      "facebook_login",
      `${GRAPH_API_URL}/ig_hashtag_search?q=${encodeURIComponent(hashtag)}&limit=10`,
      accessToken,
    );
    const response = await fetch(url);

    if (!response.ok) {
      console.error("[Instagram] Hashtag search error:", await response.text());
      return { hashtags: [], topMedia: [], recentMedia: [] };
    }

    const data = (await response.json()) as { data?: Array<{ id: string; name: string }> };

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

// ─── Utility ───────────────────────────────────────────────────────────────────

/** Returns the API base URL for the given platform string. */
export function getInstagramApiBaseUrl(platform: string): string {
  return IS_STANDALONE.has(platform) ? GRAPH_INSTAGRAM_URL : GRAPH_API_URL;
}

/** Returns the list of scopes required for the given platform string. */
export const INSTAGRAM_SCOPES: Record<string, string[]> = {
  INSTAGRAM: [
    "instagram_business_basic",
    "instagram_business_content_publish",
    "instagram_business_manage_comments",
    "instagram_business_manage_messages",
  ],
  INSTAGRAM_PAGE: [
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_comments",
    "instagram_manage_insights",
    "instagram_manage_messages",
    "pages_show_list",
    "pages_read_engagement",
    "business_management",
  ],
};
