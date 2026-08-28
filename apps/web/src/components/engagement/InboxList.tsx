"use client";

import {
  Archive,
  Check,
  CheckCheck,
  Filter,
  Loader2,
  Mail,
  MessageSquare,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { engagementApi } from "@/lib/api-client";
import type { EngagementItem } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { InboxLabels } from "./InboxLabels";

interface InboxListProps {
  onSelect: (item: EngagementItem) => void;
  selectedId?: string | null;
}

type SentimentFilter = "all" | "positive" | "neutral" | "negative";

const TYPE_CONFIG: Record<
  EngagementItem["type"],
  { icon: React.ReactNode; label: string; color: string }
> = {
  comment: { icon: <MessageSquare className="h-3.5 w-3.5" />, label: "Komentar", color: "bg-blue-500/10 text-blue-500" },
  mention: { icon: <Mail className="h-3.5 w-3.5" />, label: "Mention", color: "bg-purple-500/10 text-purple-500" },
  dm: { icon: <Star className="h-3.5 w-3.5" />, label: "Pesan", color: "bg-amber-500/10 text-amber-500" },
  review: { icon: <Star className="h-3.5 w-3.5" />, label: "Review", color: "bg-green-500/10 text-green-500" },
};

export function InboxList({ onSelect, selectedId }: InboxListProps) {
  const [items, setItems] = useState<EngagementItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all");
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchItems = async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const res = await engagementApi.list(params);
      if (res.ok) {
        setItems(res.data.items || []);
        setUnreadCount(res.data.unreadCount ?? 0);
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Gagal memuat inbox");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleMarkRead = async (id: string) => {
    const res = await engagementApi.markRead(id);
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isRead: true } : i)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } else {
      toast.error(res.error);
    }
  };

  const handleMarkAllRead = async () => {
    const res = await engagementApi.markAllRead();
    if (res.ok) {
      setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
      setUnreadCount(0);
      toast.success("Semua ditandai dibaca");
    } else {
      toast.error(res.error);
    }
  };

  const handleArchive = async (id: string) => {
    const res = await engagementApi.delete(id);
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Diar Arsipkan");
    } else {
      toast.error(res.error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await engagementApi.sync();
      if (res.ok) {
        toast.success(`${res.data.synced} item baru disinkronkan`);
        fetchItems();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Gagal sinkronisasi");
    } finally {
      setSyncing(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (sentimentFilter !== "all" && item.sentiment !== sentimentFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.content.toLowerCase().includes(q) ||
        item.authorName.toLowerCase().includes(q) ||
        item.authorUsername.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unreadByType = items.filter((i) => !i.isRead).reduce<Record<string, number>>((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex h-full flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-[var(--border)] p-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">Inbox</h2>
          {unreadCount > 0 && (
            <Badge variant="default" className="gap-1">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={unreadCount === 0} className="h-7 text-xs gap-1">
            <CheckCheck className="h-3.5 w-3.5" />
            Semua Dibaca
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSync} disabled={syncing} className="h-7 text-xs gap-1">
            <span className={cn(syncing && "animate-spin")}>
              <Filter className="h-3.5 w-3.5" />
            </span>
            Sync
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowLabels(true)} className="h-7 text-xs gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            Label
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-[var(--border)] p-2">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pesan..."
            className="h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] pr-9 pl-9 text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-gold)]/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] p-2">
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-0.5">
          {(["all", "comment", "mention", "dm", "review"] as const).map((type) => {
            const count = type === "all" ? unreadCount : (unreadByType[type] ?? 0);
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  typeFilter === type
                    ? "bg-[var(--accent-gold)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]",
                )}
              >
                {type === "all" ? "Semua" : TYPE_CONFIG[type]?.label || type}
                {count > 0 && type !== "all" && (
                  <span className="ml-1 rounded-full bg-white/20 px-1 py-0.5 text-[10px]">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-0.5">
          {(["all", "positive", "neutral", "negative"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSentimentFilter(s)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                sentimentFilter === s
                  ? "bg-[var(--accent-gold)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]",
              )}
            >
              {s === "all" ? "Semua" : s === "positive" ? "Positif" : s === "negative" ? "Negatif" : "Netral"}
            </button>
          ))}
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-gold)]" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
            <p className="font-medium text-[var(--text-muted)]">Inbox kosong</p>
            <p className="text-[var(--text-muted)] text-sm">Tidak ada item baru</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-[var(--bg-secondary)]",
                  selectedId === item.id && "bg-[var(--accent-gold-light)]",
                  !item.isRead && "border-l-2 border-l-[var(--accent-gold)]",
                )}
                onClick={() => onSelect(item)}
              >
                <Avatar
                  src={item.authorAvatar}
                  alt={item.authorName || "User"}
                  fallback={item.authorName?.charAt(0) || "?"}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("font-medium text-sm truncate", !item.isRead && "font-bold")}>
                      {item.authorName}
                    </span>
                    <span className="shrink-0 text-[var(--text-muted)] text-xs">@{item.authorUsername}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs", TYPE_CONFIG[item.type]?.color)}>
                      {TYPE_CONFIG[item.type]?.label}
                    </span>
                  </div>
                  <p className={cn("truncate text-sm", !item.isRead ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>
                    {item.content}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[var(--text-muted)] text-xs">{item.platform}</span>
                    <span className="text-[var(--text-muted)] text-xs">
                      {new Date(item.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {item.sentiment && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-xs",
                          item.sentiment === "positive" && "bg-green-500/20 text-green-500",
                          item.sentiment === "neutral" && "bg-gray-500/20 text-gray-500",
                          item.sentiment === "negative" && "bg-red-500/20 text-red-500",
                        )}
                      >
                        {item.sentiment === "positive" ? "✓" : item.sentiment === "negative" ? "!" : "—"}
                      </span>
                    )}
                    {item.isReplied && (
                      <span className="flex items-center gap-1 text-green-500 text-xs">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>
                {/* Quick actions on hover */}
                <div className="hidden shrink-0 items-center gap-1 group-hover:flex">
                  {!item.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(item.id);
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchive(item.id);
                    }}
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {!item.isRead && <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent-gold)]" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Labels panel */}
      {showLabels && <InboxLabels onClose={() => setShowLabels(false)} />}
    </div>
  );
}
