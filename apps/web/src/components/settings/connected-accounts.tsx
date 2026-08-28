"use client";

import { ExternalLink, Loader2, Link, Unlink } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TikTokIcon,
  TwitterIcon,
  YoutubeIcon,
} from "@/components/ui/platform-icons";

interface ConnectedAccount {
  id: string;
  platform: string;
  name: string;
  username: string;
  isActive: boolean;
  followersCount?: number;
  lastSyncAt?: string;
}

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  facebook: FacebookIcon,
  twitter: TwitterIcon,
  tiktok: TikTokIcon,
  linkedin: LinkedinIcon,
};

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  twitter: "Twitter / X",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
};

export function ConnectedAccountsSettings() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (platform: string) => {
    window.location.href = `/api/accounts/${platform}/connect`;
  };

  const handleDisconnect = async (id: string, platform: string) => {
    if (!confirm(`Yakin ingin memutuskan koneksi ${PLATFORM_LABELS[platform] || platform}?`)) {
      return;
    }

    setDisconnecting(id);
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        toast.success(`${PLATFORM_LABELS[platform] || platform} terputus`);
      } else {
        toast.error("Gagal memutuskan koneksi");
      }
    } catch {
      toast.error("Gagal memutuskan koneksi");
    } finally {
      setDisconnecting(null);
    }
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
        <CardTitle>Akun Tersambung</CardTitle>
        <CardDescription>Kelola akun media sosial yang terhubung</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connected Accounts */}
        {accounts.length > 0 && (
          <div className="space-y-2">
            {accounts.map((account) => {
              const Icon = PLATFORM_ICONS[account.platform] || Link;
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-secondary)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {PLATFORM_LABELS[account.platform] || account.platform}
                      </p>
                      <p className="text-[var(--text-muted)] text-xs">
                        @{account.username}
                        {account.followersCount ? ` · ${account.followersCount.toLocaleString()} followers` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {account.isActive ? (
                      <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-green-500 text-xs">
                        Aktif
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-yellow-500 text-xs">
                        Token Kadaluarsa
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(account.id, account.platform)}
                      disabled={disconnecting === account.id}
                    >
                      {disconnecting === account.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Unlink className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Connect New */}
        <div className="space-y-2">
          <p className="font-medium text-sm">Sambungkan Akun Baru</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(["instagram", "youtube", "facebook", "twitter", "tiktok", "linkedin"] as const).map(
              (platform) => {
                const Icon = PLATFORM_ICONS[platform];
                const isConnected = accounts.some((a) => a.platform === platform);
                return (
                  <Button
                    key={platform}
                    variant="secondary"
                    size="sm"
                    onClick={() => handleConnect(platform)}
                    disabled={isConnected}
                    className="justify-start gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="truncate">{PLATFORM_LABELS[platform]}</span>
                    {isConnected && <span className="ml-auto text-green-500">✓</span>}
                  </Button>
                );
              },
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
