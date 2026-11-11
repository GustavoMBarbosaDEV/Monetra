// @ts-check
// Bloqueio com PIN e digital.
"use strict";
const PINKEY="mb.pin", PINLEN=4;
function pinCfg(){ try{ const c=JSON.parse(localStorage.getItem(PINKEY)||"null"); return c&&c.hash?c:null; }catch(e){ return null; } }
function salvaPinCfg(c){ try{ if(c) localStorage.setItem(PINKEY,JSON.stringify(c)); else localStorage.removeItem(PINKEY); }catch(e){} }
async function hashPin(pin,salt){ const h=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("mbc:"+salt+":"+pin)); return Array.from(new Uint8Array(h),b=>b.toString(16).padStart(2,"0")).join(""); }
const PIN_ITER=310000;
const hexDe=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,"0")).join("");
async function pbkdf2Hex(texto,sal,iter){ const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(texto),"PBKDF2",false,["deriveBits"]);
  return hexDe(await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:new TextEncoder().encode(sal),iterations:iter},k,256)); }
async function confere(pin){ const c=pinCfg(); if(!c) return false;
  if(c.v===2) return (await pbkdf2Hex(await hashPin(pin,c.salt),c.sal2,c.iter||PIN_ITER))===c.hash;
  const ok=(await hashPin(pin,c.salt))===c.hash; if(ok) await migraPin(); return ok; }
async function migraPin(){ const c=pinCfg(); if(!c||c.v===2) return; const sal2=novoCodigo(16), hash=await pbkdf2Hex(c.hash,sal2,PIN_ITER);
  const agora=pinCfg(); if(agora&&agora.hash===c.hash&&agora.v!==2) salvaPinCfg(Object.assign({},agora,{v:2,sal2,iter:PIN_ITER,hash})); }
async function definePin(pin,apos){ const salt=novoCodigo(16), sal2=novoCodigo(16), c=pinCfg();
  const n={v:2,salt,sal2,iter:PIN_ITER,hash:await pbkdf2Hex(await hashPin(pin,salt),sal2,PIN_ITER),apos:apos!=null?apos:(c&&c.apos!=null?c.apos:1)}; if(c&&c.bio) n.bio=c.bio; salvaPinCfg(n); }
