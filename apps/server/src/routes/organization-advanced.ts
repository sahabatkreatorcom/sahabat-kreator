import { db } from "@sahabatkreator/db";
import { organizationSetting } from "@sahabatkreator/db/schema";
import { and, desc, eq, like } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";

const orgAdvancedApp = new Hono();

orgAdvancedApp.use("/*", requireAuth);

// GET /api/org-advanced/roles
orgAdvancedApp.get("/roles", async (c) => {
  const organizationId = getOrganizationId(c);

  const roles = await db
    .select()
    .from(organizationSetting)
    .where(
      and(
        eq(organizationSetting.organizationId, organizationId),
        like(organizationSetting.key, "custom_role:%"),
      ),
    )
    .orderBy(desc(organizationSetting.updatedAt));

  const parsed = roles.map((r) => {
    const roleId = r.key.replace("custom_role:", "");
    let data: { name: string; permissions: string[]; color: string } = {
      name: roleId,
      permissions: [],
      color: "#6366f1",
    };
    try {
      data = JSON.parse(r.value);
    } catch {
      data = { name: roleId, permissions: [], color: "#6366f1" };
    }
    return { id: roleId, ...data };
  });

  return c.json({ roles: parsed });
});

// POST /api/org-advanced/roles
const createRoleSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()).optional(),
  color: z.string().optional(),
});

orgAdvancedApp.post("/roles", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = createRoleSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const key = `custom_role:${parsed.data.id}`;
  const value = JSON.stringify({
    name: parsed.data.name,
    permissions: parsed.data.permissions || [],
    color: parsed.data.color || "#6366f1",
  });

  await db
    .insert(organizationSetting)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      key,
      value,
    })
    .onConflictDoUpdate({
      target: [organizationSetting.organizationId, organizationSetting.key],
      set: { value, updatedAt: new Date() },
    });

  return c.json({ success: true, id: parsed.data.id });
});

// PUT /api/org-advanced/roles/:id
const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissions: z.array(z.string()).optional(),
  color: z.string().optional(),
});

orgAdvancedApp.put("/roles/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const roleId = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateRoleSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const key = `custom_role:${roleId}`;
  const [existing] = await db
    .select()
    .from(organizationSetting)
    .where(
      and(eq(organizationSetting.organizationId, organizationId), eq(organizationSetting.key, key)),
    );

  if (!existing) return c.json({ error: "Role not found" }, 404);

  let current = { name: roleId, permissions: [], color: "#6366f1" };
  try {
    current = JSON.parse(existing.value);
  } catch {}

  const updated = {
    ...current,
    ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
    ...(parsed.data.permissions !== undefined ? { permissions: parsed.data.permissions } : {}),
    ...(parsed.data.color !== undefined ? { color: parsed.data.color } : {}),
  };

  await db
    .update(organizationSetting)
    .set({ value: JSON.stringify(updated), updatedAt: new Date() })
    .where(
      and(eq(organizationSetting.organizationId, organizationId), eq(organizationSetting.key, key)),
    );

  return c.json({ success: true, id: roleId, role: updated });
});

// DELETE /api/org-advanced/roles/:id
orgAdvancedApp.delete("/roles/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const roleId = c.req.param("id");
  const key = `custom_role:${roleId}`;

  const result = await db
    .delete(organizationSetting)
    .where(
      and(eq(organizationSetting.organizationId, organizationId), eq(organizationSetting.key, key)),
    );

  if (!result) return c.json({ error: "Role not found" }, 404);
  return c.json({ success: true });
});

// GET /api/org-advanced/media/folders
orgAdvancedApp.get("/media/folders", async (c) => {
  const organizationId = getOrganizationId(c);

  const folders = await db
    .select()
    .from(organizationSetting)
    .where(
      and(
        eq(organizationSetting.organizationId, organizationId),
        like(organizationSetting.key, "media_folder:%"),
      ),
    )
    .orderBy(desc(organizationSetting.updatedAt));

  const parsed = folders.map((r) => ({
    id: r.key.replace("media_folder:", ""),
    name: r.key.replace("media_folder:", "").replace(/_/g, " "),
    createdAt: r.updatedAt.toISOString(),
  }));

  return c.json({ folders: parsed });
});

