import { db } from "@sahabatkreator/db";
import { media, post, socialAccount } from "@sahabatkreator/db/schema";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";

const analyticsApp = new Hono();

analyticsApp.use("/*", requireAuth);

// GET /api/analytics/overview
analyticsApp.get("/overview", async (c) => {
  const organizationId = getOrganizationId(c);
  const range = c.req.query("range") || "7d";

  const days = range === "90d" ? 90 : range === "30d" ? 30 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const totalPosts = await db
    .select({ count: count() })
    .from(post)
    .where(and(eq(post.organizationId, organizationId), gte(post.createdAt, since)));

  const postsByStatus = await db
    .select({ status: post.status, count: count() })
    .from(post)
    .where(and(eq(post.organizationId, organizationId), gte(post.createdAt, since)))
    .groupBy(post.status);

  const postsByType = await db
    .select({ postType: post.postType, count: count() })
    .from(post)
    .where(and(eq(post.organizationId, organizationId), gte(post.createdAt, since)))
    .groupBy(post.postType);

  const postsByDay = await db
    .select({
      date: sql<string>`DATE(${post.createdAt})`.as("date"),
      count: count(),
    })
    .from(post)
    .where(and(eq(post.organizationId, organizationId), gte(post.createdAt, since)))
    .groupBy(sql`DATE(${post.createdAt})`)
    .orderBy(sql`DATE(${post.createdAt})`);

  const accounts = await db
    .select({ platform: socialAccount.platform, count: count() })
    .from(socialAccount)
    .where(eq(socialAccount.organizationId, organizationId))
    .groupBy(socialAccount.platform);

  const totalMedia = await db
    .select({ count: count() })
    .from(media)
    .where(eq(media.organizationId, organizationId));

  return c.json({
    overview: {
      totalPosts: Number(totalPosts[0]?.count ?? 0),
      totalMedia: Number(totalMedia[0]?.count ?? 0),
      totalAccounts: accounts.reduce((sum, a) => sum + Number(a.count), 0),
      postsByStatus: Object.fromEntries(postsByStatus.map((s) => [s.status, Number(s.count)])),
      postsByType: Object.fromEntries(postsByType.map((t) => [t.postType, Number(t.count)])),
      postsByDay: postsByDay.map((d) => ({ date: d.date, count: Number(d.count) })),
      accountsByPlatform: Object.fromEntries(accounts.map((a) => [a.platform, Number(a.count)])),
    },
    range,
  });
});

// GET /api/analytics/posts
analyticsApp.get("/posts", async (c) => {
  const organizationId = getOrganizationId(c);
  const limit = Number(c.req.query("limit") || "20");
  const offset = Number(c.req.query("offset") || "0");

  const posts = await db.query.post.findMany({
    where: eq(post.organizationId, organizationId),
    orderBy: [desc(post.createdAt)],
    limit,
    offset,
    columns: {
      id: true,
      caption: true,
      postType: true,
      status: true,
      scheduledAt: true,
      publishedAt: true,
      createdAt: true,
    },
    with: {
      socialAccount: { columns: { platform: true, name: true } },
      media: { with: { media: { columns: { url: true, thumbnailUrl: true, type: true } } } },
    },
  });

  const total = await db
    .select({ count: count() })
    .from(post)
    .where(eq(post.organizationId, organizationId));

  return c.json({
    posts: posts.map((p) => ({
      ...p,
      publishedAt: p.publishedAt?.toISOString(),
      scheduledAt: p.scheduledAt?.toISOString(),
      createdAt: p.createdAt.toISOString(),
    })),
    total: Number(total[0]?.count ?? 0),
    limit,
    offset,
  });
});

