import { env } from "@sahabatkreator/env/web";

export interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionDB {
  id: string;
  endpoint: string;
  createdAt: string;
}

/**
 * Returns the VAPID public key configured for web push.
 */
export function getVapidPublicKey(): string | null {
  return env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
}

/**
 * Subscribes the current browser to push notifications.
 * Returns the subscription object or null if unsupported.
 */
export async function subscribeUser(
  vapidPublicKey: string,
): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });

    const raw = await subscription.toJSON();
    if (!raw.endpoint) return null;
    return {
      endpoint: raw.endpoint,
      p256dh: raw.keys?.p256dh ?? "",
      auth: raw.keys?.auth ?? "",
    };
  } catch {
    return null;
  }
}

/**
 * Unsubscribes the current push subscription.
 */
export async function unsubscribeUser(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * Sends a test push notification to the API.
 */
export async function sendPushNotification(
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<{ success: boolean; message: string }> {
  const API_BASE = env.NEXT_PUBLIC_SERVER_URL;
  const res = await fetch(`${API_BASE}/api/push/send-test`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body, data }),
  });

  const json = await res.json();
  return { success: res.ok, message: json.message ?? json.error ?? "" };
}

/**
 * Stores the push subscription in the database via API.
 */
export async function storeSubscription(
  subscription: PushSubscription,
): Promise<{ id: string }> {
  const API_BASE = env.NEXT_PUBLIC_SERVER_URL;
  const res = await fetch(`${API_BASE}/api/push/subscribe`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  });

  if (!res.ok) throw new Error("Failed to store subscription");
  const json = await res.json();
  return json.subscription;
}

/**
 * Removes a stored subscription by its DB ID.
 */
export async function removeSubscription(subscriptionId: string): Promise<void> {
  const API_BASE = env.NEXT_PUBLIC_SERVER_URL;
  await fetch(`${API_BASE}/api/push/subscriptions/${subscriptionId}`, {
    method: "DELETE",
    credentials: "include",
  });
}

/**
 * Checks if the browser supports web push notifications.
 */
export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in navigator &&
    "Notification" in window
  );
}

/**
 * Checks if the user has already granted notification permission.
 */
export function isNotificationPermissionGranted(): boolean {
  if (!("Notification" in window)) return false;
  return Notification.permission === "granted";
}

/**
 * Decodes a base64 VAPID public key string to Uint8Array.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
