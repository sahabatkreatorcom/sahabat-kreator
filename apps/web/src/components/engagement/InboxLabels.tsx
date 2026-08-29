"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

interface Label {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

interface InboxLabelsProps {
  onClose: () => void;
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
];

export function InboxLabels({ onClose }: InboxLabelsProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    const stored = localStorage.getItem("sk-inbox-labels");
    if (stored) {
      setLabels(JSON.parse(stored));
    } else {
      const defaults: Label[] = [
        { id: "1", name: "Prioritas", color: "#ef4444", createdAt: new Date().toISOString() },
        {
          id: "2",
          name: "Butuh Tindak Lanjut",
          color: "#f97316",
          createdAt: new Date().toISOString(),
        },
        { id: "3", name: "Sudah Dibaca", color: "#3b82f6", createdAt: new Date().toISOString() },
        { id: "4", name: "Spam", color: "#6b7280", createdAt: new Date().toISOString() },
      ];
      setLabels(defaults);
      localStorage.setItem("sk-inbox-labels", JSON.stringify(defaults));
    }
  }, []);

  const saveLabels = (data: Label[]) => {
    localStorage.setItem("sk-inbox-labels", JSON.stringify(data));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Nama label tidak boleh kosong");
      return;
    }

    if (editingId) {
      const updated = labels.map((l) =>
        l.id === editingId ? { ...l, name: name.trim(), color } : l,
      );
      setLabels(updated);
      saveLabels(updated);
      toast.success("Label diperbarui");
    } else {
      const newLabel: Label = {
        id: crypto.randomUUID(),
        name: name.trim(),
        color,
        createdAt: new Date().toISOString(),
      };
      const updated = [...labels, newLabel];
      setLabels(updated);
      saveLabels(updated);
      toast.success("Label dibuat");
    }

    setShowEditor(false);
    setEditingId(null);
    setName("");
    setColor(PRESET_COLORS[0]);
  };

  const handleDelete = (id: string) => {
    const updated = labels.filter((l) => l.id !== id);
    setLabels(updated);
    saveLabels(updated);
    toast.success("Label dihapus");
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Kelola Label</DialogTitle>
          <DialogDescription>Buat label untuk mengorganisir percakapan di inbox</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)] text-sm">{labels.length} label</span>
          <Button
            size="sm"
            onClick={() => {
              setShowEditor(true);
              setEditingId(null);
              setName("");
              setColor(PRESET_COLORS[0]);
            }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Label Baru
          </Button>
        </div>

        {/* Editor */}
        {showEditor && (
          <div className="space-y-3 rounded-lg border border-[var(--accent-gold)]/30 bg-[var(--accent-gold-light)] p-3">
            <div>
              <Label className="mb-1 text-xs">Nama Label</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama label..."
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="mb-1.5 text-xs">Warna</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "h-7 w-7 rounded-full transition-all",
                      color === c
                        ? "ring-2 ring-[var(--accent-gold)] ring-offset-2"
                        : "hover:scale-110",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowEditor(false)}>
                Batal
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Simpan
              </Button>
            </div>
          </div>
        )}

        {/* Labels list */}
        <div className="max-h-60 space-y-1.5 overflow-y-auto">
          {labels.map((label) => (
            <div
              key={label.id}
              className="group flex items-center gap-3 rounded-lg border border-[var(--border)] p-2.5 transition-colors hover:border-[var(--accent-gold)]/50"
            >
              <div
                className="h-4 w-4 shrink-0 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              <span className="flex-1 font-medium text-sm">{label.name}</span>
              <div className="hidden shrink-0 items-center gap-1 group-hover:flex">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => {
                    setEditingId(label.id);
                    setName(label.name);
                    setColor(label.color);
                    setShowEditor(true);
                  }}
                >
                  <Save className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(label.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}

          {labels.length === 0 && (
            <p className="py-6 text-center text-[var(--text-muted)] text-sm">
              Belum ada label. Buat yang pertama!
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
