import { getPlatformStrategy } from "./oauth-registry";

export interface PlatformToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

const IS_SANDBOX = process.env.PINTEREST_SANDBOX === "true";

// ─── Per-platform token URL (for internal use) ───────────────────────────────────

const TOKEN_URLS: Record<string, string> = {
  INSTAGRAM: "https://api.instagram.com/oauth/access_token",
  INSTAGRAM_PAGE: "https://graph.facebook.com/v26.0/oauth/access_token",
  FACEBOOK: "https://graph.facebook.com/v26.0/oauth/access_token",
  TIKTOK: "https://open.tiktokapis.com/v2/oauth/token/",
  YOUTUBE: "https://oauth2.googleapis.com/token",
  PINTEREST: IS_SANDBOX
    ? "https://api-sandbox.pinterest.com/v5/oauth/token"
    : "https://api.pinterest.com/v5/oauth/token",
  LINKEDIN: "https://www.linkedin.com/oauth/v2/accessToken",
  BLUESKY: "https://bsky.social/xrpc/com.atproto.server.createSession",
  THREADS: "https://graph.threads.net/oauth/access_token",
  GOOGLE_BUSINESS: "https://oauth2.googleapis.com/token",
};

// ─── Token Exchange ──────────────────────────────────────────────────────────────

/**
 * Exchange an authorization code for an access token.
 * Delegates to the per-platform strategy's tokenExchange type.
 */
export async function exchangeCodeForToken(
  platform: string,
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
): Promise<PlatformToken> {
  const strategy = getPlatformStrategy(platform);
  const tokenUrl = TOKEN_URLS[platform];

  if (!tokenUrl) {
    throw new Error(`No token URL configured for platform: ${platform}`);
  }

  let response: Response;

  switch (strategy.tokenExchange) {
    case "json":
      // Generic JSON body (Instagram standalone, TikTok, Threads)
      response = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildJsonBody(platform, code, redirectUri, clientId, clientSecret)),
      });
      break;

    case "querystring":
      // Meta Graph API returns query-string format: key=value&key2=value2
      response = await fetch(
        `${tokenUrl}?client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=authorization_code&redirect_uri=${encodeURIComponent(redirectUri)}&code=${encodeURIComponent(code)}`,
      );
      break;

    case "form":
      // Standard OAuth2 form-encoded (Google, Pinterest, LinkedIn)
      response = await fetch(tokenUrl, {
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

    case "bluesky":
      // Bluesky uses AT Protocol — code is the verification code, id is the handle
      response = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: clientId,
          password: code,
          authority: "bsky.social",
        }),
      });
      break;

    default:
      throw new Error(`Unknown tokenExchange strategy for ${platform}`);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed for ${platform}: ${errorText}`);
  }

  return parseTokenResponse(response);
}

// ─── Token Response Parsing ──────────────────────────────────────────────────────

async function parseTokenResponse(response: Response): Promise<PlatformToken> {
  const contentType = response.headers.get("content-type") || "";
  let data: Record<string, unknown>;

  if (contentType.includes("application/json")) {
    data = (await response.json()) as Record<string, unknown>;
  } else {
    // Parse query-string format (Meta Graph API)
    const text = await response.text();
    const params = new URLSearchParams(text);
    data = Object.fromEntries(params.entries());
  }

  const tokenData = data as Record<string, string | number>;
  return {
    accessToken: String(tokenData.access_token || tokenData.accessToken || ""),
    refreshToken: String(tokenData.refresh_token ?? tokenData.refreshToken ?? "") || undefined,
    expiresIn: Number(tokenData.expires_in ?? tokenData.expiresIn ?? 3600),
  };
}

// ─── Authorization URL Builder ───────────────────────────────────────────────────

export function buildAuthorizationUrl(
  platform: string,
  clientId: string,
  redirectUri: string,
  state: string,
): string {
  const strategy = getPlatformStrategy(platform);
  const url = new URL(strategy.authorizeUrl);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  if (strategy.scopes) {
    url.searchParams.set("scope", strategy.scopes);
  }
  return url.toString();
}

// ─── Callback URL ────────────────────────────────────────────────────────────────

export function getCallbackUrl(baseUrl: string, platform: string): string {
  return `${baseUrl}/auth/${platform.toLowerCase()}/callback`;
}

// ─── Request Body Builder (for JSON token exchanges) ─────────────────────────────

function buildJsonBody(
  platform: string,
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
): Record<string, unknown> {
  // TikTok uses `client_key` instead of `client_id`
  if (platform === "TIKTOK") {
    return {
      client_key: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    };
  }
  // Threads uses standard OAuth2 JSON format
  if (platform === "THREADS") {
    return {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    };
  }
  // Instagram standalone (JSON body)
  return {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  };
}
