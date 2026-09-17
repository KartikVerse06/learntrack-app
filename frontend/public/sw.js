// LearnTrack Production-Safe Service Worker
// Enforces zero-caching on authenticated API endpoints and sensitive data
const CACHE_NAME = "learntrack-v2";

const PRECACHE_ASSETS = [
  "/offline.html",
  "/manifest.json",
  "/favicon.ico",
  "/logo.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-maskable-512x512.png",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-32x32.png",
  "/icons/favicon-16x16.png",
];

// 1. Installation — Resilient precache of core shell and offline fallback
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        await Promise.allSettled(
          PRECACHE_ASSETS.map((asset) => cache.add(asset).catch(() => {}))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activation — Purge old cache versions and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// 3. Fetch Event — Strict routing rules
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // A. Strictly bypass non-GET requests (mutations: POST, PUT, PATCH, DELETE)
  if (request.method !== "GET") {
    return;
  }

  // B. Strictly bypass authenticated API requests & private user data:
  // Render backend (https://learntrack-app.onrender.com) or Next.js internal API routes
  if (
    url.origin.includes("onrender.com") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_server") ||
    request.headers.get("Authorization")
  ) {
    event.respondWith(
      fetch(request).catch(() => {
        // Return offline JSON error envelope when network is unreachable
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "OFFLINE",
              message: "You are currently offline. Connect to the internet to perform this action.",
            },
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      })
    );
    return;
  }

  // C. HTML Document Navigations:
  // Always use Network-First to guarantee real-time session verification and fresh data
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const offlinePage = await caches.match("/offline.html");
        return offlinePage || new Response("You are offline", { status: 503 });
      })
    );
    return;
  }

  // D. Static Assets: _next/static, icons, images, sounds, fonts
  // Use Stale-While-Revalidate / Cache-First for instant loading and performance
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".mp3") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Fallback: network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
