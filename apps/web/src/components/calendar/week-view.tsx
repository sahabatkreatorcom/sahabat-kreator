"use client";

import { CalendarPostCard } from "./calendar-post-card";

interface WeekViewProps {
  startDate: Date;
  posts: any[];
  onEditPost?: (id: string) => void;
  onDeletePost?: (id: string) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

export function WeekView({ startDate, posts, onEditPost, onDeletePost }: WeekViewProps) {
  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getPostsForDayAndHour = (day: Date, hour: number) => {
    return posts.filter((post) => {
      if (!post.scheduledAt) return false;
      const postDate = new Date(post.scheduledAt);
      return (
        postDate.getDate() === day.getDate() &&
        postDate.getMonth() === day.getMonth() &&
        postDate.getFullYear() === day.getFullYear() &&
        postDate.getHours() === hour
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const weekDays = getWeekDays();

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[var(--border)]">
        <div className="border-r border-[var(--border)]" />
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`border-r border-[var(--border)] p-2 text-center last:border-r-0 ${
              isToday(day) ? "bg-[var(--accent-gold-light)]" : ""
            }`}
          >
            <p className="text-[var(--text-muted)] text-xs">
              {day.toLocaleDateString("id-ID", { weekday: "short" })}
            </p>
            <p className={`font-medium text-sm ${isToday(day) ? "text-[var(--accent-gold)]" : ""}`}>
              {day.getDate()}
            </p>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="max-h-[500px] overflow-y-auto">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[var(--border)] last:border-b-0">
            <div className="border-r border-[var(--border)] py-2 pr-2 text-right">
              <span className="text-[var(--text-muted)] text-xs">
                {String(hour).padStart(2, "0")}:00
              </span>
            </div>
            {weekDays.map((day, dayIndex) => {
              const hourPosts = getPostsForDayAndHour(day, hour);
              return (
                <div
                  key={dayIndex}
                  className={`min-h-[40px] border-r border-[var(--border)] p-0.5 last:border-r-0 ${
                    isToday(day) ? "bg-[var(--accent-gold-light)]/30" : ""
                  }`}
                >
                  {hourPosts.length > 0 && (
                    <div className="space-y-0.5">
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
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
