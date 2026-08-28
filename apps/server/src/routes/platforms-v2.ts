import { db } from "@sahabatkreator/db";
import { socialAccount } from "@sahabatkreator/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";

const platformApp = new Hono();

platformApp.use("/*", requireAuth);

// ─── GET /api/platforms/accounts ─────────────────────────────────────────────────
platformApp.get("/accounts", async (c) => {
  const organizationId = getOrganizationId(c);

  const accounts = await db.query.socialAccount.findMany({
    where: eq(socialAccount.organizationId, organizationId),
    orderBy: [desc(socialAccount.createdAt)],
    columns: {
      id: true,
      platform: true,
      name: true,
      username: true,
      isActive: true,
      platformAccountId: true,
      accessToken: false,
      refreshToken: false,
      tokenExpiresAt: true,
      createdAt: true,
    },
  });

  return c.json({ accounts });
});

// ─── GET /api/platforms/cross-platform ───────────────────────────────────────────
platformApp.get("/cross-platform", async (c) => {
  const organizationId = getOrganizationId(c);

  const accounts = await db.query.socialAccount.findMany({
    where: and(eq(socialAccount.organizationId, organizationId), eq(socialAccount.isActive, true)),
    columns: {
      id: true,
      platform: true,
      name: true,
      username: true,
      platformAccountId: true,
    },
  });

  // Return placeholder data for now - actual platform analytics will be fetched from platform APIs
  return c.json({
    stats: {
      totalFollowers: 0,
      totalImpressions: 0,
      totalReach: 0,
      avgEngagementRate: 0,
      byPlatform: accounts.map((a) => ({
        platform: a.platform,
        followers: 0,
        impressions: 0,
        engagementRate: 0,
        name: a.name,
        username: a.username,
      })),
    },
  });
});

export default platformApp;
