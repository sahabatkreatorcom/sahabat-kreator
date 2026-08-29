"use client";

import { Calendar, Clock, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { postsApi } from "@/lib/api-client";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    caption?: string;
    scheduledAt?: string;
  };
  onSuccess?: () => void;
}

export function RescheduleModal({ isOpen, onClose, post, onSuccess }: RescheduleModalProps) {
  const [date, setDate] = useState(
    post?.scheduledAt
      ? new Date(post.scheduledAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  );
  const [time, setTime] = useState(
    post?.scheduledAt
      ? `${String(new Date(post.scheduledAt).getHours()).padStart(2, "0")}:${String(new Date(post.scheduledAt).getMinutes()).padStart(2, "0")}`
      : "09:00",
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen || !post) return null;

  const handleReschedule = async () => {
    setLoading(true);
    const newScheduledAt = new Date(`${date}T${time}`).toISOString();

    const res = await postsApi.update(post.id, {
      scheduledAt: newScheduledAt,
      status: "SCHEDULED",
    });

    setLoading(false);

    if (res.ok) {
      toast.success("Post berhasil dijadwalkan ulang!");
      onClose();
      onSuccess?.();
    } else {
      toast.error(res.error || "Gagal menjadwalkan ulang");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-lg">Jadwalkan Ulang</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Post Preview */}
        <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
          <p className="line-clamp-2 text-sm">{post.caption?.slice(0, 80) || "Tanpa caption"}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reschedule-date">
              <Calendar className="mr-1 inline h-4 w-4" />
              Tanggal Baru
            </Label>
            <Input
              id="reschedule-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reschedule-time">
              <Clock className="mr-1 inline h-4 w-4" />
              Waktu Baru
            </Label>
            <Input
              id="reschedule-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleReschedule} disabled={loading} className="flex-1">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Jadwalkan Ulang
            </Button>
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Batal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
