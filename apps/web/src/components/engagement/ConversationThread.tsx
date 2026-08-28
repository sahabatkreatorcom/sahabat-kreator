"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  FileText,
  Loader2,
  Send,
  Sparkles,
  Tag,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { engagementApi, aiAssistApi } from "@/lib/api-client";
import type { EngagementItem } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { AIReplySuggestion } from "./AIReplySuggestion";
import { CannedReply } from "./CannedReplies";

interface ConversationThreadProps {
  messages: EngagementItem[];
  onReply: (id: string, content: string) => Promise<void>;
  onBack: () => void;
  onLabelUpdate?: (itemId: string, labelIds: string[]) => void;
}

export function ConversationThread({
  messages,
  onReply,
  onBack,
  onLabelUpdate,
}: ConversationThreadProps) {
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [showCannedReplies, setShowCannedReplies] = useState(false);
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const parentMessage = messages[0];
  const replies = messages.slice(1);

  const handleSend = async () => {
    if (!replyContent.trim() || !parentMessage) return;
    setSending(true);
    await onReply(parentMessage.id, replyContent);
    setReplyContent("");
    setSending(false);
  };

  const handleAiSuggest = async () => {
    if (!parentMessage?.content) return;
    setIsAiLoading(true);
    try {
      const res = await aiAssistApi.generateReply(parentMessage.content, {
        platform: parentMessage.platform,
      });
      if (res.ok) {
        setReplyContent(res.data.reply);
        toast.success("Saran AI diterapkan");
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Gagal mendapatkan saran AI");
    } finally {
      setIsAiLoading(false);
    }
  };

  const insertCannedReply = (text: string) => {
    setReplyContent((prev) => (prev ? prev + "\n" + text : text));
    setShowCannedReplies(false);
  };

  const sentimentIcon = (sentiment?: string) => {
    if (sentiment === "positive")
      return <ThumbsUp className="h-3.5 w-3.5 text-green-500" />;
    if (sentiment === "negative")
      return <ThumbsDown className="h-3.5 w-3.5 text-red-500" />;
    return <span className="h-3.5 w-3.5 inline-block rounded-full bg-gray-400" />;
  };

  const sentimentLabel = (sentiment?: string) => {
    if (sentiment === "positive") return "Positif";
    if (sentiment === "negative") return "Negatif";
    if (sentiment === "neutral") return "Netral";
    return null;
  };

  if (!parentMessage) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[var(--text-muted)] text-sm">Pilih percakapan untuk melihat detail</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] p-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar
          src={parentMessage.authorAvatar}
          alt={parentMessage.authorName || "User"}
          fallback={parentMessage.authorName?.charAt(0) || "?"}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-sm">{parentMessage.authorName}</p>
            <span className="shrink-0 text-[var(--text-muted)] text-xs">@{parentMessage.authorUsername}</span>
          </div>
          <p className="truncate text-[var(--text-muted)] text-xs">
            {parentMessage.platform} · {new Date(parentMessage.createdAt).toLocaleString("id-ID")}
          </p>
        </div>
        {parentMessage.sentiment && (
          <Badge
            variant={
              parentMessage.sentiment === "positive"
                ? "success"
                : parentMessage.sentiment === "negative"
                  ? "danger"
                  : "secondary"
            }
            className="gap-1"
          >
            {sentimentIcon(parentMessage.sentiment)}
            {sentimentLabel(parentMessage.sentiment)}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLabelDialogOpen(true)}
          className="shrink-0"
        >
          <Tag className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Parent message */}
        <div className={cn("flex items-start gap-2", "justify-end")}>
          <div className="max-w-[75%] rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="font-medium text-xs">{parentMessage.authorName}</span>
              <span className="text-[var(--text-muted)] text-xs">@{parentMessage.authorUsername}</span>
            </div>
            <p className="text-[var(--text-primary)] text-sm whitespace-pre-wrap">{parentMessage.content}</p>
            {parentMessage.postCaption && (
              <div className="mt-2 flex items-start gap-1.5 rounded-md border-l-2 border-[var(--accent-gold)] bg-[var(--bg-tertiary)] p-2">
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-gold)]" />
                <p className="text-[var(--text-muted)] text-xs italic">
                  {parentMessage.postCaption.slice(0, 80)}
                  {parentMessage.postCaption.length > 80 ? "..." : ""}
                </p>
              </div>
            )}
            <p className="mt-1.5 text-[var(--text-muted)] text-xs">
              {new Date(parentMessage.createdAt).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* Replies */}
        {replies.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-end gap-2",
              msg.type === "dm" && !msg.isRead ? "justify-end" : "justify-start",
            )}
          >
            {!msg.type.startsWith("dm") && (
              <Avatar
                src={msg.authorAvatar}
                alt={msg.authorName || "User"}
                fallback={msg.authorName?.charAt(0) || "?"}
                size="xs"
              />
            )}
            <div
              className={cn(
                "max-w-[75%] rounded-xl p-3",
                msg.type === "dm" && !msg.isRead
                  ? "bg-[var(--accent-gold)] text-[var(--bg-primary)]"
                  : msg.type === "dm"
                    ? "bg-[var(--bg-secondary)] border border-[var(--border)]"
                    : "border border-[var(--border)] bg-[var(--bg-secondary)]",
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              <p
                className={cn(
                  "mt-1 text-xs",
                  msg.type === "dm" && !msg.isRead ? "opacity-70" : "text-[var(--text-muted)]",
                )}
              >
                {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {replies.length === 0 && (
          <p className="text-center text-[var(--text-muted)] text-sm italic">
            Belum ada balasan. Mulai balasan pertama!
          </p>
        )}
      </div>

      {/* Reply Input */}
      <div className="border-t border-[var(--border)] p-3">
        <div className="space-y-2">
          {/* Toolbar */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAiSuggest}
              disabled={isAiLoading}
              className="h-7 gap-1.5 text-xs"
              title="Saran AI"
            >
              {isAiLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              AI
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCannedReplies(true)}
              className="h-7 gap-1.5 text-xs"
              title="Balasan Cepat"
            >
              <FileText className="h-3.5 w-3.5" />
              Cepat
            </Button>
          </div>

          <div className="flex gap-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Tulis balasan..."
              className="min-h-[80px] flex-1 resize-none text-sm"
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
              className="self-end shrink-0"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Canned Replies Dialog */}
      <CannedReply onInsert={insertCannedReply} onClose={() => setShowCannedReplies(false)} open={showCannedReplies} />

      {/* Label Dialog */}
      <Dialog open={labelDialogOpen} onOpenChange={setLabelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atur Label</DialogTitle>
            <DialogDescription>Pilih label untukConversation ini</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {["Prioritas", "Sudah Dibaca", "Butuh Tindak Lanjut", "Spam"].map((label) => {
              const isActive = selectedLabelIds.includes(label);
              return (
                <label
                  key={label}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all",
                    isActive
                      ? "border-[var(--accent-gold)] bg-[var(--accent-gold-light)]"
                      : "border-[var(--border)] bg-[var(--bg-secondary)]",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => {
                      setSelectedLabelIds((prev) =>
                        e.target.checked ? [...prev, label] : prev.filter((l) => l !== label),
                      );
                    }}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border transition-all",
                      isActive
                        ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]"
                        : "border-[var(--border)]",
                    )}
                  >
                    {isActive && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-sm">{label}</span>
                </label>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setLabelDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                onLabelUpdate?.(parentMessage.id, selectedLabelIds);
                setLabelDialogOpen(false);
                toast.success("Label diperbarui");
              }}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
