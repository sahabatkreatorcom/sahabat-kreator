"use client";

import { useState, useEffect } from "react";
import {
  Hash,
  Plus,
  Loader2,
  Trash2,
  Edit3,
  Check,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { hashtagsApi, type HashtagCollection } from "@/lib/api-client";

const CATEGORIES = [
  { value: "niche", label: "Niche" },
  { value: "trending", label: "Trending" },
  { value: "branded", label: "Branded" },
  { value: "location", label: "Lokasi" },
];

export default function HashtagsPage() {
  const [collections, setCollections] = useState<HashtagCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formHashtags, setFormHashtags] = useState("");
  const [formCategory, setFormCategory] = useState("niche");
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("");

  useEffect(() => { fetchCollections(); }, [filterCategory]);

  async function fetchCollections() {
    setLoading(true);
    const res = await hashtagsApi.list(filterCategory ? { category: filterCategory } : undefined);
    if (res.ok) setCollections(res.data.collections);
    else toast.error(res.error);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formHashtags.trim()) { toast.error("Nama dan hashtag wajib diisi"); return; }
    setSaving(true);

    const res = editingId
      ? await hashtagsApi.update(editingId, { name: formName, hashtags: formHashtags, category: formCategory })
      : await hashtagsApi.create({ name: formName, hashtags: formHashtags, category: formCategory });

    if (res.ok) {
      toast.success(editingId ? "Koleksi diperbarui" : "Koleksi dibuat");
      resetForm();
      fetchCollections();
    } else {
      toast.error(res.error);
    }
    setSaving(false);
  }

  function startEdit(c: HashtagCollection) {
    setEditingId(c.id);
    setFormName(c.name);
    setFormHashtags(c.hashtags);
    setFormCategory(c.category || "niche");
    setShowForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setFormName("");
    setFormHashtags("");
    setFormCategory("niche");
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus koleksi ini?")) return;
    const res = await hashtagsApi.delete(id);
    if (res.ok) { toast.success("Koleksi dihapus"); fetchCollections(); }
    else toast.error(res.error);
  }

  async function copyHashtags(hashtags: string) {
    await navigator.clipboard.writeText(hashtags);
    toast.success("Hashtag disalin!");
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-gold)]/10">
            <Hash className="h-5 w-5 text-[var(--accent-gold)]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Manajemen Hashtag</h1>
            <p className="text-sm text-[var(--text-secondary)]">Kelola koleksi hashtag untuk postingan</p>
          </div>
        </div>
        <button type="button" onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-gold)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Tambah Koleksi
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={() => setFilterCategory("")}
          className={cn("px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
            !filterCategory ? "bg-[var(--accent-gold)] text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]")}>
          Semua
        </button>
        {CATEGORIES.map((cat) => (
          <button key={cat.value} type="button" onClick={() => setFilterCategory(cat.value)}
            className={cn("px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
              filterCategory === cat.value ? "bg-[var(--accent-gold)] text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]")}>
            {cat.label}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card p-6 space-y-4">
          <h2 className="font-semibold">{editingId ? "Edit Koleksi" : "Koleksi Baru"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nama</label>
              <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Contoh: Niche Skincare"
                className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kategori</label>
              <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hashtag (pisahkan dengan koma atau spasi)</label>
            <textarea value={formHashtags} onChange={(e) => setFormHashtags(e.target.value)} rows={3}
              placeholder="#skincare #kulitberminyak #tipskulit"
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 resize-none" />
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse"><div className="h-4 bg-[var(--bg-tertiary)] rounded w-1/2 mb-3" /><div className="h-3 bg-[var(--bg-tertiary)] rounded w-3/4" /></div>
          ))
        ) : collections.length > 0 ? (
          collections.map((col) => (
            <div key={col.id} className="card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{col.name}</h3>
                  {col.category && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                      {CATEGORIES.find((c) => c.value === col.category)?.label || col.category}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => startEdit(col)} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => handleDelete(col.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {col.hashtags.split(/[,\s]+/).filter(Boolean).map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] rounded text-xs font-medium">
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>Digunakan {col.usageCount}x</span>
                <button type="button" onClick={() => copyHashtags(col.hashtags)}
                  className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors">
                  <Copy className="h-3 w-3" /> Salin
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full card p-8 text-center text-sm text-[var(--text-secondary)]">
            Belum ada koleksi hashtag. Klik "Tambah Koleksi" untuk mulai.
          </div>
        )}
      </div>
    </div>
  );
}
