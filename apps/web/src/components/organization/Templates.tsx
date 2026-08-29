"use client";

import { Copy, Edit3, Hash, Plus, Search, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  tags: string[];
  usageCount: number;
  createdAt: string;
}

const CATEGORIES = ["Promosi", "Edukasi", "Engagement", "Brand Awareness", "Sale", "Lainnya"];

const INITIAL_TEMPLATES: Template[] = [
  {
    id: "t1",
    name: "Promo Hari Ini",
    content:
      "🔥 Promo Spesial Hari Ini!\n\nDapatkan diskon hingga 50% untuk semua produk pilihan. Berlaku sampai tengah malam!\n\n🛒 Klik link di bio untuk pemesanan\n\n#diskon #promo #hariini",
    category: "Promosi",
    tags: ["promo", "diskon"],
    usageCount: 24,
    createdAt: "2024-01-15",
  },
  {
    id: "t2",
    name: "Tips Harian",
    content:
      "💡 Tips Harian:\n\nCara meningkatkan engagement di media sosial:\n1. Posting konsisten\n2. Gunakan hashtag relevan\n3. Reply komentar\n\nSimpan postingan ini! 📌",
    category: "Edukasi",
    tags: ["tips", "edukasi"],
    usageCount: 18,
    createdAt: "2024-01-20",
  },
  {
    id: "t3",
    name: "Behind The Scene",
    content:
      "🎬 Behind The Scene hari ini!\n\nLihat proses pembuatan konten kami. Kerja keras di balik layar 💪\n\nTag teman yang perlu lihat ini!",
    category: "Engagement",
    tags: ["bts", "konten"],
    usageCount: 12,
    createdAt: "2024-02-01",
  },
];

export function Templates() {
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", content: "", category: "Promosi", tags: "" });
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const filtered = templates.filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.content.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || t.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const openCreate = () => {
    setForm({ name: "", content: "", category: "Promosi", tags: "" });
    setTags([]);
    setEditingId(null);
    setShowCreateModal(true);
  };

  const openEdit = (t: Template) => {
    setForm({ name: t.name, content: t.content, category: t.category, tags: t.tags.join(", ") });
    setTags([...t.tags]);
    setEditingId(t.id);
    setShowCreateModal(true);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags((prev) => [...prev, tagInput.trim()]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.content.trim()) {
      toast.error("Nama dan konten template wajib diisi");
      return;
    }
    try {
      const res = await fetch(`/api/templates${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags,
          id: editingId,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowCreateModal(false);
      toast.success(editingId ? "Template diperbarui" : "Template dibuat");
    } catch {
      toast.error("Gagal menyimpan template");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus template ini?")) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        toast.success("Template dihapus");
      }
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  const handleUseInComposer = (_template: Template) => {
    toast.success("Template disalin ke composer");
    // In real app, this would navigate to composer with pre-filled content
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-lg">Template Caption</h2>
          <p className="text-[var(--text-muted)] text-sm">
            Kumpulan caption siap pakai untuk berbagai kebutuhan konten
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Template Baru
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              placeholder="Cari template..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 text-sm"
          >
            <option value="">Semua Kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Template Grid */}
      {filtered.length === 0 ? (
        <div className="card py-12 text-center text-[var(--text-muted)]">
          <Tag className="mx-auto mb-2 h-8 w-8 opacity-50" />
          <p className="font-medium">Tidak ada template</p>
          <p className="text-sm">Buat template pertama Anda</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <div key={template.id} className="card flex flex-col">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{template.name}</h3>
                  <span className="inline-block rounded-full bg-[var(--accent-gold)]/10 px-2 py-0.5 text-[var(--accent-gold)] text-xs">
                    {template.category}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(template)}
                    className="rounded p-1.5 hover:bg-[var(--bg-tertiary)]"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="rounded p-1.5 text-[var(--error)] hover:bg-[var(--error)]/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mb-3 flex-1">
                <p className="line-clamp-4 whitespace-pre-wrap text-[var(--text-secondary)] text-sm">
                  {template.content}
                </p>
              </div>

              {template.tags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded bg-[var(--bg-tertiary)] px-2 py-0.5 text-[var(--text-muted)] text-xs"
                    >
                      <Hash className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between border-[var(--border)] border-t pt-3 text-[var(--text-muted)] text-xs">
                <span>Dipakai {template.usageCount}x</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(template.content);
                      toast.success("Caption disalin");
                    }}
                    className="flex items-center gap-1 hover:text-[var(--text-primary)]"
                  >
                    <Copy className="h-3.5 w-3.5" /> Salin
                  </button>
                  <button
                    onClick={() => handleUseInComposer(template)}
                    className="flex items-center gap-1 text-[var(--accent-gold)] hover:opacity-80"
                  >
                    <Plus className="h-3.5 w-3.5" /> Pakai
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-[var(--bg-primary)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">{editingId ? "Edit Template" : "Template Baru"}</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded p-1 hover:bg-[var(--bg-tertiary)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block font-medium text-sm">Nama Template</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Promo Weekend"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-sm">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium text-sm">Caption</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Tulis caption di sini..."
                  rows={6}
                  className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium text-sm">Tags</label>
                <div className="mb-2 flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded bg-[var(--accent-gold)]/10 px-2 py-0.5 text-[var(--accent-gold)] text-xs"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="ml-0.5 hover:opacity-70">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Tambah tag..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className="flex-1"
                  />
                  <Button variant="secondary" size="sm" onClick={addTag}>
                    Tambah
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
                Batal
              </Button>
              <Button size="sm" onClick={handleSave}>
                {editingId ? "Simpan Perubahan" : "Buat Template"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
