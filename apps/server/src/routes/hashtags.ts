import { Hono } from "hono";
import { z } from "zod";
import { db } from "@sahabatkreator/db";
import { hashtagCollection, post } from "@sahabatkreator/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";

const hashtagsApp = new Hono();
hashtagsApp.use("/*", requireAuth);

// GET /api/hashtags
hashtagsApp.get("/", async (c) => {
  const organizationId = getOrganizationId(c);
  const category = c.req.query("category");

  const where = category
    ? and(eq(hashtagCollection.organizationId, organizationId), eq(hashtagCollection.category, category))
    : eq(hashtagCollection.organizationId, organizationId);

  const collections = await db.query.hashtagCollection.findMany({
    where,
    orderBy: [desc(hashtagCollection.createdAt)],
  });

  // Auto-compute usageCount for each hashtag collection
  const collectionsWithCounts = await Promise.all(
    collections.map(async (collection) => {
      const [result] = await db
        .select({ count: count() })
        .from(post)
        .where(
          and(
            eq(post.organizationId, organizationId),
            sql`${post.hashtagIds} ? ${collection.id}::text`
          )
        );
      return { ...collection, usageCount: result?.count ?? 0 };
    }),
  );

  return c.json({ collections: collectionsWithCounts });
});

// POST /api/hashtags
const createSchema = z.object({
  name: z.string().min(1).max(100),
  hashtags: z.string().min(1),
  category: z.string().max(50).optional(),
});

hashtagsApp.post("/", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const [collection] = await db
    .insert(hashtagCollection)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      ...parsed.data,
    })
    .returning();

  return c.json({ collection }, 201);
});

// PATCH /api/hashtags/:id
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  hashtags: z.string().min(1).optional(),
  category: z.string().max(50).optional(),
});

hashtagsApp.patch("/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const collectionId = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const [updated] = await db
    .update(hashtagCollection)
    .set(parsed.data)
    .where(and(eq(hashtagCollection.id, collectionId), eq(hashtagCollection.organizationId, organizationId)))
    .returning();

  if (!updated) return c.json({ error: "Not found" }, 404);
  return c.json({ collection: updated });
});

// DELETE /api/hashtags/:id
hashtagsApp.delete("/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const collectionId = c.req.param("id");

  const [deleted] = await db
    .delete(hashtagCollection)
    .where(and(eq(hashtagCollection.id, collectionId), eq(hashtagCollection.organizationId, organizationId)))
    .returning();

  if (!deleted) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true });
});

export default hashtagsApp;
