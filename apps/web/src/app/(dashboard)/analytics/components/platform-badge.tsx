"use client";

import { cn } from "@/lib/utils";

const PLATFORM_CONFIG: Record<string, { label: string; color: string }> = {
  instagram: { label: "Instagram", color: "bg-pink-500/10 text-pink-600" },
  youtube: { label: "YouTube", color: "bg-red-500/10 text-red-600" },
  tiktok: { label: "TikTok", color: "bg-gray-500/10 text-gray-600" },
  facebook: { label: "Facebook", color: "bg-blue-500/10 text-blue-600" },
  x: { label: "X", color: "bg-gray-500/10 text-gray-600" },
  linkedin: { label: "LinkedIn", color: "bg-blue-700/10 text-blue-700" },
};

export function PlatformBadge({ platform }: { platform: string }) {
  const c = PLATFORM_CONFIG[platform.toLowerCase()] ?? {
    label: platform,
    color: "bg-gray-500/10 text-gray-600",
  };

  return (
    <span className={cn("rounded-full px-2 py-0.5 font-medium text-xs", c.color)}>{c.label}</span>
  );
}
