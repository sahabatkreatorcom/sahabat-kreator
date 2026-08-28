import { db } from "@sahabatkreator/db";
import { globalPlatformCredential, user } from "@sahabatkreator/db/schema";
import { eq, desc } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getUserId } from "../lib/context";

const platformCredentialsApp = new Hono();

platformCredentialsApp.use("/*", requireAuth);
platformCredentialsApp.use("/*", async (c, next) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  
  // Check if user is super admin
  const [userRow] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (userRow?.role !== "superadmin") {
    return c.json({ error: "Forbidden: Super admin only" }, 403);
  }
  await next();
});

// ─── GET /api/admin/platform-credentials ──────────────────────────────────────
platformCredentialsApp.get("/", async (c) => {
  const credentials = await db.query.globalPlatformCredential.findMany({
    orderBy: [desc(globalPlatformCredential.platform)],
  });

  return c.json({ credentials });
});

// ─── PUT /api/admin/platform-credentials ──────────────────────────────────────
const credentialSchema = z.object({
  platform: z.enum(["INSTAGRAM", "FACEBOOK", "TIKTOK", "YOUTUBE", "PINTEREST", "LINKEDIN", "BLUESKY", "THREADS", "GOOGLE_BUSINESS"]),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1).optional(),
  redirectUri: z.string().url().optional(),
  webhookVerifyToken: z.string().optional(),
  isConfigured: z.boolean().default(true),
});

platformCredentialsApp.put("/", async (c) => {
  const body = await c.req.json();
  const parsed = credentialSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400);
  }

  const { platform, clientId, clientSecret, redirectUri, webhookVerifyToken, isConfigured } = parsed.data;

  // If no secret provided, keep existing
  const existing = await db.query.globalPlatformCredential.findFirst({
    where: eq(globalPlatformCredential.platform, platform),
  });

  const effectiveSecret = clientSecret || existing?.clientSecret || "";

  const [credential] = await db
    .insert(globalPlatformCredential)
    .values({
      id: existing?.id || crypto.randomUUID(),
      platform,
      clientId,
      clientSecret: effectiveSecret,
      redirectUri: redirectUri || existing?.redirectUri || null,
      webhookVerifyToken: webhookVerifyToken || existing?.webhookVerifyToken || null,
      isConfigured,
    })
    .onConflictDoUpdate({
      target: globalPlatformCredential.platform,
      set: {
        clientId,
        clientSecret: effectiveSecret,
        redirectUri: redirectUri || existing?.redirectUri || null,
        webhookVerifyToken: webhookVerifyToken || existing?.webhookVerifyToken || null,
        isConfigured,
      },
    })
    .returning();

  return c.json({ credential: { ...credential, clientSecret: undefined } });
});

// ─── DELETE /api/admin/platform-credentials/:platform ─────────────────────────
platformCredentialsApp.delete("/:platform", async (c) => {
  const platform = c.req.param("platform").toUpperCase();

  const existing = await db.query.globalPlatformCredential.findFirst({
    where: eq(globalPlatformCredential.platform, platform as any),
  });

  if (!existing) {
    return c.json({ error: "Credential not found" }, 404);
  }

  await db.delete(globalPlatformCredential).where(eq(globalPlatformCredential.id, existing.id));

  return c.json({ success: true });
});

export default platformCredentialsApp;
