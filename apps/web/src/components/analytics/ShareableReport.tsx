"use client";

import { useState } from "react";
import {
  CalendarDays,
  Download,
  Share2,
  Copy,
  Check,
  FileText,
  BarChart3,
  Users,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DateRange = "7d" | "30d" | "90d";
type ReportType = "overview" | "engagement" | "audience" | "content";

interface ShareableReportProps {
  onGenerate?: (params: { range: DateRange; platforms: string[]; type: ReportType }) => void;
}

export function ShareableReport({ onGenerate }: ShareableReportProps) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange>("30d");
  const [platforms, setPlatforms] = useState<string[]>(["instagram", "tiktok"]);
  const [type, setType] = useState<ReportType>("overview");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reportLink, setReportLink] = useState("");

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const fakeId = `sk-rpt-${Math.random().toString(36).slice(2, 8)}`;
      const link = `https://sahabatkreator.id/r/${fakeId}`;
      setReportLink(link);
      setGenerating(false);
      onGenerate?.({ range, platforms, type });
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reportLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    // In a real app this would call a backend endpoint that generates PDF
    alert("Fitur unduh PDF akan terhubung ke backend saat tersedia.");
  };

  const reportSections: { key: ReportType; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      key: "overview",
      label: "Ringkasan",
      icon: <BarChart3 className="h-4 w-4" />,
      desc: "Metrik utama lintas platform",
    },
    {
      key: "engagement",
      label: "Engagement",
      icon: <Users className="h-4 w-4" />,
      desc: "Interaksi dan keterlibatan audiens",
    },
    {
      key: "audience",
      label: "Audiens",
      icon: <Eye className="h-4 w-4" />,
      desc: "Demografi dan jangkauan",
    },
    {
      key: "content",
      label: "Konten",
      icon: <FileText className="h-4 w-4" />,
      desc: "Performa konten dan hashtag",
    },
  ];

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Share2 className="h-4 w-4" />
        Buat Laporan
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Laporan Analitik
            </DialogTitle>
            <DialogDescription>
              Pilih rentang waktu, platform, dan tipe laporan yang ingin dibuat.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Rentang Waktu</label>
              <div className="flex gap-2">
                {(["7d", "30d", "90d"] as DateRange[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      range === r
                        ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]"
                        : "border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]/50",
                    )}
                  >
                    {r === "7d" ? "7 Hari" : r === "30d" ? "30 Hari" : "90 Hari"}
                  </button>
                ))}
              </div>
            </div>

            {/* Platforms */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Platform</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "instagram", label: "Instagram", color: "#E1306C" },
                  { key: "tiktok", label: "TikTok", color: "#000" },
                  { key: "youtube", label: "YouTube", color: "#FF0000" },
                  { key: "facebook", label: "Facebook", color: "#1877F2" },
                  { key: "linkedin", label: "LinkedIn", color: "#0A66C2" },
                  { key: "threads", label: "Threads", color: "#000" },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() =>
                      setPlatforms((prev) =>
                        prev.includes(p.key)
                          ? prev.filter((x) => x !== p.key)
                          : [...prev, p.key],
                      )
                    }
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                      platforms.includes(p.key)
                        ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/15"
                        : "border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: platforms.includes(p.key) ? p.color : "var(--border)" }}
                    />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Report Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipe Laporan</label>
              <div className="grid grid-cols-2 gap-2">
                {reportSections.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setType(s.key)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-all",
                      type === s.key
                        ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10"
                        : "border-[var(--border)] bg-[var(--bg-tertiary)] hover:border-[var(--accent-gold)]/40",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(type === s.key ? "text-[var(--accent-gold)]" : "text-[var(--text-muted)]")}>
                        {s.icon}
                      </span>
                      <span className={cn("font-medium text-sm", type === s.key ? "text-[var(--accent-gold)]" : "")}>
                        {s.label}
                      </span>
                    </div>
                    <span className="text-[var(--text-muted)] text-xs">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-3 sm:flex-row">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              {generating ? (
                <>
                  <span className="spinner-gradient !h-3 !w-3" />
                  Membuat...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4" />
                  Generate Laporan
                </>
              )}
            </Button>
          </DialogFooter>

          {/* Preview / Results */}
          {reportLink && (
            <Card className="mt-2 border-[var(--accent-gold)]/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Laporan Siap
                </CardTitle>
                <CardDescription>
                  {range === "7d" ? "7 hari" : range === "30d" ? "30 hari" : "90 hari"} · {platforms.join(", ")} · {type}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={reportLink}
                    className="flex-1 rounded-md border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-xs text-[var(--text-muted)]"
                  />
                  <Button size="sm" variant="secondary" onClick={handleCopy}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Tersalin" : "Salin"}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={handleDownloadPDF} className="flex-1 gap-2">
                    <Download className="h-3.5 w-3.5" />
                    Unduh PDF
                  </Button>
                  <Button size="sm" className="flex-1 gap-2">
                    <Share2 className="h-3.5 w-3.5" />
                    Bagikan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
