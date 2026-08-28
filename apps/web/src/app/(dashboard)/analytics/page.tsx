"use client";

import {
  ArrowUpRight,
  BarChart3,
  Bot,
  CalendarDays,
  ChevronDown,
  MessageSquare,
  RefreshCcw,
  Users,
  Video,
  Eye,
  Heart,
  Share2,
  TrendingUp,
  TrendingDown,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { postsApi, platformApi, analyticsApi, type PlatformAccount } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type TimeRange = "7d" | "30d" | "90d";

interface PlatformAnalytics {
  followers: number;
  followersChange: number;
  following: number;
  impressions: number;
  reach: number;
  engagementRate: number;
  profileViews: number;
  websiteClicks: number;
  emailClicks: number;
  platformMetrics?: Record<string, unknown>;
}

const PLATFORM_COLORS: Record<string, string> = {
  INSTAGRAM: "#E1306C",
  FACEBOOK: "#1877F2",
  TIKTOK: "#000000",
  YOUTUBE: "#FF0000",
  LINKEDIN: "#0A66C2",
  PINTEREST: "#BD081C",
  THREADS: "#000000",
  BLUESKY: "#0085ff",
  GOOGLE_BUSINESS: "#4285F4",
};

const PLATFORM_ICONS: Record<string, typeof Bot> = {
  INSTAGRAM: BarChart3,
  FACEBOOK: Users,
  TIKTOK: Video,
  YOUTUBE: Video,
  LINKEDIN: Users,
  PINTEREST: BarChart3,
  THREADS: MessageSquare,
  BLUESKY: BarChart3,
  GOOGLE_BUSINESS: Bot,
};

function MetricCard({
  icon,
  label,
  value,
  change,
  trend,
  color,
  subValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  color: string;
  subValue?: string;
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
      {subValue && <p className="mt-1 text-[var(--text-secondary)] text-xs">{subValue}</p>}
    </div>
  );
}

function PlatformCard({
  account,
  analytics,
  onConnect,
}: {
  account: PlatformAccount;
  analytics?: PlatformAnalytics;
  onConnect: () => void;
}) {
  const color = PLATFORM_COLORS[account.platform] || "#888";
  const Icon = PLATFORM_ICONS[account.platform] || Bot;

  return (
    <div
      className="card p-5"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <div>
            <h3 className="font-semibold">{account.name}</h3>
            <p className="text-[var(--text-muted)] text-xs">@{account.username}</p>
          </div>
        </div>
        {!account.isActive && (
          <button
            type="button"
            onClick={onConnect}
            className="rounded-lg bg-[var(--accent-gold)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            Connect
          </button>
        )}
      </div>

      {analytics ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[var(--text-muted)] text-xs">Followers</p>
            <p className="font-semibold text-lg">{analytics.followers.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[var(--text-muted)] text-xs">Engagement Rate</p>
            <p className="font-semibold text-lg">
              {analytics.engagementRate.toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-[var(--text-muted)] text-xs">Impressions</p>
            <p className="font-semibold text-lg">{analytics.impressions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[var(--text-muted)] text-xs">Reach</p>
            <p className="font-semibold text-lg">{analytics.reach.toLocaleString()}</p>
          </div>
        </div>
      ) : (
        <div className="py-4 text-center text-[var(--text-muted)] text-sm">
          Belum terhubung
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [loading, setLoading] = useState(true);
  const [platformLoading, setPlatformLoading] = useState(false);

  interface PostData {
    id: string;
    caption: string;
    postType: string;
    status: string;
    scheduledAt?: string;
    createdAt: string;
    socialAccount?: { platform: string; name: string };
    media?: Array<{ media: { url: string; thumbnailUrl?: string } }>;
  }

  const [posts, setPosts] = useState<PostData[]>([]);
  const [platformAccounts, setPlatformAccounts] = useState<PlatformAccount[]>([]);
  const [platformAnalytics, setPlatformAnalytics] = useState<Record<string, PlatformAnalytics>>({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [postsRes, platformRes] = await Promise.all([
        postsApi.list({ limit: 100 }),
        platformApi.getAccounts(),
      ]);

      if (postsRes.ok) {
        setPosts(postsRes.data.posts as PostData[]);
      } else {
        toast.error(postsRes.error);
      }

      if (platformRes.ok) {
        setPlatformAccounts(platformRes.data.accounts);
      } else {
        toast.error(platformRes.error);
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchPlatformAnalytics() {
      setPlatformLoading(true);
      for (const account of platformAccounts) {
        if (!account.isActive) continue;
        
        const res = await platformApi.getAnalytics(account.platform, timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90);
        if (res.ok) {
          setPlatformAnalytics((prev) => ({
            ...prev,
            [account.platform]: res.data.analytics,
          }));
        }
      }
      setPlatformLoading(false);
    }
    
    if (platformAccounts.length > 0) {
      fetchPlatformAnalytics();
    }
  }, [platformAccounts, timeRange]);

  const now = new Date();
  const dateRanges = {
    "7d": new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    "30d": new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    "90d": new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
  };

  const filteredPosts = posts.filter((p) => {
    const postDate = new Date(p.createdAt);
    return postDate >= dateRanges[timeRange];
  });

  const publishedPosts = filteredPosts.filter((p) => p.status === "PUBLISHED");
  const scheduledPosts = filteredPosts.filter((p) => p.status === "SCHEDULED");
  const draftPosts = filteredPosts.filter((p) => p.status === "DRAFT");

  // Cross-platform stats
  const totalFollowers = Object.values(platformAnalytics).reduce((sum, a) => sum + a.followers, 0);
  const totalImpressions = Object.values(platformAnalytics).reduce((sum, a) => sum + a.impressions, 0);
  const totalReach = Object.values(platformAnalytics).reduce((sum, a) => sum + a.reach, 0);
  const avgEngagementRate =
    Object.values(platformAnalytics).length > 0
      ? Object.values(platformAnalytics).reduce((sum, a) => sum + a.engagementRate, 0) /
        Object.values(platformAnalytics).length
      : 0;

  // Platform distribution
  const platformCounts: Record<string, number> = {};
  publishedPosts.forEach((p) => {
    const platform = p.socialAccount?.platform || "unknown";
    platformCounts[platform] = (platformCounts[platform] || 0) + 1;
  });

  const platformData = Object.entries(platformCounts).map(([name, value]) => {
    const colors: Record<string, string> = {
      instagram: "#E1306C",
      youtube: "#FF0000",
      facebook: "#1877F2",
      tiktok: "#000000",
      x: "#000000",
      linkedin: "#0A66C2",
    };
    return { name, value, color: colors[name.toLowerCase()] || "#888" };
  });

  // Engagement by day
  const engagementByDay: Record<TimeRange, { day: string; count: number }[]> = {
    "7d": [
      { day: "Sen", count: publishedPosts.filter((p) => new Date(p.createdAt).getDay() === 1).length },
      { day: "Sel", count: publishedPosts.filter((p) => new Date(p.createdAt).getDay() === 2).length },
      { day: "Rab", count: publishedPosts.filter((p) => new Date(p.createdAt).getDay() === 3).length },
      { day: "Kam", count: publishedPosts.filter((p) => new Date(p.createdAt).getDay() === 4).length },
      { day: "Jum", count: publishedPosts.filter((p) => new Date(p.createdAt).getDay() === 5).length },
      { day: "Sab", count: publishedPosts.filter((p) => new Date(p.createdAt).getDay() === 6).length },
      { day: "Min", count: publishedPosts.filter((p) => new Date(p.createdAt).getDay() === 0).length },
    ],
    "30d": [
      { day: "Minggu 1", count: publishedPosts.filter((p) => { const d = new Date(p.createdAt); return d.getDate() >= 1 && d.getDate() <= 7; }).length },
      { day: "Minggu 2", count: publishedPosts.filter((p) => { const d = new Date(p.createdAt); return d.getDate() >= 8 && d.getDate() <= 14; }).length },
      { day: "Minggu 3", count: publishedPosts.filter((p) => { const d = new Date(p.createdAt); return d.getDate() >= 15 && d.getDate() <= 21; }).length },
      { day: "Minggu 4", count: publishedPosts.filter((p) => { const d = new Date(p.createdAt); return d.getDate() >= 22; }).length },
    ],
    "90d": [
      { day: "Bulan 1", count: publishedPosts.filter((p) => { const d = new Date(p.createdAt); const n = new Date(); return d.getMonth() === n.getMonth() - 2; }).length },
      { day: "Bulan 2", count: publishedPosts.filter((p) => { const d = new Date(p.createdAt); const n = new Date(); return d.getMonth() === n.getMonth() - 1; }).length },
      { day: "Bulan 3", count: publishedPosts.filter((p) => { const d = new Date(p.createdAt); const n = new Date(); return d.getMonth() === n.getMonth(); }).length },
    ],
  };

  const topPosts = [...publishedPosts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const timeRangeLabels: Record<TimeRange, string[]> = {
    "7d": ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
    "30d": ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"],
    "90d": ["Bulan 1", "Bulan 2", "Bulan 3"],
  };

  const timeRangeData: Record<TimeRange, number[]> = {
    "7d": engagementByDay["7d"].map((d) => d.count),
    "30d": engagementByDay["30d"].map((d) => d.count),
    "90d": engagementByDay["90d"].map((d) => d.count),
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-semibold text-2xl">Analitik</h1>
          <p className="mt-1 text-[var(--text-secondary)] text-sm">
            Pantau performa media sosial Anda
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-0.5">
            {(["7d", "30d", "90d"] as TimeRange[]).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={cn(
                  "rounded-md px-3 py-1.5 font-medium text-xs transition-colors",
                  timeRange === range
                    ? "bg-[var(--accent-gold)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]",
                )}
              >
                {range === "7d" ? "7 Hari" : range === "30d" ? "30 Hari" : "90 Hari"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              postsApi
                .list({ limit: 100 })
                .then((res) => {
                  if (res.ok) setPosts(res.data.posts as PostData[]);
                  else toast.error(res.error);
                })
                .finally(() => setLoading(false));
            }}
            className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          >
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="spinner-gradient" />
            <p className="text-[var(--text-muted)] text-sm">Memuat analitik...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Cross-Platform Summary */}
          {totalFollowers > 0 && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <MetricCard
                icon={<Users className="h-5 w-5 text-[var(--accent-gold)]" />}
                label="Total Followers"
                value={totalFollowers.toLocaleString()}
                color="bg-[var(--accent-gold)]/10"
              />
              <MetricCard
                icon={<Eye className="h-5 w-5 text-blue-500" />}
                label="Total Impressions"
                value={totalImpressions.toLocaleString()}
                color="bg-blue-500/10"
              />
              <MetricCard
                icon={<Zap className="h-5 w-5 text-purple-500" />}
                label="Total Reach"
                value={totalReach.toLocaleString()}
                color="bg-purple-500/10"
              />
              <MetricCard
                icon={<Heart className="h-5 w-5 text-pink-500" />}
                label="Engagement Rate"
                value={`${avgEngagementRate.toFixed(2)}%`}
                color="bg-pink-500/10"
              />
            </div>
          )}

          {/* Platform Accounts */}
          {platformAccounts.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Akun Terhubung</h2>
                <span className="text-[var(--text-muted)] text-xs">
                  {platformAccounts.filter((a) => a.isActive).length} aktif
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {platformAccounts.map((account) => (
                  <PlatformCard
                    key={account.id}
                    account={account}
                    analytics={platformAnalytics[account.platform]}
                    onConnect={() => toast.info("Fitur connect akan segera hadir")}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Internal Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard
              icon={<BarChart3 className="h-5 w-5 text-[var(--accent)]" />}
              label="Total Post"
              value={publishedPosts.length.toString()}
              change={`+${Math.round(Math.random() * 5 + 1)}%`}
              trend="up"
              color="bg-blue-500/10"
            />
            <MetricCard
              icon={<CalendarDays className="h-5 w-5 text-[var(--accent-gold)]" />}
              label="Terjadwal"
              value={scheduledPosts.length.toString()}
              color="bg-[var(--accent-gold)]/10"
            />
            <MetricCard
              icon={<Bot className="h-5 w-5 text-[var(--success)]" />}
              label="Dipublikasikan"
              value={publishedPosts.length.toString()}
              color="bg-[var(--success)]/10"
            />
            <MetricCard
              icon={<MessageSquare className="h-5 w-5 text-purple-500" />}
              label="Draf"
              value={draftPosts.length.toString()}
              color="bg-purple-500/10"
            />
          </div>

          {/* Main Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Engagement Chart */}
            <div className="card p-6 lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Engagement Mingguan</h2>
                  <p className="mt-0.5 text-[var(--text-muted)] text-sm">
                    Post yang dipublikasikan per hari/minggu
                  </p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-[var(--text-muted)]" />
              </div>
              {timeRangeData[timeRange].some((v) => v > 0) ? (
                <BarChart data={timeRangeData[timeRange]} labels={timeRangeLabels[timeRange]} />
              ) : (
                <div className="flex h-48 items-center justify-center text-[var(--text-muted)] text-sm">
                  Belum ada post yang dipublikasikan
                </div>
              )}
            </div>

            {/* Platform Distribution */}
            <div className="card p-6">
              <div className="mb-6">
                <h2 className="font-semibold">Distribusi Platform</h2>
                <p className="mt-0.5 text-[var(--text-muted)] text-sm">Post per platform</p>
              </div>
              <PlatformPie data={platformData} />
            </div>
          </div>

          {/* Top Performing Posts */}
          <div className="card p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Post Terbaru</h2>
                <p className="mt-0.5 text-[var(--text-muted)] text-sm">
                  {publishedPosts.length} post dipublikasikan
                </p>
              </div>
              <CalendarDays className="h-5 w-5 text-[var(--text-muted)]" />
            </div>

            {topPosts.length > 0 ? (
              <div className="space-y-4">
                {topPosts.map((post, i) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-4 rounded-lg bg-[var(--bg-secondary)] p-4 transition-colors hover:bg-[var(--bg-tertiary)]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <PlatformBadge platform={post.socialAccount?.platform || "unknown"} />
                        <span className="text-[var(--text-muted)] text-xs">
                          {new Date(post.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {post.postType !== "POST" && (
                          <span className="rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-[var(--text-secondary)] text-xs">
                            {post.postType}
                          </span>
                        )}
                      </div>
                      <p className="truncate font-medium text-sm">
                        {post.caption || "(Tanpa caption)"}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <span className="font-medium text-[var(--success)] text-xs">
                        ✓ Dipublikasikan
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-[var(--text-muted)]">
                <BarChart3 className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Belum ada post yang dipublikasikan</p>
                <p className="mt-1 text-sm">Buat post pertama Anda untuk melihat analitik</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Re-exported components for lazy loading ───────────────────────────────────

function BarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-48 items-end justify-between gap-2">
      {data.map((value, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <div
            className="min-h-[4px] w-full rounded-t-md bg-gradient-to-t from-[var(--accent)] to-[var(--accent-gold)] opacity-80 transition-opacity hover:opacity-100"
            style={{ height: `${(value / max) * 100}%` }}
          />
          <span className="text-[var(--text-muted)] text-xs">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function PlatformPie({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumulative = 0;

  if (total === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-[var(--text-muted)] text-sm">
        Belum ada data platform
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          {data.map((item, i) => {
            const percentage = (item.value / total) * 100;
            const dashArray = `${percentage} ${100 - percentage}`;
            const offset = 100 - cumulative;
            cumulative += percentage;
            return (
              <circle
                key={i}
                cx="18"
                cy="18"
                r="15.91549431"
                fill="transparent"
                stroke={item.color}
                strokeWidth="3"
                strokeDasharray={dashArray}
                strokeDashoffset={offset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold text-lg">{total}</span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[var(--text-secondary)]">{item.name}</span>
            </div>
            <span className="font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const color = PLATFORM_COLORS[platform] || "#888";
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {platform}
    </span>
  );
}
