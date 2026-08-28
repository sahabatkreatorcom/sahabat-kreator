/**
 * Sahabat Kreator - Service Worker
 * Handles offline caching, push notifications, and notification clicks.
 */

const CACHE_NAME = "sahabatkreator-v1";
const RUNTIME_CACHE = "sahabatkreator-runtime-v1";

const STATIC_ASSETS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/favicon/web-app-manifest-192x192.png",
  "/favicon/web-app-manifest-512x512.png",
  "/favicon/favicon.svg",
];

// ── Install: cache static shell ─────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for static ────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // API calls — network first, fall back to cache
  if (request.url.includes("/api/")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Static pages — cache first, then network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).catch(() => {
        // Offline fallback for navigation requests
        if (request.destination === "document") {
          return caches.match("/");
        }
        return new Response("Offline", { status: 503 });
      });
    }),
  );
});

// ── Push: show notification ───────────────────────��─────────────────
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? "Sahabat Kreator";
  const options = {
    body: data.body ?? "",
    icon: "/favicon/web-app-manifest-192x192.png",
    badge: "/favicon/web-app-manifest-192x192.png",
    data: data.data ?? { url: data.url ?? "/" },
    tag: data.tag ?? "default",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click: focus/open window ──────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus existing window
      for (const client of clients) {
        if (client.url.includes(url.split("/")[1]) && "focus" in client) {
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    }),
  );
});
