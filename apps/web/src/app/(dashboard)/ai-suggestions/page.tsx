"use client";

import { Check, Copy, Lightbulb, Loader2, MessageSquare, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { suggestionApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const TONES = [
  { value: "casual", label: "Santai", icon: "😎" },
  { value: "professional", label: "Profesional", icon: "💼" },
  { value: "humorous", label: "Lucu", icon: "😄" },
  { value: "inspirational", label: "Inspiratif", icon: "✨" },
] as const;

const GOALS = [
  { value: "engagement", label: "Engagement", icon: "💬" },
  { value: "followers", label: "Followers", icon: "👥" },
  { value: "sales", label: "Penjualan", icon: "💰" },
  { value: "awareness", label: "Awareness", icon: "📢" },
] as const;

interface ContentSuggestion {
  title: string;
  caption: string;
  hashtags: string[];
  tip: string;
}

export default function AISuggestionsPage() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("casual");
  const [goal, setGoal] = useState("engagement");
  const [platform, setPlatform] = useState("");
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [source, setSource] = useState<"ai" | "fallback" | null>(null);

  async function generateSuggestions() {
    if (!topic.trim()) {
      toast.error("Masukkan topik terlebih dahulu");
      return;
    }

    setLoading(true);
    const res = await suggestionApi.generateContent({
      topic: topic.trim(),
      platform: platform || undefined,
      tone: tone as any,
      goal: goal as any,
    });

    if (res.ok) {
      setSuggestions(res.data.suggestions);
      setSource(res.data.source);
      if (res.data.source === "fallback") {
        toast.info("Menggunakan saran template (AI tidak tersedia)");
      }
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  }

  async function copyCaption(id: string, caption: string) {
    await navigator.clipboard.writeText(caption);
    setCopiedId(id);
    toast.success("Caption disalin!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-gold)]/10">
          <Sparkles className="h-5 w-5 text-[var(--accent-gold)]" />
        </div>
        <div>
          <h1 className="font-semibold text-2xl">SK AI</h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Dapatkan ide konten kreatif dari AI
          </p>
        </div>
      </div>

      {/* Input Section */}
      <div className="card space-y-4 p-6">
        <div>
          <label htmlFor="sk-topic" className="mb-2 block font-medium text-sm">
            Topik / Ide Konten
          </label>
          <textarea
            id="sk-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Contoh: Tips skincare untuk kulit berminyak, Review produk baru, Behind the scene bisnis..."
            className="h-24 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Platform */}
          <div>
            <label htmlFor="sk-platform" className="mb-2 block font-medium text-sm">
              Platform (Opsional)
            </label>
            <select
              id="sk-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
            >
              <option value="">Semua Platform</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>

          {/* Goal */}
          <div>
            <label className="mb-2 block font-medium text-sm">Tujuan</label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGoal(g.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all",
                    goal === g.value
                      ? "bg-[var(--accent-gold)] text-white"
                      : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]",
                  )}
                >
                  <span>{g.icon}</span>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tone */}
        <div>
          <label className="mb-2 block font-medium text-sm">Gaya Bahasa</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTone(t.value)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 transition-all",
                  tone === t.value
                    ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10"
                    : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--border-accent)]",
                )}
              >
                <span className="text-lg">{t.icon}</span>
                <span className="font-medium text-sm">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={generateSuggestions}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-gold)] px-6 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              AI Sedang Bekerja...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Generate Saran
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              {suggestions.length} Saran untuk &quot;{topic.slice(0, 30)}
              {topic.length > 30 ? "..." : ""}&quot;
              {source === "fallback" && (
                <span className="ml-2 font-normal text-[var(--text-muted)] text-xs">
                  (template)
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={generateSuggestions}
              disabled={loading}
              className="flex items-center gap-1 text-[var(--text-secondary)] text-sm transition-colors hover:text-[var(--text-primary)]"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Generate Ulang
            </button>
          </div>

          <div className="grid gap-4">
            {suggestions.map((sug, idx) => (
              <div key={idx} className="card space-y-4 p-5">
                {/* Title */}
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-gold)]/10 font-semibold text-[var(--accent-gold)] text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold">{sug.title}</h3>
                    <p className="mt-1 flex items-center gap-1 text-[var(--text-muted)] text-xs">
                      <Lightbulb className="h-3 w-3" />
                      {sug.tip}
                    </p>
                  </div>
                </div>

                {/* Caption */}
                <div className="space-y-3 rounded-xl bg-[var(--bg-secondary)] p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{sug.caption}</p>

                  {/* Hashtags */}
                  <div className="flex flex-wrap gap-1.5">
                    {sug.hashtags.map((tag, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-[var(--accent-gold)]/10 px-2 py-1 font-medium text-[var(--accent-gold)] text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyCaption(`${idx}`, sug.caption)}
                    className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-secondary)] px-4 py-2 font-medium text-sm transition-colors hover:bg-[var(--bg-tertiary)]"
                  >
                    {copiedId === `${idx}` ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" /> Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> Salin Caption
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && suggestions.length === 0 && (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-gold)]/10">
            <MessageSquare className="h-8 w-8 text-[var(--accent-gold)]" />
          </div>
          <h3 className="mb-2 font-semibold text-lg">Siap Mencari Inspirasi?</h3>
          <p className="mx-auto max-w-md text-[var(--text-secondary)] text-sm">
            Masukkan topik atau ide konten di atas, dan AI akan menghasilkan saran caption, hashtag,
            serta tips untukmu.
          </p>
        </div>
      )}
    </div>
  );
}
