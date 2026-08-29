"use client";

import { Building2, Loader2, Save, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/auth-client";

interface OrgMember {
  id: string;
  userId: string;
  role: string;
  user: { name: string; email: string };
}

export function OrganizationSettings() {
  const { data: session } = useSession();
  const [orgName, setOrgName] = useState("");
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  const fetchMembers = useCallback(async (id?: string) => {
    if (!id) return;
    try {
      const res = await fetch("/api/team");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrganization = useCallback(async () => {
    try {
      const res = await fetch("/api/organization/current");
      if (res.ok) {
        const data = await res.json();
        setOrgId(data.organization?.id);
        setOrgName(data.organization?.name || "");
        fetchMembers(data.organization?.id);
      }
    } catch {
      setLoading(false);
    }
  }, [fetchMembers]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/organization/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName }),
      });
      if (res.ok) {
        toast.success("Nama organisasi diperbarui");
      } else {
        toast.error("Gagal memperbarui organisasi");
      }
    } catch {
      toast.error("Gagal memperbarui organisasi");
    } finally {
      setSaving(false);
    }
  };

  const ROLE_LABELS: Record<string, string> = {
    owner: "Pemilik",
    admin: "Admin",
    editor: "Editor",
    viewer: "Penonton",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Organisasi
        </CardTitle>
        <CardDescription>Kelola pengaturan organisasi Anda</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="orgName">Nama Organisasi</Label>
          <Input
            id="orgName"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Nama organisasi Anda"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Anggota Tim ({members.length})
            </Label>
            <Button variant="secondary" size="sm">
              Undang Anggota
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--accent-gold)]" />
            </div>
          ) : members.length === 0 ? (
            <p className="py-4 text-center text-[var(--text-muted)] text-sm">
              Belum ada anggota tim
            </p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-tertiary)] font-medium text-xs">
                      {member.user.name?.charAt(0) || member.user.email?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{member.user.name || "Tanpa Nama"}</p>
                      <p className="text-[var(--text-muted)] text-xs">{member.user.email}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      member.role === "owner"
                        ? "bg-[var(--accent-gold)]/20 text-[var(--accent-gold)]"
                        : member.role === "admin"
                          ? "bg-blue-500/20 text-blue-500"
                          : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                    }`}
                  >
                    {ROLE_LABELS[member.role] || member.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving || !orgName.trim()} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Perubahan
        </Button>
      </CardContent>
    </Card>
  );
}
