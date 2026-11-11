// @ts-check
// Lembretes periódicos e aviso de versão nova.
"use strict";
setTimeout(()=>{ try{ const v=localStorage.getItem("mb.versao"); if(v&&v!==VERSAO&&mode!=="login") toast("Monetra atualizado para a versão "+VERSAO+". Veja as novidades no Perfil."); localStorage.setItem("mb.versao",VERSAO); }catch(e){} },2500);
setInterval(()=>verificaLembretes(true),30*60000);
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible"){ verificaLembretes(true); if(ui.tab==="mes"&&!ui.sheet) render(); } });
setInterval(()=>{ const d=new Date(); if(keyOf(d.getFullYear(),d.getMonth()+1)!==todayKey&&!ui.sheet&&!dirty.size) location.reload(); },60000);

/** @type {ServiceWorkerRegistration|null} */
let swReg=null;
let nvAdiado=0;
function avisoNovaVersao(){
  if(document.getElementById("novaversao")||Date.now()<nvAdiado) return;
  const el=document.createElement("div"); el.id="novaversao"; el.className="novaversao"+(semMovimento()?"":" entra"); el.setAttribute("role","status");
  el.innerHTML=`<span class="nv-ic">${logoM(26,"nvl")}<i class="nv-ponto"></i></span>
    <span class="nv-txt"><b>Nova versão pronta</b><small>Leva só alguns segundos e seus dados continuam iguais.</small></span>
    <span class="nv-acoes"><button type="button" class="btn ghost mini" data-nvdepois="1">Depois</button><button type="button" class="btn mini" data-atualizar="1">Atualizar</button></span>
    <span class="nv-barra" aria-hidden="true"><i></i></span>`;
  document.body.appendChild(el);
  // fica acima do aviso de cookies enquanto ele estiver aberto
  const sobeCookies=()=>{ const c=document.querySelector(".consent"), h=c&&c.isConnected?c.getBoundingClientRect():null;
    if(h&&h.height) el.style.setProperty("--nvbase",(innerHeight-h.top+12)+"px"); else el.style.removeProperty("--nvbase"); };
  sobeCookies(); addEventListener("resize",sobeCookies);
  const vigiaCookies=new MutationObserver(()=>{ if(!el.isConnected){ vigiaCookies.disconnect(); removeEventListener("resize",sobeCookies); return; } sobeCookies(); });
  vigiaCookies.observe(document.body,{childList:true});
  const w=swReg&&swReg.waiting;
  if(w) fetch(w.scriptURL,{cache:"no-store"}).then(r=>r.text()).then(t=>{ const v=/const V = "([0-9.]+)"/.exec(t), s=el.querySelector(".nv-txt small");
    if(v&&s&&v[1]!==VERSAO) s.textContent="Versão "+v[1]+" · leva só alguns segundos."; }).catch(()=>{});
  const fecha=()=>{ nvAdiado=Date.now()+30*60000; document.removeEventListener("keydown",esc);
    if(semMovimento()){ el.remove(); return; } el.classList.add("sai"); setTimeout(()=>el.remove(),220); };
  const esc=(/** @type {KeyboardEvent} */ ev)=>{ if(ev.key==="Escape"&&!el.classList.contains("atualizando")) fecha(); };
  document.addEventListener("keydown",esc);
  el.addEventListener("click",ev=>{ const t=ev.target instanceof Element?ev.target:null;
    if(t&&t.closest("[data-nvdepois]")){ fecha(); return; }
    const b=t&&t.closest("[data-atualizar]"); if(!(b instanceof HTMLButtonElement)||el.classList.contains("atualizando")) return;
    el.classList.add("atualizando"); b.disabled=true; b.textContent="Atualizando…"; vibra(14); anunciar("Atualizando o Monetra.");
    const w=swReg&&swReg.waiting; if(w) w.postMessage({tipo:"atualizar"}); else location.reload();
    setTimeout(()=>location.reload(),5000); });
  // arrastar para baixo dispensa
  let y0=0, dy=0, arrasta=false;
  el.addEventListener("pointerdown",ev=>{ if(ev.target instanceof Element&&ev.target.closest("button")) return; arrasta=true; y0=ev.clientY; dy=0; try{ el.setPointerCapture(ev.pointerId); }catch(e){} el.classList.add("arrasta"); });
  el.addEventListener("pointermove",ev=>{ if(!arrasta) return; dy=Math.max(0,ev.clientY-y0); el.style.setProperty("--nvdy",dy+"px"); });
  const solta=()=>{ if(!arrasta) return; arrasta=false; el.classList.remove("arrasta"); el.style.removeProperty("--nvdy"); if(dy>50) fecha(); };
  el.addEventListener("pointerup",solta); el.addEventListener("pointercancel",solta);
  anunciar("Nova versão do Monetra disponível. Toque em Atualizar para usar.");
}
function vigiaAtualizacao(){
  if(!("serviceWorker" in navigator)) return;
  const sw=navigator.serviceWorker, tinhaControle=!!sw.controller; let recarregando=false;
  sw.addEventListener("controllerchange",()=>{ if(!tinhaControle||recarregando) return; recarregando=true; location.reload(); });
  sw.getRegistration().then(reg=>{ if(!reg) return; swReg=reg;
    const pronto=()=>{ if(reg.waiting&&sw.controller) avisoNovaVersao(); };
    pronto();
    reg.addEventListener("updatefound",()=>{ const n=reg.installing; if(n) n.addEventListener("statechange",()=>{ if(n.state==="installed") pronto(); }); });
    document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible"){ pronto(); reg.update().catch(()=>{}); } });
  }).catch(()=>{});
}

document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible"&&mode==="cloud"&&authUser&&temProv("password")&&!authUser.emailVerified) fb.reload(authUser).then(()=>{ authUser=fb.auth.currentUser; render(); }).catch(()=>{}); });
["pointerdown","focusin","keydown"].forEach(t=>document.addEventListener(t,ev=>{ if(mode==="login"&&ev.target instanceof Element&&ev.target.closest("[data-login],[data-apres],[data-lg],.lgform")) iniciaAppCheck(); },{capture:true,passive:true}));

