"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/auth-client";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
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
      const { error } = await resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        setError("Tautan reset tidak valid atau sudah kedaluwarsa.");
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
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="font-bold text-2xl">Atur Ulang Password</h1>
        <p className="mt-2 text-[var(--text-secondary)] text-sm">
          Buat password baru untuk akun Anda.
        </p>
      </div>

      <div className="card p-6">
        {success ? (
          <div className="space-y-4 text-center">
            <div className="rounded-lg bg-green-500/10 p-4 text-green-600 text-sm dark:text-green-400">
              Password berhasil diubah! Silakan masuk dengan password baru Anda.
            </div>
            <Link href="/login" className="block text-[var(--accent-gold)] text-sm hover:underline">
              Kembali ke halaman masuk
            </Link>
          </div>
        ) : !token ? (
          <div className="space-y-4 text-center">
            <div className="rounded-lg bg-[var(--error)]/10 p-4 text-[var(--error)] text-sm">
              Tautan reset tidak valid. Token tidak ditemukan.
            </div>
            <Link
              href="/forgot-password"
              as="/forgot-password"
              className="block text-[var(--accent-gold)] text-sm hover:underline"
            >
              Minta tautan reset baru
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
              <label htmlFor="password" className="mb-1 block font-medium text-sm">
                Password Baru
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="h-11 px-4"
                placeholder="Minimal 8 karakter"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1 block font-medium text-sm">
                Konfirmasi Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="h-11 px-4"
                placeholder="Ulangi password"
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Simpan Password Baru
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] p-4">
      <Suspense
        fallback={
          <div className="flex h-40 items-center justify-center text-[var(--text-muted)] text-sm">
            Memuat...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
