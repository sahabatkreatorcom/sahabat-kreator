"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getVapidPublicKey,
  isNotificationPermissionGranted,
  isPushSupported,
  removeSubscription,
  sendPushNotification,
  storeSubscription,
  subscribeUser,
  unsubscribeUser,
  type PushSubscriptionDB,
} from "@/lib/push-notifications";

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isPermissionGranted: boolean;
  isSubscribed: boolean;
  subscriptions: PushSubscriptionDB[];
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  sendTest: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptions, setSubscriptions] = useState<PushSubscriptionDB[]>([]);

  // Load existing subscriptions from DB on mount
  useEffect(() => {
    const loadSubscriptions = async () => {
      const API_BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3001";
      try {
        const res = await fetch(`${API_BASE}/api/push/subscriptions`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          setSubscriptions(json.subscriptions ?? []);
          setIsSubscribed((json.subscriptions?.length ?? 0) > 0);
        }
      } catch {
        // ignore
      }
    };
    loadSubscriptions();
  }, []);

  // Check support and permission on mount
  useEffect(() => {
    setIsSupported(isPushSupported());
    setIsPermissionGranted(isNotificationPermissionGranted());
  }, []);

  const subscribe = useCallback(async () => {
    const vapidKey = getVapidPublicKey();
    if (!vapidKey) {
      toast.error("Push notifications are not configured on this server.");
      return;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.error("Permit notifikasi ditolak.");
      setIsPermissionGranted(false);
      return;
    }

    setIsPermissionGranted(true);

    // Subscribe via Service Worker
    const sub = await subscribeUser(vapidKey);
    if (!sub) {
      toast.error("Gagal berlangganan notifikasi push.");
      return;
    }

    // Store in DB
    try {
      const stored = await storeSubscription(sub);
      setSubscriptions((prev) => [...prev, { id: stored.id, endpoint: sub.endpoint, createdAt: new Date().toISOString() }]);
      setIsSubscribed(true);
      toast.success("Berhasil berlangganan notifikasi push.");
    } catch {
      toast.error("Gagal menyimpan berlangganan.");
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    // Unsubscribe from service worker
    await unsubscribeUser();

    // Remove all stored subscriptions
    for (const sub of subscriptions) {
      await removeSubscription(sub.id).catch(() => {});
    }
    setSubscriptions([]);
    setIsSubscribed(false);
    toast.success("Berlangganan notifikasi push dihentikan.");
  }, [subscriptions]);

  const sendTest = useCallback(async () => {
    const result = await sendPushNotification(
      "Tes Notifikasi — Sahabat Kreator",
      "Notifikasi push berhasil dikirim!",
      { type: "test" },
    );

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message || "Gagal mengirim test push.");
    }
  }, []);

  return {
    isSupported,
    isPermissionGranted,
    isSubscribed,
    subscriptions,
    subscribe,
    unsubscribe,
    sendTest,
  };
}
