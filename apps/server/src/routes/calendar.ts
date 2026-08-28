import { db } from "@sahabatkreator/db";
import { calendarNote, post } from "@sahabatkreator/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";

const calendarApp = new Hono();

calendarApp.use("/*", requireAuth);

calendarApp.get("/events", async (c) => {
  const organizationId = getOrganizationId(c);
  const start = c.req.query("start");
  const end = c.req.query("end");

  if (!start || !end) return c.json({ error: "start and end query params required" }, 400);

  const [posts, notes] = await Promise.all([
    db.query.post.findMany({
      where: and(
        eq(post.organizationId, organizationId),
        gte(post.scheduledAt, new Date(start)),
        lte(post.scheduledAt, new Date(end)),
      ),
      orderBy: [desc(post.scheduledAt)],
      with: { socialAccount: { columns: { platform: true, name: true } } },
    }),
    db.query.calendarNote.findMany({
      where: and(
        eq(calendarNote.organizationId, organizationId),
        gte(calendarNote.date, new Date(start)),
        lte(calendarNote.date, new Date(end)),
      ),
      orderBy: [desc(calendarNote.date)],
    }),
  ]);

  return c.json({ posts, notes });
});

const createNoteSchema = z.object({ content: z.string().min(1), date: z.string().datetime() });

calendarApp.post("/notes", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = createNoteSchema.safeParse(body);

  if (!parsed.success) {
    const err = parsed.error.message;
    return c.json({ error: err }, 400);
  }

  const [note] = await db
    .insert(calendarNote)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      content: parsed.data.content,
      date: new Date(parsed.data.date),
    })
    .returning();

  return c.json({ note }, 201);
});

calendarApp.patch("/notes/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const noteId = c.req.param("id");
  const body = await c.req.json();

  const existing = await db.query.calendarNote.findFirst({
    where: and(eq(calendarNote.id, noteId), eq(calendarNote.organizationId, organizationId)),
  });

  if (!existing) return c.json({ error: "Note not found" }, 404);

  const [updated] = await db
    .update(calendarNote)
    .set({
      content: body.content ?? existing.content,
      date: body.date ? new Date(body.date) : existing.date,
    })
    .where(eq(calendarNote.id, noteId))
    .returning();

  return c.json({ note: updated });
});

calendarApp.delete("/notes/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const noteId = c.req.param("id");

  const existing = await db.query.calendarNote.findFirst({
    where: and(eq(calendarNote.id, noteId), eq(calendarNote.organizationId, organizationId)),
  });

  if (!existing) return c.json({ error: "Note not found" }, 404);

  await db.delete(calendarNote).where(eq(calendarNote.id, noteId));
  return c.json({ success: true });
});

const quickAddSchema = z.object({
  caption: z.string().optional(),
  scheduledAt: z.string().datetime(),
  socialAccountId: z.string().optional(),
  postType: z.enum(["POST", "STORY", "REEL"]).optional(),
});

calendarApp.post("/quick-add", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = quickAddSchema.safeParse(body);

  if (!parsed.success) {
    const err = parsed.error.message;
    return c.json({ error: err }, 400);
  }

  const [newPost] = await db
    .insert(post)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      caption: parsed.data.caption ?? "",
      postType: parsed.data.postType ?? "POST",
      status: "SCHEDULED",
      socialAccountId: parsed.data.socialAccountId ?? null,
      scheduledAt: new Date(parsed.data.scheduledAt),
      autoPublish: false,
    })
    .returning();

  return c.json({ post: newPost }, 201);
});

export default calendarApp;
