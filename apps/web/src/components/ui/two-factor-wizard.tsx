"use client";

import { ArrowRight, Check, KeyRound, QrCode } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/auth-client";

interface TwoFactorWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TwoFactorWizard({ open, onClose, onSuccess }: TwoFactorWizardProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [qrUrl, setQrUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    try {
      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.qrUrl) {
        setQrUrl(data.qrUrl);
        setSecret(data.secret);
        setStep(2);
      } else {
        setError(data.error || "Gagal memulai setup 2FA");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    }
  };

  const verifyAndEnable = async () => {
    if (code.length !== 6) {
      setError("Kode harus 6 digit");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.success) {
        setStep(3);
        onSuccess();
      } else {
        setError(data.error || "Kode salah");
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aktifkan Autentikasi Dua Faktor</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-[var(--error)]/30 bg-[var(--error)]/5 p-3 text-[var(--error)] text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg bg-[var(--bg-tertiary)] p-4">
                <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-gold)]" />
                <div>
                  <p className="font-medium text-sm">Apa itu 2FA?</p>
                  <p className="mt-1 text-[var(--text-secondary)] text-sm">
                    Autentikasi dua faktor menambahkan lapisan keamanan ekstra dengan mengharuskan
                    kode dari aplikasi authenticator.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-sm">Langkah-langkah:</p>
                <ol className="list-inside list-decimal space-y-1 text-[var(--text-secondary)] text-sm">
                  <li>Unduh aplikasi authenticator (Google Authenticator, Authy, dll)</li>
                  <li>Pindai QR Code di bawah</li>
                  <li>Masukkan kode 6 digit untuk verifikasi</li>
                </ol>
              </div>

              <Button className="w-full" onClick={startSetup}>
                Lanjutkan <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="mb-2 font-medium text-sm">Pindai QR Code</p>
                {qrUrl ? (
                  <div className="inline-block rounded-lg bg-white p-4">
                    <QrCode className="mx-auto h-32 w-32" />
                  </div>
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-[var(--bg-tertiary)]">
                    <QrCode className="h-12 w-12 text-[var(--text-muted)]" />
                  </div>
                )}
              </div>

              {secret && (
                <div className="text-center">
                  <p className="text-[var(--text-muted)] text-xs">
                    Tidak bisa scan? Masukkan manual:
                  </p>
                  <p className="mt-1 select-all font-mono text-sm">{secret}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block font-medium text-sm">Masukkan Kode Verifikasi</label>
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={handleBack}>
                  Kembali
                </Button>
                <Button className="flex-1" onClick={verifyAndEnable} disabled={loading}>
                  {loading && <ArrowRight className="ml-2 h-4 w-4 animate-spin" />}
                  Verifikasi
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success-light)]">
                <Check className="h-8 w-8 text-[var(--success)]" />
              </div>
              <h3 className="font-semibold text-lg">2FA Berhasil Diaktifkan!</h3>
              <p className="text-[var(--text-secondary)] text-sm">
                Akun Anda sekarang lebih aman dengan autentikasi dua faktor.
              </p>
              <Button className="w-full" onClick={onClose}>
                Selesai
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
