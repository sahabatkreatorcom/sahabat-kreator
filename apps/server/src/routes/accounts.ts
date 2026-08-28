import { db } from "@sahabatkreator/db";
import { socialAccount } from "@sahabatkreator/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../lib/auth-middleware";
import { getOrganizationId } from "../lib/context";

const VALID_PLATFORMS = [
  "INSTAGRAM", "FACEBOOK", "TIKTOK", "YOUTUBE", "PINTEREST",
  "GOOGLE_BUSINESS", "LINKEDIN", "BLUESKY", "THREADS", "MANUAL",
] as const;

const accountsApp = new Hono();

accountsApp.use("/*", requireAuth);

accountsApp.get("/", async (c) => {
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
      createdAt: true,
    },
  });

  return c.json({ accounts });
});

const connectSchema = z.object({
  platform: z.enum(VALID_PLATFORMS),
  platformAccountId: z.string(),
  name: z.string(),
  username: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
});

accountsApp.post("/", async (c) => {
  const organizationId = getOrganizationId(c);
  const body = await c.req.json();
  const parsed = connectSchema.safeParse(body);

  if (!parsed.success) {
    const err = parsed.error.message;
    return c.json({ error: err }, 400);
  }

  const existing = await db.query.socialAccount.findFirst({
    where: and(
      eq(socialAccount.organizationId, organizationId),
      eq(socialAccount.platformAccountId, parsed.data.platformAccountId),
    ),
  });

  if (existing) return c.json({ error: "Account already connected" }, 409);

  const [newAccount] = await db
    .insert(socialAccount)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      platform: parsed.data.platform,
      platformAccountId: parsed.data.platformAccountId,
      name: parsed.data.name,
      username: parsed.data.username ?? null,
      accessToken: parsed.data.accessToken ?? null,
      refreshToken: parsed.data.refreshToken ?? null,
    })
    .returning();

  return c.json({ account: newAccount }, 201);
});

accountsApp.delete("/:id", async (c) => {
  const organizationId = getOrganizationId(c);
  const accountId = c.req.param("id");

  const existing = await db.query.socialAccount.findFirst({
    where: and(eq(socialAccount.id, accountId), eq(socialAccount.organizationId, organizationId)),
  });

  if (!existing) return c.json({ error: "Account not found" }, 404);

  await db.update(socialAccount).set({ isActive: false }).where(eq(socialAccount.id, accountId));
  return c.json({ success: true });
});

export default accountsApp;
