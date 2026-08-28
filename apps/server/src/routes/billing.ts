import { auth } from "@sahabatkreator/auth";
import { db, schema } from "@sahabatkreator/db";
import {
  getOrganizationBillingInfo,
  getPlanLimits,
  getPlanPrice,
  sumopodService,
} from "@sahabatkreator/payment";
import { and, count, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

const billingApp = new Hono();

// ─── GET /api/billing/info ──────────────────────────────────────
billingApp.get("/info", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

  const orgId = (session.user as any).activeOrganizationId;
  if (!orgId) return c.json({ error: "No organization" }, 400);

  const billingInfo = await getOrganizationBillingInfo(orgId);

  // Check if SumoPod is configured
  const isConfigured = await sumopodService.isConfigured();

  return c.json({
    tier: billingInfo?.tier || "FREE",
    subscriptionStatus: billingInfo?.subscriptionStatus,
    cancelAtPeriodEnd: billingInfo?.cancelAtPeriodEnd || false,
    currentPeriodEnd: billingInfo?.currentPeriodEnd?.toISOString() || null,
    trialDays: billingInfo?.trialDays || 0,
    isConfigured,
  });
});

// ─── GET /api/billing/usage ─────────────────────────────────────
billingApp.get("/usage", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

  const orgId = (session.user as any).activeOrganizationId;
  if (!orgId) return c.json({ error: "No organization" }, 400);

  // Get org details to determine tier
  const org = await db.query.organization.findFirst({
    where: eq(schema.organization.id, orgId),
    columns: { tier: true },
  });

  const tier = org?.tier || "FREE";
  const limits = getPlanLimits(tier);

  // Count actual usage
  const [socialAccounts, members, scheduledPosts, aiPosts, competitors] = await Promise.all([
    db
      .select({ count: count() })
      .from(schema.socialAccount)
      .where(eq(schema.socialAccount.organizationId, orgId)),
    db
      .select({ count: count() })
      .from(schema.member)
      .where(eq(schema.member.organizationId, orgId)),
    db.select({ count: count() }).from(schema.post).where(eq(schema.post.organizationId, orgId)),
    db
      .select({ count: count() })
      .from(schema.post)
      .where(and(eq(schema.post.organizationId, orgId), eq(schema.post.isAiGenerated, true))),
    db
      .select({ count: count() })
      .from(schema.competitor)
      .where(eq(schema.competitor.organizationId, orgId)),
  ]);

  return c.json({
    socialAccounts: socialAccounts[0]?.count || 0,
    teamMembers: members[0]?.count || 0,
    scheduledPostsPerMonth: scheduledPosts[0]?.count || 0,
    aiGenerationsPerMonth: aiPosts[0]?.count || 0,
    competitorTracking: competitors[0]?.count || 0,
    limits,
    isUnlimited: tier === "ENTERPRISE",
  });
});

// ─── POST /api/billing/checkout ─────────────────────────────────
const checkoutSchema = z.object({
  planId: z.enum(["PRO", "BUSINESS", "ENTERPRISE"]),
});

billingApp.post("/checkout", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

  const body = checkoutSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Invalid request" }, 400);

  const orgId = (session.user as any).activeOrganizationId;
  if (!orgId) return c.json({ error: "No organization" }, 400);

  const planId = body.data.planId;

  // Enterprise requires contact sales
  if (planId === "ENTERPRISE") {
    return c.json({ error: "Enterprise requires contact sales" }, 400);
  }

  // Get price
  const amount = getPlanPrice(planId);
  if (amount === null || amount === undefined) {
    return c.json({ error: "Invalid plan price" }, 400);
  }

  // Fetch organization info
  const org = await db.query.organization.findFirst({
    where: eq(schema.organization.id, orgId),
    columns: { name: true, slug: true, tier: true },
  });

  if (!org) return c.json({ error: "Organization not found" }, 400);

  // Create payment via SumoPod
  const result = await sumopodService.createPayment({
    organizationId: orgId,
    amount,
    currency: "IDR",
    description: `Subscription ${planId} - ${org.name}`,
    customerName: session.user.name || undefined,
    customerEmail: session.user.email || undefined,
    metadata: {
      planId,
      orgSlug: org.slug,
      successReturnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      cancelReturnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    },
  });

  if (!result.success) {
    return c.json({ error: result.error || "Failed to create payment" }, 500);
  }

  return c.json({
    success: true,
    paymentId: result.paymentId,
    checkoutUrl: result.checkoutUrl,
  });
});

// ─── GET /api/billing/plans ─────────────────────────────────────
billingApp.get("/plans", async (c) => {
  const plans = [
    { id: "FREE", name: "Gratis", price: 0, description: "Mulai dengan yang dasar" },
    { id: "PRO", name: "Pro", price: 99000, description: "Untuk brand yang berkembang" },
    { id: "BUSINESS", name: "Business", price: 249000, description: "Untuk tim & agensi" },
    { id: "ENTERPRISE", name: "Enterprise", price: null, description: "Tak terbatas semuanya" },
  ];

  return c.json({ plans });
});

export default billingApp;
