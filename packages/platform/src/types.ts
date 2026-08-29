/**
 * Shared types and constants for all platform adapters.
 *
 * Host routing (Meta official):
 * - graph.facebook.com   → Facebook Graph API + Instagram API (INSTAGRAM_PAGE = FB-connected)
 * - graph.instagram.com  → Instagram API standalone (INSTAGRAM = no FB Page required)
 * - graph.threads.net    → Threads API (separate domain entirely)
 */

export const META_API_VERSION = "v26.0";
export const GRAPH_API_URL = `https://graph.facebook.com/${META_API_VERSION}`;
/** Instagram standalone API — no Facebook Page required */
export const GRAPH_INSTAGRAM_URL = `https://graph.instagram.com/${META_API_VERSION}`;
export const THREADS_API_URL = "https://graph.threads.net/v1.0";
export const TIKTOK_API_URL = "https://open.tiktokapis.com/v2";
export const YOUTUBE_DATA_API_URL = "https://www.googleapis.com/youtube/v3";
export const YOUTUBE_ANALYTICS_API_URL = "https://youtubeanalytics.googleapis.com/v2";

/** Which Instagram connection mode is in use.
 *  - "facebook_login"     → INSTAGRAM_PAGE (requires FB Page, uses graph.facebook.com)
 *  - "instagram_login"    → INSTAGRAM    (standalone, uses graph.instagram.com)
 */
export type InstagramConnectMode = "facebook_login" | "instagram_login";

export interface PlatformProfile {
  platformId: string;
  name: string;
  username: string;
  profilePicture: string | null;
  metadata?: Record<string, unknown>;
}

export interface PlatformComment {
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

export interface AccountMetrics {
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
