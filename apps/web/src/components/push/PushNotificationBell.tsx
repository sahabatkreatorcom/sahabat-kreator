"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { notificationApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface PushNotificationBellProps {
  onBadgeUpdate?: (count: number) => void;
}

export function PushNotificationBell({ onBadgeUpdate }: PushNotificationBellProps) {
  const { isSupported, isPermissionGranted, isSubscribed, subscribe, unsubscribe, sendTest } =
    usePushNotifications();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  // Poll unread count
  useEffect(() => {
    const poll = async () => {
      const res = await notificationApi.unreadCount();
      if (res.ok) {
        setUnreadCount(res.data.count);
        onBadgeUpdate?.(res.data.count);
      }
    };
    poll();
    const interval = setInterval(poll, 30_000);
    return () => clearInterval(interval);
  }, [onBadgeUpdate]);

  const handleSubscribe = () => {
    subscribe();
    setShowMenu(false);
  };

  const handleUnsubscribe = () => {
    unsubscribe();
    setShowMenu(false);
  };

  const handleTest = () => {
    sendTest();
    setShowMenu(false);
  };

  if (!isSupported) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowMenu((v) => !v)}
        className={cn(
          "relative rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
          isPermissionGranted && !isSubscribed && "text-[var(--accent-gold)]",
        )}
        title="Notifikasi"
        aria-label="Notifikasi"
      >
        <Bell className="h-4 w-4" />
        {(unreadCount > 0 || (isPermissionGranted && !isSubscribed)) && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-gold)] font-bold text-[10px] text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3 shadow-xl">
            <p className="mb-2 font-semibold text-sm">Notifikasi Push</p>

            {!isPermissionGranted ? (
              <button
                type="button"
                onClick={handleSubscribe}
                className="w-full rounded-lg bg-[var(--accent-gold)] px-3 py-2 font-medium text-sm text-white hover:opacity-90"
              >
                Aktifkan Notifikasi
              </button>
            ) : !isSubscribed ? (
              <div className="space-y-2">
                <p className="text-[var(--text-muted)] text-xs">
                  Izin notifikasi diberikan. Klik untuk berlangganan push.
                </p>
                <button
                  type="button"
                  onClick={handleSubscribe}
                  className="w-full rounded-lg bg-[var(--accent-gold)] px-3 py-2 font-medium text-sm text-white hover:opacity-90"
                >
                  Berlangganan Push
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-[var(--success)]">✓ Sudah berlangganan</p>
                <button
                  type="button"
                  onClick={handleTest}
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 font-medium text-sm hover:bg-[var(--bg-tertiary)]"
                >
                  Kirim Test
                </button>
                <button
                  type="button"
                  onClick={handleUnsubscribe}
                  className="w-full rounded-lg border border-red-500/30 px-3 py-2 font-medium text-sm text-red-400 hover:bg-red-500/10"
                >
                  Hentikan Berlangganan
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
