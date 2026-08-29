"use client";

import { ArrowLeft, Loader2, Mail, MessageSquare, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Harap isi semua field yang diperlukan");
      return;
    }

    setLoading(true);

    // Simulate sending
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Pesan berhasil dikirim! Kami akan merespons dalam 24 jam.");
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setLoading(false);
  };

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
        <div className="mb-12 text-center">
          <h1 className="mb-4 font-bold text-4xl text-[var(--text-primary)]">
            Hubungi <span className="text-[var(--accent-gold)]">Kami</span>
          </h1>
          <p className="text-[var(--text-muted)] text-lg">
            Punya pertanyaan atau masukan? Kami siap membantu Anda.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-gold)]/10">
                <Mail className="h-6 w-6 text-[var(--accent-gold)]" />
              </div>
              <h3 className="mb-2 font-semibold text-[var(--text-primary)]">Email</h3>
              <p className="text-[var(--text-muted)]">support@sahabat-kreator.com</p>
              <p className="text-[var(--text-muted)] text-sm">Respon dalam 24 jam</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-gold)]/10">
                <MessageSquare className="h-6 w-6 text-[var(--accent-gold)]" />
              </div>
              <h3 className="mb-2 font-semibold text-[var(--text-primary)]">Live Chat</h3>
              <p className="text-[var(--text-muted)]">Tersedia Senin - Jumat</p>
              <p className="text-[var(--text-muted)] text-sm">09:00 - 17:00 WIB</p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
              <h3 className="mb-2 font-semibold text-[var(--text-primary)]">Ikuti Kami</h3>
              <div className="flex gap-4">
                <a href="#" className="text-[var(--text-muted)] hover:text-[var(--accent-gold)]">
                  Instagram
                </a>
                <a href="#" className="text-[var(--text-muted)] hover:text-[var(--accent-gold)]">
                  Twitter
                </a>
                <a href="#" className="text-[var(--text-muted)] hover:text-[var(--accent-gold)]">
                  YouTube
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Anda"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subjek</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Perihal pesan Anda"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Pesan</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tulis pesan Anda di sini..."
                  className="min-h-[120px]"
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full gap-2">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Kirim Pesan
              </Button>
            </form>
          </div>
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
