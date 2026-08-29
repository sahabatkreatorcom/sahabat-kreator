"use client";

import { Bell, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getVapidPublicKey,
  isPushSupported,
  type PushSubscription,
  sendPushNotification,
  storeSubscription,
  subscribeUser,
  unsubscribeUser,
} from "@/lib/push-notifications";

export default function PushTestPage() {
  const [isSupported, setIsSupported] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsSupported(isPushSupported());
    if ("Notification" in window) {
      setIsPermissionGranted(Notification.permission === "granted");
    }
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    const vapidKey = getVapidPublicKey();
    if (!vapidKey) {
      toast.error("VAPID public key tidak dikonfigurasi di server.");
      setLoading(false);
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.error("Izin notifikasi ditolak.");
      setLoading(false);
      return;
    }

    setIsPermissionGranted(true);

    const sub: PushSubscription | null = await subscribeUser(vapidKey);
    if (!sub) {
      toast.error("Gagal berlangganan push dari browser.");
      setLoading(false);
      return;
    }

    try {
      await storeSubscription(sub);
      setIsSubscribed(true);
      toast.success("Berhasil berlangganan notifikasi push!");
    } catch {
      toast.error("Gagal menyimpan berlangganan ke server.");
    }
    setLoading(false);
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    await unsubscribeUser();
    setIsSubscribed(false);
    setIsPermissionGranted(false);
    toast.success("Berlangganan notifikasi dihentikan.");
    setLoading(false);
  };

  const handleTest = async () => {
    setLoading(true);
    const result = await sendPushNotification(
      "Tes Notifikasi — Sahabat Kreator",
      "Notifikasi push berhasil dikirim! Jika Anda melihat ini, push berjalan dengan baik.",
      { type: "test", ts: Date.now().toString() },
    );
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message || "Gagal mengirim test push.");
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <h1 className="font-bold text-xl">Pengujian Push Notification</h1>

      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-[var(--text-muted)]" />
          <span className="font-semibold text-sm">Status Push</span>
        </div>

        <StatusRow
          label="Browser mendukung Push"
          value={isSupported ? "Ya" : "Tidak"}
          ok={isSupported}
        />
        <StatusRow
          label="Izin notifikasi diberikan"
          value={isPermissionGranted ? "Ya" : "Tidak"}
          ok={isPermissionGranted}
        />
        <StatusRow
          label="Berlangganan aktif"
          value={isSubscribed ? "Ya" : "Tidak"}
          ok={isSubscribed}
        />
      </div>

      <div className="flex flex-col gap-2">
        {!isPermissionGranted && (
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={loading || !isSupported}
            className="rounded-lg bg-[var(--accent-gold)] px-4 py-2.5 font-semibold text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : null}
            Aktifkan Notifikasi
          </button>
        )}

        {isPermissionGranted && !isSubscribed && (
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={loading}
            className="rounded-lg bg-[var(--accent-gold)] px-4 py-2.5 font-semibold text-sm text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : null}
            Berlangganan Push
          </button>
        )}

        {isSubscribed && (
          <>
            <button
              type="button"
              onClick={handleTest}
              disabled={loading}
              className="rounded-lg border border-[var(--border)] px-4 py-2.5 font-semibold text-sm hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
            >
              {loading ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : null}
              Kirim Test Push
            </button>
            <button
              type="button"
              onClick={handleUnsubscribe}
              disabled={loading}
              className="rounded-lg border border-red-500/30 px-4 py-2.5 font-semibold text-red-400 text-sm hover:bg-red-500/10 disabled:opacity-50"
            >
              Hentikan Berlangganan
            </button>
          </>
        )}
      </div>

      <p className="text-[var(--text-muted)] text-xs">
        Pastikan service worker sudah terdaftar. Halaman ini menguji alur subscribe → kirim test →
        terima notifikasi.
      </p>
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--text-secondary)] text-sm">{label}</span>
      <span
        className={
          "rounded-full px-2 py-0.5 font-medium text-xs" +
          (ok
            ? "bg-[var(--success-light)] text-[var(--success)]"
            : "bg-[var(--error-light)] text-[var(--error)]")
        }
      >
        {value}
      </span>
    </div>
  );
}
