// Imported by the generated service worker. Keeps a copy of the offline shell
// under its exact URL so the navigation fallback can always find it.
const OFFLINE_CACHE = "offline-shell-v1";
const OFFLINE_URLS = ["/offline.html", "/app-icon-512.png", "/favicon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.addAll(OFFLINE_URLS))
      .catch(() => undefined),
  );
});
