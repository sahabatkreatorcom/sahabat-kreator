"use client";

import { Calendar, Clock, Eye, Mail, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Frequency = "daily" | "weekly" | "monthly";

interface Recipient {
  id: string;
  email: string;
  name: string;
}

interface ScheduledReport {
  id: string;
  frequency: Frequency;
  recipients: Recipient[];
  lastSent?: string;
  nextSend?: string;
  enabled: boolean;
}

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
] as const;

const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
};

const FREQUENCY_DAYS: Record<Frequency, string> = {
  daily: "Setiap hari",
  weekly: "Setiap Senin",
  monthly: "Pertama setiap bulan",
};

interface EmailReportProps {
  schedules?: ScheduledReport[];
  onAdd?: (schedule: ScheduledReport) => void;
  onRemove?: (id: string) => void;
}

export function EmailReport({ schedules = [], onAdd, onRemove }: EmailReportProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [platforms, setPlatforms] = useState<string[]>(["instagram", "tiktok"]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [sending, setSending] = useState(false);

  const addRecipient = () => {
    if (!newEmail.trim()) return;
    setRecipients((prev) => [
      ...prev,
      { id: `r-${Date.now()}`, email: newEmail.trim(), name: newName.trim() || newEmail.trim() },
    ]);
    setNewEmail("");
    setNewName("");
  };

  const removeRecipient = (id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleCreate = () => {
    if (recipients.length === 0) {
      toast.error("Tambahkan minimal satu penerima");
      return;
    }
    const schedule: ScheduledReport = {
      id: `sch-${Date.now()}`,
      frequency,
      recipients,
      enabled: true,
      nextSend: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    onAdd?.(schedule);
    toast.success("Jadwal laporan berhasil dibuat");
    setDialogOpen(false);
    setRecipients([]);
    setNewEmail("");
    setNewName("");
  };

  const handlePreview = () => {
    toast.info("Preview laporan akan ditampilkan");
  };

  const handleSendNow = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success("Laporan berhasil dikirim");
    }, 1500);
  };

  const getFrequencyIcon = (f: Frequency) => {
    return f === "daily" ? <Clock className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-4">
      {/* Existing Schedules */}
      {schedules.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Jadwal Aktif</h3>
          </div>
          {schedules.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-gold)]/15">
                  <Mail className="h-5 w-5 text-[var(--accent-gold)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {s.frequency === "daily"
                        ? "Harian"
                        : s.frequency === "weekly"
                          ? "Mingguan"
                          : "Bulanan"}
                    </span>
                    <Badge variant={s.enabled ? "success" : "secondary"}>
                      {s.enabled ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-[var(--text-muted)] text-xs">
                    {s.recipients.map((r) => r.email).join(", ")}
                  </p>
                  {s.nextSend && (
                    <p className="mt-0.5 text-[var(--text-muted)] text-xs">
                      <Calendar className="mr-1 inline h-3 w-3" />
                      Pengiriman berikutnya:{" "}
                      {new Date(s.nextSend).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handlePreview()}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onRemove?.(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Button */}
      <Button onClick={() => setDialogOpen(true)} className="w-full gap-2" variant="secondary">
        <Plus className="h-4 w-4" />
        Tambah Jadwal Laporan
      </Button>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Buat Jadwal Laporan Email
            </DialogTitle>
            <DialogDescription>
              Atur frekuensi pengiriman dan penerima laporan analitik.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Frequency */}
            <div className="space-y-2">
              <Label>Frekuensi</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["daily", "weekly", "monthly"] as Frequency[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border px-3 py-3 text-center transition-all",
                      frequency === f
                        ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/15"
                        : "border-[var(--border)] bg-[var(--bg-tertiary)] hover:border-[var(--accent-gold)]/40",
                    )}
                  >
                    {getFrequencyIcon(f)}
                    <span
                      className={cn(
                        "font-medium text-sm",
                        frequency === f ? "text-[var(--accent-gold)]" : "",
                      )}
                    >
                      {FREQUENCY_LABELS[f]}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {FREQUENCY_DAYS[f]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Platforms */}
            <div className="space-y-2">
              <Label>Platform</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORM_OPTIONS.map((p) => (
                  <label
                    key={p.value}
                    className="flex cursor-pointer items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-1.5 text-xs"
                  >
                    <Checkbox
                      checked={platforms.includes(p.value)}
                      onCheckedChange={() => togglePlatform(p.value)}
                    />
                    <span className="text-[var(--text-secondary)]">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Recipients */}
            <div className="space-y-2">
              <Label>Penerima</Label>
              <div className="space-y-2">
                {recipients.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-gold)]/20 font-medium text-[var(--accent-gold)] text-xs">
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-xs">{r.name}</p>
                      <p className="truncate text-[10px] text-[var(--text-muted)]">{r.email}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => removeRecipient(r.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Nama (opsional)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-[140px]"
                />
                <Button size="md" onClick={addRecipient} variant="secondary">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Preview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4" />
                  Preview Laporan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 rounded-lg bg-[var(--bg-tertiary)] p-3 text-xs">
                  <p className="font-medium text-[var(--text-primary)]">
                    📊 Laporan Mingguan — Sahabat Kreator
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    Periode:{" "}
                    {new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    —{" "}
                    {new Date().toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div>
                      <p className="text-[var(--text-muted)]">Total Impressi</p>
                      <p className="font-semibold">124.5K</p>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)]">Engagement Rate</p>
                      <p className="font-semibold text-green-600">7.2%</p>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)]">Post Baru</p>
                      <p className="font-semibold">18</p>
                    </div>
                  </div>
                  <p className="pt-2 text-[var(--text-muted)]">
                    Selengkapnya lihat di dashboard Sahabat Kreator →
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={handlePreview} className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button onClick={handleSendNow} disabled={sending} className="gap-2">
              <Mail className="h-4 w-4" />
              {sending ? "Mengirim..." : "Kirim Sekarang"}
            </Button>
            <Button onClick={handleCreate} className="gap-2 bg-gradient">
              <Calendar className="h-4 w-4" />
              Simpan Jadwal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
