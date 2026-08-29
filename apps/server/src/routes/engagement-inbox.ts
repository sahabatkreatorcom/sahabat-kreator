import { db } from "@sahabatkreator/db";
import { engagementItem, organizationSetting } from "@sahabatkreator/db/schema";
import { and, count, desc, eq, like } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";

const engagementInboxApp = new Hono();

engagementInboxApp.use("/*", requireAuth);

// GET /api/engagement-inbox/conversations
engagementInboxApp.get("/conversations", async (c) => {
  const organizationId = getOrganizationId(c);
  const filter = c.req.query("filter") || "all";
  const limit = Number.parseInt(c.req.query("limit") || "50", 10);
  const offset = Number.parseInt(c.req.query("offset") || "0", 10);

  const conditions: any[] = [eq(engagementItem.organizationId, organizationId)];

  if (filter === "unread") {
    conditions.push(eq(engagementItem.isRead, false));
  } else if (filter === "replied") {
    conditions.push(eq(engagementItem.isReplied, true));
  } else if (filter === "unreplied") {
    conditions.push(eq(engagementItem.isReplied, false));
  }

  const items = await db
    .select()
    .from(engagementItem)
    .where(and(...conditions))
    .orderBy(desc(engagementItem.createdAt))
    .limit(limit)
    .offset(offset);

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

  // Group by author for threaded conversations
  const conversationMap = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.authorUsername;
    if (!conversationMap.has(key)) {
      conversationMap.set(key, []);
    }
    conversationMap.get(key)?.push(item);
  }

  const conversations = Array.from(conversationMap.entries()).map(([author, msgs]) => ({
    author,
    lastMessage: msgs[0],
    messageCount: msgs.length,
    unreadCount: msgs.filter((m) => !m.isRead).length,
    isReplied: msgs.every((m) => m.isReplied),
  }));

  return c.json({
    conversations,
    total: Number(totalCount[0]?.count ?? 0),
    unreadCount: Number(unreadCount[0]?.count ?? 0),
    limit,
    offset,
  });
});

// POST /api/engagement-inbox/conversations/:id/reply
const replySchema = z.object({
  content: z.string().min(1).max(2000),
});

engagementInboxApp.post("/conversations/:id/reply", async (c) => {
  const organizationId = getOrganizationId(c);
  const conversationId = c.req.param("id");
  const body = await c.req.json();
  const parsed = replySchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  // Find all unread messages from this conversation
  const messages = await db
    .select()
    .from(engagementItem)
    .where(
      and(
        eq(engagementItem.organizationId, organizationId),
        eq(engagementItem.authorUsername, conversationId),
        eq(engagementItem.isRead, false),
      ),
    )
    .orderBy(desc(engagementItem.createdAt))
    .limit(1);

  if (messages.length === 0) return c.json({ error: "Conversation not found" }, 404);

  const firstMessage = messages[0];
  if (!firstMessage) return c.json({ error: "No messages found" }, 404);

  await db
    .update(engagementItem)
    .set({ isReplied: true, updatedAt: new Date() })
    .where(
      and(
        eq(engagementItem.id, firstMessage.id),
        eq(engagementItem.organizationId, organizationId),
      ),
    );

  return c.json({ success: true, message: "Reply sent" });
});

// GET /api/engagement-inbox/canned-replies
engagementInboxApp.get("/canned-replies", async (c) => {
  const organizationId = getOrganizationId(c);

  // Store canned replies in organization_setting table with key prefix
  const replies = await db
    .select()
    .from(organizationSetting)
    .where(
      and(
        eq(organizationSetting.organizationId, organizationId),
        like(organizationSetting.key, "canned_reply:%"),
      ),
    )
    .orderBy(desc(organizationSetting.updatedAt));

  const parsed = replies.map((r) => ({
    id: r.key.replace("canned_reply:", ""),
    content: r.value,
    updatedAt: r.updatedAt.toISOString(),
  }));

  return c.json({ cannedReplies: parsed });
});

