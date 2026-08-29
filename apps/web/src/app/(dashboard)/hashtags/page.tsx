"use client";

import { Check, Copy, Edit3, Hash, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type HashtagCollection, hashtagsApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  async function fetchCollections() {
    setLoading(true);
    const res = await hashtagsApi.list(filterCategory ? { category: filterCategory } : undefined);
    if (res.ok) setCollections(res.data.collections);
    else toast.error(res.error);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formHashtags.trim()) {
      toast.error("Nama dan hashtag wajib diisi");
      return;
    }
    setSaving(true);

    const res = editingId
      ? await hashtagsApi.update(editingId, {
          name: formName,
          hashtags: formHashtags,
          category: formCategory,
        })
      : await hashtagsApi.create({
          name: formName,
          hashtags: formHashtags,
          category: formCategory,
        });

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
    if (res.ok) {
      toast.success("Koleksi dihapus");
      fetchCollections();
    } else toast.error(res.error);
  }

  async function copyHashtags(hashtags: string) {
    await navigator.clipboard.writeText(hashtags);
    toast.success("Hashtag disalin!");
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-gold)]/10">
            <Hash className="h-5 w-5 text-[var(--accent-gold)]" />
          </div>
          <div>
            <h1 className="font-semibold text-2xl">Manajemen Hashtag</h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Kelola koleksi hashtag untuk postingan
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
          <Plus className="h-4 w-4" /> Tambah Koleksi
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterCategory("")}
          className={cn(
            "rounded-full px-3 py-1.5 font-medium text-xs transition-colors",
            !filterCategory
              ? "bg-[var(--accent-gold)] text-white"
              : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]",
          )}
        >
          Semua
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setFilterCategory(cat.value)}
            className={cn(
              "rounded-full px-3 py-1.5 font-medium text-xs transition-colors",
              filterCategory === cat.value
                ? "bg-[var(--accent-gold)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card space-y-4 p-6">
          <h2 className="font-semibold">{editingId ? "Edit Koleksi" : "Koleksi Baru"}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-medium text-sm">Nama</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Niche Skincare"
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-sm">Kategori</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block font-medium text-sm">
              Hashtag (pisahkan dengan koma atau spasi)
            </label>
            <textarea
              value={formHashtags}
              onChange={(e) => setFormHashtags(e.target.value)}
              rows={3}
              placeholder="#skincare #kulitberminyak #tipskulit"
              className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
            />
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card animate-pulse p-5">
              <div className="mb-3 h-4 w-1/2 rounded bg-[var(--bg-tertiary)]" />
              <div className="h-3 w-3/4 rounded bg-[var(--bg-tertiary)]" />
            </div>
          ))
        ) : collections.length > 0 ? (
          collections.map((col) => (
            <div key={col.id} className="card space-y-3 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{col.name}</h3>
                  {col.category && (
                    <span className="rounded-full bg-[var(--bg-tertiary)] px-2 py-0.5 text-[var(--text-muted)] text-xs">
                      {CATEGORIES.find((c) => c.value === col.category)?.label || col.category}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(col)}
                    className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(col.id)}
                    className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {col.hashtags
                  .split(/[,\s]+/)
                  .filter(Boolean)
                  .map((tag, i) => (
                    <span
                      key={i}
                      className="rounded bg-[var(--accent-gold)]/10 px-2 py-0.5 font-medium text-[var(--accent-gold)] text-xs"
                    >
                      {tag.startsWith("#") ? tag : `#${tag}`}
                    </span>
                  ))}
              </div>
              <div className="flex items-center justify-between text-[var(--text-muted)] text-xs">
                <span>Digunakan {col.usageCount}x</span>
                <button
                  type="button"
                  onClick={() => copyHashtags(col.hashtags)}
                  className="flex items-center gap-1 transition-colors hover:text-[var(--text-primary)]"
                >
                  <Copy className="h-3 w-3" /> Salin
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="card col-span-full p-8 text-center text-[var(--text-secondary)] text-sm">
            Belum ada koleksi hashtag. Klik "Tambah Koleksi" untuk mulai.
          </div>
        )}
      </div>
    </div>
  );
}
