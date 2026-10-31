const V = "5.4.8";
const CACHE = "monetra-" + V;
const SHELL = ["./", "index.html", ...["style.css", "boot.css", "pre.js", "boot.js", "app.js"].map(f => f + "?v=" + V), "firebase-config.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/logo-128.png", "icons/marca.png", "icons/splash-512.png",
  "fonts/fontsource-variable-5.3.0/inter-latin-wght-normal.woff2", "fonts/fontsource-variable-5.3.0/sora-latin-wght-normal.woff2"];
const ESPERA_NAVEGACAO = 3000;
const FORA = /^\/(__|baixar)(\/|$)/;
const SEM_AVISO = /^monetra-(?:[0-4]\.|5\.[0-3]\.|5\.4\.[01]$)/;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: "reload" })).catch(() => null)))).catch(() => null)
    .then(() => caches.keys()).then(ks => { if (ks.some(k => SEM_AVISO.test(k))) return self.skipWaiting(); }).catch(() => null));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("monetra-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("message", e => {
  if (e.data && e.data.tipo === "atualizar") self.skipWaiting();
});

const guardavel = r => r && r.ok && r.status === 200 && r.type === "basic";
const guarda = (chave, r) => { if (guardavel(r)) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(chave, copia)).catch(() => null); } return r; };

function navegacao(e) {
  const rede = fetch(e.request).then(r => guarda("./", r));
  e.waitUntil(rede.catch(() => null));
  const prazo = new Promise(ok => setTimeout(ok, ESPERA_NAVEGACAO));
  return Promise.race([rede.catch(() => null), prazo.then(() => null)]).then(r => r
    || caches.match("./").catch(() => null).then(c => c || rede));
}
function arquivo(e) {
  const rede = fetch(e.request).then(r => guarda(e.request, r));
  e.waitUntil(rede.catch(() => null));
  return caches.open(CACHE).then(c => c.match(e.request)).catch(() => null).then(guardado => guardado || rede);
}

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || FORA.test(url.pathname)) return;
  if (e.request.mode === "navigate") { e.respondWith(navegacao(e)); return; }
  e.respondWith(arquivo(e));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ("focus" in c) return c.focus(); }
    return self.clients.openWindow("./");
  }));
});
