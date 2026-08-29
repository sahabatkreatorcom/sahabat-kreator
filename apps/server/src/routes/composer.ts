import { db } from "@sahabatkreator/db";
import { organizationSetting } from "@sahabatkreator/db/schema";
import { and, desc, eq, like } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";

const composerApp = new Hono();

composerApp.use("/*", requireAuth);

// GET /api/composer/templates
composerApp.get("/templates", async (c) => {
  const organizationId = getOrganizationId(c);

  const templates = await db
    .select()
    .from(organizationSetting)
    .where(
      and(
        eq(organizationSetting.organizationId, organizationId),
        like(organizationSetting.key, "caption_template:%"),
      ),
    )
    .orderBy(desc(organizationSetting.updatedAt));

  const parsed = templates.map((r) => ({
    id: r.key.replace("caption_template:", ""),
    title: r.key.replace("caption_template:", "").replace(/_/g, " "),
    content: r.value,
    updatedAt: r.updatedAt.toISOString(),
  }));

  return c.json({ templates: parsed });
});

// POST /api/composer/templates
const createTemplateSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
});

composerApp.post("/templates", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = createTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const key = `caption_template:${parsed.data.id}`;

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

// DELETE /api/composer/templates/:id
composerApp.delete("/templates/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const templateId = c.req.param("id");
  const key = `caption_template:${templateId}`;

  const result = await db
    .delete(organizationSetting)
    .where(
      and(eq(organizationSetting.organizationId, organizationId), eq(organizationSetting.key, key)),
    );

  if (!result) return c.json({ error: "Template not found" }, 404);
  return c.json({ success: true });
});

// GET /api/composer/hashtags/collections
composerApp.get("/hashtags/collections", async (c) => {
  const organizationId = getOrganizationId(c);

  const collections = await db
    .select()
    .from(organizationSetting)
    .where(
      and(
        eq(organizationSetting.organizationId, organizationId),
        like(organizationSetting.key, "hashtag_collection:%"),
      ),
    )
    .orderBy(desc(organizationSetting.updatedAt));

  const parsed = collections.map((r) => {
    const name = r.key.replace("hashtag_collection:", "");
    let hashtags: string[] = [];
    try {
      hashtags = JSON.parse(r.value);
    } catch {
      hashtags = r.value.split(",").map((h) => h.trim());
    }
    return { id: name, name, hashtags };
  });

  return c.json({ collections: parsed });
});

// POST /api/composer/hashtags/collections
const createHashtagCollectionSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  hashtags: z.array(z.string()).min(1),
});

composerApp.post("/hashtags/collections", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = createHashtagCollectionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const key = `hashtag_collection:${parsed.data.id}`;

  await db
    .insert(organizationSetting)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      key,
      value: JSON.stringify(parsed.data.hashtags),
    })
    .onConflictDoUpdate({
      target: [organizationSetting.organizationId, organizationSetting.key],
      set: { value: JSON.stringify(parsed.data.hashtags), updatedAt: new Date() },
    });

  return c.json({ success: true, id: parsed.data.id });
});

// GET /api/composer/sounds
composerApp.get("/sounds", async (c) => {
  const organizationId = getOrganizationId(c);

  // TODO: integrate with TikTok/Meta sound API
  // For now, return empty list with note
  return c.json({
    sounds: [],
    note: "Sound integration coming soon",
    organizationId,
  });
});

// POST /api/composer/utms
const generateUTMSchema = z.object({
  url: z.string().url(),
  source: z.enum(["instagram", "tiktok", "facebook", "youtube", "linkedin", "other"]),
  medium: z.string().optional(),
  campaign: z.string().optional(),
  term: z.string().optional(),
  content: z.string().optional(),
});

composerApp.post("/utms", async (c) => {
  const body = await c.req.json();
  const parsed = generateUTMSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const params = new URLSearchParams();
  params.set("utm_source", parsed.data.source);
  if (parsed.data.medium) params.set("utm_medium", parsed.data.medium);
  if (parsed.data.campaign) params.set("utm_campaign", parsed.data.campaign);
  if (parsed.data.term) params.set("utm_term", parsed.data.term);
  if (parsed.data.content) params.set("utm_content", parsed.data.content);

  const url = new URL(parsed.data.url);
  url.search = params.toString();

  return c.json({
    url: url.toString(),
    params: Object.fromEntries(params.entries()),
  });
});

// GET /api/composer/utms/templates
composerApp.get("/utms/templates", async (c) => {
  const organizationId = getOrganizationId(c);

  const templates = await db
    .select()
    .from(organizationSetting)
    .where(
      and(
        eq(organizationSetting.organizationId, organizationId),
        like(organizationSetting.key, "utm_template:%"),
      ),
    )
    .orderBy(desc(organizationSetting.updatedAt));

  const parsed = templates.map((r) => ({
    id: r.key.replace("utm_template:", ""),
    name: r.key.replace("utm_template:", ""),
    template: r.value,
  }));

  return c.json({ templates: parsed });
});

export default composerApp;