let travado=false, pinDig="", saiuEm=0, pinMsg="", esqueciPin=false;
const errosPin=()=>{ try{ return JSON.parse(localStorage.getItem("mb.pin.erros")||'{"n":0,"ate":0}'); }catch(e){ return {n:0,ate:0}; } };
const salvaErros=x=>{ try{ localStorage.setItem("mb.pin.erros",JSON.stringify(x)); }catch(e){} };
const PRESOS_NO_PIN=["app","sheet","monebot","tutorial"];
function inerteNoPin(){ PRESOS_NO_PIN.forEach(id=>{ const el=document.getElementById(id); if(el) el.inert=travado||(id==="app"&&document.body.classList.contains("sheet-open")); }); }
function travar(){ const c=pinCfg(); if(!c||travado) return; travado=true; pinDig=""; pinMsg=""; esqueciPin=false; document.body.classList.add("travado"); inerteNoPin(); renderLock(); if(c.bio) setTimeout(()=>usarBio(true),350); }
function destravar(){ travado=false; pinDig=""; document.body.classList.remove("travado"); inerteNoPin(); const el=document.getElementById("lock"); if(el) el.remove(); }
function renderLock(){
  let el=document.getElementById("lock"); if(!el){ el=document.createElement("div"); el.id="lock"; el.setAttribute("role","dialog"); el.setAttribute("aria-modal","true"); el.setAttribute("aria-label","App bloqueado"); document.body.appendChild(el); }
  const er=errosPin(), espera=Math.max(0,Math.ceil((er.ate-Date.now())/1000));
  if(espera>0) setTimeout(()=>{ if(travado) renderLock(); },1000);
  const nome=authUser&&authUser.displayName?primeiroNome(authUser.displayName):"";
  const tec=n=>`<button type="button" class="tecla" data-k="${n}" ${espera?"disabled":""}>${n}</button>`;
  el.innerHTML=esqueciPin?`<div class="lockbox">
      <span class="lockic">${ICON.cadeado}</span><h2>Esqueceu o PIN?</h2>
      ${mode==="cloud"?`<p>Para tirar o PIN deste aparelho, saia e entre de novo com a sua conta Google. Seus lançamentos continuam guardados na nuvem.</p>
        <button class="btn wide" type="button" data-lk="sair">Sair e entrar de novo</button>`
      :`<p>Sem login, os dados ficam só neste aparelho e não há como confirmar que é você. A única saída é apagar os dados deste aparelho e começar de novo.</p>
        <button class="btn danger wide" type="button" data-lk="apagar">Apagar os dados deste aparelho</button>`}
      <button class="link" type="button" data-lk="voltar">Voltar e tentar de novo</button></div>`
  :`<div class="lockbox">
    <img class="lklogo" src="icons/logo-128.png" alt="" width="64" height="64">
    <h2>${nome?"Olá, "+esc(nome):"Monetra"}</h2>
    <p class="${pinMsg?"erro":""}" aria-live="polite">${espera?"Muitas tentativas. Tente de novo em "+espera+"s.":pinMsg?esc(pinMsg):"Digite seu PIN para abrir"}</p>
    <div class="pontos ${pinMsg?"treme":""}">${Array.from({length:PINLEN},(_,i)=>`<i class="${i<pinDig.length?"on":""}"></i>`).join("")}</div>
    <div class="teclado">${[1,2,3,4,5,6,7,8,9].map(tec).join("")}<span></span>${tec(0)}<button type="button" class="tecla del" data-k="del" aria-label="Apagar" ${espera?"disabled":""}>${ICON.apagar}</button></div>
    ${pinCfg()&&pinCfg().bio?`<button class="btn ghost bio" type="button" data-lk="bio">${ICON.digital}Usar digital</button>`:""}
    <button class="link" type="button" data-lk="esqueci">Esqueci o PIN</button></div>`;
}
async function teclaPin(k){
  if(!travado) return;
  if(errosPin().ate>Date.now()) return;
  if(k==="del"){ pinDig=pinDig.slice(0,-1); pinMsg=""; renderLock(); return; }
  if(!/^\d$/.test(k)||pinDig.length>=PINLEN) return;
  pinDig+=k; pinMsg=""; renderLock();
  if(pinDig.length<PINLEN) return;
  if(await confere(pinDig)){ salvaErros({n:0,ate:0}); destravar(); return; }
  const er=errosPin(); er.n++; if(er.n>=5){ er.ate=Date.now()+30000*Math.pow(2,Math.min(4,er.n-5)); }
  salvaErros(er); pinDig=""; pinMsg=er.n>=5?"":"PIN errado"+(er.n>=3?" ("+(5-er.n)+" tentativa"+(5-er.n===1?"":"s")+" antes de esperar)":""); renderLock();
}
document.addEventListener("click",e=>{
  const lk=e.target.closest("#lock [data-k],#lock [data-lk]"); if(!lk) return;
  if(lk.dataset.k) return teclaPin(lk.dataset.k);
  const a=lk.dataset.lk;
  if(a==="bio"){ usarBio(false); return; }
  if(a==="esqueci"){ esqueciPin=true; renderLock(); }
  if(a==="voltar"){ esqueciPin=false; renderLock(); }
  if(a==="sair"){ salvaPinCfg(null); salvaErros({n:0,ate:0}); destravar(); if(fb) encerraSessao(); }
  if(a==="apagar"){ if(!lk.dataset.ok){ lk.dataset.ok="1"; lk.textContent="Toque de novo para apagar tudo"; return; } try{ localStorage.removeItem(LSKEY); }catch(e){} salvaPinCfg(null); salvaErros({n:0,ate:0}); location.reload(); }
});
document.addEventListener("keydown",e=>{ if(!travado) return; if(esqueciPin){ if(e.key!=="Tab"&&e.key!=="Enter"&&e.key!==" ") e.preventDefault(); return; } if(e.key.length===1&&!/^\d$/.test(e.key)){ e.preventDefault(); return; } if(/^\d$/.test(e.key)){ e.preventDefault(); teclaPin(e.key); } else if(e.key==="Backspace"){ e.preventDefault(); teclaPin("del"); } },true);
const diaAberto=new Date().toDateString();
document.addEventListener("visibilitychange",()=>{ if(!document.hidden&&new Date().toDateString()!==diaAberto&&!dirty.size&&!ui.sheet) location.reload(); });
document.addEventListener("visibilitychange",()=>{
  const c=pinCfg(); if(!c) return;
  if(document.hidden){ saiuEm=Date.now(); return; }
  if(saiuEm&&Date.now()-saiuEm>=(Number(c.apos)||0)*60000) travar();
  saiuEm=0;
});
const b64u={enc:buf=>btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""),dec:t=>Uint8Array.from(atob(t.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((t.length+3)%4)),c=>c.charCodeAt(0))};
let bioOk=null;
(async()=>{ try{ bioOk=!!(window.PublicKeyCredential&&PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); }catch(e){ bioOk=false; } if(state.loaded&&ui.tab==="perfil") render(); })();
async function ligarBio(){
  const c=pinCfg(); if(!c) return;
  try{
    const cred=await navigator.credentials.create({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),rp:{name:"Monetra"},
      user:{id:crypto.getRandomValues(new Uint8Array(16)),name:(authUser&&authUser.email)||"monetra",displayName:(authUser&&authUser.displayName)||"Monetra"},
      pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],authenticatorSelection:{authenticatorAttachment:"platform",userVerification:"required",residentKey:"discouraged"},timeout:60000,attestation:"none"}});
    c.bio=b64u.enc(cred.rawId); salvaPinCfg(c); render(); toast("Pronto: o app abre com a sua digital (ou rosto). O PIN continua valendo.");
  }catch(e){ console.warn(e); render(); toast(e&&e.name==="NotAllowedError"?"Cancelado.":"Não foi possível ligar a digital neste aparelho."); }
}
function desligarBio(){ const c=pinCfg(); if(c){ delete c.bio; salvaPinCfg(c); } render(); toast("Digital desligada. O app vai pedir só o PIN."); }
let bioRodando=false;
async function usarBio(auto){
  const c=pinCfg(); if(!c||!c.bio||!travado||bioRodando) return; bioRodando=true;
  try{ await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),allowCredentials:[{type:"public-key",id:b64u.dec(c.bio),transports:["internal"]}],userVerification:"required",timeout:60000}});
    salvaErros({n:0,ate:0}); destravar(); }
  catch(e){ if(!auto&&travado){ pinMsg="Não deu para usar a digital. Digite o PIN."; renderLock(); } }
  finally{ bioRodando=false; }
}
function cardPin(){
  const c=pinCfg();
  return `<div class="card" id="bloqueio"><div class="cardhead"><h2>Bloqueio com PIN</h2>${c?'<span class="tag">ligado</span>':""}</div>
  ${c?`<p class="hint">O app pede o PIN de ${PINLEN} números ao abrir neste aparelho. Cada aparelho tem o seu.</p>
    <p class="hint">O PIN é uma trava da tela: impede que alguém abra o app no seu aparelho, mas não criptografa os dados. Em computador de outras pessoas, use <b>Sair</b> no fim.</p>
    <label class="f">Pedir o PIN de novo quando voltar para o app<select class="in" id="pinApos">${[[0,"Na hora"],[1,"Depois de 1 minuto fora"],[5,"Depois de 5 minutos fora"],[15,"Depois de 15 minutos fora"]].map(([v,t])=>`<option value="${v}" ${Number(c.apos)===v?"selected":""}>${t}</option>`).join("")}</select></label>
    ${bioOk?`<label class="switch"><input type="checkbox" id="pinBio" ${c.bio?"checked":""}><span></span>Desbloquear com digital (ou rosto)</label>`:bioOk===false?`<p class="hint">Desbloqueio por digital: este aparelho ou navegador não oferece leitor de digital para sites.</p>`:""}
    <div class="row2"><button class="btn ghost" type="button" data-novo="pin" data-pinmodo="trocar">Trocar PIN</button><button class="btn ghost" type="button" data-novo="pin" data-pinmodo="desligar">Desligar</button></div>`
  :`<p class="hint">Proteja o app com um PIN de ${PINLEN} números, pedido sempre que abrir neste aparelho. Bom para quando outras pessoas usam o seu celular.</p>
    <button class="btn" type="button" data-novo="pin" data-pinmodo="criar">${ICON.cadeado}Criar PIN</button>`}</div>`;
}
async function salvarPin(){
  const s=ui.sheet, v=id=>((document.getElementById(id)||{}).value||"").trim(), ok=x=>new RegExp("^\\d{"+PINLEN+"}$").test(x);
  if(s.pinModo!=="criar"&&!(await confere(v("s-pinatual")))) return erroSheet("PIN atual errado.","s-pinatual");
  if(s.pinModo==="desligar"){ salvaPinCfg(null); closeSheet(); render(); toast("Bloqueio com PIN desligado neste aparelho."); return; }
  const n=v("s-pinnovo"), r=v("s-pinrep");
  if(!ok(n)) return erroSheet("O PIN precisa ter "+PINLEN+" números.","s-pinnovo");
  if(/^(\d)\1+$/.test(n)||"0123456789".includes(n)||"9876543210".includes(n)) return erroSheet("Escolha um PIN menos óbvio (evite 1111 ou 1234).","s-pinnovo");
  if(n!==r) return erroSheet("Os dois PINs não são iguais.","s-pinrep");
  await definePin(n); closeSheet(); render(); toast(s.pinModo==="criar"?"PIN criado. O app vai pedir ao abrir neste aparelho.":"PIN trocado.");
}

