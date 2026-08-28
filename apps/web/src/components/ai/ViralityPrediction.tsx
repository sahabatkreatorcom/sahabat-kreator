"use client";

import { useState } from "react";
import {
  Brain,
  Copy,
  ThumbsDown,
  ThumbsUp,
  Sparkles,
  Check,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface HookResult {
  id: string;
  text: string;
  type: "question" | "statement" | "number" | "controversial" | "story";
  rating?: number;
}

interface ViralityPredictionProps {
  content?: string;
  postType?: string;
  platform?: string;
  hashtags?: string[];
  onImprove?: (suggestions: string[]) => void;
}

const SCORE_THRESHOLDS = {
  excellent: { min: 80, label: "Sangat Virial", color: "bg-green-500" },
  good: { min: 60, label: "Potensial", color: "bg-blue-500" },
  moderate: { min: 40, label: "Cukup", color: "bg-yellow-500" },
  low: { min: 0, label: "Perlu Peningkatan", color: "bg-red-500" },
};

const HOOK_TYPES = ["question", "statement", "number", "controversial", "story"] as const;
const HOOK_TYPE_LABELS: Record<string, string> = {
  question: "Pertanyaan",
  statement: "Pernyataan",
  number: "Angka",
  controversial: "Kontroversial",
  story: "Cerita",
};

function calculateViralityScore(
  content: string,
  postType: string,
  platform: string,
  hashtags: string[],
): { score: number; factors: { name: string; value: number; max: number }[] } {
  const words = content.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const hashtagCount = hashtags.length;
  const hasEmoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(content);
  const hasQuestion = /\?/.test(content);
  const hasNumber = /\d+/.test(content);
  const hasStrongWords = /\b!(?!.*\?!|.*\.\!)|\bwow\b|\bharus\b|\btidak\b|\bsangat\b|\bseru\b|\bluar biasa\b/i.test(content);

  const hookStrength = Math.min(
    100,
    (wordCount > 10 ? 30 : wordCount > 5 ? 20 : 10) +
      (hasQuestion ? 15 : 0) +
      (hasNumber ? 15 : 0) +
      (hasStrongWords ? 20 : 0) +
      (hasEmoji ? 10 : 0) +
      (wordCount > 100 ? 10 : wordCount > 50 ? 5 : 0),
  );

  const timingFactor = postType === "REEL" || postType === "STORY" ? 15 : 10;
  const hashtagCoverage = Math.min(30, hashtagCount * 5);
  const platformFit = platform === "instagram" ? 15 : platform === "tiktok" ? 12 : 8;

  const total = Math.min(100, hookStrength + timingFactor + hashtagCoverage + platformFit);

  return {
    score: total,
    factors: [
      { name: "Kekuatan Hook", value: hookStrength, max: 90 },
      { name: "Waktu Posting", value: timingFactor, max: 15 },
      { name: "Cakupan Hashtag", value: hashtagCoverage, max: 30 },
      { name: "Kesesuaian Platform", value: platformFit, max: 15 },
    ],
  };
}

function generateHooks(topic: string): HookResult[] {
  const topics = topic.split(",").map((t) => t.trim());
  const mainTopic = topics[0] || "konten";

  const templates: HookResult[] = [
    {
      id: "1",
      text: `Ternyata ${mainTopic} ini bisa mengubah cara kamu...`,
      type: "statement",
    },
    {
      id: "2",
      text: `5 hal yang jarang orang tahu tentang ${mainTopic}`,
      type: "number",
    },
    {
      id: "3",
      text: `Apa sebenarnya yang membuat ${mainTopic} berbeda?`,
      type: "question",
    },
    {
      id: "4",
      text: `Banyak yang bilang ${mainTopic} itu sia-sia, tapi coba lihat ini`,
      type: "controversial",
    },
    {
      id: "5",
      text: `Cerita pertama kali saya mencoba ${mainTopic}...`,
      type: "story",
    },
  ];

  return templates;
}

export function ViralityPrediction({
  content = "",
  postType = "POST",
  platform = "instagram",
  hashtags = [],
  onImprove,
}: ViralityPredictionProps) {
  const [localContent, setLocalContent] = useState(content);
  const [result, setResult] = useState<{ score: number; factors: { name: string; value: number; max: number }[] } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyze = () => {
    const text = localContent || content;
    if (!text.trim()) {
      toast.error("Masukkan konten terlebih dahulu");
      return;
    }
    setAnalyzing(true);
    setTimeout(() => {
      const res = calculateViralityScore(text, postType, platform, hashtags);
      setResult(res);
      setAnalyzing(false);
    }, 800);
  };

  const getThreshold = (score: number) => {
    if (score >= 80) return SCORE_THRESHOLDS.excellent;
    if (score >= 60) return SCORE_THRESHOLDS.good;
    if (score >= 40) return SCORE_THRESHOLDS.moderate;
    return SCORE_THRESHOLDS.low;
  };

  const suggestions = result
    ? result.factors
        .filter((f) => f.value < f.max * 0.7)
        .map((f) => `Tingkatkan ${f.name.toLowerCase()} (saat ini: ${f.value}/${f.max})`)
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-[var(--accent-gold)]" />
          <CardTitle>Prediksi Viralitas</CardTitle>
        </div>
        <p className="text-[var(--text-secondary)] text-sm">
          Analisis potensi virality post Anda menggunakan AI
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Tempel caption atau konten post di sini..."
          value={localContent}
          onChange={(e) => {
            setLocalContent(e.target.value);
            setResult(null);
          }}
          className="min-h-[100px]"
        />

        <div className="flex gap-2">
          <Button onClick={analyze} isLoading={analyzing}>
            <Sparkles className="h-4 w-4 mr-2" />
            Analisis
          </Button>
          {result && (
            <Button variant="secondary" onClick={() => setResult(null)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Ulangi
            </Button>
          )}
        </div>

        {result && (
          <div className="space-y-4 pt-2">
            {/* Score circle */}
            <div className="flex items-center gap-6">
              <div className="relative h-24 w-24 shrink-0">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--bg-tertiary)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={getThreshold(result.score).color.replace("bg-", "var(--")}
                    strokeWidth="8"
                    strokeDasharray={`${result.score * 2.64} 264`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{result.score}</span>
                  <span className="text-[var(--text-muted)] text-xs">/100</span>
                </div>
              </div>

              <div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-sm px-3 py-1",
                    getThreshold(result.score).color,
                    "text-white",
                  )}
                >
                  {getThreshold(result.score).label}
                </Badge>
                <p className="mt-2 text-[var(--text-muted)] text-xs">
                  Skor didasarkan pada kekuatan hook, waktu posting, cakupan hashtag, dan kesesuaian platform
                </p>
              </div>
            </div>

            {/* Factor breakdown */}
            <div className="space-y-3">
              {result.factors.map((factor) => (
                <div key={factor.name}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[var(--text-secondary)] text-sm">{factor.name}</span>
                    <span className="text-[var(--text-muted)] text-xs">
                      {factor.value}/{factor.max}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        factor.value / factor.max > 0.7
                          ? "bg-green-500"
                          : factor.value / factor.max > 0.4
                            ? "bg-yellow-500"
                            : "bg-red-500",
                      )}
                      style={{ width: `${(factor.value / factor.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
                <p className="font-medium text-sm text-yellow-700 mb-2">Saran Peningkatan</p>
                <ul className="space-y-1">
                  {suggestions.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 text-yellow-700 text-xs">
                      <span>•</span> {s}
                    </li>
                  ))}
                </ul>
                {onImprove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 h-7 text-xs text-yellow-700 hover:bg-yellow-500/20"
                    onClick={() => onImprove(suggestions)}
                  >
                    Terapkan saran
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function HookGenerator({ currentTopic = "" }: { currentTopic?: string }) {
  const [topic, setTopic] = useState(currentTopic);
  const [hooks, setHooks] = useState<HookResult[] | null>(null);
  const [generating, setGenerating] = useState(false);

  const generate = () => {
    if (!topic.trim()) {
      toast.error("Masukkan topik terlebih dahulu");
      return;
    }
    setGenerating(true);
    setTimeout(() => {
      setHooks(generateHooks(topic));
      setGenerating(false);
    }, 600);
  };

  const copyHook = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Hook disalin!");
  };

  const rateHook = (id: string, rating: number) => {
    setHooks((prev) =>
      prev ? prev.map((h) => (h.id === id ? { ...h, rating } : h)) : prev,
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[var(--accent-gold)]" />
          <CardTitle>Generator Hook</CardTitle>
        </div>
        <p className="text-[var(--text-secondary)] text-sm">
          Buat hook menarik untuk meningkatkan engagement post Anda
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Masukkan topik atau kata kunci..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="min-h-[60px]"
          />
        </div>
        <Button onClick={generate} isLoading={generating}>
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Hook
        </Button>

        {hooks && (
          <div className="space-y-3 pt-2">
            {hooks.map((hook, index) => (
              <div
                key={hook.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {HOOK_TYPE_LABELS[hook.type]}
                    </Badge>
                    <span className="text-[var(--text-muted)] text-xs">#{index + 1}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => copyHook(hook.text)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="mt-2 font-medium text-sm">{hook.text}</p>
                <div className="mt-2 flex gap-1">
                  <button
                    onClick={() => rateHook(hook.id, 1)}
                    className={cn(
                      "rounded p-1 transition-colors",
                      hook.rating === 1
                        ? "bg-green-500/20 text-green-500"
                        : "text-[var(--text-muted)] hover:text-green-500",
                    )}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => rateHook(hook.id, -1)}
                    className={cn(
                      "rounded p-1 transition-colors",
                      hook.rating === -1
                        ? "bg-red-500/20 text-red-500"
                        : "text-[var(--text-muted)] hover:text-red-500",
                    )}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>
                  {hook.rating !== undefined && (
                    <span className="text-[var(--text-muted)] text-xs self-center ml-1">
                      {hook.rating > 0 ? "👍" : "👎"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
