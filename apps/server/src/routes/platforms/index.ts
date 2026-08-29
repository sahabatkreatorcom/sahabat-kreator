/**
 * Barrel export for platform sub-modules.
 * The main router (GET /accounts, /:platform/*) lives in routes/platforms.ts.
 */

export type { PlatformToken } from "./oauth-helpers";
export {
  buildAuthorizationUrl,
  exchangeCodeForToken,
  getCallbackUrl,
} from "./oauth-helpers";
export { getPlatformStrategy, SUPPORTED_PLATFORMS } from "./oauth-registry";
export { upsertAccount } from "./profile-store";
export type { AccountResponse, ProfileResponse } from "./types";
