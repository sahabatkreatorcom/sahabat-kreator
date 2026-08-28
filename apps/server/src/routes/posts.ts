import { db } from "@sahabatkreator/db";
import { post, postMedia } from "@sahabatkreator/db/schema";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";

const postsApp = new Hono();

postsApp.use("/*", requireAuth);

postsApp.get("/", async (c) => {
  const organizationId = getOrganizationId(c);
  const status = c.req.query("status");
  const limit = Number.parseInt(c.req.query("limit") || "50", 10);
  const offset = Number.parseInt(c.req.query("offset") || "0", 10);

  const where = status
    ? and(eq(post.organizationId, organizationId), eq(post.status, status as "DRAFT" | "SCHEDULED" | "PUBLISHING" | "PUBLISHED" | "FAILED" | "ARCHIVED"))
    : eq(post.organizationId, organizationId);

  const posts = await db.query.post.findMany({
    where,
    orderBy: [desc(post.createdAt)],
    limit,
    offset,
    with: {
      socialAccount: { columns: { platform: true, name: true } },
      media: {
        with: { media: { columns: { url: true, thumbnailUrl: true, mimeType: true } } },
        orderBy: [asc(postMedia.sortOrder)],
      },
    },
  });

  return c.json({ posts });
});

postsApp.get("/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const postId = c.req.param("id");

  const found = await db.query.post.findFirst({
    where: and(eq(post.id, postId), eq(post.organizationId, organizationId)),
    with: {
      socialAccount: { columns: { platform: true, name: true, id: true } },
      media: { with: { media: true }, orderBy: [asc(postMedia.sortOrder)] },
    },
  });

  if (!found) return c.json({ error: "Post not found" }, 404);
  return c.json({ post: found });
});

const createPostSchema = z.object({
  caption: z.string().optional(),
  postType: z.enum(["POST", "STORY", "REEL", "CAROUSEL"]).optional(),
  socialAccountId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  autoPublish: z.boolean().optional(),
  mediaIds: z.array(z.string()).optional(),
  pillarId: z.string().nullable().optional(),
  hashtagIds: z.array(z.string()).optional(),
});

postsApp.post("/", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = createPostSchema.safeParse(body);

  if (!parsed.success) {
    const err = parsed.error.message;
    return c.json({ error: err }, 400);
  }

  const { caption, postType, socialAccountId, scheduledAt, autoPublish, mediaIds, pillarId, hashtagIds } = parsed.data;

  const returned = await db
    .insert(post)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      caption: caption || "",
      postType: postType || "POST",
      status: scheduledAt ? "SCHEDULED" : "DRAFT",
      socialAccountId: socialAccountId || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      autoPublish: autoPublish ?? true,
      pillarId: pillarId || null,
      hashtagIds: hashtagIds || [],
    })
    .returning();

  const newPost = returned[0];
  if (!newPost) return c.json({ error: "Failed to create post" }, 500);

  if (mediaIds?.length) {
    await db.insert(postMedia).values(
      mediaIds.map((mediaId, i) => ({
        id: crypto.randomUUID(),
        postId: newPost.id,
        mediaId,
        sortOrder: i,
      })),
    );
  }

  return c.json({ post: newPost }, 201);
});

const updatePostSchema = z.object({
  caption: z.string().optional(),
  postType: z.enum(["POST", "STORY", "REEL", "CAROUSEL"]).optional(),
  socialAccountId: z.string().nullable().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  autoPublish: z.boolean().optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"]).optional(),
  mediaIds: z.array(z.string()).optional(),
  pillarId: z.string().nullable().optional(),
  hashtagIds: z.array(z.string()).optional(),
});

postsApp.patch("/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const postId = c.req.param("id");
  const body = await c.req.json();
  const parsed = updatePostSchema.safeParse(body);

  if (!parsed.success) {
    const err = parsed.error.message;
    return c.json({ error: err }, 400);
  }

  const existing = await db.query.post.findFirst({
    where: and(eq(post.id, postId), eq(post.organizationId, organizationId)),
  });

  if (!existing) return c.json({ error: "Post not found" }, 404);

  const { mediaIds, pillarId, hashtagIds, ...updateData } = parsed.data;

  const [updated] = await db
    .update(post)
    .set({
      ...updateData,
      scheduledAt: updateData.scheduledAt
        ? new Date(updateData.scheduledAt)
        : updateData.scheduledAt === null
          ? null
          : undefined,
      pillarId: pillarId !== undefined ? pillarId : undefined,
      hashtagIds: hashtagIds !== undefined ? hashtagIds : undefined,
    })
    .where(eq(post.id, postId))
    .returning();

  if (mediaIds !== undefined) {
    await db.delete(postMedia).where(eq(postMedia.postId, postId));
    if (mediaIds.length > 0) {
      await db.insert(postMedia).values(
        mediaIds.map((mediaId, i) => ({
          id: crypto.randomUUID(),
          postId,
          mediaId,
          sortOrder: i,
        })),
      );
    }
  }

  return c.json({ post: updated });
});

postsApp.delete("/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const postId = c.req.param("id");

  const existing = await db.query.post.findFirst({
    where: and(eq(post.id, postId), eq(post.organizationId, organizationId)),
  });

  if (!existing) return c.json({ error: "Post not found" }, 404);

  await db.delete(postMedia).where(eq(postMedia.postId, postId));
  await db.delete(post).where(eq(post.id, postId));

  return c.json({ success: true });
});

postsApp.get("/calendar/:start/:end", async (c) => {
  const organizationId = getOrganizationId(c);
  const start = c.req.param("start");
  const end = c.req.param("end");

  const posts = await db.query.post.findMany({
    where: and(
      eq(post.organizationId, organizationId),
      gte(post.scheduledAt, new Date(start)),
      lte(post.scheduledAt, new Date(end)),
    ),
    orderBy: [desc(post.scheduledAt)],
    with: {
      socialAccount: { columns: { platform: true, name: true } },
      media: { with: { media: { columns: { url: true, thumbnailUrl: true, mimeType: true } } } },
    },
  });

  return c.json({ posts });
});

export default postsApp;
