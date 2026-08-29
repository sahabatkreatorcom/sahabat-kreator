import { db } from "@sahabatkreator/db";
import { engagementItem } from "@sahabatkreator/db/schema";
import { and, count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";

const engagementApp = new Hono();
engagementApp.use("/*", requireAuth);

// GET /api/engagement - List all engagement items
engagementApp.get("/", async (c) => {
  const organizationId = getOrganizationId(c);
  const type = c.req.query("type");
  const platform = c.req.query("platform");
  const unreadOnly = c.req.query("unread") === "true";

  const conditions = [eq(engagementItem.organizationId, organizationId)];

  if (type) {
    conditions.push(
      eq(
        engagementItem.type,
        type as
          | "COMMENT"
          | "MENTION"
          | "DM"
          | "REVIEW"
          | "STORY_MENTION"
          | "STORY_REPLY"
          | "PUBLIC_POST",
      ),
    );
  }
  if (platform) {
    conditions.push(
      eq(
        engagementItem.platform,
        platform as
          | "INSTAGRAM"
          | "FACEBOOK"
          | "TIKTOK"
          | "YOUTUBE"
          | "PINTEREST"
          | "GOOGLE_BUSINESS"
          | "LINKEDIN"
          | "BLUESKY"
          | "THREADS"
          | "MANUAL",
      ),
    );
  }
  if (unreadOnly) {
    conditions.push(eq(engagementItem.isRead, false));
  }

  const items = await db
    .select()
    .from(engagementItem)
    .where(and(...conditions))
    .orderBy(desc(engagementItem.createdAt));

  const totalCount = await db
    .select({ count: count() })
    .from(engagementItem)
    .where(eq(engagementItem.organizationId, organizationId));

  const unreadCount = await db
    .select({ count: count() })
    .from(engagementItem)
    .where(
      and(eq(engagementItem.organizationId, organizationId), eq(engagementItem.isRead, false)),
    );

  return c.json({
    items,
    unreadCount: unreadCount[0]?.count ?? 0,
    total: totalCount[0]?.count ?? 0,
  });
});

// GET /api/engagement/:id
engagementApp.get("/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const itemId = c.req.param("id");

  const item = await db
    .select()
    .from(engagementItem)
    .where(and(eq(engagementItem.id, itemId), eq(engagementItem.organizationId, organizationId)));

  if (!item.length) return c.json({ error: "Not found" }, 404);
  return c.json({ item: item[0] });
});

// PATCH /api/engagement/:id/read
engagementApp.patch("/:id/read", async (c) => {
  const organizationId = getOrganizationId(c);
  const itemId = c.req.param("id");

  const result = await db
    .update(engagementItem)
    .set({ isRead: true, updatedAt: new Date() })
    .where(and(eq(engagementItem.id, itemId), eq(engagementItem.organizationId, organizationId)));

  if (!result) return c.json({ error: "Not found" }, 404);

  return c.json({ success: true });
});

// PATCH /api/engagement/read-all
engagementApp.patch("/read-all", async (c) => {
  const organizationId = getOrganizationId(c);

  await db
    .update(engagementItem)
    .set({ isRead: true, updatedAt: new Date() })
    .where(eq(engagementItem.organizationId, organizationId));

  return c.json({ success: true });
});

// POST /api/engagement/:id/reply
engagementApp.post("/:id/reply", async (c) => {
  const organizationId = getOrganizationId(c);
  const itemId = c.req.param("id");
  const body = await c.req.json();

  const replySchema = z.object({
    content: z.string().min(1).max(2000),
  });

  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const result = await db
    .update(engagementItem)
    .set({ isReplied: true, updatedAt: new Date() })
    .where(and(eq(engagementItem.id, itemId), eq(engagementItem.organizationId, organizationId)));

  if (!result) return c.json({ error: "Not found" }, 404);

  return c.json({ success: true, message: "Reply sent" });
});

// DELETE /api/engagement/:id
engagementApp.delete("/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const itemId = c.req.param("id");

  const result = await db
    .delete(engagementItem)
    .where(and(eq(engagementItem.id, itemId), eq(engagementItem.organizationId, organizationId)));

  if (!result) return c.json({ error: "Not found" }, 404);

  return c.json({ success: true });
});

// POST /api/engagement/sync
engagementApp.post("/sync", async (c) => {
  const organizationId = getOrganizationId(c);

  const demoItems = [
    {
      id: crypto.randomUUID(),
      type: "COMMENT",
      platform: "INSTAGRAM",
      authorName: "Rina Wijaya",
      authorUsername: "@rinawijaya",
      content: "Kontennya bagus banget! 🔥",
      sentiment: "POSITIVE",
      isRead: false,
      isReplied: false,
      postCaption: "Tips content creation untuk pemula",
    },
    {
      id: crypto.randomUUID(),
      type: "MENTION",
      platform: "TIKTOK",
      authorName: "Andi Pratama",
      authorUsername: "@andipratama",
      content: "Coba cek @sahabatkreator, kontennya keren-keren!",
      sentiment: "POSITIVE",
      isRead: false,
      isReplied: false,
    },
    {
      id: crypto.randomUUID(),
      type: "DM",
      platform: "INSTAGRAM",
      authorName: "Budi Santoso",
      authorUsername: "@budisantoso",
      content: "Halo, mau tanya tentang paket bisnis",
      sentiment: "NEUTRAL",
      isRead: true,
      isReplied: false,
    },
    {
      id: crypto.randomUUID(),
      type: "REVIEW",
      platform: "FACEBOOK",
      authorName: "Sari Dewi",
      authorUsername: "@saridewi",
      content: "Pelayanan sangat baik, Recommended!",
      sentiment: "POSITIVE",
      isRead: false,
      isReplied: false,
    },
  ];

  const values = demoItems.map((item) => ({
    ...item,
    organizationId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await db.insert(engagementItem).values(values as any);

  return c.json({
    success: true,
    synced: values.length,
    message: "Engagement data synced",
  });
});

export default engagementApp;
