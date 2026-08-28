"use client";

import { useSidebarStore } from "@/lib/stores/sidebar-store";

const COLLAPSED_WIDTH = 64;
const EXPANDED_WIDTH = 220;

interface DashboardMainProps {
  children: React.ReactNode;
}

export function DashboardMain({ children }: DashboardMainProps) {
  const { isExpanded } = useSidebarStore();

  return (
    <main
      style={{ marginLeft: isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      className="max-md:!ml-0 min-w-0 flex-1 overflow-x-hidden transition-[margin-left] duration-200 ease-out"
    >
      {children}
    </main>
  );
}
