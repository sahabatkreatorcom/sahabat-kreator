"use client";

import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { EngagementItem } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface ConversationThreadProps {
  messages: EngagementItem[];
  onReply: (id: string, content: string) => Promise<void>;
  onBack: () => void;
}

export function ConversationThread({ messages, onReply, onBack }: ConversationThreadProps) {
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!replyContent.trim() || !messages[0]) return;
    setSending(true);
    await onReply(messages[0].id, replyContent);
    setReplyContent("");
    setSending(false);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-[var(--border)] border-b p-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar
          src={messages[0]?.authorAvatar}
          alt={messages[0]?.authorName || "User"}
          fallback={messages[0]?.authorName?.charAt(0) || "?"}
          size="sm"
        />
        <div>
          <p className="font-medium text-sm">{messages[0]?.authorName}</p>
          <p className="text-[var(--text-muted)] text-xs">@{messages[0]?.authorUsername}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {[...messages].reverse().map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "max-w-[80%] rounded-lg p-3",
              msg.type === "dm" && !msg.isRead
                ? "ml-auto bg-[var(--accent-gold)] text-[var(--bg-primary)]"
                : msg.type === "dm"
                  ? "ml-auto bg-[var(--bg-secondary)]"
                  : "bg-[var(--bg-secondary)]",
            )}
          >
            <p className="text-sm">{msg.content}</p>
            <p className="mt-1 text-xs opacity-60">
              {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ))}
      </div>

      {/* Reply Input */}
      <div className="border-[var(--border)] border-t p-3">
        <div className="flex gap-2">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Tulis pesan..."
            className="min-h-[60px] flex-1 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={sending || !replyContent.trim()}
            className="self-end"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
