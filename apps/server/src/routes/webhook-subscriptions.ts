import { db } from "@sahabatkreator/db";
import { webhookSubscription } from "@sahabatkreator/db/schema";
import { env } from "@sahabatkreator/env/server";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";
import {
  getPlatformCredential,
  getWebhookCallbackUrl,
  upsertSubscription,
} from "../lib/webhook-helpers";

const subscriptionApp = new Hono();
subscriptionApp.use("/*", requireAuth);

const SUPPORTED_PLATFORMS = [
  "INSTAGRAM",
  "FACEBOOK",
  "TIKTOK",
  "YOUTUBE",
  "THREADS",
  "PINTEREST",
  "LINKEDIN",
];

// ─── GET /api/webhooks/subscriptions ─────────────────────────────
subscriptionApp.get("/", async (c) => {
  const organizationId = getOrganizationId(c);

  const subscriptions = await db
    .select()
    .from(webhookSubscription)
    .where(eq(webhookSubscription.organizationId, organizationId));

  return c.json({ subscriptions });
});

// ─── POST /api/webhooks/subscriptions/:platform/subscribe ────────
const subscribeSchema = z.object({
  events: z.array(z.string()).optional(),
});

subscriptionApp.post("/:platform/subscribe", async (c) => {
  const organizationId = getOrganizationId(c);
  const platform = c.req.param("platform").toUpperCase();

  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    return c.json({ error: `Platform ${platform} not supported for webhooks` }, 400);
  }

  const body = subscribeSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const events = body.data.events || ["comment.create", "message.create", "mention"];

  // Get platform credential
  const [cred] = await getPlatformCredential(platform);
  if (!cred) {
    return c.json({ error: `Platform ${platform} credentials not configured` }, 400);
  }

  const baseUrl = env.CORS_ORIGIN?.replace(/\/$/, "") || "";
  const callbackUrl = getWebhookCallbackUrl(platform, baseUrl);

  // Platform-specific subscription logic
  // Note: These functions are placeholder implementations.
  // The actual platform API calls would need to be implemented in @sahabatkreator/platform

  const platformForLog = platform;
  let platformSubscriptionId: string | undefined;

  // Instagram/Facebook uses the same Graph API
  if (platform === "INSTAGRAM" || platform === "FACEBOOK") {
    // Instagram Graph API webhook subscription requires a token-scoped request
    // This would need an admin token with manage_pages and instagram_manage_comments permissions
    // For now, we mark it as configured but pending actual subscription
    platformSubscriptionId = `pending_${organizationId}_${platform}`;
  }

  // TikTok
  if (platform === "TIKTOK") {
    // TikTok webhooks require a verified app and callback URL
    // Implementation would use TikTok's Live Events API
    platformSubscriptionId = `pending_${organizationId}_${platform}`;
  }

  // YouTube requires a webhook configuration via Google Cloud Console
  if (platform === "YOUTUBE") {
    // YouTube Data API v3 uses Channel Webhooks configured in Google Cloud
    platformSubscriptionId = `pending_${organizationId}_${platform}`;
  }

  // Threads uses Instagram Graph API webhooks
  if (platform === "THREADS") {
    platformSubscriptionId = `pending_${organizationId}_${platform}`;
  }

  // Pinterest
  if (platform === "PINTEREST") {
    // Pinterest Notifications API
    platformSubscriptionId = `pending_${organizationId}_${platform}`;
  }

  // LinkedIn
  if (platform === "LINKEDIN") {
    // LinkedIn Universal Notifications API
    platformSubscriptionId = `pending_${organizationId}_${platform}`;
  }

  // Store subscription
  const sub = await upsertSubscription(organizationId, platform, {
    callbackUrl,
    events: JSON.stringify(events),
    platformSubscriptionId,
    isActive: !!platformSubscriptionId,
  });

  return c.json({
    success: true,
    subscription: {
      id: sub.id,
      platform: platformForLog,
      callbackUrl,
      events,
      isActive: !!platformSubscriptionId,
      platformSubscriptionId,
    },
  });
});

// ─── DELETE /api/webhooks/subscriptions/:platform ────────────────
subscriptionApp.delete("/:platform", async (c) => {
  const organizationId = getOrganizationId(c);
  void c.req.param("platform");

  const [sub] = await db
    .select()
    .from(webhookSubscription)
    .where(eq(webhookSubscription.organizationId, organizationId))
    .limit(1);

  if (!sub) {
    return c.json({ error: "No subscription found" }, 404);
  }

  // Platform-specific unsubscription
  // Note: These would call the respective platform APIs to remove subscriptions

  await db.delete(webhookSubscription).where(eq(webhookSubscription.id, sub.id));

  return c.json({ success: true });
});

// ─── GET /api/webhooks/status ────────────────────────────────────
subscriptionApp.get("/status", async (c) => {
  const organizationId = getOrganizationId(c);

  const subscriptions = await db
    .select()
    .from(webhookSubscription)
    .where(eq(webhookSubscription.organizationId, organizationId));

  const byPlatform = subscriptions.reduce((acc: Record<string, any>, sub) => {
    acc[sub.platform] = {
      isActive: sub.isActive,
      callbackUrl: sub.callbackUrl,
      events: sub.events ? JSON.parse(sub.events) : [],
      platformSubscriptionId: sub.platformSubscriptionId,
      lastVerifiedAt: sub.lastVerifiedAt,
    };
    return acc;
  }, {});

  return c.json({ byPlatform });
});

export default subscriptionApp;