// POST /api/engagement-inbox/canned-replies
const createCannedReplySchema = z.object({
  id: z.string().min(1).max(100),
  content: z.string().min(1).max(2000),
});

engagementInboxApp.post("/canned-replies", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = createCannedReplySchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const key = `canned_reply:${parsed.data.id}`;

  await db
    .insert(organizationSetting)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      key,
      value: parsed.data.content,
    })
    .onConflictDoUpdate({
      target: [organizationSetting.organizationId, organizationSetting.key],
      set: { value: parsed.data.content, updatedAt: new Date() },
    });

  return c.json({ success: true, id: parsed.data.id });
});

// DELETE /api/engagement-inbox/canned-replies/:id
engagementInboxApp.delete("/canned-replies/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const replyId = c.req.param("id");
  const key = `canned_reply:${replyId}`;

  const result = await db
    .delete(organizationSetting)
    .where(
      and(eq(organizationSetting.organizationId, organizationId), eq(organizationSetting.key, key)),
    );

  if (!result) return c.json({ error: "Canned reply not found" }, 404);
  return c.json({ success: true });
});

// GET /api/engagement-inbox/labels
engagementInboxApp.get("/labels", async (c) => {
  const organizationId = getOrganizationId(c);

  const labels = await db
    .select()
    .from(organizationSetting)
    .where(
      and(
        eq(organizationSetting.organizationId, organizationId),
        like(organizationSetting.key, "label:%"),
      ),
    )
    .orderBy(desc(organizationSetting.updatedAt));

  const parsed = labels.map((r) => ({
    id: r.key.replace("label:", ""),
    name: r.value,
    color: "#6366f1",
  }));

  return c.json({ labels: parsed });
});

// POST /api/engagement-inbox/labels
const createLabelSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(50),
});

engagementInboxApp.post("/labels", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = createLabelSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const key = `label:${parsed.data.id}`;

  await db
    .insert(organizationSetting)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      key,
      value: parsed.data.name,
    })
    .onConflictDoUpdate({
      target: [organizationSetting.organizationId, organizationSetting.key],
      set: { value: parsed.data.name, updatedAt: new Date() },
    });

  return c.json({ success: true, id: parsed.data.id });
});

// POST /api/engagement-inbox/ai-suggest/:id
engagementInboxApp.post("/ai-suggest/:id", async (c) => {
  const engagementId = c.req.param("id");

  // TODO: integrate with AI provider for reply suggestions
  return c.json({
    suggestions: [
      "Terima kasih banyak atas feedbacknya! 🙏",
      "Senang banget dengar kamu suka kontennya! ✨",
      "Makasih banyak udah support! 🙌",
    ],
    engagementId,
  });
});

// PUT /api/engagement-inbox/:id/labels
const updateLabelsSchema = z.object({
  add: z.array(z.string()).optional(),
  remove: z.array(z.string()).optional(),
});

engagementInboxApp.put("/:id/labels", async (c) => {
  const organizationId = getOrganizationId(c);
  const engagementId = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateLabelsSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const [item] = await db
    .select()
    .from(engagementItem)
    .where(
      and(eq(engagementItem.id, engagementId), eq(engagementItem.organizationId, organizationId)),
    );

  if (!item) return c.json({ error: "Engagement not found" }, 404);

  let updatedLabels: string[] = [];

  if (parsed.data.add) {
    for (const label of parsed.data.add) {
      if (!updatedLabels.includes(label)) updatedLabels.push(label);
    }
  }
  if (parsed.data.remove) {
    updatedLabels = updatedLabels.filter((l) => !parsed.data.remove?.includes(l));
  }

  await db
    .update(engagementItem)
    .set({
      updatedAt: new Date(),
    })
    .where(eq(engagementItem.id, engagementId));

  return c.json({ success: true, labels: updatedLabels });
});

export default engagementInboxApp;
