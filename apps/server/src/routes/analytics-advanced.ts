import { db } from "@sahabatkreator/db";
import { engagementItem, post } from "@sahabatkreator/db/schema";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { env } from "@sahabatkreator/env/server";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";

const analyticsAdvancedApp = new Hono();

analyticsAdvancedApp.use("/*", requireAuth);

// GET /api/analytics-advanced/best-time
analyticsAdvancedApp.get("/best-time", async (c) => {
  const organizationId = getOrganizationId(c);
  const days = 90;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const postsByHour = await db
    .select({
      hour: sql<string>`EXTRACT(HOUR FROM ${post.createdAt})`.as("hour"),
      count: count(),
    })
    .from(post)
    .where(and(eq(post.organizationId, organizationId), gte(post.createdAt, since)))
    .groupBy(sql`EXTRACT(HOUR FROM ${post.createdAt})`)
    .orderBy(sql`count(*) DESC`)
    .limit(5);

  const postsByWeekday = await db
    .select({
      day: sql<string>`EXTRACT(DOW FROM ${post.createdAt})`.as("day"),
      count: count(),
    })
    .from(post)
    .where(and(eq(post.organizationId, organizationId), gte(post.createdAt, since)))
    .groupBy(sql`EXTRACT(DOW FROM ${post.createdAt})`)
    .orderBy(sql`count(*) DESC`)
    .limit(3);

  const weekdayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  return c.json({
    bestTime: {
      bestHours: postsByHour.map((h) => ({
        hour: Number(h.hour),
        label: `${String(h.hour).padStart(2, "0")}:00`,
        postCount: Number(h.count),
      })),
      bestDays: postsByWeekday.map((d) => ({
        day: Number(d.day),
        label: weekdayNames[Number(d.day)] || `Hari ${d.day}`,
        postCount: Number(d.count),
      })),
    },
  });
});

// GET /api/analytics-advanced/hashtag-performance
analyticsAdvancedApp.get("/hashtag-performance", async (c) => {
  const organizationId = getOrganizationId(c);

  const posts = await db.query.post.findMany({
    where: eq(post.organizationId, organizationId),
    columns: { hashtagIds: true, postType: true, status: true },
  });

  const hashtagStats: Record<
    string,
    { usage: number; usedInPosts: Record<string, number>; usedInStories: Record<string, number> }
  > = {};

  for (const p of posts) {
    if (!p.hashtagIds?.length) continue;
    for (const tag of p.hashtagIds) {
      if (!hashtagStats[tag]) {
        hashtagStats[tag] = { usage: 0, usedInPosts: {}, usedInStories: {} };
      }
      hashtagStats[tag].usage++;
      const typeKey = p.postType === "STORY" ? "usedInStories" : "usedInPosts";
      const typeVal = p.status === "PUBLISHED" ? "published" : "all";
      hashtagStats[tag][typeKey][typeVal] = (hashtagStats[tag][typeKey][typeVal] || 0) + 1;
    }
  }

  const result = Object.entries(hashtagStats)
    .map(([tag, stats]) => ({ hashtag: tag, ...stats }))
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 30);

  return c.json({ hashtags: result });
});

// POST /api/analytics-advanced/report/share
const shareReportSchema = z.object({
  title: z.string().min(1).max(200),
  organizationId: z.string(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
});

analyticsAdvancedApp.post("/report/share", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = shareReportSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const reportId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(post).values({
    id: reportId,
    organizationId,
    caption: JSON.stringify({
      title: parsed.data.title,
      dateRange: parsed.data.dateRange,
      organizationId: parsed.data.organizationId,
    }),
    postType: "POST",
    status: "PUBLISHED",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const baseUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const shareUrl = `${baseUrl}/share/report/${reportId}`;

  return c.json({ success: true, reportId, shareUrl, expiresAt: expiresAt.toISOString() });
});

// GET /api/analytics-advanced/report/:id
analyticsAdvancedApp.get("/report/:id", async (c) => {
  const reportId = c.req.param("id");

  const [report] = await db
    .select()
    .from(post)
    .where(eq(post.id, reportId))
    .limit(1);

  if (!report) return c.json({ error: "Report not found" }, 404);

  try {
    const data = JSON.parse(report.caption || "{}");
    return c.json({ reportId, data });
  } catch {
    return c.json({ error: "Invalid report format" }, 500);
  }
});

// POST /api/analytics-advanced/report/email
const emailReportSchema = z.object({
  reportId: z.string(),
  recipients: z.array(z.string().email()).min(1),
  message: z.string().optional(),
});

analyticsAdvancedApp.post("/report/email", async (c) => {
  const body = await c.req.json();
  const parsed = emailReportSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  // TODO: integrate with resend (env.RESEND_API_KEY)
  return c.json({
    success: true,
    message: "Email report scheduled",
    reportId: parsed.data.reportId,
    recipients: parsed.data.recipients,
  });
});

// GET /api/analytics-advanced/daily-snapshot
analyticsAdvancedApp.get("/daily-snapshot", async (c) => {
  const organizationId = getOrganizationId(c);
  const days = Number.parseInt(c.req.query("days") || "7", 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const totalPosts = await db
    .select({ count: count() })
    .from(post)
    .where(and(eq(post.organizationId, organizationId), gte(post.createdAt, since)));

  const publishedPosts = await db
    .select({ count: count() })
    .from(post)
    .where(and(eq(post.organizationId, organizationId), eq(post.status, "PUBLISHED"), gte(post.createdAt, since)));

  const engagementCount = await db
    .select({ count: count() })
    .from(engagementItem)
    .where(and(eq(engagementItem.organizationId, organizationId), gte(engagementItem.createdAt, since)));

  const positiveSentiment = await db
    .select({ count: count() })
    .from(engagementItem)
    .where(
      and(
        eq(engagementItem.organizationId, organizationId),
        eq(engagementItem.sentiment, "POSITIVE"),
        gte(engagementItem.createdAt, since),
      ),
    );

  return c.json({
    snapshot: {
      totalPosts: Number(totalPosts[0]?.count ?? 0),
      publishedPosts: Number(publishedPosts[0]?.count ?? 0),
      totalEngagements: Number(engagementCount[0]?.count ?? 0),
      positiveSentiment: Number(positiveSentiment[0]?.count ?? 0),
      days,
    },
  });
});

export default analyticsAdvancedApp;
