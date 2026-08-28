"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DeleteAccountCard() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "HAPUS") {
      toast.error("Ketik HAPUS untuk konfirmasi");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/delete-account", { method: "POST" });
      if (res.ok) {
        toast.success("Akun berhasil dihapus");
        window.location.href = "/";
      } else {
        toast.error("Gagal menghapus akun");
      }
    } catch {
      toast.error("Gagal menghapus akun");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-red-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-500">
          <Trash2 className="h-5 w-5" />
          Hapus Akun
        </CardTitle>
        <CardDescription>Hapus akun dan semua data Anda secara permanen</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
          <div className="text-sm">
            <p className="font-medium text-red-500">Peringatan: Tindakan ini tidak dapat dibatalkan</p>
            <ul className="mt-1 list-disc pl-4 text-[var(--text-muted)]">
              <li>Semua post, media, dan data akan dihapus</li>
              <li>Akun media sosial akan diputus</li>
              <li>Langganan akan dibatalkan</li>
              <li>Tidak ada cara untuk memulihkan data</li>
            </ul>
          </div>
        </div>

        {!showConfirm ? (
          <Button variant="danger" onClick={() => setShowConfirm(true)}>
            Hapus Akun Saya
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="confirmDelete">
                Ketik <span className="font-bold">HAPUS</span> untuk konfirmasi:
              </Label>
              <Input
                id="confirmDelete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="HAPUS"
                className="font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="danger" onClick={handleDelete} disabled={loading || confirmText !== "HAPUS"}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Ya, Hapus Akun Saya
              </Button>
              <Button variant="secondary" onClick={() => { setShowConfirm(false); setConfirmText(""); }}>
                Batal
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
