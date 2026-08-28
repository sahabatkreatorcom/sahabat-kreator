"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  color: string;
}

export function MetricCard({ icon, label, value, change, trend, color }: MetricCardProps) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", color)}>
          {icon}
        </div>
        <span
          className={cn(
            "flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium text-xs",
            trend === "up"
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-red-500/10 text-red-600 dark:text-red-400",
          )}
        >
          {trend === "up" ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {change}
        </span>
      </div>
      <p className="font-bold text-2xl">{value}</p>
      <p className="mt-1 text-[var(--text-muted)] text-sm">{label}</p>
    </div>
  );
}
