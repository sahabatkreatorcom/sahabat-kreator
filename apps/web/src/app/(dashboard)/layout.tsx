import { auth } from "@sahabatkreator/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CrossTabSyncProvider } from "@/components/layout/cross-tab-sync-provider";
import { DashboardMain } from "@/components/layout/dashboard-main";
import {
  DashboardSPAShell,
  lazyViews,
  SPANavProvider,
} from "@/components/layout/dashboard-spa-shell";
import { OrgThemeProvider } from "@/components/layout/org-theme-provider";
import {
  type DashboardSession,
  DashboardSessionProvider,
} from "@/components/layout/session-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileBottomNav, MobileBottomNavSpacer } from "@/components/mobile/bottom-nav";

async function DashboardProviders({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionHeaders = new Headers();
  // Build Cookie header from browser cookies
  for (const cookie of cookieStore.getAll()) {
    sessionHeaders.append("Cookie", `${cookie.name}=${cookie.value}`);
  }
  const session = await auth.api.getSession({
    headers: sessionHeaders,
  });

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  const dashboardSession: DashboardSession = {
    userId: user.id,
    userName: user.name ?? "User",
    userEmail: user.email ?? "",
    userImage: user.image ?? null,
    currentOrganizationId:
      (user as unknown as { activeOrganizationId?: string }).activeOrganizationId ?? "",
    isSuperAdmin: (user as unknown as { role?: string }).role === "superadmin",
  };

  return (
    <DashboardSessionProvider session={dashboardSession}>
      <OrgThemeProvider />
      <SPANavProvider lazyViews={lazyViews}>
        <div className="flex min-h-screen">
          <Sidebar
            user={{
              name: user.name,
              email: user.email,
              image: user.image,
              isSuperAdmin: dashboardSession.isSuperAdmin,
            }}
          />
          <DashboardMain>
            <DashboardSPAShell>{children}</DashboardSPAShell>
          </DashboardMain>
        </div>
      </SPANavProvider>
    </DashboardSessionProvider>
  );
}

function LayoutSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-16 flex-col border-[var(--border)] border-r bg-[var(--bg-secondary)] md:flex" />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LayoutSkeleton>{children}</LayoutSkeleton>}>
      <DashboardProviders>{children}</DashboardProviders>
      <CrossTabSyncProvider />
      <MobileBottomNav />
      <MobileBottomNavSpacer />
    </Suspense>
  );
}
