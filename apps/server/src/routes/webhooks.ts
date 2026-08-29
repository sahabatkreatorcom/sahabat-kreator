import { db } from "@sahabatkreator/db";
import { socialAccount } from "@sahabatkreator/db/schema";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import crypto from "node:crypto";
import { env } from "@sahabatkreator/env/server";
import { WebhookDispatcher } from "../lib/webhook-dispatcher";
import {
  getPlatformCredential,
  isValidYouTubeWebhook,
} from "../lib/webhook-helpers";
import {
  handleInstagramWebhook,
  handleTikTokWebhook,
  handleYouTubeWebhook,
  handleThreadsWebhook,
  handlePinterestWebhook,
  handleLinkedInWebhook,
} from "../lib/webhook-handlers";

// Register handlers
WebhookDispatcher.register("INSTAGRAM", handleInstagramWebhook);
WebhookDispatcher.register("FACEBOOK", handleInstagramWebhook);
WebhookDispatcher.register("TIKTOK", handleTikTokWebhook);
WebhookDispatcher.register("YOUTUBE", handleYouTubeWebhook);
WebhookDispatcher.register("THREADS", handleThreadsWebhook);
WebhookDispatcher.register("PINTEREST", handlePinterestWebhook);
WebhookDispatcher.register("LINKEDIN", handleLinkedInWebhook);

const webhookApp = new Hono();

// ─── GET /api/webhooks/:platform — Challenge verification ────────
webhookApp.get("/:platform", async (c) => {
  const url = new URL(c.req.url);

  const hubMode = url.searchParams.get("hub.mode");
  const hubVerifyToken = url.searchParams.get("hub.verify_token");
  const hubChallenge = url.searchParams.get("hub.challenge");

  // Instagram/Facebook challenge response
  if (hubMode === "subscribe" && hubVerifyToken && hubChallenge) {
    return c.text(hubChallenge);
  }

  return c.json({ error: "Invalid request" }, 400);
});

