"use client";

import { lazy, memo, type ReactNode, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSPANavigation } from "./spa-nav-context";

export { SPANavProvider, useSPANavigation } from "./spa-nav-context";

/**
 * Lazy views registry — pages yang di-lazy-load untuk instant SPA navigation.
 * Setiap halaman di-load sekali saja saat pertama kali dikunjungi.
 */
const lazyViews: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  "/calendar": lazy(() => import("@/app/(dashboard)/calendar/page")),
  "/compose": lazy(() => import("@/app/(dashboard)/compose/page")),
  "/media": lazy(() => import("@/app/(dashboard)/media/page")),
  "/analytics": lazy(() => import("@/app/(dashboard)/analytics/page")),
  "/dashboard": lazy(() => import("@/app/(dashboard)/dashboard/page")),
  "/engagement": lazy(() => import("@/app/(dashboard)/engagement/page")),
  "/team": lazy(() => import("@/app/(dashboard)/team/page")),
  "/activity": lazy(() => import("@/app/(dashboard)/activity/page")),
  "/settings": lazy(() => import("@/app/(dashboard)/settings/page")),
  "/security": lazy(() => import("@/app/(dashboard)/security/page")),
  "/billing": lazy(() => import("@/app/(dashboard)/billing/page")),
  "/sk": lazy(() => import("@/app/(dashboard)/ai-suggestions/page")),
  "/pillars": lazy(() => import("@/app/(dashboard)/pillars/page")),
  "/hashtags": lazy(() => import("@/app/(dashboard)/hashtags/page")),
  "/competitors": lazy(() => import("@/app/(dashboard)/competitors/page")),
  "/suggestions": lazy(() => import("@/app/(dashboard)/suggestions/page")),
};

function ViewSkeleton() {
  return (
    <div className="animate-fade-in p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-6 w-32 md:h-8 md:w-40" />
        <div className="hidden items-center gap-3 md:flex">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="hidden h-40 rounded-xl md:block" />
      </div>
    </div>
  );
}

const ActiveView = memo(function ActiveView({
  route,
  children,
}: {
  route: string;
  children: ReactNode;
}) {
  const LazyComponent = lazyViews[route];

  if (!LazyComponent) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={<ViewSkeleton />}>
      <LazyComponent />
    </Suspense>
  );
});

interface DashboardSPAShellProps {
  children: ReactNode;
}

export function DashboardSPAShell({ children }: DashboardSPAShellProps) {
  const { spaActive, currentPath } = useSPANavigation();

  return spaActive ? (
    <div className="animate-fade-in">
      <ActiveView route={currentPath}>{children}</ActiveView>
    </div>
  ) : (
    children
  );
}

export { lazyViews };
