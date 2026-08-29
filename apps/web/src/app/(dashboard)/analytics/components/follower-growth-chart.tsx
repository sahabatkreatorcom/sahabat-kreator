"use client";

import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FollowerGrowthChartProps {
  data?: { date: string; count: number }[];
}

export function FollowerGrowthChart({ data = [] }: FollowerGrowthChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pertumbuhan Follower
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-[var(--text-muted)] text-sm">
            Belum ada data pertumbuhan
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const minCount = Math.min(...data.map((d) => d.count), 0);
  const range = maxCount - minCount || 1;

  const width = 400;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 20, left: 40 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
    const y = padding.top + chartHeight - ((d.count - minCount) / range) * chartHeight;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1]?.x || 0} ${padding.top + chartHeight} L ${points[0]?.x || 0} ${padding.top + chartHeight} Z`;

  const growth = data.length >= 2 ? data[data.length - 1].count - data[0].count : 0;
  const growthPercent = data[0]?.count ? ((growth / data[0].count) * 100).toFixed(1) : "0";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pertumbuhan Follower
          </CardTitle>
          <div
            className={cn("font-medium text-sm", growth >= 0 ? "text-green-500" : "text-red-500")}
          >
            {growth >= 0 ? "+" : ""}
            {growth} ({growthPercent}%)
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((level) => {
            const y = padding.top + chartHeight - level * chartHeight;
            const value = Math.round(minCount + level * range);
            return (
              <g key={level}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  className="text-[var(--border)]"
                  strokeDasharray="3,3"
                />
                <text
                  x={padding.left - 5}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-[var(--text-muted)] text-[8px]"
                >
                  {value.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} className="fill-[var(--accent-gold)]/10" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--accent-gold)]"
          />

          {/* Data Points */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" className="fill-[var(--accent-gold)]" />
          ))}

          {/* X Axis Labels */}
          {points
            .filter((_, i) => i % Math.ceil(data.length / 5) === 0 || i === data.length - 1)
            .map((p, i) => (
              <text
                key={i}
                x={p.x}
                y={height - 5}
                textAnchor="middle"
                className="fill-[var(--text-muted)] text-[8px]"
              >
                {new Date(p.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
              </text>
            ))}
        </svg>
      </CardContent>
    </Card>
  );
}
