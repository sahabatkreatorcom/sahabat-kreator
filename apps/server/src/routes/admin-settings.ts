import { db } from "@sahabatkreator/db";
import { user, organizationSetting } from "@sahabatkreator/db/schema";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getUserId } from "../lib/context";

const adminSettingsApp = new Hono();

adminSettingsApp.use("/*", requireAuth);
adminSettingsApp.use("/*", async (c, next) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  
  const [currentUser] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (currentUser?.role !== "superadmin") {
    return c.json({ error: "Forbidden: Super admin only" }, 403);
  }
  await next();
});

// ─── GET /api/admin/settings ──────────────────────────────────────
adminSettingsApp.get("/", async (c) => {
  const settings = await db.query.organizationSetting.findMany({
    where: eq(organizationSetting.organizationId, "global"),
  });

  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  return c.json({
    settings: {
      registrationEnabled: settingsMap["registration_enabled"] === "true",
      maintenanceMode: settingsMap["maintenance_mode"] === "true",
      maintenanceMessage: settingsMap["maintenance_message"] || null,
      maxOrganizationsPerUser: Number(settingsMap["max_organizations_per_user"] || 5),
      maxMembersPerOrganization: Number(settingsMap["max_members_per_organization"] || 20),
      rateLimitRequestsPerMinute: Number(settingsMap["rate_limit_requests_per_minute"] || 100),
    },
  });
});

// ─── PATCH /api/admin/settings ────────────────────────────────────
const settingsPatchSchema = z.object({
  registrationEnabled: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().max(500).nullable().optional(),
  maxOrganizationsPerUser: z.number().min(1).max(100).optional(),
  maxMembersPerOrganization: z.number().min(1).max(1000).optional(),
  rateLimitRequestsPerMinute: z.number().min(10).max(10000).optional(),
});

adminSettingsApp.patch("/", async (c) => {
  const body = await c.req.json();
  const parsed = settingsPatchSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const updates: Array<{ key: string; value: string }> = [];
  
  if (parsed.data.registrationEnabled !== undefined) {
    updates.push({ key: "registration_enabled", value: String(parsed.data.registrationEnabled) });
  }
  if (parsed.data.maintenanceMode !== undefined) {
    updates.push({ key: "maintenance_mode", value: String(parsed.data.maintenanceMode) });
    if (parsed.data.maintenanceMessage !== undefined) {
      updates.push({ key: "maintenance_message", value: parsed.data.maintenanceMessage ?? "" });
    }
  }
  if (parsed.data.maxOrganizationsPerUser !== undefined) {
    updates.push({ key: "max_organizations_per_user", value: String(parsed.data.maxOrganizationsPerUser) });
  }
  if (parsed.data.maxMembersPerOrganization !== undefined) {
    updates.push({ key: "max_members_per_organization", value: String(parsed.data.maxMembersPerOrganization) });
  }
  if (parsed.data.rateLimitRequestsPerMinute !== undefined) {
    updates.push({ key: "rate_limit_requests_per_minute", value: String(parsed.data.rateLimitRequestsPerMinute) });
  }

  for (const update of updates) {
    await db
      .insert(organizationSetting)
      .values({
        id: crypto.randomUUID(),
        organizationId: "global",
        key: update.key,
        value: update.value,
      })
      .onConflictDoUpdate({
        target: [organizationSetting.organizationId, organizationSetting.key],
        set: { value: update.value },
      });
  }

  return c.json({ success: true });
});

export default adminSettingsApp;
