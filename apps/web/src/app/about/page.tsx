"use client";

import { ArrowLeft, Globe, Heart, Users, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="border-[var(--border)] border-b">
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
      <main className="mx-auto max-w-4xl px-6 py-16">
        {/* Hero */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 font-bold text-4xl text-[var(--text-primary)]">
            Tentang <span className="text-[var(--accent-gold)]">Sahabat Kreator</span>
          </h1>
          <p className="mx-auto max-w-2xl text-[var(--text-muted)] text-lg">
            Platform manajemen media sosial yang dirancang khusus untuk kreator Indonesia. Kelola
            semua akun dalam satu tempat, jadwalkan konten, dan analisis performa.
          </p>
        </div>

        {/* Mission */}
        <div className="mb-16 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-8">
          <h2 className="mb-4 font-semibold text-2xl text-[var(--text-primary)]">Misi Kami</h2>
          <p className="text-[var(--text-muted)] text-lg leading-relaxed">
            Kami percaya setiap kreator Indonesia berhak memiliki alat profesional untuk mengelola
            kehadiran digital mereka. Sahabat Kreator hadir untuk menyederhanakan proses manajemen
            media sosial, sehingga kreator dapat fokus pada yang paling penting: membuat konten yang
            menginspirasi.
          </p>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="mb-8 text-center font-semibold text-2xl text-[var(--text-primary)]">
            Nilai-Nilai Kami
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-gold)]/10">
                <Heart className="h-6 w-6 text-[var(--accent-gold)]" />
              </div>
              <h3 className="mb-2 font-semibold text-[var(--text-primary)] text-lg">
                Berpusat pada Kreator
              </h3>
              <p className="text-[var(--text-muted)]">
                Setiap fitur kami rancang dengan memahami kebutuhan dan tantangan kreator konten
                Indonesia.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-gold)]/10">
                <Zap className="h-6 w-6 text-[var(--accent-gold)]" />
              </div>
              <h3 className="mb-2 font-semibold text-[var(--text-primary)] text-lg">
                Mudah Digunakan
              </h3>
              <p className="text-[var(--text-muted)]">
                Antarmuka intuitif yang tidak memerlukan pelajaran rumit. Mulai dalam hitungan
                menit.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-gold)]/10">
                <Users className="h-6 w-6 text-[var(--accent-gold)]" />
              </div>
              <h3 className="mb-2 font-semibold text-[var(--text-primary)] text-lg">
                Kolaborasi Tim
              </h3>
              <p className="text-[var(--text-muted)]">
                Bekerja sama dengan tim Anda secara efisien. Kelola akses, berikan feedback, dan
                koordinasi konten.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-gold)]/10">
                <Globe className="h-6 w-6 text-[var(--accent-gold)]" />
              </div>
              <h3 className="mb-2 font-semibold text-[var(--text-primary)] text-lg">
                Fokus Indonesia
              </h3>
              <p className="text-[var(--text-muted)]">
                Dibuat untuk pasar Indonesia dengan dukungan bahasa lokal dan pemahaman mendalam
                tentang tren lokal.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-xl bg-[var(--accent-gold)] p-8 text-center">
          <h2 className="mb-4 font-semibold text-2xl text-[var(--bg-primary)]">Siap Memulai?</h2>
          <p className="mb-6 text-[var(--bg-primary)]/80">
            Bergabung dengan ribuan kreator Indonesia yang sudah menggunakan Sahabat Kreator.
          </p>
          <Link href="/register">
            <Button variant="secondary" size="lg">
              Daftar Sekarang
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-[var(--border)] border-t py-8">
        <div className="mx-auto max-w-4xl px-6 text-center text-[var(--text-muted)] text-sm">
          <p>&copy; 2026 Sahabat Kreator. Hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
