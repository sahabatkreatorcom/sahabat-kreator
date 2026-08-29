"use client";

import { Calendar, Edit, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PostPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    caption?: string;
    postType: string;
    status: string;
    scheduledAt?: string;
    publishedAt?: string;
    createdAt: string;
    socialAccount?: { platform: string; name: string };
    media?: Array<{ media: { url: string; type: string } }>;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-gray-500/20 text-gray-500" },
  SCHEDULED: { label: "Terjadwal", className: "bg-blue-500/20 text-blue-500" },
  PUBLISHING: { label: "Memublikasikan", className: "bg-yellow-500/20 text-yellow-500" },
  PUBLISHED: { label: "Dipublikasikan", className: "bg-green-500/20 text-green-500" },
  FAILED: { label: "Gagal", className: "bg-red-500/20 text-red-500" },
};

const TYPE_LABELS: Record<string, string> = {
  POST: "Post",
  STORY: "Story",
  REEL: "Reel",
  CAROUSEL: "Carousel",
  VIDEO: "Video",
};

export function PostPreviewModal({
  isOpen,
  onClose,
  post,
  onEdit,
  onDelete,
}: PostPreviewModalProps) {
  if (!isOpen || !post) return null;

  const statusConfig = STATUS_CONFIG[post.status] || STATUS_CONFIG.DRAFT;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-lg">Preview Post</h2>
            <p className="text-[var(--text-muted)] text-xs">
              {new Date(post.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Status & Type */}
        <div className="mb-4 flex items-center gap-2">
          <span
            className={cn("rounded-full px-2 py-0.5 font-medium text-xs", statusConfig.className)}
          >
            {statusConfig.label}
          </span>
          <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-xs">
            {TYPE_LABELS[post.postType] || post.postType}
          </span>
          {post.socialAccount?.platform && (
            <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-xs capitalize">
              {post.socialAccount.platform}
            </span>
          )}
        </div>

        {/* Media Preview */}
        {post.media && post.media.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {post.media.slice(0, 4).map((m, i) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-lg bg-[var(--bg-secondary)]"
              >
                {m.media.type.startsWith("image/") ? (
                  <img src={m.media.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-[var(--text-muted)] text-xs">Video</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Caption */}
        <div className="mb-4">
          <p className="whitespace-pre-wrap text-[var(--text-primary)] text-sm">
            {post.caption || "Tanpa caption"}
          </p>
        </div>

        {/* Schedule Info */}
        {(post.scheduledAt || post.publishedAt) && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-[var(--bg-secondary)] p-3 text-sm">
            <Calendar className="h-4 w-4 text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)]">
              {post.publishedAt
                ? `Dipublikasikan: ${new Date(post.publishedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : `Dijadwalkan: ${new Date(post.scheduledAt!).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="secondary" onClick={() => onEdit(post.id)} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="danger" onClick={() => onDelete(post.id)} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Hapus
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} className="ml-auto">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
