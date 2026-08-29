"use client";

import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EngagementHeatmapProps {
  data?: { hour: number; count: number }[];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function EngagementHeatmap({ data = [] }: EngagementHeatmapProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const getColor = (count: number) => {
    const intensity = count / maxCount;
    if (intensity === 0) return "bg-[var(--bg-secondary)]";
    if (intensity < 0.25) return "bg-[var(--accent-gold)]/20";
    if (intensity < 0.5) return "bg-[var(--accent-gold)]/40";
    if (intensity < 0.75) return "bg-[var(--accent-gold)]/60";
    return "bg-[var(--accent-gold)]/80";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Heatmap Aktivitas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-4 text-center text-[var(--text-muted)] text-sm">
            Belum ada data aktivitas
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[300px]">
              {/* Hour Labels */}
              <div className="mb-1 grid grid-cols-[40px_repeat(24,1fr)] gap-0.5">
                <div />
                {HOURS.filter((h) => h % 3 === 0).map((hour) => (
                  <div key={hour} className="text-center text-[var(--text-muted)] text-xs">
                    {String(hour).padStart(2, "0")}
                  </div>
                ))}
              </div>

              {/* Heatmap Grid */}
              <div className="space-y-0.5">
                {WEEKDAYS.map((day, dayIndex) => (
                  <div key={day} className="grid grid-cols-[40px_repeat(24,1fr)] gap-0.5">
                    <div className="text-[var(--text-muted)] text-xs">{day}</div>
                    {HOURS.map((hour) => {
                      const cellData = data.find((d) => d.hour === hour);
                      const count = cellData?.count || 0;
                      return (
                        <div
                          key={`${dayIndex}-${hour}`}
                          className={cn(
                            "aspect-square rounded-sm transition-colors",
                            getColor(count),
                          )}
                          title={`${day} ${String(hour).padStart(2, "0")}:00 - ${count} post`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-2 flex items-center justify-end gap-1">
                <span className="text-[var(--text-muted)] text-xs">Sedikit</span>
                {[0, 0.25, 0.5, 0.75, 1].map((level) => (
                  <div
                    key={level}
                    className={`h-3 w-3 rounded-sm ${
                      level === 0
                        ? "bg-[var(--bg-secondary)]"
                        : `bg-[var(--accent-gold)]/${level * 100}`
                    }`}
                  />
                ))}
                <span className="text-[var(--text-muted)] text-xs">Banyak</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
