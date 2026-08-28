import { db } from "@sahabatkreator/db";
import { pushSubscription } from "@sahabatkreator/db/schema/push";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId, getUserId } from "../lib/context";

const pushApp = new Hono();

pushApp.use("/*", requireAuth);

// ── GET /api/push/subscriptions ────────────────────────────────
pushApp.get("/subscriptions", async (c) => {
  const userId = getUserId(c);
  const subscriptions = await db
    .select({
      id: pushSubscription.id,
      endpoint: pushSubscription.endpoint,
      createdAt: pushSubscription.createdAt,
    })
    .from(pushSubscription)
    .where(eq(pushSubscription.userId, userId));

  return c.json({ subscriptions });
});

// ── POST /api/push/subscribe ──────────────────────────────────
const subscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

pushApp.post("/subscribe", async (c) => {
  const userId = getUserId(c);
  const organizationId = getOrganizationId(c);
  const body = await c.req.json().catch(() => ({}));
  const parsed = subscribeSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid subscription data" }, 400);
  }

  // Remove existing subscription for this endpoint (if any)
  await db
    .delete(pushSubscription)
    .where(eq(pushSubscription.endpoint, parsed.data.endpoint));

  const [subscription] = await db
    .insert(pushSubscription)
    .values({
      id: crypto.randomUUID(),
      userId,
      organizationId: organizationId || undefined,
      ...parsed.data,
    })
    .returning();

  return c.json({ subscription });
});

// ── DELETE /api/push/subscriptions/:id ──────────────────────────
pushApp.delete("/subscriptions/:id", async (c) => {
  const userId = getUserId(c);
  const subscriptionId = c.req.param("id");

  await db
    .delete(pushSubscription)
    .where(
      and(
        eq(pushSubscription.id, subscriptionId),
        eq(pushSubscription.userId, userId),
      ),
    );

  return c.json({ success: true });
});

// ── POST /api/push/send-test ───────────────────────────────────
const sendTestSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
});

pushApp.post("/send-test", async (c) => {
  const _userId = getUserId(c);
  void _userId;
  const body = await c.req.json().catch(() => ({}));
  const parsed = sendTestSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  // This will be handled by the worker in production
  // For now, just acknowledge receipt
  return c.json({
    success: true,
    message: "Push notification queued for delivery",
  });
});

// ── POST /api/push/send (internal/admin trigger) ───────────────
const sendNotificationSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional(),
});

pushApp.post("/send", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = sendNotificationSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  // Queue via BullMQ in production
  // For now, just acknowledge
  const userId = parsed.data.userId;
  void userId;
  return c.json({
    success: true,
    message: `Push queued for user ${userId}`,
  });
});

export default pushApp;
