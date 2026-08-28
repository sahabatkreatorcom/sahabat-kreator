import { auth } from "@sahabatkreator/auth";
import type { Context, Next } from "hono";

export interface AuthContext {
  userId: string;
  organizationId: string;
  session: Awaited<ReturnType<typeof auth.api.getSession>>;
}

/**
 * Middleware to authenticate requests using Better Auth.
 * Adds userId and organizationId to context.
 */
export async function requireAuth(c: Context, next: Next) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userId = session.user.id;
  const organizationId =
    (session.user as unknown as { activeOrganizationId?: string }).activeOrganizationId || "";

  if (!organizationId) {
    return c.json({ error: "No active organization" }, 400);
  }

  c.set("userId", userId);
  c.set("organizationId", organizationId);
  c.set("session", session);

  await next();
}
