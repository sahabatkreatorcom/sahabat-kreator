/**
 * Pinterest API Adapter
 * Handles profile fetching and analytics via Pinterest API v5
 */

import type { AccountMetrics, PlatformProfile } from "./types";

// ─── Profile ────────────────────────────────────────────────────────────────────

export async function fetchPinterestProfile(accessToken: string): Promise<PlatformProfile | null> {
  try {
    const response = await fetch("https://api.pinterest.com/v5/user_account", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error("[Pinterest] Failed to fetch profile:", await response.text());
      return null;
    }

    const data = (await response.json()) as {
      username?: string;
      id?: string;
      profile_image?: string;
      first_name?: string;
      last_name?: string;
    };

    return {
      platformId: data.id || "",
      name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || data.username || "",
      username: data.username || "",
      profilePicture: data.profile_image || null,
      metadata: {
        username: data.username,
      },
    };
  } catch (error) {
    console.error("[Pinterest] Profile fetch error:", error);
    return null;
  }
}

// ─── Analytics ──────────────────────────────────────────────────────────────────

export async function getPinterestAnalytics(accessToken: string): Promise<AccountMetrics> {
  try {
    // Pinterest doesn't have a direct analytics endpoint in v5 API for basic accounts
    // We'll return default metrics and can be extended later with Pin analytics
    const response = await fetch("https://api.pinterest.com/v5/user_account", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return getDefaultMetrics();
    }

    const data = (await response.json()) as { username?: string };

    // Fetch monthly views if possible
    const viewsUrl = "https://api.pinterest.com/v5/analytics?granularity=MONTH&date_range_days=30";
    const viewsResponse = await fetch(viewsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let impressions = 0;
    if (viewsResponse.ok) {
      const viewsData = (await viewsResponse.json()) as {
        monthly_views?: Array<{ value?: number }>;
      };
      impressions = viewsData.monthly_views?.[0]?.value || 0;
    }

    return {
      followers: 0,
      followersChange: 0,
      following: 0,
      impressions,
      reach: impressions,
      engagementRate: 0,
      profileViews: 0,
      websiteClicks: 0,
      emailClicks: 0,
      platformMetrics: {
        username: data.username,
        monthly_views: impressions,
      },
    };
  } catch (error) {
    console.error("[Pinterest] Analytics error:", error);
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

// ─── Pins ───────────────────────────────────────────────────────────────────────

export async function getPinterestPins(accessToken: string, limit = 20): Promise<any[]> {
  try {
    const url = `https://api.pinterest.com/v5/pins?limit=${limit}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { items?: any[] };
    return data.items || [];
  } catch (error) {
    console.error("[Pinterest] Pins error:", error);
    return [];
  }
}

// ─── Board Analytics ────────────────────────────────────────────────────────────

export async function getPinterestBoardAnalytics(
  accessToken: string,
  boardId: string,
): Promise<any> {
  try {
    const url = `https://api.pinterest.com/v5/boards/${boardId}/analytics`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[Pinterest] Board analytics error:", error);
    return null;
  }
}
