"use client";

import { Calendar, Clock, Edit, GripVertical, Trash2, TrendingUp } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimelinePost {
  id: string;
  caption?: string;
  postType: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED";
  scheduledAt: string;
  socialAccount?: { platform: string; name: string };
  engagement?: { likes: number; comments: number; shares: number; views: number };
}

interface TimelineViewProps {
  posts: TimelinePost[];
  onEditPost?: (id: string) => void;
  onDeletePost?: (id: string) => void;
  onReschedulePost?: (id: string, newDate: string) => void;
  showPerformance?: boolean;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-pink-500",
  youtube: "bg-red-500",
  facebook: "bg-blue-500",
  tiktok: "bg-zinc-800",
  twitter: "bg-sky-500",
  linkedin: "bg-blue-700",
};

const PLATFORM_TEXT_COLORS: Record<string, string> = {
  instagram: "text-pink-500",
  youtube: "text-red-500",
  facebook: "text-blue-500",
  tiktok: "text-zinc-600",
  twitter: "text-sky-500",
  linkedin: "text-blue-700",
};

const TYPE_LABELS: Record<string, string> = {
  POST: "Post",
  STORY: "Story",
  REEL: "Reel",
  CAROUSEL: "Carousel",
  VIDEO: "Video",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SCHEDULED: "Terjadwal",
  PUBLISHED: "Dipublikasi",
  FAILED: "Gagal",
};

function formatDateTime(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(isoString: string) {
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  return formatDateTime(isoString);
}

function PerformanceOverlay({ engagement }: { engagement: TimelinePost["engagement"] }) {
  if (!engagement) return null;
  return (
    <div className="mt-3 border-[var(--border)] border-t pt-3">
      <p className="mb-2 font-medium text-[var(--text-muted)] text-xs uppercase tracking-wider">
        Performa
      </p>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Like", value: engagement.likes, icon: "❤️" },
          { label: "Komen", value: engagement.comments, icon: "💬" },
          { label: "Bagi", value: engagement.shares, icon: "🔗" },
          { label: "View", value: engagement.views, icon: "👁" },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="font-semibold text-[var(--text-primary)] text-sm">
              {value?.toLocaleString("id-ID") ?? 0}
            </p>
            <p className="text-[var(--text-muted)] text-xs">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineItem({
  post,
  isLast,
  onEdit,
  onDelete,
  onReschedule,
  showPerformance,
}: {
  post: TimelinePost;
  isLast: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onReschedule?: (id: string, newDate: string) => void;
  showPerformance: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [showPerformanceOverlay, setShowPerformanceOverlay] = useState(false);
  const dragStartTime = useRef<number | null>(null);
  const dragStartY = useRef<number>(0);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", post.id);
      setIsDragging(true);
      dragStartTime.current = Date.now();
      dragStartY.current = e.clientY;
    },
    [post.id],
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragStartTime.current = null;
  }, []);

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all",
            PLATFORM_COLORS[post.socialAccount?.platform ?? ""] || "bg-gray-400",
            isDragging && "scale-110 ring-4 ring-[var(--accent-gold)]/30",
          )}
        >
          <GripVertical className="h-4 w-4 text-white opacity-70" />
        </div>
        {!isLast && <div className="my-1 w-px flex-1 bg-[var(--border)]" />}
      </div>

      {/* Content */}
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={cn(
          "flex-1 cursor-grab rounded-xl border bg-[var(--bg-secondary)] p-4 transition-all active:cursor-grabbing",
          isDragging && "scale-[0.98] opacity-50",
          !isDragging && "hover:border-[var(--accent-gold)]/50 hover:shadow-sm",
        )}
      >
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                PLATFORM_COLORS[post.socialAccount?.platform ?? ""] || "bg-gray-400",
              )}
            />
            <span
              className={cn(
                "font-medium text-xs capitalize",
                PLATFORM_TEXT_COLORS[post.socialAccount?.platform ?? ""] || "text-gray-500",
              )}
            >
              {post.socialAccount?.platform || "Platform"}
            </span>
            <span className="text-[var(--text-muted)] text-xs">·</span>
            <Badge variant="secondary" className="text-xs">
              {TYPE_LABELS[post.postType] || post.postType}
            </Badge>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-medium text-xs",
                post.status === "PUBLISHED" && "bg-green-500/20 text-green-500",
                post.status === "SCHEDULED" && "bg-blue-500/20 text-blue-500",
                post.status === "FAILED" && "bg-red-500/20 text-red-500",
                post.status === "DRAFT" && "bg-gray-500/20 text-gray-500",
              )}
            >
              {STATUS_LABELS[post.status]}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onEdit(post.id)}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                onClick={() => onDelete(post.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Caption */}
        <p className="mb-3 text-[var(--text-secondary)] text-sm leading-relaxed">
          {(post.caption || "").slice(0, 200) || "Tanpa caption"}
          {(post.caption?.length ?? 0) > 200 && "..."}
        </p>

        {/* Time & Performance toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDateTime(post.scheduledAt)}</span>
            <span className="text-[var(--text-muted)]/60">·</span>
            <span>{formatRelative(post.scheduledAt)}</span>
          </div>

          {post.engagement && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setShowPerformanceOverlay((v) => !v)}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {showPerformance || showPerformanceOverlay ? "Sembunyikan" : "Performa"}
            </Button>
          )}
        </div>

        {/* Performance overlay */}
        {(showPerformance || showPerformanceOverlay) && post.engagement && (
          <PerformanceOverlay engagement={post.engagement} />
        )}
      </div>
    </div>
  );
}

export function TimelineView({
  posts,
  onEditPost,
  onDeletePost,
  onReschedulePost,
  showPerformance = false,
}: TimelineViewProps) {
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );

  if (sortedPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Calendar className="mb-4 h-12 w-12 text-[var(--text-muted)]/40" />
        <p className="font-medium text-[var(--text-secondary)]">Belum ada post</p>
        <p className="mt-1 text-[var(--text-muted)] text-sm">
          Post akan muncul di sini secara kronologis
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {sortedPosts.map((post, index) => (
        <TimelineItem
          key={post.id}
          post={post}
          isLast={index === sortedPosts.length - 1}
          onEdit={onEditPost}
          onDelete={onDeletePost}
          onReschedule={onReschedulePost}
          showPerformance={showPerformance}
        />
      ))}
    </div>
  );
}
