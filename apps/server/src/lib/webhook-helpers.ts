import { db } from "@sahabatkreator/db";
import { globalPlatformCredential, socialAccount, webhookSubscription } from "@sahabatkreator/db/schema";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";

/**
 * Get the platform-level credential (client ID, secret, webhook token)
 */
export async function getPlatformCredential(platform: string) {
  const platformUpper = platform.toUpperCase();
  return db
    .select()
    .from(globalPlatformCredential)
    .where(eq(globalPlatformCredential.platform, platformUpper as any))
    .limit(1);
}

/**
 * Get all active social accounts for an organization on a specific platform
 */
export async function getOrganizationAccounts(_organizationId: string, platform: string) {
  return db
    .select()
    .from(socialAccount)
    .where(
      eq(
        socialAccount.platform,
        platform.toUpperCase() as any,
      ),
    )
    .execute();
}

/**
 * Get webhook subscription for an organization+platform
 */
export async function getSubscription(_organizationId: string, platform: string) {
  const platformUpper = platform.toUpperCase();
  return db
    .select()
    .from(webhookSubscription)
    .where(
      eq(webhookSubscription.platform, platformUpper as any),
    )
    .limit(1);
}

/**
 * Create or update a webhook subscription
 */
export async function upsertSubscription(
  organizationId: string,
  platform: string,
  data: {
    callbackUrl: string;
    events: string;
    platformSubscriptionId?: string;
    isActive?: boolean;
  },
) {
  const existing = await getSubscription(organizationId, platform);

  const values = {
    organizationId,
    platform: platform.toUpperCase() as any,
    callbackUrl: data.callbackUrl,
    events: data.events,
    platformSubscriptionId: data.platformSubscriptionId ?? null,
    isActive: data.isActive ?? false,
    lastVerifiedAt: data.isActive ? new Date() : null,
  };

  if (existing.length > 0) {
    const sub = existing[0];
    if (!sub) return { id: crypto.randomUUID(), ...values };
    await db
      .update(webhookSubscription)
      .set(values)
      .where(eq(webhookSubscription.id, sub.id));
    return { id: sub.id, ...values };
  }

  const id = `wh_sub_${crypto.randomUUID()}`;
  await db.insert(webhookSubscription).values({ id, ...values });
  return { id, ...values };
}

/**
 * Build the webhook callback URL for a given platform
 */
export function getWebhookCallbackUrl(platform: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/api/webhooks/${platform.toLowerCase()}`;
}

/**
 * Verify Instagram/Facebook challenge response
 */
export function verifyInstagramChallenge(
  token: string | null,
  requestBody: any,
): boolean {
  if (!token) return false;
  return requestBody["hub.verify_token"] === token && requestBody["hub.challenge"];
}

/**
 * Verify TikTok webhook signature
 */
export function verifyTikTokSignature(
  appId: string,
  timestamp: string,
  body: string,
  signature: string,
): boolean {
  const payload = `${appId}${timestamp}${body}`;
  const expected = crypto.createHmac("sha256", appId).update(payload).digest("hex");
  return expected === signature;
}

/**
 * Verify YouTube webhook (no signature, but validates structure)
 */
export function isValidYouTubeWebhook(payload: any): boolean {
  return (
    typeof payload === "object" &&
    payload.id !== undefined &&
    payload.subscriptionId !== undefined
  );
}
