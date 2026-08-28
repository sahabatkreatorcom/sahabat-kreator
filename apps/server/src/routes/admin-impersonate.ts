import { db } from "@sahabatkreator/db";
import { user, session } from "@sahabatkreator/db/schema";
import { eq, desc } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getUserId } from "../lib/context";

const adminImpersonateApp = new Hono();

adminImpersonateApp.use("/*", requireAuth);
adminImpersonateApp.use("/*", async (c, next) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  
  const [currentUser] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (currentUser?.role !== "superadmin") {
    return c.json({ error: "Forbidden: Super admin only" }, 403);
  }
  await next();
});

const impersonateSchema = z.object({
  userId: z.string().min(1),
});

// ─── POST /api/admin/impersonate ──────────────────────────────────
adminImpersonateApp.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = impersonateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const { userId: targetUserId } = parsed.data;
  const actorUserId = getUserId(c)!;

  // Cannot impersonate yourself
  if (targetUserId === actorUserId) {
    return c.json({ error: "Cannot impersonate yourself" }, 400);
  }

  // Verify target exists
  const [targetUser] = await db
    .select({ id: user.id, name: user.name, email: user.email, role: user.role, banned: user.banned })
    .from(user)
    .where(eq(user.id, targetUserId))
    .limit(1);

  if (!targetUser) {
    return c.json({ error: "User not found" }, 404);
  }

  // Cannot impersonate another super admin
  if (targetUser.role === "superadmin") {
    return c.json({ error: "Cannot impersonate another super admin" }, 403);
  }

  // Cannot impersonate banned user
  if (targetUser.banned) {
    return c.json({ error: "Cannot impersonate banned user" }, 400);
  }

  // Create impersonation session
  const impersonationToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

  await db.insert(session).values({
    id: crypto.randomUUID(),
    token: impersonationToken,
    expiresAt,
    userId: targetUserId,
    impersonatedBy: actorUserId,
  });

  return c.json({
    success: true,
    message: `Now impersonating ${targetUser.name || targetUser.email}`,
    impersonation: {
      token: impersonationToken,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
      },
      expiresAt: expiresAt.toISOString(),
    },
  });
});

// ─── DELETE /api/admin/impersonate ────────────────────────────────
adminImpersonateApp.delete("/", async (c) => {
  const actorUserId = getUserId(c)!;

  // Find active impersonation session
  const [activeSession] = await db
    .select()
    .from(session)
    .where(eq(session.impersonatedBy, actorUserId))
    .orderBy(desc(session.createdAt))
    .limit(1);

  if (!activeSession) {
    return c.json({ error: "Not currently impersonating" }, 400);
  }

  // Delete the impersonation session
  await db.delete(session).where(eq(session.id, activeSession.id));

  return c.json({
    success: true,
    message: "Impersonation ended",
  });
});

// ─── GET /api/admin/impersonate/status ────────────────────────────
adminImpersonateApp.get("/status", async (c) => {
  const actorUserId = getUserId(c)!;

  const [activeSession] = await db
    .select({
      id: session.id,
      userId: session.userId,
      impersonatedBy: session.impersonatedBy,
      expiresAt: session.expiresAt,
    })
    .from(session)
    .where(eq(session.impersonatedBy, actorUserId))
    .orderBy(desc(session.createdAt))
    .limit(1);

  if (!activeSession) {
    return c.json({ impersonating: false });
  }

  const [impersonatedUser] = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, activeSession.userId))
    .limit(1);

  return c.json({
    impersonating: true,
    session: {
      id: activeSession.id,
      user: impersonatedUser,
      expiresAt: activeSession.expiresAt.toISOString(),
    },
  });
});

export default adminImpersonateApp;
