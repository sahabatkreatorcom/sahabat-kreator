"use client";

import { Plus, Save, Trash2, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// In-memory canned replies store — replace with API calls in production
interface CannedReply {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
}

const CATEGORIES = ["Umum", "Penjualan", "Support", "Marketing"];

interface CannedReplyProps {
  onInsert: (text: string) => void;
  onClose: () => void;
  open: boolean;
}

export function CannedReply({ onInsert, onClose, open }: CannedReplyProps) {
  const [replies, setReplies] = useState<CannedReply[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Umum");

  useEffect(() => {
    if (open) {
      loadReplies();
    }
  }, [open]);

  const loadReplies = () => {
    const stored = localStorage.getItem("sk-canned-replies");
    if (stored) {
      setReplies(JSON.parse(stored));
    } else {
      const defaults: CannedReply[] = [
        {
          id: "1",
          title: "Terima kasih",
          content: "Terima kasih banyak atas komentarnya! 😊 Kami sangat menghargai dukungan Anda.",
          category: "Umum",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Info Promo",
          content: "Halo! Saat ini kami sedang menjalankan promo spesial. Untuk info lebih lanjut, silakan cek link di bio ya! 🎉",
          category: "Marketing",
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          title: "Balas Pertanyaan",
          content: "Terima kasih telah menghubungi kami! Tim kami akan segera menindaklanjuti pertanyaan Anda. Mohon tunggu ya.",
          category: "Support",
          createdAt: new Date().toISOString(),
        },
        {
          id: "4",
          title: "Call to Action",
          content: "Tertarik? Yuk langsung kunjungi website kami atau hubungi CS untuk info lebih lanjut! 🚀",
          category: "Penjualan",
          createdAt: new Date().toISOString(),
        },
      ];
      setReplies(defaults);
      localStorage.setItem("sk-canned-replies", JSON.stringify(defaults));
    }
  };

  const saveReplies = (data: CannedReply[]) => {
    localStorage.setItem("sk-canned-replies", JSON.stringify(data));
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Judul dan isi tidak boleh kosong");
      return;
    }

    if (editingId) {
      const updated = replies.map((r) =>
        r.id === editingId ? { ...r, title: title.trim(), content: content.trim(), category } : r,
      );
      setReplies(updated);
      saveReplies(updated);
      toast.success("Balasan cepat diperbarui");
    } else {
      const newReply: CannedReply = {
        id: crypto.randomUUID(),
        title: title.trim(),
        content: content.trim(),
        category,
        createdAt: new Date().toISOString(),
      };
      const updated = [...replies, newReply];
      setReplies(updated);
      saveReplies(updated);
      toast.success("Balasan cepat dibuat");
    }

    setShowEditor(false);
    setEditingId(null);
    setTitle("");
    setContent("");
    setCategory("Umum");
  };

  const handleDelete = (id: string) => {
    const updated = replies.filter((r) => r.id !== id);
    setReplies(updated);
    saveReplies(updated);
    toast.success("Balasan cepat dihapus");
  };

  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    items: replies.filter((r) => r.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Balasan Cepat</DialogTitle>
          <DialogDescription>
            Pilih balasan yang sudah disimpan atau buat baru
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <span className="text-[var(--text-muted)] text-sm">{replies.length} balasan tersimpan</span>
          <Button size="sm" onClick={() => { setShowEditor(true); setEditingId(null); setTitle(""); setContent(""); setCategory("Umum"); }}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Baru
          </Button>
        </div>

        {/* Editor */}
        {showEditor && (
          <div className="space-y-3 rounded-lg border border-[var(--accent-gold)]/30 bg-[var(--accent-gold-light)] p-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-1 text-xs">Judul</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Terima Kasih"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="mb-1 text-xs">Kategori</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="mb-1 text-xs">Isi Balasan</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tulis isi balasan..."
                className="min-h-[100px] text-sm"
              />
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

        {/* List */}
        <div className="max-h-60 overflow-y-auto space-y-4">
          {grouped.map(({ category, items }) => (
            <div key={category}>
              <p className="mb-1.5 font-medium text-xs text-[var(--text-muted)] uppercase tracking-wide">
                {category}
              </p>
              <div className="space-y-1.5">
                {items.map((reply) => (
                  <div
                    key={reply.id}
                    className={cn(
                      "group flex items-start gap-2 rounded-lg border p-2.5 transition-colors hover:border-[var(--accent-gold)]/50 hover:bg-[var(--accent-gold-light)]/50",
                    )}
                  >
                    <button
                      onClick={() => onInsert(reply.content)}
                      className="flex-1 text-left"
                      title="Sisipkan ke balasan"
                    >
                      <p className="font-medium text-xs">{reply.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[var(--text-muted)] text-xs">
                        {reply.content}
                      </p>
                    </button>
                    <div className="hidden shrink-0 flex-col gap-1 group-hover:flex">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(reply.id);
                          setTitle(reply.title);
                          setContent(reply.content);
                          setCategory(reply.category);
                          setShowEditor(true);
                        }}
                      >
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(reply.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {replies.length === 0 && (
            <p className="py-6 text-center text-[var(--text-muted)] text-sm">
              Belum ada balasan cepat. Buat yang pertama!
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
