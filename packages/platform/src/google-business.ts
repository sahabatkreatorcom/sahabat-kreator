/**
 * Google Business Profile API Adapter
 * Handles business profile fetching and analytics
 */

import type { AccountMetrics, PlatformProfile } from "./types";

// ─── Profile ────────────────────────────────────────────────────────────────────

export async function fetchGoogleBusinessProfile(
  accessToken: string,
): Promise<PlatformProfile | null> {
  try {
    const response = await fetch("https://mybusiness.googleapis.com/v4/accounts", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      console.error("[Google Business] Failed to fetch profile:", await response.text());
      return null;
    }

    const data = (await response.json()) as {
      accounts?: Array<{
        name?: string;
        shortName?: string;
        primaryBusinessId?: string;
        businessStatus?: string;
      }>;
    };

    const account = data.accounts?.[0];
    if (!account) {
      return null;
    }

    return {
      platformId: account.primaryBusinessId || account.name || "",
      name: account.shortName || account.name || "",
      username: "",
      profilePicture: null,
      metadata: {
        businessStatus: account.businessStatus,
      },
    };
  } catch (error) {
    console.error("[Google Business] Profile fetch error:", error);
    return null;
  }
}

// ─── Analytics ──────────────────────────────────────────────────────────────────

export async function getGoogleBusinessAnalytics(
  accessToken: string,
  businessId?: string,
): Promise<AccountMetrics> {
  try {
    // Get business profile ID
    let profileId = businessId;
    if (!profileId) {
      const accountsResponse = await fetch("https://mybusiness.googleapis.com/v4/accounts", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!accountsResponse.ok) {
        return getDefaultMetrics();
      }

      const accountsData = (await accountsResponse.json()) as {
        accounts?: Array<{ primaryBusinessId?: string }>;
      };
      profileId = accountsData.accounts?.[0]?.primaryBusinessId;
    }

    if (!profileId) {
      return getDefaultMetrics();
    }

    // Fetch query stats
    const statsResponse = await fetch(
      `https://mybusiness.googleapis.com/v4/${profileId}:getQueryStats`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRange: {
            startDate: { year: 2024, month: 1, day: 1 },
            endDate: { year: 2024, month: 12, day: 31 },
          },
        }),
      },
    );

    let searches = 0;
    let actions = 0;

    if (statsResponse.ok) {
      const statsData = (await statsResponse.json()) as {
        queries?: Array<{
          queryCounts?: { totalQueryCount?: number; actionCounts?: { totalActionCount?: number } };
        }>;
      };
      searches = statsData.queries?.[0]?.queryCounts?.totalQueryCount || 0;
      actions = statsData.queries?.[0]?.queryCounts?.actionCounts?.totalActionCount || 0;
    }

    return {
      followers: 0,
      followersChange: 0,
      following: 0,
      impressions: searches,
      reach: searches,
      engagementRate: searches > 0 ? (actions / searches) * 100 : 0,
      profileViews: actions,
      websiteClicks: 0,
      emailClicks: 0,
      platformMetrics: {
        searches,
        actions,
      },
    };
  } catch (error) {
    console.error("[Google Business] Analytics error:", error);
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

// ─── Reviews ────────────────────────────────────────────────────────────────────

export async function getGoogleBusinessReviews(
  accessToken: string,
  businessId?: string,
  limit = 20,
): Promise<any[]> {
  try {
    let profileId = businessId;
    if (!profileId) {
      const accountsResponse = await fetch("https://mybusiness.googleapis.com/v4/accounts", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!accountsResponse.ok) {
        return [];
      }

      const accountsData = (await accountsResponse.json()) as {
        accounts?: Array<{ primaryBusinessId?: string }>;
      };
      profileId = accountsData.accounts?.[0]?.primaryBusinessId;
    }

    if (!profileId) {
      return [];
    }

    const response = await fetch(
      `https://mybusiness.googleapis.com/v4/${profileId}/reviews?pageSize=${limit}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { reviews?: any[] };
    return data.reviews || [];
  } catch (error) {
    console.error("[Google Business] Reviews error:", error);
    return [];
  }
}

// ─── Insights ───────────────────────────────────────────────────────────────────

export async function getGoogleBusinessInsights(
  accessToken: string,
  businessId?: string,
): Promise<any> {
  try {
    let profileId = businessId;
    if (!profileId) {
      const accountsResponse = await fetch("https://mybusiness.googleapis.com/v4/accounts", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!accountsResponse.ok) {
        return null;
      }

      const accountsData = (await accountsResponse.json()) as {
        accounts?: Array<{ primaryBusinessId?: string }>;
      };
      profileId = accountsData.accounts?.[0]?.primaryBusinessId;
    }

    if (!profileId) {
      return null;
    }

    const response = await fetch(`https://mybusiness.googleapis.com/v4/${profileId}/insights`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[Google Business] Insights error:", error);
    return null;
  }
}
