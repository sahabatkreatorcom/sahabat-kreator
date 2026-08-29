"use client";

import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  showTooltip?: boolean;
}

export function Sparkline({
  data,
  width = 120,
  height = 40,
  color = "var(--accent-gold)",
  className,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return null;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const firstValue = data[0];
  const lastValue = data[data.length - 1];
  const trend = lastValue - firstValue;
  const trendPercent = firstValue ? ((trend / firstValue) * 100).toFixed(1) : "0";

  const trendColor =
    trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-[var(--text-muted)]";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg width={width} height={height} className="shrink-0">
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={cn("font-medium text-xs", trendColor)}>
        {trend > 0 ? "+" : ""}
        {trendPercent}%
      </span>
    </div>
  );
}

// Trend indicator with percentage change
interface TrendIndicatorProps {
  value: number;
  previousValue: number;
  label?: string;
  className?: string;
}

export function TrendIndicator({ value, previousValue, label, className }: TrendIndicatorProps) {
  const change = value - previousValue;
  const percentChange = previousValue ? ((change / previousValue) * 100).toFixed(1) : "0";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {label && <span className="text-[var(--text-muted)] text-xs">{label}</span>}
      <span className={cn("font-medium text-sm", change >= 0 ? "text-green-500" : "text-red-500")}>
        {change >= 0 ? "↑" : "↓"} {Math.abs(Number.parseFloat(percentChange))}%
      </span>
    </div>
  );
}
