"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, Home, Image as ImageIcon, MessageSquare, Plus, User } from "lucide-react";
import { triggerHaptic } from "@/hooks/use-haptic";
import { throwApiResponseError } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { useSPANavigation } from "../layout/dashboard-spa-shell";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Key to match against badge data */
  badgeKey?: string;
}

const navItems: NavItem[] = [
  { label: "Beranda", href: "/dashboard", icon: Home },
  { label: "Kalender", href: "/calendar", icon: Calendar },
  { label: "Media", href: "/media", icon: ImageIcon },
  { label: "Aktivitas", href: "/activity", icon: MessageSquare, badgeKey: "engagement" },
  { label: "Profil", href: "/settings", icon: User },
];

export function MobileBottomNav() {
  const _pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const { navigateTo, currentPath } = useSPANavigation();

  // Fetch badge counts (same API as sidebar)
  const { data: badges } = useQuery<{ engagement?: number }>({
    queryKey: ["sidebar-badges"],
    queryFn: async () => {
      const res = await fetch("/api/sidebar/badges");
      if (!res.ok) throwApiResponseError(res, "Failed to fetch badges");
      return res.json();
    },
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60_000, // 2 min — badge counts change infrequently
  });

  /**
   * Handle navigation with haptic feedback + SPA instant swap.
   */
  const handleNavClick = (href: string) => {
    triggerHaptic("light");
    navigateTo(href);
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-[var(--border)] border-t bg-[var(--bg-secondary)]/95 backdrop-blur-lg md:hidden"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom, 8px), 8px)",
      }}
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentPath === item.href ||
            (item.href !== "/dashboard" && currentPath?.startsWith(item.href)) ||
            (item.href === "/dashboard" && currentPath === "/dashboard");
          const badgeCount = item.badgeKey
            ? (badges as Record<string, number | undefined>)?.[item.badgeKey]
            : undefined;

          return (
            <button
              key={item.href}
              type="button"
              onClick={() => handleNavClick(item.href)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex min-h-11 flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-transform active:scale-95",
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-[var(--accent-gold)]" : "text-[var(--text-muted)]",
                  )}
                />
                {/* Badge indicator */}
                {badgeCount !== undefined && badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent-gold)] px-1 font-semibold text-[10px] text-white">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "font-medium text-xs",
                  isActive ? "text-[var(--accent-gold)]" : "text-[var(--text-muted)]",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileBottomNavSpacer() {
  return (
    <div
      className="md:hidden"
      style={{
        height: "calc(72px + max(env(safe-area-inset-bottom, 8px), 8px))",
      }}
    />
  );
}

export function QuickCaptureFAB({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed right-4 bottom-20 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient shadow-lg md:hidden"
      aria-label="Buat post baru"
    >
      <Plus className="h-6 w-6 text-white" />
    </button>
  );
}