// ─── POST /api/webhooks/:platform — Inbound webhook events ───────
webhookApp.post("/:platform", async (c) => {
  const platformLower = c.req.param("platform");
  const platform = platformLower.toUpperCase();

  const findOrganization = async (pl: string) => {
    const accounts = await db
      .select()
      .from(socialAccount)
      .where(eq(socialAccount.platform, pl as any))
      .limit(50);

    let organizationId: string | undefined;
    let accountId: string | undefined;

    const firstAccount = accounts.find((a) => a.isActive);
    if (firstAccount) {
      organizationId = firstAccount.organizationId;
      accountId = firstAccount.platformAccountId;
    }

    return { organizationId, accountId, accounts };
  };

  // ── Instagram / Facebook ──────────────────────────────────────
  if (platform === "INSTAGRAM" || platform === "FACEBOOK") {
    const body = await c.req.json().catch(() => ({}));

    const entry = body.entry?.[0] as any;
    const changes = entry?.changes || body.changes;
    const firstChange = changes?.[0];
    const value = firstChange?.value as any;
    const parentId = value?.parent_id || value?.id;

    const { organizationId, accountId } = await findOrganization(platform);

    if (!organizationId) {
      return c.json({ error: "No matching organization found" }, 404);
    }

    const event: any = {
      platform,
      organizationId,
      accountId,
      eventType: firstChange?.field || "comment",
      rawPayload: body,
      metadata: { parentId, object: body.object },
    };

    await WebhookDispatcher.dispatch(event);
    return c.json({ status: "received" });
  }

  // ── TikTok ──────────────────────────────────��─────────────────
  if (platform === "TIKTOK") {
    const rawBody = await c.req.text();

    const _timestamp = c.req.header("x-ss-req-timestamp") ?? "";
    void _timestamp;
    const signature = c.req.header("x-hub-signature-256") ?? "";

    const [cred] = await getPlatformCredential(platform);
    const clientSecret = cred?.clientSecret ?? env.SUMOPOD_API_SECRET ?? "";

    const isValidSig = signature
      ? crypto.createHmac("sha256", clientSecret).update(rawBody).digest("hex") === signature
      : true;

    if (!isValidSig) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    const eventType = parsed.eventType || parsed.type;

    const userId = parsed.userId || parsed.resource_owner?.user_id;
    const accounts = await db
      .select()
      .from(socialAccount)
      .where(eq(socialAccount.platform, platform as any))
      .limit(50);

    let organizationId: string | undefined;
    let accountId: string | undefined;

    for (const acc of accounts) {
      if (userId && (acc as any).metadata?.userId === userId) {
        organizationId = acc.organizationId;
        accountId = acc.platformAccountId;
        break;
      }
    }

    if (!organizationId) {
      const firstAccount = accounts.find((a) => a.isActive);
      if (firstAccount) {
        organizationId = firstAccount.organizationId;
        accountId = firstAccount.platformAccountId;
      }
    }

    if (!organizationId) {
      return c.json({ error: "No matching organization found" }, 404);
    }

    const event = {
      platform,
      organizationId,
      accountId,
      eventType,
      rawPayload: parsed,
    };

    await WebhookDispatcher.dispatch(event);
    return c.json({ status: "ok" });
  }

  // ── YouTube ───────────────────────────────────────────────────
  if (platform === "YOUTUBE") {
    const rawBody = await c.req.text();
    let body: any;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    if (!isValidYouTubeWebhook(body)) {
      return c.json({ error: "Invalid webhook payload" }, 400);
    }

    const _channelId = body.data?.snippet?.channelId || body.channelId;
    void _channelId;

    const { organizationId, accountId } = await findOrganization(platform);

    if (!organizationId) {
      return c.json({ error: "No matching organization found" }, 404);
    }

    const event = {
      platform,
      organizationId,
      accountId,
      eventType: body.subscriptionId || "youtube.comment",
      rawPayload: body,
    };

    await WebhookDispatcher.dispatch(event);
    return c.json({ status: "ok" });
  }

  // ── Threads ───────────────────────────────────────────────────
  if (platform === "THREADS") {
    const body = await c.req.json().catch(() => ({}));

    const { organizationId, accountId } = await findOrganization(platform);

    if (!organizationId) {
      return c.json({ error: "No matching organization found" }, 404);
    }

    const event = {
      platform,
      organizationId,
      accountId,
      eventType: body.type || "thread",
      rawPayload: body,
    };

    await WebhookDispatcher.dispatch(event);
    return c.json({ status: "received" });
  }

  // ── Pinterest ─────────────────────────────────────────────────
  if (platform === "PINTEREST") {
    const body = await c.req.json().catch(() => ({}));

    const { organizationId, accountId } = await findOrganization(platform);

    if (!organizationId) {
      return c.json({ error: "No matching organization found" }, 404);
    }

    const event = {
      platform,
      organizationId,
      accountId,
      eventType: body.notification?.type || body.type || "pinterest_event",
      rawPayload: body,
    };

    await WebhookDispatcher.dispatch(event);
    return c.json({ status: "received" });
  }

  // ── LinkedIn ──────────────────────────────────────────────────
  if (platform === "LINKEDIN") {
    const rawBody = await c.req.text();
    let body: any;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    const _resourceId = body.resource as string;
    void _resourceId;

    const { organizationId, accountId } = await findOrganization(platform);

    if (!organizationId) {
      return c.json({ error: "No matching organization found" }, 404);
    }

    const event = {
      platform,
      organizationId,
      accountId,
      eventType: body.eventType || "linkedin_notification",
      rawPayload: body,
    };

    await WebhookDispatcher.dispatch(event);
    return c.json({ status: "received" });
  }

  return c.json({ error: `Unsupported platform: ${platformLower}` }, 400);
});

export default webhookApp;
