"use client";

import { Calendar as CalendarIcon, Edit, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GridPost {
  id: string;
  caption?: string;
  postType: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED";
  scheduledAt: string;
  socialAccount?: { platform: string; name: string };
}

interface GridPlannerProps {
  posts: GridPost[];
  mode?: "weekly" | "monthly";
  onEditPost?: (id: string) => void;
  onDeletePost?: (id: string) => void;
  onQuickAdd?: (date: string) => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-pink-500",
  youtube: "bg-red-500",
  facebook: "bg-blue-500",
  tiktok: "bg-zinc-800",
  twitter: "bg-sky-500",
  linkedin: "bg-blue-700",
};

const PLATFORM_BORDER: Record<string, string> = {
  instagram: "border-pink-500",
  youtube: "border-red-500",
  facebook: "border-blue-500",
  tiktok: "border-zinc-600",
  twitter: "border-sky-500",
  linkedin: "border-blue-700",
};

const TYPE_EMOJI: Record<string, string> = {
  POST: "📝",
  STORY: "📷",
  REEL: "🎬",
  CAROUSEL: "🎠",
  VIDEO: "🎥",
};

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function getWeekDates(startDate: Date): Date[] {
  const days = [];
  const day = startDate.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(startDate);
  start.setDate(start.getDate() - diff);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function getMonthDates(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay();
  const days: (Date | null)[] = [];

  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
  while (days.length % 7 !== 0) days.push(null);

  return days;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function PostBlock({ post, onClick }: { post: GridPost; onClick: () => void }) {
  const platform = post.socialAccount?.platform || "";
  const borderClass = PLATFORM_BORDER[platform] || "border-gray-400";
  const bgClass = PLATFORM_COLORS[platform] || "bg-gray-400";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-md border-l-2 bg-[var(--bg-tertiary)] p-1.5 text-left transition-colors hover:bg-[var(--bg-secondary)]",
        borderClass,
      )}
    >
      <div className="flex items-center gap-1">
        <span className="text-xs">{TYPE_EMOJI[post.postType] || "📝"}</span>
        <span className="truncate text-[10px] text-[var(--text-secondary)]">
          {post.caption?.slice(0, 20) || "Post"}
        </span>
      </div>
      <div className="mt-0.5 flex items-center gap-1">
        <span className={cn("h-1.5 w-1.5 rounded-full", bgClass)} />
        <span className="text-[10px] text-[var(--text-muted)] capitalize">{platform}</span>
      </div>
    </button>
  );
}

function ContextMenu({
  x,
  y,
  post,
  onEdit,
  onDelete,
  onApplyAI,
  onClose,
}: {
  x: number;
  y: number;
  post: GridPost;
  onEdit?: () => void;
  onDelete?: () => void;
  onApplyAI?: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed z-50 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] py-1 shadow-lg"
      style={{ top: y, left: x }}
      onClick={onClose}
    >
      {onEdit && (
        <button
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-tertiary)]"
          onClick={onEdit}
        >
          <Edit className="h-3.5 w-3.5" /> Edit post
        </button>
      )}
      {onApplyAI && (
        <button
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-[var(--text-secondary)] text-sm hover:bg-[var(--bg-tertiary)]"
          onClick={onApplyAI}
        >
          <CalendarIcon className="h-3.5 w-3.5 text-[var(--accent-gold)]" /> Saran AI
        </button>
      )}
      {onDelete && (
        <button
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-500 text-sm hover:bg-red-500/10"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" /> Hapus
        </button>
      )}
    </div>
  );
}

