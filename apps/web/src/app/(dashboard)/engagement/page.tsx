"use client";

import {
  Check,
  CheckCheck,
  Filter,
  MessageSquare,
  RefreshCcw,
  Reply,
  Search,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type EngagementType = "comment" | "mention" | "dm" | "review";
type Sentiment = "positive" | "neutral" | "negative";

interface EngagementItem {
  id: string;
  type: EngagementType;
  platform: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  content: string;
  sentiment?: Sentiment;
  isRead: boolean;
  isReplied: boolean;
  postId?: string;
  postCaption?: string;
  createdAt: string;
}

interface EngagementStats {
  unreadCount: number;
  unreadByType: Record<EngagementType, number>;
  total: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-pink-500/10 text-pink-600",
  facebook: "bg-blue-500/10 text-blue-600",
  tiktok: "bg-gray-500/10 text-gray-600",
  youtube: "bg-red-500/10 text-red-600",
  twitter: "bg-sky-500/10 text-sky-600",
  linkedin: "bg-blue-700/10 text-blue-700",
};

const TYPE_LABELS: Record<EngagementType, string> = {
  comment: "Komentar",
  mention: "Sebutan",
  dm: "Pesan Langsung",
  review: "Ulasan",
};

const TYPE_ICONS: Record<EngagementType, React.ReactNode> = {
  comment: <MessageSquare className="h-4 w-4" />,
  mention: <MessageSquare className="h-4 w-4" />,
  dm: <MessageSquare className="h-4 w-4" />,
  review: <Star className="h-4 w-4" />,
};

const SENTIMENT_CONFIG: Record<Sentiment, { icon: React.ReactNode; color: string }> = {
  positive: { icon: <ThumbsUp className="h-3 w-3" />, color: "text-green-600" },
  neutral: { icon: <MessageSquare className="h-3 w-3" />, color: "text-gray-500" },
  negative: { icon: <ThumbsDown className="h-3 w-3" />, color: "text-red-600" },
};

export default function EngagementPage() {
  const [items, setItems] = useState<EngagementItem[]>([]);
  const [stats, setStats] = useState<EngagementStats>({
    unreadCount: 0,
    unreadByType: { comment: 0, mention: 0, dm: 0, review: 0 },
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<EngagementType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<EngagementItem | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const fetchEngagement = async () => {
    try {
      const params = new URLSearchParams();
      if (activeFilter !== "all") params.set("type", activeFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/engagement?${params.toString()}`);
      const data = await res.json();

      setItems(data.items || []);
      setStats({
        unreadCount: data.unreadCount || 0,
        unreadByType: data.unreadByType || { comment: 0, mention: 0, dm: 0, review: 0 },
        total: data.total || 0,
      });
    } catch {
      toast.error("Gagal memuat data engagement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngagement();
  }, [activeFilter]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/engagement/sync", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        toast.success(`Berhasil sync ${data.synced} data engagement`);
        await fetchEngagement();
      }
    } catch {
      toast.error("Gagal sync data engagement");
    } finally {
      setSyncing(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/engagement/${id}/read`, { method: "PATCH" });
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      setStats((prev) => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    } catch {
      toast.error("Gagal menandai sebagai dibaca");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/engagement/read-all", { method: "PATCH" });
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setStats((prev) => ({
        ...prev,
        unreadCount: 0,
        unreadByType: { comment: 0, mention: 0, dm: 0, review: 0 },
      }));
      toast.success("Semua ditandai sebagai dibaca");
    } catch {
      toast.error("Gagal menandai semua sebagai dibaca");
    }
  };

  const handleReply = async () => {
    if (!selectedItem || !replyContent.trim()) return;

    try {
      const res = await fetch(`/api/engagement/${selectedItem.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Balasan terkirim");
        setItems((prev) =>
          prev.map((item) =>
            item.id === selectedItem.id ? { ...item, isReplied: true } : item
          )
        );
        setReplyContent("");
        setSelectedItem(null);
      }
    } catch {
      toast.error("Gagal mengirim balasan");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus item engagement ini?")) return;

    try {
      const res = await fetch(`/api/engagement/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        toast.success("Item dihapus");
      }
    } catch {
      toast.error("Gagal menghapus item");
    }
  };

  const filteredItems = items.filter((item) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.content.toLowerCase().includes(query) ||
        item.authorName.toLowerCase().includes(query) ||
        item.authorUsername.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-semibold text-2xl">Engagement</h1>
          <p className="mt-1 text-[var(--text-secondary)] text-sm">
            {stats.total} total · {stats.unreadCount} belum dibaca
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={stats.unreadCount === 0}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 font-medium text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Tandai Semua Dibaca</span>
          </button>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent-gold)] px-3 py-2 font-medium text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <RefreshCcw className={cn("h-4 w-4", syncing && "animate-spin")} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["comment", "mention", "dm", "review"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveFilter(activeFilter === type ? "all" : type)}
            className={cn(
              "card p-4 text-left transition-all hover:shadow-md",
              activeFilter === type && "ring-2 ring-[var(--accent-gold)]"
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[var(--text-muted)] text-xs">{TYPE_LABELS[type]}</span>
              {stats.unreadByType[type] > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-gold)] font-bold text-[10px] text-white">
                  {stats.unreadByType[type]}
                </span>
              )}
            </div>
            <p className="font-bold text-xl">{stats.total}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari engagement..."
            className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] pr-4 pl-9 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-0.5">
          {(["all", "comment", "mention", "dm", "review"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveFilter(type)}
              className={cn(
                "rounded-md px-3 py-1 font-medium text-xs transition-colors",
                activeFilter === type
                  ? "bg-[var(--accent-gold)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
              )}
            >
              {type === "all" ? "Semua" : TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="spinner-gradient" />
            <p className="text-[var(--text-muted)] text-sm">Memuat engagement...</p>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-[var(--text-muted)]" />
          <p className="text-[var(--text-secondary)]">
            {items.length === 0
              ? "Belum ada engagement. Klik Sync untuk mengambil data dari platform."
              : "Tidak ada engagement yang cocok dengan filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "card p-4 transition-all hover:shadow-md",
                !item.isRead && "border-l-4 border-l-[var(--accent-gold)]"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)] font-semibold text-sm text-[var(--text-secondary)]">
                  {item.authorName.charAt(0)}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">{item.authorName}</span>
                    <span className="text-[var(--text-muted)] text-xs">{item.authorUsername}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-medium text-xs",
                        PLATFORM_COLORS[item.platform] || "bg-gray-500/10 text-gray-600"
                      )}
                    >
                      {item.platform}
                    </span>
                    <span className="flex items-center gap-1 text-[var(--text-muted)] text-xs">
                      {TYPE_ICONS[item.type]}
                      {TYPE_LABELS[item.type]}
                    </span>
                    {item.sentiment && (
                      <span className={cn("flex items-center gap-1 text-xs", SENTIMENT_CONFIG[item.sentiment].color)}>
                        {SENTIMENT_CONFIG[item.sentiment].icon}
                      </span>
                    )}
                  </div>

                  <p className="mb-2 text-[var(--text-primary)] text-sm">{item.content}</p>

                  {item.postCaption && (
                    <p className="mb-2 text-[var(--text-muted)] text-xs">
                      Menanggapi: "{item.postCaption}"
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[var(--text-muted)] text-xs">
                    <span>{formatDate(item.createdAt)}</span>
                    {item.isReplied && (
                      <span className="flex items-center gap-1 text-green-600">
                        <Check className="h-3 w-3" /> Dibalas
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(item.id)}
                      className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                      title="Tandai dibaca"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-gold)]"
                    title="Balas"
                  >
                    <Reply className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-600"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 shadow-xl">
            <h3 className="mb-4 font-semibold text-lg">Balas ke {selectedItem.authorName}</h3>

            <div className="mb-4 rounded-lg bg-[var(--bg-tertiary)] p-3">
              <p className="mb-1 font-medium text-sm">{selectedItem.authorName}</p>
              <p className="text-[var(--text-secondary)] text-sm">{selectedItem.content}</p>
            </div>

            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Tulis balasan..."
              className="mb-4 h-24 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedItem(null);
                  setReplyContent("");
                }}
                className="rounded-lg border border-[var(--border)] px-4 py-2 font-medium text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleReply}
                disabled={!replyContent.trim()}
                className="rounded-lg bg-[var(--accent-gold)] px-4 py-2 font-medium text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Kirim Balasan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
