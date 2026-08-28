import { db } from "@sahabatkreator/db";
import { member, organization, post, socialAccount, subscription } from "@sahabatkreator/db/schema";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId, getUserId } from "../lib/context";

const orgApp = new Hono();

orgApp.use("/*", requireAuth);

// GET /api/organization/info
orgApp.get("/info", async (c) => {
  const organizationId = getOrganizationId(c);
  const userId = getUserId(c);

  // Get organization details
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
    with: {
      members: {
        where: eq(member.userId, userId),
        columns: { role: true },
      },
      subscription: {
        orderBy: [subscription.createdAt],
        limit: 1,
        columns: { planId: true, status: true, currentPeriodEnd: true },
      },
    },
  });

  if (!org) {
    return c.json({ error: "Organization not found" }, 404);
  }

  // Get usage stats
  const memberCount = await db.$count(member, eq(member.organizationId, organizationId));
  const postCount = await db.$count(post, eq(post.organizationId, organizationId));
  const accountCount = await db.$count(
    socialAccount,
    eq(socialAccount.organizationId, organizationId),
  );

  const userMember = org.members[0];

  return c.json({
    id: org.id,
    name: org.name,
    slug: org.slug,
    logo: org.logo,
    planId: org.tier,
    memberRole: userMember?.role || null,
    isOwner: userMember?.role === "OWNER",
    isEditor: userMember?.role === "ADMIN" || userMember?.role === "MEMBER",
    isViewer: userMember?.role === "VIEWER",
    stats: {
      members: memberCount,
      posts: postCount,
      accounts: accountCount,
    },
  });
});

export default orgApp;
