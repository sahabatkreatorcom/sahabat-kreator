"use client";

import { Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { postsApi } from "@/lib/api-client";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
  onSuccess?: () => void;
}

export function QuickAddModal({ isOpen, onClose, defaultDate, onSuccess }: QuickAddModalProps) {
  const [caption, setCaption] = useState("");
  const [postType, setPostType] = useState("POST");
  const [scheduledDate, setScheduledDate] = useState(
    defaultDate?.toISOString().slice(0, 10) || new Date().toISOString().slice(0, 10)
  );
  const [scheduledTime, setScheduledTime] = useState(
    defaultDate
      ? `${String(defaultDate.getHours()).padStart(2, "0")}:${String(defaultDate.getMinutes()).padStart(2, "0")}`
      : "09:00"
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (draft = false) => {
    if (!caption.trim()) {
      toast.error("Masukkan caption");
      return;
    }

    setLoading(true);
    const scheduledAt = draft ? null : new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

    const res = await postsApi.create({
      caption,
      postType,
      scheduledAt,
      status: draft ? "DRAFT" : "SCHEDULED",
    });

    setLoading(false);

    if (res.ok) {
      toast.success(draft ? "Draft disimpan!" : "Post berhasil dijadwalkan!");
      setCaption("");
      onClose();
      onSuccess?.();
    } else {
      toast.error(res.error || "Gagal menyimpan post");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-lg">Tambah Post Cepat</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-caption">Caption</Label>
            <Textarea
              id="quick-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Tulis caption..."
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipe</Label>
              <Select value={postType} onValueChange={setPostType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">Post</SelectItem>
                  <SelectItem value="STORY">Story</SelectItem>
                  <SelectItem value="REEL">Reel</SelectItem>
                  <SelectItem value="CAROUSEL">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Waktu</Label>
            <Input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={() => handleSave(false)} disabled={loading} className="flex-1">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Jadwalkan
            </Button>
            <Button variant="secondary" onClick={() => handleSave(true)} disabled={loading} className="flex-1">
              Simpan Draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
