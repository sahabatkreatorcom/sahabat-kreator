"use client";

import { Download, Filter, Hash, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface HashtagRow {
  tag: string;
  uses: number;
  impressions: number;
  engagement: number;
  reach: number;
  trend: "up" | "down" | "flat";
  platform?: string;
}

type DateRange = "7d" | "30d" | "90d";
type PostType = "all" | "photo" | "video" | "carousel";

const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Facebook", "LinkedIn", "Threads"] as const;

function sampleData(): HashtagRow[] {
  return [
    {
      tag: "#kontenkreator",
      uses: 42,
      impressions: 125_000,
      engagement: 8.4,
      reach: 45_000,
      trend: "up",
    },
    {
      tag: "#digitalmarketing",
      uses: 38,
      impressions: 98_000,
      engagement: 6.2,
      reach: 32_000,
      trend: "up",
    },
    {
      tag: "#businesstabungancg",
      uses: 31,
      impressions: 87_000,
      engagement: 7.1,
      reach: 28_000,
      trend: "down",
    },
    {
      tag: "#contentcreator",
      uses: 29,
      impressions: 110_000,
      engagement: 5.8,
      reach: 38_000,
      trend: "flat",
    },
    {
      tag: "#sosmedindonesia",
      uses: 24,
      impressions: 67_000,
      engagement: 9.3,
      reach: 22_000,
      trend: "up",
    },
    {
      tag: "#bisnisonline",
      uses: 22,
      impressions: 54_000,
      engagement: 4.7,
      reach: 18_000,
      trend: "flat",
    },
    {
      tag: "#tiktokindonesia",
      uses: 20,
      impressions: 200_000,
      engagement: 11.2,
      reach: 85_000,
      trend: "up",
    },
    {
      tag: "#reelsinstagram",
      uses: 18,
      impressions: 145_000,
      engagement: 10.1,
      reach: 60_000,
      trend: "up",
    },
    {
      tag: "#brandkreator",
      uses: 15,
      impressions: 43_000,
      engagement: 3.9,
      reach: 12_000,
      trend: "down",
    },
    {
      tag: "#influencerindo",
      uses: 14,
      impressions: 78_000,
      engagement: 6.8,
      reach: 25_000,
      trend: "flat",
    },
  ];
}

export function HashtagPerformance() {
  const [rows, setRows] = useState<HashtagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [postType, setPostType] = useState<PostType>("all");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setTimeout(() => {
      setRows(sampleData());
      setLoading(false);
    }, 600);
  }, []);

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const filtered = rows.filter((r) => {
    if (search && !r.tag.toLowerCase().includes(search.toLowerCase())) return false;
    if (platforms.length > 0) return true;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => b.impressions - a.impressions);

  const topTag = sorted[0];
  const exportCSV = () => {
    const header = "Tag,Uses,Impressions,Engagement,Reach,Trend\n";
    const csv =
      header +
      sorted
        .map((r) => `${r.tag},${r.uses},${r.impressions},${r.engagement},${r.reach},${r.trend}`)
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hashtag-performance-${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Hash className="h-4 w-4" />
              Performa Hashtag
            </CardTitle>
            <Button variant="secondary" size="sm" onClick={exportCSV} className="gap-2">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Cari hashtag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-[120px]">
                <Filter className="mr-2 h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Hari</SelectItem>
                <SelectItem value="30d">30 Hari</SelectItem>
                <SelectItem value="90d">90 Hari</SelectItem>
              </SelectContent>
            </Select>
            <Select value={postType} onValueChange={(v) => setPostType(v as PostType)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="photo">Foto</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="carousel">Carousel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <span className="self-center text-[var(--text-muted)] text-xs">Platform:</span>
            {PLATFORMS.map((p) => (
              <label key={p} className="flex cursor-pointer items-center gap-1.5 text-xs">
                <Checkbox
                  checked={platforms.includes(p)}
                  onCheckedChange={() => togglePlatform(p)}
                />
                <span className="text-[var(--text-secondary)]">{p}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Tag Highlight */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="spinner-gradient" />
            <p className="text-[var(--text-muted)] text-sm">Memuat data...</p>
          </div>
        </div>
      ) : (
        <>
          {topTag && (
            <Card className="border-[var(--accent-gold)]/30">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-gold)]/15">
                  <TrendingUp className="h-6 w-6 text-[var(--accent-gold)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[var(--text-muted)] text-xs">Hashtag Teratas</p>
                  <p className="font-semibold text-lg">{topTag.tag}</p>
                  <p className="text-[var(--text-muted)] text-xs">
                    {topTag.impressions.toLocaleString()} impresi · {topTag.engagement}% engagement
                  </p>
                </div>
                <Badge
                  variant={
                    topTag.trend === "up"
                      ? "success"
                      : topTag.trend === "down"
                        ? "danger"
                        : "secondary"
                  }
                >
                  {topTag.trend === "up" ? "Naik" : topTag.trend === "down" ? "Turun" : "Stabil"}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-[var(--border)] border-b bg-[var(--bg-tertiary)]/50">
                      <th className="px-4 py-3 text-left font-medium text-[var(--text-muted)] text-xs">
                        Hashtag
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-[var(--text-muted)] text-xs">
                        Digunakan
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-[var(--text-muted)] text-xs">
                        Impresi
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-[var(--text-muted)] text-xs">
                        Engagement
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-[var(--text-muted)] text-xs">
                        Reach
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-[var(--text-muted)] text-xs">
                        Tren
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((row, i) => (
                      <tr
                        key={row.tag}
                        className={cn(
                          "border-[var(--border-light)] border-b transition-colors hover:bg-[var(--bg-tertiary)]/50",
                          i === 0 && "bg-[var(--accent-gold)]/5",
                        )}
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-[var(--accent-gold)]">{row.tag}</span>
                        </td>
                        <td className="px-4 py-3 text-right">{row.uses}</td>
                        <td className="px-4 py-3 text-right">{row.impressions.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              "font-medium",
                              row.engagement >= 7
                                ? "text-green-600"
                                : row.engagement >= 4
                                  ? "text-[var(--text-primary)]"
                                  : "text-red-500",
                            )}
                          >
                            {row.engagement}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">{row.reach.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          {row.trend === "up" ? (
                            <TrendingUp className="mx-auto h-4 w-4 text-green-500" />
                          ) : row.trend === "down" ? (
                            <TrendingDown className="mx-auto h-4 w-4 text-red-500" />
                          ) : (
                            <span className="text-[var(--text-muted)] text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
