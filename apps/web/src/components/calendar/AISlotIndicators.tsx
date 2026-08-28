"use client";

import { useState } from "react";
import { Info, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface SlotRecommendation {
  hour: number;
  quality: "high" | "medium" | "low";
  reason: string;
  confidence: number;
}

interface AISlotIndicatorsProps {
  bestTimeSchedule?: SlotRecommendation[];
  posts?: Array<{ scheduledAt: string; engagement?: { likes: number; comments: number } }>;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function AISlotIndicators({
  bestTimeSchedule = [],
  posts = [],
}: AISlotIndicatorsProps) {
  const [tooltip, setTooltip] = useState<{ hour: number; reason: string; quality: string } | null>(null);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "high": return "bg-green-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-gray-400";
      default: return "bg-gray-300";
    }
  };

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case "high": return "Sangat Bagus";
      case "medium": return "Cukup Bagus";
      case "low": return "Kurang Ideal";
      default: return "";
    }
  };

  if (bestTimeSchedule.length === 0 && posts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] p-4 text-center">
        <Lightbulb className="mx-auto mb-2 h-5 w-5 text-[var(--text-muted)]/40" />
        <p className="font-medium text-[var(--text-secondary)] text-sm">Belum ada rekomendasi AI</p>
        <p className="text-[var(--text-muted)] text-xs mt-1">
          Jadwalkan beberapa post untuk mendapatkan rekomendasi waktu optimal
        </p>
      </div>
    );
  }

  // Aggregate historical performance data by hour
  const hourStats = HOURS.map((hour) => {
    const hourPosts = posts.filter((p) => new Date(p.scheduledAt).getHours() === hour);
    const totalEngagement = hourPosts.reduce(
      (sum, p) => sum + (p.engagement?.likes || 0) + (p.engagement?.comments || 0),
      0,
    );
    const avgEngagement = hourPosts.length > 0 ? totalEngagement / hourPosts.length : 0;
    return { hour, count: hourPosts.length, avgEngagement };
  });

  // Merge with AI recommendations
  const allSlots = HOURS.map((hour) => {
    const aiRec = bestTimeSchedule.find((r) => r.hour === hour);
    const hist = hourStats.find((s) => s.hour === hour);

    if (aiRec) {
      return {
        hour,
        quality: aiRec.quality,
        reason: aiRec.reason,
        confidence: aiRec.confidence,
        hasHistory: !!hist,
        historyCount: hist?.count || 0,
        historyAvg: hist?.avgEngagement || 0,
      };
    }

    // Infer from history
    if (hist && hist.count >= 2) {
      const avg = hist.avgEngagement;
      const quality = avg > 100 ? "high" : avg > 50 ? "medium" : "low";
      return {
        hour,
        quality,
        reason: `Berdasarkan ${hist.count} post sebelumnya`,
        confidence: Math.min(hist.count * 20, 90),
        hasHistory: true,
        historyCount: hist.count,
        historyAvg: avg,
      };
    }

    return { hour, quality: "low" as const, reason: "", confidence: 0, hasHistory: false, historyCount: 0, historyAvg: 0 };
  });

  const topSlots = allSlots.filter((s) => s.quality === "high").slice(0, 5);
  const medSlots = allSlots.filter((s) => s.quality === "medium");

  return (
    <div className="space-y-4">
      {/* Quick summary */}
      {topSlots.length > 0 && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-green-500" />
            <span className="font-medium text-sm text-green-600">Waktu Terbaik</span>
          </div>
          <p className="mt-1 text-green-700 text-xs">
            {topSlots.map((s) => `${s.hour}:00`).join(", ")}
          </p>
        </div>
      )}

      {/* Hour heatmap */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-sm">Slot Waktu (24 jam)</span>
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" /> Bagus
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-yellow-500" /> Cukup
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-gray-300" /> Kurang
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-1">
          {allSlots.map((slot) => (
            <div
              key={slot.hour}
              className={cn(
                "relative aspect-square rounded-md cursor-pointer transition-transform hover:scale-105",
                getQualityColor(slot.quality),
                slot.quality === "low" && "opacity-50",
              )}
              onMouseEnter={(e) => {
                if (slot.reason || slot.hasHistory) {
                  setTooltip({
                    hour: slot.hour,
                    reason: slot.reason || `Tidak ada data untuk jam ${slot.hour}:00`,
                    quality: getQualityLabel(slot.quality),
                  });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">
                {slot.hour}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-[var(--accent-gold)] mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">
                {tooltip.hour}:00 — <span className="text-[var(--accent-gold)]">{tooltip.quality}</span>
              </p>
              <p className="text-[var(--text-muted)] text-xs mt-1">{tooltip.reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top recommendations list */}
      {medSlots.length > 0 && (
        <div>
          <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider mb-2">
            Slot Moderate
          </p>
          <div className="space-y-1">
            {medSlots.map((slot) => (
              <div key={slot.hour} className="flex items-center justify-between rounded-md bg-[var(--bg-tertiary)] px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-sm">{slot.hour}:00</span>
                  {slot.reason && (
                    <span className="text-[var(--text-muted)] text-xs">{slot.reason}</span>
                  )}
                </div>
                <span className="text-[var(--text-muted)] text-xs">{slot.confidence}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
