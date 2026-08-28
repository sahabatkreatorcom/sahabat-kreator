"use client";

import { Copy, Loader2, Shield, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TwoFactorAuthCard() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enabling, setEnabling] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    try {
      const res = await fetch("/api/user/2fa/status");
      if (res.ok) {
        const data = await res.json();
        setIsEnabled(data.enabled);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    setEnabling(true);
    try {
      const res = await fetch("/api/user/2fa/setup", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setShowSetup(true);
      } else {
        toast.error("Gagal memulai setup 2FA");
      }
    } catch {
      toast.error("Gagal memulai setup 2FA");
    } finally {
      setEnabling(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      toast.error("Kode harus 6 digit");
      return;
    }

    setEnabling(true);
    try {
      const res = await fetch("/api/user/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode }),
      });
      if (res.ok) {
        setIsEnabled(true);
        setShowSetup(false);
        setQrCode("");
        setSecret("");
        setVerifyCode("");
        toast.success("2FA berhasil diaktifkan!");
      } else {
        toast.error("Kode verifikasi salah");
      }
    } catch {
      toast.error("Gagal memverifikasi kode");
    } finally {
      setEnabling(false);
    }
  };

  const handleDisable = async () => {
    setDisabling(true);
    try {
      const res = await fetch("/api/user/2fa/disable", { method: "POST" });
      if (res.ok) {
        setIsEnabled(false);
        toast.success("2FA berhasil dinonaktifkan");
      } else {
        toast.error("Gagal menonaktifkan 2FA");
      }
    } catch {
      toast.error("Gagal menonaktifkan 2FA");
    } finally {
      setDisabling(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success("Secret disalin!");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-gold)]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEnabled ? <ShieldCheck className="h-5 w-5 text-green-500" /> : <Shield className="h-5 w-5" />}
          Autentikasi Dua Faktor (2FA)
        </CardTitle>
        <CardDescription>Tambahkan lapisan keamanan ekstra pada akun Anda</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEnabled && !showSetup ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <span className="text-green-500 text-sm">2FA aktif</span>
            </div>
            <Button variant="danger" onClick={handleDisable} disabled={disabling} className="gap-2">
              {disabling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Nonaktifkan 2FA
            </Button>
          </div>
        ) : showSetup ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm">1. Scan QR code ini dengan aplikasi authenticator Anda:</p>
              {qrCode && (
                <div className="flex justify-center">
                  <img src={qrCode} alt="2FA QR Code" className="rounded-lg border border-[var(--border)]" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm">2. Atau masukkan kode manual:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-[var(--bg-secondary)] p-2 font-mono text-xs break-all">
                  {secret}
                </code>
                <Button variant="secondary" size="sm" onClick={copySecret}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm">3. Masukkan kode 6 digit dari aplikasi:</p>
              <div className="flex gap-2">
                <Input
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="font-mono text-center text-lg tracking-widest"
                />
                <Button onClick={handleVerify} disabled={enabling || verifyCode.length !== 6}>
                  {enabling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verifikasi"}
                </Button>
              </div>
            </div>

            <Button variant="secondary" onClick={() => { setShowSetup(false); setQrCode(""); setSecret(""); }}>
              Batal
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[var(--text-muted)] text-sm">
              2FA menambahkan lapisan keamanan dengan meminta kode dari aplikasi authenticator saat login.
            </p>
            <Button onClick={handleEnable} disabled={enabling} className="gap-2">
              {enabling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Aktifkan 2FA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
