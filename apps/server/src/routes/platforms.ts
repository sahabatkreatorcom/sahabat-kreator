import { db } from "@sahabatkreator/db";
import { socialAccount } from "@sahabatkreator/db/schema";
import { eq, and } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";
import { env } from "@sahabatkreator/env/server";
import {
  fetchInstagramProfile,
  fetchFacebookPage,
  fetchTikTokProfile,
  fetchYouTubeChannel,
  fetchPinterestProfile,
  fetchLinkedInProfile,
  fetchBlueskyProfile,
  fetchThreadsProfile,
  fetchGoogleBusinessProfile,
} from "@sahabatkreator/platform";

// ─── Platform API Types & Helpers ──────────────────────────────────────────────

interface PlatformToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

interface PlatformProfile {
  platformId: string;
  name: string;
  username: string;
}

// ─── URL Helpers ──────────────────────────────────────────────────────────────

function getCallbackUrl(baseUrl: string, platform: string): string {
  return `${baseUrl}/auth/${platform.toLowerCase()}/callback`;
}

function getAuthorizationUrl(platform: string, config: { clientId: string; clientSecret: string; redirectUri: string; scope?: string }, state: string): string {
  const oauthUrls: Record<string, { auth: string }> = {
    INSTAGRAM: { auth: "https://api.instagram.com/oauth/authorize" },
    FACEBOOK: { auth: "https://www.facebook.com/v26.0/dialog/oauth" },
    TIKTOK: { auth: "https://www.tiktok.com/v2/auth/authorize" },
    YOUTUBE: { auth: "https://accounts.google.com/o/oauth2/v2/auth" },
    PINTEREST: { auth: "https://www.pinterest.com/oauth/" },
    LINKEDIN: { auth: "https://www.linkedin.com/oauth/v2/authorization" },
    BLUESKY: { auth: "https://bsky.social/login" },
    THREADS: { auth: "https://threads.net/oauth/authorize" },
    GOOGLE_BUSINESS: { auth: "https://accounts.google.com/o/oauth2/v2/auth" },
  };
  const url = new URL(oauthUrls[platform]?.auth || "");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  if (config.scope) {
    url.searchParams.set("scope", config.scope);
  }
  return url.toString();
}

// ─── Hono App ─────────────────────────────────────────────────────────────────

const platformApp = new Hono();

platformApp.use("/*", requireAuth);

// ─── GET /api/platforms/:platform/auth-url ─────────────────────────────────────
const authUrlSchema = z.object({
  state: z.string().min(1),
});

platformApp.get("/:platform/auth-url", async (c) => {
  const platform = c.req.param("platform").toUpperCase();
  const query = authUrlSchema.safeParse(new URL(c.req.url).searchParams);

  if (!query.success) {
    return c.json({ error: "Invalid state parameter" }, 400);
  }

  // Get platform credentials from env
  const clientId = (env as unknown as Record<string, string | undefined>)[`PLATFORM_${platform}_CLIENT_ID`];
  const clientSecret = (env as unknown as Record<string, string | undefined>)[`PLATFORM_${platform}_CLIENT_SECRET`];

  if (!clientId || !clientSecret) {
    return c.json({ error: `Platform ${platform} not configured` }, 404);
  }

  const redirectUri = getCallbackUrl(env.NEXT_PUBLIC_APP_URL || "http://localhost:3001", platform);
  const config = PLATFORM_OAUTH_CONFIG[platform];

  const authUrl = getAuthorizationUrl(platform, {
    clientId,
    clientSecret,
    redirectUri,
    scope: config?.scopes,
  }, query.data.state);

  return c.json({ authUrl });
});

// ─── POST /api/platforms/:platform/callback ────────────────────────────────────
const callbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

