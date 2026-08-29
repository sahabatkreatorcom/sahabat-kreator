/**
 * OAuth Strategy Registry
 *
 * Each platform has its own strategy with:
 *  - `profile`:     how to call the platform API after getting a token
 *  - `analytics`:   how to fetch account-level metrics
 *  - `tokenExchange`: how to POST the code to get an access token
 *
 * Adding a new platform: register it below and optionally implement `analytics`.
 */

import {
  type AccountMetrics,
  fetchBlueskyProfile,
  fetchFacebookPage,
  fetchGoogleBusinessProfile,
  fetchInstagramProfile,
  fetchLinkedInProfile,
  fetchPinterestProfile,
  fetchThreadsProfile,
  fetchTikTokProfile,
  fetchYouTubeChannel,
  getBlueskyAnalytics,
  getFacebookAnalytics,
  getGoogleBusinessAnalytics,
  getInstagramAnalytics,
  getLinkedInAnalytics,
  getPinterestAnalytics,
  getThreadsAnalytics,
  getTikTokAnalytics,
  getYouTubeChannelAnalytics,
  INSTAGRAM_SCOPES,
} from "@sahabatkreator/platform";

export interface PlatformOAuthConfig {
  authorizeUrl: string;
  scopes: string;
  /** How to exchange the code for an access token (HTTP method + body) */
  tokenExchange: "json" | "querystring" | "form" | "bluesky";
  profile: (
    accessToken: string,
    platform?: string,
  ) => Promise<{
    platformId: string;
    name: string;
    username: string;
    profilePicture?: string | null;
    metadata?: Record<string, unknown>;
  } | null>;
  analytics?: (
    accessToken: string,
    accountId?: string,
    platform?: string,
  ) => Promise<AccountMetrics>;
}

// ── Per-platform strategy definitions ───────────────────────────────────────────

const strategies: Record<string, PlatformOAuthConfig> = {
  // ── Instagram (standalone — no FB Page needed) ──────────────────────────────
  INSTAGRAM: {
    authorizeUrl: "https://api.instagram.com/oauth/authorize",
    scopes: INSTAGRAM_SCOPES.INSTAGRAM?.join(" ") ?? "",
    tokenExchange: "json",
    profile: (accessToken: string) => fetchInstagramProfile(accessToken, "INSTAGRAM"),
    analytics: (accessToken: string, accountId?: string) =>
      getInstagramAnalytics(accessToken, accountId, "INSTAGRAM"),
  },

  // ── Instagram (Facebook-connected — requires a FB Page) ────────────────────
  INSTAGRAM_PAGE: {
    authorizeUrl: "https://www.facebook.com/v26.0/dialog/oauth",
    scopes: INSTAGRAM_SCOPES.INSTAGRAM_PAGE?.join(" ") ?? "",
    tokenExchange: "querystring",
    profile: (accessToken: string) => fetchInstagramProfile(accessToken, "INSTAGRAM_PAGE"),
    analytics: (accessToken: string, accountId?: string) =>
      getInstagramAnalytics(accessToken, accountId, "INSTAGRAM_PAGE"),
  },

  // ── Facebook ────────────────────────────────────────────────────────────────
  FACEBOOK: {
    authorizeUrl: "https://www.facebook.com/v26.0/dialog/oauth",
    scopes: "pages_show_list pages_manage_posts pages_read_engagement",
    tokenExchange: "querystring",
    profile: fetchFacebookPage,
    analytics: getFacebookAnalytics,
  },

  // ── TikTok ──────────────────────────────────────────────────────────────────
  TIKTOK: {
    authorizeUrl: "https://www.tiktok.com/v2/auth/authorize",
    scopes: "user.info.basic video.list video.publish",
    tokenExchange: "json",
    profile: fetchTikTokProfile,
    analytics: getTikTokAnalytics,
  },

  // ── YouTube ─────────────────────────────────────────────────────────────────
  YOUTUBE: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: "https://www.googleapis.com/auth/youtube.force-ssl",
    tokenExchange: "form",
    profile: fetchYouTubeChannel,
    analytics: getYouTubeChannelAnalytics,
  },

  // ── Pinterest ───────────────────────────────────────────────────────────────
  PINTEREST: {
    authorizeUrl: "https://www.pinterest.com/oauth/",
    scopes: "read_accounts write_accounts read_pins write_pins",
    tokenExchange: "form",
    profile: fetchPinterestProfile,
    analytics: getPinterestAnalytics,
  },

  // ── LinkedIn ────────────────────────────────────────────────────────────────
  LINKEDIN: {
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
    scopes: "r_liteprofile r_emailaddress w_member_social",
    tokenExchange: "form",
    profile: fetchLinkedInProfile,
    analytics: getLinkedInAnalytics,
  },

  // ── Bluesky ─────────────────────────────────────────────────────────────────
  BLUESKY: {
    authorizeUrl: "https://bsky.social/login",
    scopes: "",
    tokenExchange: "bluesky", // AT Protocol session creation
    profile: fetchBlueskyProfile,
    analytics: getBlueskyAnalytics,
  },

  // ── Threads ─────────────────────────────────────────────────────────────────
  THREADS: {
    authorizeUrl: "https://threads.net/oauth/authorize",
    // threads_content_publish added for thread creation via API
    scopes: "threads_basic threads_manage_comments threads_manage_replies threads_content_publish",
    tokenExchange: "json",
    profile: fetchThreadsProfile,
    analytics: getThreadsAnalytics,
  },

  // ── Google Business ─────────────────────────────────────────────────────────
  GOOGLE_BUSINESS: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: "https://www.googleapis.com/auth/business.manage",
    tokenExchange: "form",
    profile: fetchGoogleBusinessProfile,
    analytics: getGoogleBusinessAnalytics,
  },
};

/** Returns the strategy for a given platform (throws if unknown). */
export function getPlatformStrategy(platform: string): PlatformOAuthConfig {
  const key = platform.toUpperCase();
  const strategy = strategies[key];
  if (!strategy) throw new Error(`Unsupported platform: ${key}`);
  return strategy;
}

/** All supported platform keys. */
export const SUPPORTED_PLATFORMS = Object.keys(strategies) as Array<keyof typeof strategies>;
