"use client";

import {
  Building2,
  CheckCircle,
  Eye,
  Key,
  LogOut,
  RefreshCw,
  Settings,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type AdminCredential,
  type AdminOrganization,
  type AdminSettings,
  type AdminUser,
  adminApi,
} from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type AdminTab = "stats" | "users" | "organizations" | "credentials" | "settings" | "impersonate";

export default function AdminPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<AdminTab>("stats");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [credentials, setCredentials] = useState<AdminCredential[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [impersonation, setImpersonation] = useState<any>(null);
  const [userSearch, setUserSearch] = useState("");
  const [orgSearch, setOrgSearch] = useState("");
  const [banModal, setBanModal] = useState<{
    open: boolean;
    userId: string;
    userName: string;
  } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [credentialForm, setCredentialForm] = useState<
    Record<string, { clientId: string; clientSecret: string }>
  >({});

  const isAdmin = (session?.user as any)?.role === "superadmin";

  useEffect(() => {
    if (!isAdmin) {
      window.location.href = "/";
      return;
    }

    Promise.all([
      adminApi.getStats().then((res) => res.ok && setStats(res.data.stats)),
      adminApi.getUsers({ limit: 50 }).then((res) => res.ok && setUsers(res.data.users)),
      adminApi
        .getOrganizations({ limit: 20 })
        .then((res) => res.ok && setOrganizations(res.data.organizations)),
      adminApi
        .getPlatformCredentials()
        .then((res) => res.ok && setCredentials(res.data.credentials)),
      adminApi.getSettings().then((res) => res.ok && setSettings(res.data.settings)),
      adminApi.getImpersonationStatus().then((res) => res.ok && setImpersonation(res.data)),
    ]).finally(() => setLoading(false));
  }, [isAdmin]);

  const handleBan = async () => {
    if (!banModal || !banReason.trim()) {
      toast.error("Alasan ban harus diisi");
      return;
    }

    const res = await adminApi.banUser(banModal.userId, { reason: banReason });
    if (res.ok) {
      toast.success("User berhasil di-ban");
      setBanModal(null);
      setBanReason("");
      const usersRes = await adminApi.getUsers({ limit: 50 });
      if (usersRes.ok) setUsers(usersRes.data.users);
    } else {
      toast.error(res.error);
    }
  };

  const handleUnban = async (userId: string) => {
    const res = await adminApi.unbanUser(userId);
    if (res.ok) {
      toast.success("User berhasil di-unban");
      const usersRes = await adminApi.getUsers({ limit: 50 });
      if (usersRes.ok) setUsers(usersRes.data.users);
    } else {
      toast.error(res.error);
    }
  };

  const handleImpersonate = async (userId: string, userName: string) => {
    const res = await adminApi.impersonate(userId);
    if (res.ok) {
      toast.success(`Now impersonating ${userName}`);
      localStorage.setItem("impersonation_token", res.data.impersonation.token);
      window.location.href = "/";
    } else {
      toast.error(res.error);
    }
  };

  const handleEndImpersonation = async () => {
    const res = await adminApi.endImpersonation();
    if (res.ok) {
      toast.success("Impersonation ended");
      localStorage.removeItem("impersonation_token");
      window.location.reload();
    }
  };

  const handleUpdateSettings = async (key: string, value: any) => {
    const res = await adminApi.updateSettings({ [key]: value });
    if (res.ok) {
      toast.success("Settings updated");
      const settingsRes = await adminApi.getSettings();
      if (settingsRes.ok) setSettings(settingsRes.data.settings);
    } else {
      toast.error(res.error);
    }
  };

  const handleSaveCredential = async (platform: string) => {
    const form = credentialForm[platform] || { clientId: "", clientSecret: "" };
    const res = await adminApi.updatePlatformCredential({ platform, clientId: form.clientId });
    if (res.ok) {
      toast.success(`Credentials for ${platform} saved`);
      const credsRes = await adminApi.getPlatformCredentials();
      if (credsRes.ok) setCredentials(credsRes.data.credentials);
    } else {
      toast.error(res.error);
    }
  };

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "stats", label: "Statistik", icon: <Eye className="h-4 w-4" /> },
    {
      id: "users",
      label: "Pengguna",
      icon: <Users className="h-4 w-4" />,
      badge: users.filter((u) => u.banned).length,
    },
    { id: "organizations", label: "Organisasi", icon: <Building2 className="h-4 w-4" /> },
    { id: "credentials", label: "Platform API", icon: <Key className="h-4 w-4" /> },
    { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
    { id: "impersonate", label: "Impersonate", icon: <UserPlus className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-semibold text-2xl">Admin Dashboard</h1>
          <p className="mt-1 text-[var(--text-secondary)] text-sm">
            Kelola platform, pengguna, dan pengaturan sistem
          </p>
        </div>
        <div className="flex items-center gap-2">
          {impersonation?.impersonating && (
            <button
              type="button"
              onClick={handleEndImpersonation}
              className="flex items-center gap-2 rounded-lg bg-[var(--error)] px-3 py-2 font-medium text-sm text-white hover:opacity-90"
            >
              <LogOut className="h-4 w-4" />
              End Impersonation
            </button>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-[var(--border)] p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="spinner-gradient" />
            <p className="text-[var(--text-muted)] text-sm">Memuat data admin...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          {activeTab === "stats" && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "blue" },
                {
                  label: "Organizations",
                  value: stats?.totalOrganizations ?? 0,
                  icon: Building2,
                  color: "purple",
                },
                {
                  label: "Members",
                  value: stats?.totalMembers ?? 0,
                  icon: UserPlus,
                  color: "green",
                },
                {
                  label: "Revenue",
                  value: `Rp ${(stats?.totalRevenue ?? 0).toLocaleString()}`,
                  icon: Key,
                  color: "gold",
                },
              ].map((stat) => (
                <div key={stat.label} className="card p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${stat.color}-500/10`}
                    >
                      <stat.icon className={`h-5 w-5 text-${stat.color}-500`} />
                    </div>
                  </div>
                  <p className="font-bold text-2xl">{stat.value}</p>
                  <p className="mt-1 text-[var(--text-muted)] text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="flex flex-wrap gap-2 border-[var(--border)] border-b pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-sm transition-colors",
                  activeTab === tab.id
                    ? "bg-[var(--accent-gold)] text-white"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]",
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="ml-1 rounded-full bg-[var(--error)] px-1.5 py-0.5 text-white text-xs">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Manajemen Pengguna</h2>
                <input
                  type="text"
                  placeholder="Cari email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-[var(--border)] border-b text-left">
                      <th className="pr-4 pb-3 font-medium text-[var(--text-muted)]">User</th>
                      <th className="pr-4 pb-3 font-medium text-[var(--text-muted)]">Role</th>
                      <th className="pr-4 pb-3 font-medium text-[var(--text-muted)]">Status</th>
                      <th className="pr-4 pb-3 font-medium text-[var(--text-muted)]">Created</th>
                      <th className="pb-3 font-medium text-[var(--text-muted)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter((u) => u.email.includes(userSearch.toLowerCase()))
                      .map((u) => (
                        <tr
                          key={u.id}
                          className="border-[var(--border-light)] border-b last:border-0"
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              {u.image ? (
                                <img src={u.image} alt={u.name} className="h-8 w-8 rounded-full" />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-gold)] font-bold text-white text-xs">
                                  {u.name?.charAt(0) || u.email?.charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{u.name || u.email}</p>
                                <p className="text-[var(--text-muted)] text-xs">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={cn(
                                "rounded-full px-2 py-1 font-medium text-xs",
                                u.role === "superadmin"
                                  ? "bg-purple-500/10 text-purple-600"
                                  : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
                              )}
                            >
                              {u.role === "superadmin" ? "Super Admin" : "User"}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            {u.banned ? (
                              <span className="flex items-center gap-1 text-[var(--error)] text-xs">
                                <XCircle className="h-3 w-3" /> Banned
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[var(--success)] text-xs">
                                <CheckCircle className="h-3 w-3" /> Active
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-[var(--text-muted)] text-xs">
                            {new Date(u.createdAt).toLocaleDateString("id-ID")}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              {!u.banned ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setBanModal({
                                      open: true,
                                      userId: u.id,
                                      userName: u.name || u.email,
                                    })
                                  }
                                  className="rounded-md bg-[var(--error)]/10 px-2 py-1 text-[var(--error)] text-xs hover:bg-[var(--error)]/20"
                                >
                                  Ban
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleUnban(u.id)}
                                  className="rounded-md bg-[var(--success)]/10 px-2 py-1 text-[var(--success)] text-xs hover:bg-[var(--success)]/20"
                                >
                                  Unban
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleImpersonate(u.id, u.name || u.email)}
                                className="rounded-md bg-[var(--accent-gold)]/10 px-2 py-1 text-[var(--accent-gold)] text-xs hover:bg-[var(--accent-gold)]/20"
                              >
                                Impersonate
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Organizations Tab */}
          {activeTab === "organizations" && (
            <div className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Organisasi</h2>
                <input
                  type="text"
                  placeholder="Cari organisasi..."
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {organizations
                  .filter((o) => o.name.toLowerCase().includes(orgSearch.toLowerCase()))
                  .map((org) => (
                    <div key={org.id} className="rounded-lg border border-[var(--border)] p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-semibold">{org.name}</h3>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 font-medium text-xs",
                            org.tier === "PRO"
                              ? "bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]"
                              : org.tier === "BUSINESS"
                                ? "bg-blue-500/10 text-blue-600"
                                : org.tier === "ENTERPRISE"
                                  ? "bg-purple-500/10 text-purple-600"
                                  : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
                          )}
                        >
                          {org.tier}
                        </span>
                      </div>
                      <p className="text-[var(--text-muted)] text-xs">{org.slug}</p>
                      <div className="mt-3 flex items-center gap-4 text-[var(--text-muted)] text-xs">
                        <span>Members: {org.memberCount ?? 0}</span>
                        <span>Posts: {org.postCount ?? 0}</span>
                      </div>
                      <p className="mt-2 text-[var(--text-muted)] text-xs">
                        Created: {new Date(org.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Credentials Tab */}
          {activeTab === "credentials" && (
            <div className="card p-6">
              <h2 className="mb-4 font-semibold">Platform API Credentials</h2>
              <p className="mb-6 text-[var(--text-muted)] text-sm">
                Atur OAuth credentials untuk setiap platform media sosial
              </p>
              <div className="space-y-4">
                {credentials.map((cred) => (
                  <div key={cred.platform} className="rounded-lg border border-[var(--border)] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold">{cred.platform}</h3>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-medium text-xs",
                          cred.isConfigured
                            ? "bg-[var(--success)]/10 text-[var(--success)]"
                            : "bg-[var(--error)]/10 text-[var(--error)]",
                        )}
                      >
                        {cred.isConfigured ? "Configured" : "Not Configured"}
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[var(--text-muted)] text-xs">
                          Client ID
                        </label>
                        <input
                          type="text"
                          defaultValue={cred.clientId}
                          onChange={(e) =>
                            setCredentialForm((f) => ({
                              ...f,
                              [cred.platform]: { ...f[cred.platform], clientId: e.target.value },
                            }))
                          }
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[var(--text-muted)] text-xs">
                          Client Secret
                        </label>
                        <input
                          type="password"
                          defaultValue={cred.clientSecret || ""}
                          onChange={(e) =>
                            setCredentialForm((f) => ({
                              ...f,
                              [cred.platform]: {
                                ...f[cred.platform],
                                clientSecret: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSaveCredential(cred.platform)}
                        className="rounded-lg bg-[var(--accent-gold)] px-4 py-2 font-medium text-sm text-white hover:opacity-90"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="card p-6">
              <h2 className="mb-4 font-semibold">Platform Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-[var(--border)] border-b pb-4">
                  <div>
                    <p className="font-medium text-sm">Registration Enabled</p>
                    <p className="text-[var(--text-muted)] text-xs">Allow new users to register</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={settings?.registrationEnabled ?? true}
                      onChange={(e) =>
                        handleUpdateSettings("registrationEnabled", e.target.checked)
                      }
                      className="sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-[var(--bg-tertiary)] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--accent-gold)] peer-checked:after:translate-x-full" />
                  </label>
                </div>
                <div className="flex items-center justify-between border-[var(--border)] border-b pb-4">
                  <div>
                    <p className="font-medium text-sm">Maintenance Mode</p>
                    <p className="text-[var(--text-muted)] text-xs">
                      Take platform offline for maintenance
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={settings?.maintenanceMode ?? false}
                      onChange={(e) => handleUpdateSettings("maintenanceMode", e.target.checked)}
                      className="sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-[var(--bg-tertiary)] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--error)] peer-checked:after:translate-x-full" />
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Max Members Per Organization</p>
                    <p className="text-[var(--text-muted)] text-xs">
                      Maximum number of members allowed
                    </p>
                  </div>
                  <input
                    type="number"
                    value={settings?.maxMembersPerOrganization ?? 20}
                    onChange={(e) =>
                      handleUpdateSettings("maxMembersPerOrganization", Number(e.target.value))
                    }
                    className="w-24 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-right text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Impersonate Tab */}
          {activeTab === "impersonate" && (
            <div className="card p-6">
              <h2 className="mb-4 font-semibold">User Impersonation</h2>
              <p className="mb-6 text-[var(--text-muted)] text-sm">
                Login sebagai user lain untuk troubleshooting
              </p>
              {impersonation?.impersonating ? (
                <div className="rounded-lg bg-[var(--accent-gold)]/10 p-4">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-[var(--accent-gold)]" />
                    <div>
                      <p className="font-medium">Currently impersonating:</p>
                      <p className="text-[var(--accent-gold)]">
                        {impersonation.session?.user?.name || impersonation.session?.user?.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleEndImpersonation}
                      className="ml-auto rounded-lg bg-[var(--error)] px-3 py-1.5 text-sm text-white hover:opacity-90"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-[var(--text-muted)]">
                  <UserPlus className="mx-auto mb-3 h-8 w-8 opacity-50" />
                  <p>Use the Impersonate button on user rows to start</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-[var(--bg-primary)] p-6">
            <h2 className="mb-4 font-semibold">Ban User</h2>
            <p className="mb-4 text-[var(--text-muted)] text-sm">
              Are you sure you want to ban <strong>{banModal.userName}</strong>?
            </p>
            <div className="mb-4">
              <label className="mb-1 block font-medium text-sm">Reason</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm"
                rows={3}
                placeholder="Reason for banning..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setBanModal(null);
                  setBanReason("");
                }}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--bg-tertiary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBan}
                className="rounded-lg bg-[var(--error)] px-4 py-2 text-sm text-white hover:opacity-90"
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
