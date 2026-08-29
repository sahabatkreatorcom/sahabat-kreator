"use client";

import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: "Apa itu Sahabat Kreator?",
    answer:
      "Sahabat Kreator adalah platform manajemen media sosial yang dirancang khusus untuk kreator Indonesia. Anda bisa mengelola semua akun media sosial, menjadwalkan konten, menganalisis performa, dan berkolaborasi dengan tim dalam satu dashboard.",
  },
  {
    question: "Platform media sosial apa saja yang didukung?",
    answer:
      "Saat ini kami mendukung Instagram, YouTube, Facebook, TikTok, Twitter/X, dan LinkedIn. Kami terus menambahkan platform baru berdasarkan permintaan pengguna.",
  },
  {
    question: "Bagaimana cara menghubungkan akun media sosial?",
    answer:
      "Masuk ke dashboard, buka Pengaturan > Akun Tersambung, lalu klik tombol hubungkan pada platform yang diinginkan. Anda akan diarahkan ke halaman otorisasi resmi dari platform tersebut.",
  },
  {
    question: "Apakah data saya aman?",
    answer:
      "Keamanan data adalah prioritas kami. Kami menggunakan enkripsi SSL/TLS, autentikasi dua faktor (2FA), dan tidak pernah menyimpan kata sandi media sosial Anda. Token akses disimpan dengan aman dan hanya digunakan untuk operasi yang Anda izinkan.",
  },
  {
    question: "Apa itu AI Caption Generator?",
    answer:
      "AI Caption Generator adalah fitur yang menggunakan kecerdasan buatan untuk membantu Anda membuat caption yang menarik. Masukkan topik, pilih tone dan gaya, lalu AI akan menghasilkan caption yang siap digunakan atau diedit.",
  },
  {
    question: "Bagaimana cara menjadwalkan postingan?",
    answer:
      "Buka halaman Compose, tulis caption, pilih media, atur tanggal dan waktu posting, lalu klik 'Jadwalkan'. Anda bisa melihat semua postingan terjadwal di halaman Calendar.",
  },
  {
    question: "Apakah ada batasan jumlah postingan?",
    answer:
      "Bergantung pada paket langganan Anda. Paket Gratis memiliki batas 10 postingan per hari, paket Pro 100 postingan, dan paket Business 500 postingan. Untuk kebutuhan lebih, hubungi kami untuk paket Enterprise.",
  },
  {
    question: "Bagaimana cara membatalkan langganan?",
    answer:
      "Masuk ke Pengaturan > Billing, lalu klik 'Kelola Langganan'. Anda bisa membatalkan kapan saja. Pembatalan akan berlaku di akhir periode penagihan saat ini.",
  },
  {
    question: "Apakah ada uji coba gratis?",
    answer:
      "Ya! Paket Gratis kami tersedia tanpa batas waktu dengan fitur dasar. Anda bisa upgrade ke paket berbayar kapan saja untuk fitur lebih lengkap.",
  },
  {
    question: "Bagaimana cara menghubungi support?",
    answer:
      "Anda bisa menghubungi kami melalui email support@sahabat-kreator.com atau melalui halaman Kontak di website kami. Tim kami akan merespons dalam 24 jam pada hari kerja.",
  },
];

function FAQAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-[var(--border)] border-b">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="font-medium text-[var(--text-primary)] text-lg">{item.question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4">
          <p className="text-[var(--text-muted)] leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 font-bold text-4xl text-[var(--text-primary)]">
            Pertanyaan yang Sering Diajukan
          </h1>
          <p className="text-[var(--text-muted)] text-lg">
            Temukan jawaban atas pertanyaan umum tentang Sahabat Kreator
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
          {FAQ_DATA.map((item, index) => (
            <FAQAccordionItem
              key={index}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="mb-4 text-[var(--text-muted)]">Tidak menemukan jawaban yang Anda cari?</p>
          <a href="/contact">
            <Button variant="secondary">Hubungi Kami</Button>
          </a>
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