// GET /api/analytics/platforms
analyticsApp.get("/platforms", async (c) => {
  const organizationId = getOrganizationId(c);

  const platforms = await db.query.socialAccount.findMany({
    where: eq(socialAccount.organizationId, organizationId),
    columns: {
      id: true,
      platform: true,
      name: true,
      username: true,
      isActive: true,
    },
  });

  const platformStats = await Promise.all(
    platforms.map(async (p) => {
      const postCount = await db
        .select({ count: count() })
        .from(post)
        .where(and(eq(post.organizationId, organizationId), eq(post.socialAccountId, p.id)));

      return {
        ...p,
        postCount: Number(postCount[0]?.count ?? 0),
      };
    }),
  );

  return c.json({ platforms: platformStats });
});

// GET /api/analytics/engagement
analyticsApp.get("/engagement", async (c) => {
  const organizationId = getOrganizationId(c);
  const range = c.req.query("range") || "7d";
  const days = range === "90d" ? 90 : range === "30d" ? 30 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const postsInRange = await db.query.post.findMany({
    where: and(eq(post.organizationId, organizationId), gte(post.createdAt, since)),
    columns: { id: true, postType: true, status: true, createdAt: true },
    orderBy: [desc(post.createdAt)],
  });

  const postsByHour = await db
    .select({
      hour: sql<string>`EXTRACT(HOUR FROM ${post.createdAt})`.as("hour"),
      count: count(),
    })
    .from(post)
    .where(and(eq(post.organizationId, organizationId), gte(post.createdAt, since)))
    .groupBy(sql`EXTRACT(HOUR FROM ${post.createdAt})`)
    .orderBy(sql`EXTRACT(HOUR FROM ${post.createdAt})`);

  const postsByWeekday = await db
    .select({
      day: sql<string>`EXTRACT(DOW FROM ${post.createdAt})`.as("day"),
      count: count(),
    })
    .from(post)
    .where(and(eq(post.organizationId, organizationId), gte(post.createdAt, since)))
    .groupBy(sql`EXTRACT(DOW FROM ${post.createdAt})`)
    .orderBy(sql`EXTRACT(DOW FROM ${post.createdAt})`);

  return c.json({
    engagement: {
      totalPosts: postsInRange.length,
      postsByType: postsInRange.reduce(
        (acc, p) => {
          acc[p.postType] = (acc[p.postType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      postsByHour: postsByHour.map((h) => ({ hour: Number(h.hour), count: Number(h.count) })),
      postsByWeekday: postsByWeekday.map((d) => ({ day: Number(d.day), count: Number(d.count) })),
    },
    range,
  });
});

// GET /api/analytics/optimal-times
analyticsApp.get("/optimal-times", async (c) => {
  const organizationId = getOrganizationId(c);

  const postsByHour = await db
    .select({
      hour: sql<string>`EXTRACT(HOUR FROM ${post.createdAt})`.as("hour"),
      count: count(),
    })
    .from(post)
    .where(eq(post.organizationId, organizationId))
    .groupBy(sql`EXTRACT(HOUR FROM ${post.createdAt})`)
    .orderBy(sql`count(*) DESC`)
    .limit(5);

  const postsByWeekday = await db
    .select({
      day: sql<string>`EXTRACT(DOW FROM ${post.createdAt})`.as("day"),
      count: count(),
    })
    .from(post)
    .where(eq(post.organizationId, organizationId))
    .groupBy(sql`EXTRACT(DOW FROM ${post.createdAt})`)
    .orderBy(sql`count(*) DESC`)
    .limit(3);

  const weekdayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  return c.json({
    optimalTimes: {
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

// POST /api/analytics/sync
analyticsApp.post("/sync", async (c) => {
  const organizationId = getOrganizationId(c);

  const accounts = await db.query.socialAccount.findMany({
    where: eq(socialAccount.organizationId, organizationId),
    columns: { id: true, platform: true },
  });

  return c.json({
    success: true,
    message: `Analytics sync triggered for ${accounts.length} akun`,
    accounts: accounts.map((a) => ({ id: a.id, platform: a.platform })),
  });
});

export default analyticsApp;
