"use client";

import { Loader2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface NotificationOption {
  id: string;
  label: string;
  description: string;
}

const NOTIFICATION_OPTIONS: NotificationOption[] = [
  { id: "post_scheduled", label: "Post Terjadwal", description: "Notifikasi saat post berhasil dijadwalkan" },
  { id: "post_published", label: "Post Dipublikasikan", description: "Notifikasi saat post berhasil dipublikasikan" },
  { id: "post_failed", label: "Post Gagal", description: "Notifikasi saat post gagal dipublikasikan" },
  { id: "engagement_new", label: "Engagement Baru", description: "Komentar, mention, atau DM baru" },
  { id: "team_mentions", label: "Tim Mention", description: "Saat Anda di-mention dalam tim" },
  { id: "weekly_report", label: "Laporan Mingguan", description: "Ringkasan analytics mingguan" },
  { id: "subscription_expiry", label: "Kadaluarsa Langganan", description: "Pengingat sebelum langganan berakhir" },
  { id: "ai_suggestions", label: "Saran AI", description: "Saran konten dari AI" },
];

export function NotificationSettings() {
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    post_scheduled: true,
    post_published: true,
    post_failed: true,
    engagement_new: true,
    team_mentions: true,
    weekly_report: false,
    subscription_expiry: true,
    ai_suggestions: false,
  });
  const [loading, setLoading] = useState(false);

  const handleToggle = (id: string) => {
    setNotifications((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications }),
      });
      if (res.ok) {
        toast.success("Pengaturan notifikasi disimpan");
      } else {
        toast.error("Gagal menyimpan pengaturan");
      }
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifikasi</CardTitle>
        <CardDescription>Atur notifikasi yang ingin Anda terima</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {NOTIFICATION_OPTIONS.map((option) => (
            <div
              key={option.id}
              className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3"
            >
              <div>
                <Label className="cursor-pointer font-medium text-sm">{option.label}</Label>
                <p className="text-[var(--text-muted)] text-xs">{option.description}</p>
              </div>
              <button
                onClick={() => handleToggle(option.id)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                  notifications[option.id] ? "bg-[var(--accent-gold)]" : "bg-[var(--bg-tertiary)]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    notifications[option.id] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Pengaturan
        </Button>
      </CardContent>
    </Card>
  );
}
