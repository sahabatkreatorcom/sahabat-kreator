"use client";

import { Loader2, Reply } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { EngagementItem } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface CommentCardProps {
  item: EngagementItem;
  onMarkRead: (id: string) => void;
  onReply: (id: string, content: string) => Promise<void>;
}

export function CommentCard({ item, onMarkRead, onReply }: CommentCardProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    setSending(true);
    await onReply(item.id, replyContent);
    setReplyContent("");
    setReplyOpen(false);
    setSending(false);
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        item.isRead
          ? "border-[var(--border)] bg-[var(--bg-primary)]"
          : "border-[var(--accent-gold)]/30 bg-[var(--accent-gold-light)]",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar
          src={item.authorAvatar}
          alt={item.authorName || "User"}
          fallback={item.authorName?.charAt(0) || "?"}
          size="sm"
        />

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{item.authorName}</span>
            <span className="text-[var(--text-muted)] text-xs">@{item.authorUsername}</span>
            {item.sentiment && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  item.sentiment === "positive" && "bg-green-500/20 text-green-500",
                  item.sentiment === "neutral" && "bg-gray-500/20 text-gray-500",
                  item.sentiment === "negative" && "bg-red-500/20 text-red-500",
                )}
              >
                {item.sentiment === "positive"
                  ? "Positif"
                  : item.sentiment === "negative"
                    ? "Negatif"
                    : "Netral"}
              </span>
            )}
            <span className="text-[var(--text-muted)] text-xs">
              {new Date(item.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <p className="text-[var(--text-primary)] text-sm">{item.content}</p>

          {item.postCaption && (
            <p className="text-[var(--text-muted)] text-xs italic">
              di post: "{item.postCaption.slice(0, 60)}..."
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            {!item.isRead && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkRead(item.id)}
                className="h-7 text-xs"
              >
                Tandai dibaca
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyOpen(!replyOpen)}
              className="h-7 gap-1 text-xs"
            >
              <Reply className="h-3 w-3" />
              Balas
            </Button>
          </div>

          {/* Reply Input */}
          {replyOpen && (
            <div className="space-y-2 pt-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Tulis balasan..."
                className="min-h-[80px] text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleReply} disabled={sending || !replyContent.trim()}>
                  {sending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                  Kirim
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setReplyOpen(false)}>
                  Batal
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
