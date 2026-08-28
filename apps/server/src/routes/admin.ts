import { Hono } from "hono";
import { db } from "@sahabatkreator/db";
import { user, organization, member, payment } from "@sahabatkreator/db/schema";
import { eq, desc, count, sql, like } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";

const adminApp = new Hono();

adminApp.use("/*", requireAuth);
adminApp.use("/*", async (c, next) => {
  const session = (c as unknown as { get: (key: string) => unknown }).get("session") as { user?: { role?: string } } | null;
  const role = session?.user?.role;
  if (role !== "superadmin") {
    return c.json({ error: "Forbidden: Super admin only" }, 403);
  }
  await next();
});

adminApp.get("/stats", async (c) => {
  const [userCount] = await db.select({ count: count() }).from(user);
  const [orgCount] = await db.select({ count: count() }).from(organization);
  const [memberCount] = await db.select({ count: count() }).from(member);

  const [revenueResult] = await db
    .select({ total: sql<number>`coalesce(sum(${payment.amount}), 0)` })
    .from(payment)
    .where(eq(payment.status, "COMPLETED"));

  return c.json({
    stats: {
      totalUsers: userCount?.count ?? 0,
      totalOrganizations: orgCount?.count ?? 0,
      totalMembers: memberCount?.count ?? 0,
      totalRevenue: Number(revenueResult?.total ?? 0),
    },
  });
});

adminApp.get("/users", async (c) => {
  const page = Number.parseInt(c.req.query("page") || "1", 10);
  const search = c.req.query("search") || "";
  const limit = 20;
  const offset = (page - 1) * limit;

  const where = search ? like(user.email, `%${search}%`) : undefined;

  const users = await db.query.user.findMany({
    where,
    orderBy: [desc(user.createdAt)],
    limit,
    offset,
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true,
      role: true,
      banned: true,
      banReason: true,
      banExpires: true,
      createdAt: true,
    },
  });

  const [total] = await db.select({ count: count() }).from(user).where(where);

  return c.json({
    users,
    pagination: {
      page,
      limit,
      total: total?.count ?? 0,
      totalPages: Math.ceil((total?.count ?? 0) / limit),
    },
  });
});

adminApp.get("/users/:id", async (c) => {
  const userId = c.req.param("id");

  const found = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true,
      role: true,
      banned: true,
      banReason: true,
      banExpires: true,
      createdAt: true,
    },
  });

  if (!found) return c.json({ error: "User not found" }, 404);
  return c.json({ user: found });
});

adminApp.delete("/users/:id", async (c) => {
  const userId = c.req.param("id");

  const [deleted] = await db.delete(user).where(eq(user.id, userId)).returning();

  if (!deleted) return c.json({ error: "User not found" }, 404);
  return c.json({ success: true });
});

// ─── Ban/Unban User ─────────────────────────────────────────────
const banSchema = z.object({
  reason: z.string().min(1).max(500),
  expiresAt: z.string().optional(),
});

adminApp.post("/users/:id/ban", async (c) => {
  const targetUserId = c.req.param("id");
  
  const body = await c.req.json();
  const parsed = banSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const [targetUser] = await db
    .select({ id: user.id, role: user.role, banned: user.banned })
    .from(user)
    .where(eq(user.id, targetUserId))
    .limit(1);

  if (!targetUser) return c.json({ error: "User not found" }, 404);
  if (targetUser.role === "superadmin") return c.json({ error: "Cannot ban super admin" }, 403);

  const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;

  await db.update(user).set({
    banned: true,
    banReason: parsed.data.reason,
    banExpires: expiresAt,
  }).where(eq(user.id, targetUserId));

  return c.json({ success: true });
});

adminApp.post("/users/:id/unban", async (c) => {
  const targetUserId = c.req.param("id");

  await db.update(user).set({
    banned: false,
    banReason: null,
    banExpires: null,
  }).where(eq(user.id, targetUserId));

  return c.json({ success: true });
});

adminApp.get("/organizations", async (c) => {
  const page = Number.parseInt(c.req.query("page") || "1", 10);
  const search = c.req.query("search") || "";
  const limit = 20;
  const offset = (page - 1) * limit;

  const where = search ? like(organization.name, `%${search}%`) : undefined;

  const orgs = await db.query.organization.findMany({
    where,
    orderBy: [desc(organization.createdAt)],
    limit,
    offset,
  });

  const [total] = await db.select({ count: count() }).from(organization).where(where);

  return c.json({
    organizations: orgs,
    pagination: {
      page,
      limit,
      total: total?.count ?? 0,
      totalPages: Math.ceil((total?.count ?? 0) / limit),
    },
  });
});

adminApp.get("/billing/stats", async (c) => {
  const [orgCount] = await db.select({ count: count() }).from(organization);

  const [revenueResult] = await db
    .select({ total: sql<number>`coalesce(sum(${payment.amount}), 0)` })
    .from(payment)
    .where(eq(payment.status, "COMPLETED"));

  const recentPayments = await db.query.payment.findMany({
    orderBy: [desc(payment.createdAt)],
    limit: 20,
  });

  return c.json({
    stats: {
      totalOrganizations: orgCount?.count ?? 0,
      totalRevenue: Number(revenueResult?.total ?? 0),
      activeSubscriptions: 0,
    },
    payments: recentPayments,
  });
});

export default adminApp;
