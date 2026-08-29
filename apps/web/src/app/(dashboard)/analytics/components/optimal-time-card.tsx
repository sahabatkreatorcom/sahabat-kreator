"use client";

import { Clock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyticsApi } from "@/lib/api-client";

interface OptimalTime {
  label: string;
  postCount: number;
}

export function OptimalTimeCard() {
  const [bestHours, setBestHours] = useState<OptimalTime[]>([]);
  const [bestDays, setBestDays] = useState<OptimalTime[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOptimalTimes = async () => {
    try {
      const res = await analyticsApi.optimalTimes();
      if (res.ok) {
        setBestHours(res.data.optimalTimes.bestHours || []);
        setBestDays(res.data.optimalTimes.bestDays || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptimalTimes();
  }, [fetchOptimalTimes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Waktu Optimal
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-gold)]" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Best Hours */}
            <div className="space-y-2">
              <p className="font-medium text-sm">Jam Terbaik</p>
              {bestHours.length === 0 ? (
                <p className="text-[var(--text-muted)] text-xs">Belum ada data</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {bestHours.map((hour) => (
                    <div
                      key={hour.label}
                      className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5"
                    >
                      <span className="font-medium text-sm">{hour.label}</span>
                      <span className="text-[var(--text-muted)] text-xs">
                        ({hour.postCount} post)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Best Days */}
            <div className="space-y-2">
              <p className="font-medium text-sm">Hari Terbaik</p>
              {bestDays.length === 0 ? (
                <p className="text-[var(--text-muted)] text-xs">Belum ada data</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {bestDays.map((day) => (
                    <div
                      key={day.label}
                      className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5"
                    >
                      <span className="font-medium text-sm">{day.label}</span>
                      <span className="text-[var(--text-muted)] text-xs">
                        ({day.postCount} post)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
