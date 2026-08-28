"use client";

import { cn } from "@/lib/utils";

export function UsageMeter({ label, current, limit }: { label: string; current: number; limit: number }) {
  const isUnlimited = !isFinite(limit);
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && percentage >= 100;

  return (
    <div className="rounded-lg border border-[var(--border)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium text-xs">{label}</span>
        <span
          className={cn(
            "font-semibold text-xs",
            isAtLimit
              ? "text-[var(--error)]"
              : isNearLimit
                ? "text-[var(--warning)]"
                : "text-[var(--text-muted)]",
          )}
        >
          {current} / {isUnlimited ? "∞" : limit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isAtLimit
              ? "bg-[var(--error)]"
              : isNearLimit
                ? "bg-[var(--warning)]"
                : "bg-[var(--accent-pink)]",
          )}
          style={{ width: isUnlimited ? "0%" : `${percentage}%` }}
        />
      </div>
    </div>
  );
}
