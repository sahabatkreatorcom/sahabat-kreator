import { db } from "@sahabatkreator/db";
import { user } from "@sahabatkreator/db/schema";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getUserId } from "../lib/context";

const adminUserBanApp = new Hono();

adminUserBanApp.use("/*", requireAuth);
adminUserBanApp.use("/*", async (c, next) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const [currentUser] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (currentUser?.role !== "superadmin") {
    return c.json({ error: "Forbidden: Super admin only" }, 403);
  }
  await next();
});

const banSchema = z.object({
  reason: z.string().max(500),
  expiresAt: z.string().nullable().optional(),
});

// ─── POST /api/admin/users/:id/ban ───────────────────────────────
adminUserBanApp.post("/:id", async (c) => {
  const targetUserId = c.req.param("id");
  const actorUserId = getUserId(c)!;

  // Cannot ban yourself
  if (targetUserId === actorUserId) {
    return c.json({ error: "Cannot ban yourself" }, 400);
  }

  const body = await c.req.json();
  const parsed = banSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  // Verify target exists
  const [targetUser] = await db
    .select({ id: user.id, name: user.name, email: user.email, role: user.role })
    .from(user)
    .where(eq(user.id, targetUserId))
    .limit(1);

  if (!targetUser) {
    return c.json({ error: "User not found" }, 404);
  }

  // Cannot ban another super admin
  if (targetUser.role === "superadmin") {
    return c.json({ error: "Cannot ban super admin" }, 403);
  }

  const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;

  await db
    .update(user)
    .set({
      banned: true,
      banReason: parsed.data.reason,
      banExpires: expiresAt,
    })
    .where(eq(user.id, targetUserId));

  return c.json({
    success: true,
    message: `User ${targetUser.name || targetUser.email} has been banned`,
    user: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      banned: true,
      banReason: parsed.data.reason,
      banExpires: expiresAt,
    },
  });
});

// ─── POST /api/admin/users/:id/unban ─────────────────────────────
adminUserBanApp.post("/:id/unban", async (c) => {
  const targetUserId = c.req.param("id");

  await db
    .update(user)
    .set({
      banned: false,
      banReason: null,
      banExpires: null,
    })
    .where(eq(user.id, targetUserId));

  return c.json({ success: true, message: "User unbanned" });
});

export default adminUserBanApp;
