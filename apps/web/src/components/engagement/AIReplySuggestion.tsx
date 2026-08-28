"use client";

import { Check, Copy, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { aiAssistApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Tone = "sopan" | "kasual" | "profesional" | "humoris";

interface AIReplySuggestionProps {
  comment: string;
  platform?: string;
  onInsert: (text: string) => void;
  className?: string;
}

export function AIReplySuggestion({ comment, platform, onInsert, className }: AIReplySuggestionProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tone, setTone] = useState<Tone>("sopan");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ text: string; tone: Tone }[]>([]);

  const handleGenerate = async () => {
    if (!comment.trim()) return;
    setIsGenerating(true);
    try {
      const res = await aiAssistApi.generateReply(comment, {
        platform,
        tone: tone === "kasual" ? "casual" : tone === "profesional" ? "professional" : tone === "humoris" ? "humorous" : "professional",
      });
      if (res.ok) {
        setSuggestion(res.data.reply);
        setHistory((prev) => [{ text: res.data.reply, tone }, ...prev].slice(0, 5));
        toast.success("Saran AI berhasil dibuat");
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Gagal membuat saran AI");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsert = (text: string) => {
    onInsert(text);
    toast.success("Saran diterapkan ke editor");
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Disalin!");
    setTimeout(() => setCopiedId(null), 1500);
  };

  const tones: { id: Tone; label: string }[] = [
    { id: "sopan", label: "Sopan" },
    { id: "kasual", label: "Kasual" },
    { id: "profesional", label: "Profesional" },
    { id: "humoris", label: "Humoris" },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      {/* Tone selector */}
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-[var(--accent-gold)]" />
        <span className="font-medium text-xs text-[var(--text-muted)]">Nada:</span>
        {tones.map((t) => (
          <button
            key={t.id}
            onClick={() => setTone(t.id)}
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
              tone === t.id
                ? "bg-[var(--accent-gold)] text-white"
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent-gold-light)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !comment.trim()}
        className="w-full gap-2"
        size="sm"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isGenerating ? "Menghasilkan..." : "Buat Saran AI"}
      </Button>

      {/* Generated suggestion */}
      {suggestion && (
        <div className="rounded-lg border border-[var(--accent-gold)]/30 bg-[var(--accent-gold-light)] p-3">
          <p className="whitespace-pre-wrap text-sm">{suggestion}</p>
          <div className="mt-2.5 flex items-center gap-1.5">
            <Button size="sm" onClick={() => handleInsert(suggestion)} className="flex-1 gap-1.5">
              <Check className="h-3.5 w-3.5" />
              Terapkan
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleCopy(suggestion, "copy")}
              className="gap-1.5"
            >
              {copiedId === "copy" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Salin
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSuggestion(null)}
              className="h-7 w-7 p-0 text-[var(--text-muted)]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div>
          <p className="mb-1.5 font-medium text-xs text-[var(--text-muted)]">Riwayat</p>
          <div className="space-y-1.5">
            {history.slice(1).map((h, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSuggestion(h.text);
                  setTone(h.tone);
                }}
                className="flex w-full items-start gap-2 rounded-lg border border-[var(--border)] p-2 text-left transition-colors hover:border-[var(--accent-gold)]/50 hover:bg-[var(--accent-gold-light)]/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs text-[var(--text-secondary)]">{h.text}</p>
                  <p className="mt-0.5 text-[var(--text-muted)] text-xs">
                    {h.tone} · {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-gold)]" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
