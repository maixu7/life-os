// Offline support: serve the app shell from cache when there's no network.
const CACHE = "lifeos-v4";
const STATIC = "lifeos-static-v1"; // build files: their names change with every update, so they never go stale

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/", "/manifest.webmanifest", "/icons/icon-192.png"])));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== STATIC).map((k) => caches.delete(k)))),
    // Old builds' files pile up: keep the newest 400.
    caches.open(STATIC).then((c) => c.keys().then((ks) => Promise.all(ks.slice(0, Math.max(0, ks.length - 400)).map((k) => c.delete(k))))),
  ]));
  self.clients.claim();
});

// Build files (/_next/static, icons) come straight from the phone once loaded: fast starts.
// Pages: network first, but after 3 s on a slow connection the saved copy is shown.
// Everything else: network first, falling back to cache.
const put = (name, req, res) => { if (res.ok) { const copy = res.clone(); caches.open(name).then((c) => c.put(req, copy)); } return res; };
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(caches.open(STATIC).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => put(STATIC, req, res)))));
    return;
  }
  const net = fetch(req).then((res) => put(CACHE, req, res));
  if (req.mode === "navigate") {
    e.respondWith(new Promise((done) => {
      let settled = false;
      const t = setTimeout(() => caches.match(req).then((hit) => { if (hit && !settled) { settled = true; done(hit); } }), 3000);
      net.then((res) => { clearTimeout(t); if (!settled) { settled = true; done(res); } })
        .catch(() => { clearTimeout(t); caches.match(req).then((hit) => { if (!settled) { settled = true; done(hit || caches.match("/")); } }); });
    }));
    return;
  }
  e.respondWith(net.catch(() => caches.match(req).then((hit) => hit || caches.match("/"))));
});

// Phone notifications sent by the server (reminders), even when the app is closed.
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "Life OS", { body: d.body || "", tag: d.tag, data: { url: d.url || "/" }, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", renotify: true }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
    if (!cs[0]) return self.clients.openWindow(url);
    if (url !== "/") cs[0].postMessage({ open: url });
    return cs[0].focus();
  }));
});
