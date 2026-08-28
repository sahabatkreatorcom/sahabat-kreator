"use client";

import { ArrowLeft, Tag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  changes: { type: "feature" | "improvement" | "fix"; text: string }[];
}

const CHANGELOG_DATA: ChangelogEntry[] = [
  {
    version: "1.2.0",
    date: "28 Agustus 2026",
    title: "AI Caption Generator & Analytics",
    description: "Fitur baru untuk membantu Anda membuat konten yang lebih baik.",
    changes: [
      { type: "feature", text: "AI Caption Generator dengan multiple tone dan style" },
      { type: "feature", text: "Analytics dashboard dengan insights dan optimal times" },
      { type: "feature", text: "Engagement inbox untuk mengelola komentar, DM, dan mention" },
      { type: "improvement", text: "Calendar view dengan day, week, dan month view" },
      { type: "improvement", text: "Settings page dengan profile, notifications, dan 2FA" },
    ],
  },
  {
    version: "1.1.0",
    date: "15 Agustus 2026",
    title: "Content Management",
    description: "Pengelolaan konten yang lebih lengkap dengan pillars dan hashtags.",
    changes: [
      { type: "feature", text: "Content pillars untuk mengorganisir konten" },
      { type: "feature", text: "Hashtag collections untuk menyimpan hashtag favorit" },
      { type: "feature", text: "Competitor tracking untuk memantau kompetitor" },
      { type: "improvement", text: "Compose page dengan pillar dan hashtag selector" },
      { type: "fix", text: "Perbaikan scheduling post" },
    ],
  },
  {
    version: "1.0.0",
    date: "1 Agustus 2026",
    title: "Initial Release",
    description: "Sahabat Kreator resmi diluncurkan!",
    changes: [
      { type: "feature", text: "Dashboard dengan overview analytics" },
      { type: "feature", text: "Post composer dengan multi-platform support" },
      { type: "feature", text: "Media library untuk mengelola gambar dan video" },
      { type: "feature", text: "Calendar untuk menjadwalkan konten" },
      { type: "feature", text: "Team collaboration dengan role-based access" },
      { type: "feature", text: "Billing & subscription management" },
    ],
  },
];

const CHANGE_TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  feature: { label: "Fitur Baru", className: "bg-green-500/20 text-green-500" },
  improvement: { label: "Peningkatan", className: "bg-blue-500/20 text-blue-500" },
  fix: { label: "Perbaikan", className: "bg-yellow-500/20 text-yellow-500" },
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold text-lg">Sahabat Kreator</span>
          </Link>
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="secondary" size="sm">
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Daftar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 font-bold text-4xl text-[var(--text-primary)]">
            <Tag className="mr-2 inline h-8 w-8 text-[var(--accent-gold)]" />
            Changelog
          </h1>
          <p className="text-[var(--text-muted)] text-lg">
            Ikuti perkembangan terbaru Sahabat Kreator
          </p>
        </div>

        <div className="space-y-8">
          {CHANGELOG_DATA.map((entry, index) => (
            <div
              key={entry.version}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-full bg-[var(--accent-gold)] px-3 py-1 font-bold text-[var(--bg-primary)] text-sm">
                  v{entry.version}
                </span>
                <span className="text-[var(--text-muted)] text-sm">{entry.date}</span>
              </div>

              <h2 className="mb-2 font-semibold text-xl text-[var(--text-primary)]">{entry.title}</h2>
              <p className="mb-4 text-[var(--text-muted)]">{entry.description}</p>

              <div className="space-y-2">
                {entry.changes.map((change, changeIndex) => {
                  const config = CHANGE_TYPE_CONFIG[change.type];
                  return (
                    <div key={changeIndex} className="flex items-start gap-2">
                      <span className={`mt-0.5 rounded-full px-2 py-0.5 text-xs ${config.className}`}>
                        {config.label}
                      </span>
                      <span className="text-[var(--text-primary)] text-sm">{change.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8">
        <div className="mx-auto max-w-4xl px-6 text-center text-[var(--text-muted)] text-sm">
          <p>&copy; 2026 Sahabat Kreator. Hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
