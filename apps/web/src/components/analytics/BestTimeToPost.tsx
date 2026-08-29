"use client";

import { ArrowUpRight, Clock, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface HeatmapCell {
  day: number;
  hour: number;
  score: number;
}

interface PlatformRec {
  platform: string;
  bestHours: number[];
  confidence: number;
}

interface BestTimeToPostProps {
  data?: HeatmapCell[];
  recommendations?: PlatformRec[];
  trendData?: number[];
}

export function BestTimeToPost({
  data = [],
  recommendations = [],
  trendData = [],
}: BestTimeToPostProps) {
  const [isPosting, setIsPosting] = useState(false);

  const maxScore = Math.max(...data.map((d) => d.score), 1);

  const getColor = (score: number) => {
    if (score === 0) return "bg-[var(--bg-tertiary)]";
    const ratio = score / maxScore;
    if (ratio < 0.25) return "bg-[var(--accent-gold)]/20";
    if (ratio < 0.5) return "bg-[var(--accent-gold)]/40";
    if (ratio < 0.75) return "bg-[var(--accent-gold)]/60";
    return "bg-[var(--accent-gold)]/90";
  };

  const getTrend = () => {
    if (trendData.length < 2) return { label: "", trend: "neutral" as const };
    const recent = trendData.slice(-7).reduce((a, b) => a + b, 0) / 7;
    const previous = trendData.slice(-14, -7).reduce((a, b) => a + b, 0) / 7;
    const pct = previous > 0 ? ((recent - previous) / previous) * 100 : 0;
    if (pct > 5) return { label: `+${pct.toFixed(1)}%`, trend: "up" as const };
    if (pct < -5) return { label: `${pct.toFixed(1)}%`, trend: "down" as const };
    return { label: "Stabil", trend: "neutral" as const };
  };

  const handlePostNow = () => {
    setIsPosting(true);
    toast.success("Post berhasil dijadwalkan!");
    setTimeout(() => setIsPosting(false), 1500);
  };

  const trend = getTrend();

  return (
    <div className="space-y-4">
      {/* Heatmap */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Peta Waktu Posting Terbaik
            </CardTitle>
            <span
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-xs",
                trend.trend === "up" && "bg-green-500/10 text-green-600",
                trend.trend === "down" && "bg-red-500/10 text-red-600",
                trend.trend === "neutral" && "bg-[var(--bg-tertiary)] text-[var(--text-muted)]",
              )}
            >
              {trend.trend === "up" ? <TrendingUp className="h-3 w-3" /> : null}
              {trend.trend === "down" ? <TrendingDown className="h-3 w-3" /> : null}
              {trend.label}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="py-8 text-center text-[var(--text-muted)] text-sm">
              Belum cukup data untuk rekomendasi waktu optimal
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[420px]">
                {/* Hour labels */}
                <div className="mb-1 grid grid-cols-[36px_repeat(24,1fr)] gap-0.5">
                  <div />
                  {HOURS.filter((h) => h % 4 === 0).map((h) => (
                    <div key={h} className="text-center text-[10px] text-[var(--text-muted)]">
                      {String(h).padStart(2, "0")}
                    </div>
                  ))}
                </div>
                {/* Grid */}
                <div className="space-y-0.5">
                  {WEEKDAYS.map((day, di) => (
                    <div key={day} className="grid grid-cols-[36px_repeat(24,1fr)] gap-0.5">
                      <div className="flex items-center text-[10px] text-[var(--text-muted)]">
                        {day}
                      </div>
                      {HOURS.map((hour) => {
                        const cell = data.find((d) => d.day === di && d.hour === hour);
                        return (
                          <div
                            key={`${di}-${hour}`}
                            className={cn(
                              "aspect-square cursor-pointer rounded-sm transition-colors hover:ring-1 hover:ring-[var(--accent-gold)]",
                              getColor(cell?.score || 0),
                            )}
                            title={`${day} ${String(hour).padStart(2, "0")}:00 — skor ${cell?.score ?? 0}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                {/* Legend */}
                <div className="mt-2 flex items-center justify-end gap-1">
                  <span className="text-[10px] text-[var(--text-muted)]">Rendah</span>
                  {[0, 0.25, 0.5, 0.75, 1].map((level) => (
                    <div
                      key={level}
                      className={`h-2.5 w-2.5 rounded-sm ${
                        level === 0
                          ? "bg-[var(--bg-tertiary)]"
                          : `bg-[var(--accent-gold)]/${level * 90}`
                      }`}
                    />
                  ))}
                  <span className="text-[10px] text-[var(--text-muted)]">Tinggi</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Recommendations */}
      {recommendations.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {recommendations.map((rec) => (
            <Card key={rec.platform}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-medium text-sm">{rec.platform}</CardTitle>
                  <span className="text-[var(--text-muted)] text-xs">
                    {rec.confidence >= 80 ? "Tinggi" : rec.confidence >= 50 ? "Sedang" : "Rendah"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-[var(--text-muted)] text-xs">Jam terbaik:</p>
                <div className="flex flex-wrap gap-1.5">
                  {rec.bestHours.map((h) => (
                    <span
                      key={h}
                      className="rounded-md bg-[var(--accent-gold)]/15 px-2 py-0.5 font-medium text-[var(--accent-gold)] text-xs"
                    >
                      {String(h).padStart(2, "0")}:00
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Trend Line (custom SVG mini chart) */}
      {trendData.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Tren Engagement (7 hari terakhir)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MiniLineChart data={trendData} />
          </CardContent>
        </Card>
      )}

      {/* Post Now CTA */}
      <Button
        onClick={handlePostNow}
        disabled={isPosting}
        className="w-full gap-2 bg-gradient py-3 text-base"
      >
        <Zap className="h-4 w-4" />
        {isPosting ? "Menjalankan..." : "Posting Sekarang"}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

function MiniLineChart({ data }: { data: number[] }) {
  const w = 600;
  const h = 100;
  const pad = { top: 10, right: 10, bottom: 20, left: 10 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * cw,
    y: pad.top + ch - ((v - min) / range) * ch,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath =
    linePath +
    ` L ${points[points.length - 1]?.x ?? 0} ${pad.top + ch} L ${points[0]?.x ?? 0} ${pad.top + ch} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full">
      <defs>
        <linearGradient id="besttime-trend" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-gold)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--accent-gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#besttime-trend)" />
      <path
        d={linePath}
        fill="none"
        stroke="var(--accent-gold)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" className="fill-[var(--accent-gold)]" />
      ))}
      {points
        .filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1)
        .map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={h - 4}
            textAnchor="middle"
            className="fill-[var(--text-muted)]"
            fontSize="9"
          >
            {data[i * Math.ceil(data.length / 6)] ?? data[data.length - 1]}
          </text>
        ))}
    </svg>
  );
}
