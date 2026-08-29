"use client";

import { AtSign, Loader2, Mail, MessageSquare, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { EngagementItem } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface InboxListProps {
  items: EngagementItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMarkRead: (id: string) => void;
  loading?: boolean;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  comment: <MessageSquare className="h-4 w-4" />,
  dm: <Mail className="h-4 w-4" />,
  mention: <AtSign className="h-4 w-4" />,
  review: <Star className="h-4 w-4" />,
};

const TYPE_LABELS: Record<string, string> = {
  comment: "Komentar",
  dm: "Pesan",
  mention: "Mention",
  review: "Review",
};

export function InboxList({ items, selectedId, onSelect, onMarkRead, loading }: InboxListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-gold)]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <MessageSquare className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
        <p className="font-medium text-[var(--text-muted)]">Inbox kosong</p>
        <p className="text-[var(--text-muted)] text-sm">Tidak ada item baru</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--border)]">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            onSelect(item.id);
            if (!item.isRead) {
              onMarkRead(item.id);
            }
          }}
          className={cn(
            "flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-[var(--bg-secondary)]",
            selectedId === item.id && "bg-[var(--accent-gold-light)]",
            !item.isRead && "border-l-2 border-l-[var(--accent-gold)]",
          )}
        >
          <Avatar
            src={item.authorAvatar}
            alt={item.authorName || "User"}
            fallback={item.authorName?.charAt(0) || "?"}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={cn("font-medium text-sm", !item.isRead && "font-bold")}>
                {item.authorName}
              </span>
              <span className="flex items-center gap-1 text-[var(--text-muted)] text-xs">
                {TYPE_ICONS[item.type]}
                {TYPE_LABELS[item.type] || item.type}
              </span>
            </div>
            <p
              className={cn(
                "truncate text-sm",
                !item.isRead ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]",
              )}
            >
              {item.content}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[var(--text-muted)] text-xs">{item.platform}</span>
              <span className="text-[var(--text-muted)] text-xs">
                {new Date(item.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
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
            </div>
          </div>
          {!item.isRead && (
            <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent-gold)]" />
          )}
        </button>
      ))}
    </div>
  );
}
