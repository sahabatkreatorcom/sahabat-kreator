/**
 * Sahabat Kreator - Share Report Page
 * Public page to view shared analytics reports
 */
"use client";

import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Download,
  Eye,
  Heart,
  Share2,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mock data for demonstration (in real app, fetch from API)
const MOCK_REPORTS: Record<string, SharedReport> = {
  demo: {
    id: "demo",
    title: "Laporan Analisis Media Sosial",
    subtitle: "Periode 7 hari terakhir",
    createdAt: new Date().toISOString(),
    metrics: {
      totalFollowers: 12543,
      followersChange: 843,
      totalImpressions: 45230,
      impressionsChange: 12.5,
      totalReach: 32100,
      reachChange: 8.3,
      engagementRate: 5.42,
      engagementChange: 2.1,
      postsPublished: 18,
      postsChange: 3,
    },
    platforms: [
      { platform: "instagram", followers: 5420, engagementRate: 4.8, color: "#E1306C" },
      { platform: "tiktok", followers: 3200, engagementRate: 6.2, color: "#000000" },
      { platform: "youtube", followers: 2100, engagementRate: 3.9, color: "#FF0000" },
      { platform: "facebook", followers: 1823, engagementRate: 2.1, color: "#1877F2" },
    ],
    topPosts: [
      {
        caption: "Tips bisnis online untuk UMKM 🚀",
        likes: 234,
        comments: 18,
        shares: 45,
        platform: "instagram",
        date: "2024-01-15",
      },
      {
        caption: "Behind the scene produksi konten",
        likes: 189,
        comments: 12,
        shares: 23,
        platform: "tiktok",
        date: "2024-01-14",
      },
      {
        caption: "Tutorial edit video dengan CapCut",
        likes: 156,
        comments: 8,
        shares: 31,
        platform: "youtube",
        date: "2024-01-12",
      },
    ],
  },
};

interface SharedReport {
  id: string;
  title: string;
  subtitle: string;
  createdAt: string;
  metrics: {
    totalFollowers: number;
    followersChange: number;
    totalImpressions: number;
    impressionsChange: number;
    totalReach: number;
    reachChange: number;
    engagementRate: number;
    engagementChange: number;
    postsPublished: number;
    postsChange: number;
  };
  platforms: Array<{
    platform: string;
    followers: number;
    engagementRate: number;
    color: string;
  }>;
  topPosts: Array<{
    caption: string;
    likes: number;
    comments: number;
    shares: number;
    platform: string;
    date: string;
  }>;
}

