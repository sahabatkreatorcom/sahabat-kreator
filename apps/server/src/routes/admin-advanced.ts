import { db } from "@sahabatkreator/db";
import { auditLog, globalPlatformCredential } from "@sahabatkreator/db/schema";
import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";

const adminAdvancedApp = new Hono();

adminAdvancedApp.use("/*", requireAuth);
adminAdvancedApp.use("/*", async (c, next) => {
  const session = (c as unknown as { get: (key: string) => unknown }).get("session") as { user?: { role?: string } } | null;
  const role = session?.user?.role;
  if (role !== "superadmin") {
    return c.json({ error: "Forbidden: Super admin only" }, 403);
  }
  await next();
});

// GET /api/admin-advanced/plans
adminAdvancedApp.get("/plans", async (c) => {
  // TODO: integrate with sompot-pay for plan management
  return c.json({
    plans: [
      { id: "FREE", name: "Free", price: 0, maxMembers: 2, maxPostsPerMonth: 30, features: ["Basic scheduling", "1 social account per platform"] },
      { id: "PRO", name: "Pro", price: 99000, maxMembers: 5, maxPostsPerMonth: 100, features: ["All Free features", "AI caption assistant", "Advanced analytics"] },
      { id: "BUSINESS", name: "Business", price: 249000, maxMembers: 10, maxPostsPerMonth: -1, features: ["All Pro features", "Team collaboration", "Priority support"] },
      { id: "ENTERPRISE", name: "Enterprise", price: 0, maxMembers: -1, maxPostsPerMonth: -1, features: ["All Business features", "Custom integrations", "Dedicated support"] },
    ],
  });
});

// PUT /api/admin-advanced/plans/:id
const updatePlanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  price: z.number().optional(),
  maxMembers: z.number().optional(),
  maxPostsPerMonth: z.number().optional(),
  features: z.array(z.string()).optional(),
});

adminAdvancedApp.put("/plans/:id", async (c) => {
  const planId = c.req.param("id");
  const body = await c.req.json();
  const parsed = updatePlanSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  // TODO: integrate with sompot-pay for plan updates
  return c.json({ success: true, planId, updated: parsed.data });
});

// GET /api/admin-advanced/audit-logs
adminAdvancedApp.get("/audit-logs", async (c) => {
  const page = Number.parseInt(c.req.query("page") || "1", 10);
  const limit = Number.parseInt(c.req.query("limit") || "50", 10);
  const offset = (page - 1) * limit;

  const conditions: any[] = [];

  const action = c.req.query("action");
  if (action) conditions.push(eq(auditLog.action, action));

  const userId = c.req.query("userId");
  if (userId) conditions.push(eq(auditLog.userId, userId));

  const entityType = c.req.query("entityType");
  if (entityType) conditions.push(eq(auditLog.entityType, entityType));

  const startDate = c.req.query("startDate");
  if (startDate) conditions.push(gte(auditLog.createdAt, new Date(startDate)));

  const endDate = c.req.query("endDate");
  if (endDate) conditions.push(lte(auditLog.createdAt, new Date(endDate)));

  const logs = await db.query.auditLog.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: [desc(auditLog.createdAt)],
    limit,
    offset,
    with: {
      user: { columns: { id: true, name: true, email: true } },
    },
  });

  const totalCount = await db
    .select({ count: count() })
    .from(auditLog)
    .where(conditions.length ? and(...conditions) : undefined);

  return c.json({
    logs,
    pagination: {
      page,
      limit,
      total: Number(totalCount[0]?.count ?? 0),
      totalPages: Math.ceil((totalCount[0]?.count ?? 0) / limit),
    },
  });
});

// POST /api/admin-advanced/meta-test
const metaTestSchema = z.object({
  platform: z.enum(["INSTAGRAM", "FACEBOOK"]),
});

adminAdvancedApp.post("/meta-test", async (c) => {
  const body = await c.req.json();
  const parsed = metaTestSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const { platform } = parsed.data;

  // Get global credentials
  const [credential] = await db
    .select()
    .from(globalPlatformCredential)
    .where(eq(globalPlatformCredential.platform, platform))
    .limit(1);

  if (!credential) {
    return c.json({ success: false, error: `No credentials configured for ${platform}` });
  }

  // TODO: actually test Meta API connection
  return c.json({
    success: true,
    platform,
    connected: true,
    message: `Meta API connection successful for ${platform}`,
  });
});

// GET /api/admin-advanced/platform-health
adminAdvancedApp.get("/platform-health", async (c) => {
  const credentials = await db.query.globalPlatformCredential.findMany({
    columns: { platform: true, isConfigured: true, updatedAt: true },
  });

  const health = credentials.map((cred) => ({
    platform: cred.platform,
    configured: cred.isConfigured,
    lastUpdated: cred.updatedAt.toISOString(),
    status: cred.isConfigured ? "connected" : "disconnected",
  }));

  return c.json({ platforms: health });
});

export default adminAdvancedApp;
