(function(){
"use strict";
const NOMES=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const ABR=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const INICIO="2026-09", PADRAO_ATE="2027-12", LIMITE_ATE="2036-12";
let MESES=[];
function buildMeses(){ MESES=[]; const ate=state.config.ate||PADRAO_ATE; let y=2026,m=9; for(;;){ const k=y+"-"+String(m).padStart(2,"0"); if(k>ate) break; MESES.push({key:k,y,m}); m++; if(m>12){m=1;y++;} } }
function addMeses(n){ let [y,m]=(state.config.ate||PADRAO_ATE).split("-").map(Number); m+=n; while(m>12){m-=12;y++;} let k=y+"-"+String(m).padStart(2,"0"); if(k>LIMITE_ATE) k=LIMITE_ATE; state.config.ate=k; buildMeses(); save("config"); }
const DEFAULT_CATS=["Mercado / Alimentação","Moradia (aluguel, condomínio)","Contas (luz, água, internet, celular)","Transporte / Combustível","Saúde / Farmácia","Educação","Lazer / Restaurantes","Compras / Vestuário","Outros"];
const LSKEY="meucaixa.v1";

const state={
  config:{salarioPadrao:0,saldoInicial:0,saldoCaixinha:0,ate:PADRAO_ATE,categorias:DEFAULT_CATS.map((n,i)=>({id:"c"+(i+1),nome:n,orcamento:0}))},
  months:{}, loaded:false
};
const ui={tab:"mes",month:null,gDia:null,gCat:null,flash:null};
let mode="loading", uid=null, statusTxt="Carregando…", statusCls="";

buildMeses();
const today=new Date();
const todayKey=today.getFullYear()+"-"+String(today.getMonth()+1).padStart(2,"0");
try{ const saved=localStorage.getItem("meucaixa.ui.month"); if(saved&&MESES.some(x=>x.key===saved)) ui.month=saved; }catch(e){}
if(!ui.month) ui.month = MESES.some(x=>x.key===todayKey)?todayKey:MESES[0].key;

/* ---------- utilidades ---------- */
const brl=v=>(Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function parseMoney(s){
  s=String(s||"").replace(/R\$|\s/g,"");
  if(!s) return NaN;
  if(s.includes(",")) s=s.replace(/\./g,"").replace(",",".");
  const n=Number(s); return isFinite(n)?Math.round(n*100)/100:NaN;
}
const moneyInput=v=>(v===null||v===undefined||v==="")?"":Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const daysIn=(y,m)=>new Date(y,m,0).getDate();
const meta=k=>MESES.find(x=>x.key===k);
const uidGen=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
function getMonth(k){ if(!state.months[k]) state.months[k]={salario:null,avulsos:[],gastos:[],caixinha:[]}; if(!state.months[k].caixinha) state.months[k].caixinha=[]; return state.months[k]; }
function catIndex(id){ return state.config.categorias.findIndex(c=>c.id===id); }
function catColor(id){ const i=catIndex(id); return i<0?"var(--c8)":"var(--c"+(i%9)+")"; }
function catName(id){ const c=state.config.categorias.find(c=>c.id===id); return c?c.nome:"Sem categoria"; }
function normMonth(d){ return {salario:(typeof d?.salario==="number")?d.salario:null, avulsos:Array.isArray(d?.avulsos)?d.avulsos:[], gastos:Array.isArray(d?.gastos)?d.gastos:[], caixinha:Array.isArray(d?.caixinha)?d.caixinha:[]}; }
function normConfig(d){
  const ate=(typeof d?.ate==="string"&&/^\d{4}-\d{2}$/.test(d.ate)&&d.ate>=INICIO&&d.ate<=LIMITE_ATE)?d.ate:PADRAO_ATE;
  return {salarioPadrao:Number(d?.salarioPadrao)||0, saldoInicial:Number(d?.saldoInicial)||0, saldoCaixinha:Number(d?.saldoCaixinha)||0, ate,
    categorias:Array.isArray(d?.categorias)&&d.categorias.length?d.categorias.map(c=>({id:String(c.id),nome:String(c.nome||""),orcamento:Number(c.orcamento)||0})):state.config.categorias};
}

function calc(k){
  const mt=meta(k)||{y:+k.slice(0,4),m:+k.slice(5)}, m=normMonth(state.months[k]||{});
  const salario=m.salario??state.config.salarioPadrao;
  const avulsos=m.avulsos.reduce((a,x)=>a+(Number(x.valor)||0),0);
  const despesas=m.gastos.reduce((a,x)=>a+(Number(x.valor)||0),0);
  const guardado=m.caixinha.filter(x=>x.tipo==="guardar").reduce((a,x)=>a+(Number(x.valor)||0),0);
  const retirado=m.caixinha.filter(x=>x.tipo==="retirar").reduce((a,x)=>a+(Number(x.valor)||0),0);
  const receitas=salario+avulsos, saldo=receitas-despesas-guardado+retirado;
  const dim=daysIn(mt.y,mt.m);
  let porDia=null, porDiaSub="";
  if(k===todayKey){ const rest=dim-today.getDate()+1; porDia=Math.max(0,saldo)/rest; porDiaSub=rest+(rest===1?" dia restante":" dias restantes, contando hoje"); }
  else if(k>todayKey){ porDia=Math.max(0,saldo)/dim; porDiaSub="dividido pelos "+dim+" dias do mês"; }
  const porCat={}; m.gastos.forEach(g=>{porCat[g.cat]=(porCat[g.cat]||0)+(Number(g.valor)||0)});
  const diasComGasto=new Set(m.gastos.map(g=>g.dia)).size;
  return {salario,avulsos,despesas,receitas,saldo,guardado,retirado,porDia,porDiaSub,porCat,dim,diasComGasto,pct:receitas>0?despesas/receitas:0};
}
function caixinhaAte(k){ let s=state.config.saldoCaixinha; for(const x of MESES){ const c=calc(x.key); s+=c.guardado-c.retirado; if(x.key===k) break; } return s; }
function acumulado(k){ let s=state.config.saldoInicial; for(const x of MESES){ s+=calc(x.key).saldo; if(x.key===k) break; } return s; }

/* ---------- persistência ---------- */
const dirty=new Set(), timers={}, writing={}, again={};
function setStatus(t,c){ statusTxt=t; statusCls=c; const el=document.getElementById("status"); if(el){el.className="status "+c; el.innerHTML="<i></i>"+esc(t);} }
function docIdFor(k){ return k==="config"?"config":"m-"+k; }
function bodyFor(id){ return JSON.parse(JSON.stringify(id==="config"?state.config:getMonth(id.slice(2)))); }
function save(k){
  const id=docIdFor(k);
  if(mode==="local"){ try{ localStorage.setItem(LSKEY,JSON.stringify({config:state.config,months:state.months})); setStatus("Salvo neste navegador","ok"); }catch(e){ setStatus("Não foi possível salvar","err"); } return; }
  if(mode!=="cloud") return;
  dirty.add(id); setStatus("Salvando…","saving");
  clearTimeout(timers[id]); timers[id]=setTimeout(()=>flush(id),400);
}
async function flush(id){
  if(writing[id]){ again[id]=true; return; }
  writing[id]=true;
  let ok=false;
  try{ await fb.setDoc(fb.doc(fb.db,"users",uid,"docs",id), bodyFor(id)); ok=true; }catch(e){ console.error(e); }
  writing[id]=false;
  if(again[id]){ again[id]=false; return flush(id); }
  if(ok){ dirty.delete(id); if(![...dirty].length) setStatus("Tudo salvo","ok"); }
  else setStatus("Erro ao salvar — confira a internet","err");
}
function loadLocal(){
  try{ const raw=localStorage.getItem(LSKEY); if(raw){ const d=JSON.parse(raw); if(d.config){ state.config=normConfig(d.config); buildMeses(); } if(d.months) for(const k in d.months) state.months[k]=normMonth(d.months[k]); } }catch(e){}
}
function resetState(){ state.config=normConfig({}); state.config.categorias=DEFAULT_CATS.map((n,i)=>({id:"c"+(i+1),nome:n,orcamento:0})); state.months={}; buildMeses(); }
let fb=null, authUser=null, unsub=null;
const FB_V="10.12.2";
async function init(){
  const cfg=window.FIREBASE_CONFIG;
  if(!cfg||!cfg.apiKey||/COLE|SUA_/i.test(cfg.apiKey)){
    mode="local"; loadLocal(); state.loaded=true; setStatus("Modo local (sem login)",""); render(); return;
  }
  try{
    const base="https://www.gstatic.com/firebasejs/"+FB_V+"/";
    const [A,U,F]=await Promise.all([import(base+"firebase-app.js"),import(base+"firebase-auth.js"),import(base+"firebase-firestore.js")]);
    const app=A.initializeApp(cfg), auth=U.getAuth(app);
    let db; try{ db=F.initializeFirestore(app,{localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()})}); }catch(e){ db=F.getFirestore(app); }
    fb={...U,...F,db,auth};
    U.getRedirectResult(auth).catch(e=>{ loginErro=traduzErro(e); render(); });
    U.onAuthStateChanged(auth,user=>{
      if(unsub){ unsub(); unsub=null; }
      dirty.clear();
      if(!user){ authUser=null; uid=null; mode="login"; resetState(); state.loaded=true; render(); return; }
      authUser=user; uid=user.uid; mode="cloud"; resetState(); state.loaded=false; setStatus("Carregando…",""); render();
      unsub=F.onSnapshot(F.collection(db,"users",uid,"docs"),snap=>{
        let changed=!state.loaded;
        snap.docs.forEach(doc=>{
          if(dirty.has(doc.id)) return;
          const d=doc.data();
          if(doc.id==="config"){ const c=normConfig(d); if(JSON.stringify(c)!==JSON.stringify(state.config)){state.config=c;buildMeses();changed=true;} }
          else if(doc.id.startsWith("m-")){ const k=doc.id.slice(2), mm=normMonth(d); if(JSON.stringify(mm)!==JSON.stringify(state.months[k]||null)){state.months[k]=mm;changed=true;} }
        });
        if(!state.loaded){ state.loaded=true; if(!MESES.some(x=>x.key===ui.month)) ui.month=MESES.some(x=>x.key===todayKey)?todayKey:MESES[0].key; }
        if(!dirty.size) setStatus(snap.metadata.fromCache&&!navigator.onLine?"Sem internet — salvo no aparelho":"Sincronizado","ok");
        if(changed) render();
      },err=>{ console.error(err); setStatus("Sem acesso aos dados ("+(err.code||"erro")+")","err"); state.loaded=true; render(); });
    });
  }catch(e){
    console.error(e); mode="local"; loadLocal(); state.loaded=true; setStatus("Sem conexão com o login — modo local","err"); render();
  }
}
let loginErro="";
function traduzErro(e){ const c=e&&e.code||""; if(c.includes("unauthorized-domain")) return "Este endereço ainda não foi autorizado no Firebase (Authentication → Configurações → Domínios autorizados)."; if(c.includes("popup-closed")||c.includes("cancelled")) return ""; if(c.includes("network")) return "Sem internet. Tente de novo."; return "Não foi possível entrar ("+c+")."; }
async function entrar(){
  loginErro=""; const p=new fb.GoogleAuthProvider(); p.setCustomParameters({prompt:"select_account"});
  try{ await fb.signInWithPopup(fb.auth,p); }
  catch(e){ if((e.code||"").includes("popup-blocked")||(e.code||"").includes("operation-not-supported")){ await fb.signInWithRedirect(fb.auth,p); } else { loginErro=traduzErro(e); render(); } }
}
function viewLogin(){
  return `<div class="login card"><h2>Seu controle de gastos, só seu</h2>
  <p>Entre com sua conta Google. Cada pessoa tem a própria página: ninguém vê os lançamentos de outra pessoa.</p>
  <button class="btn google" data-login="1" type="button"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Entrar com Google</button>
  ${loginErro?`<p class="note">${esc(loginErro)}</p>`:""}
  <p class="hint">Seus dados ficam salvos na nuvem e aparecem em qualquer aparelho onde você entrar.</p></div>`;
}
function exportar(){
  const blob=new Blob([JSON.stringify({app:"meu-caixa",versao:1,exportadoEm:new Date().toISOString(),config:state.config,months:state.months},null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="meu-caixa-backup-"+new Date().toISOString().slice(0,10)+".json"; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
}
function importar(file){
  const r=new FileReader();
  r.onload=()=>{ try{ const d=JSON.parse(r.result); if(!d.config||!d.months) throw 0;
    state.config=normConfig(d.config); buildMeses(); save("config");
    for(const k in d.months){ state.months[k]=normMonth(d.months[k]); save(k); }
    ui.importMsg="Backup importado."; render(); }catch(e){ ui.importMsg="Arquivo inválido. Use um backup exportado pelo Meu Caixa."; render(); } };
  r.readAsText(file);
}

/* ---------- render ---------- */
function render(){
  const a=document.activeElement, fid=a&&a.id, sel=(a&&"selectionStart" in a)?[a.selectionStart,a.selectionEnd]:null;
  const app=document.getElementById("app");
  app.innerHTML=header()+(mode==="login"?viewLogin():!state.loaded?'<div class="empty-state">Carregando seus lançamentos…</div>':ui.tab==="mes"?viewMes():ui.tab==="ano"?viewAno():viewAjustes());
  if(fid){ const el=document.getElementById(fid); if(el){ el.focus({preventScroll:true}); if(sel&&el.setSelectionRange){ try{el.setSelectionRange(sel[0],sel[1])}catch(e){} } } }
  if(ui.flash){ const el=document.getElementById(ui.flash); ui.flash=null; if(el) el.focus(); }
  const on=document.querySelector(".chip.on"); if(on&&on.scrollIntoView&&!fid) on.scrollIntoView({block:"nearest",inline:"center"});
}
function header(){
  const t=(id,l)=>`<button role="tab" data-tab="${id}" aria-selected="${ui.tab===id}">${l}</button>`;
  const i=MESES.findIndex(x=>x.key===ui.month);
  return `<div class="top"><div class="brand"><h1>Meu <span>Caixa</span></h1><span class="status ${statusCls}" id="status"><i></i>${esc(statusTxt)}</span></div>
  ${mode==="login"?"":`<div class="tabs" role="tablist">${t("mes","Mês")}${t("ano","Visão geral")}${t("ajustes","Ajustes")}</div>`}
  ${authUser?`<div class="who">${authUser.photoURL?`<img src="${esc(authUser.photoURL)}" alt="" referrerpolicy="no-referrer">`:""}<span>${esc((authUser.displayName||authUser.email||"").split(" ")[0])}</span><button class="link" data-logout="1" type="button">Sair</button></div>`:""}</div>
  ${ui.tab==="mes"&&mode!=="login"?`<div class="months"><button class="arrow" data-nav="-1" aria-label="Mês anterior" ${i<=0?"disabled":""}>‹</button>
  <div class="chips">${MESES.map(x=>`<button class="chip ${x.key===ui.month?"on":""} ${x.key===todayKey?"now":""}" data-month="${x.key}">${ABR[x.m-1]} <small>${String(x.y).slice(2)}</small></button>`).join("")}${(state.config.ate||PADRAO_ATE)<LIMITE_ATE?`<button class="chip add" data-addmonth="1" title="Acrescentar mais um mês">+ mês</button>`:""}</div>
  <button class="arrow" data-nav="1" aria-label="Próximo mês" ${i>=MESES.length-1?"disabled":""}>›</button></div>`:""}
  ${mode==="local"&&state.loaded?`<div class="note">Modo local: os dados ficam só neste aparelho. Para cada pessoa entrar com a própria conta e sincronizar entre aparelhos, configure o Firebase (veja o LEIA-ME).</div>`:""}`;
}
function viewMes(){
  const k=ui.month, mt=meta(k), m=getMonth(k), c=calc(k), cats=state.config.categorias;
  const isCur=k===todayKey;
  if(ui.gDia===null||ui.gDia>c.dim) ui.gDia=isCur?today.getDate():1;
  if(!ui.gCat||catIndex(ui.gCat)<0) ui.gCat=cats[0]?.id;
  const acum=acumulado(k);
  const tiles=`<div class="tiles">
    <div class="tile"><span class="lab">Receitas</span><span class="val">${brl(c.receitas)}</span><span class="sub">Salário ${brl(c.salario)} · avulsos ${brl(c.avulsos)}</span></div>
    <div class="tile"><span class="lab">Despesas</span><span class="val">${brl(c.despesas)}</span><span class="sub">${c.receitas>0?Math.round(c.pct*100)+"% do que entrou":"nenhuma receita ainda"}</span></div>
    <div class="tile hero"><span class="lab">Saldo do mês</span><span class="val ${c.saldo<0?"neg":"pos"}">${brl(c.saldo)}</span><span class="sub">${c.guardado||c.retirado?"já descontando a caixinha · ":""}acumulado: <b class="${acum<0?"neg":""}">${brl(acum)}</b></span></div>
    <div class="tile"><span class="lab">Pode gastar por dia</span><span class="val">${c.porDia===null?"—":brl(c.porDia)}</span><span class="sub">${c.porDia===null?"mês já encerrado":esc(c.porDiaSub)}</span></div>
    <div class="tile"><span class="lab">Caixinha</span><span class="val">${brl(caixinhaAte(k))}</span><span class="sub">neste mês: +${brl(c.guardado)} · −${brl(c.retirado)}</span></div>
  </div>`;
  const dayOpts=Array.from({length:c.dim},(_,i)=>{const d=i+1, wd=new Date(mt.y,mt.m-1,d).toLocaleDateString("pt-BR",{weekday:"short"}).replace(".","");return `<option value="${d}" ${d===ui.gDia?"selected":""}>${String(d).padStart(2,"0")} · ${wd}${isCur&&d===today.getDate()?" (hoje)":""}</option>`}).join("");
  const form=`<form class="card" id="fGasto" autocomplete="off">
    <h2>Lançar despesa <span class="num">${NOMES[mt.m-1]} ${mt.y}</span></h2>
    <div class="cats" role="radiogroup" aria-label="Categoria">${cats.map((ct,i)=>`<input type="radio" name="gcat" id="gcat-${esc(ct.id)}" value="${esc(ct.id)}" ${ct.id===ui.gCat?"checked":""}><label for="gcat-${esc(ct.id)}" style="--dot:var(--c${i%9})"><i></i>${esc(ct.nome)}</label>`).join("")}</div>
    <div class="row">
      <label class="f narrow">Dia<select class="in" id="gDia">${dayOpts}</select></label>
      <label class="f money">Valor<input class="in num" id="gValor" inputmode="decimal" placeholder="0,00" required></label>
      <label class="f" style="flex:2 1 160px">Descrição (opcional)<input class="in" id="gDesc" placeholder="ex.: feira, gasolina, farmácia" maxlength="80"></label>
      <button class="btn" type="submit">Adicionar</button>
    </div>
  </form>`;
  const byDay={}; m.gastos.forEach(g=>{(byDay[g.dia]=byDay[g.dia]||[]).push(g)});
  const days=Object.keys(byDay).map(Number).sort((a,b)=>b-a);
  const lista=`<div class="card"><h2>Despesas do mês <span class="num">${m.gastos.length} lançamento${m.gastos.length===1?"":"s"}</span></h2>
    ${days.length?days.map(d=>{const its=byDay[d], tot=its.reduce((a,x)=>a+x.valor,0);
      const lab=new Date(mt.y,mt.m-1,d).toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"}).replace(/\./g,"");
      return `<div class="day"><div class="dayhead"><span>${esc(lab)}</span><span class="num">${brl(tot)}</span></div>
      ${its.map(g=>`<div class="item" style="--dot:${catColor(g.cat)}"><span class="pill">${esc(catName(g.cat))}</span><span class="desc ${g.desc?"":"empty"}">${esc(g.desc||"sem descrição")}</span><span class="v">${brl(g.valor)}</span><button class="x" data-delg="${esc(g.id)}" aria-label="Apagar">×</button></div>`).join("")}</div>`}).join("")
    :`<div class="empty-state">Nenhuma despesa em ${NOMES[mt.m-1].toLowerCase()} ainda.<br>Escolha a categoria, digite o valor e clique em <b>Adicionar</b>.</div>`}
  </div>`;
  const receitas=`<div class="card"><h2>Receitas <span class="num">${brl(c.receitas)}</span></h2>
    <label class="f money">Salário / renda fixa deste mês<input class="in num" id="salMes" inputmode="decimal" value="${esc(moneyInput(m.salario))}" placeholder="${esc(moneyInput(state.config.salarioPadrao))} (padrão)"></label>
    <p class="hint">Em branco, usa o salário padrão definido em Ajustes.</p>
    <form id="fAvulso" class="row" autocomplete="off">
      <label class="f narrow">Dia<input class="in num" id="aDia" type="number" min="1" max="${c.dim}" value="${isCur?today.getDate():1}"></label>
      <label class="f" style="flex:2 1 140px">Recebimento avulso<input class="in" id="aDesc" placeholder="ex.: freela, Pix, 13º" maxlength="60"></label>
      <label class="f money">Valor<input class="in num" id="aValor" inputmode="decimal" placeholder="0,00" required></label>
      <button class="btn ghost" type="submit">+ Avulso</button>
    </form>
    ${m.avulsos.length?`<div>${m.avulsos.slice().sort((a,b)=>a.dia-b.dia).map(x=>`<div class="item" style="--dot:var(--good)"><span class="pill">dia ${String(x.dia).padStart(2,"0")}</span><span class="desc ${x.desc?"":"empty"}">${esc(x.desc||"sem descrição")}</span><span class="v pos">${brl(x.valor)}</span><button class="x" data-dela="${esc(x.id)}" aria-label="Apagar">×</button></div>`).join("")}</div>`:""}
  </div>`;
  const barras=`<div class="card"><h2>Por categoria <span class="num">gasto / limite</span></h2><div class="bars">
    ${cats.map((ct,i)=>{const g=c.porCat[ct.id]||0, o=ct.orcamento, p=o>0?g/o:0, w=o>0?Math.min(100,p*100):(c.despesas>0?g/c.despesas*100:0);
      const cls=o>0&&p>1?"over":o>0&&p>=.8?"warn":"";
      return `<div class="bar ${cls}" style="--dot:var(--c${i%9})"><div class="t"><b>${esc(ct.nome)}</b><span class="num">${brl(g)}${o>0?" / "+brl(o):""}</span></div><div class="track"><div style="width:${w.toFixed(1)}%"></div></div></div>`}).join("")}
    ${(c.porCat[""]||Object.keys(c.porCat).some(id=>catIndex(id)<0))?`<p class="hint">Há gastos em categorias que foram removidas.</p>`:""}
    </div><p class="hint">Defina limites por categoria em Ajustes. A barra fica amarela em 80% e vermelha quando passa do limite.</p></div>`;
  if(!ui.cxTipo) ui.cxTipo="guardar";
  const cx=`<div class="card"><div class="cx-head"><h2>Caixinha</h2><span class="big">${brl(caixinhaAte(k))}</span></div>
    <p class="hint">Dinheiro que você separa do mês. Guardar tira do saldo do mês; retirar devolve para ele.</p>
    <form id="fCx" class="row" autocomplete="off" style="flex-direction:column;align-items:stretch">
      <div class="seg" role="radiogroup" aria-label="Tipo"><input type="radio" name="cxtipo" id="cxG" value="guardar" ${ui.cxTipo==="guardar"?"checked":""}><label for="cxG">Guardar</label><input type="radio" name="cxtipo" id="cxR" value="retirar" ${ui.cxTipo==="retirar"?"checked":""}><label for="cxR">Retirar</label></div>
      <div class="row">
        <label class="f narrow">Dia<input class="in num" id="cxDia" type="number" min="1" max="${c.dim}" value="${isCur?today.getDate():1}"></label>
        <label class="f money">Valor<input class="in num" id="cxValor" inputmode="decimal" placeholder="0,00" required></label>
        <label class="f" style="flex:2 1 140px">Motivo (opcional)<input class="in" id="cxDesc" placeholder="ex.: reserva, viagem" maxlength="60"></label>
        <button class="btn ghost" type="submit">Lançar</button>
      </div>
    </form>
    ${m.caixinha.length?`<div>${m.caixinha.slice().sort((a,b)=>a.dia-b.dia).map(x=>`<div class="item" style="--dot:${x.tipo==="guardar"?"var(--accent)":"var(--warn)"}"><span class="pill">${x.tipo==="guardar"?"guardou":"retirou"} · ${String(x.dia).padStart(2,"0")}</span><span class="desc ${x.desc?"":"empty"}">${esc(x.desc||"sem motivo")}</span><span class="v">${x.tipo==="guardar"?"+":"−"}${brl(x.valor)}</span><button class="x" data-delcx="${esc(x.id)}" aria-label="Apagar">×</button></div>`).join("")}</div>`:""}
  </div>`;
  return tiles+`<div class="grid"><div class="col">${form}${lista}</div><div class="col">${receitas}${cx}${barras}</div></div>`;
}
function viewAno(){
  const rows=MESES.map(x=>({x,c:calc(x.key),ac:acumulado(x.key)}));
  const T=rows.reduce((a,r)=>({rec:a.rec+r.c.receitas,des:a.des+r.c.despesas}),{rec:0,des:0});
  const ult=MESES[MESES.length-1], periodo="set/26 a "+ABR[ult.m-1].toLowerCase()+"/"+String(ult.y).slice(2);
  const max=Math.max(1,...rows.map(r=>Math.max(r.c.receitas,r.c.despesas)));
  const nice=(()=>{const p=Math.pow(10,Math.floor(Math.log10(max)));const s=[1,2,2.5,5,10].find(s=>s*p>=max);return s*p;})();
  const W=760,H=240,L=58,B=28,top=12,gw=(W-L-8)/rows.length,bw=Math.min(16,gw/3);
  const y=v=>top+(H-top-B)*(1-v/nice);
  let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Receitas e despesas por mês">`;
  [0,.5,1].forEach(f=>{const v=nice*f;svg+=`<line x1="${L}" x2="${W-8}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="var(--muted)">${v>=1000?(v/1000).toLocaleString("pt-BR")+" mil":v.toLocaleString("pt-BR")}</text>`});
  rows.forEach((r,i)=>{const cx=L+gw*i+gw/2;
    svg+=`<rect x="${cx-bw-1}" y="${y(r.c.receitas)}" width="${bw}" height="${Math.max(0,H-B-y(r.c.receitas))}" rx="3" fill="var(--accent)"><title>${ABR[r.x.m-1]}: receitas ${brl(r.c.receitas)}</title></rect>`;
    svg+=`<rect x="${cx+1}" y="${y(r.c.despesas)}" width="${bw}" height="${Math.max(0,H-B-y(r.c.despesas))}" rx="3" fill="var(--c2)"><title>${ABR[r.x.m-1]}: despesas ${brl(r.c.despesas)}</title></rect>`;
    svg+=`<text x="${cx}" y="${H-10}" text-anchor="middle" font-size="11" fill="${r.x.key===todayKey?"var(--fg)":"var(--muted)"}" font-weight="${r.x.key===todayKey?700:400}">${ABR[r.x.m-1]}${r.x.m===1||i===0?" "+String(r.x.y).slice(2):""}</text>`;});
  svg+="</svg>";
  const cats=state.config.categorias;
  const catTot=cats.map((ct,i)=>({ct,i,v:rows.reduce((a,r)=>a+(r.c.porCat[ct.id]||0),0)})).filter(z=>z.v>0).sort((a,b)=>b.v-a.v);
  return `<div class="tiles">
    <div class="tile"><span class="lab">Receitas no período</span><span class="val">${brl(T.rec)}</span><span class="sub">${periodo}</span></div>
    <div class="tile"><span class="lab">Despesas no período</span><span class="val">${brl(T.des)}</span><span class="sub">${T.rec>0?Math.round(T.des/T.rec*100)+"% das receitas":"—"}</span></div>
    <div class="tile hero"><span class="lab">Saldo acumulado</span><span class="val ${rows[rows.length-1].ac<0?"neg":"pos"}">${brl(rows[rows.length-1].ac)}</span><span class="sub">em conta, com saldo inicial de ${brl(state.config.saldoInicial)}</span></div>
    <div class="tile"><span class="lab">Caixinha</span><span class="val">${brl(caixinhaAte(ult.key))}</span><span class="sub">saldo guardado no fim do período</span></div>
    <div class="tile"><span class="lab">Média de gasto/mês</span><span class="val">${brl((()=>{const u=rows.filter(r=>r.c.despesas>0);return u.length?T.des/u.length:0})())}</span><span class="sub">meses com lançamentos</span></div>
  </div>
  <div class="card chart"><h2>Receitas x despesas</h2><div class="legend"><span><i style="background:var(--accent)"></i>Receitas</span><span><i style="background:var(--c2)"></i>Despesas</span></div>${svg}</div>
  <div class="grid"><div class="card"><h2>Mês a mês <span class="num">toque para abrir</span></h2><div class="tablewrap"><table>
    <thead><tr><th>Mês</th><th>Receitas</th><th>Despesas</th><th>Caixinha (mov.)</th><th>Saldo</th><th>Acumulado</th><th>Caixinha</th></tr></thead>
    <tbody>${rows.map(r=>`<tr class="click ${r.x.key===todayKey?"cur":""}" data-open="${r.x.key}"><td>${NOMES[r.x.m-1]} ${r.x.y}</td><td>${brl(r.c.receitas)}</td><td>${brl(r.c.despesas)}</td><td>${brl(r.c.guardado-r.c.retirado)}</td><td class="${r.c.saldo<0?"neg":""}">${brl(r.c.saldo)}</td><td class="${r.ac<0?"neg":""}">${brl(r.ac)}</td><td>${brl(caixinhaAte(r.x.key))}</td></tr>`).join("")}</tbody>
    <tfoot><tr><td>Total</td><td>${brl(T.rec)}</td><td>${brl(T.des)}</td><td>${brl(rows.reduce((a,r)=>a+r.c.guardado-r.c.retirado,0))}</td><td>${brl(rows.reduce((a,r)=>a+r.c.saldo,0))}</td><td>${brl(rows[rows.length-1].ac)}</td><td>${brl(caixinhaAte(ult.key))}</td></tr></tfoot>
  </table></div></div>
  <div class="card"><h2>Para onde foi o dinheiro</h2>${catTot.length?`<div class="bars">${catTot.map(z=>`<div class="bar" style="--dot:var(--c${z.i%9})"><div class="t"><b>${esc(z.ct.nome)}</b><span class="num">${brl(z.v)} · ${Math.round(z.v/T.des*100)}%</span></div><div class="track"><div style="width:${(z.v/catTot[0].v*100).toFixed(1)}%"></div></div></div>`).join("")}</div>`:`<div class="empty-state">Assim que você lançar despesas, o total por categoria aparece aqui.</div>`}</div></div>`;
}
function viewAjustes(){
  const cf=state.config;
  return `<div class="grid"><div class="card"><h2>Renda</h2>
    <label class="f money">Salário / renda fixa padrão (todo mês)<input class="in num" id="cfSal" inputmode="decimal" value="${esc(moneyInput(cf.salarioPadrao))}" placeholder="0,00"></label>
    <p class="hint">Entra automaticamente em todos os meses. Se um mês for diferente, ajuste na aba Mês.</p>
    <label class="f money">Saldo inicial (o que você já tem guardado)<input class="in num" id="cfSaldo" inputmode="decimal" value="${esc(moneyInput(cf.saldoInicial))}" placeholder="0,00"></label>
    <p class="hint">Usado para calcular o saldo acumulado a partir de setembro de 2026.</p>
    <label class="f money">Saldo inicial da caixinha<input class="in num" id="cfCx" inputmode="decimal" value="${esc(moneyInput(cf.saldoCaixinha))}" placeholder="0,00"></label>
    <h2 style="margin-top:6px">Período</h2>
    <div class="row"><label class="f">Controlar de setembro de 2026 até<select class="in" id="cfAte">${(()=>{let o="",y=2026,m=10;for(;;){const k=y+"-"+String(m).padStart(2,"0");if(k>LIMITE_ATE)break;o+=`<option value="${k}" ${k===cf.ate?"selected":""}>${NOMES[m-1]} ${y}</option>`;m++;if(m>12){m=1;y++;}}return o})()}</select></label>
    <button class="btn ghost" type="button" data-add12="1">+ 12 meses</button></div>
    <p class="hint">Diminuir o período só esconde os meses; nada que você lançou é apagado.</p></div>
    <div class="card"><h2>Campos de gastos <span class="num">limite mensal</span></h2>
    <p class="hint">Renomeie, acrescente ou retire os campos de gasto. As mudanças valem para todos os meses.</p>
    ${cf.categorias.map((ct,i)=>`<div class="catrow" style="--dot:var(--c${i%9})"><span class="dot"></span><input class="in" id="cn-${esc(ct.id)}" data-catname="${esc(ct.id)}" value="${esc(ct.nome)}" aria-label="Nome da categoria" maxlength="40"><span class="money"><input class="in num" id="co-${esc(ct.id)}" data-catorc="${esc(ct.id)}" inputmode="decimal" value="${esc(moneyInput(ct.orcamento||""))}" placeholder="sem limite" aria-label="Limite mensal"></span><button class="x" data-delcat="${esc(ct.id)}" aria-label="Remover categoria" ${cf.categorias.length<=1?"disabled":""}>×</button></div>`).join("")}
    <button class="btn ghost" data-addcat="1" type="button">+ Novo campo de gasto</button>
    <p class="hint">Deixe o limite em branco se não quiser controlar aquela categoria. Retirar um campo não apaga os valores já lançados nele (eles aparecem como "Sem categoria").</p></div>
    <div class="card"><h2>Backup</h2><p class="hint">Baixe uma cópia de todos os seus lançamentos ou restaure uma cópia salva.</p>
    <div class="row"><button class="btn ghost" type="button" data-export="1">Baixar backup</button><label class="btn ghost" for="impFile" style="text-align:center">Restaurar backup<input type="file" id="impFile" accept="application/json,.json" hidden></label></div>
    ${ui.importMsg?`<p class="hint">${esc(ui.importMsg)}</p>`:""}</div></div>`;
}

/* ---------- eventos ---------- */
const app=document.getElementById("app");
function goMonth(k){ ui.month=k; ui.gDia=null; try{localStorage.setItem("meucaixa.ui.month",k)}catch(e){} render(); }
app.addEventListener("click",e=>{
  const b=e.target.closest("button,tr[data-open]"); if(!b) return;
  if(b.dataset.tab){ ui.tab=b.dataset.tab; render(); return; }
  if(b.dataset.month){ goMonth(b.dataset.month); return; }
  if(b.dataset.nav){ const i=MESES.findIndex(x=>x.key===ui.month)+Number(b.dataset.nav); if(MESES[i]) goMonth(MESES[i].key); return; }
  if(b.dataset.open){ ui.tab="mes"; goMonth(b.dataset.open); return; }
  if(b.dataset.delg){ const m=getMonth(ui.month); m.gastos=m.gastos.filter(g=>g.id!==b.dataset.delg); save(ui.month); render(); return; }
  if(b.dataset.dela){ const m=getMonth(ui.month); m.avulsos=m.avulsos.filter(g=>g.id!==b.dataset.dela); save(ui.month); render(); return; }
  if(b.dataset.login){ entrar(); return; }
  if(b.dataset.logout){ fb.signOut(fb.auth); return; }
  if(b.dataset.export){ exportar(); return; }
  if(b.dataset.addmonth){ addMeses(1); goMonth(MESES[MESES.length-1].key); return; }
  if(b.dataset.add12){ addMeses(12); render(); return; }
  if(b.dataset.delcx){ const m=getMonth(ui.month); m.caixinha=m.caixinha.filter(g=>g.id!==b.dataset.delcx); save(ui.month); render(); return; }
  if(b.dataset.delcat){ state.config.categorias=state.config.categorias.filter(c=>c.id!==b.dataset.delcat); save("config"); render(); return; }
  if(b.dataset.addcat){ const id="c"+uidGen(); state.config.categorias.push({id,nome:"Novo gasto",orcamento:0}); save("config"); ui.flash="cn-"+id; render(); return; }
});
app.addEventListener("change",e=>{
  const t=e.target;
  if(t.name==="gcat"){ ui.gCat=t.value; return; }
  if(t.id==="gDia"){ ui.gDia=Number(t.value); return; }
  if(t.id==="impFile"&&t.files&&t.files[0]){ importar(t.files[0]); return; }
  if(t.name==="cxtipo"){ ui.cxTipo=t.value; return; }
  if(t.id==="cfAte"){ state.config.ate=t.value; buildMeses(); if(!MESES.some(x=>x.key===ui.month)) ui.month=MESES[MESES.length-1].key; save("config"); render(); return; }
  if(t.id==="salMes"){ const v=t.value.trim()===""?null:parseMoney(t.value); if(v!==null&&isNaN(v)){t.setCustomValidity("Valor inválido");t.reportValidity();return;} t.setCustomValidity(""); getMonth(ui.month).salario=v; save(ui.month); render(); return; }
  if(t.id==="cfCx"){ const v=t.value.trim()===""?0:parseMoney(t.value); if(!isNaN(v)){ state.config.saldoCaixinha=v; save("config"); render(); } return; }
  if(t.id==="cfSal"||t.id==="cfSaldo"){ const v=t.value.trim()===""?0:parseMoney(t.value); if(isNaN(v)){t.setCustomValidity("Valor inválido");t.reportValidity();return;} t.setCustomValidity(""); state.config[t.id==="cfSal"?"salarioPadrao":"saldoInicial"]=v; save("config"); render(); return; }
  if(t.dataset.catname){ const c=state.config.categorias.find(c=>c.id===t.dataset.catname); if(c){ c.nome=t.value.trim()||"Sem nome"; save("config"); render(); } return; }
  if(t.dataset.catorc){ const c=state.config.categorias.find(c=>c.id===t.dataset.catorc); const v=t.value.trim()===""?0:parseMoney(t.value); if(c&&!isNaN(v)){ c.orcamento=Math.max(0,v); save("config"); render(); } return; }
});
app.addEventListener("submit",e=>{
  e.preventDefault();
  const f=e.target;
  if(f.id==="fGasto"){
    const vi=document.getElementById("gValor"), v=parseMoney(vi.value);
    if(!(v>0)){ vi.setCustomValidity("Digite um valor maior que zero, ex.: 25,90"); vi.reportValidity(); vi.setCustomValidity(""); return; }
    const cat=(f.querySelector('input[name="gcat"]:checked')||{}).value||ui.gCat;
    ui.gCat=cat; ui.gDia=Number(document.getElementById("gDia").value);
    getMonth(ui.month).gastos.push({id:uidGen(),dia:ui.gDia,cat,valor:v,desc:document.getElementById("gDesc").value.trim()});
    save(ui.month); ui.flash="gValor"; render();
  }
  if(f.id==="fCx"){
    const vi=document.getElementById("cxValor"), v=parseMoney(vi.value), dim=calc(ui.month).dim;
    let dia=Math.round(Number(document.getElementById("cxDia").value)||1); dia=Math.min(dim,Math.max(1,dia));
    if(!(v>0)){ vi.setCustomValidity("Digite um valor maior que zero"); vi.reportValidity(); vi.setCustomValidity(""); return; }
    const tipo=(f.querySelector('input[name="cxtipo"]:checked')||{}).value||"guardar"; ui.cxTipo=tipo;
    getMonth(ui.month).caixinha.push({id:uidGen(),dia,tipo,valor:v,desc:document.getElementById("cxDesc").value.trim()});
    save(ui.month); ui.flash="cxValor"; render();
  }
  if(f.id==="fAvulso"){
    const vi=document.getElementById("aValor"), v=parseMoney(vi.value), dim=calc(ui.month).dim;
    let dia=Math.round(Number(document.getElementById("aDia").value)||1); dia=Math.min(dim,Math.max(1,dia));
    if(!(v>0)){ vi.setCustomValidity("Digite um valor maior que zero"); vi.reportValidity(); vi.setCustomValidity(""); return; }
    getMonth(ui.month).avulsos.push({id:uidGen(),dia,desc:document.getElementById("aDesc").value.trim(),valor:v});
    save(ui.month); ui.flash="aDesc"; render();
  }
});

render();
init();
})();

if("serviceWorker" in navigator&&location.protocol==="https:"){ window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{})); }
