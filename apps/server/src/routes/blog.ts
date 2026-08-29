import { db } from "@sahabatkreator/db";
import { blogComment, blogPost } from "@sahabatkreator/db/schema";
import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import type { Context } from "hono";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";

const blogApp = new Hono();
blogApp.use("/*", requireAuth);

// ── Schema Definitions ──────────────────────────────────────────────
const createBlogSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  excerpt: z.string().max(500).optional(),
  body: z.string().min(1),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(300).optional(),
  metaKeywords: z.string().optional(),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  ogImage: z.string().url().optional().or(z.literal("")),
  twitterCard: z.enum(["summary", "summary_large_image"]).optional(),
  structuredData: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"]).optional(),
  scheduledAt: z.string().datetime().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

const updateBlogSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
  excerpt: z.string().max(500).optional(),
  body: z.string().min(1).optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(300).optional(),
  metaKeywords: z.string().optional(),
  canonicalUrl: z.string().url().optional().or(z.literal("")),
  ogImage: z.string().url().optional().or(z.literal("")),
  twitterCard: z.enum(["summary", "summary_large_image"]).optional(),
  structuredData: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"]).optional(),
  publishedAt: z.string().datetime().optional(),
  scheduledAt: z.string().datetime().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

const commentSchema = z.object({
  authorName: z.string().min(1).max(100),
  authorEmail: z.string().email().optional().or(z.literal("")),
  authorUrl: z.string().url().optional().or(z.literal("")),
  content: z.string().min(1),
  parentId: z.string().optional(),
});

// ── Helper: Calculate reading time & word count ─────────────────────
function calculateReadingTime(text: string): { minutes: number; words: number } {
  const words = text.trim().split(/\s+/).length;
  return { words, minutes: Math.max(1, Math.ceil(words / 200)) };
}

