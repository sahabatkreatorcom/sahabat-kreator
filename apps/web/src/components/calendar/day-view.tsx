"use client";

import { CalendarPostCard } from "./calendar-post-card";

interface DayViewProps {
  date: Date;
  posts: any[];
  onEditPost?: (id: string) => void;
  onDeletePost?: (id: string) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DayView({ date, posts, onEditPost, onDeletePost }: DayViewProps) {
  const getPostsForHour = (hour: number) => {
    return posts.filter((post) => {
      if (!post.scheduledAt) return false;
      const postDate = new Date(post.scheduledAt);
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear() &&
        postDate.getHours() === hour
      );
    });
  };

  const formatHour = (hour: number) => {
    return `${String(hour).padStart(2, "0")}:00`;
  };

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)]">
      <div className="border-b border-[var(--border)] p-3">
        <h3 className="font-medium text-sm">
          {date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </h3>
      </div>
      <div className="max-h-[600px] overflow-y-auto">
        {HOURS.map((hour) => {
          const hourPosts = getPostsForHour(hour);
          return (
            <div
              key={hour}
              className="flex border-b border-[var(--border)] last:border-b-0"
            >
              <div className="w-16 shrink-0 border-r border-[var(--border)] py-2 pr-2 text-right">
                <span className="text-[var(--text-muted)] text-xs">{formatHour(hour)}</span>
              </div>
              <div className="min-h-[48px] flex-1 p-1">
                {hourPosts.length > 0 && (
                  <div className="space-y-1">
                    {hourPosts.map((post) => (
                      <CalendarPostCard
                        key={post.id}
                        post={post}
                        onEdit={onEditPost}
                        onDelete={onDeletePost}
                        compact
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
