import { db } from "@sahabatkreator/db";
import { webhookLog } from "@sahabatkreator/db/schema";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";

const logApp = new Hono();
logApp.use("/*", requireAuth);

// ─── GET /api/webhooks/logs ──────────────────────────────────────
logApp.get("/logs", async (c) => {
  const organizationId = getOrganizationId(c);
  const platform = c.req.query("platform");
  const status = c.req.query("status");
  const limit = Math.min(Number.parseInt(c.req.query("limit") || "50", 10), 100);

  const conditions = [eq(webhookLog.organizationId, organizationId)];
  if (platform) conditions.push(eq(webhookLog.platform, platform as any));
  if (status) conditions.push(eq(webhookLog.status, status as any));

  const logs = await db
    .select()
    .from(webhookLog)
    .where(conditions as any)
    .orderBy(desc(webhookLog.createdAt))
    .limit(limit);

  return c.json({ logs });
});

// ─── GET /api/webhooks/logs/:id ──────────────────────────────────
logApp.get("/logs/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const logId = c.req.param("id");

  const [log] = await db.select().from(webhookLog).where(eq(webhookLog.id, logId)).limit(1);

  if (!log || log.organizationId !== organizationId) {
    return c.json({ error: "Log not found" }, 404);
  }

  return c.json({ log });
});

export default logApp;
