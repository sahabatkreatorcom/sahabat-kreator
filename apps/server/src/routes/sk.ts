import { db } from "@sahabatkreator/db";
import { skChatMessage, skChatSession } from "@sahabatkreator/db/schema";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import {
  chatWithSK,
  generateSKReport,
  getSKBrandKnowledge,
  getSKReports,
  getSKUsageLimits,
  updateSKBrandKnowledge,
} from "../lib/ai/sk-advisor";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId, getUserId } from "../lib/context";

const skApp = new Hono();

skApp.use("/*", requireAuth);

// ─── GET /api/sk/reports ───────────────────────────────────────────────────────
skApp.get("/reports", async (c) => {
  const organizationId = getOrganizationId(c);

  try {
    const reports = await getSKReports(organizationId);
    return c.json(reports);
  } catch (error) {
    console.error("[SK] Failed to fetch reports:", error);
    return c.json({ error: "Gagal memuat laporan SK" }, 500);
  }
});

// ─── POST /api/sk/report/generate ──────────────────────────────────────────────
const reportGenerateSchema = z.object({
  trigger: z.enum(["PROACTIVE", "MANUAL", "CHAT"]).default("MANUAL"),
  reportId: z.string().optional(),
});

skApp.post("/report/generate", async (c) => {
  const organizationId = getOrganizationId(c);
  const userId = getUserId(c);
  const body = reportGenerateSchema.safeParse(await c.req.json());

  if (!body.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  try {
    const report = await generateSKReport({
      organizationId,
      userId,
      trigger: body.data.trigger,
      reportId: body.data.reportId,
    });
    return c.json({ success: true, report });
  } catch (error) {
    console.error("[SK] Report generation failed:", error);
    return c.json({ error: "Gagal membuat laporan SK" }, 500);
  }
});

// ─── GET /api/sk/chat/sessions ─────────────────────────────────────────────────
skApp.get("/chat/sessions", async (c) => {
  const organizationId = getOrganizationId(c);

  const sessions = await db
    .select()
    .from(skChatSession)
    .where(eq(skChatSession.organizationId, organizationId))
    .orderBy(desc(skChatSession.updatedAt))
    .limit(20);

  return c.json(sessions);
});

// ─── POST /api/sk/chat ─────────────────────────────────────────────────────────
const chatSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(2).max(2000),
});

skApp.post("/chat", async (c) => {
  const organizationId = getOrganizationId(c);
  const userId = getUserId(c);
  const body = chatSchema.safeParse(await c.req.json());

  if (!body.success) {
    return c.json({ error: "Pesan minimal 2 karakter" }, 400);
  }

  try {
    const result = await chatWithSK({
      organizationId,
      userId,
      sessionId: body.data.sessionId,
      message: body.data.message,
    });
    return c.json(result);
  } catch (error) {
    console.error("[SK] Chat failed:", error);
    return c.json({ error: "Gagal memproses pesan SK" }, 500);
  }
});

// ─── GET /api/sk/chat/sessions/:id ───────────────────────────���─────────────────
skApp.get("/chat/sessions/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const sessionId = c.req.param("id");

  const [session] = await db
    .select()
    .from(skChatSession)
    .where(eq(skChatSession.id, sessionId))
    .limit(1);

  if (!session || session.organizationId !== organizationId) {
    return c.json({ error: "Session not found" }, 404);
  }

  const messages = await db
    .select()
    .from(skChatMessage)
    .where(eq(skChatMessage.sessionId, sessionId))
    .orderBy(skChatMessage.createdAt);

  return c.json({ session, messages });
});

// ─── DELETE /api/sk/chat/sessions/:id ──────────────────────────────────────────
skApp.delete("/chat/sessions/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const sessionId = c.req.param("id");

  const [session] = await db
    .select()
    .from(skChatSession)
    .where(eq(skChatSession.id, sessionId))
    .limit(1);

  if (!session || session.organizationId !== organizationId) {
    return c.json({ error: "Session not found" }, 404);
  }

  await db.delete(skChatMessage).where(eq(skChatMessage.sessionId, sessionId));
  await db.delete(skChatSession).where(eq(skChatSession.id, sessionId));

  return c.json({ success: true });
});

// ─── GET /api/sk/brand-knowledge ───────────────────────────────────────────────
skApp.get("/brand-knowledge", async (c) => {
  const organizationId = getOrganizationId(c);

  try {
    const knowledge = await getSKBrandKnowledge(organizationId);
    return c.json(knowledge || {});
  } catch (error) {
    console.error("[SK] Failed to fetch brand knowledge:", error);
    return c.json({ error: "Gagal memuat brand knowledge" }, 500);
  }
});

// ─── POST /api/sk/brand-knowledge ──────────────────────────────────────────────
const brandKnowledgeSchema = z.object({
  websiteUrl: z.string().url().optional(),
  audience: z.string().optional(),
  positioning: z.string().optional(),
  products: z.string().optional(),
  offers: z.string().optional(),
  voiceRules: z.string().optional(),
  bannedTopics: z.string().optional(),
});

skApp.post("/brand-knowledge", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = brandKnowledgeSchema.safeParse(await c.req.json());

  if (!body.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  try {
    const knowledge = await updateSKBrandKnowledge(organizationId, body.data);
    return c.json({ success: true, knowledge });
  } catch (error) {
    console.error("[SK] Failed to update brand knowledge:", error);
    return c.json({ error: "Gagal menyimpan brand knowledge" }, 500);
  }
});

// ─── GET /api/sk/usage-limits ──────────────────────────────────────────────────
skApp.get("/usage-limits", async (c) => {
  const limits = getSKUsageLimits();
  return c.json(limits);
});

export default skApp;
