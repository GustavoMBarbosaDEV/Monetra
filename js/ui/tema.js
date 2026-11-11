// @ts-check
// Tema claro, escuro ou automático.
"use strict";
let tema="auto"; try{ tema=localStorage.getItem("meucaixa.tema")||"auto"; }catch(e){}
function aplicaTema(){
  const r=document.documentElement;
  if(tema==="claro") r.setAttribute("data-theme","light"); else if(tema==="escuro") r.setAttribute("data-theme","dark"); else r.removeAttribute("data-theme");
  const escuro=tema==="escuro"||(tema==="auto"&&window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches);
  r.classList.toggle("tema-escuro",!!escuro); r.classList.toggle("tema-claro",!escuro);
  const m=document.querySelector('meta[name="theme-color"]'); if(m) m.content=escuro?"#060807":"#04261A";
}
function trocaTema(){ tema={auto:"escuro",escuro:"claro",claro:"auto"}[tema]||"auto"; try{localStorage.setItem("meucaixa.tema",tema)}catch(e){} aplicaTema(); render(); }
function botaoTema(){
  const ic={claro:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></g></svg>',
    escuro:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
    auto:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M12 3a9 9 0 0 1 0 18z"/></svg>'}[tema];
  const nome={claro:"Claro",escuro:"Escuro",auto:"Automático"}[tema];
  return `<button class="themebtn" data-tema="1" type="button" title="Tema: ${nome} (clique para trocar)" aria-label="Tema: ${nome}. Clique para trocar">${ic}<span>${nome}</span></button>`;
}
if(window.matchMedia) try{ matchMedia("(prefers-color-scheme: dark)").addEventListener("change",aplicaTema); }catch(e){}
aplicaTema();

