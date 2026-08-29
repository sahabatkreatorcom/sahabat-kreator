import { auth } from "@sahabatkreator/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/marketing/landing-page";

/**
 * Root page — routing hub:
 * - Authenticated users → /dashboard
 * - Unauthenticated visitors → public landing page (SEO + Google consent requirement)
 */
export default async function RootPage() {
  const cookieStore = await cookies();
  const sessionHeaders = new Headers();
  for (const cookie of cookieStore.getAll()) {
    sessionHeaders.append("Cookie", `${cookie.name}=${cookie.value}`);
  }

  const session = await auth.api.getSession({ headers: sessionHeaders });

  if (session?.user) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
