"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error } = await requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (error) {
        setError("Gagal mengirim email. Silakan coba lagi.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
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
          <h1 className="mt-4 font-bold text-2xl">Lupa Password</h1>
          <p className="mt-2 text-[var(--text-secondary)] text-sm">
            Masukkan email Anda dan kami akan mengirim tautan untuk mengatur ulang password.
          </p>
        </div>

        <div className="card p-6">
          {success ? (
            <div className="space-y-4 text-center">
              <div className="rounded-lg bg-green-500/10 p-4 text-green-600 text-sm dark:text-green-400">
                Jika akun dengan email <strong>{email}</strong> ada, tautan reset sudah dikirim.
                Silakan periksa kotak masuk Anda.
              </div>
              <Link
                href="/login"
                className="block text-[var(--accent-gold)] text-sm hover:underline"
              >
                Kembali ke halaman masuk
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-[var(--error)]/10 p-3 text-[var(--error)] text-sm">
                  {error}
                </div>
              )}

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

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Kirim Tautan Reset
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-[var(--text-muted)] text-sm">
          Ingat password Anda?{" "}
          <Link href="/login" className="text-[var(--accent-gold)] hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
