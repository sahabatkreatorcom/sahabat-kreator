"use client";

import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { aiCaptionApi } from "@/lib/api-client";

interface AiCaptionGeneratorProps {
  onApplyCaption: (caption: string) => void;
  currentCaption?: string;
  platform?: string;
}

export function AiCaptionGenerator({
  onApplyCaption,
  currentCaption,
  platform,
}: AiCaptionGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("kasual");
  const [style, setStyle] = useState("pendek");
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [improveInstruction, setImproveInstruction] = useState("");

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Masukkan topik konten");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await aiCaptionApi.generate({
        topic,
        platform,
        tone,
        style,
        includeEmojis,
        includeHashtags,
      });

      if (res.ok) {
        setGeneratedCaption(res.data.caption);
        toast.success(
          res.data.source === "ai" ? "Caption dihasilkan oleh AI" : "Caption dari template",
        );
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Gagal generate caption");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImprove = async () => {
    if (!generatedCaption || !improveInstruction.trim()) return;

    setIsImproving(true);
    try {
      const res = await aiCaptionApi.improve(generatedCaption, improveInstruction);

      if (res.ok) {
        setGeneratedCaption(res.data.caption);
        setImproveInstruction("");
        toast.success("Caption berhasil ditingkatkan");
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Gagal meningkatkan caption");
    } finally {
      setIsImproving(false);
    }
  };

  const handleApply = () => {
    onApplyCaption(generatedCaption);
    setIsOpen(false);
    setGeneratedCaption("");
    setTopic("");
  };

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        AI Caption
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--accent-gold)]/30 bg-[var(--accent-gold-light)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--accent-gold)]" />
          <span className="font-medium text-sm">AI Caption Generator</span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-[var(--text-muted)] text-xs hover:text-[var(--text-primary)]"
        >
          Tutup
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[var(--text-muted)] text-xs">Topik Konten</label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="contoh: tips content creation, motivasi bisnis"
            className="h-9 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[var(--text-muted)] text-xs">Tone</label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profesional">Profesional</SelectItem>
                <SelectItem value="kasual">Kasual</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="lucu">Lucu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-[var(--text-muted)] text-xs">Gaya</label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendek">Pendek</SelectItem>
                <SelectItem value="panjang">Panjang</SelectItem>
                <SelectItem value="hook">Hook</SelectItem>
                <SelectItem value="storytelling">Storytelling</SelectItem>
                <SelectItem value="edukatif">Edukatif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeEmojis}
              onChange={(e) => setIncludeEmojis(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent-gold)]"
            />
            Emoji
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeHashtags}
              onChange={(e) => setIncludeHashtags(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent-gold)]"
            />
            Hashtag
          </label>
        </div>

        <Button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          className="w-full gap-2"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          Generate Caption
        </Button>

        {/* Generated Result */}
        {generatedCaption && (
          <div className="space-y-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
              <p className="whitespace-pre-wrap text-[var(--text-primary)] text-sm">
                {generatedCaption}
              </p>
            </div>

            {/* Improve Section */}
            <div className="flex gap-2">
              <Input
                value={improveInstruction}
                onChange={(e) => setImproveInstruction(e.target.value)}
                placeholder="Perintah: tambah humor, lebih formal, dll"
                className="h-9 flex-1 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isImproving) {
                    handleImprove();
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleImprove}
                disabled={isImproving || !improveInstruction.trim()}
              >
                {isImproving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Perbaiki"}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(generatedCaption);
                  toast.success("Caption disalin!");
                }}
              >
                Salin
              </Button>
              <Button type="button" size="sm" className="flex-1" onClick={handleApply}>
                Gunakan Caption
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