// ── Helper: Generate ID ─────────────────────────────────────────────
function generateId(): string {
  const cryptoObj = globalThis.crypto as { randomUUID?: () => string };
  if (cryptoObj.randomUUID) {
    return cryptoObj.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ── Helper: Ensure slug uniqueness ──────────────────────────────────
async function ensureUniqueSlug(baseSlug: string, organizationId: string): Promise<string> {
  let slug = baseSlug
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
  let count = 1;
  const existing = await db
    .select({ id: blogPost.id })
    .from(blogPost)
    .where(and(eq(blogPost.slug, slug), eq(blogPost.organizationId, organizationId)));

  if (existing.length > 0) {
    const base = baseSlug
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    slug = `${base}-${count}`;
    while (true) {
      const check = await db
        .select({ id: blogPost.id })
        .from(blogPost)
        .where(and(eq(blogPost.slug, slug), eq(blogPost.organizationId, organizationId)));
      if (check.length === 0) break;
      count++;
      slug = `${base}-${count}`;
    }
  }
  return slug;
}

// ── GET /api/blog — List blog posts ─────────────────────────────────
blogApp.get("/", async (c) => {
  const ctx = c as unknown as Context;
  const organizationId = getOrganizationId(ctx);
  const status = c.req.query("status");
  const search = c.req.query("search");
  const limit = Number.parseInt(c.req.query("limit") || "20", 10);
  const offset = Number.parseInt(c.req.query("offset") || "0", 10);

  // Build where conditions
  const conditions: Array<ReturnType<typeof eq> | ReturnType<typeof like>> = [
    eq(blogPost.organizationId, organizationId),
  ];

  if (status) {
    conditions.push(eq(blogPost.status, status));
  }
  if (search) {
    const searchCondition = or(
      like(blogPost.title, `%${search}%`),
      like(blogPost.excerpt, `%${search}%`),
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  const posts = await db
    .select()
    .from(blogPost)
    .where(and(...conditions))
    .orderBy((t) => desc(t.publishedAt || t.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(blogPost)
    .where(and(...conditions));

  return c.json({
    posts: posts.map((p) => ({
      ...p,
      readingTimeMinutes: p.readingTimeMinutes ?? 0,
      wordCount: p.wordCount ?? 0,
    })),
    pagination: {
      page: Math.floor(offset / limit) + 1,
      limit,
      total: Number(totalResult?.count ?? 0),
      totalPages: Math.ceil(Number(totalResult?.count ?? 0) / limit),
    },
  });
});

// ── GET /api/blog/public — Public blog listing (no auth) ───────────
blogApp.get("/public", async (c) => {
  const limit = Number.parseInt(c.req.query("limit") || "12", 10);
  const offset = Number.parseInt(c.req.query("offset") || "0", 10);

  // Use a subquery for the date comparison to avoid type issues
  const now = new Date();
  const publishedCondition = and(
    eq(blogPost.status, "PUBLISHED"),
    sql`EXISTS (SELECT 1 WHERE ${blogPost.publishedAt} IS NOT NULL AND ${blogPost.publishedAt} <= ${now})`!,
  );

  const posts = await db
    .select()
    .from(blogPost)
    .where(publishedCondition)
    .orderBy(desc(blogPost.publishedAt))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(blogPost)
    .where(publishedCondition);

  return c.json({
    posts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      ogImage: p.ogImage,
      publishedAt: p.publishedAt?.toISOString(),
      readingTimeMinutes: p.readingTimeMinutes,
      tags: p.tags,
      categories: p.categories,
    })),
    pagination: {
      page: Math.floor(offset / limit) + 1,
      limit,
      total: Number(totalResult?.count ?? 0),
      totalPages: Math.ceil(Number(totalResult?.count ?? 0) / limit),
    },
  });
});

// ── GET /api/blog/:slug — Get single blog post ───────────��──────────
blogApp.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const ctx = c as unknown as Context;
  const organizationId = getOrganizationId(ctx);

  const [post] = await db
    .select()
    .from(blogPost)
    .where(and(eq(blogPost.slug, slug), eq(blogPost.organizationId, organizationId)));

  if (!post) return c.json({ error: "Post not found" }, 404);

  // Increment view count
  await db
    .update(blogPost)
    .set({ viewCount: sql`${blogPost.viewCount} + 1` })
    .where(eq(blogPost.id, post.id));

  const comments = await db
    .select()
    .from(blogComment)
    .where(
      and(
        eq(blogComment.postId, post.id),
        eq(blogComment.isApproved, true),
        eq(blogComment.isSpam, false),
      ),
    )
    .orderBy(asc(blogComment.createdAt));

  return c.json({
    post: {
      ...post,
      readingTimeMinutes: post.readingTimeMinutes ?? 0,
      wordCount: post.wordCount ?? 0,
    },
    comments,
  });
});

// ── GET /api/blog/:slug/public — Public single post ────────────────
blogApp.get("/:slug/public", async (c) => {
  const slug = c.req.param("slug");
  const now = new Date();

  const [post] = await db
    .select()
    .from(blogPost)
    .where(
      and(
        eq(blogPost.slug, slug),
        eq(blogPost.status, "PUBLISHED"),
        sql`EXISTS (SELECT 1 WHERE ${blogPost.publishedAt} IS NOT NULL AND ${blogPost.publishedAt} <= ${now})`!,
      ),
    );

  if (!post) return c.json({ error: "Post not found" }, 404);

  // Increment view count
  await db
    .update(blogPost)
    .set({ viewCount: sql`${blogPost.viewCount} + 1` })
    .where(eq(blogPost.id, post.id));

  const comments = await db
    .select()
    .from(blogComment)
    .where(
      and(
        eq(blogComment.postId, post.id),
        eq(blogComment.isApproved, true),
        eq(blogComment.isSpam, false),
      ),
    )
    .orderBy(asc(blogComment.createdAt));

  return c.json({
    post: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      body: post.body,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      metaKeywords: post.metaKeywords,
      ogImage: post.ogImage,
      twitterCard: post.twitterCard,
      structuredData: post.structuredData,
      publishedAt: post.publishedAt?.toISOString(),
      readingTimeMinutes: post.readingTimeMinutes,
      wordCount: post.wordCount,
      tags: post.tags,
      categories: post.categories,
    },
    comments,
  });
});