platformApp.post("/:platform/callback", async (c) => {
  const organizationId = getOrganizationId(c);
  const platform = c.req.param("platform").toUpperCase();
  const body = callbackSchema.safeParse(await c.req.json());

  if (!body.success) {
    return c.json({ error: "Invalid callback parameters" }, 400);
  }

  // Get platform credentials
  const clientId = (env as unknown as Record<string, string | undefined>)[`PLATFORM_${platform}_CLIENT_ID`];
  const clientSecret = (env as unknown as Record<string, string | undefined>)[`PLATFORM_${platform}_CLIENT_SECRET`];

  if (!clientId || !clientSecret) {
    return c.json({ error: `Platform ${platform} not configured` }, 404);
  }

  const redirectUri = getCallbackUrl(env.NEXT_PUBLIC_APP_URL || "http://localhost:3001", platform);

  try {
    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(platform, body.data.code, redirectUri, clientId, clientSecret);

    // Fetch profile based on platform
    let profile: PlatformProfile | null = null;

    switch (platform) {
      case "INSTAGRAM":
      case "FACEBOOK":
        profile = await fetchInstagramProfile(tokenResponse.accessToken);
        break;
      case "FACEBOOK":
        profile = await fetchFacebookPage(tokenResponse.accessToken);
        break;
      case "INSTAGRAM":
        profile = await fetchInstagramProfile(tokenResponse.accessToken);
        break;
      case "TIKTOK":
        profile = await fetchTikTokProfile(tokenResponse.accessToken);
        break;
      case "YOUTUBE":
        profile = await fetchYouTubeChannel(tokenResponse.accessToken);
        break;
      case "PINTEREST":
        profile = await fetchPinterestProfile(tokenResponse.accessToken);
        break;
      case "LINKEDIN":
        profile = await fetchLinkedInProfile(tokenResponse.accessToken);
        break;
      case "BLUESKY":
        profile = await fetchBlueskyProfile(tokenResponse.accessToken);
        break;
      case "THREADS":
        profile = await fetchThreadsProfile(tokenResponse.accessToken);
        break;
      case "GOOGLE_BUSINESS":
        profile = await fetchGoogleBusinessProfile(tokenResponse.accessToken);
        break;
      default:
        return c.json({ error: `Platform ${platform} not supported yet` }, 400);
    }

    if (!profile) {
      return c.json({ error: "Failed to fetch profile" }, 500);
    }

    // Check if account already exists
    const existing = await db.query.socialAccount.findFirst({
      where: and(
        eq(socialAccount.organizationId, organizationId),
        eq(socialAccount.platformAccountId, profile.platformId),
      ),
    });

    if (existing) {
      // Update existing account
      await db.update(socialAccount).set({
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken || null,
        tokenExpiresAt: new Date(Date.now() + tokenResponse.expiresIn * 1000),
        isActive: true,
      }).where(eq(socialAccount.id, existing.id));

      return c.json({ success: true, account: { ...existing, accessToken: undefined, refreshToken: undefined } });
    }

    // Create new account
    const [newAccount] = await db
      .insert(socialAccount)
      .values({
        id: crypto.randomUUID(),
        organizationId,
        platform: platform as any,
        platformAccountId: profile.platformId,
        name: profile.name,
        username: profile.username,
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken || null,
        tokenExpiresAt: new Date(Date.now() + tokenResponse.expiresIn * 1000),
      })
      .returning();

    return c.json({ success: true, account: { ...newAccount, accessToken: undefined, refreshToken: undefined } });
  } catch (error) {
    console.error(`[Platform] ${platform} callback error:`, error);
    return c.json({ error: "Failed to process callback" }, 500);
  }
});

// ─── GET /api/platforms/:platform/analytics ────────────────────────────────────
const analyticsSchema = z.object({
  days: z.number().min(1).max(365).default(30),
});

