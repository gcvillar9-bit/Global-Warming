/* COOL IT! — offline support. Same-origin files are cached on install and served cache-first;
 * Google Fonts are cached as they're fetched. Bump VERSION when files change. */
const VERSION = "coolit-v1";
const CORE = [
  "./", "index.html", "play.html", "quiz.html", "stripes.html", "act.html",
  "css/style.css", "css/home.css", "css/play.css", "css/quiz.css", "css/stripes.css", "css/act.css",
  "js/audio.js", "js/fx.js", "js/climate-data.js", "js/home.js", "js/game.js", "js/quiz.js", "js/stripes.js", "js/act.js",
  "img/icon-192.png", "img/icon-512.png", "manifest.webmanifest",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!sameOrigin && !isFont) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: sameOrigin }).then((hit) => {
      // serve from cache, refresh in the background so updates land on the next visit
      const net = fetch(req).then((res) => {
        if (res && (res.ok || res.type === "opaque")) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
