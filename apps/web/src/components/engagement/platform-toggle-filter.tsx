"use client";

import { cn } from "@/lib/utils";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TikTokIcon,
  TwitterIcon,
  YoutubeIcon,
} from "@/components/ui/platform-icons";

interface PlatformToggleFilterProps {
  activePlatform: string;
  onPlatformChange: (platform: string) => void;
}

const PLATFORMS = [
  { id: "all", label: "Semua", Icon: null },
  { id: "instagram", label: "Instagram", Icon: InstagramIcon },
  { id: "youtube", label: "YouTube", Icon: YoutubeIcon },
  { id: "facebook", label: "Facebook", Icon: FacebookIcon },
  { id: "twitter", label: "Twitter", Icon: TwitterIcon },
  { id: "tiktok", label: "TikTok", Icon: TikTokIcon },
  { id: "linkedin", label: "LinkedIn", Icon: LinkedinIcon },
];

export function PlatformToggleFilter({ activePlatform, onPlatformChange }: PlatformToggleFilterProps) {
  return (
    <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-1">
      {PLATFORMS.map((platform) => {
        const isActive = activePlatform === platform.id;
        return (
          <button
            key={platform.id}
            onClick={() => onPlatformChange(platform.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-all",
              isActive
                ? "bg-[var(--accent-gold)] text-[var(--bg-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            {platform.Icon && <platform.Icon className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{platform.label}</span>
          </button>
        );
      })}
    </div>
  );
}
