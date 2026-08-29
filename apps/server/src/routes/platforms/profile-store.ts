/**
 * Social Account CRUD
 *
 * Upserts a social_account row after a successful OAuth callback.
 */

import { db } from "@sahabatkreator/db";
import { socialAccount } from "@sahabatkreator/db/schema";
import { and, eq } from "drizzle-orm";
import type { PlatformToken } from "./oauth-helpers";
import type { ProfileResponse } from "./types";

export interface SaveAccountInput {
  organizationId: string;
  platform: string;
  profile: ProfileResponse;
  token: PlatformToken;
}

/**
 * Upsert a social account:
 *  - If a row with the same (organizationId, platform, platformAccountId) exists → update tokens.
 *  - Otherwise → insert a new row.
 */
export async function upsertAccount(input: SaveAccountInput) {
  const { organizationId, platform, profile, token } = input;

  // Check for existing account (same org + same platform ID)
  const existing = await db.query.socialAccount.findFirst({
    where: and(
      eq(socialAccount.organizationId, organizationId),
      eq(socialAccount.platformAccountId, profile.platformId),
      eq(socialAccount.platform, platform as any),
    ),
  });

  const accountData = {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken ?? null,
    tokenExpiresAt: new Date(Date.now() + token.expiresIn * 1000),
    isActive: true,
  };

  if (existing) {
    const [updated] = await db
      .update(socialAccount)
      .set(accountData)
      .where(eq(socialAccount.id, existing.id))
      .returning();

    if (!updated) throw new Error("Failed to update account");
    return toResponse(updated);
  }

  const [newAccount] = await db
    .insert(socialAccount)
    .values({
      id: crypto.randomUUID(),
      organizationId,
      platform: platform as any,
      platformAccountId: profile.platformId,
      name: profile.name,
      username: profile.username,
      ...accountData,
    })
    .returning();

  if (!newAccount) throw new Error("Failed to create account");
  return toResponse(newAccount);
}

function toResponse(account: typeof socialAccount.$inferSelect) {
  return {
    id: account.id,
    organizationId: account.organizationId,
    platform: account.platform,
    platformAccountId: account.platformAccountId,
    name: account.name,
    username: account.username,
    isActive: account.isActive,
    tokenExpiresAt: account.tokenExpiresAt,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}
