import { auth } from "@sahabatkreator/auth";
import { db, schema } from "@sahabatkreator/db";
import { getPlanPrice, sumopodService } from "@sahabatkreator/payment";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

const paymentApp = new Hono();

// ─── POST /api/payment/checkout ──────────────────────────────────
const checkoutSchema = z.object({
  planId: z.enum(["PRO", "BUSINESS", "ENTERPRISE"]),
});

paymentApp.post("/checkout", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

  const orgId = (session.user as any).activeOrganizationId;
  if (!orgId) return c.json({ error: "No organization selected" }, 400);

  const body = checkoutSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: "Invalid request" }, 400);

  const planId = body.data.planId;

  // Enterprise requires contact sales
  if (planId === "ENTERPRISE") {
    return c.json({ error: "Enterprise requires contact sales" }, 400);
  }

  // Get price from billing module
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

// ─── POST /api/payment/webhook (public, no auth) ─────────────────
// Webhook endpoint harus publik - tidak menggunakan auth middleware
paymentApp.post("/webhook", async (c) => {
  const rawBody = await c.req.text();
  const headers = Object.fromEntries(c.req.raw.headers);

  // Verify signature
  const verified = await sumopodService.verifyWebhook(
    {
      "svix-id": headers["svix-id"],
      "svix-timestamp": headers["svix-timestamp"],
      "svix-signature": headers["svix-signature"],
      "x-webhook-token": headers["x-webhook-token"],
    },
    rawBody,
  );

  if (!verified) {
    console.error("[Webhook] Verification failed");
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Parse event
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  // Handle webhook
  await sumopodService.handleWebhook(event);

  return c.json({ ok: true });
});

// ─── GET /api/payment/info ───────────────────────────────────────
paymentApp.get("/info", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

  const orgId = (session.user as any).activeOrganizationId;
  if (!orgId) return c.json({ error: "No organization selected" }, 400);

  const org = await db.query.organization.findFirst({
    where: eq(schema.organization.id, orgId),
    columns: {
      tier: true,
      subscriptionStatus: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: true,
    },
  });

  if (!org) return c.json({ error: "Organization not found" }, 404);

  // Check if SumoPod is configured
  const isConfigured = await sumopodService.isConfigured();

  return c.json({
    tier: org.tier || "FREE",
    subscriptionStatus: org.subscriptionStatus || "none",
    cancelAtPeriodEnd: org.cancelAtPeriodEnd || false,
    currentPeriodEnd: org.currentPeriodEnd?.toISOString() || null,
    trialDays: 0,
    isConfigured,
  });
});

// ─── GET /api/payment/status/:paymentId ─────────────────────────
paymentApp.get("/status/:paymentId", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "Unauthorized" }, 401);

  const paymentId = c.req.param("paymentId");
  const result = await sumopodService.getPaymentStatus(paymentId);

  if (!result.success) {
    return c.json({ error: result.error || "Payment not found" }, 404);
  }

  return c.json({
    success: true,
    status: result.status,
    checkoutUrl: result.checkoutUrl,
  });
});

export default paymentApp;
