import type { Context } from "hono";

/**
 * Get authenticated user ID from Hono context.
 * Must be used after requireAuth middleware.
 */
export function getUserId(c: Context): string {
  return c.get("userId") as string;
}

/**
 * Get active organization ID from Hono context.
 * Must be used after requireAuth middleware.
 */
export function getOrganizationId(c: Context): string {
  return c.get("organizationId") as string;
}
