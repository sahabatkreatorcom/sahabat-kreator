"use client";

import { Shield } from "lucide-react";

export function PlanBadge({ tier, color, name }: { tier: string; color: string; name: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-[10px] uppercase tracking-wider"
      style={{
        backgroundColor: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {tier === "ADMIN" && <Shield className="h-3 w-3" />}
      {name}
    </span>
  );
}
