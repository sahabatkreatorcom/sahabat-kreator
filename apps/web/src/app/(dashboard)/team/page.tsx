"use client";

import {
  AlertCircle,
  Check,
  Loader2,
  Mail,
  MoreVertical,
  RefreshCcw,
  Shield,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type TeamInvitation, type TeamMember, teamApi } from "@/lib/api-client";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const ROLES = [
  {
    value: "admin",
    label: "Admin",
    description: "Akses penuh ke semua fitur",
    color: "bg-red-500/10 text-red-600",
  },
  {
    value: "editor",
    label: "Editor",
    description: "Buat & kelola konten",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Hanya melihat konten",
    color: "bg-gray-500/10 text-gray-600",
  },
] as const;

export default function TeamPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const currentUserId = (session?.user as any)?.id;
  const currentMember = members.find((m) => m.isCurrentUser);
  const currentUserRole = currentMember?.role ?? "viewer";
  const isAdmin = currentUserRole === "admin";

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setLoading(true);
    const res = await teamApi.getMembers();
    if (res.ok) {
      setMembers(res.data.members);
      setInvitations(res.data.invitations);
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");

    if (!inviteEmail || !inviteEmail.includes("@")) {
      setInviteError("Masukkan email yang valid");
      return;
    }

    setIsInviting(true);
    const res = await teamApi.invite({ email: inviteEmail, role: inviteRole });

    if (res.ok) {
      toast.success(`Undangan dikirim ke ${inviteEmail}`);
      setInviteEmail("");
      setInviteRole("editor");
      setShowInvite(false);
      fetchMembers();
    } else {
      setInviteError(res.error);
      toast.error(res.error);
    }
    setIsInviting(false);
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Hapus anggota ini dari tim?")) return;
    const res = await teamApi.removeMember(memberId);
    if (res.ok) {
      toast.success("Anggota dihapus");
      fetchMembers();
    } else {
      toast.error(res.error);
    }
  }

  async function handleUpdateRole(memberId: string, role: "admin" | "editor" | "viewer") {
    const res = await teamApi.updateRole(memberId, role);
    if (res.ok) {
      toast.success("Role diperbarui");
      fetchMembers();
    } else {
      toast.error(res.error);
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    const res = await teamApi.cancelInvitation(invitationId);
    if (res.ok) {
      toast.success("Undangan dibatalkan");
      fetchMembers();
    }
  }

  async function handleResendInvitation(invitationId: string) {
    const res = await teamApi.resendInvitation(invitationId);
    if (res.ok) {
      toast.success("Undangan dikirim ulang");
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Tim</h1>
          <p className="mt-1 text-[var(--text-secondary)] text-sm">
            Kelola anggota tim dan hak akses
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-2 rounded-lg bg-[var(--accent-gold)] px-4 py-2 font-medium text-sm text-white transition-opacity hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />
            Undang Anggota
          </button>
        )}
      </div>

      {/* Invite Form */}
      {showInvite && (
        <div className="card space-y-4 p-6">
          <h2 className="font-semibold">Undang Anggota Baru</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            {inviteError && (
              <div className="rounded-lg bg-[var(--error)]/10 p-3 text-[var(--error)] text-sm">
                {inviteError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-medium text-sm">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="anggota@contoh.com"
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-sm">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "editor" | "viewer")}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowInvite(false);
                  setInviteError("");
                }}
                className="px-4 py-2 text-[var(--text-secondary)] text-sm transition-colors hover:text-[var(--text-primary)]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isInviting}
                className="flex items-center gap-2 rounded-lg bg-[var(--accent-gold)] px-4 py-2 font-medium text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
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
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members List */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-[var(--border)] border-b p-4">
          <h2 className="font-semibold">Anggota Tim ({members.length})</h2>
          <button
            type="button"
            onClick={fetchMembers}
            className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
            title="Refresh"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--text-muted)]" />
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-[var(--bg-secondary)]"
              >
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient font-medium text-sm text-white">
                  {member.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{member.name}</p>
                    {member.isCurrentUser && (
                      <span className="rounded-full bg-[var(--accent-gold)]/10 px-2 py-0.5 text-[var(--accent-gold)] text-xs">
                        Anda
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[var(--text-muted)] text-sm">{member.email}</p>
                </div>

                {/* Role */}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 font-medium text-xs",
                      ROLES.find((r) => r.value === member.role)?.color,
                    )}
                  >
                    {ROLES.find((r) => r.value === member.role)?.label}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {isAdmin && !member.isCurrentUser && (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleUpdateRole(
                            member.id,
                            e.target.value as "admin" | "editor" | "viewer",
                          )
                        }
                        className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 text-[var(--text-primary)] text-xs"
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-600"
                        title="Hapus anggota"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && isAdmin && (
        <div className="card overflow-hidden">
          <div className="border-[var(--border)] border-b p-4">
            <h2 className="font-semibold">Undangan Tersisa ({invitations.length})</h2>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-[var(--bg-secondary)]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-gold-light)] text-[var(--accent-gold)]">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{inv.email}</p>
                  <p className="text-[var(--text-muted)] text-sm">
                    Diajak oleh {inv.inviterName} •{" "}
                    {new Date(inv.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 font-medium text-xs",
                    ROLES.find((r) => r.value === inv.role)?.color,
                  )}
                >
                  {ROLES.find((r) => r.value === inv.role)?.label}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleResendInvitation(inv.id)}
                    className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                    title="Kirim ulang"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancelInvitation(inv.id)}
                    className="rounded-lg p-2 text-[var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-600"
                    title="Batalkan"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Descriptions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {ROLES.map((role) => (
          <div key={role.value} className="card p-4">
            <div className="mb-2 flex items-center gap-2">
              <Shield className={cn("h-4 w-4", role.color.split(" ")[1])} />
              <span className="font-medium">{role.label}</span>
            </div>
            <p className="text-[var(--text-muted)] text-sm">{role.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
