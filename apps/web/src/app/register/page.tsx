"use client";

import { BarChart3, Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn, signUp } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Password tidak cocok");
      return;
    }

    if (password.length < 8) {
      setError("Password harus minimal 8 karakter");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp.email({
        name,
        email,
        password,
      });

      if (error) {
        setError(error.message || "Gagal membuat akun");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    try {
      await signIn.social({ provider: "google", callbackURL: "/dashboard" });
    } catch {
      setError("Gagal mendaftar dengan Google. Silakan coba lagi.");
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      {/* Hero Panel — desktop only */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient md:flex md:flex-col md:items-center md:justify-center">
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-32 -bottom-32 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/4 right-10 h-24 w-24 rotate-12 animate-pulse rounded-2xl bg-white/5" />
        <div
          className="absolute bottom-1/3 left-16 h-16 w-16 animate-pulse rounded-full bg-white/5"
          style={{ animationDelay: "1s" }}
        />

        <div className="relative z-10 max-w-md px-10 text-center text-white">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
          <h2 className="mb-4 font-bold text-3xl">Bergabung dengan Sahabat Kreator</h2>
          <p className="mb-10 text-lg text-white/80">
            Mulai kelola kehadiran media sosial Anda dengan alat bertenaga AI.
          </p>

          <div className="space-y-4 text-left">
            <FeatureItem
              icon={<Calendar className="h-5 w-5" />}
              title="Jadwal & Otomasi"
              description="Rencanakan kalender konten Anda di semua platform"
            />
            <FeatureItem
              icon={<MessageSquare className="h-5 w-5" />}
              title="Engagement Terpadu"
              description="Balas komentar, DM, dan ulasan dalam satu kotak masuk"
            />
            <FeatureItem
              icon={<BarChart3 className="h-5 w-5" />}
              title="Analitik Aktif"
              description="Pahami apa yang berhasil dengan wawasan real-time"
            />
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex w-full items-center justify-center p-8 md:w-1/2">
        <div className="w-full max-w-md space-y-8">
          {/* Logo — mobile only */}
          <div className="text-center md:hidden">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-gradient">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </div>
            <h1 className="mt-4 font-bold text-2xl text-gradient">Sahabat Kreator</h1>
            <p className="mt-2 text-[var(--text-secondary)]">Buat akun Anda</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden md:block">
            <h1 className="font-bold text-2xl">Buat akun Anda</h1>
            <p className="mt-1 text-[var(--text-secondary)]">Mulai gratis — tanpa kartu kredit</p>
          </div>

          {/* Registration Card */}
          <div className="card p-6">
            <h2 className="mb-6 text-center font-semibold text-lg md:hidden">Mulai gratis</h2>

            {/* Google OAuth */}
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleGoogleSignUp}
            >
              <GoogleIcon />
              Daftar dengan Google
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-[var(--border)] border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[var(--bg-secondary)] px-2 text-[var(--text-muted)]">
                  atau daftar dengan email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-[var(--error)]/10 p-3 text-[var(--error)] text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="mb-1 block font-medium text-sm">
                  Nama lengkap
                </label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11 px-4"
                  placeholder="Budi Santoso"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block font-medium text-sm">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 px-4"
                  placeholder="anda@contoh.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block font-medium text-sm">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 px-4"
                  placeholder="••••••••"
                />
                <p className="mt-1 text-[var(--text-muted)] text-xs">Minimal 8 karakter</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-1 block font-medium text-sm">
                  Konfirmasi password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-11 px-4"
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Buat akun
              </Button>
            </form>

            <p className="mt-6 text-center text-[var(--text-muted)] text-sm">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-[var(--accent)] hover:underline">
                Masuk
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-[var(--text-muted)] text-xs">
            Dengan membuat akun, Anda menyetujui{" "}
            <Link
              href="/legal/terms"
              as="/legal/terms"
              className="text-[var(--accent-gold)] hover:underline"
            >
              Syarat Layanan
            </Link>{" "}
            dan{" "}
            <Link
              href="/legal/privacy"
              as="/legal/privacy"
              className="text-[var(--accent-gold)] hover:underline"
            >
              Kebijakan Privasi
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
        {icon}
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-white/70">{description}</p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
