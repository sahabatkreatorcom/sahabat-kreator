/**
 * Sahabat Kreator — Public Landing Page
 * Shown to unauthenticated visitors at /.
 * Satisfies Google SEO and OAuth consent requirements.
 */

"use client";

import {
  BarChart3,
  Calendar,
  Clock,
  Globe,
  Heart,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: <Calendar className="h-6 w-6" />,
    title: "Jadwal Konten",
    description: "Rencanakan konten beberapa minggu ke depan dengan kalender visual drag-and-drop.",
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "AI Caption Generator",
    description: "Buat caption menarik otomatis dengan AI yang memahami brand voice Anda.",
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Analitik Terintegrasi",
    description:
      "Pantau performa semua platform dalam satu dashboard. Pahami audiens Anda lebih dalam.",
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "Engagement Terpadu",
    description: "Kelola komentar, DM, dan ulasan dari semua platform dalam satu inbox.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Kolaborasi Tim",
    description: "Undang tim, atur peran, dan kelola akses dengan mudah untuk setiap proyek.",
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "Auto-Publish",
    description:
      "Posting otomatis pada waktu terbaik yang disarankan AI untuk engagement maksimal.",
  },
] as const;

const PLATFORMS = [
  { name: "Instagram", color: "#E4405F" },
  { name: "TikTok", color: "#000000" },
  { name: "YouTube", color: "#FF0000" },
  { name: "Facebook", color: "#1877F2" },
  { name: "Twitter/X", color: "#000000" },
  { name: "LinkedIn", color: "#0A66C2" },
] as const;

const FAQ_ITEMS = [
  {
    question: "Apa itu Sahabat Kreator?",
    answer:
      "Sahabat Kreator adalah platform manajemen media sosial all-in-one yang dirancang khusus untuk kreator Indonesia. Kelola semua akun, jadwalkan konten, analisis performa, dan kolaborasi dengan tim dalam satu tempat.",
  },
  {
    question: "Apakah ada paket gratis?",
    answer:
      "Ya! Paket Gratis tersedia tanpa batas waktu dengan fitur dasar: 10 postingan per hari, 1 akun per platform, dan analitik dasar. Upgrade kapan saja untuk fitur lebih lengkap.",
  },
  {
    question: "Platform apa saja yang didukung?",
    answer:
      "Saat ini kami mendukung Instagram, YouTube, Facebook, TikTok, Twitter/X, dan LinkedIn. Kami terus menambahkan platform baru berdasarkan permintaan pengguna.",
  },
  {
    question: "Bagaimana cara menghubungkan akun media sosial?",
    answer:
      "Setelah mendaftar, masuk ke Pengaturan > Akun Tersambung, lalu klik tombol hubungkan pada platform yang diinginkan. Anda akan diarahkan ke halaman otorisasi resmi dari platform tersebut.",
  },
  {
    question: "Apakah data saya aman?",
    answer:
      "Keamanan adalah prioritas kami. Kami menggunakan enkripsi SSL/TLS, autentikasi dua faktor (2FA), dan tidak pernah menyimpan kata sandi media sosial Anda. Token akses disimpan dengan aman.",
  },
];

function FAQAccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-[var(--border)] border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="font-medium text-[var(--text-primary)] text-lg">{question}</span>
        <svg
          className={`h-5 w-5 shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <p className="pb-4 text-[var(--text-muted)] leading-relaxed">{answer}</p>}
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-30 border-[var(--border)] border-b bg-[var(--bg-primary)]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
            <span className="font-bold text-gradient text-lg">Sahabat Kreator</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="#features"
              className="hidden font-medium text-[var(--text-secondary)] text-sm transition-colors hover:text-[var(--text-primary)] md:block"
            >
              Fitur
            </Link>
            <Link
              href="#pricing"
              className="hidden font-medium text-[var(--text-secondary)] text-sm transition-colors hover:text-[var(--text-primary)] md:block"
            >
              Harga
            </Link>
            <Link
              href="#faq"
              className="hidden font-medium text-[var(--text-secondary)] text-sm transition-colors hover:text-[var(--text-primary)] md:block"
            >
              FAQ
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="sm">
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Daftar Gratis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-6 pt-16 pb-20 md:pt-28">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2"
          style={{
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, var(--accent-gold) 0%, transparent 70%)",
            opacity: 0.08,
          }}
        />
        <div
          className="pointer-events-none absolute -top-20 right-0"
          style={{
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, var(--accent-pink) 0%, transparent 70%)",
            opacity: 0.06,
          }}
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-1.5 font-medium text-[var(--text-secondary)] text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--success)]" />
            AI-Powered &middot; Multi-Platform &middot; Dibuat untuk Indonesia
          </div>

          <h1 className="font-extrabold text-4xl leading-tight tracking-tight md:text-6xl">
            Kelola Media Sosial <span className="text-gradient">Lebih Cerdas</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-[var(--text-secondary)] text-lg leading-relaxed md:text-xl">
            Sahabat Kreator membantu kreator Indonesia menjadwalkan konten, menganalisis performa,
            dan berkolaborasi dengan tim — semua dalam satu platform.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button className="h-12 rounded-full px-8 text-base">Mulai Gratis</Button>
            </Link>
            <Link href="#features">
              <Button variant="secondary" className="h-12 rounded-full px-8 text-base">
                Pelajari Lebih Lanjut
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Platforms Strip ── */}
      <section className="border-[var(--border)] border-y bg-[var(--bg-secondary)] py-10">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="mb-8 font-semibold text-[var(--text-muted)] text-xs uppercase tracking-widest">
            Terhubung ke Semua Platform
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {PLATFORMS.map((platform) => (
              <div key={platform.name} className="flex flex-col items-center gap-1.5">
                <Globe
                  className="h-6 w-6 text-[var(--text-muted)]"
                  style={{ color: platform.color }}
                />
                <span className="text-[11px] text-[var(--text-muted)]">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="font-bold text-3xl md:text-4xl">
              Semua yang Anda Butuhkan untuk <span className="text-gradient">Media Sosial</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[var(--text-secondary)]">
              Satu platform untuk jadwal, AI, analitik, dan kolaborasi tim.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 transition-colors hover:border-[var(--accent-gold)]/30"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
                  {feature.icon}
                </div>
                <h3 className="mb-2 font-semibold text-[var(--text-primary)]">{feature.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section
        id="pricing"
        className="border-[var(--border)] border-y bg-[var(--bg-secondary)] px-6 py-20 md:py-28"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="font-bold text-3xl md:text-4xl">
              Harga <span className="text-gradient">Transparan</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[var(--text-secondary)]">
              Mulai gratis, upgrade kapan saja sesuai kebutuhan.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Gratis",
                price: "Rp 0",
                period: "/selamanya",
                description: "Untuk memulai",
                features: [
                  "1 akun per platform",
                  "10 postingan/hari",
                  "Kalender konten",
                  "Analitik dasar",
                ],
                cta: "Mulai Gratis",
                highlight: false,
              },
              {
                name: "Pro",
                price: "Rp 99.000",
                period: "/bulan",
                description: "Untuk kreator serius",
                features: [
                  "5 akun per platform",
                  "100 postingan/hari",
                  "AI Caption Generator",
                  "Analitik lanjutan",
                  "Export laporan PDF",
                ],
                cta: "Coba Gratis",
                highlight: true,
              },
              {
                name: "Team",
                price: "Rp 299.000",
                period: "/bulan",
                description: "Untuk tim & agency",
                features: [
                  "Unlimited akun",
                  "500 postingan/hari",
                  "Semua fitur Pro",
                  "Kolaborasi tim",
                  "Priority support",
                ],
                cta: "Hubungi Kami",
                highlight: false,
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border p-7 ${tier.highlight ? "border-[var(--accent-gold)] bg-[var(--bg-secondary)]" : "border-[var(--border)] bg-[var(--bg-primary)]"}`}
              >
                {tier.highlight && (
                  <span className="mb-3 inline-block rounded-full bg-[var(--accent-gold)]/10 px-3 py-1 font-semibold text-[var(--accent-gold)] text-xs">
                    Paling Populer
                  </span>
                )}
                <h3 className="font-bold text-[var(--text-primary)] text-lg">{tier.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-extrabold text-3xl text-[var(--text-primary)]">
                    {tier.price}
                  </span>
                  <span className="text-[var(--text-muted)] text-sm">{tier.period}</span>
                </div>
                <p className="mt-2 text-[var(--text-muted)] text-sm">{tier.description}</p>
                <ul className="mt-6 space-y-2.5">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-[var(--text-secondary)] text-sm"
                    >
                      <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--accent-gold)]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="mt-6 block">
                  <Button
                    className={`w-full ${tier.highlight ? "bg-gradient" : "bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"}`}
                    variant={tier.highlight ? "primary" : "secondary"}
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="font-bold text-3xl md:text-4xl">Pertanyaan yang Sering Diajukan</h2>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] px-6">
            {FAQ_ITEMS.map((item) => (
              <FAQAccordionItem key={item.question} question={item.question} answer={item.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl rounded-2xl bg-gradient p-10 text-center md:p-16">
          <h2 className="mb-4 font-bold text-3xl text-[var(--bg-primary)]">
            Siap Meningkatkan Media Sosial Anda?
          </h2>
          <p className="mb-8 text-[var(--bg-primary)]/80 text-lg">
            Bergabung dengan ribuan kreator Indonesia yang sudah menggunakan Sahabat Kreator.
          </p>
          <Link href="/register">
            <Button variant="secondary" className="h-12 rounded-full px-8 font-semibold text-base">
              Daftar Sekarang — Gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-[var(--border)] border-t py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              </div>
              <span className="font-semibold text-[var(--text-primary)]">Sahabat Kreator</span>
            </div>
            <div className="flex gap-6 text-[var(--text-muted)] text-sm">
              <Link href="/about" className="hover:text-[var(--text-primary)]">
                Tentang
              </Link>
              <Link href="/faq" className="hover:text-[var(--text-primary)]">
                FAQ
              </Link>
              <Link href="/legal/terms" className="hover:text-[var(--text-primary)]">
                Syarat Layanan
              </Link>
              <Link href="/legal/privacy" className="hover:text-[var(--text-primary)]">
                Privasi
              </Link>
              <Link href="/contact" className="hover:text-[var(--text-primary)]">
                Kontak
              </Link>
            </div>
            <p className="text-[var(--text-muted)] text-sm">&copy; 2026 Sahabat Kreator</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
