// Service worker: deixa o app abrir mesmo sem internet.
const CACHE = "mb-controle-3.8.0"; // acompanhe a versão do app (VERSAO em app.js)
const SHELL = ["./", "index.html", "style.css", "app.js", "firebase-config.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];
self.addEventListener("install", e => {
  // guarda cada arquivo separadamente: se um falhar, os outros continuam
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Arquivos do próprio app: busca a versão nova na internet e usa a cópia salva se estiver offline.
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // Bibliotecas do Firebase: guarda uma cópia para o app abrir offline.
  if (url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/")) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); } return res; })));
    return;
  }
  if (url.origin !== location.origin) return;
  // Sempre pede a versão mais nova ao servidor (sem usar cópia velha do navegador).
  const req = e.request.mode === "navigate" ? e.request : new Request(e.request, { cache: "no-cache" });
  e.respondWith(fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
});

// Tocar na notificação abre (ou traz para frente) o MB Controle
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ("focus" in c) return c.focus(); }
    return self.clients.openWindow("./");
  }));
});
