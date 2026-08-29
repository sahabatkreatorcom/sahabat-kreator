import { db } from "@sahabatkreator/db";
import { contentPillar, post } from "@sahabatkreator/db/schema";
import { and, count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";

const pillarsApp = new Hono();
pillarsApp.use("/*", requireAuth);

// GET /api/pillars
pillarsApp.get("/", async (c) => {
  const organizationId = getOrganizationId(c);

  const pillars = await db.query.contentPillar.findMany({
    where: eq(contentPillar.organizationId, organizationId),
    orderBy: [desc(contentPillar.createdAt)],
  });

  // Auto-compute postCount for each pillar
  const pillarsWithCounts = await Promise.all(
    pillars.map(async (pillar) => {
      const [result] = await db
        .select({ count: count() })
        .from(post)
        .where(and(eq(post.pillarId, pillar.id), eq(post.organizationId, organizationId)));
      return { ...pillar, postCount: result?.count ?? 0 };
    }),
  );

  return c.json({ pillars: pillarsWithCounts });
});

// POST /api/pillars
const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().max(20).optional(),
});

pillarsApp.post("/", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const [pillar] = await db
    .insert(contentPillar)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      ...parsed.data,
    })
    .returning();

  return c.json({ pillar }, 201);
});

// PATCH /api/pillars/:id
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
});

pillarsApp.patch("/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const pillarId = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const [updated] = await db
    .update(contentPillar)
    .set(parsed.data)
    .where(and(eq(contentPillar.id, pillarId), eq(contentPillar.organizationId, organizationId)))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json({ pillar: updated });
});

// DELETE /api/pillars/:id
pillarsApp.delete("/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const pillarId = c.req.param("id");

  const [deleted] = await db
    .delete(contentPillar)
    .where(and(eq(contentPillar.id, pillarId), eq(contentPillar.organizationId, organizationId)))
    .returning();

  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

export default pillarsApp;