// ── POST /api/blog — Create blog post ───────────────────────────────
blogApp.post("/", async (c) => {
  const ctx = c as unknown as Context;
  const organizationId = getOrganizationId(ctx);
  const body = await c.req.json();
  const parsed = createBlogSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const slug = parsed.data.slug || (await ensureUniqueSlug(parsed.data.title, organizationId));
  const { words, minutes } = calculateReadingTime(parsed.data.body);

  const [post] = await db
    .insert(blogPost)
    .values({
      id: generateId(),
      organizationId,
      title: parsed.data.title,
      slug,
      excerpt: parsed.data.excerpt ?? null,
      body: parsed.data.body,
      metaTitle: parsed.data.metaTitle ?? null,
      metaDescription: parsed.data.metaDescription ?? null,
      metaKeywords: parsed.data.metaKeywords ?? null,
      canonicalUrl: parsed.data.canonicalUrl ?? null,
      ogImage: parsed.data.ogImage ?? null,
      twitterCard: parsed.data.twitterCard ?? null,
      structuredData: parsed.data.structuredData ?? null,
      status: parsed.data.status ?? "DRAFT",
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
      categories: parsed.data.categories ?? [],
      tags: parsed.data.tags ?? [],
      readingTimeMinutes: minutes,
      wordCount: words,
    })
    .returning();

  return c.json({ post }, 201);
});

// ── PATCH /api/blog/:id — Update blog post ──────────────────────────
blogApp.patch("/:id", async (c) => {
  const ctx = c as unknown as Context;
  const organizationId = getOrganizationId(ctx);
  const postId = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateBlogSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  // Check if post exists
  const existing = await db
    .select({ id: blogPost.id })
    .from(blogPost)
    .where(and(eq(blogPost.id, postId), eq(blogPost.organizationId, organizationId)));

  if (!existing.length) return c.json({ error: "Post not found" }, 404);

  // Prepare update object - only include defined fields
  const updateData: Record<string, unknown> = {};

  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.slug !== undefined) updateData.slug = parsed.data.slug;
  if (parsed.data.excerpt !== undefined) updateData.excerpt = parsed.data.excerpt ?? null;
  if (parsed.data.body !== undefined) {
    updateData.body = parsed.data.body;
    const { words, minutes } = calculateReadingTime(parsed.data.body);
    updateData.wordCount = words;
    updateData.readingTimeMinutes = minutes;
  }
  if (parsed.data.metaTitle !== undefined) updateData.metaTitle = parsed.data.metaTitle ?? null;
  if (parsed.data.metaDescription !== undefined)
    updateData.metaDescription = parsed.data.metaDescription ?? null;
  if (parsed.data.metaKeywords !== undefined)
    updateData.metaKeywords = parsed.data.metaKeywords ?? null;
  if (parsed.data.canonicalUrl !== undefined)
    updateData.canonicalUrl = parsed.data.canonicalUrl ?? null;
  if (parsed.data.ogImage !== undefined) updateData.ogImage = parsed.data.ogImage ?? null;
  if (parsed.data.twitterCard !== undefined)
    updateData.twitterCard = parsed.data.twitterCard ?? null;
  if (parsed.data.structuredData !== undefined)
    updateData.structuredData = parsed.data.structuredData;
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.publishedAt !== undefined) {
    updateData.publishedAt = parsed.data.publishedAt ? new Date(parsed.data.publishedAt) : null;
  }
  if (parsed.data.scheduledAt !== undefined) {
    updateData.scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null;
  }
  if (parsed.data.categories !== undefined) updateData.categories = parsed.data.categories;
  if (parsed.data.tags !== undefined) updateData.tags = parsed.data.tags;

  const [updated] = await db
    .update(blogPost)
    .set(updateData)
    .where(eq(blogPost.id, postId))
    .returning();

  return c.json({ post: updated });
});

// ── DELETE /api/blog/:id — Delete blog post ─────────────────────────
blogApp.delete("/:id", async (c) => {
  const ctx = c as unknown as Context;
  const organizationId = getOrganizationId(ctx);
  const postId = c.req.param("id");

  const [deleted] = await db
    .delete(blogPost)
    .where(and(eq(blogPost.id, postId), eq(blogPost.organizationId, organizationId)))
    .returning();

  if (!deleted) return c.json({ error: "Post not found" }, 404);
  return c.json({ success: true });
});

