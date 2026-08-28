"use client";

import { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Loader2,
  Trash2,
  Edit3,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { pillarsApi, type ContentPillar } from "@/lib/api-client";

const COLORS = ["#D4A574", "#E8B4B8", "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#6366F1"];

export default function PillarsPage() {
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColor, setFormColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPillars(); }, []);

  async function fetchPillars() {
    setLoading(true);
    const res = await pillarsApi.list();
    if (res.ok) setPillars(res.data.pillars);
    else toast.error(res.error);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) { toast.error("Nama wajib diisi"); return; }
    setSaving(true);

    const res = editingId
      ? await pillarsApi.update(editingId, { name: formName, description: formDesc, color: formColor })
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
    if (res.ok) { toast.success("Pilar dihapus"); fetchPillars(); }
    else toast.error(res.error);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-gold)]/10">
            <Layers className="h-5 w-5 text-[var(--accent-gold)]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Content Pillars</h1>
            <p className="text-sm text-[var(--text-secondary)]">Kelola pilar konten untuk mengorganisir postingan</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-gold)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Tambah Pilar
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card p-6 space-y-4">
          <h2 className="font-semibold">{editingId ? "Edit Pilar" : "Pilar Baru"}</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Nama</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Contoh: Edukasi, Promosi, Hiburan"
              className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Deskripsi</label>
            <input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Opsional"
              className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Warna</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setFormColor(c)}
                  className={cn("h-8 w-8 rounded-full border-2 transition-all", formColor === c ? "border-white scale-110" : "border-transparent")}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Batal</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-gold)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editingId ? "Simpan" : "Buat"}
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-[var(--text-muted)]" /></div>
        ) : pillars.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {pillars.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{p.name}</p>
                  {p.description && <p className="text-sm text-[var(--text-muted)] truncate">{p.description}</p>}
                </div>
                <span className="text-xs text-[var(--text-muted)]">{p.postCount} post</span>
                <button type="button" onClick={() => startEdit(p)} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Edit3 className="h-4 w-4" /></button>
                <button type="button" onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-[var(--text-secondary)]">
            Belum ada content pillar. Klik "Tambah Pilar" untuk mulai.
          </div>
        )}
      </div>
    </div>
  );
}
