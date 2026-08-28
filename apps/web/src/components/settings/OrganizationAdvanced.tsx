"use client";

import {
  Building2,
  Check,
  Copy,
  Globe,
  Loader2,
  Mail,
  Shield,
  Users,
  UserPlus,
  Settings,
  CreditCard,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
  accentColor: string;
  accentColorAlt: string;
  members?: OrganizationMember[];
  invitations?: OrganizationInvitation[];
}

interface OrganizationMember {
  id: string;
  userId: string;
  role: string;
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  isCurrentUser?: boolean;
}

interface OrganizationInvitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  inviterName: string;
}

const ROLE_CONFIG = {
  owner: { label: "Owner", color: "bg-amber-500/20 text-amber-400", description: "Akses penuh ke semua pengaturan" },
  admin: { label: "Admin", color: "bg-purple-500/20 text-purple-400", description: "Kelola anggota dan pengaturan tim" },
  editor: { label: "Editor", color: "bg-blue-500/20 text-blue-400", description: "Buat & kelola konten" },
  viewer: { label: "Viewer", color: "bg-gray-500/20 text-gray-400", description: "Hanya melihat konten" },
} as const;

export function OrganizationAdvancedUI() {
  const { data: session } = useSession();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    fetchOrganization();
  }, []);

  async function fetchOrganization() {
    try {
      const res = await fetch("/api/organization/current");
      if (res.ok) {
        const data = await res.json();
        setOrg(data.organization);
      }
    } catch {
      toast.error("Gagal memuat data organisasi");
    } finally {
      setLoading(false);
    }
  }

  const handleSaveName = async () => {
    if (!org) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/organization/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: org.name }),
      });
      if (res.ok) {
        toast.success("Nama organisasi diperbarui");
      } else {
        toast.error("Gagal memperbarui nama");
      }
    } catch {
      toast.error("Gagal memperbarui nama");
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast.error("Masukkan email yang valid");
      return;
    }

    setIsInviting(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (res.ok) {
        toast.success(`Undangan dikirim ke ${inviteEmail}`);
        setInviteEmail("");
        setInviteOpen(false);
        fetchOrganization();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal mengirim undangan");
      }
    } catch {
      toast.error("Gagal mengirim undangan");
    } finally {
      setIsInviting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/team/invitations/${invitationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Undangan dibatalkan");
        fetchOrganization();
      }
    } catch {
      toast.error("Gagal membatalkan undangan");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Hapus anggota ini dari tim?")) return;
    try {
      const res = await fetch(`/api/team/members/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Anggota dihapus");
        fetchOrganization();
      }
    } catch {
      toast.error("Gagal menghapus anggota");
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const res = await fetch(`/api/team/invitations/${invitationId}/resend`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Undangan dikirim ulang");
      }
    } catch {
      toast.error("Gagal mengirim ulang undangan");
    }
  };

  const currentUser = (session?.user as any) || null;
  const currentMember = org?.members?.find((m) => m.user.email === currentUser?.email);
  const currentUserRole = currentMember?.role || "viewer";
  const isOwner = currentUserRole === "owner";
  const isAdmin = isOwner || currentUserRole === "admin";

  const handleCopySlug = () => {
    if (org) {
      navigator.clipboard.writeText(org.slug);
      toast.success("Slug berhasil disalin");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-gold)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[var(--accent-gold)]" />
            <CardTitle>Informasi Organisasi</CardTitle>
          </div>
          <CardDescription>Kelola pengaturan dasar organisasi Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Nama Organisasi</Label>
            <Input
              id="orgName"
              value={org?.name || ""}
              onChange={(e) => setOrg(org ? { ...org, name: e.target.value } : null)}
              placeholder="Nama organisasi Anda"
              className="h-11 px-4"
            />
          </div>

          <div className="space-y-2">
            <Label>Slug</Label>
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2">
                <Globe className="h-4 w-4 text-[var(--text-muted)] mr-2 shrink-0" />
                <span className="text-[var(--text-secondary)] text-sm flex-1">{org?.slug}</span>
              </div>
              <Button variant="secondary" size="sm" onClick={handleCopySlug} className="gap-2">
                <Copy className="h-4 w-4" />
                Salin
              </Button>
            </div>
            <p className="text-[var(--text-muted)] text-xs">Slug digunakan untuk URL berbagi laporan</p>
          </div>

          <Button onClick={handleSaveName} disabled={saving || !org?.name.trim()} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Simpan Perubahan
          </Button>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--accent-gold)]" />
              <CardTitle>Anggota Tim ({org?.members?.length || 0})</CardTitle>
            </div>
            {isAdmin && (
              <Button onClick={() => setInviteOpen(true)} className="gap-2" size="sm">
                <UserPlus className="h-4 w-4" />
                Undang Anggota
              </Button>
            )}
          </div>
          <CardDescription>Kelola anggota dan hak akses tim</CardDescription>
        </CardHeader>
        <CardContent>
          {org?.members && org.members.length > 0 ? (
            <div className="space-y-3">
              {org.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient font-medium text-sm text-white">
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{member.user.name}</p>
                        {member.isCurrentUser && (
                          <Badge className="bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] text-xs">
                            Anda
                          </Badge>
                        )}
                      </div>
                      <p className="text-[var(--text-muted)] text-xs">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "rounded-full px-3 py-1 font-medium text-xs",
                      ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG]?.color,
                    )}>
                      {ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG]?.label}
                    </span>
                    {isAdmin && !member.isCurrentUser && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        Hapus
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-[var(--text-muted)] text-sm">
              Belum ada anggota tim
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {org?.invitations && org.invitations.length > 0 && isAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-[var(--accent-gold)]" />
              <CardTitle>Undangan Tersisa ({org.invitations.length})</CardTitle>
            </div>
            <CardDescription>Daftar undangan yang belum diterima</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {org.invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-gold)]/20">
                      <Mail className="h-5 w-5 text-[var(--accent-gold)]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{inv.email}</p>
                      <p className="text-[var(--text-muted)] text-xs">
                        Diajak oleh {inv.inviterName} •{" "}
                        {new Date(inv.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "rounded-full px-3 py-1 font-medium text-xs",
                    ROLE_CONFIG[inv.role as keyof typeof ROLE_CONFIG]?.color,
                  )}>
                    {ROLE_CONFIG[inv.role as keyof typeof ROLE_CONFIG]?.label}
                  </span>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResendInvitation(inv.id)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      Kirim Ulang
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvitation(inv.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      Batalkan
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[var(--accent-gold)]" />
            <CardTitle>Hak Akses</CardTitle>
          </div>
          <CardDescription>Penjelasan role dan hak akses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.entries(ROLE_CONFIG) as [keyof typeof ROLE_CONFIG, typeof ROLE_CONFIG[keyof typeof ROLE_CONFIG]][]).map(([key, config]) => (
              <div key={key} className="rounded-lg border border-[var(--border)] p-4">
                <div className={cn("inline-block rounded-full px-3 py-1 font-medium text-xs mb-2", config.color)}>
                  {config.label}
                </div>
                <p className="text-[var(--text-muted)] text-xs">{config.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-[var(--bg-secondary)] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Undang Anggota Baru</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInviteOpen(false)}
                className="h-8 w-8 p-0"
              >
                <span className="sr-only">Tutup</span>
                <span className="text-xl">×</span>
              </Button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="anggota@contoh.com"
                  className="h-11 px-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteRole">Role</Label>
                <select
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "editor" | "viewer")}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                >
                  {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label} - {config.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setInviteOpen(false)}
                  type="button"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isInviting}
                  className="gap-2"
                >
                  {isInviting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Mengirim...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" /> Kirim Undangan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
