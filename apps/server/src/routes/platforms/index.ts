/**
 * Barrel export for platform sub-modules.
 * The main router (GET /accounts, /:platform/*) lives in routes/platforms.ts.
 */
export {
  exchangeCodeForToken,
  buildAuthorizationUrl,
  getCallbackUrl,
} from "./oauth-helpers";
export { getPlatformStrategy, SUPPORTED_PLATFORMS } from "./oauth-registry";
export { upsertAccount } from "./profile-store";
export type { PlatformToken } from "./oauth-helpers";
export type { ProfileResponse, AccountResponse } from "./types";