platformApp.get("/:platform/analytics", async (c) => {
  const organizationId = getOrganizationId(c);
  const platform = c.req.param("platform").toUpperCase();
  const query = analyticsSchema.safeParse(new URL(c.req.url).searchParams);

  const days = query.success ? query.data.days : 30;
  void days; // used in analytics fetch

  // Get connected account
  const [account] = await db
    .select()
    .from(socialAccount)
    .where(and(
      eq(socialAccount.organizationId, organizationId),
      eq(socialAccount.platform, platform as any),
      eq(socialAccount.isActive, true),
    ))
    .limit(1);

  if (!account) {
    return c.json({ error: `No active ${platform} account connected` }, 404);
  }

  try {
    const analytics = { followers: 0, following: 0, posts: 0 };

    switch (platform) {
      case "INSTAGRAM":
      case "FACEBOOK":
        // TODO: Implement Instagram/Facebook analytics via platform API
        break;
      case "TIKTOK":
        // TODO: Implement TikTok analytics
        break;
      case "YOUTUBE":
        // TODO: Implement YouTube analytics
        break;
      case "PINTEREST":
        // TODO: Implement Pinterest analytics
        break;
      case "LINKEDIN":
        // TODO: Implement LinkedIn analytics
        break;
      case "BLUESKY":
        // TODO: Implement Bluesky analytics
        break;
      case "THREADS":
        // TODO: Implement Threads analytics
        break;
      case "GOOGLE_BUSINESS":
        // TODO: Implement Google Business analytics
        break;
      default:
        return c.json({ error: `Platform ${platform} not supported yet` }, 400);
    }

    return c.json({ analytics });
  } catch (error) {
    console.error(`[Platform] ${platform} analytics error:`, error);
    return c.json({ error: "Failed to fetch analytics" }, 500);
  }
});

// ─── GET /api/platforms/:platform/comments ─────────────────────────────────────
const commentsSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
});

platformApp.get("/:platform/comments", async (c) => {
  const organizationId = getOrganizationId(c);
  const platform = c.req.param("platform").toUpperCase();
  const query = commentsSchema.safeParse(new URL(c.req.url).searchParams);

  const limit = query.success ? query.data.limit : 20;
  void limit;

  // Get connected account
  const [account] = await db
    .select()
    .from(socialAccount)
    .where(and(
      eq(socialAccount.organizationId, organizationId),
      eq(socialAccount.platform, platform as any),
      eq(socialAccount.isActive, true),
    ))
    .limit(1);

  if (!account) {
    return c.json({ error: `No active ${platform} account connected` }, 404);
  }

  try {
    const comments: Array<{ id: string; text: string; author: string }> = [];

    switch (platform) {
      case "INSTAGRAM":
        // TODO: Implement Instagram comments
        break;
      case "TIKTOK":
        // TODO: Implement TikTok comments
        break;
      case "YOUTUBE":
        // TODO: Implement YouTube comments
        break;
      case "PINTEREST":
        // TODO: Implement Pinterest comments
        break;
      case "LINKEDIN":
        // TODO: Implement LinkedIn comments
        break;
      case "BLUESKY":
        // TODO: Implement Bluesky comments
        break;
      case "THREADS":
        // TODO: Implement Threads comments
        break;
      case "GOOGLE_BUSINESS":
        // TODO: Implement Google Business comments
        break;
      default:
        return c.json({ error: `Platform ${platform} not supported yet` }, 400);
    }

    return c.json({ comments });
  } catch (error) {
    console.error(`[Platform] ${platform} comments error:`, error);
    return c.json({ error: "Failed to fetch comments" }, 500);
  }
});

// ─── Platform OAuth Config ─────────────────────────────────────────────────────
// Updated to use correct OAuth 2.0 endpoints per platform documentation

interface PlatformOAuthConfig {
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string;
  // Whether to use form-urlencoded or JSON for token exchange
  tokenContentType: "application/x-www-form-urlencoded" | "application/json";
  // Custom field mappings for token response
  tokenFieldMappings?: {
    accessToken?: string[];
    refreshToken?: string[];
    expiresIn?: string[];
  };
}

