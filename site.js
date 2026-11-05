// @ts-check
(() => {
  const ID = String((/** @type {any} */ (window).FIREBASE_CONFIG || {}).measurementId || "");
  const CHAVE = "mb.consent";
  const le = () => { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } };
  const grava = (/** @type {string} */ v) => { try { localStorage.setItem(CHAVE, v); } catch (e) {} };
  const w = /** @type {any} */ (window);
  w.dataLayer = w.dataLayer || [];
  function gtag() { w.dataLayer.push(arguments); }
  let carregado = false;
  /** @type {Array<[string, object]>} */
  const fila = [];
  function carrega() {
    if (carregado || !ID) return;
    carregado = true;
    // @ts-ignore
    gtag("js", new Date());
    // @ts-ignore
    gtag("config", ID, { anonymize_ip: true });
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ID);
    document.head.appendChild(s);
    // @ts-ignore
    fila.splice(0).forEach(e => gtag("event", e[0], e[1]));
  }
  w.mbEvento = (/** @type {string} */ nome, /** @type {object} */ p) => {
    if (!ID || le() !== "sim") return;
    // @ts-ignore
    if (carregado) gtag("event", nome, p || {}); else fila.push([nome, p || {}]);
  };
  function banner() {
    if (!ID || le() || document.getElementById("consent")) return;
    const d = document.createElement("div");
    d.id = "consent";
    d.className = "consent";
    d.setAttribute("role", "region");
    d.setAttribute("aria-label", "Cookies de análise");
    const raiz = document.body.dataset.raiz || "";
    d.innerHTML = '<p>Usamos o Google Analytics para contar visitas e saber o que funciona no site. Sem anúncios, e seus lançamentos nunca entram nisso. <a href="' + raiz + 'privacidade#cookies">Saiba mais</a></p><div><button type="button" data-consent="nao">Recusar</button><button type="button" data-consent="sim">Aceitar</button></div>';
    d.addEventListener("click", e => {
      const b = /** @type {HTMLElement|null} */ (/** @type {HTMLElement} */ (e.target).closest("[data-consent]"));
      if (!b) return;
      const v = b.dataset.consent || "nao";
      grava(v);
      d.remove();
      if (v === "sim") carrega();
    });
    document.body.appendChild(d);
  }
  w.mbConsentimento = () => { try { localStorage.removeItem(CHAVE); } catch (e) {} banner(); };
  function obrigado() {
    const apk = new URLSearchParams(location.search).get("c") === "apk";
    document.querySelectorAll("[data-so]").forEach(el => { /** @type {HTMLElement} */ (el).hidden = /** @type {HTMLElement} */ (el).dataset.so !== (apk ? "apk" : "cadastro"); });
    w.mbEvento(apk ? "apk_download" : "sign_up", apk ? {} : { method: "google" });
    w.mbEvento("conversao", { tipo: apk ? "apk" : "cadastro" });
    if (apk) setTimeout(() => { location.href = "baixar"; }, 900);
  }
  function inicio() {
    banner();
    if (document.body.dataset.pagina === "obrigado") obrigado();
    document.querySelectorAll("[data-consent-mudar]").forEach(b => b.addEventListener("click", () => w.mbConsentimento()));
  }
  if (le() === "sim") carrega();
  document.addEventListener("click", e => {
    const a = /** @type {HTMLElement|null} */ (/** @type {HTMLElement} */ (e.target).closest("[data-ev]"));
    if (a) w.mbEvento(a.dataset.ev || "clique", { local: a.dataset.evlocal || location.pathname });
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inicio); else inicio();
})();
