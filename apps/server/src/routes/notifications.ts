import { db } from "@sahabatkreator/db";
import { notification } from "@sahabatkreator/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId, getUserId } from "../lib/context";

const notifApp = new Hono();

notifApp.use("/*", requireAuth);

// GET /api/notifications — list unread + read
notifApp.get("/", async (c) => {
  const userId = getUserId(c);
  const organizationId = getOrganizationId(c);

  const conditions: any[] = [eq(notification.userId, userId)];
  if (organizationId) {
    conditions.push(eq(notification.organizationId, organizationId));
  }

  const result = await db.query.notification.findMany({
    where: and(...conditions),
    orderBy: [desc(notification.createdAt)],
    limit: 50,
  });

  return c.json(result);
});

// GET /api/notifications/unread-count
notifApp.get("/unread-count", async (c) => {
  const userId = getUserId(c);

  const count = await db.$count(
    notification,
    and(eq(notification.userId, userId), eq(notification.isRead, false)),
  );

  return c.json({ count });
});

// PATCH /api/notifications/:id/read — mark as read
const markReadSchema = z.object({
  isRead: z.boolean().optional(),
});

notifApp.patch("/:id/read", async (c) => {
  const userId = getUserId(c);
  const notifId = c.req.param("id");
  const body = await c.req.json().catch(() => ({}));
  const parsed = markReadSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const notif = await db.query.notification.findFirst({
    where: eq(notification.id, notifId),
  });

  if (!notif || notif.userId !== userId) {
    return c.json({ error: "Not found" }, 404);
  }

  await db
    .update(notification)
    .set({ isRead: parsed.data.isRead ?? true })
    .where(eq(notification.id, notifId));

  return c.json({ success: true });
});

// PATCH /api/notifications/read-all
notifApp.patch("/read-all", async (c) => {
  const userId = getUserId(c);
  const organizationId = getOrganizationId(c);

  const conditions: any[] = [eq(notification.userId, userId), eq(notification.isRead, false)];
  if (organizationId) {
    conditions.push(eq(notification.organizationId, organizationId));
  }

  await db
    .update(notification)
    .set({ isRead: true })
    .where(and(...conditions));

  return c.json({ success: true });
});

// DELETE /api/notifications/:id
notifApp.delete("/:id", async (c) => {
  const userId = getUserId(c);
  const notifId = c.req.param("id");

  await db
    .delete(notification)
    .where(and(eq(notification.id, notifId), eq(notification.userId, userId)));

  return c.json({ success: true });
});

export default notifApp;
