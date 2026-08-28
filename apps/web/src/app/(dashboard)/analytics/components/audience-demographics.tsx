"use client";

import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AudienceDemographicsProps {
  platforms?: { platform: string; postCount: number }[];
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-pink-500",
  youtube: "bg-red-500",
  facebook: "bg-blue-600",
  twitter: "bg-sky-500",
  tiktok: "bg-gray-900",
  linkedin: "bg-blue-700",
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  twitter: "Twitter",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
};

export function AudienceDemographics({ platforms = [] }: AudienceDemographicsProps) {
  const total = platforms.reduce((sum, p) => sum + p.postCount, 0) || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Distribusi Platform
        </CardTitle>
      </CardHeader>
      <CardContent>
        {platforms.length === 0 ? (
          <p className="py-4 text-center text-[var(--text-muted)] text-sm">Belum ada data platform</p>
        ) : (
          <div className="space-y-4">
            {/* Bar Chart */}
            <div className="space-y-2">
              {platforms.map((platform) => {
                const percentage = (platform.postCount / total) * 100;
                return (
                  <div key={platform.platform} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{PLATFORM_LABELS[platform.platform] || platform.platform}</span>
                      <span className="text-[var(--text-muted)]">
                        {platform.postCount} post ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                      <div
                        className={`h-full rounded-full ${PLATFORM_COLORS[platform.platform] || "bg-gray-500"}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 pt-2">
              {platforms.map((platform) => (
                <div key={platform.platform} className="flex items-center gap-2 text-xs">
                  <div
                    className={`h-3 w-3 rounded-full ${PLATFORM_COLORS[platform.platform] || "bg-gray-500"}`}
                  />
                  <span className="text-[var(--text-muted)]">
                    {PLATFORM_LABELS[platform.platform] || platform.platform}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
