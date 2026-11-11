// @ts-check
// Fila de salvamento, mescla com o servidor e modo local.
"use strict";
const dirty=new Set(), timers={}, writing={}, again={}, apagados={}, docIds=new Set(), base={};
let retryTimer=null;
const ABA=(()=>{ try{ let a=sessionStorage.getItem("mb.aba"); if(!a){ a=Math.random().toString(36).slice(2,10); sessionStorage.setItem("mb.aba",a); } return a; }catch(e){ return "x"; } })();
const prefixoPend=()=>"mb.pend."+uid+"."+aberto+".", chavePend=()=>prefixoPend()+ABA;
function recolhePend(){ try{ const pre=prefixoPend(), meu=lerPend(); Object.keys(localStorage).filter(k=>k.startsWith(pre)&&k!==chavePend()).forEach(k=>{ const o=JSON.parse(localStorage.getItem(k)||"{}"); Object.keys(o).forEach(id=>{ if(!meu[id]) meu[id]=o[id]; }); localStorage.removeItem(k); }); if(Object.keys(meu).length) localStorage.setItem(chavePend(),JSON.stringify(meu)); return meu; }catch(e){ return lerPend(); } }
function lerPend(){ try{ return JSON.parse(localStorage.getItem(chavePend())||"{}"); }catch(e){ return {}; } }
function gravaPend(id,body,enviado){ if(mode!=="cloud"||!uid) return; try{ const o=lerPend(); if(body) o[id]={body,base:base[id]||null}; else if(o[id]&&(!enviado||J(o[id].body)===J(enviado))) delete o[id]; if(Object.keys(o).length) localStorage.setItem(chavePend(),JSON.stringify(o)); else localStorage.removeItem(chavePend()); }catch(e){} }
function zeraFila(){ Object.keys(timers).forEach(k=>{ clearTimeout(timers[k]); delete timers[k]; }); [writing,again,apagados,base].forEach(o=>Object.keys(o).forEach(k=>delete o[k])); dirty.clear(); clearTimeout(retryTimer); }
async function salvaPendentes(){
  if(mode!=="cloud") return;
  const ids=[...dirty]; Object.keys(timers).forEach(k=>{ clearTimeout(timers[k]); delete timers[k]; });
  if(!navigator.onLine||!ids.length) return;
  await Promise.race([Promise.all(ids.map(id=>flush(id))),new Promise(r=>setTimeout(r,6000))]);
}
function setStatus(t,c){ statusTxt=t; statusCls=c; const el=document.getElementById("status"); if(el){el.className="status "+c; el.title=t; el.innerHTML="<i></i><span class=\"stt\">"+esc(t)+"</span>";} }
const docIdFor=k=>k==="config"?"config":"m-"+k;
const bodyFor=id=>clone(id==="config"?state.config:getMonth(id.slice(2)));
function marcaApagado(chave,id){ const d=docIdFor(chave); (apagados[d]=apagados[d]||new Set()).add(id); }
function desmarcaApagado(chave,id){ const d=docIdFor(chave); if(apagados[d]) apagados[d].delete(id); }
function save(k){
  const id=docIdFor(k);
  if(mode==="local"){ try{ localStorage.setItem(LSKEY,JSON.stringify({config:state.config,months:state.months})); setStatus("Salvo neste aparelho","ok"); }catch(e){ setStatus("Não foi possível salvar","err"); } return; }
  if(mode!=="cloud") return;
  dirty.add(id); gravaPend(id,bodyFor(id)); setStatus(navigator.onLine?"Salvando…":"Sem internet — salvo no aparelho, envia quando voltar",navigator.onLine?"saving":"ok");
  clearTimeout(timers[id]); timers[id]=setTimeout(()=>{ delete timers[id]; flush(id); },400);
}
const LISTAS_MES=["gastos","avulsos","caixinha","transf"], LISTAS_CFG=["categorias","fixos","parcelas","rendas","metas","cartoes","contas","dividas","viagens","desafios"];
const MAPAS_MES=["fixos","rendas","parcelas","faturasPagas"];
const J=x=>JSON.stringify(x===undefined?null:x);
function mescla(local,servidor,id){
  const b=base[id]||(id==="config"?normConfig({}):normMonth({})), del=apagados[id]||new Set(), listas=id==="config"?LISTAS_CFG:LISTAS_MES, mapas=id==="config"?[]:MAPAS_MES;
  let mudou=false;
  listas.forEach(l=>{
    const L=local[l]||[], S=(servidor[l]||[]).filter(x=>x&&x.id), B=b?(b[l]||[]):null;
    const mS=new Map(S.map(x=>[x.id,x])), mB=new Map((B||[]).filter(x=>x&&x.id).map(x=>[x.id,x])), res=[];
    L.forEach(x=>{ const sx=mS.get(x.id), bx=mB.get(x.id);
      if(!sx){ if(bx&&J(bx)===J(x)){ mudou=true; return; } res.push(x); return; }
      if(bx&&J(bx)===J(x)&&J(sx)!==J(x)){ res.push(sx); mudou=true; return; }
      res.push(x); });
    const ids=new Set(L.map(x=>x.id));
    S.forEach(sx=>{ if(ids.has(sx.id)||del.has(sx.id)) return; if(B&&mB.has(sx.id)) return;
      res.push(sx); mudou=true; });
    local[l]=res;
  });
  mapas.forEach(mp=>{
    const L=Object.assign({},local[mp]||{}), S=servidor[mp]||{}, B=b?(b[mp]||{}):null;
    new Set([...Object.keys(L),...Object.keys(S)]).forEach(k=>{
      const inL=k in L, inS=k in S, inB=!!B&&(k in B);
      if(inL&&inS){ if(inB&&J(B[k])===J(L[k])&&J(S[k])!==J(L[k])){ L[k]=S[k]; mudou=true; } }
      else if(inS&&!inL){ if(!inB){ L[k]=S[k]; mudou=true; } }
      else if(inL&&!inS){ if(inB&&J(B[k])===J(L[k])){ delete L[k]; mudou=true; } }
    });
    local[mp]=L;
  });
  Object.keys(local).forEach(k=>{ if(listas.includes(k)||mapas.includes(k)) return; if(J(local[k])===J(b[k])&&J(servidor[k])!==J(local[k])&&(k in servidor)){ local[k]=servidor[k]; mudou=true; } });
  return mudou;
}
async function flush(id){
  if(mode!=="cloud"||!uid||!fb) return;
  if(writing[id]){ again[id]=true; return; }
  if(!navigator.onLine){ setStatus("Sem internet — salvo no aparelho, envia quando voltar","ok"); return; }
  writing[id]=true; let ok=false;
  const esp=aberto, meu=uid, ref=fb.doc(fb.db,...docsPath(),id), local0=bodyFor(id);
  let corpo=null, mudou=false;
  try{
    await fb.runTransaction(fb.db,async tx=>{
      const snap=await tx.get(ref), body=clone(local0);
      mudou=snap.exists()?mescla(body,id==="config"?normConfig(snap.data()):normMonth(snap.data()),id):false;
      if(id==="config"&&Array.isArray(body.desafios)&&!body.desafios.length) delete body.desafios;
      if(id==="config"&&!body.salarioDia) delete body.salarioDia;
      tx.set(ref,body); corpo=body;
    });
    ok=true;
  }catch(e){ console.error(e); }
  writing[id]=false;
  if(esp!==aberto||meu!==uid) return;
  if(ok){
    const editouDepois=!!timers[id]||again[id]||J(bodyFor(id))!==J(local0);
    base[id]=clone(editouDepois?local0:corpo); docIds.add(id); delete apagados[id];
    if(!editouDepois){ if(mudou){ if(id==="config"){ state.config=normConfig(corpo); buildMeses(); } else state.months[id.slice(2)]=normMonth(corpo); render(); } dirty.delete(id); gravaPend(id,null,local0); }
    if(again[id]){ again[id]=false; return flush(id); }
    if(!dirty.size) setStatus("Tudo salvo","ok");
  } else {
    if(again[id]){ again[id]=false; return flush(id); }
    setStatus("Não deu para salvar agora — tento de novo em instantes","err");
    clearTimeout(retryTimer); retryTimer=setTimeout(()=>[...dirty].forEach(x=>flush(x)),8000);
  }
}
window.addEventListener("offline",()=>{ if(mode==="cloud") setStatus("Sem internet — o que você lançar fica salvo no aparelho e envia quando voltar","ok"); });
window.addEventListener("online",()=>{ if(mode==="cloud"){ setStatus(dirty.size?"Sincronizando…":"Sincronizado",dirty.size?"saving":"ok"); [...dirty].forEach(id=>flush(id)); } });
function loadLocal(){
  try{ const raw=localStorage.getItem(LSKEY); if(raw){ const d=JSON.parse(raw); if(d.config){ state.config=normConfig(d.config); buildMeses(); } if(d.months) for(const k in d.months) if(mesValido(k)) state.months[k]=normMonth(d.months[k]); } }catch(e){}
}
function resetState(){ state.config=defaultConfig(); state.months={}; buildMeses(); }
let sairAnon=0, sairOff=0;
const temPendLocal=()=>{ try{ return !!uid&&Object.keys(localStorage).some(k=>k.startsWith("mb.pend."+uid+".")); }catch(e){ return false; } };
