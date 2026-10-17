(function(){
"use strict";
/* =====================================================================
   MB Controle — controle de gastos
   ===================================================================== */
const NOMES=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const ABR=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const INICIO="2026-09", PADRAO_ATE="2027-12", LIMITE_ATE="2036-12";
const DEFAULT_CATS=["Mercado / Alimentação","Moradia (aluguel, condomínio)","Contas (luz, água, internet, celular)","Transporte / Combustível","Saúde / Farmácia","Educação","Lazer / Restaurantes","Compras / Vestuário","Outros"];
const FORMAS=[["pix","Pix"],["debito","Débito"],["credito","Crédito"],["dinheiro","Dinheiro"],["boleto","Boleto"]];
const LSKEY="meucaixa.v1";

/* ---------- utilidades ---------- */
const pad2=n=>String(n).padStart(2,"0");
const keyOf=(y,m)=>y+"-"+pad2(m);
function shiftKey(k,n){ let y=+k.slice(0,4), m=+k.slice(5)+n; while(m>12){m-=12;y++;} while(m<1){m+=12;y--;} return keyOf(y,m); }
const kY=k=>+k.slice(0,4), kM=k=>+k.slice(5);
const diasMes=k=>new Date(kY(k),kM(k),0).getDate();
const nomeMes=k=>NOMES[kM(k)-1]+" "+kY(k);
const abrMes=k=>ABR[kM(k)-1].toLowerCase()+"/"+String(kY(k)).slice(2);
const brl=v=>(Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const uidGen=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
const formaNome=f=>(FORMAS.find(x=>x[0]===f)||[null,"Não informado"])[1];
function parseMoney(s){
  s=String(s||"").replace(/R\$|\s/g,"");
  if(!s) return NaN;
  if(s.includes(",")) s=s.replace(/\./g,"").replace(",",".");
  const n=Number(s); return isFinite(n)?Math.round(n*100)/100:NaN;
}
const moneyInput=v=>(v===null||v===undefined||v==="")?"":Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const ICON={
  mes:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  ano:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 20V11M10 20V5M15 20v-7M20 20V8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  ajustes:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="7" r="2.3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="10" cy="17" r="2.3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  perfil:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="8.5" r="3.8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4.5 20c1.3-3.6 4.2-5.5 7.5-5.5s6.2 1.9 7.5 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  mais:'<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  check:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  repete:'<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

/* ---------- estado ---------- */
function defaultConfig(){ return {salarioPadrao:0,saldoInicial:0,saldoCaixinha:0,ate:PADRAO_ATE,inicio:null,categorias:DEFAULT_CATS.map((n,i)=>({id:"c"+(i+1),nome:n,orcamento:0})),fixos:[]}; }
const state={config:defaultConfig(), months:{}, loaded:false};
let MESES=[];
const today=new Date();
const todayKey=keyOf(today.getFullYear(),today.getMonth()+1);
/* Meses existentes: de setembro/2026 até 2 meses depois do mês atual (avança sozinho com o calendário) */
function buildMeses(){ MESES=[]; const fim=shiftKey(todayKey,2); let k=INICIO; while(k<=fim){ MESES.push(k); k=shiftKey(k,1); } }
/* Meses que aparecem na barra: do início do controle (ou do mês atual) até 2 meses à frente */
function mesesVisiveis(){ const ini=inicioKey(); const de=ini&&ini<todayKey?ini:todayKey; return MESES.filter(k=>k>=de); }

const ui={tab:"mes",month:null,sheet:null,importMsg:"",loginModo:"entrar",gCat:null,gForma:"pix",filtro:""};
let mode="loading", uid=null, statusTxt="Carregando…", statusCls="";
buildMeses();
ui.month=todayKey;
try{ ui.gForma=localStorage.getItem("meucaixa.ui.forma")||"pix"; }catch(e){}

function normMonth(d){
  return {salario:(typeof d?.salario==="number")?d.salario:null,
    avulsos:Array.isArray(d?.avulsos)?d.avulsos:[],
    gastos:Array.isArray(d?.gastos)?d.gastos:[],
    caixinha:Array.isArray(d?.caixinha)?d.caixinha:[],
    fixos:(d&&typeof d.fixos==="object"&&!Array.isArray(d.fixos))?d.fixos:{}};
}
function normConfig(d){
  const ate=(typeof d?.ate==="string"&&/^\d{4}-\d{2}$/.test(d.ate)&&d.ate>=INICIO&&d.ate<=LIMITE_ATE)?d.ate:PADRAO_ATE;
  const cats=Array.isArray(d?.categorias)&&d.categorias.length?d.categorias.map(c=>({id:String(c.id),nome:String(c.nome||""),orcamento:Number(c.orcamento)||0})):defaultConfig().categorias;
  const fixos=Array.isArray(d?.fixos)?d.fixos.map(f=>({id:String(f.id),nome:String(f.nome||"Conta fixa"),cat:String(f.cat||""),valor:Number(f.valor)||0,dia:Math.min(31,Math.max(1,Number(f.dia)||1)),forma:String(f.forma||"boleto"),desde:/^\d{4}-\d{2}$/.test(f.desde||"")?f.desde:INICIO,ate:/^\d{4}-\d{2}$/.test(f.ate||"")?f.ate:null})):[];
  const inicio=(typeof d?.inicio==="string"&&/^\d{4}-\d{2}$/.test(d.inicio))?d.inicio:null;
  return {salarioPadrao:Number(d?.salarioPadrao)||0, saldoInicial:Number(d?.saldoInicial)||0, saldoCaixinha:Number(d?.saldoCaixinha)||0, ate, inicio, categorias:cats, fixos};
}
function getMonth(k){ if(!state.months[k]) state.months[k]=normMonth({}); else state.months[k]=Object.assign(normMonth({}),state.months[k]); return state.months[k]; }
const catIndex=id=>state.config.categorias.findIndex(c=>c.id===id);
const catColor=id=>{ const i=catIndex(id); return i<0?"var(--c8)":"var(--c"+(i%9)+")"; };
const catName=id=>{ const c=state.config.categorias.find(c=>c.id===id); return c?c.nome:"Sem categoria"; };

/* ---------- cálculos ---------- */
/* Mês em que o controle começa: o escolhido em Ajustes, ou o primeiro mês em que a pessoa registrou renda.
   Antes dele, salário padrão e contas fixas não entram (só o que foi lançado à mão). */
function inicioKey(){
  if(state.config.inicio) return state.config.inicio;
  const ks=Object.keys(state.months).filter(k=>{ const m=state.months[k]; return m&&((typeof m.salario==="number"&&m.salario>0)||(m.avulsos&&m.avulsos.length)); }).sort();
  return ks[0]||null;
}
const ativo=k=>{ const i=inicioKey(); return !!i&&k>=i; };
function fixosDoMes(k){
  const m=state.months[k], ov=(m&&m.fixos)||{}, dim=diasMes(k);
  if(!ativo(k)) return [];
  return state.config.fixos.filter(f=>f.desde<=k&&(!f.ate||k<=f.ate)).map(f=>{
    const o=ov[f.id]||{};
    return {id:f.id, fixo:true, desc:f.nome, cat:f.cat, forma:f.forma, dia:Math.min(f.dia,dim), valor:(typeof o.valor==="number")?o.valor:f.valor, padrao:f.valor, pago:!!o.pago, pular:!!o.pular};
  }).sort((a,b)=>a.dia-b.dia);
}
function despesasDoMes(k){ const m=state.months[k]; return (m?m.gastos:[]).concat(fixosDoMes(k).filter(f=>!f.pular)); }
const soma=(arr,f)=>arr.reduce((a,x)=>a+(Number(f?f(x):x.valor)||0),0);
function calc(k){
  const m=normMonth(state.months[k]||{});
  const salario=m.salario??(ativo(k)?state.config.salarioPadrao:0);
  const avulsos=soma(m.avulsos);
  const lista=despesasDoMes(k);
  const despesas=soma(lista);
  const fixos=fixosDoMes(k).filter(f=>!f.pular);
  const fixosTotal=soma(fixos), fixosPend=soma(fixos.filter(f=>!f.pago));
  const guardado=soma(m.caixinha.filter(x=>x.tipo==="guardar")), retirado=soma(m.caixinha.filter(x=>x.tipo==="retirar"));
  const receitas=salario+avulsos, saldo=receitas-despesas-guardado+retirado;
  const dim=diasMes(k);
  let porDia=null, porDiaSub="";
  if(k===todayKey){ const rest=dim-today.getDate()+1; porDia=Math.max(0,saldo)/rest; porDiaSub=rest+(rest===1?" dia restante":" dias restantes, contando hoje"); }
  else if(k>todayKey){ porDia=Math.max(0,saldo)/dim; porDiaSub="dividido pelos "+dim+" dias do mês"; }
  const porCat={}, porForma={};
  lista.forEach(g=>{ porCat[g.cat]=(porCat[g.cat]||0)+(Number(g.valor)||0); const f=g.forma||"?"; porForma[f]=(porForma[f]||0)+(Number(g.valor)||0); });
  return {salario,avulsos,despesas,receitas,saldo,guardado,retirado,porDia,porDiaSub,porCat,porForma,dim,fixosTotal,fixosPend,pct:receitas>0?despesas/receitas:0};
}
function caixinhaAte(k){ let s=state.config.saldoCaixinha; for(const x of MESES){ const c=calc(x); s+=c.guardado-c.retirado; if(x===k) break; } return s; }
function acumulado(k){ let s=state.config.saldoInicial; for(const x of MESES){ s+=calc(x).saldo; if(x===k) break; } return s; }
function variacao(atual,anterior){ if(!(anterior>0)) return ""; const p=(atual-anterior)/anterior; if(Math.abs(p)<0.005) return "igual ao mês anterior"; return (p>0?"▲ ":"▼ ")+Math.round(Math.abs(p)*100)+"% vs "+abrMes(shiftKey(ui.month,-1)); }

/* ---------- persistência ---------- */
const dirty=new Set(), timers={}, writing={}, again={};
function setStatus(t,c){ statusTxt=t; statusCls=c; const el=document.getElementById("status"); if(el){el.className="status "+c; el.innerHTML="<i></i>"+esc(t);} }
const docIdFor=k=>k==="config"?"config":"m-"+k;
const bodyFor=id=>clone(id==="config"?state.config:getMonth(id.slice(2)));
function save(k){
  const id=docIdFor(k);
  if(mode==="local"){ try{ localStorage.setItem(LSKEY,JSON.stringify({config:state.config,months:state.months})); setStatus("Salvo neste aparelho","ok"); }catch(e){ setStatus("Não foi possível salvar","err"); } return; }
  if(mode!=="cloud") return;
  dirty.add(id); setStatus("Salvando…","saving");
  clearTimeout(timers[id]); timers[id]=setTimeout(()=>flush(id),400);
}
async function flush(id){
  if(writing[id]){ again[id]=true; return; }
  writing[id]=true; let ok=false;
  try{ await fb.setDoc(fb.doc(fb.db,"users",uid,"docs",id), bodyFor(id)); ok=true; }catch(e){ console.error(e); }
  writing[id]=false;
  if(again[id]){ again[id]=false; return flush(id); }
  if(ok){ dirty.delete(id); if(!dirty.size) setStatus("Tudo salvo","ok"); }
  else setStatus("Erro ao salvar — confira a internet","err");
}
function loadLocal(){
  try{ const raw=localStorage.getItem(LSKEY); if(raw){ const d=JSON.parse(raw); if(d.config){ state.config=normConfig(d.config); buildMeses(); } if(d.months) for(const k in d.months) state.months[k]=normMonth(d.months[k]); } }catch(e){}
}
function resetState(){ state.config=defaultConfig(); state.months={}; buildMeses(); }
let fb=null, authUser=null, unsub=null, loginErro="";
const FB_V="10.12.2";
async function init(){
  const cfg=window.FIREBASE_CONFIG;
  if(!cfg||!cfg.apiKey||/COLE|SUA_/i.test(cfg.apiKey)){ mode="local"; loadLocal(); state.loaded=true; setStatus("Modo local (sem login)",""); render(); return; }
  try{
    const base="https://www.gstatic.com/firebasejs/"+FB_V+"/";
    const [A,U,F]=await Promise.all([import(base+"firebase-app.js"),import(base+"firebase-auth.js"),import(base+"firebase-firestore.js")]);
    const app=A.initializeApp(cfg), auth=U.getAuth(app);
    let db; try{ db=F.initializeFirestore(app,{localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()})}); }catch(e){ db=F.getFirestore(app); }
    fb={...U,...F,db,auth};
    U.getRedirectResult(auth).then(r=>{ if(r) boasVindas(r); }).catch(e=>{ loginErro=traduzErro(e); render(); });
    U.onAuthStateChanged(auth,user=>{
      if(unsub){ unsub(); unsub=null; }
      dirty.clear();
      if(!user){ authUser=null; uid=null; mode="login"; resetState(); state.loaded=true; closeSheet(); render(); return; }
      authUser=user; uid=user.uid; mode="cloud"; resetState(); state.loaded=false; setStatus("Carregando…",""); render();
      unsub=F.onSnapshot(F.collection(db,"users",uid,"docs"),snap=>{
        let changed=!state.loaded;
        snap.docs.forEach(doc=>{
          if(dirty.has(doc.id)) return;
          const d=doc.data();
          if(doc.id==="config"){ const c=normConfig(d); if(JSON.stringify(c)!==JSON.stringify(state.config)){ state.config=c; buildMeses(); changed=true; } }
          else if(doc.id.startsWith("m-")){ const k=doc.id.slice(2), mm=normMonth(d); if(JSON.stringify(mm)!==JSON.stringify(state.months[k]||null)){ state.months[k]=mm; changed=true; } }
        });
        if(!state.loaded){ state.loaded=true; if(!mesesVisiveis().includes(ui.month)) ui.month=todayKey; }
        if(!dirty.size) setStatus(snap.metadata.fromCache&&!navigator.onLine?"Sem internet — salvo no aparelho":"Sincronizado","ok");
        if(changed) render();
      },err=>{ console.error(err); setStatus("Sem acesso aos dados ("+(err.code||"erro")+")","err"); state.loaded=true; render(); });
    });
  }catch(e){ console.error(e); mode="local"; loadLocal(); state.loaded=true; setStatus("Sem conexão com o login — modo local","err"); render(); }
}
function traduzErro(e){ const c=e&&e.code||""; if(c.includes("unauthorized-domain")) return "Este endereço ainda não foi autorizado no Firebase (Authentication → Configurações → Domínios autorizados)."; if(c.includes("popup-closed")||c.includes("cancelled")) return ""; if(c.includes("network")) return "Sem internet. Tente de novo."; return "Não foi possível entrar ("+c+")."; }
async function entrar(){
  loginErro=""; const p=new fb.GoogleAuthProvider(); p.setCustomParameters({prompt:"select_account"});
  try{ const r=await fb.signInWithPopup(fb.auth,p); boasVindas(r); }
  catch(e){ const c=e.code||""; if(c.includes("popup-blocked")||c.includes("operation-not-supported")){ await fb.signInWithRedirect(fb.auth,p); } else { loginErro=traduzErro(e); render(); } }
}
function boasVindas(r){
  try{ const info=fb.getAdditionalUserInfo(r); const nome=((r.user&&r.user.displayName)||"").split(" ")[0];
    toast(info&&info.isNewUser?"Conta criada! Bem-vindo(a)"+(nome?", "+nome:"")+".":"Bem-vindo(a) de volta"+(nome?", "+nome:"")+"."); }catch(e){}
}

/* ---------- tema ---------- */
let tema="auto"; try{ tema=localStorage.getItem("meucaixa.tema")||"auto"; }catch(e){}
function aplicaTema(){
  const r=document.documentElement;
  if(tema==="claro") r.setAttribute("data-theme","light"); else if(tema==="escuro") r.setAttribute("data-theme","dark"); else r.removeAttribute("data-theme");
  const escuro=tema==="escuro"||(tema==="auto"&&window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches);
  const m=document.querySelector('meta[name="theme-color"]'); if(m) m.content=escuro?"#0F1613":"#0E6B55";
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

/* ---------- aviso (toast) com Desfazer ---------- */
let toastTimer=null, toastAcao=null;
function toast(msg,acaoTxt,acaoFn){
  let el=document.getElementById("toast");
  if(!el){ el=document.createElement("div"); el.id="toast"; el.className="toast"; el.setAttribute("role","status"); document.body.appendChild(el);
    el.addEventListener("click",e=>{ if(e.target.closest("[data-toastacao]")&&toastAcao){ const f=toastAcao; toastAcao=null; el.hidden=true; f(); } }); }
  toastAcao=acaoFn||null;
  el.innerHTML=`<span>${esc(msg)}</span>${acaoTxt?`<button type="button" data-toastacao="1">${esc(acaoTxt)}</button>`:""}`;
  el.hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>{el.hidden=true; toastAcao=null;},acaoTxt?6000:3500);
}
/* Faz uma alteração guardando uma cópia para poder desfazer */
function comDesfazer(chave,msg,fn){
  const antes=clone(chave==="config"?state.config:getMonth(chave));
  fn(); save(chave); render();
  toast(msg,"Desfazer",()=>{ if(chave==="config"){ state.config=antes; buildMeses(); } else state.months[chave]=antes; save(chave); render(); toast("Desfeito."); });
}

/* ---------- backup ---------- */
function exportar(){
  const blob=new Blob([JSON.stringify({app:"mb-controle",versao:2,exportadoEm:new Date().toISOString(),config:state.config,months:state.months},null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="mb-controle-backup-"+new Date().toISOString().slice(0,10)+".json"; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
}
function importar(file){
  const r=new FileReader();
  r.onload=()=>{ try{ const d=JSON.parse(r.result); if(!d.config||!d.months) throw 0;
    state.config=normConfig(d.config); buildMeses(); save("config");
    for(const k in d.months){ state.months[k]=normMonth(d.months[k]); save(k); }
    ui.importMsg="Backup restaurado."; render(); }catch(e){ ui.importMsg="Arquivo inválido. Use um backup baixado pelo MB Controle."; render(); } };
  r.readAsText(file);
}

/* =====================================================================
   TELAS
   ===================================================================== */
function render(){
  const a=document.activeElement, inApp=a&&document.getElementById("app").contains(a);
  const fid=inApp&&a.id, sel=(fid&&"selectionStart" in a)?[a.selectionStart,a.selectionEnd]:null;
  const app=document.getElementById("app");
  const corpo=mode==="login"?viewLogin():!state.loaded?'<div class="empty-state">Carregando seus lançamentos…</div>':ui.tab==="mes"?viewMes():ui.tab==="ano"?viewAno():ui.tab==="perfil"?viewPerfil():viewAjustes();
  app.innerHTML=header()+corpo+bottomNav();
  if(fid){ const el=document.getElementById(fid); if(el){ el.focus({preventScroll:true}); if(sel&&el.setSelectionRange){ try{el.setSelectionRange(sel[0],sel[1])}catch(e){} } } }
  const on=document.querySelector(".chip.on"); if(on&&on.scrollIntoView&&!fid) on.scrollIntoView({block:"nearest",inline:"center"});
}
function header(){
  const t=(id,l)=>`<button role="tab" data-tab="${id}" aria-selected="${ui.tab===id}">${l}</button>`;
  const VIS=mesesVisiveis(), i=VIS.indexOf(ui.month), logado=mode!=="login";
  return `<div class="top"><div class="brand"><h1>MB <span>Controle</span></h1><span class="status ${statusCls}" id="status"><i></i>${esc(statusTxt)}</span></div>
  <div class="topright">${logado?`<div class="tabs" role="tablist">${t("mes","Mês")}${t("ano","Visão geral")}${t("ajustes","Ajustes")}</div>`:botaoTema()}
  ${logado&&state.loaded?`<button type="button" class="avatarbtn ${ui.tab==="perfil"?"on":""}" data-tab="perfil" aria-label="Abrir meu perfil" title="Meu perfil">${avatar(36)}</button>`:""}</div></div>
  ${ui.tab==="mes"&&logado?`<div class="months"><button class="arrow" data-nav="-1" aria-label="Mês anterior" ${i<=0?"disabled":""}>‹</button>
  <div class="chips">${VIS.map(k=>`<button class="chip ${k===ui.month?"on":""} ${k===todayKey?"now":""}" data-month="${k}">${ABR[kM(k)-1]} <small>${String(kY(k)).slice(2)}</small></button>`).join("")}</div>
  <button class="arrow" data-nav="1" aria-label="Próximo mês" ${i>=VIS.length-1?"disabled":""}>›</button></div>`:""}
  ${mode==="local"&&state.loaded?`<div class="note">Modo local: os dados ficam só neste aparelho. Para cada pessoa entrar com a própria conta e sincronizar entre aparelhos, configure o Firebase (veja o LEIA-ME).</div>`:""}`;
}
function avatar(px){
  const nome=(authUser&&(authUser.displayName||authUser.email))||"";
  if(authUser&&authUser.photoURL) return `<img class="avatar" src="${esc(authUser.photoURL)}" alt="" width="${px}" height="${px}" referrerpolicy="no-referrer">`;
  const ini=nome?nome.trim().split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase():"";
  return `<span class="avatar" style="width:${px}px;height:${px}px">${ini?esc(ini):ICON.perfil}</span>`;
}
function bottomNav(){
  if(mode==="login"||!state.loaded) return "";
  const b=(id,l)=>`<button type="button" data-tab="${id}" class="${ui.tab===id?"on":""}" aria-current="${ui.tab===id?"page":"false"}">${ICON[id]}<span>${l}</span></button>`;
  return `<nav class="bottomnav" aria-label="Navegação">${b("mes","Mês")}${b("ano","Visão geral")}${b("ajustes","Ajustes")}${b("perfil","Perfil")}</nav>
  ${ui.tab==="mes"?`<button class="fab" type="button" data-novo="gasto" aria-label="Novo lançamento">${ICON.mais}</button>`:""}`;
}
function viewLogin(){
  const novo=ui.loginModo==="criar";
  return `<div class="login card">
  <div class="seg" role="tablist" style="width:100%"><input type="radio" name="lmodo" id="lmE" value="entrar" ${novo?"":"checked"}><label for="lmE">Entrar</label><input type="radio" name="lmodo" id="lmC" value="criar" ${novo?"checked":""}><label for="lmC">Criar conta</label></div>
  <h2>${novo?"Crie sua conta grátis":"Seu controle de gastos, só seu"}</h2>
  <p>${novo?"Use sua conta Google: não precisa inventar senha nem preencher cadastro. Sua página começa vazia e só você vê os seus lançamentos.":"Entre com a conta Google que você usou para criar sua conta. Cada pessoa tem a própria página: ninguém vê os lançamentos de outra pessoa."}</p>
  <button class="btn google" data-login="1" type="button"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>${novo?"Criar conta com Google":"Entrar com Google"}</button>
  ${loginErro?`<p class="note">${esc(loginErro)}</p>`:""}
  <p class="hint">${novo?"Já tem conta? Clique em Entrar.":"Primeira vez aqui? Clique em Criar conta."} Seus dados ficam salvos na nuvem e aparecem em qualquer aparelho onde você entrar.</p></div>`;
}

/* ---------- gráfico de rosca ---------- */
function donut(itens,total,centro,sub){
  let acc=0;
  const arcs=total>0?itens.filter(x=>x.v>0).map(x=>{ const p=x.v/total*100; const s=`<circle r="15.915" cx="21" cy="21" fill="none" stroke="${x.cor}" stroke-width="5.2" stroke-dasharray="${p.toFixed(3)} ${(100-p).toFixed(3)}" stroke-dashoffset="${(25-acc).toFixed(3)}"><title>${esc(x.nome)}: ${brl(x.v)}</title></circle>`; acc+=p; return s; }).join(""):"";
  return `<svg viewBox="0 0 42 42" class="donut" role="img" aria-label="Gastos por campo"><circle r="15.915" cx="21" cy="21" fill="none" stroke="var(--sunk)" stroke-width="5.2"/>${arcs}
  <text x="21" y="20.2" text-anchor="middle" class="d1">${esc(centro)}</text><text x="21" y="25" text-anchor="middle" class="d2">${esc(sub)}</text></svg>`;
}

/* ---------- aba Mês ---------- */
function linhaLanc(g){
  return `<button type="button" class="item" data-edit="gasto" data-id="${esc(g.id)}" style="--dot:${catColor(g.cat)}">
    <span class="pill">${esc(catName(g.cat))}</span>
    <span class="desc"><b class="${g.desc?"":"empty"}">${esc(g.desc||"sem descrição")}</b><small>${esc(formaNome(g.forma))}</small></span>
    <span class="v">${brl(g.valor)}</span></button>`;
}
function viewMes(){
  const k=ui.month, m=getMonth(k), c=calc(k), cats=state.config.categorias, isCur=k===todayKey;
  const prevK=shiftKey(k,-1), prev=MESES.includes(prevK)&&ativo(prevK)&&ativo(k)?calc(prevK):null;
  const acum=acumulado(k), cx=caixinhaAte(k);
  const tiles=`<div class="tiles">
    <div class="tile"><span class="lab">Receitas</span><span class="val">${brl(c.receitas)}</span><span class="sub">Salário ${brl(c.salario)} · avulsos ${brl(c.avulsos)}</span></div>
    <div class="tile"><span class="lab">Despesas</span><span class="val">${brl(c.despesas)}</span><span class="sub">${prev&&variacao(c.despesas,prev.despesas)?esc(variacao(c.despesas,prev.despesas)):(c.receitas>0?Math.round(c.pct*100)+"% do que entrou":"nenhuma receita ainda")}</span></div>
    <div class="tile hero"><span class="lab">Saldo do mês</span><span class="val ${c.saldo<0?"neg":"pos"}">${brl(c.saldo)}</span><span class="sub">acumulado: <b class="${acum<0?"neg":""}">${brl(acum)}</b></span></div>
    <div class="tile"><span class="lab">Pode gastar por dia</span><span class="val">${c.porDia===null?"—":brl(c.porDia)}</span><span class="sub">${c.porDia===null?"mês já encerrado":esc(c.porDiaSub)}</span></div>
    <div class="tile"><span class="lab">Caixinha</span><span class="val">${brl(cx)}</span><span class="sub">neste mês: +${brl(c.guardado)} · −${brl(c.retirado)}</span></div>
  </div>`;
  /* lançamentos */
  const gastos=m.gastos.filter(g=>!ui.filtro||g.cat===ui.filtro);
  const byDay={}; gastos.forEach(g=>{(byDay[g.dia]=byDay[g.dia]||[]).push(g)});
  const days=Object.keys(byDay).map(Number).sort((a,b)=>b-a);
  const lista=`<div class="card"><div class="cardhead"><h2>Despesas do mês</h2>
    <select class="in mini" id="filtroCat" aria-label="Filtrar por campo"><option value="">Todos os campos</option>${cats.map(ct=>`<option value="${esc(ct.id)}" ${ui.filtro===ct.id?"selected":""}>${esc(ct.nome)}</option>`).join("")}</select></div>
    <button type="button" class="btn wide desk" data-novo="gasto">${ICON.mais} Lançar despesa</button>
    ${days.length?days.map(d=>{ const its=byDay[d], tot=soma(its);
      const lab=new Date(kY(k),kM(k)-1,d).toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"}).replace(/\./g,"");
      return `<div class="day"><div class="dayhead"><span>${esc(lab)}${isCur&&d===today.getDate()?" · hoje":""}</span><span class="num">${brl(tot)}</span></div>${its.map(linhaLanc).join("")}</div>`; }).join("")
    :`<div class="empty-state">${ui.filtro?"Nenhuma despesa nesse campo em "+NOMES[kM(k)-1].toLowerCase()+".":"Nenhuma despesa em "+NOMES[kM(k)-1].toLowerCase()+" ainda.<br>Toque em <b>+</b> para lançar a primeira."}</div>`}
    <p class="hint">Toque num lançamento para editar ou apagar.</p></div>`;
  /* contas fixas */
  const fx=fixosDoMes(k);
  const fixas=`<div class="card"><div class="cardhead"><h2>Contas fixas</h2><span class="num muted">${fx.length?brl(c.fixosTotal):""}</span></div>
    ${fx.length?`<div>${fx.map(f=>`<div class="item fixrow ${f.pular?"skip":""}" style="--dot:${catColor(f.cat)}">
      <button type="button" class="check ${f.pago?"on":""}" data-pago="${esc(f.id)}" aria-pressed="${f.pago}" aria-label="${f.pago?"Marcar como não paga":"Marcar como paga"}" ${f.pular?"disabled":""}>${ICON.check}</button>
      <button type="button" class="fixinfo" data-edit="fixoMes" data-id="${esc(f.id)}"><b>${esc(f.desc)}</b><small>${f.pular?"pulada neste mês":"vence dia "+pad2(f.dia)+" · "+esc(catName(f.cat))}</small></button>
      <span class="v">${f.pular?"—":brl(f.valor)}</span></div>`).join("")}</div>
      <p class="hint">${c.fixosPend>0?"Falta pagar "+brl(c.fixosPend)+" este mês.":"Todas as contas fixas deste mês estão pagas."}</p>`
    :`<p class="hint">Cadastre contas que se repetem todo mês (aluguel, internet, academia). Elas entram sozinhas nas despesas.</p>`}
    <button type="button" class="btn ghost" data-novo="fixo">+ Conta fixa</button></div>`;
  /* receitas */
  const receitas=`<div class="card"><div class="cardhead"><h2>Receitas</h2><span class="num muted">${brl(c.receitas)}</span></div>
    <label class="f money">Salário / renda fixa deste mês<input class="in num" id="salMes" inputmode="decimal" value="${esc(moneyInput(m.salario))}" placeholder="${esc(moneyInput(state.config.salarioPadrao))} (padrão)"></label>
    <p class="hint">Em branco, usa o salário padrão definido em Ajustes.</p>
    ${m.avulsos.length?`<div>${m.avulsos.slice().sort((a,b)=>a.dia-b.dia).map(x=>`<button type="button" class="item" data-edit="avulso" data-id="${esc(x.id)}" style="--dot:var(--good)"><span class="pill">dia ${pad2(x.dia)}</span><span class="desc"><b class="${x.desc?"":"empty"}">${esc(x.desc||"sem descrição")}</b></span><span class="v pos">${brl(x.valor)}</span></button>`).join("")}</div>`:""}
    <button type="button" class="btn ghost" data-novo="avulso">+ Receita avulsa</button></div>`;
  /* caixinha */
  const caixa=`<div class="card"><div class="cardhead"><h2>Caixinha</h2><span class="big">${brl(cx)}</span></div>
    <p class="hint">Guardar tira do saldo do mês; retirar devolve para ele.</p>
    ${m.caixinha.length?`<div>${m.caixinha.slice().sort((a,b)=>a.dia-b.dia).map(x=>`<button type="button" class="item" data-edit="caixinha" data-id="${esc(x.id)}" style="--dot:${x.tipo==="guardar"?"var(--accent)":"var(--warn)"}"><span class="pill">${x.tipo==="guardar"?"guardou":"retirou"} · ${pad2(x.dia)}</span><span class="desc"><b class="${x.desc?"":"empty"}">${esc(x.desc||"sem motivo")}</b></span><span class="v">${x.tipo==="guardar"?"+":"−"}${brl(x.valor)}</span></button>`).join("")}</div>`:""}
    <div class="row2"><button type="button" class="btn ghost" data-novo="caixinha" data-cxtipo="guardar">+ Guardar</button><button type="button" class="btn ghost warnbtn" data-novo="caixinha" data-cxtipo="retirar">− Retirar</button></div></div>`;
  /* para onde foi */
  const itens=cats.map((ct,i)=>({id:ct.id,nome:ct.nome,v:c.porCat[ct.id]||0,o:ct.orcamento,cor:"var(--c"+(i%9)+")"}));
  const semCat=Object.keys(c.porCat).filter(id=>catIndex(id)<0).reduce((a,id)=>a+c.porCat[id],0);
  if(semCat>0) itens.push({id:"",nome:"Sem categoria",v:semCat,o:0,cor:"var(--c8)"});
  const ordenados=itens.slice().sort((a,b)=>b.v-a.v);
  const onde=`<div class="card"><div class="cardhead"><h2>Para onde foi</h2><span class="num muted">${prev&&variacao(c.despesas,prev.despesas)?esc(variacao(c.despesas,prev.despesas)):""}</span></div>
    <div class="donutwrap">${donut(ordenados,c.despesas,brl(c.despesas),"gasto no mês")}
    <div class="bars">${ordenados.filter(x=>x.v>0||x.o>0).map(x=>{ const pv=prev?(prev.porCat[x.id]||0):0; const p=x.o>0?x.v/x.o:0; const cls=x.o>0&&p>1?"over":x.o>0&&p>=.8?"warn":"";
      const w=x.o>0?Math.min(100,p*100):(c.despesas>0?x.v/c.despesas*100:0);
      const delta=prev&&(pv>0||x.v>0)?(x.v>pv?`<em class="up">▲ ${brl(x.v-pv)}</em>`:x.v<pv?`<em class="down">▼ ${brl(pv-x.v)}</em>`:""):"";
      return `<div class="bar ${cls}" style="--dot:${x.cor}"><div class="t"><b>${esc(x.nome)}</b><span class="num">${brl(x.v)}${x.o>0?" / "+brl(x.o):c.despesas>0?" · "+Math.round(x.v/c.despesas*100)+"%":""}</span></div><div class="track"><div style="width:${w.toFixed(1)}%"></div></div>${delta?`<div class="delta">${delta} vs ${abrMes(prevK)}</div>`:""}</div>`; }).join("")||'<p class="hint">Assim que você lançar despesas, aparece aqui quanto foi para cada campo.</p>'}</div></div>
    <p class="hint">Limites por campo ficam em Ajustes: amarelo a partir de 80%, vermelho quando passa.</p></div>`;
  /* forma de pagamento */
  const formas=FORMAS.map(([id,n])=>({id,n,v:c.porForma[id]||0})).concat([{id:"?",n:"Não informado",v:c.porForma["?"]||0}]).filter(x=>x.v>0).sort((a,b)=>b.v-a.v);
  const pag=`<div class="card"><div class="cardhead"><h2>Forma de pagamento</h2></div>
    ${formas.length?`<div class="bars">${formas.map(x=>`<div class="bar" style="--dot:var(--fm-${x.id==="?"?"na":x.id})"><div class="t"><b>${esc(x.n)}</b><span class="num">${brl(x.v)} · ${Math.round(x.v/c.despesas*100)}%</span></div><div class="track"><div style="width:${(x.v/formas[0].v*100).toFixed(1)}%"></div></div></div>`).join("")}</div>`:'<p class="hint">Mostra quanto saiu no Pix, débito, crédito, dinheiro e boleto.</p>'}
    ${c.porForma.credito>0?`<p class="hint">No crédito este mês: <b>${brl(c.porForma.credito)}</b> (vai para a fatura).</p>`:""}</div>`;
  const ini=inicioKey();
  const aviso=!ini?`<div class="note info">Seu controle ainda não começou. Informe o <b>salário deste mês</b> no card Receitas (ou lance uma receita avulsa) e os cálculos passam a contar a partir deste mês.</div>`
    :k<ini?`<div class="note info">Este mês é anterior ao início do seu controle (${esc(nomeMes(ini).toLowerCase())}). Aqui só conta o que você lançar à mão; o salário padrão e as contas fixas não entram.</div>`:"";
  return aviso+tiles+`<div class="grid"><div class="col">${lista}${onde}</div><div class="col">${fixas}${receitas}${caixa}${pag}</div></div>`;
}

/* ---------- aba Visão geral (só meses que já passaram + o atual) ---------- */
function viewAno(){
  const ini=inicioKey();
  if(!ini) return `<div class="empty-state">A visão geral aparece assim que você registrar sua primeira renda.<br>Vá na aba <b>Mês</b> e informe o salário do mês (ou uma receita avulsa).</div>`;
  const ks=MESES.filter(k=>k>=ini&&k<=todayKey);
  if(!ks.length) return `<div class="empty-state">Seu controle começa em ${esc(nomeMes(ini).toLowerCase())}. A visão geral mostra os meses a partir daí, até o mês atual.</div>`;
  const rows=ks.map(k=>({k,c:calc(k),ac:acumulado(k),cx:caixinhaAte(k)}));
  const T=rows.reduce((a,r)=>({rec:a.rec+r.c.receitas,des:a.des+r.c.despesas,sal:a.sal+r.c.saldo}),{rec:0,des:0,sal:0});
  const ult=rows[rows.length-1], periodo=abrMes(ks[0])+" a "+abrMes(ult.k)+" · "+ks.length+(ks.length===1?" mês":" meses");
  const comGasto=rows.filter(r=>r.c.despesas>0), media=comGasto.length?T.des/comGasto.length:0;
  const maior=comGasto.slice().sort((a,b)=>b.c.despesas-a.c.despesas)[0];
  const melhor=rows.slice().sort((a,b)=>b.c.saldo-a.c.saldo)[0];
  /* gráfico */
  const max=Math.max(1,...rows.map(r=>Math.max(r.c.receitas,r.c.despesas)));
  const nice=(()=>{const p=Math.pow(10,Math.floor(Math.log10(max)));const s=[1,2,2.5,5,10].find(s=>s*p>=max);return s*p;})();
  const W=Math.max(360,rows.length*64+70),H=230,L=58,B=28,top=12,gw=(W-L-8)/rows.length,bw=Math.min(18,gw/3);
  const y=v=>top+(H-top-B)*(1-v/nice);
  let svg=`<svg viewBox="0 0 ${W} ${H}" style="min-width:${Math.min(W,560)}px" role="img" aria-label="Receitas e despesas por mês">`;
  [0,.5,1].forEach(f=>{const v=nice*f;svg+=`<line x1="${L}" x2="${W-8}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="var(--muted)">${v>=1000?(v/1000).toLocaleString("pt-BR")+" mil":v.toLocaleString("pt-BR")}</text>`});
  rows.forEach((r,i)=>{const cx=L+gw*i+gw/2, cur=r.k===todayKey;
    svg+=`<rect x="${cx-bw-1}" y="${y(r.c.receitas)}" width="${bw}" height="${Math.max(0,H-B-y(r.c.receitas))}" rx="3" fill="var(--accent)"><title>${nomeMes(r.k)}: receitas ${brl(r.c.receitas)}</title></rect>`;
    svg+=`<rect x="${cx+1}" y="${y(r.c.despesas)}" width="${bw}" height="${Math.max(0,H-B-y(r.c.despesas))}" rx="3" fill="var(--c2)"><title>${nomeMes(r.k)}: despesas ${brl(r.c.despesas)}</title></rect>`;
    svg+=`<text x="${cx}" y="${H-10}" text-anchor="middle" font-size="11" fill="${cur?"var(--fg)":"var(--muted)"}" font-weight="${cur?700:400}">${ABR[kM(r.k)-1]}${kM(r.k)===1||i===0?" "+String(kY(r.k)).slice(2):""}</text>`;});
  svg+="</svg>";
  /* campos e formas no período */
  const cats=state.config.categorias;
  const catTot=cats.map((ct,i)=>({ct,i,v:rows.reduce((a,r)=>a+(r.c.porCat[ct.id]||0),0)})).filter(z=>z.v>0).sort((a,b)=>b.v-a.v);
  const fTot=FORMAS.map(([id,n])=>({id,n,v:rows.reduce((a,r)=>a+(r.c.porForma[id]||0),0)})).filter(z=>z.v>0).sort((a,b)=>b.v-a.v);
  return `<div class="tiles">
    <div class="tile"><span class="lab">Receitas</span><span class="val">${brl(T.rec)}</span><span class="sub">${esc(periodo)}</span></div>
    <div class="tile"><span class="lab">Despesas</span><span class="val">${brl(T.des)}</span><span class="sub">${T.rec>0?Math.round(T.des/T.rec*100)+"% das receitas":"—"}</span></div>
    <div class="tile hero"><span class="lab">Saldo acumulado</span><span class="val ${ult.ac<0?"neg":"pos"}">${brl(ult.ac)}</span><span class="sub">até ${esc(abrMes(ult.k))}, com saldo inicial</span></div>
    <div class="tile"><span class="lab">Caixinha</span><span class="val">${brl(ult.cx)}</span><span class="sub">guardado até agora</span></div>
    <div class="tile"><span class="lab">Média de gasto/mês</span><span class="val">${brl(media)}</span><span class="sub">${comGasto.length} ${comGasto.length===1?"mês":"meses"} com lançamentos</span></div>
  </div>
  ${maior||melhor?`<div class="destaques">${maior?`<div><span class="lab">Mês que mais gastou</span><b>${esc(nomeMes(maior.k))}</b><span>${brl(maior.c.despesas)}</span></div>`:""}${melhor&&melhor.c.saldo>0?`<div><span class="lab">Melhor saldo</span><b>${esc(nomeMes(melhor.k))}</b><span class="pos">${brl(melhor.c.saldo)}</span></div>`:""}${catTot[0]?`<div><span class="lab">Campo que mais pesou</span><b>${esc(catTot[0].ct.nome)}</b><span>${brl(catTot[0].v)} · ${Math.round(catTot[0].v/T.des*100)}%</span></div>`:""}</div>`:""}
  <div class="card chart"><div class="cardhead"><h2>Receitas x despesas</h2><div class="legend"><span><i style="background:var(--accent)"></i>Receitas</span><span><i style="background:var(--c2)"></i>Despesas</span></div></div><div class="tablewrap">${svg}</div></div>
  <div class="grid"><div class="card"><div class="cardhead"><h2>Mês a mês</h2><span class="num muted">toque para abrir</span></div><div class="tablewrap"><table>
    <thead><tr><th>Mês</th><th>Receitas</th><th>Despesas</th><th>Saldo</th><th>Acumulado</th></tr></thead>
    <tbody>${rows.slice().reverse().map(r=>`<tr class="click ${r.k===todayKey?"cur":""}" data-open="${r.k}"><td>${esc(nomeMes(r.k))}${r.k===todayKey?' <small class="muted">atual</small>':""}</td><td>${brl(r.c.receitas)}</td><td>${brl(r.c.despesas)}</td><td class="${r.c.saldo<0?"neg":""}">${brl(r.c.saldo)}</td><td class="${r.ac<0?"neg":""}">${brl(r.ac)}</td></tr>`).join("")}</tbody>
    <tfoot><tr><td>Total</td><td>${brl(T.rec)}</td><td>${brl(T.des)}</td><td>${brl(T.sal)}</td><td>${brl(ult.ac)}</td></tr></tfoot>
  </table></div></div>
  <div class="col"><div class="card"><h2>Para onde foi o dinheiro</h2>${catTot.length?`<div class="donutwrap">${donut(catTot.map(z=>({nome:z.ct.nome,v:z.v,cor:"var(--c"+(z.i%9)+")"})),T.des,brl(T.des),"no período")}<div class="bars">${catTot.map(z=>`<div class="bar" style="--dot:var(--c${z.i%9})"><div class="t"><b>${esc(z.ct.nome)}</b><span class="num">${brl(z.v)} · ${Math.round(z.v/T.des*100)}%</span></div><div class="track"><div style="width:${(z.v/catTot[0].v*100).toFixed(1)}%"></div></div><div class="delta">média ${brl(z.v/ks.length)}/mês</div></div>`).join("")}</div></div>`:`<div class="empty-state">Assim que você lançar despesas, o total por campo aparece aqui.</div>`}</div>
  ${fTot.length?`<div class="card"><h2>Forma de pagamento no período</h2><div class="bars">${fTot.map(x=>`<div class="bar" style="--dot:var(--fm-${x.id})"><div class="t"><b>${esc(x.n)}</b><span class="num">${brl(x.v)} · ${Math.round(x.v/T.des*100)}%</span></div><div class="track"><div style="width:${(x.v/fTot[0].v*100).toFixed(1)}%"></div></div></div>`).join("")}</div></div>`:""}</div></div>`;
}

/* ---------- aba Ajustes ---------- */
function viewAjustes(){
  const cf=state.config;
  const ativos=cf.fixos.filter(f=>!f.ate||f.ate>=todayKey), encerrados=cf.fixos.filter(f=>f.ate&&f.ate<todayKey);
  return `<div class="grid"><div class="col">
    <div class="card"><div class="cardhead"><h2>Contas fixas</h2><span class="num muted">${ativos.length?brl(soma(ativos))+"/mês":""}</span></div>
    ${ativos.length?`<div>${ativos.slice().sort((a,b)=>a.dia-b.dia).map(f=>`<button type="button" class="item" data-edit="fixo" data-id="${esc(f.id)}" style="--dot:${catColor(f.cat)}"><span class="pill">dia ${pad2(f.dia)}</span><span class="desc"><b>${esc(f.nome)}</b><small>${esc(catName(f.cat))} · ${esc(formaNome(f.forma))}${f.desde>todayKey?" · começa em "+abrMes(f.desde):""}</small></span><span class="v">${brl(f.valor)}</span></button>`).join("")}</div>`:`<p class="hint">Nenhuma conta fixa ainda. Exemplos: aluguel, internet, plano de celular, academia, streaming.</p>`}
    ${encerrados.length?`<p class="hint">${encerrados.length} conta(s) encerrada(s) continuam aparecendo nos meses em que valiam.</p>`:""}
    <button class="btn ghost" data-novo="fixo" type="button">+ Nova conta fixa</button></div></div>
    <div class="col"><div class="card"><div class="cardhead"><h2>Campos de gastos</h2><span class="num muted">limite mensal</span></div>
    <p class="hint">Renomeie, acrescente ou retire os campos de gasto. As mudanças valem para todos os meses.</p>
    ${cf.categorias.map((ct,i)=>`<div class="catrow" style="--dot:var(--c${i%9})"><span class="dot"></span><input class="in" id="cn-${esc(ct.id)}" data-catname="${esc(ct.id)}" value="${esc(ct.nome)}" aria-label="Nome do campo" maxlength="40"><span class="money"><input class="in num" id="co-${esc(ct.id)}" data-catorc="${esc(ct.id)}" inputmode="decimal" value="${esc(moneyInput(ct.orcamento||""))}" placeholder="sem limite" aria-label="Limite mensal"></span><button class="x" type="button" data-delcat="${esc(ct.id)}" aria-label="Retirar campo" ${cf.categorias.length<=1?"disabled":""}>×</button></div>`).join("")}
    <button class="btn ghost" data-addcat="1" type="button">+ Novo campo de gasto</button>
    <p class="hint">Retirar um campo não apaga os valores já lançados nele (aparecem como "Sem categoria").</p></div>
    </div></div>`;
}

/* ---------- aba Perfil ---------- */
function viewPerfil(){
  const cf=state.config, u=authUser, ini=inicioKey();
  const criado=u&&u.metadata&&u.metadata.creationTime?new Date(u.metadata.creationTime).toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"}):"";
  const nLanc=Object.values(state.months).reduce((a,m)=>a+(m.gastos?m.gastos.length:0)+(m.avulsos?m.avulsos.length:0)+(m.caixinha?m.caixinha.length:0),0);
  return `<div class="perfilhead card">${avatar(72)}<div class="pinfo"><h2>${esc(u?(u.displayName||"Sua conta"):"Modo local")}</h2>
    <p class="muted">${u?esc(u.email||""):"Sem login: os dados ficam só neste aparelho."}</p>
    <p class="small muted">${criado?"Conta criada em "+esc(criado)+" · ":""}${ini?"controle desde "+esc(nomeMes(ini).toLowerCase()):"controle ainda não começou"} · ${nLanc} lançamento${nLanc===1?"":"s"}</p></div>
    ${u?`<button class="btn ghost" type="button" data-logout="1">Sair da conta</button>`:""}</div>
  <div class="grid"><div class="col"><div class="card"><h2>Renda e saldos</h2>
    <label class="f money">Salário / renda fixa padrão (todo mês)<input class="in num" id="cfSal" inputmode="decimal" value="${esc(moneyInput(cf.salarioPadrao))}" placeholder="0,00"></label>
    <p class="hint">Entra automaticamente a partir do mês em que seu controle começa. Se um mês for diferente, ajuste na aba Mês.</p>
    <label class="f">Começar a contar em<select class="in" id="cfInicio"><option value="">Automático${ini&&!cf.inicio?" ("+esc(nomeMes(ini))+")":" (primeiro mês com renda)"}</option>${MESES.map(k=>`<option value="${k}" ${k===cf.inicio?"selected":""}>${esc(nomeMes(k))}</option>`).join("")}</select></label>
    <p class="hint">Antes desse mês, o salário padrão e as contas fixas não entram nas contas.</p>
    <label class="f money">Saldo inicial (o que você já tinha em conta)<input class="in num" id="cfSaldo" inputmode="decimal" value="${esc(moneyInput(cf.saldoInicial))}" placeholder="0,00"></label>
    <label class="f money">Saldo inicial da caixinha<input class="in num" id="cfCx" inputmode="decimal" value="${esc(moneyInput(cf.saldoCaixinha))}" placeholder="0,00"></label></div></div>
  <div class="col"><div class="card"><h2>Aparência</h2>
    <div class="seg" role="radiogroup" aria-label="Tema">${[["auto","Automático"],["claro","Claro"],["escuro","Escuro"]].map(([v,l])=>`<input type="radio" name="ptema" id="pt-${v}" value="${v}" ${tema===v?"checked":""}><label for="pt-${v}">${l}</label>`).join("")}</div>
    <p class="hint">Automático segue o tema do seu celular ou computador.</p></div>
    <div class="card"><h2>Backup</h2><p class="hint">Baixe uma cópia de todos os seus lançamentos ou restaure uma cópia salva.</p>
    <div class="row"><button class="btn ghost" type="button" data-export="1">Baixar backup</button><label class="btn ghost" for="impFile" style="text-align:center">Restaurar backup<input type="file" id="impFile" accept="application/json,.json" hidden></label></div>
    ${ui.importMsg?`<p class="hint">${esc(ui.importMsg)}</p>`:""}</div>
    <div class="card"><h2>Privacidade</h2><p class="hint">Só você vê seus lançamentos. Eles ficam guardados na sua conta e protegidos por regras que impedem qualquer outra pessoa de ler ou alterar.</p></div></div></div>`;
}

/* =====================================================================
   JANELA DE LANÇAMENTO (adicionar / editar)
   ===================================================================== */
function sheetRoot(){ let r=document.getElementById("sheet"); if(!r){ r=document.createElement("div"); r.id="sheet"; document.body.appendChild(r); bindSheet(r); } return r; }
let sheetVoltaFoco=null;
function openSheet(tipo,id,extra){
  if(mode==="login"||!state.loaded) return;
  if(!ui.sheet) sheetVoltaFoco=document.activeElement;
  ui.sheet=Object.assign({tipo,id:id||null},extra||{});
  renderSheet();
  const f=document.querySelector("#sheet [data-autofocus]"); if(f) setTimeout(()=>f.focus(),30);
}
function closeSheet(){ ui.sheet=null; const r=document.getElementById("sheet"); if(r) r.innerHTML=""; document.body.classList.remove("sheet-open"); if(sheetVoltaFoco&&document.contains(sheetVoltaFoco)) try{sheetVoltaFoco.focus()}catch(e){} sheetVoltaFoco=null; }
function itemAtual(){
  const s=ui.sheet; if(!s||!s.id) return null; const m=getMonth(ui.month);
  if(s.tipo==="gasto") return m.gastos.find(x=>x.id===s.id);
  if(s.tipo==="avulso") return m.avulsos.find(x=>x.id===s.id);
  if(s.tipo==="caixinha") return m.caixinha.find(x=>x.id===s.id);
  if(s.tipo==="fixo") return state.config.fixos.find(x=>x.id===s.id);
  if(s.tipo==="fixoMes") return fixosDoMes(ui.month).find(x=>x.id===s.id);
  return null;
}
function chipsCampo(sel){ return `<div class="cats" role="radiogroup" aria-label="Campo">${state.config.categorias.map((ct,i)=>`<input type="radio" name="s-cat" id="s-cat-${esc(ct.id)}" value="${esc(ct.id)}" ${ct.id===sel?"checked":""}><label for="s-cat-${esc(ct.id)}" style="--dot:var(--c${i%9})"><i></i>${esc(ct.nome)}</label>`).join("")}</div>`; }
function chipsForma(sel){ return `<div class="cats formas" role="radiogroup" aria-label="Forma de pagamento">${FORMAS.map(([id,n])=>`<input type="radio" name="s-forma" id="s-fm-${id}" value="${id}" ${id===sel?"checked":""}><label for="s-fm-${id}" style="--dot:var(--fm-${id})"><i></i>${n}</label>`).join("")}</div>`; }
function selDia(k,sel){ const dim=diasMes(k); let o=""; for(let d=1;d<=dim;d++){ const wd=new Date(kY(k),kM(k)-1,d).toLocaleDateString("pt-BR",{weekday:"short"}).replace(".",""); o+=`<option value="${d}" ${d===sel?"selected":""}>${pad2(d)} · ${wd}${k===todayKey&&d===today.getDate()?" (hoje)":""}</option>`; } return `<select class="in" id="s-dia">${o}</select>`; }
function renderSheet(){
  const r=sheetRoot(), s=ui.sheet;
  if(!s){ r.innerHTML=""; document.body.classList.remove("sheet-open"); return; }
  document.body.classList.add("sheet-open");
  const k=ui.month, it=itemAtual(), novo=!s.id, diaPadrao=k===todayKey?today.getDate():1;
  if(!novo&&!it){ closeSheet(); return; }
  const titulos={gasto:novo?"Nova despesa":"Editar despesa",avulso:novo?"Nova receita avulsa":"Editar receita",caixinha:novo?"Movimentar caixinha":"Editar caixinha",fixo:novo?"Nova conta fixa":"Editar conta fixa",fixoMes:it?it.desc:"Conta fixa"};
  const abas=novo&&s.tipo!=="fixoMes"?`<div class="seg tipos" role="tablist">${[["gasto","Despesa"],["avulso","Receita"],["caixinha","Caixinha"],["fixo","Conta fixa"]].map(([t,l])=>`<input type="radio" name="s-tipo" id="s-t-${t}" value="${t}" ${s.tipo===t?"checked":""}><label for="s-t-${t}">${l}</label>`).join("")}</div>`:"";
  const valorCampo=(v,lab)=>`<label class="f money bigval">${lab||"Valor"}<input class="in num" id="s-valor" inputmode="decimal" placeholder="0,00" value="${esc(v!=null?moneyInput(v):(s.valorRasc||""))}" data-autofocus required></label>`;
  let corpo="", botoes="";
  if(s.tipo==="gasto"){
    const cat=it?it.cat:(ui.gCat&&catIndex(ui.gCat)>=0?ui.gCat:state.config.categorias[0]?.id);
    corpo=`${valorCampo(it&&it.valor)}<div class="f"><span>Campo</span>${chipsCampo(cat)}</div>
      <div class="row"><label class="f">Dia${selDia(k,it?it.dia:diaPadrao)}</label><label class="f" style="flex:2 1 180px">Descrição (opcional)<input class="in" id="s-desc" maxlength="80" placeholder="ex.: feira, gasolina, farmácia" value="${esc(it?it.desc:"")}"></label></div>
      <div class="f"><span>Forma de pagamento</span>${chipsForma(it?(it.forma||""):ui.gForma)}</div>`;
    botoes=novo?`<button class="btn ghost" type="submit" data-outro="1">Salvar e lançar outra</button><button class="btn" type="submit">Salvar</button>`:`<button class="btn danger" type="button" data-sapagar="1">Apagar</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="avulso"){
    corpo=`${valorCampo(it&&it.valor)}<div class="row"><label class="f">Dia${selDia(k,it?it.dia:diaPadrao)}</label><label class="f" style="flex:2 1 180px">Descrição<input class="in" id="s-desc" maxlength="60" placeholder="ex.: freela, Pix recebido, 13º" value="${esc(it?it.desc:"")}"></label></div>`;
    botoes=novo?`<button class="btn" type="submit">Salvar</button>`:`<button class="btn danger" type="button" data-sapagar="1">Apagar</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="caixinha"){
    const tp=it?it.tipo:(s.cxTipo||"guardar");
    corpo=`<div class="seg" role="radiogroup" aria-label="Tipo"><input type="radio" name="s-cxtipo" id="s-cxG" value="guardar" ${tp==="guardar"?"checked":""}><label for="s-cxG">Guardar</label><input type="radio" name="s-cxtipo" id="s-cxR" value="retirar" ${tp==="retirar"?"checked":""}><label for="s-cxR">Retirar</label></div>
      ${valorCampo(it&&it.valor)}<div class="row"><label class="f">Dia${selDia(k,it?it.dia:diaPadrao)}</label><label class="f" style="flex:2 1 180px">Motivo (opcional)<input class="in" id="s-desc" maxlength="60" placeholder="ex.: reserva, viagem" value="${esc(it?it.desc:"")}"></label></div>
      <p class="hint">Saldo atual da caixinha: <b>${brl(caixinhaAte(k))}</b></p>`;
    botoes=novo?`<button class="btn" type="submit">Salvar</button>`:`<button class="btn danger" type="button" data-sapagar="1">Apagar</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="fixo"){
    const cat=it?it.cat:(ui.gCat&&catIndex(ui.gCat)>=0?ui.gCat:state.config.categorias[0]?.id);
    const desde=it?it.desde:(ui.tab==="mes"?k:(MESES.includes(todayKey)?todayKey:MESES[0]));
    corpo=`<label class="f">Nome da conta<input class="in" id="s-nome" maxlength="40" placeholder="ex.: Aluguel, Internet, Academia" value="${esc(it?it.nome:"")}" ${novo&&s.valorRasc?"":"data-autofocus"}></label>
      ${valorCampo(it&&it.valor,"Valor por mês").replace(" data-autofocus","")}
      <div class="row"><label class="f narrow">Vence dia<input class="in num" id="s-diafixo" type="number" min="1" max="31" value="${it?it.dia:diaPadrao}"></label>
      <label class="f">Começa em<select class="in" id="s-desde">${MESES.map(x=>`<option value="${x}" ${x===desde?"selected":""}>${esc(nomeMes(x))}</option>`).join("")}</select></label></div>
      <div class="f"><span>Campo</span>${chipsCampo(cat)}</div>
      <div class="f"><span>Forma de pagamento</span>${chipsForma(it?it.forma:"boleto")}</div>
      <p class="hint">A conta entra sozinha nas despesas de todos os meses a partir do mês escolhido. Em cada mês você marca se já pagou.</p>`;
    botoes=novo?`<button class="btn" type="submit">Salvar</button>`:`<button class="btn danger" type="button" data-sencerrar="1">Encerrar conta</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="fixoMes"){
    corpo=`<p class="hint">${esc(catName(it.cat))} · vence dia ${pad2(it.dia)} · ${esc(formaNome(it.forma))} · ${esc(nomeMes(k))}</p>
      <label class="switch"><input type="checkbox" id="s-pago" ${it.pago?"checked":""}><span></span>Já paguei esta conta</label>
      ${valorCampo(it.valor,"Valor neste mês")}
      <p class="hint">Valor padrão: ${brl(it.padrao)}. Mudar aqui vale só para ${esc(nomeMes(k).toLowerCase())}.</p>
      <div class="row2"><button class="btn ghost" type="button" data-spular="1">${it.pular?"Voltar a contar neste mês":"Pular só este mês"}</button><button class="btn ghost" type="button" data-sfixoedit="1">Editar conta fixa</button></div>`;
    botoes=`<button class="btn" type="submit">Salvar</button>`;
  }
  r.innerHTML=`<div class="sheet-wrap" data-sfechar="1"><form class="sheet" id="sheetForm" role="dialog" aria-modal="true" aria-labelledby="sheetTit" autocomplete="off" novalidate>
    <div class="sheethead"><h2 id="sheetTit">${esc(titulos[s.tipo])}</h2><span class="muted small">${esc(nomeMes(k))}</span><button type="button" class="x" data-sfechar="1" aria-label="Fechar">×</button></div>
    ${abas}${corpo}<p class="erro" id="s-erro" hidden></p><div class="sheetbtns">${botoes}</div></form></div>`;
}
function erroSheet(msg,campo){ const e=document.getElementById("s-erro"); if(e){ e.textContent=msg; e.hidden=false; } if(campo){ const c=document.getElementById(campo); if(c) c.focus(); } }
function salvarSheet(outro){
  const s=ui.sheet, k=ui.month, v=parseMoney((document.getElementById("s-valor")||{}).value);
  const val=id=>(document.getElementById(id)||{}).value, radio=n=>(document.querySelector(`#sheet input[name="${n}"]:checked`)||{}).value;
  const desc=(val("s-desc")||"").trim(), dia=Number(val("s-dia"))||1;
  if(s.tipo==="fixoMes"){
    const it=itemAtual(); if(!(v>=0)) return erroSheet("Digite um valor válido, ex.: 99,90","s-valor");
    const m=getMonth(k), o=Object.assign({},m.fixos[s.id]||{});
    o.pago=document.getElementById("s-pago").checked;
    const f=state.config.fixos.find(x=>x.id===s.id);
    if(f&&Math.abs(v-f.valor)<0.005) delete o.valor; else o.valor=v;
    m.fixos[s.id]=o; save(k); closeSheet(); render(); toast(o.pago?"Conta marcada como paga.":"Conta atualizada."); return;
  }
  if(s.tipo==="fixo"){
    const nome=(val("s-nome")||"").trim(); if(!nome) return erroSheet("Dê um nome para a conta, ex.: Aluguel","s-nome");
    if(!(v>0)) return erroSheet("Digite o valor por mês, ex.: 1.200,00","s-valor");
    const d={nome,valor:v,dia:Math.min(31,Math.max(1,Math.round(Number(val("s-diafixo"))||1))),cat:radio("s-cat")||"",forma:radio("s-forma")||"boleto",desde:val("s-desde")||k};
    if(s.id){ const f=state.config.fixos.find(x=>x.id===s.id); Object.assign(f,d); save("config"); closeSheet(); render(); toast("Conta fixa atualizada."); }
    else { state.config.fixos.push(Object.assign({id:"f"+uidGen(),ate:null},d)); save("config"); closeSheet(); render(); toast("Conta fixa criada. Ela entra sozinha todo mês."); }
    return;
  }
  if(!(v>0)) return erroSheet("Digite um valor maior que zero, ex.: 25,90","s-valor");
  const m=getMonth(k);
  if(s.tipo==="gasto"){
    const cat=radio("s-cat")||state.config.categorias[0]?.id, forma=radio("s-forma")||"";
    ui.gCat=cat; if(forma){ ui.gForma=forma; try{localStorage.setItem("meucaixa.ui.forma",forma)}catch(e){} }
    if(s.id){ Object.assign(itemAtual(),{valor:v,cat,dia,desc,forma}); save(k); closeSheet(); render(); toast("Despesa atualizada."); }
    else {
      const novo={id:uidGen(),dia,cat,valor:v,desc,forma}; m.gastos.push(novo); save(k);
      if(outro){ ui.sheet={tipo:"gasto",id:null}; renderSheet(); document.getElementById("s-valor").focus(); render(); toast(brl(v)+" em "+catName(cat)+" lançado.","Desfazer",()=>{ m.gastos=m.gastos.filter(x=>x.id!==novo.id); save(k); render(); }); }
      else { closeSheet(); render(); toast(brl(v)+" em "+catName(cat)+" lançado.","Desfazer",()=>{ const mm=getMonth(k); mm.gastos=mm.gastos.filter(x=>x.id!==novo.id); save(k); render(); }); }
    }
    return;
  }
  if(s.tipo==="avulso"){
    if(s.id) Object.assign(itemAtual(),{valor:v,dia,desc}); else m.avulsos.push({id:uidGen(),dia,desc,valor:v});
    save(k); closeSheet(); render(); toast(s.id?"Receita atualizada.":"Receita de "+brl(v)+" lançada."); return;
  }
  if(s.tipo==="caixinha"){
    const tipo=radio("s-cxtipo")||"guardar";
    if(s.id) Object.assign(itemAtual(),{valor:v,dia,desc,tipo}); else m.caixinha.push({id:uidGen(),dia,tipo,valor:v,desc});
    save(k); closeSheet(); render(); toast(tipo==="guardar"?brl(v)+" guardado na caixinha.":brl(v)+" retirado da caixinha."); return;
  }
}
function bindSheet(r){
  r.addEventListener("click",e=>{
    const b=e.target.closest("[data-sfechar],[data-sapagar],[data-sencerrar],[data-spular],[data-sfixoedit],[data-outro]");
    if(!b) return;
    if(b.dataset.sfechar!==undefined){ if(e.target===b||b.tagName==="BUTTON"){ closeSheet(); } return; }
    const s=ui.sheet, k=ui.month;
    if(b.dataset.outro){ e.preventDefault(); salvarSheet(true); return; }
    if(b.dataset.sapagar){
      const lista=s.tipo==="gasto"?"gastos":s.tipo==="avulso"?"avulsos":"caixinha", id=s.id;
      closeSheet(); comDesfazer(k,"Lançamento apagado.",()=>{ const m=getMonth(k); m[lista]=m[lista].filter(x=>x.id!==id); }); return;
    }
    if(b.dataset.sencerrar){
      const id=s.id, ate=shiftKey(todayKey,-1);
      closeSheet(); comDesfazer("config","Conta fixa encerrada a partir de "+abrMes(todayKey)+".",()=>{ const f=state.config.fixos.find(x=>x.id===id); if(!f) return; if(f.desde>ate) state.config.fixos=state.config.fixos.filter(x=>x.id!==id); else f.ate=ate; }); return;
    }
    if(b.dataset.spular){ const m=getMonth(k), o=Object.assign({},m.fixos[s.id]||{}); o.pular=!o.pular; if(o.pular) o.pago=false; m.fixos[s.id]=o; save(k); closeSheet(); render(); toast(o.pular?"Conta pulada em "+abrMes(k)+".":"Conta volta a contar em "+abrMes(k)+"."); return; }
    if(b.dataset.sfixoedit){ openSheet("fixo",s.id); return; }
  });
  r.addEventListener("change",e=>{ if(e.target.name==="s-tipo"){ const v=(document.getElementById("s-valor")||{}).value||""; ui.sheet={tipo:e.target.value,id:null,valorRasc:v}; renderSheet(); const f=document.querySelector("#sheet [data-autofocus]"); if(f) f.focus(); } });
  r.addEventListener("submit",e=>{ e.preventDefault(); salvarSheet(!!(e.submitter&&e.submitter.dataset.outro)); });
}

/* =====================================================================
   EVENTOS
   ===================================================================== */
const app=document.getElementById("app");
function goMonth(k){ if(!mesesVisiveis().includes(k)) return; ui.month=k; render(); }
function passo(n){ const V=mesesVisiveis(), i=V.indexOf(ui.month)+n; if(V[i]){ goMonth(V[i]); return true; } return false; }
function setTab(t){ ui.tab=t; render(); window.scrollTo({top:0}); }
app.addEventListener("click",e=>{
  const b=e.target.closest("button,tr[data-open]"); if(!b) return;
  const d=b.dataset;
  if(d.tab){ setTab(d.tab); return; }
  if(d.login){ entrar(); return; }
  if(d.logout){ fb.signOut(fb.auth); return; }
  if(d.tema){ trocaTema(); return; }
  if(d.export){ exportar(); return; }
  if(d.month){ goMonth(d.month); return; }
  if(d.nav){ passo(Number(d.nav)); return; }
  if(d.open){ ui.tab="mes"; goMonth(d.open); window.scrollTo({top:0}); return; }
  if(d.novo){ openSheet(d.novo,null,d.cxtipo?{cxTipo:d.cxtipo}:null); return; }
  if(d.edit){ openSheet(d.edit,d.id); return; }
  if(d.pago){ const k=ui.month, m=getMonth(k), o=Object.assign({},m.fixos[d.pago]||{}); o.pago=!o.pago; m.fixos[d.pago]=o; save(k); render(); toast(o.pago?"Conta marcada como paga.":"Conta marcada como não paga."); return; }
  if(d.delcat){ const id=d.delcat; comDesfazer("config","Campo retirado.",()=>{ state.config.categorias=state.config.categorias.filter(c=>c.id!==id); }); return; }
  if(d.addcat){ const id="c"+uidGen(); state.config.categorias.push({id,nome:"Novo gasto",orcamento:0}); save("config"); render(); const el=document.getElementById("cn-"+id); if(el){ el.focus(); el.select(); } return; }
});
app.addEventListener("change",e=>{
  const t=e.target, money=()=>t.value.trim()===""?0:parseMoney(t.value);
  if(t.name==="ptema"){ tema=t.value; try{localStorage.setItem("meucaixa.tema",tema)}catch(e){} aplicaTema(); render(); return; }
  if(t.name==="lmodo"){ ui.loginModo=t.value; render(); return; }
  if(t.id==="impFile"&&t.files&&t.files[0]){ importar(t.files[0]); return; }
  if(t.id==="filtroCat"){ ui.filtro=t.value; render(); return; }
  if(t.id==="salMes"){ const v=t.value.trim()===""?null:parseMoney(t.value); if(v!==null&&isNaN(v)){ toast("Valor inválido. Use, por exemplo, 2.800,00"); return; } getMonth(ui.month).salario=v; save(ui.month); render(); return; }
  if(t.id==="cfSal"||t.id==="cfSaldo"||t.id==="cfCx"){ const v=money(); if(isNaN(v)){ toast("Valor inválido. Use, por exemplo, 2.800,00"); return; } state.config[{cfSal:"salarioPadrao",cfSaldo:"saldoInicial",cfCx:"saldoCaixinha"}[t.id]]=v;
    if(t.id==="cfSal"&&v>0&&!inicioKey()){ state.config.inicio=MESES.includes(todayKey)?todayKey:MESES[0]; toast("Controle começa em "+nomeMes(state.config.inicio).toLowerCase()+"."); }
    save("config"); render(); return; }
  if(t.id==="cfInicio"){ state.config.inicio=t.value||null; save("config"); if(!mesesVisiveis().includes(ui.month)) ui.month=todayKey; render(); return; }
  if(t.dataset.catname){ const c=state.config.categorias.find(c=>c.id===t.dataset.catname); if(c){ c.nome=t.value.trim()||"Sem nome"; save("config"); render(); } return; }
  if(t.dataset.catorc){ const c=state.config.categorias.find(c=>c.id===t.dataset.catorc), v=money(); if(c&&!isNaN(v)){ c.orcamento=Math.max(0,v); save("config"); render(); } return; }
});
/* teclado: N abre novo lançamento, Esc fecha, ← → trocam o mês */
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&ui.sheet){ closeSheet(); return; }
  const tag=(e.target.tagName||"").toLowerCase(); if(tag==="input"||tag==="select"||tag==="textarea"||ui.sheet||e.ctrlKey||e.metaKey||e.altKey) return;
  if(ui.tab!=="mes"||mode==="login"||!state.loaded) return;
  if(e.key==="n"||e.key==="N"){ e.preventDefault(); openSheet("gasto"); }
  else if(e.key==="ArrowLeft") passo(-1);
  else if(e.key==="ArrowRight") passo(1);
});
/* deslizar para os lados troca o mês (celular) */
let tx=null, ty=null;
app.addEventListener("touchstart",e=>{ if(ui.tab!=="mes"||ui.sheet||e.touches.length!==1||e.target.closest(".chips,.tablewrap,input,select,.cats")){ tx=null; return; } tx=e.touches[0].clientX; ty=e.touches[0].clientY; },{passive:true});
app.addEventListener("touchend",e=>{ if(tx===null) return; const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty; tx=null;
  if(Math.abs(dx)>70&&Math.abs(dy)<45){ if(passo(dx<0?1:-1)){ app.classList.remove("slide-l","slide-r"); void app.offsetWidth; app.classList.add(dx<0?"slide-l":"slide-r"); } } },{passive:true});

/* quando o mês do calendário virar com o app aberto, atualiza sozinho */
setInterval(()=>{ const d=new Date(); if(keyOf(d.getFullYear(),d.getMonth()+1)!==todayKey&&!ui.sheet&&!dirty.size) location.reload(); },60000);

render();
init();
})();

if("serviceWorker" in navigator&&location.protocol==="https:"){ window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{})); }
