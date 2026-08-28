import { db } from "@sahabatkreator/db";
import { auditLog } from "@sahabatkreator/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId, getUserId } from "../lib/context";

const auditApp = new Hono();

auditApp.use("/*", requireAuth);

// POST /api/audit/log - Record an audit event
const logSchema = z.object({
  action: z.enum([
    "LOGIN",
    "LOGOUT",
    "CREATE_POST",
    "UPDATE_POST",
    "DELETE_POST",
    "PUBLISH_POST",
    "CONNECT_ACCOUNT",
    "DISCONNECT_ACCOUNT",
    "INVITE_MEMBER",
    "REMOVE_MEMBER",
    "UPDATE_ROLE",
    "CHANGE_SETTINGS",
    "CREATE_INVITATION",
    "ACCEPT_INVITATION",
  ]),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

auditApp.post("/log", async (c) => {
  const organizationId = getOrganizationId(c);
  const userId = getUserId(c);
  const body = await c.req.json();
  const parsed = logSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid audit log data" }, 400);
  }

  const { action, entityType, entityId, metadata } = parsed.data;

  // Get IP and user agent from request
  const ipAddress = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const userAgent = c.req.header("user-agent") || "unknown";

  await db.insert(auditLog).values({
    id: crypto.randomUUID(),
    organizationId,
    userId,
    action,
    entityType: entityType || null,
    entityId: entityId || null,
    metadata: metadata || null,
    ipAddress,
    userAgent,
  });

  return c.json({ success: true });
});

// GET /api/audit/logs - Fetch audit logs
const logsQuerySchema = z.object({
  action: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().default(50),
  offset: z.coerce.number().default(0),
});

auditApp.get("/logs", async (c) => {
  const organizationId = getOrganizationId(c);
  const query = logsQuerySchema.safeParse(
    Object.fromEntries(new URLSearchParams(c.req.url.split("?")[1] || "").entries()),
  );

  if (!query.success) {
    return c.json({ error: "Invalid query parameters" }, 400);
  }

  const { action, startDate, endDate, limit, offset } = query.data;

  const whereConditions = [eq(auditLog.organizationId, organizationId)];

  if (action) {
    whereConditions.push(eq(auditLog.action, action));
  }
  if (startDate) {
    whereConditions.push(gte(auditLog.createdAt, new Date(startDate)));
  }
  if (endDate) {
    whereConditions.push(lte(auditLog.createdAt, new Date(endDate)));
  }

  const logs = await db.query.auditLog.findMany({
    where: and(...whereConditions),
    orderBy: [desc(auditLog.createdAt)],
    limit,
    offset,
    with: {
      user: { columns: { name: true, email: true } },
    },
  });

  const total = await db.$count(auditLog, and(...whereConditions));

  return c.json({
    logs: logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userName: log.user?.name || "Unknown",
      userEmail: log.user?.email || "unknown@example.com",
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
    })),
    total,
    limit,
    offset,
  });
});

export default auditApp;
