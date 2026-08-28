import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";

const pushNotificationsApp = new Hono();

pushNotificationsApp.use("/*", requireAuth);

// POST /api/push/subscribe
const subscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
  browser: z.string().optional(),
  platform: z.string().optional(),
});

pushNotificationsApp.post("/subscribe", async (c) => {
  const body = await c.req.json();
  const parsed = subscribeSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  // TODO: store subscription in DB and register with push service
  return c.json({ success: true, subscriptionId: crypto.randomUUID() });
});

// DELETE /api/push/subscribe/:id
pushNotificationsApp.delete("/subscribe/:id", async (c) => {
  // TODO: remove subscription from DB and unsubscribe from push service
  return c.json({ success: true });
});

// POST /api/push/send
const sendPushSchema = z.object({
  subscriptionId: z.string(),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  url: z.string().url().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

pushNotificationsApp.post("/send", async (c) => {
  const body = await c.req.json();
  const parsed = sendPushSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  // TODO: implement actual push notification sending via service worker
  return c.json({ success: true });
});

// GET /api/push/vapid-public-key
pushNotificationsApp.get("/vapid-public-key", async (c) => {
  // TODO: load from env or generate on demand
  // VAPID keys should be stored in env: VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY
  const publicKey = process.env.VAPID_PUBLIC_KEY || "placeholder-public-key";

  return c.json({ publicKey });
});

export default pushNotificationsApp;