// ── POST /api/blog/:id/comments — Add comment ───────────────────────
blogApp.post("/:id/comments", async (c) => {
  const ctx = c as unknown as Context;
  const organizationId = getOrganizationId(ctx);
  const postId = c.req.param("id");
  const body = await c.req.json();
  const parsed = commentSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  // Verify post exists
  const postExists = await db
    .select({ id: blogPost.id })
    .from(blogPost)
    .where(eq(blogPost.id, postId));

  if (!postExists.length) return c.json({ error: "Post not found" }, 404);

  const [comment] = await db
    .insert(blogComment)
    .values({
      id: generateId(),
      postId,
      organizationId,
      authorName: parsed.data.authorName,
      authorEmail: parsed.data.authorEmail ?? null,
      authorUrl: parsed.data.authorUrl ?? null,
      content: parsed.data.content,
      parentId: parsed.data.parentId ?? null,
      isApproved: false, // Moderation required
      isSpam: false,
    })
    .returning();

  // Update comment count
  await db
    .update(blogPost)
    .set({ commentCount: sql`${blogPost.commentCount} + 1` })
    .where(eq(blogPost.id, postId));

  return c.json({ comment }, 201);
});

// ── GET /api/blog/:id/comments — Get comments ───────────────────────
blogApp.get("/:id/comments", async (c) => {
  const ctx = c as unknown as Context;
  const organizationId = getOrganizationId(ctx);
  const postId = c.req.param("id");
  const approvedOnly = c.req.query("approved") === "true";

  const conditions: Array<ReturnType<typeof eq>> = [
    eq(blogComment.postId, postId),
    eq(blogComment.organizationId, organizationId),
    eq(blogComment.isSpam, false),
  ];

  if (approvedOnly) {
    conditions.push(eq(blogComment.isApproved, true));
  }

  const comments = await db
    .select()
    .from(blogComment)
    .where(and(...conditions))
    .orderBy(asc(blogComment.createdAt));

  return c.json({ comments });
});

// ── PATCH /api/blog/comments/:commentId — Update comment ────────────
blogApp.patch("/comments/:commentId", async (c) => {
  const ctx = c as unknown as Context;
  const organizationId = getOrganizationId(ctx);
  const commentId = c.req.param("commentId");
  const body = await c.req.json();

  const updateData: Record<string, unknown> = {};

  if (body.isApproved !== undefined) updateData.isApproved = body.isApproved;
  if (body.isSpam !== undefined) updateData.isSpam = body.isSpam;
  if (body.content !== undefined) updateData.content = body.content;

  if (Object.keys(updateData).length === 0) {
    return c.json({ error: "No valid fields to update" }, 400);
  }

  const [updated] = await db
    .update(blogComment)
    .set(updateData)
    .where(and(eq(blogComment.id, commentId), eq(blogComment.organizationId, organizationId)))
    .returning();

  if (!updated) return c.json({ error: "Comment not found" }, 404);
  return c.json({ comment: updated });
});

// ── DELETE /api/blog/comments/:commentId — Delete comment ───────────
blogApp.delete("/comments/:commentId", async (c) => {
  const ctx = c as unknown as Context;
  const organizationId = getOrganizationId(ctx);
  const commentId = c.req.param("commentId");

  const [deleted] = await db
    .delete(blogComment)
    .where(and(eq(blogComment.id, commentId), eq(blogComment.organizationId, organizationId)))
    .returning();

  if (!deleted) return c.json({ error: "Comment not found" }, 404);
  return c.json({ success: true });
});

// ── GET /api/blog/tags — Get all tags ───────────────────────────────
blogApp.get("/tags", async (c) => {
  const ctx = c as unknown as Context;
  const organizationId = getOrganizationId(ctx);

  const result = await db
    .select({ tags: blogPost.tags })
    .from(blogPost)
    .where(and(eq(blogPost.organizationId, organizationId), eq(blogPost.status, "PUBLISHED")));

  const allTags = new Set<string>();
  for (const row of result) {
    if (row.tags && Array.isArray(row.tags)) {
      row.tags.forEach((t) => allTags.add(t));
    }
  }

  return c.json({ tags: Array.from(allTags).sort() });
});

// ── GET /api/blog/categories — Get all categories ───────────────────
blogApp.get("/categories", async (c) => {
  const ctx = c as unknown as Context;
  const organizationId = getOrganizationId(ctx);

  const result = await db
    .select({ categories: blogPost.categories })
    .from(blogPost)
    .where(and(eq(blogPost.organizationId, organizationId), eq(blogPost.status, "PUBLISHED")));

  const allCategories = new Set<string>();
  for (const row of result) {
    if (row.categories && Array.isArray(row.categories)) {
      row.categories.forEach((cat) => allCategories.add(cat));
    }
  }

  return c.json({ categories: Array.from(allCategories).sort() });
});

export default blogApp;
