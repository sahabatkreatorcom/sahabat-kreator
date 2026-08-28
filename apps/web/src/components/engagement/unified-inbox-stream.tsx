"use client";

import { Loader2, MessageSquare, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { engagementApi } from "@/lib/api-client";
import type { EngagementItem } from "@/lib/api-client";
import { CommentCard } from "./comment-card";

interface UnifiedInboxStreamProps {
  filter?: string;
  platform?: string;
}

export function UnifiedInboxStream({ filter, platform }: UnifiedInboxStreamProps) {
  const [items, setItems] = useState<EngagementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [filter, platform]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filter && filter !== "all") params.type = filter;
      if (platform && platform !== "all") params.platform = platform;

      const res = await engagementApi.list(params);
      if (res.ok) {
        setItems(res.data.items || []);
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Gagal memuat inbox");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await engagementApi.markRead(id);
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
      );
    } catch {
      toast.error("Gagal menandai dibaca");
    }
  };

  const handleReply = async (id: string, content: string) => {
    try {
      const res = await engagementApi.reply(id, content);
      if (res.ok) {
        toast.success("Balasan terkirim!");
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isReplied: true } : item)),
        );
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Gagal mengirim balasan");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-gold)]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[var(--text-muted)] text-sm">{items.length} item</p>
        <Button variant="secondary" size="sm" onClick={handleSync} disabled={syncing} className="gap-2">
          <RefreshCcw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          Sinkronkan
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] py-12">
          <MessageSquare className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
          <p className="font-medium text-[var(--text-muted)]">Inbox kosong</p>
          <p className="text-[var(--text-muted)] text-sm">Belum ada engagement baru</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <CommentCard
              key={item.id}
              item={item}
              onMarkRead={handleMarkRead}
              onReply={handleReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
