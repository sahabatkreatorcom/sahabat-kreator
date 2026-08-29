"use client";

import { ExternalLink, Eye, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  YoutubeIcon,
} from "@/components/ui/platform-icons";
import { type Competitor, competitorsApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: InstagramIcon },
  { value: "tiktok", label: "TikTok", icon: TikTokIcon },
  { value: "youtube", label: "YouTube", icon: YoutubeIcon },
  { value: "facebook", label: "Facebook", icon: FacebookIcon },
];

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "text-pink-500",
  tiktok: "text-black",
  youtube: "text-red-500",
  facebook: "text-blue-500",
};

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPlatform, setFormPlatform] = useState("instagram");
  const [formHandle, setFormHandle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  async function fetchCompetitors() {
    setLoading(true);
    const res = await competitorsApi.list();
    if (res.ok) setCompetitors(res.data.competitors);
    else toast.error(res.error);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formHandle.trim()) {
      toast.error("Nama dan handle wajib diisi");
      return;
    }
    setSaving(true);

    const res = await competitorsApi.create({
      name: formName,
      platform: formPlatform,
      platformHandle: formHandle,
    });
    if (res.ok) {
      toast.success("Kompetitor ditambahkan");
      setFormName("");
      setFormHandle("");
      setFormPlatform("instagram");
      setShowForm(false);
      fetchCompetitors();
    } else {
      toast.error(res.error);
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus kompetitor ini?")) return;
    const res = await competitorsApi.delete(id);
    if (res.ok) {
      toast.success("Kompetitor dihapus");
      fetchCompetitors();
    } else toast.error(res.error);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-gold)]/10">
            <Eye className="h-5 w-5 text-[var(--accent-gold)]" />
          </div>
          <div>
            <h1 className="font-semibold text-2xl">Kompetitor</h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Pantau akun kompetitor di berbagai platform
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-[var(--accent-gold)] px-4 py-2 font-medium text-sm text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Tambah Kompetitor
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="card space-y-4 p-6">
          <h2 className="font-semibold">Kompetitor Baru</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block font-medium text-sm">Nama</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nama brand/person"
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-sm">Platform</label>
              <select
                value={formPlatform}
                onChange={(e) => setFormPlatform(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-medium text-sm">Handle</label>
              <input
                value={formHandle}
                onChange={(e) => setFormHandle(e.target.value)}
                placeholder="@username"
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-[var(--text-secondary)] text-sm hover:text-[var(--text-primary)]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[var(--accent-gold)] px-4 py-2 font-medium text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{" "}
              Simpan
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : competitors.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {competitors.map((comp) => {
              const platformInfo = PLATFORMS.find((p) => p.value === comp.platform);
              const Icon = platformInfo?.icon;
              return (
                <div
                  key={comp.id}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-[var(--bg-secondary)]"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]",
                      PLATFORM_COLORS[comp.platform],
                    )}
                  >
                    {Icon ? <Icon className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{comp.name}</p>
                    <p className="text-[var(--text-muted)] text-sm">{comp.platformHandle}</p>
                  </div>
                  <span className="text-[var(--text-muted)] text-xs capitalize">
                    {comp.platform}
                  </span>
                  <a
                    href={`https://${comp.platform}.com/${comp.platformHandle.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(comp.id)}
                    className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-[var(--text-secondary)] text-sm">
            Belum ada kompetitor. Klik "Tambah Kompetitor" untuk mulai memantau.
          </div>
        )}
      </div>
    </div>
  );
}
