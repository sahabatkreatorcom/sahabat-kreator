import { db } from "@sahabatkreator/db";
import { competitor } from "@sahabatkreator/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";

const competitorsApp = new Hono();
competitorsApp.use("/*", requireAuth);

// GET /api/competitors
competitorsApp.get("/", async (c) => {
  const organizationId = getOrganizationId(c);

  const competitors = await db.query.competitor.findMany({
    where: eq(competitor.organizationId, organizationId),
    orderBy: [desc(competitor.createdAt)],
  });

  return c.json({ competitors });
});

// POST /api/competitors
const createSchema = z.object({
  name: z.string().min(1).max(100),
  platform: z.enum(["INSTAGRAM", "TIKTOK", "YOUTUBE", "FACEBOOK"]),
  platformHandle: z.string().min(1).max(100),
});

competitorsApp.post("/", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const [comp] = await db
    .insert(competitor)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      ...parsed.data,
    })
    .returning();

  return c.json({ competitor: comp }, 201);
});

// PATCH /api/competitors/:id
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  platform: z.enum(["INSTAGRAM", "TIKTOK", "YOUTUBE", "FACEBOOK"]).optional(),
  platformHandle: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
});

competitorsApp.patch("/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const competitorId = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const [updated] = await db
    .update(competitor)
    .set(parsed.data)
    .where(and(eq(competitor.id, competitorId), eq(competitor.organizationId, organizationId)))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json({ competitor: updated });
});

// DELETE /api/competitors/:id
competitorsApp.delete("/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const competitorId = c.req.param("id");

  const [deleted] = await db
    .delete(competitor)
    .where(and(eq(competitor.id, competitorId), eq(competitor.organizationId, organizationId)))
    .returning();

  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

export default competitorsApp;
