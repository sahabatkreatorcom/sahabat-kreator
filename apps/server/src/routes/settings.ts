import { db } from "@sahabatkreator/db";
import { organizationSetting } from "@sahabatkreator/db/schema";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { getOrganizationId } from "../lib/context";
import { requireAuth } from "../lib/auth-middleware";

const settingsApp = new Hono();
settingsApp.use("/*", requireAuth);

// Helper to upsert a setting
async function upsertSetting(
  organizationId: string,
  key: string,
  value: string,
) {
  const existing = await db
    .select()
    .from(organizationSetting)
    .where(eq(organizationSetting.organizationId, organizationId))
    .then((rows) => rows.find((r) => r.key === key));

  if (existing) {
    await db
      .update(organizationSetting)
      .set({ value, updatedAt: new Date() })
      .where(
        and(
          eq(organizationSetting.organizationId, organizationId),
          eq(organizationSetting.key, key),
        ),
      );
  } else {
    await db.insert(organizationSetting).values({
      id: crypto.randomUUID(),
      organizationId,
      key,
      value,
      updatedAt: new Date(),
    });
  }
}

// Helper to get all settings for organization
async function getSettings(organizationId: string) {
  const rows = await db
    .select()
    .from(organizationSetting)
    .where(eq(organizationSetting.organizationId, organizationId));

  const result: Record<string, string> = {};
  rows.forEach((row) => {
    result[row.key] = row.value;
  });
  return result;
}

// PATCH /api/settings/notifications
settingsApp.patch("/notifications", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const schema = z.object({
    notifications: z.record(z.string(), z.boolean()),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  await upsertSetting(organizationId, "notifications", JSON.stringify(parsed.data.notifications));

  return c.json({ success: true });
});

// PATCH /api/settings/appearance
settingsApp.patch("/appearance", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const schema = z.object({
    theme: z.enum(["light", "dark", "system"]).optional(),
    accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  if (parsed.data.theme !== undefined) {
    await upsertSetting(organizationId, "theme", parsed.data.theme);
  }
  if (parsed.data.accentColor !== undefined) {
    await upsertSetting(organizationId, "accentColor", parsed.data.accentColor);
  }

  return c.json({ success: true });
});

// PATCH /api/settings/brand-voice
settingsApp.patch("/brand-voice", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const schema = z.object({
    voice: z.array(z.string()).optional(),
    tone: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    brandName: z.string().optional(),
    industry: z.string().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  const values = {
    voice: parsed.data.voice ?? ["Profesional", "Ramah"],
    tone: parsed.data.tone ?? ["Informatif", "Menginspirasi"],
    keywords: parsed.data.keywords ?? ["tips", "tutorial", "motivasi"],
    brandName: parsed.data.brandName ?? "",
    industry: parsed.data.industry ?? "",
  };

  await upsertSetting(organizationId, "brandVoice", JSON.stringify(values));

  return c.json({ success: true });
});

// GET /api/settings/brand-voice
settingsApp.get("/brand-voice", async (c) => {
  const organizationId = getOrganizationId(c);
  const settings = await getSettings(organizationId);

  const brandVoice = settings["brandVoice"]
    ? JSON.parse(settings["brandVoice"])
    : {
        voice: ["Profesional", "Ramah"],
        tone: ["Informatif", "Menginspirasi"],
        keywords: ["tips", "tutorial", "motivasi"],
        brandName: "",
        industry: "",
      };

  return c.json({ brandVoice });
});

// PATCH /api/settings/ai-config
settingsApp.patch("/ai-config", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const schema = z.object({
    defaultTone: z.string().optional(),
    defaultStyle: z.string().optional(),
    autoSuggest: z.boolean().optional(),
    includeEmojis: z.boolean().optional(),
    includeHashtags: z.boolean().optional(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid input" }, 400);
  }

  const values = {
    defaultTone: parsed.data.defaultTone ?? "kasual",
    defaultStyle: parsed.data.defaultStyle ?? "pendek",
    autoSuggest: parsed.data.autoSuggest ?? true,
    includeEmojis: parsed.data.includeEmojis ?? true,
    includeHashtags: parsed.data.includeHashtags ?? true,
  };

  await upsertSetting(organizationId, "aiConfig", JSON.stringify(values));

  return c.json({ success: true });
});

// GET /api/settings/ai-config
settingsApp.get("/ai-config", async (c) => {
  const organizationId = getOrganizationId(c);
  const settings = await getSettings(organizationId);

  const aiConfig = settings["aiConfig"]
    ? JSON.parse(settings["aiConfig"])
    : {
        defaultTone: "kasual",
        defaultStyle: "pendek",
        autoSuggest: true,
        includeEmojis: true,
        includeHashtags: true,
      };

  return c.json({ aiConfig });
});

// GET /api/settings - Get all settings at once
settingsApp.get("/", async (c) => {
  const organizationId = getOrganizationId(c);
  const settings = await getSettings(organizationId);

  return c.json({ settings });
});

export default settingsApp;
