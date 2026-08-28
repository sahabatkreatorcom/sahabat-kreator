"use client";

import { Calendar, Clock, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarPostCardProps {
  post: {
    id: string;
    caption?: string;
    postType: string;
    status: string;
    scheduledAt?: string;
    socialAccount?: { platform: string; name: string };
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "border-gray-500 bg-gray-500/10",
  SCHEDULED: "border-blue-500 bg-blue-500/10",
  PUBLISHED: "border-green-500 bg-green-500/10",
  FAILED: "border-red-500 bg-red-500/10",
};

const TYPE_LABELS: Record<string, string> = {
  POST: "Post",
  STORY: "Story",
  REEL: "Reel",
  CAROUSEL: "Carousel",
  VIDEO: "Video",
};

export function CalendarPostCard({ post, onEdit, onDelete, compact }: CalendarPostCardProps) {
  const statusColor = STATUS_COLORS[post.status] || STATUS_COLORS.DRAFT;

  if (compact) {
    return (
      <div
        className={cn(
          "cursor-pointer rounded-md border-l-2 bg-[var(--bg-secondary)] px-2 py-1 transition-colors hover:bg-[var(--bg-tertiary)]",
          statusColor.split(" ")[0],
        )}
      >
        <p className="truncate text-xs">{post.caption?.slice(0, 30) || "Tanpa caption"}</p>
        <div className="flex items-center gap-1">
          <span className="text-[var(--text-muted)] text-xs">{TYPE_LABELS[post.postType] || post.postType}</span>
          {post.scheduledAt && (
            <span className="text-[var(--text-muted)] text-xs">
              · {new Date(post.scheduledAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group rounded-lg border bg-[var(--bg-primary)] p-3 transition-colors hover:border-[var(--accent-gold)]", statusColor.split(" ")[0])}>
      <div className="mb-2 flex items-start justify-between">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            post.status === "PUBLISHED"
              ? "bg-green-500/20 text-green-500"
              : post.status === "SCHEDULED"
                ? "bg-blue-500/20 text-blue-500"
                : post.status === "FAILED"
                  ? "bg-red-500/20 text-red-500"
                  : "bg-gray-500/20 text-gray-500",
          )}
        >
          {post.status}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onEdit(post.id)}>
              <Edit className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onDelete(post.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <p className="mb-2 line-clamp-2 text-sm">{post.caption?.slice(0, 80) || "Tanpa caption"}</p>

      <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs">
        <span className="rounded bg-[var(--bg-secondary)] px-1.5 py-0.5">
          {TYPE_LABELS[post.postType] || post.postType}
        </span>
        {post.socialAccount?.platform && (
          <span className="capitalize">{post.socialAccount.platform}</span>
        )}
        {post.scheduledAt && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(post.scheduledAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
}
