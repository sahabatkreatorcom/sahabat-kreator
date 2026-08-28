"use client";

import { Bell, Building2, Check, CreditCard, Globe, Key, Link, Loader2, LogOut, Palette, Shield, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BillingSettings } from "@/components/billing/billing-settings";
import { OrganizationAdvancedUI } from "@/components/settings/OrganizationAdvanced";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TwoFactorWizard } from "@/components/ui/two-factor-wizard";
import { accountsApi } from "@/lib/api-client";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type SettingsTab = "profile" | "security" | "billing" | "notifications" | "appearance" | "accounts" | "brand" | "organization";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", color: "bg-pink-500" },
  { id: "facebook", name: "Facebook", color: "bg-blue-500" },
  { id: "tiktok", name: "TikTok", color: "bg-black" },
  { id: "youtube", name: "YouTube", color: "bg-red-500" },
  { id: "twitter", name: "X / Twitter", color: "bg-sky-500" },
  { id: "linkedin", name: "LinkedIn", color: "bg-blue-700" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user as unknown as {
    name?: string;
    email?: string;
    image?: string | null;
    twoFactorEnabled?: boolean;
  };

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [billingInfo, setBillingInfo] = useState<any>(null);
  const [show2FA, setShow2FA] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Brand tone state
  const [brandVoice, setBrandVoice] = useState("profesional");
  const [brandTone, setBrandTone] = useState("ramah");
  const [brandKeywords, setBrandKeywords] = useState("");

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profil", icon: <User className="h-4 w-4" /> },
    { id: "accounts", label: "Akun Sosial", icon: <Link className="h-4 w-4" /> },
    { id: "brand", label: "Brand Tone", icon: <Palette className="h-4 w-4" /> },
    { id: "organization", label: "Organisasi", icon: <Building2 className="h-4 w-4" /> },
    { id: "security", label: "Keamanan", icon: <Shield className="h-4 w-4" /> },
    { id: "billing", label: "Billing", icon: <CreditCard className="h-4 w-4" /> },
    { id: "notifications", label: "Notifikasi", icon: <Bell className="h-4 w-4" /> },
    { id: "appearance", label: "Tampilan", icon: <Globe className="h-4 w-4" /> },
  ];

  useEffect(() => {
    fetch("/api/billing/info")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then(setBillingInfo);

    accountsApi
      .list()
      .then((res) => {
        if (res.ok) setAccounts(res.data.accounts);
      })
      .finally(() => setLoadingAccounts(false));
  }, []);

  async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    await new Promise((r) => setTimeout(r, 500));
    setIsSaving(false);
    setSaveMessage("Profil berhasil disimpan");
  }

  async function handleLogout() {
    await signOut();
    window.location.href = "/login";
  }

  async function handleDisconnectAccount(accountId: string) {
    if (!confirm("Putuskan hubungan akun ini?")) return;
    const res = await accountsApi.disconnect(accountId);
    if (res.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Pengaturan</h1>
          <p className="mt-1 text-[var(--text-secondary)] text-sm">
            Kelola akun dan preferensi Anda
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Sidebar tabs */}
        <div className="shrink-0 md:w-48">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left font-medium text-sm transition-colors",
                  activeTab === tab.id
                    ? "bg-[var(--accent-gold-light)] text-[var(--accent-gold)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="card p-6">
              <h2 className="mb-4 font-semibold text-lg">Profil</h2>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient font-semibold text-lg text-white">
                    {user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? "U"}
                  </div>
                  <div>
                    <p className="font-medium">{user?.name ?? "User"}</p>
                    <p className="text-[var(--text-muted)] text-sm">
                      {user?.email ?? "user@example.com"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-medium text-sm">Nama</label>
                  <Input
                    defaultValue={user?.name ?? ""}
                    placeholder="Nama lengkap"
                    className="h-11 px-4"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-medium text-sm">Email</label>
                  <Input
                    type="email"
                    defaultValue={user?.email ?? ""}
                    placeholder="email@contoh.com"
                    className="h-11 px-4"
                    disabled
                  />
                  <p className="mt-1 text-[var(--text-muted)] text-xs">Email tidak dapat diubah</p>
                </div>

                {saveMessage && (
                  <div className="flex items-center gap-2 rounded-lg bg-[var(--success-light)] p-3 text-[var(--success)] text-sm">
                    <Check className="h-4 w-4 shrink-0" />
                    {saveMessage}
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button type="submit" isLoading={isSaving}>
                    Simpan Perubahan
                  </Button>
                </div>
              </form>

              <div className="mt-8 border-[var(--border)] border-t pt-6">
                <h3 className="mb-2 font-medium text-[var(--error)] text-sm">Zona Bahaya</h3>
                <Button variant="danger" size="sm" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Keluar
                </Button>
              </div>
            </div>
          )}

          {/* Connected Accounts Tab */}
          {activeTab === "accounts" && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="mb-4 font-semibold text-lg">Akun Sosial Terhubung</h2>
                <p className="mb-4 text-[var(--text-muted)] text-sm">
                  Hubungkan akun media sosial Anda untuk menjadwalkan dan mempublikasikan konten.
                </p>

                {loadingAccounts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-gold)]" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {PLATFORMS.map((platform) => {
                      const connected = accounts.find(
                        (a) => a.platform?.toLowerCase() === platform.id,
                      );
                      return (
                        <div
                          key={platform.id}
                          className="flex items-center justify-between rounded-lg border border-[var(--border)] p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg text-white",
                                platform.color,
                              )}
                            >
                              <span className="font-bold text-sm">
                                {platform.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{platform.name}</p>
                              {connected ? (
                                <p className="text-[var(--success)] text-xs">
                                  ✓ Terhubung sebagai {connected.name}
                                </p>
                              ) : (
                                <p className="text-[var(--text-muted)] text-xs">Belum terhubung</p>
                              )}
                            </div>
                          </div>

                          {connected ? (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDisconnectAccount(connected.id)}
                            >
                              Putuskan
                            </Button>
                          ) : (
                            <Button variant="secondary" size="sm">
                              Hubungkan
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Brand Tone Tab */}
          {activeTab === "brand" && (
            <div className="card p-6">
              <h2 className="mb-4 font-semibold text-lg">Brand Tone & Voice</h2>
              <p className="mb-6 text-[var(--text-muted)] text-sm">
                Tentukan gaya komunikasi brand Anda untuk AI caption generator.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block font-medium text-sm">Brand Voice</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {["profesional", "kasual", "formal", "lucu"].map((voice) => (
                      <button
                        key={voice}
                        onClick={() => setBrandVoice(voice)}
                        className={cn(
                          "rounded-lg border px-4 py-3 text-sm transition-all capitalize",
                          brandVoice === voice
                            ? "border-[var(--accent-gold)] bg-[var(--accent-gold-light)] text-[var(--accent-gold)]"
                            : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]",
                        )}
                      >
                        {voice}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-medium text-sm">Tone</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {["ramah", "serius", "inspiratif", "edukatif"].map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setBrandTone(tone)}
                        className={cn(
                          "rounded-lg border px-4 py-3 text-sm transition-all capitalize",
                          brandTone === tone
                            ? "border-[var(--accent-gold)] bg-[var(--accent-gold-light)] text-[var(--accent-gold)]"
                            : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]",
                        )}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-medium text-sm">Kata Kunci Brand</label>
                  <p className="mb-2 text-[var(--text-muted)] text-xs">
                    Pisahkan dengan koma. Kata kunci ini akan digunakan AI saat membuat konten.
                  </p>
                  <Input
                    value={brandKeywords}
                    onChange={(e) => setBrandKeywords(e.target.value)}
                    placeholder="contoh: kreatif, inspiratif, Indonesia, UMKM"
                    className="h-11 px-4"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => toast.success("Brand tone berhasil disimpan!")}>
                    Simpan Pengaturan Brand
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Organization Tab */}
          {activeTab === "organization" && (
            <OrganizationAdvancedUI />
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="mb-4 font-semibold text-lg">Two-Factor Authentication</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[var(--text-secondary)] text-sm">
                      {user?.twoFactorEnabled
                        ? "2FA sudah diaktifkan pada akun Anda."
                        : "Tambahkan lapisan keamanan ekstra dengan autentikasi dua faktor."}
                    </p>
                  </div>
                  <Button
                    variant={user?.twoFactorEnabled ? "secondary" : "primary"}
                    onClick={() => setShow2FA(true)}
                    className="gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    {user?.twoFactorEnabled ? "Kelola 2FA" : "Aktifkan 2FA"}
                  </Button>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="mb-4 font-semibold text-lg">Keamanan Akun</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-[var(--border-light)] border-b py-2">
                    <div>
                      <p className="font-medium text-sm">Password</p>
                      <p className="text-[var(--text-muted)] text-xs">Terakhir diubah 30 hari lalu</p>
                    </div>
                    <Button variant="secondary" size="sm">
                      Ubah
                    </Button>
                  </div>
                  <div className="flex items-center justify-between border-[var(--border-light)] border-b py-2">
                    <div>
                      <p className="font-medium text-sm">Sesi Aktif</p>
                      <p className="text-[var(--text-muted)] text-xs">1 perangkat terhubung</p>
                    </div>
                    <Button variant="secondary" size="sm">
                      Kelola
                    </Button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-sm">API Key</p>
                      <p className="text-[var(--text-muted)] text-xs">Kelola akses programatik</p>
                    </div>
                    <Button variant="secondary" size="sm" className="gap-2">
                      <Key className="h-4 w-4" />
                      Generate
                    </Button>
                  </div>
                </div>
              </div>

              <TwoFactorWizard
                open={show2FA}
                onClose={() => setShow2FA(false)}
                onSuccess={() => {
                  setShow2FA(false);
                  window.location.reload();
                }}
              />
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === "billing" && (
            <div className="card p-6">
              <h2 className="mb-4 font-semibold text-lg">Billing & Subscription</h2>
              <BillingSettings
                tier={billingInfo?.tier ?? "FREE"}
                subscriptionStatus={billingInfo?.subscriptionStatus}
                cancelAtPeriodEnd={billingInfo?.cancelAtPeriodEnd}
                currentPeriodEnd={billingInfo?.currentPeriodEnd}
                trialDays={billingInfo?.trialDays}
                isSumopodConfigured={billingInfo?.isConfigured ?? false}
              />
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="card p-6">
              <h2 className="mb-4 font-semibold text-lg">Preferensi Notifikasi</h2>
              <div className="space-y-4">
                {[
                  { label: "Notifikasi Email", desc: "Terima pembaruan via email", defaultChecked: true },
                  { label: "Notifikasi Push", desc: "Notifikasi browser real-time", defaultChecked: true },
                  { label: "Post Terjadwal", desc: "Pengingat saat post akan dipublikasikan", defaultChecked: true },
                  { label: "Pembaruan Produk", desc: "Info fitur baru dan pembaruan", defaultChecked: false },
                  { label: "Newsletter", desc: "Tips dan trik konten mingguan", defaultChecked: false },
                ].map((pref) => (
                  <div
                    key={pref.label}
                    className="flex items-center justify-between border-[var(--border-light)] border-b py-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">{pref.label}</p>
                      <p className="text-[var(--text-muted)] text-xs">{pref.desc}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" defaultChecked={pref.defaultChecked} className="peer sr-only" />
                      <div className="peer h-6 w-11 rounded-full bg-[var(--bg-tertiary)] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--accent-gold)] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="card p-6">
              <h2 className="mb-4 font-semibold text-lg">Tampilan</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-[var(--border-light)] border-b py-2">
                  <div>
                    <p className="font-medium text-sm">Mode Gelap</p>
                    <p className="text-[var(--text-muted)] text-xs">Ubah tema tampilan aplikasi</p>
                  </div>
                  <p className="text-[var(--text-muted)] text-sm">Dikelola dari sidebar</p>
                </div>
                <div className="flex items-center justify-between border-[var(--border-light)] border-b py-2">
                  <div>
                    <p className="font-medium text-sm">Bahasa</p>
                    <p className="text-[var(--text-muted)] text-xs">Pilih bahasa antarmuka</p>
                  </div>
                  <select className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-[var(--text-primary)] text-sm">
                    <option value="id">Indonesia</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-sm">Kompak</p>
                    <p className="text-[var(--text-muted)] text-xs">Tampilan padat untuk layar kecil</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="peer h-6 w-11 rounded-full bg-[var(--bg-tertiary)] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--accent-gold)] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
