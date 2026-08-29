"use client";

import { AlertCircle, Brain, Lightbulb, Loader2, RefreshCcw, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyticsApi } from "@/lib/api-client";

interface Insight {
  type: "success" | "warning" | "info" | "tip";
  title: string;
  description: string;
}

export function AiInsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const [overviewRes, optimalRes] = await Promise.all([
        analyticsApi.overview("30d"),
        analyticsApi.optimalTimes(),
      ]);

      const newInsights: Insight[] = [];

      if (overviewRes.ok) {
        const { totalPosts, postsByStatus } = overviewRes.data.overview;
        const failed = postsByStatus?.FAILED || 0;

        if (totalPosts === 0) {
          newInsights.push({
            type: "tip",
            title: "Mulai Berposting",
            description:
              "Anda belum memiliki post dalam 30 hari terakhir. Mulai buat konten untuk meningkatkan engagement!",
          });
        } else if (failed > 0) {
          newInsights.push({
            type: "warning",
            title: "Post Gagal",
            description: `${failed} post gagal dipublikasikan. Periksa koneksi akun media sosial Anda.`,
          });
        } else {
          newInsights.push({
            type: "success",
            title: "Posting Konsisten",
            description: `Anda telah membuat ${totalPosts} post dalam 30 hari terakhir. Pertahankan!`,
          });
        }
      }

      if (optimalRes.ok) {
        const { bestHours, bestDays } = optimalRes.data.optimalTimes;
        if (bestHours.length > 0) {
          newInsights.push({
            type: "info",
            title: "Waktu Terbaik",
            description: `Post paling banyak dibuat pada jam ${bestHours[0]?.label}. Pertimbangkan untuk menjadwalkan konten di waktu ini.`,
          });
        }
        if (bestDays.length > 0) {
          newInsights.push({
            type: "tip",
            title: "Hari Aktif",
            description: `${bestDays[0]?.label} adalah hari dengan aktivitas posting tertinggi.`,
          });
        }
      }

      setInsights(newInsights);
    } catch {
      toast.error("Gagal memuat insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInsights();
    setRefreshing(false);
  };

  const getIcon = (type: Insight["type"]) => {
    switch (type) {
      case "success":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "tip":
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      default:
        return <Brain className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-[var(--accent-gold)]" />
            AI Insights
          </CardTitle>
          <Button variant="secondary" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-gold)]" />
          </div>
        ) : insights.length === 0 ? (
          <p className="py-4 text-center text-[var(--text-muted)] text-sm">
            Belum ada insights tersedia
          </p>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3"
              >
                {getIcon(insight.type)}
                <div>
                  <p className="font-medium text-sm">{insight.title}</p>
                  <p className="text-[var(--text-muted)] text-xs">{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
