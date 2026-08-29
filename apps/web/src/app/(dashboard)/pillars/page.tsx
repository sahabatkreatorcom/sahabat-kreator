"use client";

import { Check, Edit3, Layers, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type ContentPillar, pillarsApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const COLORS = [
  "#D4A574",
  "#E8B4B8",
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#6366F1",
];

export default function PillarsPage() {
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPillars();
  }, [fetchPillars]);

  async function fetchPillars() {
    setLoading(true);
    const res = await pillarsApi.list();
    if (res.ok) setPillars(res.data.pillars);
    else toast.error(res.error);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }
    setSaving(true);

    const res = editingId
      ? await pillarsApi.update(editingId, {
          name: formName,
          description: formDesc,
          color: formColor,
        })
      : await pillarsApi.create({ name: formName, description: formDesc, color: formColor });

    if (res.ok) {
      toast.success(editingId ? "Pilar diperbarui" : "Pilar dibuat");
      resetForm();
      fetchPillars();
    } else {
      toast.error(res.error);
    }
    setSaving(false);
  }

  function startEdit(p: ContentPillar) {
    setEditingId(p.id);
    setFormName(p.name);
    setFormDesc(p.description || "");
    setFormColor(p.color);
    setShowForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setFormName("");
    setFormDesc("");
    setFormColor(COLORS[0]);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus pilar ini?")) return;
    const res = await pillarsApi.delete(id);
    if (res.ok) {
      toast.success("Pilar dihapus");
      fetchPillars();
    } else toast.error(res.error);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-gold)]/10">
            <Layers className="h-5 w-5 text-[var(--accent-gold)]" />
          </div>
          <div>
            <h1 className="font-semibold text-2xl">Content Pillars</h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Kelola pilar konten untuk mengorganisir postingan
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 rounded-lg bg-[var(--accent-gold)] px-4 py-2 font-medium text-sm text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Tambah Pilar
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card space-y-4 p-6">
          <h2 className="font-semibold">{editingId ? "Edit Pilar" : "Pilar Baru"}</h2>
          <div>
            <label className="mb-1 block font-medium text-sm">Nama</label>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: Edukasi, Promosi, Hiburan"
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
            />
          </div>
          <div>
            <label className="mb-1 block font-medium text-sm">Deskripsi</label>
            <input
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Opsional"
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
            />
          </div>
          <div>
            <label className="mb-2 block font-medium text-sm">Warna</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormColor(c)}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    formColor === c ? "scale-110 border-white" : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[var(--accent-gold)] px-4 py-2 font-medium text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {editingId ? "Simpan" : "Buat"}
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : pillars.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {pillars.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-[var(--bg-secondary)]"
              >
                <div
                  className="h-4 w-4 shrink-0 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.name}</p>
                  {p.description && (
                    <p className="truncate text-[var(--text-muted)] text-sm">{p.description}</p>
                  )}
                </div>
                <span className="text-[var(--text-muted)] text-xs">{p.postCount} post</span>
                <button
                  type="button"
                  onClick={() => startEdit(p)}
                  className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-[var(--text-secondary)] text-sm">
            Belum ada content pillar. Klik "Tambah Pilar" untuk mulai.
          </div>
        )}
      </div>
    </div>
  );
}
