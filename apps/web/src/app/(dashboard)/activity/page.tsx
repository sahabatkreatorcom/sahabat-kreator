"use client";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Edit3,
  Filter,
  LogIn,
  RefreshCcw,
  Shield,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type AuditLog, auditApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type ActivityType = AuditLog["action"];

const TYPE_CONFIG: Record<ActivityType, { icon: React.ReactNode; color: string; label: string }> = {
  LOGIN: {
    icon: <LogIn className="h-4 w-4" />,
    color: "bg-green-500/10 text-green-600",
    label: "Login",
  },
  LOGOUT: {
    icon: <LogIn className="h-4 w-4" />,
    color: "bg-gray-500/10 text-gray-600",
    label: "Logout",
  },
  CREATE_POST: {
    icon: <Edit3 className="h-4 w-4" />,
    color: "bg-blue-500/10 text-blue-600",
    label: "Post Dibuat",
  },
  UPDATE_POST: {
    icon: <Edit3 className="h-4 w-4" />,
    color: "bg-yellow-500/10 text-yellow-600",
    label: "Post Diedit",
  },
  DELETE_POST: {
    icon: <Trash2 className="h-4 w-4" />,
    color: "bg-red-500/10 text-red-600",
    label: "Post Dihapus",
  },
  PUBLISH_POST: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-emerald-500/10 text-emerald-600",
    label: "Post Dipublikasikan",
  },
  CONNECT_ACCOUNT: {
    icon: <Shield className="h-4 w-4" />,
    color: "bg-purple-500/10 text-purple-600",
    label: "Akun Digabungkan",
  },
  DISCONNECT_ACCOUNT: {
    icon: <Shield className="h-4 w-4" />,
    color: "bg-orange-500/10 text-orange-600",
    label: "Akun Diputuskan",
  },
  INVITE_MEMBER: {
    icon: <CalendarDays className="h-4 w-4" />,
    color: "bg-pink-500/10 text-pink-600",
    label: "Anggota Diundang",
  },
  REMOVE_MEMBER: {
    icon: <AlertCircle className="h-4 w-4" />,
    color: "bg-red-500/10 text-red-600",
    label: "Anggota Dihapus",
  },
  UPDATE_ROLE: {
    icon: <Shield className="h-4 w-4" />,
    color: "bg-indigo-500/10 text-indigo-600",
    label: "Role Diubah",
  },
  CHANGE_SETTINGS: {
    icon: <Shield className="h-4 w-4" />,
    color: "bg-gray-500/10 text-gray-600",
    label: "Pengaturan Diubah",
  },
  CREATE_INVITATION: {
    icon: <CalendarDays className="h-4 w-4" />,
    color: "bg-teal-500/10 text-teal-600",
    label: "Undangan Dibuat",
  },
  ACCEPT_INVITATION: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-green-500/10 text-green-600",
    label: "Undangan Diterima",
  },
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function getActionDescription(log: AuditLog): string {
  const base = TYPE_CONFIG[log.action as ActivityType]?.label ?? log.action;

  switch (log.action) {
    case "LOGIN":
      return `Login berhasil dari ${log.ipAddress || "browser"}`;
    case "LOGOUT":
      return "Logout";
    case "CREATE_POST":
      return `Post baru dibuat${log.entityType ? ` untuk ${log.entityType}` : ""}`;
    case "UPDATE_POST":
      return `Post diedit${log.entityId ? ` (${log.entityId.slice(0, 8)}...)` : ""}`;
    case "DELETE_POST":
      return `Post dihapus${log.entityId ? ` (${log.entityId.slice(0, 8)}...)` : ""}`;
    case "PUBLISH_POST":
      return `Post dipublikasikan${log.entityId ? ` (${log.entityId.slice(0, 8)}...)` : ""}`;
    case "CONNECT_ACCOUNT":
      return `Akun ${log.metadata?.platform ?? "sosial"} digabungkan`;
    case "DISCONNECT_ACCOUNT":
      return `Akun ${log.metadata?.platform ?? "sosial"} diputuskan`;
    case "INVITE_MEMBER":
    case "CREATE_INVITATION":
      return `Undangan dikirim ke ${log.metadata?.email ?? "anggota"}`;
    case "REMOVE_MEMBER":
      return `Anggota ${log.metadata?.name ?? "diidentifikasi"} dihapus`;
    case "UPDATE_ROLE":
      return `Role diubah menjadi ${log.metadata?.role ?? "role"} untuk ${log.metadata?.name ?? "anggota"}`;
    case "CHANGE_SETTINGS":
      return "Pengaturan organisasi diubah";
    case "ACCEPT_INVITATION":
      return "Undangan diterima";
    default:
      return base;
  }
}

export default function ActivityPage() {
  const [filter, setFilter] = useState<"all" | ActivityType>("all");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  async function fetchLogs() {
    setLoading(true);
    const res = await auditApi.getLogs({ limit: 50 });
    if (res.ok) {
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  }

  const filtered = filter === "all" ? logs : logs.filter((l) => l.action === filter);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-semibold text-2xl">Aktivitas</h1>
          <p className="mt-1 text-[var(--text-secondary)] text-sm">
            Riwayat semua aktivitas di organisasi Anda ({total} total)
          </p>
        </div>
        <button
          type="button"
          onClick={fetchLogs}
          className="flex items-center gap-2 rounded-lg bg-[var(--accent-gold)] px-4 py-2 font-medium text-sm text-white transition-opacity hover:opacity-90"
        >
          <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-[var(--text-muted)]" />
        {[
          { key: "all", label: "Semua" },
          { key: "LOGIN", label: "Login" },
          { key: "CREATE_POST", label: "Post Dibuat" },
          { key: "PUBLISH_POST", label: "Dipublikasikan" },
          { key: "UPDATE_POST", label: "Diedit" },
          { key: "DELETE_POST", label: "Dihapus" },
          { key: "INVITE_MEMBER", label: "Tim" },
        ].map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key as "all" | ActivityType)}
            className={cn(
              "rounded-full px-3 py-1.5 font-medium text-xs transition-colors",
              filter === f.key
                ? "bg-[var(--accent-gold)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="card overflow-hidden">
        <div className="divide-y divide-[var(--border)]">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-4 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-[var(--bg-tertiary)]" />
                  <div className="h-3 w-1/4 rounded bg-[var(--bg-tertiary)]" />
                </div>
              </div>
            ))
          ) : filtered.length > 0 ? (
            filtered.map((activity) => {
              const config = TYPE_CONFIG[activity.action as ActivityType] ?? {
                icon: <AlertCircle className="h-4 w-4" />,
                color: "bg-gray-500/10 text-gray-600",
                label: activity.action,
              };
              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-[var(--bg-secondary)]"
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      config.color,
                    )}
                  >
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{getActionDescription(activity)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[var(--text-muted)] text-xs">{activity.userName}</span>
                      <span className="text-[var(--text-muted)] text-xs">·</span>
                      <span className="flex items-center gap-1 text-[var(--text-muted)] text-xs">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(activity.createdAt)}
                      </span>
                      {activity.ipAddress && (
                        <>
                          <span className="text-[var(--text-muted)] text-xs">·</span>
                          <span className="hidden text-[var(--text-muted)] text-xs sm:block">
                            {activity.ipAddress}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <AlertCircle className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
              <p className="text-[var(--text-secondary)] text-sm">
                {logs.length === 0 ? "Belum ada aktivitas" : "Tidak ada aktivitas untuk filter ini"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