export function GridPlanner({
  posts,
  mode = "weekly",
  onEditPost,
  onDeletePost,
  onQuickAdd,
}: GridPlannerProps) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    post: GridPost;
  } | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleContextMenu = useCallback((e: React.MouseEvent, post: GridPost) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, post });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  useState(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  });

  if (mode === "monthly") {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dates = getMonthDates(year, month);
    const monthName = currentDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{monthName}</h3>
          <div className="flex gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentDate(new Date(year, month - 1))}
            >
              ←
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setCurrentDate(new Date())}>
              Hari Ini
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentDate(new Date(year, month + 1))}
            >
              →
            </Button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center font-medium text-[var(--text-muted)] text-xs"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {dates.map((date, index) => {
            if (!date) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-[80px] rounded-lg bg-[var(--bg-tertiary)]/30"
                />
              );
            }

            const dayPosts = posts.filter((p) => {
              const d = new Date(p.scheduledAt);
              return d.toDateString() === date.toDateString();
            });
            const today = isToday(date);

            return (
              <div
                key={index}
                className={cn(
                  "min-h-[80px] rounded-lg border p-1.5 transition-colors",
                  today
                    ? "border-[var(--accent-gold)] bg-[var(--accent-gold-light)]"
                    : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent-gold)]/50",
                )}
                onClick={() => onQuickAdd?.(date.toISOString().split("T")[0])}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={cn(
                      "font-medium text-xs",
                      today ? "text-[var(--accent-gold)]" : "text-[var(--text-muted)]",
                    )}
                  >
                    {date.getDate()}
                  </span>
                  {dayPosts.length > 0 && (
                    <span className="text-[10px] text-[var(--text-muted)]">{dayPosts.length}</span>
                  )}
                </div>
                <div className="space-y-1">
                  {dayPosts.slice(0, 2).map((post) => (
                    <PostBlock key={post.id} post={post} onClick={() => onEditPost?.(post.id)} />
                  ))}
                  {dayPosts.length > 2 && (
                    <p className="text-center text-[10px] text-[var(--text-muted)]">
                      +{dayPosts.length - 2} lagi
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Weekly mode
  const weekDates = getWeekDates(currentDate);
  const weekLabel = `${weekDates[0].getDate()} - ${weekDates[6].getDate()} ${currentDate.toLocaleDateString("id-ID", { month: "short", year: "numeric" })}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{weekLabel}</h3>
        <div className="flex gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000))}
          >
            ←
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setCurrentDate(new Date())}>
            Hari Ini
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000))}
          >
            →
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((date, dayIndex) => {
          const dayPosts = posts.filter((p) => {
            const d = new Date(p.scheduledAt);
            return d.toDateString() === date.toDateString();
          });
          const today = isToday(date);

          return (
            <div
              key={dayIndex}
              className={cn(
                "flex min-h-[200px] flex-col rounded-lg border p-2 transition-colors",
                today
                  ? "border-[var(--accent-gold)] bg-[var(--accent-gold-light)]"
                  : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent-gold)]/50",
              )}
              onClick={() => onQuickAdd?.(date.toISOString().split("T")[0])}
            >
              {/* Day header */}
              <div className="mb-2 text-center">
                <p className="text-[var(--text-muted)] text-xs">{WEEKDAYS[dayIndex]}</p>
                <p
                  className={cn(
                    "font-bold text-lg",
                    today ? "text-[var(--accent-gold)]" : "text-[var(--text-primary)]",
                  )}
                >
                  {date.getDate()}
                </p>
              </div>

              {/* Posts */}
              <div className="flex-1 space-y-1">
                {dayPosts.map((post) => (
                  <div key={post.id} onContextMenu={(e) => handleContextMenu(e, post)}>
                    <PostBlock post={post} onClick={() => onEditPost?.(post.id)} />
                  </div>
                ))}
                {dayPosts.length === 0 && (
                  <div className="flex h-full items-center justify-center">
                    <Plus className="h-4 w-4 text-[var(--text-muted)]/40" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          post={contextMenu.post}
          onEdit={() => {
            onEditPost?.(contextMenu.post.id);
            closeContextMenu();
          }}
          onDelete={() => {
            onDeletePost?.(contextMenu.post.id);
            closeContextMenu();
          }}
          onApplyAI={() => closeContextMenu()}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}
