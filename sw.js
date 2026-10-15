// SpendWise Service Worker
const CACHE_NAME = "spendwise-v3";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./expenses.html",
  "./budget.html",
  "./bills.html",
  "./savings.html",
  "./profile.html",
  "./login.html",
  "./404.html",
  "./style.css",
  "./login.css",
  "./nav.js",
  "./ui.js",
  "./icon.svg",
  "./manifest.json",
  "./dashboard.js",
  "./dashboard-auth.js",
  "./expenses.js",
  "./expenses-auth.js",
  "./budget.js",
  "./budget-auth.js",
  "./bills.js",
  "./bills-auth.js",
  "./savings.js",
  "./savings-auth.js",
  "./profile.js",
  "./auth.js"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network first with cache fallback for local assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip Firebase and external cross-origin requests
  if (url.origin !== self.origin) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful local GET requests
        if (event.request.method === "GET" && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("./index.html");
          }
        });
      })
  );
});
