// Strike Path offline cache. tools/build.js stamps the version, so each new build replaces the old cache.
const VERSION = "8433ec7936";
const CACHE = "strikepath-" + VERSION;
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./config.js", "./sync.js",
  "./vendor/three.min.js", "./vendor/supabase.js", "./audio/coach.wav", "./audio/coach.json",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png", "./icons/apple-touch-icon.png"].concat(["./img/ex/abwheel-0.jpg","./img/ex/abwheel-1.jpg","./img/ex/adductor-0.jpg","./img/ex/adductor-1.jpg","./img/ex/bench-0.jpg","./img/ex/bench-1.jpg","./img/ex/calf-0.jpg","./img/ex/calf-1.jpg","./img/ex/chop-0.jpg","./img/ex/chop-1.jpg","./img/ex/dip-0.jpg","./img/ex/dip-1.jpg","./img/ex/fly-0.jpg","./img/ex/fly-1.jpg","./img/ex/hang-0.jpg","./img/ex/hang-1.jpg","./img/ex/hipthrust-0.jpg","./img/ex/hipthrust-1.jpg","./img/ex/inccurl-0.jpg","./img/ex/inccurl-1.jpg","./img/ex/kickback-0.jpg","./img/ex/kickback-1.jpg","./img/ex/lat-0.jpg","./img/ex/lat-1.jpg","./img/ex/legcurl-0.jpg","./img/ex/legcurl-1.jpg","./img/ex/legext-0.jpg","./img/ex/legext-1.jpg","./img/ex/pallof-0.jpg","./img/ex/pallof-1.jpg","./img/ex/pullup-0.jpg","./img/ex/pullup-1.jpg","./img/ex/pushdown-0.jpg","./img/ex/pushdown-1.jpg","./img/ex/rdf-0.jpg","./img/ex/rdf-1.jpg","./img/ex/rdl-0.jpg","./img/ex/rdl-1.jpg","./img/ex/revcurl-0.jpg","./img/ex/revcurl-1.jpg","./img/ex/row-0.jpg","./img/ex/row-1.jpg","./img/ex/sap-0.jpg","./img/ex/sap-1.jpg","./img/ex/shrug-0.jpg","./img/ex/shrug-1.jpg","./img/ex/squat-0.jpg","./img/ex/squat-1.jpg","./img/ex/tread-0.jpg","./img/ex/tread-1.jpg","./img/ex/wristcurl-0.jpg","./img/ex/wristcurl-1.jpg"]);

self.addEventListener("install", e => {
  // cache: "reload" skips the browser's HTTP cache (GitHub Pages allows 10 minutes), so a new version caches new files
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, {cache:"reload"})))).then(() => self.skipWaiting()));
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
    e.respondWith(fetch(req, {cache:"no-store"}).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); return res; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  // everything else (scripts, icons, fonts): serve from cache, refresh in the background
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => { if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
