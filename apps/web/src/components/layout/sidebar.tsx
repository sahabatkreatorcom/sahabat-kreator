"use client";

import { Bell, LogOut, Moon, Shield, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSPANavigation } from "@/components/layout/dashboard-spa-shell";
import { engagementApi, notificationApi } from "@/lib/api-client";
import { signOut } from "@/lib/auth-client";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { cn } from "@/lib/utils";
import { PushNotificationBell } from "@/components/push";
import { OrganizationSwitcher } from "./organization-switcher";
import { COLLAPSED_WIDTH, EXPANDED_WIDTH, navItems } from "./sidebar-nav-items";

interface SidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isSuperAdmin?: boolean;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { navigateTo, currentPath } = useSPANavigation();
  const { isExpanded, setExpanded } = useSidebarStore();
  const [isDark, setIsDark] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [engagementCount, setEngagementCount] = useState(0);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setIsDark(current === "dark");
  }, []);

  useEffect(() => {
    notificationApi.unreadCount().then((res) => {
      if (res.ok) setNotificationCount(res.data.count);
    });
    engagementApi.list({ unread: "true" }).then((res) => {
      if (res.ok) setEngagementCount(res.data.unreadCount);
    });
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      const saved = localStorage.getItem("sahabatkreator-appearance");
      const prefs = saved ? JSON.parse(saved) : {};
      prefs.darkMode = next;
      localStorage.setItem("sahabatkreator-appearance", JSON.stringify(prefs));
    } catch {
      /* Ignore storage errors */
    }
  };

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocusCapture={() => setExpanded(true)}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget as Node | null;
        if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
          setExpanded(false);
        }
      }}
      style={{ width: isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      className={cn(
        "fixed top-0 left-0 z-40 hidden h-screen flex-col border-[var(--border)] border-r bg-[var(--bg-secondary)] md:flex",
        "transition-[width] duration-200 ease-out",
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </div>
        {isExpanded && (
          <span className="whitespace-nowrap font-bold text-base text-gradient">
            Sahabat Kreator
          </span>
        )}
      </div>

      {/* Organization Switcher */}
      <OrganizationSwitcher isExpanded={isExpanded} />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-1">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              currentPath === item.href ||
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            let badgeCount = 0;
            if (item.badgeKey === "engagement") {
              badgeCount = engagementCount;
            } else if (item.badgeKey === "analytics") {
              badgeCount = notificationCount;
            }

            return (
              <li key={item.href}>
                <button
                  type="button"
                  onClick={() => navigateTo(item.href)}
                  aria-current={isActive ? "page" : undefined}
                  title={!isExpanded ? item.label : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left font-medium text-sm transition-colors",
                    isActive
                      ? "bg-[var(--accent-gold-light)] text-[var(--accent-gold)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {isExpanded && <span className="flex-1 truncate">{item.label}</span>}
                  {isExpanded && badgeCount > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--accent-gold)] px-1.5 font-bold text-[10px] text-white">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Super Admin Link */}
      {user?.isSuperAdmin && (
        <div className="border-[var(--border)] border-t px-2 py-2">
          <Link
            href="/admin"
            as="/admin"
            title={!isExpanded ? "Super Admin" : undefined}
            className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-red-400 text-sm transition-colors hover:bg-red-500/10"
          >
            <Shield className="h-5 w-5 shrink-0" />
            {isExpanded && <span>Super Admin</span>}
          </Link>
        </div>
      )}

      {/* User Section */}
      <div className="border-[var(--border)] border-t px-2 py-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient font-semibold text-sm text-white">
            {user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? "U"}
          </div>
          {isExpanded && (
            <>
              <div className="flex-1 truncate">
                <p className="truncate font-medium text-sm">{user?.name ?? "User"}</p>
                <p className="truncate text-[var(--text-muted)] text-xs">
                  {user?.email ?? "user@example.com"}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                title={isDark ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
                aria-label={isDark ? "Beralih ke mode terang" : "Beralih ke mode gelap"}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              {isExpanded && (
                <>
                  <PushNotificationBell />
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--error)]"
                    title="Keluar"
                    aria-label="Keluar"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
