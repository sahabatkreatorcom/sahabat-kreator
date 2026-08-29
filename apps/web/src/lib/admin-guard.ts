/**
 * Hono-style admin middleware for API routes on the Hono server.
 * This file is kept for reference and potential reuse in the server app.
 */

export type AdminHandler = (c: any) => any;

export function withAdmin(handler: AdminHandler): AdminHandler {
  return async (c) => {
    const session = await c.get("session");
    if (!session?.user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const role = (session.user as any).role;
    if (role !== "superadmin") {
      return c.json({ error: "Forbidden", message: "Super admin access required" }, 403);
    }
    return handler(c);
  };
}

export function requireAdmin() {
  return { success: true };
}
