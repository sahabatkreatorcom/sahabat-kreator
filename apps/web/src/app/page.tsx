import { LandingPage } from "@/components/marketing/landing-page";

/**
 * Root page — routing hub.
 * Session check is handled client-side inside <LandingPage> via useSession()
 * to avoid pulling in @sahabatkreator/auth (server package) at build time,
 * which would validate env vars that are unavailable during next build.
 */
export default function RootPage() {
  return <LandingPage />;
}
