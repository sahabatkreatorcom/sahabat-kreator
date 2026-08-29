/**
 * Shared types for the platform routes sub-directory.
 */

export interface ProfileResponse {
  platformId: string;
  name: string;
  username: string;
  profilePicture?: string | null;
  metadata?: Record<string, unknown>;
}

/** Account columns returned to the client (tokens hidden). */
export interface AccountResponse {
  id: string;
  organizationId: string;
  platform: string;
  platformAccountId: string;
  name: string;
  username: string;
  isActive: boolean;
  tokenExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
