/**
 * LinkedIn API Adapter
 * Handles profile fetching and analytics via LinkedIn API v2
 */

import type { AccountMetrics, PlatformProfile } from "./types";

// ─── Profile ────────────────────────────────────────────────────────────────────

export async function fetchLinkedInProfile(accessToken: string): Promise<PlatformProfile | null> {
  try {
    const response = await fetch("https://api.linkedin.com/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });

    if (!response.ok) {
      console.error("[LinkedIn] Failed to fetch profile:", await response.text());
      return null;
    }

    const data = (await response.json()) as {
      id?: string;
      localizedFirstName?: { text?: string };
      localizedLastName?: { text?: string };
      firstName?: string;
      lastName?: string;
    };

    const firstName = data.localizedFirstName?.text || data.firstName || "";
    const lastName = data.localizedLastName?.text || data.lastName || "";

    return {
      platformId: data.id || "",
      name: `${firstName} ${lastName}`.trim(),
      username: data.id || "",
      profilePicture: null,
      metadata: {
        firstName,
        lastName,
      },
    };
  } catch (error) {
    console.error("[LinkedIn] Profile fetch error:", error);
    return null;
  }
}

// ─── Company Profile ────────────────────────────────────────────────────────────

export async function fetchLinkedInCompany(
  accessToken: string,
  companyId: string,
): Promise<PlatformProfile | null> {
  try {
    const response = await fetch(
      `https://api.linkedin.com/v2/companies/${companyId}?q=linkedinMembers&fields=universalName,name,websiteUrl,industry,employeeCount,logoUrl`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      },
    );

    if (!response.ok) {
      console.error("[LinkedIn] Failed to fetch company:", await response.text());
      return null;
    }

    const data = (await response.json()) as {
      name?: string;
      universalName?: string;
      websiteUrl?: string;
      industry?: string;
      employeeCount?: number;
      logoUrl?: string;
    };

    return {
      platformId: companyId,
      name: data.name || "",
      username: data.universalName || "",
      profilePicture: data.logoUrl || null,
      metadata: {
        website: data.websiteUrl,
        industry: data.industry,
        employeeCount: data.employeeCount,
      },
    };
  } catch (error) {
    console.error("[LinkedIn] Company fetch error:", error);
    return null;
  }
}

// ─── Analytics ──────────────────────────────────────────────────────────────────

export async function getLinkedInAnalytics(
  _accessToken: string,
  _accountId?: string,
): Promise<AccountMetrics> {
  try {
    // LinkedIn Personal Profile Analytics
    // Note: LinkedIn has limited analytics API access
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
      platformMetrics: {
        note: "LinkedIn analytics requires Organization API access",
      },
    };
  } catch (error) {
    console.error("[LinkedIn] Analytics error:", error);
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

export async function getLinkedInPosts(
  accessToken: string,
  authorId: string,
  limit = 10,
): Promise<any[]> {
  try {
    const url = `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(${authorId})&projection=(elements*(text,createdTime,likeCount,commentCount))&limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { elements?: any[] };
    return data.elements || [];
  } catch (error) {
    console.error("[LinkedIn] Posts error:", error);
    return [];
  }
}

// ─── Company Analytics ──────────────────────────────────────────────────────────

export async function getLinkedInCompanyAnalytics(
  accessToken: string,
  companyId: string,
): Promise<any> {
  try {
    // LinkedIn Organization Analytics
    const url = `https://api.linkedin.com/v2/organizations/${companyId}?projection=(id,name,universalName,websiteUrl,employeeCount,logoUrl,followerCount)`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[LinkedIn] Company analytics error:", error);
    return null;
  }
}
