"use client";

import { cn } from "@/lib/utils";

interface SentimentSparklineProps {
  data: number[];
  className?: string;
}

export function SentimentSparkline({ data, className }: SentimentSparklineProps) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const width = 120;
  const height = 32;
  const padding = 2;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const lastValue = data[data.length - 1];
  const firstValue = data[0];
  const trend = lastValue - firstValue;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg width={width} height={height} className="shrink-0">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.join(" ")}
          className={cn(
            trend >= 0 ? "text-green-500" : "text-red-500"
          )}
        />
      </svg>
      <span
        className={cn(
          "text-xs font-medium",
          trend > 0 && "text-green-500",
          trend < 0 && "text-red-500",
          trend === 0 && "text-[var(--text-muted)]"
        )}
      >
        {trend > 0 ? "+" : ""}{trend}
      </span>
    </div>
  );
}
