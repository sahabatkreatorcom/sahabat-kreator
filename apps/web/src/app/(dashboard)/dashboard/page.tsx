"use client";

import {
  ArrowUpRight,
  BarChart3,
  Calendar,
  Clock,
  FileText,
  Plus,
  RefreshCcw,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlanBadge } from "@/components/ui/plan-badge";
import { accountsApi, postsApi } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");
  const [loading, setLoading] = useState(true);

  // Stats state
  const [totalPosts, setTotalPosts] = useState(0);
  const [scheduledPosts, setScheduledPosts] = useState(0);
  const [publishedPosts, setPublishedPosts] = useState(0);
  const [draftPosts, setDraftPosts] = useState(0);
  const [connectedAccounts, setConnectedAccounts] = useState(0);

  const userName =
    (session?.user as unknown as { name?: string })?.name?.split(" ")[0] || "Kreator";

  const tier = (session?.user as unknown as { tier?: string })?.tier ?? "FREE";

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch posts
        const postsRes = await postsApi.list({ limit: 1000 });
        if (postsRes.ok) {
          const posts = postsRes.data.posts as any[];
          const now = new Date();
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

          setTotalPosts(posts.length);
          setScheduledPosts(posts.filter((p) => p.status === "SCHEDULED").length);
          setPublishedPosts(posts.filter((p) => p.status === "PUBLISHED").length);
          setDraftPosts(posts.filter((p) => p.status === "DRAFT").length);
        } else {
          toast.error(postsRes.error);
        }

        // Fetch accounts
        const accountsRes = await accountsApi.list();
        if (accountsRes.ok) {
          setConnectedAccounts(accountsRes.data.accounts.length);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Selamat datang, {userName}!</h1>
          <p className="mt-1 text-[var(--text-secondary)] text-sm">
            Berikut ringkasan media sosial Anda
          </p>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex rounded-lg border border-[var(--border)] p-1">
            <button
              type="button"
              onClick={() => setTimeRange("7d")}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium text-xs transition-colors",
                timeRange === "7d"
                  ? "bg-[var(--accent-gold)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]",
              )}
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => setTimeRange("30d")}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium text-xs transition-colors",
                timeRange === "30d"
                  ? "bg-[var(--accent-gold)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]",
              )}
            >
              30 Hari
            </button>
          </div>
          <PlanBadge tier={tier} />
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
            title="Refresh data"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile Plan Badge */}
      <div className="mb-4 flex items-center gap-2 md:hidden">
        <PlanBadge tier={tier} />
      </div>

      {/* Quick Actions */}
      <div className="mb-6 hidden gap-3 md:flex">
        <Link href="/compose">
          <Button>
            <Plus className="h-4 w-4" />
            Buat Post
          </Button>
        </Link>
        <Link href="/calendar">
          <Button variant="secondary">
            <Calendar className="h-4 w-4" />
            Lihat Kalender
          </Button>
        </Link>
        <Link href="/analytics">
          <Button variant="ghost">
            <BarChart3 className="h-4 w-4" />
            Analitik
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse p-4">
              <div className="mb-3 h-4 w-1/2 rounded bg-[var(--bg-tertiary)]" />
              <div className="mb-2 h-8 w-1/3 rounded bg-[var(--bg-tertiary)]" />
              <div className="h-3 w-2/3 rounded bg-[var(--bg-tertiary)]" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              icon={<FileText className="h-5 w-5 text-[var(--accent-gold)]" />}
              title="Total Post"
              value={totalPosts.toString()}
              description="Semua postingan"
            />
            <StatCard
              icon={<Clock className="h-5 w-5 text-[var(--info)]" />}
              title="Terjadwal"
              value={scheduledPosts.toString()}
              description="Menunggu publikasi"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5 text-[var(--success)]" />}
              title="Dipublikasikan"
              value={publishedPosts.toString()}
              description="Periode ini"
            />
            <StatCard
              icon={<FileText className="h-5 w-5 text-[var(--warning)]" />}
              title="Draf"
              value={draftPosts.toString()}
              description="Perlu dikerjakan"
            />
          </>
        )}
      </div>

      {/* Connected Accounts Quick View */}
      <div className="card mb-6 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-gold-light)]">
              <BarChart3 className="h-5 w-5 text-[var(--accent-gold)]" />
            </div>
            <div>
              <p className="font-medium">Akun Terhubung</p>
              <p className="text-[var(--text-muted)] text-sm">
                {connectedAccounts} akun media sosial
              </p>
            </div>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-1 text-[var(--accent-gold)] text-sm hover:underline"
          >
            Kelola Akun <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's Focus */}
        <div className="card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-lg">Fokus Hari Ini</h2>
            <Link
              href="/compose"
              className="flex items-center gap-1 text-[var(--accent-gold)] text-sm hover:underline"
            >
              Buat Post <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            <EmptyTask
              icon={<Sparkles className="h-5 w-5" />}
              title="Buat konten untuk minggu depan"
              description="Rencanakan 5-7 post untuk meningkatkan konsistensi"
              href="/compose"
            />
            <EmptyTask
              icon={<Calendar className="h-5 w-5" />}
              title="Review jadwal kalender"
              description="Periksa post yang dijadwalkan dan pastikan semuanya siap"
              href="/calendar"
            />
            <EmptyTask
              icon={<BarChart3 className="h-5 w-5" />}
              title="Cek performa post terakhir"
              description="Pahami apa yang berhasil dan optimasi ke depannya"
              href="/analytics"
            />
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h2 className="font-semibold">SK AI</h2>
          </div>

          <p className="mb-4 text-[var(--text-secondary)] text-sm">
            Dapatkan ide konten kreatif dari AI untuk media sosial Anda.
          </p>

          <Link
            href="/sk"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-gold)] py-2.5 font-medium text-sm text-white transition-opacity hover:opacity-90"
          >
            <Zap className="h-4 w-4" />
            Buka SK AI
          </Link>
        </div>
      </div>

      {/* Quick Stats Chart Placeholder */}
      <div className="card mt-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-lg">Performa Engagement</h2>
          <select
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-[var(--text-primary)] text-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as "7d" | "30d")}
          >
            <option value="7d">7 Hari Terakhir</option>
            <option value="30d">30 Hari Terakhir</option>
          </select>
        </div>
        <div className="flex h-48 items-center justify-center rounded-lg border-2 border-[var(--border)] border-dashed">
          <div className="text-center">
            <BarChart3 className="mx-auto mb-2 h-12 w-12 text-[var(--text-muted)]" />
            <p className="text-[var(--text-secondary)] text-sm">
              {publishedPosts > 0
                ? `Total ${publishedPosts} post dipublikasikan`
                : "Grafik engagement akan muncul setelah ada data"}
            </p>
            <p className="mt-1 text-[var(--text-muted)] text-xs">
              Hubungkan akun media sosial Anda untuk mulai melihat analitik
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[var(--text-secondary)] text-xs">{title}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="font-bold text-2xl">{value}</p>
      </div>
      <p className="mt-1 text-[var(--text-muted)] text-xs">{description}</p>
    </div>
  );
}

function EmptyTask({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href as `/` as any}
      className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-[var(--bg-tertiary)]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] transition-colors group-hover:bg-[var(--accent-gold-light)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{title}</p>
        <p className="mt-0.5 text-[var(--text-muted)] text-xs">{description}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent-gold)]" />
    </Link>
  );
}
