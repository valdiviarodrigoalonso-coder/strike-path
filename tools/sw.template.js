// Strike Path offline cache. tools/build.js stamps the version, so each new build replaces the old cache.
const VERSION = "__VERSION__";
const CACHE = "strikepath-" + VERSION;
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./config.js", "./sync.js",
  "./vendor/three.min.js", "./vendor/supabase.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("strikepath-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // account data always goes to the network; the app handles being offline itself
  if (url.hostname.endsWith("supabase.co") || url.hostname.endsWith("supabase.in")) return;
  // the page: try the network first so updates arrive, fall back to the cached copy offline
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); return res; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  // everything else (scripts, icons, fonts): serve from cache, refresh in the background
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => { if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
