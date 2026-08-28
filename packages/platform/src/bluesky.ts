/**
 * Bluesky API Adapter
 * Handles profile fetching via AT Protocol (ATProto)
 */

import type { AccountMetrics, PlatformProfile } from "./types";

// ─── Profile ────────────────────────────────────────────────────────────────────

export async function fetchBlueskyProfile(
  _accessToken: string,
  handle?: string,
): Promise<PlatformProfile | null> {
  try {
    // Bluesky uses AT Protocol - no standard OAuth
    // For now, we'll use the public endpoint to get profile info
    const response = await fetch(
      `https://bsky.social/xrpc/app.bsky.actor.getProfile?actor=${handle || "atproto.api"}`,
    );

    if (!response.ok) {
      console.error("[Bluesky] Failed to fetch profile:", await response.text());
      return null;
    }

    const data = (await response.json()) as {
      handle?: string;
      displayName?: string;
      avatar?: string;
      description?: string;
      followersCount?: number;
      followingCount?: number;
      postsCount?: number;
    };

    return {
      platformId: data.handle || "",
      name: data.displayName || data.handle || "",
      username: data.handle || "",
      profilePicture: data.avatar || null,
      metadata: {
        description: data.description,
        followersCount: data.followersCount,
        followingCount: data.followingCount,
        postsCount: data.postsCount,
      },
    };
  } catch (error) {
    console.error("[Bluesky] Profile fetch error:", error);
    return null;
  }
}

// ─── Analytics ──────────────────────────────────────────────────────────────────

export async function getBlueskyAnalytics(
  _accessToken: string,
  handle?: string,
): Promise<AccountMetrics> {
  try {
    // Bluesky doesn't have a public analytics API yet
    // We'll fetch basic profile stats
    const response = await fetch(
      `https://bsky.social/xrpc/app.bsky.actor.getProfile?actor=${handle || "atproto.api"}`,
    );

    if (!response.ok) {
      return getDefaultMetrics();
    }

    const data = (await response.json()) as {
      followersCount?: number;
      followingCount?: number;
      postsCount?: number;
    };

    return {
      followers: data.followersCount || 0,
      followersChange: 0,
      following: data.followingCount || 0,
      impressions: 0,
      reach: 0,
      engagementRate: 0,
      profileViews: 0,
      websiteClicks: 0,
      emailClicks: 0,
      platformMetrics: {
        postsCount: data.postsCount,
      },
    };
  } catch (error) {
    console.error("[Bluesky] Analytics error:", error);
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

export async function getBlueskyPosts(_accessToken: string, handle: string): Promise<any[]> {
  try {
    const url = `https://bsky.social/xrpc/app.bsky.feed.getPosts?uris=at://${handle}/app.bsky.feed.post/${handle}`;
    const response = await fetch(url);

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { posts?: any[] };
    return data.posts || [];
  } catch (error) {
    console.error("[Bluesky] Posts error:", error);
    return [];
  }
}

// ─── Feed ───────────────────────────────────────────────────────────────────────

export async function getBlueskyFeed(
  _accessToken: string,
  handle: string,
  limit = 20,
): Promise<any[]> {
  try {
    const url = `https://bsky.social/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=${limit}`;
    const response = await fetch(url);

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { feed?: any[] };
    return data.feed || [];
  } catch (error) {
    console.error("[Bluesky] Feed error:", error);
    return [];
  }
}
