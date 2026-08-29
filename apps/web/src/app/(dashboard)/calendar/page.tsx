"use client";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calendarApi, postsApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type ViewMode = "month" | "week" | "day";

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-pink-500",
  youtube: "bg-red-500",
  facebook: "bg-blue-500",
  tiktok: "bg-black",
  twitter: "bg-sky-500",
  linkedin: "bg-blue-700",
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function CalendarPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteDate, setNoteDate] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const start = new Date(currentDate);

    if (viewMode === "month") {
      start.setDate(1);
    } else if (viewMode === "week") {
      const day = start.getDay();
      const diff = day === 0 ? 6 : day - 1;
      start.setDate(start.getDate() - diff);
    }

    const end = new Date(start);
    if (viewMode === "month") {
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
    } else if (viewMode === "week") {
      end.setDate(end.getDate() + 6);
    } else {
      end.setDate(end.getDate());
    }
    end.setHours(23, 59, 59);

    const res = await calendarApi.getEvents(start.toISOString(), end.toISOString());

    if (res.ok) {
      setPosts(res.data.posts);
      setNotes(res.data.notes);
    } else {
      toast.error("Gagal memuat kalender");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const goToPrev = () => {
    const next = new Date(currentDate);
    if (viewMode === "month") next.setMonth(next.getMonth() - 1);
    else if (viewMode === "week") next.setDate(next.getDate() - 7);
    else next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  };

  const goToNext = () => {
    const next = new Date(currentDate);
    if (viewMode === "month") next.setMonth(next.getMonth() + 1);
    else if (viewMode === "week") next.setDate(next.getDate() + 7);
    else next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const goToToday = () => setCurrentDate(new Date());

  const getMonthName = (date: Date) => {
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return months[date.getMonth()];
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const getWeekDates = (date: Date) => {
    const day = date.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const start = new Date(date);
    start.setDate(start.getDate() - diff);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const handleQuickAdd = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setHours(date.getHours() + 9);
    router.push(`/compose?date=${date.toISOString()}`);
  };

  const handleEditPost = (postId: string) => {
    router.push(`/compose?edit=${postId}`);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Hapus post ini?")) return;
    const res = await postsApi.delete(postId);
    if (res.ok) {
      toast.success("Post dihapus");
      fetchData();
    } else {
      toast.error("Gagal menghapus post");
    }
  };

  const handleCreateNote = async () => {
    if (!noteContent.trim() || !noteDate) {
      toast.error("Isi konten dan tanggal catatan");
      return;
    }

    const res = await calendarApi.createNote({
      content: noteContent,
      date: noteDate,
    });

    if (res.ok) {
      toast.success("Catatan dibuat");
      setShowNoteModal(false);
      setNoteContent("");
      setNoteDate("");
      fetchData();
    } else {
      toast.error("Gagal membuat catatan");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Hapus catatan ini?")) return;
    const res = await calendarApi.deleteNote(noteId);
    if (res.ok) {
      toast.success("Catatan dihapus");
      fetchData();
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getPostsForDate = (date: Date) => {
    return posts.filter((p) => {
      const postDate = new Date(p.scheduledAt || p.createdAt);
      return postDate.toDateString() === date.toDateString();
    });
  };

  const getPostsForHour = (date: Date, hour: number) => {
    return posts.filter((p) => {
      const postDate = new Date(p.scheduledAt || p.createdAt);
      return postDate.toDateString() === date.toDateString() && postDate.getHours() === hour;
    });
  };

  // Month View
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-28 rounded-lg bg-[var(--bg-tertiary)]" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayPosts = getPostsForDate(date);
      const dateStr = date.toISOString().split("T")[0];
      const today = isToday(date);

      days.push(
        <div
          key={day}
          onClick={() => handleQuickAdd(dateStr)}
          className={cn(
            "h-28 cursor-pointer rounded-lg border p-2 transition-colors hover:border-[var(--accent-gold)]",
            today
              ? "border-[var(--accent-gold)] bg-[var(--accent-gold-light)]"
              : "border-[var(--border)] bg-[var(--bg-secondary)]",
          )}
        >
          <div className="mb-1 flex items-center justify-between">
            <span
              className={cn(
                "font-medium text-sm",
                today ? "text-[var(--accent-gold)]" : "text-[var(--text-secondary)]",
              )}
            >
              {day}
            </span>
          </div>
          <div className="space-y-1">
            {dayPosts.slice(0, 2).map((post: any) => (
              <div
                key={post.id}
                className="flex cursor-pointer items-center gap-1 rounded bg-[var(--bg-tertiary)] px-1 py-0.5 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditPost(post.id);
                }}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    PLATFORM_COLORS[post.socialAccount?.platform] || "bg-gray-400",
                  )}
                />
                <span className="truncate">
                  {post.caption?.slice(0, 15)}
                  {post.caption?.length > 15 ? "..." : ""}
                </span>
              </div>
            ))}
            {dayPosts.length > 2 && (
              <span className="text-[var(--text-muted)] text-xs">+{dayPosts.length - 2}</span>
            )}
          </div>
        </div>,
      );
    }

    return days;
  };

  // Week View
  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    const weekDays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

    return (
      <div className="space-y-2">
        {/* Header */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-2">
          <div />
          {weekDates.map((date, i) => (
            <div
              key={i}
              className={cn(
                "py-2 text-center text-sm",
                isToday(date) && "font-bold text-[var(--accent-gold)]",
              )}
            >
              <div className="text-[var(--text-muted)]">{weekDays[i]}</div>
              <div className="font-semibold text-lg">{date.getDate()}</div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="max-h-[600px] overflow-y-auto">
          {HOURS.filter((h) => h >= 6 && h <= 22).map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-[60px_repeat(7,1fr)] gap-2 border-[var(--border)] border-t"
            >
              <div className="py-2 pr-2 text-right text-[var(--text-muted)] text-xs">
                {String(hour).padStart(2, "0")}:00
              </div>
              {weekDates.map((date, i) => {
                const hourPosts = getPostsForHour(date, hour);
                return (
                  <div
                    key={i}
                    className="min-h-[40px] cursor-pointer rounded border border-transparent p-1 transition-colors hover:border-[var(--accent-gold)]"
                    onClick={() => {
                      const dateStr = date.toISOString().split("T")[0];
                      handleQuickAdd(`${dateStr}T${String(hour).padStart(2, "0")}:00`);
                    }}
                  >
                    {hourPosts.map((post: any) => (
                      <div
                        key={post.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPost(post.id);
                        }}
                        className={cn(
                          "mb-1 cursor-pointer rounded px-1 py-0.5 text-white text-xs",
                          PLATFORM_COLORS[post.socialAccount?.platform] || "bg-gray-400",
                        )}
                      >
                        {post.caption?.slice(0, 20) || "Post"}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Day View
  const renderDayView = () => {
    const _dayPosts = getPostsForDate(currentDate);
    const dayName = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][
      currentDate.getDay()
    ];

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-[var(--text-muted)] text-sm">{dayName}</div>
          <div
            className={cn(
              "font-bold text-3xl",
              isToday(currentDate) && "text-[var(--accent-gold)]",
            )}
          >
            {currentDate.getDate()}
          </div>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {HOURS.filter((h) => h >= 6 && h <= 22).map((hour) => {
            const hourPosts = getPostsForHour(currentDate, hour);
            return (
              <div key={hour} className="flex border-[var(--border)] border-t">
                <div className="w-16 shrink-0 py-3 pr-3 text-right text-[var(--text-muted)] text-xs">
                  {String(hour).padStart(2, "0")}:00
                </div>
                <div
                  className="min-h-[50px] flex-1 cursor-pointer rounded p-2 transition-colors hover:bg-[var(--bg-tertiary)]"
                  onClick={() => {
                    const dateStr = currentDate.toISOString().split("T")[0];
                    handleQuickAdd(`${dateStr}T${String(hour).padStart(2, "0")}:00`);
                  }}
                >
                  {hourPosts.map((post: any) => (
                    <div
                      key={post.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPost(post.id);
                      }}
                      className={cn(
                        "mb-1 cursor-pointer rounded px-3 py-2 text-sm text-white",
                        PLATFORM_COLORS[post.socialAccount?.platform] || "bg-gray-400",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{post.caption || "Post"}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePost(post.id);
                          }}
                          className="ml-2 text-white/70 hover:text-white"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      {post.socialAccount?.platform && (
                        <span className="text-white/80 text-xs">{post.socialAccount.platform}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const weekDays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  const getTitle = () => {
    if (viewMode === "month") {
      return `${getMonthName(currentDate)} ${currentDate.getFullYear()}`;
    }
    if (viewMode === "week") {
      const weekDates = getWeekDates(currentDate);
      return `${weekDates[0].getDate()} - ${weekDates[6].getDate()} ${getMonthName(weekDates[6])} ${weekDates[6].getFullYear()}`;
    }
    return `${currentDate.getDate()} ${getMonthName(currentDate)} ${currentDate.getFullYear()}`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-semibold text-2xl">Kalender</h1>
          <p className="mt-1 text-[var(--text-secondary)] text-sm">
            Kelola jadwal konten media sosial Anda
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCcw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={() => router.push("/compose")}>
            <Plus className="mr-2 h-4 w-4" />
            Post Baru
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="icon" onClick={goToPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={goToToday}>
            Hari Ini
          </Button>
          <Button variant="secondary" size="icon" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="ml-4 font-medium text-lg">{getTitle()}</span>
        </div>

        <div className="flex rounded-lg bg-[var(--bg-tertiary)] p-1">
          {(["month", "week", "day"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "rounded-md px-4 py-2 text-sm transition-all",
                viewMode === mode
                  ? "bg-[var(--bg-secondary)] font-medium shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
              )}
            >
              {mode === "month" ? "Bulan" : mode === "week" ? "Minggu" : "Hari"}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <RefreshCcw className="h-8 w-8 animate-spin text-[var(--accent-gold)]" />
            <p className="text-[var(--text-muted)] text-sm">Memuat kalender...</p>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-4">
            {viewMode === "month" && (
              <>
                <div className="mb-2 grid grid-cols-7 gap-2">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="py-2 text-center font-medium text-[var(--text-muted)] text-sm"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">{renderMonthView()}</div>
              </>
            )}
            {viewMode === "week" && renderWeekView()}
            {viewMode === "day" && renderDayView()}
          </CardContent>
        </Card>
      )}

      {/* Notes Section */}
      {notes.length > 0 && (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-lg">Catatan</h2>
            <Button variant="secondary" size="sm" onClick={() => setShowNoteModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Catatan Baru
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note: any) => (
              <Card key={note.id} className="group relative">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-[var(--accent-gold)]" />
                      <span className="text-[var(--text-muted)] text-sm">
                        {new Date(note.date).toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-500 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-3 text-[var(--text-secondary)] text-sm">{note.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="mx-4 w-full max-w-md">
            <CardContent className="space-y-4 pt-6">
              <h2 className="font-semibold text-lg">Catatan Baru</h2>
              <div>
                <label className="mb-1 block font-medium text-sm">Tanggal</label>
                <Input type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block font-medium text-sm">Konten</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="min-h-[100px] w-full rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
                  placeholder="Tulis catatan..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowNoteModal(false)}>
                  Batal
                </Button>
                <Button onClick={handleCreateNote}>Simpan</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