// POST /api/org-advanced/media/folders
const createFolderSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
});

orgAdvancedApp.post("/media/folders", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = createFolderSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const key = `media_folder:${parsed.data.id}`;

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

// GET /api/org-advanced/brand-voice
orgAdvancedApp.get("/brand-voice", async (c) => {
  const organizationId = getOrganizationId(c);

  const [setting] = await db
    .select()
    .from(organizationSetting)
    .where(
      and(
        eq(organizationSetting.organizationId, organizationId),
        eq(organizationSetting.key, "brand_voice"),
      ),
    );

  if (!setting) {
    return c.json({ hasProfile: false });
  }

  let profile = {};
  try {
    profile = JSON.parse(setting.value);
  } catch {}

  return c.json({ hasProfile: true, profile });
});

// POST /api/org-advanced/brand-voice
const brandVoiceSchema = z.object({
  tone: z
    .enum(["professional", "casual", "friendly", "humorous", "educational", "inspirational"])
    .optional(),
  voice: z.string().optional(),
  bannedPhrases: z.array(z.string()).optional(),
  preferredTopics: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
});

orgAdvancedApp.post("/brand-voice", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = brandVoiceSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  await db
    .insert(organizationSetting)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      key: "brand_voice",
      value: JSON.stringify(parsed.data),
    })
    .onConflictDoUpdate({
      target: [organizationSetting.organizationId, organizationSetting.key],
      set: { value: JSON.stringify(parsed.data), updatedAt: new Date() },
    });

  return c.json({ success: true });
});

// GET /api/org-advanced/shops
orgAdvancedApp.get("/shops", async (c) => {
  const organizationId = getOrganizationId(c);

  const shops = await db
    .select()
    .from(organizationSetting)
    .where(
      and(
        eq(organizationSetting.organizationId, organizationId),
        like(organizationSetting.key, "shop:%"),
      ),
    )
    .orderBy(desc(organizationSetting.updatedAt));

  const parsed = shops.map((r) => {
    const shopId = r.key.replace("shop:", "");
    let data = { name: shopId, platform: "unknown" };
    try {
      data = JSON.parse(r.value);
    } catch {}
    return { id: shopId, ...data };
  });

  return c.json({ shops: parsed });
});

// POST /api/org-advanced/shops/connect
const connectShopSchema = z.object({
  platform: z.enum(["SHOPIFY", "WOOCOMMERCE", "SHOPEE"]),
  shopId: z.string().min(1),
  shopName: z.string().min(1).max(200),
  accessToken: z.string().min(1),
});

orgAdvancedApp.post("/shops/connect", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = connectShopSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const key = `shop:${parsed.data.shopId}`;
  const value = JSON.stringify({
    name: parsed.data.shopName,
    platform: parsed.data.platform,
    accessToken: parsed.data.accessToken,
    connectedAt: new Date().toISOString(),
  });

  await db
    .insert(organizationSetting)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      key,
      value,
    })
    .onConflictDoUpdate({
      target: [organizationSetting.organizationId, organizationSetting.key],
      set: { value, updatedAt: new Date() },
    });

  return c.json({ success: true, shopId: parsed.data.shopId });
});

// GET /api/org-advanced/products
orgAdvancedApp.get("/products", async (c) => {
  const shopId = c.req.query("shopId");

  if (!shopId) {
    return c.json({ error: "shopId query parameter required" }, 400);
  }

  // TODO: fetch products from connected shop via platform API
  return c.json({
    products: [],
    shopId,
    note: "Product sync coming soon",
  });
});

export default orgAdvancedApp;
