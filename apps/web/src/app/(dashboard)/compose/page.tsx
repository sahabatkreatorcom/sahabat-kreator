"use client";

import { Calendar as CalendarIcon, Hash, Image as ImageIcon, Layers, Save, Trash2, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TikTokIcon,
  TwitterIcon,
  YoutubeIcon,
} from "@/components/ui/platform-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { accountsApi, hashtagsApi, mediaApi, pillarsApi, postsApi } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { AiCaptionGenerator } from "@/components/compose/ai-caption-generator";

type Platform = "instagram" | "youtube" | "facebook" | "tiktok" | "twitter" | "linkedin";

const PLATFORMS: { id: Platform; label: string; icon: typeof InstagramIcon }[] = [
  { id: "instagram", label: "Instagram", icon: InstagramIcon },
  { id: "youtube", label: "YouTube", icon: YoutubeIcon },
  { id: "facebook", label: "Facebook", icon: FacebookIcon },
  { id: "tiktok", label: "TikTok", icon: TikTokIcon },
  { id: "twitter", label: "X / Twitter", icon: TwitterIcon },
  { id: "linkedin", label: "LinkedIn", icon: LinkedinIcon },
];

export default function ComposePage() {
  return (
    <Suspense fallback={<ComposePageLoading />}>
      <ComposePageInner />
    </Suspense>
  );
}

function ComposePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const editId = searchParams.get("edit");

  const [caption, setCaption] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [socialAccountId, setSocialAccountId] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [autoPublish, setAutoPublish] = useState(true);
  const [postType, setPostType] = useState<"POST" | "STORY" | "REEL" | "CAROUSEL">("POST");
  const [mediaFiles, setMediaFiles] = useState<
    Array<{ id: string; url: string; type: string; name: string }>
  >([]);
  const [status, setStatus] = useState<"DRAFT" | "SCHEDULED">("DRAFT");
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Pillar & Hashtag state
  const [pillars, setPillars] = useState<any[]>([]);
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);
  const [hashtagCollections, setHashtagCollections] = useState<any[]>([]);
  const [selectedHashtagIds, setSelectedHashtagIds] = useState<string[]>([]);

  // Load accounts, pillars, hashtags on mount
  useEffect(() => {
    accountsApi
      .list()
      .then((res) => {
        if (res.ok) setAccounts(res.data.accounts);
      })
      .finally(() => setLoadingAccounts(false));

    pillarsApi.list().then((res) => {
      if (res.ok) setPillars(res.data.pillars);
    });

    hashtagsApi.list().then((res) => {
      if (res.ok) setHashtagCollections(res.data.collections);
    });
  }, []);

  // Load existing post for editing
  useEffect(() => {
    if (editId) {
      postsApi.get(editId).then((res) => {
        if (res.ok) {
          const post = res.data.post as any;
          setCaption(post.caption || "");
          setPostType(post.postType || "POST");
          setSocialAccountId(post.socialAccountId || null);
          setScheduledAt(
            post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : "",
          );
          setAutoPublish(post.autoPublish ?? true);
          setStatus(post.status as any);
          setSelectedPillarId(post.pillarId || null);
          setSelectedHashtagIds(post.hashtagIds || []);
          if (post.media?.[0]?.media) {
            setMediaFiles([
              {
                id: post.media[0].media.id,
                url: post.media[0].media.url,
                type: post.media[0].media.mimeType,
                name: post.media[0].media.fileName,
              },
            ]);
          }
        }
      });
    }
  }, [editId]);

  const handlePlatformToggle = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform],
    );
  };

  const handleHashtagToggle = (id: string) => {
    setSelectedHashtagIds((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id],
    );
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      const tempId = crypto.randomUUID();
      setMediaFiles((prev) => [
        ...prev,
        { id: tempId, url: "", type: file.type, name: file.name },
      ]);

      try {
        const presigned = await mediaApi.presignedUpload(file.name, file.type, file.size);
        if (!presigned.ok) {
          toast.error(`Gagal upload ${file.name}: ${presigned.error}`);
          setMediaFiles((prev) => prev.filter((m) => m.id !== tempId));
          continue;
        }

        const uploadRes = await fetch(presigned.data.uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadRes.ok) {
          toast.error(`Gagal upload ${file.name}`);
          setMediaFiles((prev) => prev.filter((m) => m.id !== tempId));
          continue;
        }

        const regRes = await mediaApi.uploadComplete({
          url: presigned.data.publicUrl,
          mimeType: file.type,
          fileName: file.name,
          fileSize: file.size,
          r2Key: presigned.data.key,
        });

        if (regRes.ok) {
          setMediaFiles((prev) =>
            prev.map((m) =>
              m.id === tempId
                ? {
                    ...m,
                    id: (regRes.data.media as any).id,
                    url: presigned.data.publicUrl,
                  }
                : m,
            ),
          );
        } else {
          setMediaFiles((prev) => prev.filter((m) => m.id !== tempId));
        }
      } catch {
        toast.error(`Gagal upload ${file.name}`);
        setMediaFiles((prev) => prev.filter((m) => m.id !== tempId));
      }
    }
  };

  const handleRemoveMedia = (id: string) => {
    setMediaFiles((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSave = async (draft = false) => {
    if (!caption.trim() && mediaFiles.length === 0) {
      toast.error("Tambahkan caption atau media terlebih dahulu");
      return;
    }

    setLoading(true);

    const mediaIds: string[] = [];
    for (const file of mediaFiles) {
      if (file.id && !file.id.startsWith("crypto")) {
        mediaIds.push(file.id);
      }
    }

    const postData: any = {
      caption,
      postType,
      scheduledAt: scheduledAt || null,
      autoPublish: draft ? false : autoPublish,
      status: draft ? "DRAFT" : scheduledAt ? "SCHEDULED" : "DRAFT",
      pillarId: selectedPillarId || null,
      hashtagIds: selectedHashtagIds,
      ...(socialAccountId ? { socialAccountId } : {}),
      ...(mediaIds.length > 0 ? { mediaIds } : {}),
    };

    const res = editId ? await postsApi.update(editId, postData) : await postsApi.create(postData);

    setLoading(false);

    if (res.ok) {
      toast.success(draft ? "Draft disimpan!" : "Post berhasil dibuat!");
      router.push("/calendar");
    } else {
      toast.error(res.error || "Gagal menyimpan post");
    }
  };

  const handleDelete = async () => {
    if (!editId) return;
    if (!confirm("Yakin ingin menghapus post ini?")) return;

    const res = await postsApi.delete(editId);
    if (res.ok) {
      toast.success("Post berhasil dihapus");
      router.push("/calendar");
    } else {
      toast.error(res.error || "Gagal menghapus post");
    }
  };

  // Get selected hashtags text
  const selectedHashtagText = hashtagCollections
    .filter((h) => selectedHashtagIds.includes(h.id))
    .map((h) => h.hashtags)
    .join(", ");

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl">{editId ? "Edit Post" : "Buat Post Baru"}</h1>
          <p className="mt-1 text-[var(--text-secondary)] text-sm">
            {editId
              ? "Edit konten dan jadwal post Anda"
              : "Tulis dan jadwalkan konten untuk media sosial"}
          </p>
        </div>
        {editId && (
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Editor */}
        <div className="space-y-6 lg:col-span-2">
          {/* Platform Selection */}
          <Card>
            <CardContent className="pt-6">
              <label className="mb-3 block font-medium text-sm">Platform</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = selectedPlatforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      onClick={() => handlePlatformToggle(platform.id)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-4 py-2 transition-all",
                        isSelected
                          ? "border-[var(--accent-gold)] bg-[var(--accent-gold-light)] text-[var(--accent-gold)]"
                          : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm">{platform.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Caption */}
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="font-medium text-sm">Caption</label>
                  <AiCaptionGenerator
                    onApplyCaption={setCaption}
                    currentCaption={caption}
                    platform={selectedPlatforms[0] || undefined}
                  />
                </div>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Tulis caption untuk post Anda..."
                  className="min-h-[160px] resize-y"
                />
                <p className="mt-1 text-[var(--text-muted)] text-xs">{caption.length} karakter</p>
              </div>

              {/* Post Type */}
              <div>
                <label className="mb-2 block font-medium text-sm">Tipe Post</label>
                <div className="flex gap-2">
                  {(["POST", "STORY", "REEL", "CAROUSEL"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setPostType(type)}
                      className={cn(
                        "rounded-lg border px-4 py-2 text-sm transition-all",
                        postType === type
                          ? "border-[var(--accent-gold)] bg-[var(--accent-gold-light)] text-[var(--accent-gold)]"
                          : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]",
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <label className="block font-medium text-sm">Media</label>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleMediaUpload}
                  />
                  <Button variant="secondary" size="sm">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Tambah Media
                  </Button>
                </label>
              </div>

              {mediaFiles.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {mediaFiles.map((file) => (
                    <div key={file.id} className="group relative">
                      {file.type.startsWith("image/") ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="h-32 w-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-32 w-full items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
                          <VideoIcon className="h-8 w-8 text-[var(--text-muted)]" />
                        </div>
                      )}
                      <button
                        onClick={() => handleRemoveMedia(file.id)}
                        className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-[var(--text-muted)] text-sm">
                  Belum ada media. Tambahkan gambar atau video untuk post Anda.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Schedule */}
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-[var(--accent-gold)]" />
                <label className="block font-medium text-sm">Jadwal</label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[var(--text-muted)] text-xs">
                    Tanggal & Waktu
                  </label>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="border-[var(--border)] bg-[var(--bg-secondary)]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)] text-sm">Auto Publish</span>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={autoPublish}
                      onChange={(e) => setAutoPublish(e.target.checked)}
                      disabled={!scheduledAt}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-[var(--bg-tertiary)] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--accent-gold)] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Pillar */}
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-[var(--accent-gold)]" />
                <span className="font-medium text-sm">Pilar Konten</span>
              </div>

              {pillars.length > 0 ? (
                <Select
                  value={selectedPillarId || ""}
                  onValueChange={(val) => setSelectedPillarId(val || null)}
                >
                  <SelectTrigger className="border-[var(--border)] bg-[var(--bg-secondary)]">
                    <SelectValue placeholder="Pilih pilar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tidak ada pilar</SelectItem>
                    {pillars.map((pillar: any) => (
                      <SelectItem key={pillar.id} value={pillar.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: pillar.color }}
                          />
                          {pillar.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-[var(--text-muted)] text-sm">
                  Belum ada pilar. Buat di halaman Pilar.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Hashtag Collections */}
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-[var(--accent-gold)]" />
                <span className="font-medium text-sm">Koleksi Hashtag</span>
              </div>

              {hashtagCollections.length > 0 ? (
                <div className="space-y-2">
                  {hashtagCollections.map((collection: any) => (
                    <label
                      key={collection.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all",
                        selectedHashtagIds.includes(collection.id)
                          ? "border-[var(--accent-gold)] bg-[var(--accent-gold-light)]"
                          : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent-gold)]",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedHashtagIds.includes(collection.id)}
                        onChange={() => handleHashtagToggle(collection.id)}
                        className="sr-only"
                      />
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border",
                          selectedHashtagIds.includes(collection.id)
                            ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]"
                            : "border-[var(--border)]",
                        )}
                      >
                        {selectedHashtagIds.includes(collection.id) && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">{collection.name}</p>
                        <p className="truncate text-[var(--text-muted)] text-xs">{collection.hashtags}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--text-muted)] text-sm">
                  Belum ada koleksi. Buat di halaman Hashtag.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Social Account */}
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Akun Sosial</span>
              </div>

              {loadingAccounts ? (
                <p className="text-[var(--text-muted)] text-sm">Memuat...</p>
              ) : accounts.length > 0 ? (
                <Select value={socialAccountId || ""} onValueChange={setSocialAccountId}>
                  <SelectTrigger className="border-[var(--border)] bg-[var(--bg-secondary)]">
                    <SelectValue placeholder="Pilih akun..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account: any) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.platform})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-[var(--text-muted)] text-sm">
                  Belum ada akun terhubung. Hubungkan akun di halaman Settings.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full" onClick={() => handleSave(false)} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {scheduledAt ? "Jadwalkan Post" : "Publikasikan Sekarang"}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => handleSave(true)}
              disabled={loading}
            >
              <Save className="mr-2 h-4 w-4" />
              Simpan sebagai Draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function ComposePageLoading() {
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-[var(--bg-tertiary)]" />
        <div className="h-64 rounded-lg bg-[var(--bg-tertiary)]" />
        <div className="h-32 rounded-lg bg-[var(--bg-tertiary)]" />
      </div>
    </div>
  );
}
