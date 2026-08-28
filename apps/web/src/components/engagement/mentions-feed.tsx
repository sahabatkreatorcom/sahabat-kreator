"use client";

import { AtSign, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { engagementApi } from "@/lib/api-client";
import type { EngagementItem } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface MentionsFeedProps {
  platform?: string;
  onRefresh?: () => void;
}

export function MentionsFeed({ platform, onRefresh }: MentionsFeedProps) {
  const [mentions, setMentions] = useState<EngagementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMentions();
  }, [platform]);

  const fetchMentions = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { type: "mention" };
      if (platform && platform !== "all") params.platform = platform;

      const res = await engagementApi.list(params);
      if (res.ok) {
        setMentions(res.data.items || []);
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Gagal memuat mention");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await engagementApi.markRead(id);
      setMentions((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isRead: true } : m))
      );
    } catch {
      toast.error("Gagal menandai dibaca");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-gold)]" />
      </div>
    );
  }

  if (mentions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AtSign className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
        <p className="font-medium text-[var(--text-muted)]">Belum ada mention</p>
        <p className="text-[var(--text-muted)] text-sm">Mention akan muncul di sini</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[var(--text-muted)] text-sm">{mentions.length} mention</p>
        <Button variant="secondary" size="sm" onClick={fetchMentions}>
          Muat Ulang
        </Button>
      </div>

      {mentions.map((mention) => (
        <div
          key={mention.id}
          className={cn(
            "rounded-lg border p-3 transition-colors",
            mention.isRead
              ? "border-[var(--border)] bg-[var(--bg-primary)]"
              : "border-[var(--accent-gold)]/30 bg-[var(--accent-gold-light)]",
          )}
        >
          <div className="flex items-start gap-3">
            <Avatar
              src={mention.authorAvatar}
              alt={mention.authorName || "User"}
              fallback={mention.authorName?.charAt(0) || "?"}
              size="sm"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{mention.authorName}</span>
                <span className="text-[var(--text-muted)] text-xs">
                  menyebut di {mention.platform}
                </span>
                <span className="text-[var(--text-muted)] text-xs">
                  {new Date(mention.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="mt-1 text-[var(--text-primary)] text-sm">{mention.content}</p>

              {mention.postCaption && (
                <p className="mt-1 text-[var(--text-muted)] text-xs italic">
                  di post: "{mention.postCaption.slice(0, 50)}..."
                </p>
              )}

              <div className="mt-2 flex gap-2">
                {!mention.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkRead(mention.id)}
                    className="h-6 text-xs"
                  >
                    Tandai dibaca
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