export default function ShareReportPage() {
  const _params = useParams<{ id: string }>();
  const [report, setReport] = useState<SharedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // In production, this would fetch from API
    // For demo, use the demo report
    setTimeout(() => {
      setReport(MOCK_REPORTS.demo || null);
      setLoading(false);
    }, 500);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    // In production, this would trigger PDF generation
    alert("Fitur unduh PDF akan tersedia segera.");
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="spinner-gradient" />
          <p className="text-[var(--text-muted)] text-sm">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <BarChart3 className="mb-4 h-16 w-16 text-[var(--text-muted)] opacity-50" />
        <h1 className="mb-2 font-semibold text-xl">Laporan Tidak Ditemukan</h1>
        <p className="mb-6 text-[var(--text-secondary)] text-sm">
          Laporan ini mungkin sudah tidak aktif atau dihapus.
        </p>
        <Button onClick={() => {}}>Kembali ke Dashboard</Button>
      </div>
    );
  }

  const m = report.metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-[var(--text-muted)] text-sm transition-colors hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleCopyLink} className="gap-2">
            <Share2 className="h-4 w-4" />
            {copied ? "Tersalin!" : "Salin Link"}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Unduh PDF
          </Button>
        </div>
      </div>

      {/* Report Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge className="bg-[var(--accent-gold)]/20 text-[var(--accent-gold)]">
                <BarChart3 className="mr-1 h-3 w-3" />
                Analitik
              </Badge>
              <span className="text-[var(--text-muted)] text-xs">
                {new Date(report.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <h1 className="mb-1 font-bold text-2xl">{report.title}</h1>
            <p className="text-[var(--text-secondary)]">{report.subtitle}</p>
          </div>
          <div className="text-right">
            <p className="text-[var(--text-muted)] text-xs">Total Followers</p>
            <p className="font-bold text-2xl">{m.totalFollowers.toLocaleString()}</p>
            <div
              className={cn(
                "flex items-center justify-end gap-1 text-xs",
                m.followersChange >= 0 ? "text-green-500" : "text-red-500",
              )}
            >
              <TrendingUp className="h-3 w-3" />
              {m.followersChange >= 0 ? "+" : ""}
              {m.followersChange.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          icon={<Eye className="h-5 w-5 text-blue-500" />}
          label="Impressions"
          value={m.totalImpressions.toLocaleString()}
          change={`+${m.impressionsChange}%`}
          trend="up"
          color="bg-blue-500/10"
        />
        <MetricCard
          icon={<Zap className="h-5 w-5 text-purple-500" />}
          label="Reach"
          value={m.totalReach.toLocaleString()}
          change={`+${m.reachChange}%`}
          trend="up"
          color="bg-purple-500/10"
        />
        <MetricCard
          icon={<Heart className="h-5 w-5 text-pink-500" />}
          label="Engagement Rate"
          value={`${m.engagementRate}%`}
          change={`+${m.engagementChange}%`}
          trend="up"
          color="bg-pink-500/10"
        />
        <MetricCard
          icon={<CalendarDays className="h-5 w-5 text-[var(--accent-gold)]" />}
          label="Posts Published"
          value={m.postsPublished.toString()}
          change={`+${m.postsChange}`}
          trend="up"
          color="bg-[var(--accent-gold)]/10"
        />
      </div>

      {/* Platform Performance */}
      <div className="card p-6">
        <h2 className="mb-4 font-semibold">Performa Per Platform</h2>
        <div className="space-y-4">
          {report.platforms.map((platform) => (
            <div key={platform.platform} className="flex items-center gap-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm text-white"
                style={{ backgroundColor: platform.color }}
              >
                {platform.platform.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium capitalize">{platform.platform}</span>
                  <span className="text-[var(--text-muted)] text-sm">
                    {platform.followers.toLocaleString()} followers
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(platform.followers / 100, 100)}%`,
                      backgroundColor: platform.color,
                    }}
                  />
                </div>
              </div>
              <div className="min-w-[80px] text-right">
                <p className="font-semibold">{platform.engagementRate}%</p>
                <p className="text-[var(--text-muted)] text-xs">Engagement</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performing Posts */}
      <div className="card p-6">
        <h2 className="mb-4 font-semibold">Top Postingan</h2>
        <div className="space-y-4">
          {report.topPosts.map((post, index) => (
            <div
              key={index}
              className="flex items-center gap-4 rounded-lg bg-[var(--bg-secondary)] p-4"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-gold)]/20 font-bold text-[var(--accent-gold)] text-sm">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{post.caption}</p>
                <p className="mt-0.5 text-[var(--text-muted)] text-xs">
                  {new Date(post.date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  · {post.platform}
                </p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="font-semibold">{post.likes.toLocaleString()}</p>
                  <p className="text-[var(--text-muted)] text-xs">Likes</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{post.comments}</p>
                  <p className="text-[var(--text-muted)] text-xs">Comments</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{post.shares}</p>
                  <p className="text-[var(--text-muted)] text-xs">Shares</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[var(--text-muted)] text-xs">
        <p>Dibuat dengan Sahabat Kreator · {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  change,
  trend,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  color: string;
}) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", color)}>
          {icon}
        </div>
        {change && (
          <span
            className={cn(
              "flex items-center gap-0.5 rounded-full px-2 py-0.5 font-medium text-xs",
              trend === "up"
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : trend === "down"
                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                  : "bg-gray-500/10 text-gray-600 dark:text-gray-400",
            )}
          >
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : trend === "down" ? (
              <TrendingDown className="h-3 w-3" />
            ) : null}
            {change}
          </span>
        )}
      </div>
      <p className="font-bold text-2xl">{value}</p>
      <p className="mt-1 text-[var(--text-muted)] text-sm">{label}</p>
    </div>
  );
}
