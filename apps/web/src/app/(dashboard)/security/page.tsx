"use client";

import { KeyRound, Loader2, Shield, ShieldAlert, ShieldCheck, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TwoFactorWizard } from "@/components/ui/two-factor-wizard";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface TwoFactorStatus {
  enabled: boolean;
  hasBackupCodes: boolean;
}

export default function TwoFactorPage() {
  const { data: session } = useSession();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  useEffect(() => {
    async function fetch2FAStatus() {
      try {
        const res = await fetch("/api/auth/2fa/status");
        if (res.ok) {
          const data = await res.json();
          setIs2FAEnabled(data.enabled ?? false);
        }
      } catch {
        // Use default state
      } finally {
        setIsLoading(false);
      }
    }
    fetch2FAStatus();
  }, []);

  async function handleEnable2FA() {
    setIsWizardOpen(true);
  }

  async function handleDisable2FA() {
    if (!confirm("Yakin ingin menonaktifkan 2FA? Akun Anda akan kurang aman.")) return;
    setIsDisabling(true);
    try {
      const res = await fetch("/api/auth/2fa/disable", { method: "POST" });
      if (res.ok) {
        setIs2FAEnabled(false);
      }
    } catch {
      // Error handled by caller
    } finally {
      setIsDisabling(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Keamanan Akun</h1>
          <p className="mt-1 text-[var(--text-secondary)] text-sm">
            Kelola autentikasi dua faktor dan keamanan akun Anda
          </p>
        </div>
      </div>

      {/* 2FA Section */}
      <div className="card mb-6 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                is2FAEnabled ? "bg-[var(--success-light)]" : "bg-[var(--warning-light)]",
              )}
            >
              {is2FAEnabled ? (
                <ShieldCheck className="h-6 w-6 text-[var(--success)]" />
              ) : (
                <ShieldAlert className="h-6 w-6 text-[var(--warning)]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg">Autentikasi Dua Faktor (2FA)</h2>
                {is2FAEnabled && (
                  <Badge variant="success" className="text-xs">
                    Aktif
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-[var(--text-secondary)] text-sm">
                Tambahkan lapisan keamanan ekstra dengan mengharuskan kode dari aplikasi
                authenticator selain password Anda.
              </p>
              {is2FAEnabled && (
                <p className="mt-2 flex items-center gap-1 text-[var(--success)] text-xs">
                  <ShieldCheck className="h-3 w-3" />
                  2FA aktif — akun Anda terlindungi
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
            ) : is2FAEnabled ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDisable2FA}
                disabled={isDisabling}
              >
                {isDisabling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menonaktifkan...
                  </>
                ) : (
                  "Nonaktifkan"
                )}
              </Button>
            ) : (
              <Button size="sm" onClick={handleEnable2FA}>
                Aktifkan 2FA
              </Button>
            )}
          </div>
        </div>

        {/* 2FA Info Cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <InfoCard
            icon={<Smartphone className="h-5 w-5" />}
            title="Unduh App"
            description="Google Authenticator, Authy, atau 1Password"
          />
          <InfoCard
            icon={<KeyRound className="h-5 w-5" />}
            title="Pindai QR"
            description="Scan kode QR dari aplikasi authenticator"
          />
          <InfoCard
            icon={<Shield className="h-5 w-5" />}
            title="Simpan Kode"
            description="Kode pemulihan untuk kasus darurat"
          />
        </div>
      </div>

      {/* Security Tips */}
      <div className="card p-6">
        <h2 className="mb-4 font-semibold text-lg">Tips Keamanan</h2>
        <div className="space-y-3">
          <TipItem
            title="Gunakan authenticator app"
            description="Lebih aman daripada SMS karena tidak bisa disadap"
          />
          <TipItem
            title="Simpan kode pemulihan dengan aman"
            description="Simpan di tempat yang aman dan aksesibel hanya oleh Anda"
          />
          <TipItem
            title="Jangan bagikan kode verifikasi"
            description="Tim kami tidak akan pernah meminta kode 2FA Anda"
          />
        </div>
      </div>

      {/* 2FA Wizard Modal */}
      <TwoFactorWizard
        open={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => setIs2FAEnabled(true)}
      />
    </div>
  );
}

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-[var(--bg-tertiary)] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-gold-light)] text-[var(--accent-gold)]">
        {icon}
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="mt-0.5 text-[var(--text-muted)] text-xs">{description}</p>
      </div>
    </div>
  );
}

function TipItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-gold-light)]">
        <Shield className="h-3 w-3 text-[var(--accent-gold)]" />
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="mt-0.5 text-[var(--text-muted)] text-xs">{description}</p>
      </div>
    </div>
  );
}
