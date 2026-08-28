/**
 * Shared types and constants for all platform adapters.
 * Defined here to avoid circular dependencies via the index file.
 */

export const GRAPH_API_URL = "https://graph.facebook.com/v18.0";
export const META_API_VERSION = "v18.0";
export const TIKTOK_API_URL = "https://open.tiktokapis.com/v2";
export const YOUTUBE_DATA_API_URL = "https://www.googleapis.com/youtube/v3";
export const YOUTUBE_ANALYTICS_API_URL = "https://youtubeanalytics.googleapis.com/v2";

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
