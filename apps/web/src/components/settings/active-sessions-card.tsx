"use client";

import { Loader2, Monitor, Smartphone, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Session {
  id: string;
  device: string;
  browser: string;
  os: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export function ActiveSessionsCard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/user/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      const res = await fetch(`/api/user/sessions/${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        toast.success("Sesi dicabut");
      } else {
        toast.error("Gagal mencabut sesi");
      }
    } catch {
      toast.error("Gagal mencabut sesi");
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevoking("all");
    try {
      const res = await fetch("/api/user/sessions", { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.isCurrent));
        toast.success("Semua sesi lain berhasil dicabut");
      } else {
        toast.error("Gagal mencabut sesi");
      }
    } catch {
      toast.error("Gagal mencabut sesi");
    } finally {
      setRevoking(null);
    }
  };

  const getDeviceIcon = (device: string, browser: string) => {
    if (/mobile|android|iphone/i.test(device + browser)) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Sesi Aktif
            </CardTitle>
            <CardDescription>Kelola perangkat yang login ke akun Anda</CardDescription>
          </div>
          {sessions.length > 1 && (
            <Button variant="danger" size="sm" onClick={handleRevokeAll} disabled={revoking === "all"}>
              {revoking === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cabut Semua Sesi Lain"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-gold)]" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="py-4 text-center text-[var(--text-muted)] text-sm">Tidak ada sesi aktif</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-secondary)]">
                    {getDeviceIcon(session.device, session.browser)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {session.browser} di {session.os}
                      {session.isCurrent && (
                        <span className="ml-2 rounded-full bg-green-500/20 px-2 py-0.5 text-green-500 text-xs">
                          Sesi Ini
                        </span>
                      )}
                    </p>
                    <p className="text-[var(--text-muted)] text-xs">
                      Terakhir aktif:{" "}
                      {new Date(session.lastActiveAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                {!session.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(session.id)}
                    disabled={revoking === session.id}
                  >
                    {revoking === session.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
