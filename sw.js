/* R.FIT app: catálogo sempre atualizado quando há internet; abre mesmo sem internet */
const V = "rfit-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  // fotos: guarda no aparelho (cada foto nova tem nome novo)
  if (same && url.pathname.includes("/img/")) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); } return r; })));
    return;
  }
  // página e dados do catálogo: sempre tenta a internet primeiro
  if (same) {
    e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put(url.pathname.endsWith("data.json") ? new Request(url.origin + url.pathname) : req, cp)); } return r; })
      .catch(() => caches.match(url.pathname.endsWith("data.json") ? new Request(url.origin + url.pathname) : req, { ignoreSearch: true }).then(hit => hit || caches.match("index.html"))));
    return;
  }
  // fontes e biblioteca do PDF
  if (/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(url.host)) {
    e.respondWith(caches.match(req).then(hit => { const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); } return r; }); return hit || net; }));
  }
});
