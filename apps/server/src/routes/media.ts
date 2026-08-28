import { db } from "@sahabatkreator/db";
import { media, postMedia } from "@sahabatkreator/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";
import { deleteFile, getDownloadUrl, getPublicUrl, getUploadUrl } from "../lib/storage";

const mediaApp = new Hono();

mediaApp.use("/*", requireAuth);

// ── GET /api/media — list media
mediaApp.get("/", async (c) => {
  const organizationId = getOrganizationId(c);
  const limit = Number.parseInt(c.req.query("limit") || "50", 10);
  const offset = Number.parseInt(c.req.query("offset") || "0", 10);

  const items = await db.query.media.findMany({
    where: eq(media.organizationId, organizationId),
    orderBy: [desc(media.createdAt)],
    limit,
    offset,
  });

  return c.json({ media: items });
});

// ── GET /api/media/presigned — generate upload URL
const presignedSchema = z.object({
  fileName: z.string(),
  mimeType: z.string(),
  size: z.number().optional(),
});

mediaApp.get("/presigned", async (c) => {
  const organizationId = getOrganizationId(c);
  const { searchParams } = new URL(c.req.url);
  const fileName = searchParams.get("fileName") ?? "";
  const mimeType = searchParams.get("mimeType") ?? "application/octet-stream";
  const size = searchParams.get("size");

  const parsed = presignedSchema.safeParse({
    fileName,
    mimeType,
    size: size ? Number(size) : undefined,
  });
  if (!parsed.success) {
    return c.json({ error: "Invalid presigned request" }, 400);
  }

  // Generate unique key: orgId/filename-uuid.ext
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const uniqueName = `${organizationId}/${crypto.randomUUID()}.${ext}`;

  const uploadUrl = await getUploadUrl(uniqueName, {
    contentType: mimeType,
    expiresIn: 3600, // 1 hour
  });

  // Also generate a download URL for later use
  const downloadUrl = await getDownloadUrl(uniqueName, {
    expiresIn: 86400, // 24 hours
  });

  const publicUrl = getPublicUrl(uniqueName);

  return c.json({
    uploadUrl,
    downloadUrl,
    publicUrl,
    key: uniqueName,
  });
});

// ── POST /api/media — register media after upload
const uploadSchema = z.object({
  url: z.string().url(),
  mimeType: z.string(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  thumbnailUrl: z.string().url().optional(),
  r2Key: z.string().optional(),
});

mediaApp.post("/", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = uploadSchema.safeParse(body);

  if (!parsed.success) {
    const err = parsed.error.message;
    return c.json({ error: err }, 400);
  }

  const [newMedia] = await db
    .insert(media)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      url: parsed.data.url,
      mimeType: parsed.data.mimeType,
      fileName: parsed.data.fileName ?? null,
      fileSize: parsed.data.fileSize ?? null,
      width: parsed.data.width ?? null,
      height: parsed.data.height ?? null,
      thumbnailUrl: parsed.data.thumbnailUrl ?? null,
      r2Key: parsed.data.r2Key ?? null,
    })
    .returning();

  return c.json({ media: newMedia }, 201);
});

// ── DELETE /api/media/:id — delete media (also from R2)
mediaApp.delete("/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const mediaId = c.req.param("id");

  const existing = await db.query.media.findFirst({
    where: and(eq(media.id, mediaId), eq(media.organizationId, organizationId)),
  });

  if (!existing) return c.json({ error: "Media not found" }, 404);

  const usageCount = await db.$count(postMedia, eq(postMedia.mediaId, mediaId));
  if (usageCount > 0) {
    return c.json({ error: "Media is used in posts. Remove from posts first." }, 400);
  }

  // Delete from R2 if key exists
  if (existing.r2Key) {
    try {
      await deleteFile(existing.r2Key);
    } catch (err) {
      console.error("[Media] Failed to delete from R2:", err);
      // Continue with DB delete even if R2 delete fails
    }
  }

  await db.delete(media).where(eq(media.id, mediaId));
  return c.json({ success: true });
});

export default mediaApp;
