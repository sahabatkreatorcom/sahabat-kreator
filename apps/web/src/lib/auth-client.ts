import { env } from "@sahabatkreator/env/web";
import { adminClient, organizationClient, twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_SERVER_URL,
  plugins: [organizationClient(), adminClient(), twoFactorClient()],
});

export const { signIn, signOut, useSession, signUp } = authClient;
export const { requestPasswordReset, resetPassword } = authClient;
