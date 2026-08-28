"use client";

import {
  Check,
  Download,
  Grid3X3,
  Image as ImageIcon,
  List as ListIcon,
  Loader2,
  Music,
  Search,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { type MediaItem, mediaApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { detectMediaType, formatBytes, formatDate, type MediaType } from "./components/media-utils";

type ViewMode = "grid" | "list";

interface UploadProgress {
  id: string;
  fileName: string;
  progress: number;
  status: "uploading" | "registering" | "done" | "error";
  error?: string;
}

export default function MediaPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<MediaType | "all">("all");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    mediaApi
      .list()
      .then((res) => {
        if (res.ok) {
          setMediaItems(res.data.media);
        } else {
          toast.error(res.error);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const filtered = mediaItems.filter((item) => {
    const matchesSearch =
      item.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || detectMediaType(item.mimeType) === selectedType;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus media ini?")) return;
    const res = await mediaApi.delete(id);
    if (res.ok) {
      setMediaItems((prev) => prev.filter((m) => m.id !== id));
      toast.success("Media dihapus");
    } else {
      toast.error(res.error);
    }
  };

  const simulateProgress = (uploadId: string) => {
    let progress = 0;
    const timer = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 90) {
        progress = 90;
        clearInterval(timer);
      }
      setUploadProgress((prev) => prev.map((p) => (p.id === uploadId ? { ...p, progress } : p)));
    }, 300);
    return timer;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const newProgress: UploadProgress[] = [];

    for (const file of Array.from(files)) {
      const uploadId = crypto.randomUUID();
      newProgress.push({
        id: uploadId,
        fileName: file.name,
        progress: 0,
        status: "uploading",
      });
    }

    setUploadProgress((prev) => [...prev, ...newProgress]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadId = newProgress[i].id;

      try {
        const presignedRes = await mediaApi.presignedUpload(file.name, file.type, file.size);
        if (!presignedRes.ok) {
          throw new Error(presignedRes.error);
        }

        const { uploadUrl, publicUrl, key } = presignedRes.data;

        const uploadInterval = simulateProgress(uploadId);

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        clearInterval(uploadInterval);

        if (!uploadRes.ok) {
          throw new Error(`Upload failed: ${uploadRes.status}`);
        }

        const registerRes = await mediaApi.uploadComplete({
          url: publicUrl,
          mimeType: file.type,
          fileName: file.name,
          fileSize: file.size,
          r2Key: key,
        });

        if (!registerRes.ok) {
          throw new Error(registerRes.error);
        }

        setUploadProgress((prev) =>
          prev.map((p) => (p.id === uploadId ? { ...p, progress: 100, status: "done" } : p)),
        );

        const listRes = await mediaApi.list();
        if (listRes.ok) {
          setMediaItems(listRes.data.media);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Upload failed";
        setUploadProgress((prev) =>
          prev.map((p) => (p.id === uploadId ? { ...p, status: "error", error: errorMsg } : p)),
        );
        toast.error(`Gagal mengupload ${file.name}: ${errorMsg}`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const totalSize = mediaItems.reduce((s, i) => {
    const bytes = Number.parseInt(i.fileSize as unknown as string) || 0;
    return s + bytes;
  }, 0);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-semibold text-2xl">Media</h1>
          <p className="mt-1 text-[var(--text-secondary)] text-sm">
            {loading ? "Memuat..." : `${filtered.length} file`}
          </p>
        </div>
        <label className="cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <div className="flex items-center gap-2 rounded-lg bg-[var(--accent-gold)] px-4 py-2 font-medium text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50">
            <Upload className="h-4 w-4" />
            {uploading ? "Mengupload..." : "Upload File"}
          </div>
        </label>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="card space-y-3 p-4">
          <h3 className="font-medium text-sm">Status Upload</h3>
          {uploadProgress.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="truncate text-sm">{p.fileName}</span>
                  <span className="text-[var(--text-muted)] text-xs">
                    {p.status === "done"
                      ? "Selesai"
                      : p.status === "error"
                        ? "Gagal"
                        : `${Math.round(p.progress)}%`}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      p.status === "done"
                        ? "bg-green-500"
                        : p.status === "error"
                          ? "bg-red-500"
                          : "bg-[var(--accent-gold)]",
                    )}
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>
              {p.status === "done" && <Check className="h-4 w-4 text-green-500" />}
              {p.status === "error" && <X className="h-4 w-4 text-red-500" />}
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari media..."
            className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] pr-4 pl-9 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-0.5">
          {(["all", "image", "video", "audio"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={cn(
                "rounded-md px-3 py-1 font-medium text-xs transition-colors",
                selectedType === type
                  ? "bg-[var(--accent-gold)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]",
              )}
            >
              {type === "all"
                ? "Semua"
                : type === "image"
                  ? "Gambar"
                  : type === "video"
                    ? "Video"
                    : "Audio"}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              viewMode === "grid"
                ? "bg-[var(--accent-gold)] text-white"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]",
            )}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              viewMode === "list"
                ? "bg-[var(--accent-gold)] text-white"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]",
            )}
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="spinner-gradient" />
            <p className="text-[var(--text-muted)] text-sm">Memuat media...</p>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group card overflow-hidden transition-shadow hover:shadow-lg"
            >
              <div className="relative aspect-square overflow-hidden bg-[var(--bg-tertiary)]">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.fileName}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div className="flex hidden h-full items-center justify-center">
                  {detectMediaType(item.mimeType) === "video" ? (
                    <Video className="h-8 w-8 text-[var(--text-muted)]" />
                  ) : detectMediaType(item.mimeType) === "audio" ? (
                    <Music className="h-8 w-8 text-[var(--text-muted)]" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-[var(--text-muted)]" />
                  )}
                </div>

                <div className="absolute top-2 right-2">
                  <span className="rounded-full bg-black/50 px-2 py-0.5 font-medium text-white text-xs backdrop-blur-sm">
                    {item.mimeType.startsWith("image/")
                      ? "IMG"
                      : item.mimeType.startsWith("video/")
                        ? "VID"
                        : item.mimeType.startsWith("audio/")
                          ? "AUD"
                          : "FILE"}
                  </span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-colors group-hover:bg-black/40 group-hover:opacity-100">
                  <a
                    href={item.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-red-500/60"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-3">
                <p className="truncate font-medium text-sm">{item.fileName || "Untitled"}</p>
                <p className="mt-0.5 text-[var(--text-muted)] text-xs">
                  {formatBytes(item.fileSize as unknown as number)} · {formatDate(item.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-[var(--border)]">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-[var(--bg-secondary)]"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
                  {item.mimeType.startsWith("video/") ? (
                    <Video className="h-5 w-5 text-[var(--text-muted)]" />
                  ) : item.mimeType.startsWith("audio/") ? (
                    <Music className="h-5 w-5 text-[var(--text-muted)]" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-[var(--text-muted)]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.fileName || "Untitled"}</p>
                  <p className="text-[var(--text-muted)] text-sm">
                    {formatBytes(item.fileSize as unknown as number)} · {formatDate(item.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={item.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="card p-12 text-center">
          <ImageIcon className="mx-auto mb-4 h-12 w-12 text-[var(--text-muted)]" />
          <p className="text-[var(--text-secondary)]">
            {mediaItems.length === 0
              ? "Belum ada media. Upload file pertama Anda!"
              : "Tidak ada media yang cocok dengan filter."}
          </p>
        </div>
      )}
    </div>
  );
}