const PLATFORM_OAUTH_CONFIG: Record<string, PlatformOAuthConfig> = {
  INSTAGRAM: {
    authorizeUrl: "https://api.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    scopes: "user_profile,user_media",
    tokenContentType: "application/json",
  },
  FACEBOOK: {
    authorizeUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scopes: "pages_show_list,pages_manage_posts,pages_read_engagement",
    tokenContentType: "application/json",
  },
  TIKTOK: {
    authorizeUrl: "https://www.tiktok.com/v2/auth/authorize",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    scopes: "user.info.basic,video.list,video.publish",
    tokenContentType: "application/json",
  },
  YOUTUBE: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: "https://www.googleapis.com/auth/youtube.force-ssl",
    tokenContentType: "application/x-www-form-urlencoded",
  },
  PINTEREST: {
    authorizeUrl: "https://www.pinterest.com/oauth/",
    tokenUrl: "https://api.pinterest.com/v5/oauth/token",
    scopes: "read_accounts,write_accounts,read_pins,write_pins",
    tokenContentType: "application/x-www-form-urlencoded",
  },
  LINKEDIN: {
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: "r_liteprofile,r_emailaddress,w_member_social",
    tokenContentType: "application/x-www-form-urlencoded",
  },
  BLUESKY: {
    authorizeUrl: "https://bsky.social/login",
    tokenUrl: "https://bsky.social/xrpc/com.atproto.server.createSession",
    scopes: "",
    tokenContentType: "application/json",
  },
  THREADS: {
    authorizeUrl: "https://threads.net/oauth/authorize",
    tokenUrl: "https://graph.threads.net/oauth/access_token",
    scopes: "threads_basic,threads_manage_comments,threads_manage_replies",
    tokenContentType: "application/json",
  },
  GOOGLE_BUSINESS: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: "https://www.googleapis.com/auth/business.manage",
    tokenContentType: "application/x-www-form-urlencoded",
  },
};

/**
 * Exchange authorization code for access token using platform-specific config
 */
async function exchangeCodeForToken(
  platform: string,
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
): Promise<PlatformToken> {
  const config = PLATFORM_OAUTH_CONFIG[platform];
  if (!config) throw new Error(`Unsupported platform: ${platform}`);

  let response: Response;

  switch (platform) {
    case "INSTAGRAM":
      response = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code,
        }),
      });
      break;

    case "FACEBOOK":
      // Facebook/Instagram Graph API returns query string format
      response = await fetch(`${config.tokenUrl}?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(redirectUri)}&code=${encodeURIComponent(code)}`);
      break;

    case "TIKTOK":
      response = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_key: clientId,
          client_secret: clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      });
      break;

    case "YOUTUBE":
    case "GOOGLE_BUSINESS":
      response = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }).toString(),
      });
      break;

    case "PINTEREST":
      response = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
      });
      break;

    case "LINKEDIN":
      response = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }).toString(),
      });
      break;

    case "BLUESKY":
      // Bluesky uses AT Protocol - code is actually the verification code
      // Need to use the session creation endpoint
      response = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: clientId,
          password: code,
          authority: "bsky.social",
        }),
      });
      break;

    case "THREADS":
      response = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });
      break;

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed for ${platform}: ${errorText}`);
  }

  // Parse response based on content type
  const contentType = response.headers.get("content-type") || "";
  let data: Record<string, unknown>;

  if (contentType.includes("application/json")) {
    data = await response.json() as Record<string, unknown>;
  } else {
    // Parse query string format (Facebook/Instagram style)
    const text = await response.text();
    const params = new URLSearchParams(text);
    data = Object.fromEntries(params.entries());
  }

  // Extract token fields with flexible mapping
  const tokenData = data as Record<string, string | number>;
  const accessToken = String(tokenData.access_token || tokenData.accessToken || "");
  const refreshToken = tokenData.refresh_token ? String(tokenData.refresh_token) : tokenData.refreshToken ? String(tokenData.refreshToken) : undefined;
  const expiresIn = Number(tokenData.expires_in) || Number(tokenData.expiresIn) || 3600;

  return { accessToken, refreshToken, expiresIn };
}

export default platformApp;
