"use client";

import { CalendarPostCard } from "./calendar-post-card";

interface MonthViewProps {
  year: number;
  month: number;
  posts: any[];
  onEditPost?: (id: string) => void;
  onDeletePost?: (id: string) => void;
}

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function MonthView({ year, month, posts, onEditPost, onDeletePost }: MonthViewProps) {
  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  };

  const getPostsForDay = (day: Date) => {
    return posts.filter((post) => {
      if (!post.scheduledAt) return false;
      const postDate = new Date(post.scheduledAt);
      return (
        postDate.getDate() === day.getDate() &&
        postDate.getMonth() === day.getMonth() &&
        postDate.getFullYear() === day.getFullYear()
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

  const days = getDaysInMonth();

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="grid grid-cols-7 border-[var(--border)] border-b">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="border-[var(--border)] border-r p-2 text-center last:border-r-0"
          >
            <span className="font-medium text-[var(--text-muted)] text-xs">{day}</span>
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          if (!day) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-[100px] border-[var(--border)] border-r border-b bg-[var(--bg-secondary)]/50 p-1 last:border-r-0"
              />
            );
          }

          const dayPosts = getPostsForDay(day);
          return (
            <div
              key={index}
              className={`min-h-[100px] border-[var(--border)] border-r border-b p-1 last:border-r-0 ${
                isToday(day) ? "bg-[var(--accent-gold-light)]" : ""
              }`}
            >
              <p
                className={`mb-1 text-right text-xs ${
                  isToday(day) ? "font-bold text-[var(--accent-gold)]" : "text-[var(--text-muted)]"
                }`}
              >
                {day.getDate()}
              </p>
              <div className="space-y-0.5">
                {dayPosts.slice(0, 3).map((post) => (
                  <CalendarPostCard
                    key={post.id}
                    post={post}
                    onEdit={onEditPost}
                    onDelete={onDeletePost}
                    compact
                  />
                ))}
                {dayPosts.length > 3 && (
                  <p className="text-center text-[var(--text-muted)] text-xs">
                    +{dayPosts.length - 3} lagi
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
