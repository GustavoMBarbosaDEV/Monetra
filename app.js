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
/* Versão do app — ao publicar, atualize aqui, no sw.js (CACHE) e no CHANGELOG.md */
const VERSAO="2.5.1";
const NOVIDADES=[
  "Correção: o app passa a ser reconhecido como instalável e com funcionamento offline pelo gerador de APK.",
  "Pronto para virar aplicativo Android (APK), com atalhos \"Nova despesa\" e \"Lembretes\" no ícone."
];

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
/* Aceita "1.200", "1.200,50", "1200", "25,9", "R$ 2.800,00". Ponto seguido de 3 dígitos = milhar. */
function parseMoney(s){
  s=String(s||"").replace(/R\$|\s/g,"");
  if(!s) return NaN;
  if(s.includes(",")) s=s.replace(/\./g,"").replace(",",".");
  else if(/^\d{1,3}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,"");
  const n=Number(s); return isFinite(n)?Math.round(n*100)/100:NaN;
}
/* Valor para mostrar num campo: vazio quando é zero (para não juntar com o que a pessoa digitar) */
const moneyInput=v=>(v===null||v===undefined||v===""||!Number(v))?"":Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
/* Campos de dinheiro: seleciona tudo ao tocar, aceita só números/ponto/vírgula e formata ao sair */
const ehCampoDinheiro=el=>el&&el.tagName==="INPUT"&&el.closest(".money");
document.addEventListener("focusin",e=>{ const el=e.target; if(ehCampoDinheiro(el)&&el.value) setTimeout(()=>{ try{ el.select(); }catch(_){} },0); });
/* Máscara estilo banco: os números entram da direita para a esquerda, já com ponto do milhar e vírgula dos centavos */
function mascaraDinheiro(el){
  const dig=el.value.replace(/\D/g,"").replace(/^0+/,"").slice(0,13);
  el.value=dig?(Number(dig)/100).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}):"";
  try{ const n=el.value.length; el.setSelectionRange(n,n); }catch(_){}
}
document.addEventListener("input",e=>{ const el=e.target; if(ehCampoDinheiro(el)) mascaraDinheiro(el); },true);
/* Colar "1.200" ou "1200,50" mantém o valor certo */
document.addEventListener("paste",e=>{ const el=e.target; if(!ehCampoDinheiro(el)) return; const t=(e.clipboardData||window.clipboardData)?.getData("text")||""; const v=parseMoney(t); if(v>0){ e.preventDefault(); el.value=moneyInput(v); el.dispatchEvent(new Event("input",{bubbles:true})); } },true);
document.addEventListener("blur",e=>{ const el=e.target; if(!ehCampoDinheiro(el)||!el.value.trim()) return; const v=parseMoney(el.value); if(v>0) el.value=moneyInput(v); },true);
const ICON={
  lixo:'<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  busca:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 15.5L20 20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  mes:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  ano:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 20V11M10 20V5M15 20v-7M20 20V8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  ajustes:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="7" r="2.3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="10" cy="17" r="2.3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  perfil:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="8.5" r="3.8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4.5 20c1.3-3.6 4.2-5.5 7.5-5.5s6.2 1.9 7.5 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  mais:'<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  check:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  repete:'<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

/* ---------- estado ---------- */
function defaultConfig(){ return {salarioPadrao:0,saldoInicial:0,saldoCaixinha:0,ate:PADRAO_ATE,inicio:null,parcelas:[],rendas:[],cartao:{fecha:null,vence:null},categorias:DEFAULT_CATS.map((n,i)=>({id:"c"+(i+1),nome:n,orcamento:0})),fixos:[]}; }
const state={config:defaultConfig(), months:{}, loaded:false};
let MESES=[];
const today=new Date();
const todayKey=keyOf(today.getFullYear(),today.getMonth()+1);
/* Meses existentes: de setembro/2026 até 2 meses depois do mês atual (avança sozinho com o calendário) */
function buildMeses(){ MESES=[]; const fim=shiftKey(todayKey,2); let k=INICIO; while(k<=fim){ MESES.push(k); k=shiftKey(k,1); } }
/* Meses que aparecem na barra: do início do controle (ou do mês atual) até 2 meses à frente */
function mesesVisiveis(){
  const comDados=Object.keys(state.months).filter(k=>{ const m=state.months[k]; return m&&((m.gastos&&m.gastos.length)||(m.avulsos&&m.avulsos.length)||(m.caixinha&&m.caixinha.length)||typeof m.salario==="number"); });
  const de=[inicioKey(),todayKey,...comDados].filter(Boolean).sort()[0];
  return MESES.filter(k=>k>=de);
}

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
    fixos:(d&&typeof d.fixos==="object"&&!Array.isArray(d.fixos))?d.fixos:{},
    rendas:(d&&typeof d.rendas==="object"&&!Array.isArray(d.rendas))?d.rendas:{},
    parcelas:(d&&typeof d.parcelas==="object"&&!Array.isArray(d.parcelas))?d.parcelas:{},
    faturaPaga:!!(d&&d.faturaPaga)};
}
function normConfig(d){
  const ate=(typeof d?.ate==="string"&&/^\d{4}-\d{2}$/.test(d.ate)&&d.ate>=INICIO&&d.ate<=LIMITE_ATE)?d.ate:PADRAO_ATE;
  const cats=Array.isArray(d?.categorias)&&d.categorias.length?d.categorias.map(c=>({id:String(c.id),nome:String(c.nome||""),orcamento:Number(c.orcamento)||0,cor:(typeof c.cor==="number"&&c.cor>=0&&c.cor<12)?c.cor:null})):defaultConfig().categorias;
  const fixos=Array.isArray(d?.fixos)?d.fixos.map(f=>({id:String(f.id),nome:String(f.nome||"Conta fixa"),cat:String(f.cat||""),valor:Number(f.valor)||0,dia:Math.min(31,Math.max(1,Number(f.dia)||1)),forma:String(f.forma||"boleto"),desde:/^\d{4}-\d{2}$/.test(f.desde||"")?f.desde:INICIO,ate:/^\d{4}-\d{2}$/.test(f.ate||"")?f.ate:null})):[];
  const inicio=(typeof d?.inicio==="string"&&/^\d{4}-\d{2}$/.test(d.inicio))?d.inicio:null;
  const mk=x=>/^\d{4}-\d{2}$/.test(x||"");
  const parcelas=Array.isArray(d?.parcelas)?d.parcelas.filter(p=>p&&p.id).map(p=>({id:String(p.id),desc:String(p.desc||""),cat:String(p.cat||""),forma:String(p.forma||"credito"),total:Number(p.total)||0,n:Math.min(48,Math.max(2,Math.round(Number(p.n)||2))),compra:mk(p.compra)?p.compra:INICIO,dia:Math.min(31,Math.max(1,Number(p.dia)||1)),venc:(Number(p.venc)>=1&&Number(p.venc)<=31)?Math.round(Number(p.venc)):null})):[];
  const rendas=Array.isArray(d?.rendas)?d.rendas.filter(r=>r&&r.id).map(r=>({id:String(r.id),nome:String(r.nome||"Renda fixa"),valor:Number(r.valor)||0,desde:mk(r.desde)?r.desde:INICIO,ate:mk(r.ate)?r.ate:null})):[];
  const dd=n=>{ n=Math.round(Number(n)); return n>=1&&n<=31?n:null; };
  const cartao={fecha:dd(d?.cartao?.fecha),vence:dd(d?.cartao?.vence)};
  return {salarioPadrao:Number(d?.salarioPadrao)||0, saldoInicial:Number(d?.saldoInicial)||0, saldoCaixinha:Number(d?.saldoCaixinha)||0, ate, inicio, categorias:cats, fixos, parcelas, rendas, cartao};
}
function getMonth(k){ if(!state.months[k]) state.months[k]=normMonth({}); else state.months[k]=Object.assign(normMonth({}),state.months[k]); return state.months[k]; }
const catIndex=id=>state.config.categorias.findIndex(c=>c.id===id);
const NCORES=12;
const corIdx=ct=>{ const i=state.config.categorias.indexOf(ct); return (typeof ct.cor==="number"&&ct.cor>=0&&ct.cor<NCORES)?ct.cor:(i%NCORES); };
const catColor=id=>{ const ct=state.config.categorias.find(c=>c.id===id); return ct?"var(--c"+corIdx(ct)+")":"var(--c8)"; };
const catName=id=>{ const c=state.config.categorias.find(c=>c.id===id); return c?c.nome:"Sem categoria"; };

/* ---------- cálculos ---------- */
/* Mês em que o controle começa: o escolhido no Perfil, ou o primeiro mês em que a pessoa registrou renda.
   Antes dele, salário padrão, rendas fixas e contas fixas não entram (só o que foi lançado à mão). */
function inicioKey(){
  if(state.config.inicio) return state.config.inicio;
  const ks=Object.keys(state.months).filter(k=>{ const m=state.months[k]; return m&&((typeof m.salario==="number"&&m.salario>0)||(m.avulsos&&m.avulsos.length)); }).sort();
  return ks[0]||null;
}
const ativo=k=>{ const i=inicioKey(); return !!i&&k>=i; };
const entre=(a,b)=>(kY(b)-kY(a))*12+(kM(b)-kM(a));
const cartaoAtivo=()=>!!(state.config.cartao&&state.config.cartao.fecha&&state.config.cartao.vence);
/* Em que mês uma compra no crédito é paga (mês de vencimento da fatura) */
function faturaMes(compraK,dia){
  if(!cartaoAtivo()) return compraK;
  const {fecha,vence}=state.config.cartao;
  const fechaK=dia<fecha?compraK:shiftKey(compraK,1);
  return vence>fecha?fechaK:shiftKey(fechaK,1);
}
const noCartao=g=>g.forma==="credito"&&cartaoAtivo();
function fixosDoMes(k){
  if(!ativo(k)) return [];
  const m=state.months[k], ov=(m&&m.fixos)||{}, dim=diasMes(k);
  return state.config.fixos.filter(f=>f.desde<=k&&(!f.ate||k<=f.ate)).map(f=>{
    const o=ov[f.id]||{};
    return {id:f.id, fixo:true, desc:f.nome, cat:f.cat, forma:f.forma, dia:Math.min(f.dia,dim), valor:(typeof o.valor==="number")?o.valor:f.valor, padrao:f.valor, pago:!!o.pago, pular:!!o.pular};
  }).sort((a,b)=>a.dia-b.dia);
}
function rendasDoMes(k){
  if(!ativo(k)) return [];
  const m=state.months[k], ov=(m&&m.rendas)||{};
  return state.config.rendas.filter(r=>r.desde<=k&&(!r.ate||k<=r.ate)).map(r=>{ const o=ov[r.id]||{}; return {id:r.id,nome:r.nome,valor:(typeof o.valor==="number")?o.valor:r.valor,padrao:r.valor,pular:!!o.pular}; });
}
/* Parcelas que caem no mês k (no cartão, a 1ª parcela vai na fatura da compra) */
function parcelasDoMes(k){
  const dim=diasMes(k), out=[];
  state.config.parcelas.forEach(p=>{
    const cartao=p.forma==="credito"&&cartaoAtivo();
    const primeiro=cartao?faturaMes(p.compra,p.dia):p.compra, i=entre(primeiro,k);
    if(i<0||i>=p.n) return;
    const base=Math.floor(p.total/p.n*100)/100, valor=i===p.n-1?Math.round((p.total-base*(p.n-1))*100)/100:base;
    const o=((state.months[k]||{}).parcelas||{})[p.id]||{};
    const dia=cartao?Math.min(state.config.cartao.vence,dim):Math.min(p.venc||p.dia,dim);
    out.push({id:p.id,parcela:true,idx:i+1,n:p.n,desc:p.desc,cat:p.cat,forma:p.forma,dia,valor,total:p.total,cartao,pago:!!o.pago,pagoEm:o.pagoEm||null});
  });
  return out;
}
/* Compras no cartão de crédito que caem no mês k: à vista (no mês da fatura, ou da compra sem cartão configurado) e parcelas até a última */
function cartaoDoMes(k){
  const avista=[];
  if(cartaoAtivo()) faturaDoMes(k).filter(x=>!x.parcela).forEach(x=>avista.push(x));
  else ((state.months[k]||{}).gastos||[]).filter(g=>g.forma==="credito").forEach(g=>avista.push(Object.assign({},g,{compraK:k})));
  const parc=parcelasDoMes(k).filter(p=>p.forma==="credito");
  return avista.concat(parc).sort((a,b)=>a.dia-b.dia);
}
/* Compras no crédito (lançadas em qualquer mês) cuja fatura vence em k */
function faturaDoMes(k){
  if(!cartaoAtivo()) return [];
  const out=[];
  for(let j=0;j<=2;j++){ const ck=shiftKey(k,-j), m=state.months[ck]; if(!m) continue;
    m.gastos.forEach(g=>{ if(g.forma==="credito"&&faturaMes(ck,g.dia)===k) out.push(Object.assign({},g,{compraK:ck})); }); }
  parcelasDoMes(k).filter(p=>p.cartao).forEach(p=>out.push(Object.assign({},p,{compraK:p.compra})));
  return out;
}
/* Tudo que conta como despesa no mês k */
function despesasDoMes(k){
  const m=state.months[k], manuais=(m?m.gastos:[]).filter(g=>!noCartao(g));
  return manuais.concat(parcelasDoMes(k).filter(p=>!p.cartao), faturaDoMes(k), fixosDoMes(k).filter(f=>!f.pular));
}
const soma=(arr,f)=>arr.reduce((a,x)=>a+(Number(f?f(x):x.valor)||0),0);
function calc(k){
  const m=normMonth(state.months[k]||{});
  const salario=m.salario??(ativo(k)?state.config.salarioPadrao:0);
  const avulsos=soma(m.avulsos), rendas=soma(rendasDoMes(k).filter(r=>!r.pular));
  const lista=despesasDoMes(k), despesas=soma(lista);
  const fixos=fixosDoMes(k).filter(f=>!f.pular);
  const fixosTotal=soma(fixos), fixosPend=soma(fixos.filter(f=>!f.pago));
  const fatura=soma(faturaDoMes(k));
  const guardado=soma(m.caixinha.filter(x=>x.tipo==="guardar")), retirado=soma(m.caixinha.filter(x=>x.tipo==="retirar"));
  const receitas=salario+avulsos+rendas, saldo=receitas-despesas-guardado+retirado;
  const dim=diasMes(k);
  let porDia=null, porDiaSub="";
  if(k===todayKey){ const rest=dim-today.getDate()+1; porDia=Math.max(0,saldo)/rest; porDiaSub=rest+(rest===1?" dia restante":" dias restantes, contando hoje"); }
  else if(k>todayKey){ porDia=Math.max(0,saldo)/dim; porDiaSub="dividido pelos "+dim+" dias do mês"; }
  const porCat={}, porForma={};
  lista.forEach(g=>{ porCat[g.cat]=(porCat[g.cat]||0)+(Number(g.valor)||0); const f=g.forma||"?"; porForma[f]=(porForma[f]||0)+(Number(g.valor)||0); });
  return {salario,avulsos,rendas,despesas,receitas,saldo,guardado,retirado,porDia,porDiaSub,porCat,porForma,dim,fixosTotal,fixosPend,fatura,pct:receitas>0?despesas/receitas:0};
}
function caixinhaAte(k){ let s=state.config.saldoCaixinha; for(const x of MESES){ const c=calc(x); s+=c.guardado-c.retirado; if(x===k) break; } return s; }
function acumulado(k){ let s=state.config.saldoInicial; for(const x of MESES){ s+=calc(x).saldo; if(x===k) break; } return s; }
function variacao(atual,anterior){ if(!(anterior>0)) return ""; const p=(atual-anterior)/anterior; if(Math.abs(p)<0.005) return "igual ao mês anterior"; return (p>0?"▲ ":"▼ ")+Math.round(Math.abs(p)*100)+"% vs "+abrMes(shiftKey(ui.month,-1)); }

/* ---------- persistência ---------- */
const dirty=new Set(), timers={}, writing={}, again={}, apagados={}, docIds=new Set();
function setStatus(t,c){ statusTxt=t; statusCls=c; const el=document.getElementById("status"); if(el){el.className="status "+c; el.innerHTML="<i></i>"+esc(t);} }
const docIdFor=k=>k==="config"?"config":"m-"+k;
const bodyFor=id=>clone(id==="config"?state.config:getMonth(id.slice(2)));
/* lembra o que foi apagado aqui, para a mesclagem não "ressuscitar" o item */
function marcaApagado(chave,id){ const d=docIdFor(chave); (apagados[d]=apagados[d]||new Set()).add(id); }
function desmarcaApagado(chave,id){ const d=docIdFor(chave); if(apagados[d]) apagados[d].delete(id); }
function save(k){
  const id=docIdFor(k);
  if(mode==="local"){ try{ localStorage.setItem(LSKEY,JSON.stringify({config:state.config,months:state.months})); setStatus("Salvo neste aparelho","ok"); }catch(e){ setStatus("Não foi possível salvar","err"); } return; }
  if(mode!=="cloud") return;
  dirty.add(id); setStatus(navigator.onLine?"Salvando…":"Sem internet — salvo no aparelho",navigator.onLine?"saving":"ok");
  clearTimeout(timers[id]); timers[id]=setTimeout(()=>flush(id),400);
}
/* Junta o que está no servidor com o que está aqui: itens novos de outro aparelho não se perdem */
const LISTAS_MES=["gastos","avulsos","caixinha"], LISTAS_CFG=["categorias","fixos","parcelas","rendas"];
function mescla(local,servidor,id){
  const del=apagados[id]||new Set(), listas=id==="config"?LISTAS_CFG:LISTAS_MES, extra={};
  listas.forEach(l=>{ const ids=new Set((local[l]||[]).map(x=>x.id)); const add=(servidor[l]||[]).filter(x=>x&&x.id&&!ids.has(x.id)&&!del.has(x.id)); if(add.length){ local[l]=(local[l]||[]).concat(add); extra[l]=add; } });
  if(id!=="config") ["fixos","rendas","parcelas"].forEach(mp=>{ const s=servidor[mp]||{}; for(const key in s) if(!(local[mp]||{})[key]){ local[mp]=local[mp]||{}; local[mp][key]=s[key]; (extra[mp]=extra[mp]||{})[key]=s[key]; } });
  return extra;
}
async function flush(id){
  if(writing[id]){ again[id]=true; return; }
  writing[id]=true; let ok=false;
  const ref=fb.doc(fb.db,"users",uid,"docs",id);
  try{
    if(navigator.onLine){
      let extra={};
      await fb.runTransaction(fb.db,async tx=>{
        const snap=await tx.get(ref), body=bodyFor(id);
        extra=snap.exists()?mescla(body,id==="config"?normConfig(snap.data()):normMonth(snap.data()),id):{};
        tx.set(ref,body);
      });
      /* traz para a tela o que veio do outro aparelho */
      const alvo=id==="config"?state.config:getMonth(id.slice(2)); let veio=false;
      for(const l in extra){ if(Array.isArray(extra[l])){ const ids=new Set((alvo[l]||[]).map(x=>x.id)); extra[l].forEach(x=>{ if(!ids.has(x.id)){ alvo[l].push(x); veio=true; } }); } else { alvo[l]=Object.assign({},extra[l],alvo[l]); veio=true; } }
      if(veio) render();
      ok=true;
    } else {
      fb.setDoc(ref,bodyFor(id)).then(()=>{ dirty.delete(id); if(!dirty.size) setStatus("Tudo salvo","ok"); }).catch(()=>{});
      setStatus("Sem internet — salvo no aparelho","ok"); writing[id]=false; return;
    }
  }catch(e){
    console.error(e);
    try{ await fb.setDoc(ref,bodyFor(id)); ok=true; }catch(e2){ console.error(e2); }
  }
  writing[id]=false;
  if(again[id]){ again[id]=false; return flush(id); }
  if(ok){ dirty.delete(id); delete apagados[id]; docIds.add(id); if(!dirty.size) setStatus("Tudo salvo","ok"); }
  else setStatus("Erro ao salvar — confira a internet","err");
}
window.addEventListener("offline",()=>{ if(mode==="cloud") setStatus("Sem internet — o que você lançar fica salvo no aparelho","ok"); });
window.addEventListener("online",()=>{ if(mode==="cloud"){ setStatus(dirty.size?"Sincronizando…":"Sincronizado",dirty.size?"saving":"ok"); [...dirty].forEach(id=>flush(id)); } });
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
        docIds.clear(); snap.docs.forEach(doc=>docIds.add(doc.id));
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

/* Exclui uma conta fixa a partir de um mês (os meses anteriores continuam com ela). Sem mês: apaga de todos. */
function excluirFixo(id,apartir){
  const f=state.config.fixos.find(x=>x.id===id); if(!f) return;
  if(!apartir||f.desde>=apartir){ apagarItem("config","fixos",id,"Conta fixa “"+f.nome+"” apagada."); return; }
  const antes=f.ate; f.ate=shiftKey(apartir,-1); save("config"); render();
  toast("“"+f.nome+"” excluída a partir de "+abrMes(apartir)+".","Desfazer",()=>{ const g=state.config.fixos.find(x=>x.id===id); if(g){ g.ate=antes; save("config"); render(); toast("Desfeito."); } });
}
/* Marca conta fixa, parcela ou fatura como paga (guarda a data do pagamento) */
function marcaPago(tipo,id,k,pago,silencioso){
  const m=getMonth(k), hoje=new Date(), data=hoje.getFullYear()+"-"+pad2(hoje.getMonth()+1)+"-"+pad2(hoje.getDate());
  if(tipo==="fat"){ m.faturaPaga=pago; m.faturaPagaEm=pago?data:null;
    parcelasDoMes(k).filter(x=>x.cartao).forEach(x=>{ const o=Object.assign({},m.parcelas[x.id]||{}); o.pago=pago; if(pago) o.pagoEm=data; else delete o.pagoEm; m.parcelas[x.id]=o; });
    faturaDoMes(k).filter(x=>!x.parcela).forEach(x=>{ const g=getMonth(x.compraK).gastos.find(y=>y.id===x.id); if(g){ g.pago=pago; if(pago) g.pagoEm=data; else delete g.pagoEm; if(x.compraK!==k) save(x.compraK); } }); }
  else { const mapa=tipo==="fixo"?"fixos":"parcelas"; const o=Object.assign({},m[mapa][id]||{}); o.pago=pago; if(pago) o.pagoEm=data; else delete o.pagoEm; m[mapa][id]=o; }
  save(k); if(!silencioso){ render(); toast(pago?"Pagamento registrado.":"Marcado como não pago."); }
}
/* Paga / não paga numa despesa do cartão de crédito */
function marcaGastoPago(k,id,pago){
  const g=getMonth(k).gastos.find(x=>x.id===id); if(!g) return;
  const h=new Date(); g.pago=pago; if(pago) g.pagoEm=h.getFullYear()+"-"+pad2(h.getMonth()+1)+"-"+pad2(h.getDate()); else delete g.pagoEm;
  save(k); render(); toast(pago?"Despesa do cartão marcada como paga.":"Despesa do cartão marcada como não paga.");
}
/* Contas que vencem amanhã, hoje ou já venceram (mês anterior e atual) */
function pendencias(){
  if(mode==="login"||!state.loaded) return [];
  const agora=new Date(); agora.setHours(0,0,0,0);
  const kAtual=keyOf(agora.getFullYear(),agora.getMonth()+1), out=[];
  [shiftKey(kAtual,-1),kAtual,shiftKey(kAtual,1)].forEach(k=>{
    const venc=d=>new Date(kY(k),kM(k)-1,d);
    fixosDoMes(k).filter(f=>!f.pular&&!f.pago).forEach(f=>out.push({tipo:"fixo",id:f.id,k,nome:f.desc,valor:f.valor,data:venc(f.dia)}));
    parcelasDoMes(k).filter(p=>!p.cartao&&!p.pago).forEach(p=>out.push({tipo:"parc",id:p.id,k,nome:(p.desc||"Parcela")+" ("+p.idx+"/"+p.n+")",valor:p.valor,data:venc(p.dia)}));
    if(cartaoAtivo()){ const t=soma(faturaDoMes(k)), m=state.months[k]; if(t>0&&!(m&&m.faturaPaga)) out.push({tipo:"fat",id:"fatura",k,nome:"Fatura do cartão",valor:t,data:venc(Math.min(state.config.cartao.vence,diasMes(k)))}); }
  });
  return out.map(x=>Object.assign(x,{dd:Math.round((x.data-agora)/86400000)})).filter(x=>x.dd<=1).sort((a,b)=>a.dd-b.dd);
}
const fmtData=d=>pad2(d.getDate())+"/"+pad2(d.getMonth()+1);
const estadoPend=x=>x.dd===1?{cls:"amanha",txt:"vence amanhã"}:x.dd===0?{cls:"hoje",txt:"vence hoje"}:{cls:"atraso",txt:"atrasada desde "+fmtData(x.data)};
function cardLembretes(){
  const ps=pendencias(); if(!ps.length) return "";
  return `<div class="card lembretes"><div class="cardhead"><h2>Lembretes</h2><span class="num muted">${ps.length} conta${ps.length===1?"":"s"}</span></div>
    ${ps.map(x=>{ const e=estadoPend(x); return `<div class="item lemb ${e.cls}"><span class="pill">${esc(e.txt)}</span><span class="desc"><b>${esc(x.nome)}</b><small>vencimento ${fmtData(x.data)}</small></span><span class="v">${brl(x.valor)}</span><button type="button" class="btn mini" data-pagar="${x.tipo}|${esc(x.id)}|${x.k}">Paguei</button></div>`; }).join("")}
    ${notifOn?"":`<p class="hint">Quer receber esses avisos como notificação? Ative em <b>Perfil → Lembretes</b>.</p>`}</div>`;
}
/* Notificações do navegador (funcionam com o app aberto ou em segundo plano) */
let notifOn=false; try{ notifOn=localStorage.getItem("mb.notif")==="1"; }catch(e){}
let ultimaVerif=0;
async function mostraNotif(titulo,corpo,tag){
  try{ const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();
    const op={body:corpo,tag,icon:"icons/icon-192.png",badge:"icons/icon-192.png",renotify:false};
    if(reg) await reg.showNotification(titulo,op); else new Notification(titulo,op); }catch(e){ console.warn(e); }
}
function verificaLembretes(forcar){
  if(!notifOn||!("Notification" in window)||Notification.permission!=="granted") return;
  if(!forcar&&Date.now()-ultimaVerif<60000) return; ultimaVerif=Date.now();
  let vistos={}; try{ vistos=JSON.parse(localStorage.getItem("mb.notif.vistos")||"{}"); }catch(e){}
  const d=new Date(), hoje=d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate());
  pendencias().forEach(x=>{
    const e=x.dd===1?"amanha":x.dd===0?"hoje":"atraso", chave=[x.tipo,x.id,x.k,e,e==="atraso"?hoje:""].join(":");
    if(vistos[chave]) return; vistos[chave]=hoje;
    const titulo=e==="amanha"?"Vence amanhã: "+x.nome:e==="hoje"?"Vence hoje: "+x.nome:"Conta atrasada: "+x.nome;
    mostraNotif(titulo,brl(x.valor)+(e==="atraso"?" · venceu em "+fmtData(x.data):"")+" — toque para abrir o MB Controle.",chave);
  });
  for(const k in vistos) if(vistos[k]<shiftKey(hoje.slice(0,7),-2)) delete vistos[k];
  try{ localStorage.setItem("mb.notif.vistos",JSON.stringify(vistos)); }catch(e){}
}
async function ligaNotif(on){
  if(!on){ notifOn=false; try{localStorage.setItem("mb.notif","0")}catch(e){} render(); return; }
  if(!("Notification" in window)){ toast("Este navegador não permite notificações. Use os lembretes no calendário."); render(); return; }
  const p=Notification.permission==="granted"?"granted":await Notification.requestPermission();
  notifOn=p==="granted"; try{localStorage.setItem("mb.notif",notifOn?"1":"0")}catch(e){}
  render();
  if(notifOn){ toast("Notificações ativadas."); mostraNotif("MB Controle","Pronto! Você vai ser avisado um dia antes, no dia e se uma conta atrasar.","teste"); verificaLembretes(true); }
  else toast("O navegador bloqueou as notificações. Libere nas configurações do site.");
}
/* Lembretes no calendário (avisam mesmo com o app fechado) */
function exportarCalendario(){
  const esc2=t=>String(t||"").replace(/\\/g,"\\\\").replace(/[,;]/g,m=>"\\"+m).replace(/\n/g,"\\n");
  const ymd=d=>d.getFullYear()+pad2(d.getMonth()+1)+pad2(d.getDate());
  const stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+/,"");
  const L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//MB Controle//PT-BR","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:MB Controle - contas"];
  let n=0;
  const ev=(uid,data,titulo,desc)=>{ n++; L.push("BEGIN:VEVENT","UID:"+uid+"@mbcontrole","DTSTAMP:"+stamp,"DTSTART:"+ymd(data)+"T090000","DTEND:"+ymd(data)+"T091500","SUMMARY:"+esc2(titulo),"DESCRIPTION:"+esc2(desc),"BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+esc2(titulo),"TRIGGER:PT0M","END:VALARM","END:VEVENT"); };
  const tres=(base,data,nome,valor)=>{ const ant=new Date(data); ant.setDate(ant.getDate()-1); const dep=new Date(data); dep.setDate(dep.getDate()+1);
    ev(base+"-antes",ant,"Amanhã vence: "+nome+" ("+brl(valor)+")","Lembrete do MB Controle.");
    ev(base+"-dia",data,"Hoje vence: "+nome+" ("+brl(valor)+")","Depois de pagar, marque como paga no MB Controle.");
    ev(base+"-atraso",dep,"Atrasou? "+nome+" venceu ontem","Se ainda não pagou, a conta está atrasada. Se já pagou, ignore."); };
  for(let i=0;i<12;i++){ const k=shiftKey(todayKey,i), dim=diasMes(k);
    state.config.fixos.filter(f=>f.desde<=k&&(!f.ate||k<=f.ate)&&(!inicioKey()||k>=inicioKey())).forEach(f=>{ const o=((state.months[k]||{}).fixos||{})[f.id]||{}; if(o.pago||o.pular) return; tres("f"+f.id+k,new Date(kY(k),kM(k)-1,Math.min(f.dia,dim)),f.nome,typeof o.valor==="number"?o.valor:f.valor); });
    parcelasDoMes(k).filter(p=>!p.cartao&&!p.pago).forEach(p=>tres("p"+p.id+k,new Date(kY(k),kM(k)-1,p.dia),(p.desc||"Parcela")+" "+p.idx+"/"+p.n,p.valor));
    if(cartaoAtivo()){ const m=state.months[k]; if(!(m&&m.faturaPaga)) tres("fat"+k,new Date(kY(k),kM(k)-1,Math.min(state.config.cartao.vence,dim)),"Fatura do cartão",soma(faturaDoMes(k))); }
  }
  L.push("END:VCALENDAR");
  if(!n){ toast("Nenhuma conta com vencimento para colocar no calendário."); return; }
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([L.join("\r\n")],{type:"text/calendar;charset=utf-8"})); a.download="mb-controle-lembretes.ics"; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
  toast("Arquivo de lembretes baixado ("+(n/3)+" vencimentos). Abra para adicionar ao calendário.");
}

/* Desfazer item por item (não sobrescreve outras mudanças feitas no meio tempo) */
function apagarItem(chave,lista,id,msg){
  const alvo=chave==="config"?state.config:getMonth(chave), arr=alvo[lista], idx=arr.findIndex(x=>x.id===id);
  if(idx<0) return; const item=arr[idx];
  alvo[lista]=arr.filter(x=>x.id!==id); marcaApagado(chave,id); save(chave); render();
  toast(msg,"Desfazer",()=>{ const a=chave==="config"?state.config:getMonth(chave); if(!a[lista].some(x=>x.id===id)){ a[lista].splice(Math.min(idx,a[lista].length),0,item); } desmarcaApagado(chave,id); save(chave); render(); toast("Desfeito."); });
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
/* Planilha (abre no Excel e no Google Planilhas) */
function exportarPlanilha(){
  const num=v=>(Number(v)||0).toFixed(2).replace(".",","), cel=s=>'"'+String(s??"").replace(/"/g,'""')+'"';
  const linhas=[["Mês","Dia","Tipo","Categoria","Descrição","Forma de pagamento","Valor (R$)","Situação"]];
  MESES.forEach(k=>{
    const m=normMonth(state.months[k]||{}), c=calc(k), mes=nomeMes(k);
    if(c.salario>0) linhas.push([mes,"","Receita","","Salário / renda fixa","",num(c.salario),""]);
    rendasDoMes(k).filter(r=>!r.pular).forEach(r=>linhas.push([mes,"","Receita fixa","",r.nome,"",num(r.valor),""]));
    m.avulsos.forEach(x=>linhas.push([mes,x.dia,"Receita avulsa","",x.desc,"",num(x.valor),""]));
    m.gastos.forEach(g=>linhas.push([mes,g.dia,"Despesa",catName(g.cat),g.desc,formaNome(g.forma),"-"+num(g.valor),noCartao(g)?"fatura de "+abrMes(faturaMes(k,g.dia)):""]));
    parcelasDoMes(k).forEach(p=>linhas.push([mes,p.dia,"Parcela "+p.idx+"/"+p.n,catName(p.cat),p.desc,formaNome(p.forma),"-"+num(p.valor),p.cartao?"na fatura":""]));
    fixosDoMes(k).filter(f=>!f.pular).forEach(f=>linhas.push([mes,f.dia,"Conta fixa",catName(f.cat),f.desc,formaNome(f.forma),"-"+num(f.valor),f.pago?"paga":"a pagar"]));
    m.caixinha.forEach(x=>linhas.push([mes,x.dia,x.tipo==="guardar"?"Caixinha (guardou)":"Caixinha (retirou)","",x.desc,"",(x.tipo==="guardar"?"-":"")+num(x.valor),""]));
  });
  const csv="﻿"+linhas.map(l=>l.map(cel).join(";")).join("\r\n");
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})); a.download="mb-controle-planilha-"+new Date().toISOString().slice(0,10)+".csv"; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
  toast("Planilha baixada.");
}
/* Apaga tudo da pessoa e recomeça do zero */
async function apagarTudo(){
  if(mode==="cloud"){
    setStatus("Apagando…","saving");
    const ids=new Set([...docIds,"config",...Object.keys(state.months).map(k=>"m-"+k)]);
    dirty.clear(); Object.keys(timers).forEach(t=>clearTimeout(timers[t]));
    try{ await Promise.all([...ids].map(id=>fb.deleteDoc(fb.doc(fb.db,"users",uid,"docs",id)))); docIds.clear(); }
    catch(e){ console.error(e); setStatus("Não foi possível apagar — confira a internet","err"); return; }
  } else { try{ localStorage.removeItem(LSKEY); }catch(e){} }
  resetState(); ui.confirmaApagar=false; ui.tab="mes"; ui.month=todayKey; render(); setStatus("Tudo apagado","ok"); toast("Seus dados foram apagados. Comece informando o salário do mês.");
}


/* atalhos do ícone do app (manifest): ?acao=nova-despesa | ?acao=lembretes */
let atalhoPendente=new URLSearchParams(location.search).get("acao");
function trataAtalho(){
  if(!atalhoPendente||!state.loaded||mode==="login") return;
  const a=atalhoPendente; atalhoPendente=null;
  try{ history.replaceState(null,"",location.pathname); }catch(e){}
  ui.tab="mes"; ui.month=todayKey;
  if(a==="nova-despesa") setTimeout(()=>{ render(); openSheet("gasto"); },50); else setTimeout(render,50);
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
  if(state.loaded&&mode!=="login"){ setTimeout(()=>verificaLembretes(false),500); trataAtalho(); }
}
function header(){
  const t=(id,l)=>`<button role="tab" data-tab="${id}" aria-selected="${ui.tab===id}">${l}</button>`;
  const VIS=mesesVisiveis(), i=VIS.indexOf(ui.month), logado=mode!=="login";
  return `<div class="top"><div class="brand"><h1>MB <span>Controle</span></h1><span class="status ${statusCls}" id="status"><i></i>${esc(statusTxt)}</span></div>
  <div class="topright">${logado?`<div class="tabs" role="tablist">${t("mes","Mês")}${t("ano","Visão geral")}${t("ajustes","Ajustes")}</div>`:botaoTema()}
  ${logado&&state.loaded?`<button type="button" class="iconbtn" data-busca="1" aria-label="Buscar lançamentos" title="Buscar (tecla /)">${ICON.busca}</button>`:""}
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
  const np=pendencias().length;
  const b=(id,l)=>`<button type="button" data-tab="${id}" class="${ui.tab===id?"on":""}" aria-current="${ui.tab===id?"page":"false"}">${ICON[id]}${id==="mes"&&np?`<i class="badge">${np}</i>`:""}<span>${l}</span></button>`;
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
  ${/FBAN|FBAV|FB_IAB|Instagram|Line\/|LinkedInApp|TikTok|musical_ly|Snapchat|Twitter/i.test(navigator.userAgent)?`<div class="note">Você abriu o link dentro de outro app (Instagram, Facebook…), e o Google não permite entrar por aqui. Toque nos <b>três pontinhos</b> e escolha <b>Abrir no navegador</b> (Chrome ou Safari).<br><button class="link" type="button" data-copialink="1">Copiar link</button></div>`:""}
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
function linhaLanc(g,k){
  if(g.parcela) return `<div class="item fixrow parcrow" style="--dot:${catColor(g.cat)}">
    <button type="button" class="check ${g.pago?"on":""}" data-pagar="parc|${esc(g.id)}|${k}" aria-pressed="${g.pago}" aria-label="${g.pago?"Marcar parcela como não paga":"Marcar parcela como paga"}">${ICON.check}</button>
    <button type="button" class="fixinfo" data-edit="parcela" data-id="${esc(g.id)}"><b>${esc(g.desc||"Compra parcelada")}</b><small>parcela ${g.idx}/${g.n} · vence dia ${pad2(g.dia)}${g.pago?" · paga"+(g.pagoEm?" em "+g.pagoEm.slice(8,10)+"/"+g.pagoEm.slice(5,7):""):""}</small></button>
    <span class="v">${brl(g.valor)}</span></div>`;
  const nota=noCartao(g)?" · fatura de "+abrMes(faturaMes(k,g.dia)):"";
  if(g.forma==="credito") return `<div class="item fixrow parcrow" style="--dot:${catColor(g.cat)}">
    <button type="button" class="check ${g.pago?"on":""}" data-gpago="${esc(g.id)}" data-mes="${k}" aria-pressed="${!!g.pago}" aria-label="${g.pago?"Marcar como não paga":"Marcar como paga"}">${ICON.check}</button>
    <button type="button" class="fixinfo" data-edit="gasto" data-id="${esc(g.id)}" data-mes="${k}"><b class="${g.desc?"":"empty"}">${esc(g.desc||"sem descrição")}</b><small>${esc(catName(g.cat))} · Crédito${esc(nota)} · ${g.pago?"paga"+(g.pagoEm?" em "+g.pagoEm.slice(8,10)+"/"+g.pagoEm.slice(5,7):""):"não paga"}</small></button>
    <span class="v">${brl(g.valor)}</span></div>`;
  return `<button type="button" class="item" data-edit="gasto" data-id="${esc(g.id)}" style="--dot:${catColor(g.cat)}">
    <span class="pill">${esc(catName(g.cat))}</span>
    <span class="desc"><b class="${g.desc?"":"empty"}">${esc(g.desc||"sem descrição")}</b><small>${esc(formaNome(g.forma)+nota)}</small></span>
    <span class="v">${brl(g.valor)}</span></button>`;
}
function viewMes(){
  const k=ui.month, m=getMonth(k), c=calc(k), cats=state.config.categorias, isCur=k===todayKey;
  const prevK=shiftKey(k,-1), prev=MESES.includes(prevK)&&ativo(prevK)&&ativo(k)?calc(prevK):null;
  const acum=acumulado(k), cx=caixinhaAte(k), ini=inicioKey();
  const aviso=!ini?`<div class="note info">Seu controle ainda não começou. Informe o <b>salário deste mês</b> no card Receitas (ou lance uma receita) e os cálculos passam a contar a partir deste mês.</div>`
    :k<ini?`<div class="note info">Este mês é anterior ao início do seu controle (${esc(nomeMes(ini).toLowerCase())}). Aqui só conta o que você lançar à mão; salário padrão, rendas e contas fixas não entram.</div>`:"";
  const subRec=[ "salário "+brl(c.salario), c.rendas?"fixas "+brl(c.rendas):"", c.avulsos?"avulsos "+brl(c.avulsos):"" ].filter(Boolean).join(" · ");
  const varDesp=prev?variacao(c.despesas,prev.despesas):"";
  const tiles=`<div class="tiles">
    <div class="tile"><span class="lab">Receitas</span><span class="val">${brl(c.receitas)}</span><span class="sub">${esc(subRec)}</span></div>
    <div class="tile"><span class="lab">Despesas</span><span class="val">${brl(c.despesas)}</span><span class="sub">${varDesp?esc(varDesp):(c.receitas>0?Math.round(c.pct*100)+"% do que entrou":"nenhuma receita ainda")}</span></div>
    <div class="tile hero"><span class="lab">Saldo do mês</span><span class="val ${c.saldo<0?"neg":"pos"}">${brl(c.saldo)}</span><span class="sub">acumulado: <b class="${acum<0?"neg":""}">${brl(acum)}</b></span></div>
    <div class="tile"><span class="lab">Pode gastar por dia</span><span class="val">${c.porDia===null?"—":brl(c.porDia)}</span><span class="sub">${c.porDia===null?"mês já encerrado":esc(c.porDiaSub)}</span></div>
    <div class="tile"><span class="lab">Caixinha</span><span class="val">${brl(cx)}</span><span class="sub">neste mês: +${brl(c.guardado)} · −${brl(c.retirado)}</span></div>
  </div>`;
  /* lançamentos do mês (compras feitas neste mês + parcelas fora do cartão) */
  const todos=m.gastos.filter(g=>g.forma!=="credito").concat(parcelasDoMes(k).filter(p=>p.forma!=="credito"));
  const gastos=todos.filter(g=>!ui.filtro||g.cat===ui.filtro);
  const byDay={}; gastos.forEach(g=>{(byDay[g.dia]=byDay[g.dia]||[]).push(g)});
  const days=Object.keys(byDay).map(Number).sort((a,b)=>b-a);
  const lista=`<div class="card"><div class="cardhead"><h2>Despesas do mês</h2>
    <select class="in mini" id="filtroCat" aria-label="Filtrar por categoria"><option value="">Todas as categorias</option>${cats.map(ct=>`<option value="${esc(ct.id)}" ${ui.filtro===ct.id?"selected":""}>${esc(ct.nome)}</option>`).join("")}</select></div>
    <button type="button" class="btn wide desk" data-novo="gasto">${ICON.mais} Lançar despesa</button>
    ${days.length?days.map(d=>{ const its=byDay[d], tot=soma(its);
      const lab=new Date(kY(k),kM(k)-1,d).toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"}).replace(/\./g,"");
      return `<div class="day"><div class="dayhead"><span>${esc(lab)}${isCur&&d===today.getDate()?" · hoje":""}</span><span class="num">${brl(tot)}</span></div>${its.map(g=>linhaLanc(g,k)).join("")}</div>`; }).join("")
    :`<div class="empty-state">${ui.filtro?"Nenhuma despesa nessa categoria em "+NOMES[kM(k)-1].toLowerCase()+".":"Nenhuma despesa em "+NOMES[kM(k)-1].toLowerCase()+" ainda.<br>Toque em <b>+</b> para lançar a primeira."}</div>`}
    <p class="hint">Toque num lançamento para editar ou apagar. Compras no cartão de crédito ficam em Contas fixas.</p></div>`;
  /* fatura do cartão */
  let fatura="";
  if(cartaoAtivo()){
    const fat=faturaDoMes(k), prox=soma(faturaDoMes(shiftKey(k,1))), cc=state.config.cartao;
    fatura=`<div class="card"><div class="cardhead"><h2>Fatura do cartão</h2><span class="big">${brl(c.fatura)}</span></div>
      <p class="hint">Vence dia ${pad2(Math.min(cc.vence,diasMes(k)))} de ${esc(NOMES[kM(k)-1].toLowerCase())} · fecha dia ${pad2(cc.fecha)}</p>
      ${fat.length?`<div>${fat.sort((a,b)=>(a.compraK+pad2(a.dia)).localeCompare(b.compraK+pad2(b.dia))).map(g=>`<button type="button" class="item" ${g.parcela?`data-edit="parcela" data-id="${esc(g.id)}"`:`data-edit="gasto" data-id="${esc(g.id)}" data-mes="${g.compraK}"`} style="--dot:${catColor(g.cat)}"><span class="pill">${esc(catName(g.cat))}</span><span class="desc"><b class="${g.desc?"":"empty"}">${esc(g.desc||"sem descrição")}</b><small>${g.parcela?"parcela "+g.idx+"/"+g.n:"compra em "+pad2(g.dia)+"/"+pad2(kM(g.compraK))}</small></span><span class="v">${brl(g.valor)}</span></button>`).join("")}</div>
        <label class="switch"><input type="checkbox" id="fatPaga" ${m.faturaPaga?"checked":""}><span></span>Fatura paga</label>`:`<p class="hint">Nenhuma compra no crédito para esta fatura.</p>`}
      ${prox>0?`<p class="hint">Já lançado para a fatura de ${esc(abrMes(shiftKey(k,1)))}: <b>${brl(prox)}</b></p>`:""}</div>`;
  }
  /* contas fixas + compras no cartão de crédito (aparecem até o mês da última parcela) */
  const fx=fixosDoMes(k), cc=cartaoDoMes(k);
  const totalFix=c.fixosTotal+soma(cc), faltam=c.fixosPend+soma(cc.filter(x=>!x.pago));
  const linhaCartao=g=>{
    const chk=g.parcela?`data-pagar="parc|${esc(g.id)}|${k}"`:`data-gpago="${esc(g.id)}" data-mes="${g.compraK}"`;
    const edit=g.parcela?`data-edit="parcela" data-id="${esc(g.id)}" data-mes="${k}"`:`data-edit="gasto" data-id="${esc(g.id)}" data-mes="${g.compraK}"`;
    const info=g.parcela?`parcela ${g.idx}/${g.n}${g.idx===g.n?" · última parcela":" · até "+abrMes(shiftKey(k,g.n-g.idx))}`:`à vista · compra em ${pad2(g.dia)}/${pad2(kM(g.compraK))}`;
    return `<div class="item fixrow parcrow" style="--dot:${catColor(g.cat)}">
      <button type="button" class="check ${g.pago?"on":""}" ${chk} aria-pressed="${!!g.pago}" aria-label="${g.pago?"Marcar como não paga":"Marcar como paga"}">${ICON.check}</button>
      <button type="button" class="fixinfo" ${edit}><b class="${g.desc?"":"empty"}">${esc(g.desc||"Compra no cartão")}${g.parcela?` <em class="tag">${g.idx}/${g.n}</em>`:""}</b><small>${esc(info)} · ${g.pago?"paga"+(g.pagoEm?" em "+g.pagoEm.slice(8,10)+"/"+g.pagoEm.slice(5,7):""):"não paga"}</small></button>
      <span class="v">${brl(g.valor)}</span></div>`; };
  const fixas=`<div class="card"><div class="cardhead"><h2>Contas fixas</h2><span class="num muted">${fx.length||cc.length?brl(totalFix):""}</span></div>
    ${fx.length?`<div>${fx.map(f=>`<div class="item fixrow ${f.pular?"skip":""}" style="--dot:${catColor(f.cat)}">
      <button type="button" class="check ${f.pago?"on":""}" data-pago="${esc(f.id)}" aria-pressed="${f.pago}" aria-label="${f.pago?"Marcar como não paga":"Marcar como paga"}" ${f.pular?"disabled":""}>${ICON.check}</button>
      <button type="button" class="fixinfo" data-edit="fixoMes" data-id="${esc(f.id)}"><b>${esc(f.desc)}</b><small>${f.pular?"pulada neste mês":"vence dia "+pad2(f.dia)+" · "+esc(catName(f.cat))}</small></button>
      <span class="v">${f.pular?"—":brl(f.valor)}</span>
      <button type="button" class="x lixo" data-delfixo="${esc(f.id)}" aria-label="Excluir ${esc(f.desc)}" title="Excluir conta fixa">${ICON.lixo}</button></div>`).join("")}</div>`:""}
    ${cc.length?`<div class="subhead">Cartão de crédito</div><div>${cc.map(linhaCartao).join("")}</div>`:""}
    ${fx.length||cc.length?`<p class="hint">${faltam>0?"Falta pagar "+brl(faltam)+" este mês.":"Tudo pago neste mês."}</p>`
    :ativo(k)?`<p class="hint">Cadastre contas que se repetem todo mês (aluguel, internet, academia). Compras no cartão de crédito também aparecem aqui até a última parcela.</p>`:`<p class="hint">As contas fixas entram a partir do mês em que seu controle começa.</p>`}
    <button type="button" class="btn ghost" data-novo="fixo">+ Conta fixa</button></div>`;
  /* receitas */
  const rd=rendasDoMes(k);
  const receitas=`<div class="card"><div class="cardhead"><h2>Receitas</h2><span class="num muted">${brl(c.receitas)}</span></div>
    <label class="f money">Salário / renda fixa deste mês<input class="in num" id="salMes" inputmode="numeric" value="${esc(moneyInput(m.salario))}" placeholder="${esc(moneyInput(ativo(k)?state.config.salarioPadrao:0))}${ativo(k)?" (padrão)":""}"></label>
    <p class="hint">Em branco, usa o salário padrão definido no Perfil.</p>
    ${rd.length?`<div>${rd.map(r=>`<button type="button" class="item ${r.pular?"skip":""}" data-edit="rendaMes" data-id="${esc(r.id)}" style="--dot:var(--good)"><span class="pill">todo mês</span><span class="desc"><b>${esc(r.nome)}</b>${r.pular?"<small>pulada neste mês</small>":""}</span><span class="v pos">${r.pular?"—":brl(r.valor)}</span></button>`).join("")}</div>`:""}
    ${m.avulsos.length?`<div>${m.avulsos.slice().sort((a,b)=>a.dia-b.dia).map(x=>`<button type="button" class="item" data-edit="avulso" data-id="${esc(x.id)}" style="--dot:var(--good)"><span class="pill">dia ${pad2(x.dia)}</span><span class="desc"><b class="${x.desc?"":"empty"}">${esc(x.desc||"sem descrição")}</b></span><span class="v pos">${brl(x.valor)}</span></button>`).join("")}</div>`:""}
    <button type="button" class="btn ghost" data-novo="avulso">+ Receita</button></div>`;
  /* caixinha */
  const caixa=`<div class="card"><div class="cardhead"><h2>Caixinha</h2><span class="big">${brl(cx)}</span></div>
    <p class="hint">Guardar tira do saldo do mês; retirar devolve para ele.</p>
    ${m.caixinha.length?`<div>${m.caixinha.slice().sort((a,b)=>a.dia-b.dia).map(x=>`<button type="button" class="item" data-edit="caixinha" data-id="${esc(x.id)}" style="--dot:${x.tipo==="guardar"?"var(--accent)":"var(--warn)"}"><span class="pill">${x.tipo==="guardar"?"guardou":"retirou"} · ${pad2(x.dia)}</span><span class="desc"><b class="${x.desc?"":"empty"}">${esc(x.desc||"sem motivo")}</b></span><span class="v">${x.tipo==="guardar"?"+":"−"}${brl(x.valor)}</span></button>`).join("")}</div>`:""}
    <div class="row2"><button type="button" class="btn ghost" data-novo="caixinha" data-cxtipo="guardar">+ Guardar</button><button type="button" class="btn ghost warnbtn" data-novo="caixinha" data-cxtipo="retirar">− Retirar</button></div></div>`;
  /* para onde foi */
  const itens=cats.map((ct,i)=>({id:ct.id,nome:ct.nome,v:c.porCat[ct.id]||0,o:ct.orcamento,cor:catColor(ct.id)}));
  const semCat=Object.keys(c.porCat).filter(id=>catIndex(id)<0).reduce((a,id)=>a+c.porCat[id],0);
  if(semCat>0) itens.push({id:"",nome:"Sem categoria",v:semCat,o:0,cor:"var(--c8)"});
  const ordenados=itens.slice().sort((a,b)=>b.v-a.v);
  const onde=`<div class="card"><div class="cardhead"><h2>Para onde foi</h2><span class="num muted">${varDesp?esc(varDesp):""}</span></div>
    <div class="donutwrap">${donut(ordenados,c.despesas,brl(c.despesas),"gasto no mês")}
    <div class="bars">${ordenados.filter(x=>x.v>0||x.o>0).map(x=>{ const pv=prev?(prev.porCat[x.id]||0):0; const p=x.o>0?x.v/x.o:0; const cls=x.o>0&&p>1?"over":x.o>0&&p>=.8?"warn":"";
      const w=x.o>0?Math.min(100,p*100):(c.despesas>0?x.v/c.despesas*100:0);
      const delta=prev&&(pv>0||x.v>0)?(x.v>pv?`<em class="up">▲ ${brl(x.v-pv)}</em>`:x.v<pv?`<em class="down">▼ ${brl(pv-x.v)}</em>`:""):"";
      return `<div class="bar ${cls}" style="--dot:${x.cor}"><div class="t"><b>${esc(x.nome)}</b><span class="num">${brl(x.v)}${x.o>0?" / "+brl(x.o):c.despesas>0?" · "+Math.round(x.v/c.despesas*100)+"%":""}</span></div><div class="track"><div style="width:${w.toFixed(1)}%"></div></div>${delta?`<div class="delta">${delta} vs ${abrMes(prevK)}</div>`:""}</div>`; }).join("")||'<p class="hint">Assim que você lançar despesas, aparece aqui quanto foi para cada categoria.</p>'}</div></div>
    <p class="hint">Limites por categoria ficam em Ajustes: amarelo a partir de 80%, vermelho quando passa.</p></div>`;
  /* forma de pagamento */
  const formas=FORMAS.map(([id,n])=>({id,n,v:c.porForma[id]||0})).concat([{id:"?",n:"Não informado",v:c.porForma["?"]||0}]).filter(x=>x.v>0).sort((a,b)=>b.v-a.v);
  const pag=`<div class="card"><div class="cardhead"><h2>Forma de pagamento</h2></div>
    ${formas.length?`<div class="bars">${formas.map(x=>`<div class="bar" style="--dot:var(--fm-${x.id==="?"?"na":x.id})"><div class="t"><b>${esc(x.n)}</b><span class="num">${brl(x.v)} · ${Math.round(x.v/c.despesas*100)}%</span></div><div class="track"><div style="width:${(x.v/formas[0].v*100).toFixed(1)}%"></div></div></div>`).join("")}</div>`:'<p class="hint">Mostra quanto saiu no Pix, débito, crédito, dinheiro e boleto.</p>'}
    ${!cartaoAtivo()&&c.porForma.credito>0?`<p class="hint">Dica: em Ajustes → Cartão de crédito, informe o dia de fechamento para as compras no crédito contarem no mês da fatura.</p>`:""}</div>`;
  return aviso+cardLembretes()+tiles+`<div class="grid"><div class="col">${lista}${onde}</div><div class="col">${fatura}${fixas}${receitas}${caixa}${pag}</div></div>`;
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
  ${maior||melhor?`<div class="destaques">${maior?`<div><span class="lab">Mês que mais gastou</span><b>${esc(nomeMes(maior.k))}</b><span>${brl(maior.c.despesas)}</span></div>`:""}${melhor&&melhor.c.saldo>0?`<div><span class="lab">Melhor saldo</span><b>${esc(nomeMes(melhor.k))}</b><span class="pos">${brl(melhor.c.saldo)}</span></div>`:""}${catTot[0]?`<div><span class="lab">Categoria que mais pesou</span><b>${esc(catTot[0].ct.nome)}</b><span>${brl(catTot[0].v)} · ${Math.round(catTot[0].v/T.des*100)}%</span></div>`:""}</div>`:""}
  <div class="card chart"><div class="cardhead"><h2>Receitas x despesas</h2><div class="legend"><span><i style="background:var(--accent)"></i>Receitas</span><span><i style="background:var(--c2)"></i>Despesas</span></div></div><div class="tablewrap">${svg}</div></div>
  <div class="grid"><div class="card"><div class="cardhead"><h2>Mês a mês</h2><span class="num muted">toque para abrir</span></div><div class="tablewrap"><table>
    <thead><tr><th>Mês</th><th>Receitas</th><th>Despesas</th><th>Saldo</th><th>Acumulado</th></tr></thead>
    <tbody>${rows.slice().reverse().map(r=>`<tr class="click ${r.k===todayKey?"cur":""}" data-open="${r.k}"><td>${esc(nomeMes(r.k))}${r.k===todayKey?' <small class="muted">atual</small>':""}</td><td>${brl(r.c.receitas)}</td><td>${brl(r.c.despesas)}</td><td class="${r.c.saldo<0?"neg":""}">${brl(r.c.saldo)}</td><td class="${r.ac<0?"neg":""}">${brl(r.ac)}</td></tr>`).join("")}</tbody>
    <tfoot><tr><td>Total</td><td>${brl(T.rec)}</td><td>${brl(T.des)}</td><td>${brl(T.sal)}</td><td>${brl(ult.ac)}</td></tr></tfoot>
  </table></div></div>
  <div class="col"><div class="card"><h2>Para onde foi o dinheiro</h2>${catTot.length?`<div class="donutwrap">${donut(catTot.map(z=>({nome:z.ct.nome,v:z.v,cor:catColor(z.ct.id)})),T.des,brl(T.des),"no período")}<div class="bars">${catTot.map(z=>`<div class="bar" style="--dot:${catColor(z.ct.id)}"><div class="t"><b>${esc(z.ct.nome)}</b><span class="num">${brl(z.v)} · ${Math.round(z.v/T.des*100)}%</span></div><div class="track"><div style="width:${(z.v/catTot[0].v*100).toFixed(1)}%"></div></div><div class="delta">média ${brl(z.v/ks.length)}/mês</div></div>`).join("")}</div></div>`:`<div class="empty-state">Assim que você lançar despesas, o total por categoria aparece aqui.</div>`}</div>
  ${fTot.length?`<div class="card"><h2>Forma de pagamento no período</h2><div class="bars">${fTot.map(x=>`<div class="bar" style="--dot:var(--fm-${x.id})"><div class="t"><b>${esc(x.n)}</b><span class="num">${brl(x.v)} · ${Math.round(x.v/T.des*100)}%</span></div><div class="track"><div style="width:${(x.v/fTot[0].v*100).toFixed(1)}%"></div></div></div>`).join("")}</div></div>`:""}</div></div>`;
}

/* ---------- aba Ajustes ---------- */
function viewAjustes(){
  const cf=state.config, cc=cf.cartao||{};
  const ativos=cf.fixos.filter(f=>!f.ate||f.ate>=todayKey), encerrados=cf.fixos.filter(f=>f.ate&&f.ate<todayKey);
  const parc=cf.parcelas.map(p=>{ const cartao=p.forma==="credito"&&cartaoAtivo(); const prim=cartao?faturaMes(p.compra,p.dia):p.compra; const pagas=Math.max(0,Math.min(p.n,entre(prim,todayKey)+1)); return {p,prim,pagas,ultima:shiftKey(prim,p.n-1)}; });
  const abertas=parc.filter(x=>x.ultima>=todayKey), quitadas=parc.length-abertas.length;
  return `<div class="grid"><div class="col">
    <div class="card"><div class="cardhead"><h2>Contas fixas</h2><span class="num muted">${ativos.length?brl(soma(ativos))+"/mês":""}</span></div>
    ${ativos.length?`<div>${ativos.slice().sort((a,b)=>a.dia-b.dia).map(f=>`<button type="button" class="item" data-edit="fixo" data-id="${esc(f.id)}" style="--dot:${catColor(f.cat)}"><span class="pill">dia ${pad2(f.dia)}</span><span class="desc"><b>${esc(f.nome)}</b><small>${esc(catName(f.cat))} · ${esc(formaNome(f.forma))}${f.desde>todayKey?" · começa em "+abrMes(f.desde):""}</small></span><span class="v">${brl(f.valor)}</span></button>`).join("")}</div>`:`<p class="hint">Nenhuma conta fixa ainda. Exemplos: aluguel, internet, plano de celular, academia, streaming.</p>`}
    ${encerrados.length?`<p class="hint">${encerrados.length} conta(s) encerrada(s) continuam aparecendo nos meses em que valiam.</p>`:""}
    <button class="btn ghost" data-novo="fixo" type="button">+ Nova conta fixa</button></div>
    <div class="card"><div class="cardhead"><h2>Compras parceladas</h2><span class="num muted">${abertas.length?abertas.length+" em andamento":""}</span></div>
    ${abertas.length?`<div>${abertas.map(x=>`<button type="button" class="item" data-edit="parcela" data-id="${esc(x.p.id)}" style="--dot:${catColor(x.p.cat)}"><span class="pill">${x.pagas}/${x.p.n}</span><span class="desc"><b>${esc(x.p.desc||"Compra parcelada")}</b><small>${x.p.n}x de ${brl(x.p.total/x.p.n)} · até ${esc(abrMes(x.ultima))}</small></span><span class="v">${brl(x.p.total)}</span></button>`).join("")}</div>`:`<p class="hint">Para parcelar, ao lançar uma despesa ligue a opção <b>Compra parcelada</b>. As parcelas entram sozinhas nos meses seguintes.</p>`}
    ${quitadas?`<p class="hint">${quitadas} compra(s) já quitada(s).</p>`:""}</div>
    <div class="card"><h2>Cartão de crédito</h2>
    <p class="hint">Informe os dias do seu cartão para as compras no crédito contarem no mês em que a fatura vence. Deixe em branco para contar no dia da compra.</p>
    <div class="row"><label class="f">Fecha dia<input class="in num" id="ccFecha" type="number" min="1" max="31" inputmode="numeric" value="${cc.fecha||""}" placeholder="ex.: 25"></label><label class="f">Vence dia<input class="in num" id="ccVence" type="number" min="1" max="31" inputmode="numeric" value="${cc.vence||""}" placeholder="ex.: 5"></label></div>
    ${cartaoAtivo()?`<p class="hint">Ex.: uma compra no dia ${pad2(Math.max(1,cc.fecha-1))} entra na fatura que vence em ${esc(abrMes(faturaMes(todayKey,Math.max(1,cc.fecha-1))))}; no dia ${pad2(cc.fecha)}, já vai para ${esc(abrMes(faturaMes(todayKey,cc.fecha)))}.</p>`:""}</div></div>
    <div class="col"><div class="card"><div class="cardhead"><h2>Categorias de gastos</h2><span class="num muted">${cf.categorias.length}</span></div>
    <p class="hint">Toque numa categoria para mudar o nome, a cor ou o limite do mês, ou para excluir.</p>
    <div>${cf.categorias.map(ct=>`<button type="button" class="item catitem" data-edit="categoria" data-id="${esc(ct.id)}" style="--dot:${catColor(ct.id)}"><span class="dot"></span><span class="desc"><b>${esc(ct.nome)}</b><small>${ct.orcamento>0?"limite de "+brl(ct.orcamento)+" por mês":"sem limite"}</small></span><span class="v muted">editar</span></button>`).join("")}</div>
    <button class="btn ghost" data-novo="categoria" type="button">+ Nova categoria</button>
    <p class="hint">Excluir uma categoria não apaga os valores já lançados nela (aparecem como "Sem categoria"; ao editar, escolha outra).</p></div></div></div>`;
}

/* ---------- aba Perfil ---------- */
function viewPerfil(){
  const cf=state.config, u=authUser, ini=inicioKey();
  const criado=u&&u.metadata&&u.metadata.creationTime?new Date(u.metadata.creationTime).toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"}):"";
  const nLanc=Object.values(state.months).reduce((a,m)=>a+(m.gastos?m.gastos.length:0)+(m.avulsos?m.avulsos.length:0)+(m.caixinha?m.caixinha.length:0),0);
  const rendas=cf.rendas.filter(r=>!r.ate||r.ate>=todayKey);
  return `<div class="perfilhead card">${avatar(72)}<div class="pinfo"><h2>${esc(u?(u.displayName||"Sua conta"):"Modo local")}</h2>
    <p class="muted">${u?esc(u.email||""):"Sem login: os dados ficam só neste aparelho."}</p>
    <p class="small muted">${criado?"Conta criada em "+esc(criado)+" · ":""}${ini?"controle desde "+esc(nomeMes(ini).toLowerCase()):"controle ainda não começou"} · ${nLanc} lançamento${nLanc===1?"":"s"}</p></div>
    ${u?`<button class="btn ghost" type="button" data-logout="1">Sair da conta</button>`:""}</div>
  <div class="grid"><div class="col"><div class="card"><h2>Renda e saldos</h2>
    <label class="f money">Salário / renda fixa padrão (todo mês)<input class="in num" id="cfSal" inputmode="numeric" value="${esc(moneyInput(cf.salarioPadrao))}" placeholder="0,00"></label>
    <p class="hint">Entra automaticamente a partir do mês em que seu controle começa. Se um mês for diferente, ajuste na aba Mês.</p>
    <div class="f"><span>Outras rendas que se repetem todo mês</span>
    ${rendas.length?`<div>${rendas.map(r=>`<button type="button" class="item" data-edit="renda" data-id="${esc(r.id)}" style="--dot:var(--good)"><span class="pill">todo mês</span><span class="desc"><b>${esc(r.nome)}</b>${r.desde>todayKey?`<small>começa em ${esc(abrMes(r.desde))}</small>`:""}</span><span class="v pos">${brl(r.valor)}</span></button>`).join("")}</div>`:`<p class="hint">Ex.: bolsa, pensão, aluguel que você recebe.</p>`}
    <button class="btn ghost" type="button" data-novo="renda">+ Renda fixa</button></div>
    <label class="f">Começar a contar em<select class="in" id="cfInicio"><option value="">Automático${ini&&!cf.inicio?" ("+esc(nomeMes(ini))+")":" (primeiro mês com renda)"}</option>${MESES.map(k=>`<option value="${k}" ${k===cf.inicio?"selected":""}>${esc(nomeMes(k))}</option>`).join("")}</select></label>
    <p class="hint">Antes desse mês, salário padrão, rendas e contas fixas não entram nas contas.</p>
    <label class="f money">Saldo inicial (o que você já tinha em conta)<input class="in num" id="cfSaldo" inputmode="numeric" value="${esc(moneyInput(cf.saldoInicial))}" placeholder="0,00"></label>
    <label class="f money">Saldo inicial da caixinha<input class="in num" id="cfCx" inputmode="numeric" value="${esc(moneyInput(cf.saldoCaixinha))}" placeholder="0,00"></label></div></div>
  <div class="col"><div class="card"><h2>Aparência</h2>
    <div class="seg" role="radiogroup" aria-label="Tema">${[["auto","Automático"],["claro","Claro"],["escuro","Escuro"]].map(([v,l])=>`<input type="radio" name="ptema" id="pt-${v}" value="${v}" ${tema===v?"checked":""}><label for="pt-${v}">${l}</label>`).join("")}</div>
    <p class="hint">Automático segue o tema do seu celular ou computador.</p></div>
    <div class="card"><h2>Lembretes</h2>
    <p class="hint">Avisa um dia antes do vencimento, no dia e, se não marcar como paga, no dia seguinte (atraso). Vale para contas fixas, parcelas e fatura do cartão.</p>
    <label class="switch"><input type="checkbox" id="notifOn" ${notifOn&&("Notification" in window)&&Notification.permission==="granted"?"checked":""}><span></span>Notificações neste aparelho</label>
    <p class="hint">${!("Notification" in window)?"Este navegador não permite notificações. Use o calendário abaixo.":Notification.permission==="denied"?"As notificações estão bloqueadas. Libere em: ícone ao lado do endereço → Configurações do site → Notificações → Permitir.":"Chegam enquanto o app estiver aberto ou em segundo plano. No celular, instale o app na tela inicial para funcionar melhor."}</p>
    <button class="btn ghost" type="button" data-calendario="1">Adicionar lembretes ao calendário</button>
    <p class="hint">Para avisar mesmo com o app fechado: baixa um arquivo com os vencimentos dos próximos 12 meses. No celular, abra o arquivo e escolha o Google Agenda (ou Calendário, no iPhone). No computador: Google Agenda → Configurações → Importar. Se cadastrar contas novas, baixe de novo.</p></div>
    <div class="card"><h2>Exportar e backup</h2><p class="hint">A planilha abre no Excel e no Google Planilhas. O backup serve para restaurar tudo depois.</p>
    <button class="btn ghost" type="button" data-planilha="1">Baixar planilha (Excel)</button>
    <div class="row"><button class="btn ghost" type="button" data-export="1">Baixar backup</button><label class="btn ghost" for="impFile" style="text-align:center">Restaurar backup<input type="file" id="impFile" accept="application/json,.json" hidden></label></div>
    ${ui.importMsg?`<p class="hint">${esc(ui.importMsg)}</p>`:""}</div>
    <div class="card"><div class="cardhead"><h2>Novidades</h2><span class="versao">versão ${VERSAO}</span></div>
    <ul class="novidades">${NOVIDADES.map(n=>`<li>${esc(n)}</li>`).join("")}</ul>
    <p class="hint">O histórico completo fica no arquivo CHANGELOG.md do projeto.</p></div>
    <div class="card"><h2>Privacidade</h2><p class="hint">Só você vê seus lançamentos. Eles ficam guardados na sua conta e protegidos por regras que impedem qualquer outra pessoa de ler ou alterar.</p></div>
    <div class="card perigo"><h2>Recomeçar do zero</h2><p class="hint">Apaga todos os seus lançamentos, contas fixas, parcelas e configurações. Não dá para desfazer; se quiser, baixe um backup antes.</p>
    ${ui.confirmaApagar?`<label class="f">Para confirmar, digite APAGAR<input class="in" id="txtApagar" autocomplete="off" placeholder="APAGAR"></label><div class="row2"><button class="btn ghost" type="button" data-apagar="nao">Cancelar</button><button class="btn danger" type="button" data-apagar="sim">Apagar tudo</button></div>`:`<button class="btn danger" type="button" data-apagar="pedir">Apagar todos os meus dados</button>`}</div></div></div>`;
}

/* =====================================================================
   JANELA DE LANÇAMENTO (adicionar / editar / buscar)
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
const mesSheet=()=>(ui.sheet&&ui.sheet.mes)||ui.month;
function itemAtual(){
  const s=ui.sheet; if(!s||!s.id) return null; const k=mesSheet(), m=getMonth(k);
  switch(s.tipo){
    case "gasto": return m.gastos.find(x=>x.id===s.id);
    case "avulso": return m.avulsos.find(x=>x.id===s.id);
    case "caixinha": return m.caixinha.find(x=>x.id===s.id);
    case "fixo": return state.config.fixos.find(x=>x.id===s.id);
    case "fixoMes": return fixosDoMes(k).find(x=>x.id===s.id);
    case "parcela": return state.config.parcelas.find(x=>x.id===s.id);
    case "renda": return state.config.rendas.find(x=>x.id===s.id);
    case "rendaMes": return rendasDoMes(k).find(x=>x.id===s.id);
    case "categoria": return state.config.categorias.find(x=>x.id===s.id);
  }
  return null;
}
function chipsCampo(sel){ return `<div class="cats" role="radiogroup" aria-label="Categoria">${state.config.categorias.map(ct=>`<input type="radio" name="s-cat" id="s-cat-${esc(ct.id)}" value="${esc(ct.id)}" ${ct.id===sel?"checked":""}><label for="s-cat-${esc(ct.id)}" style="--dot:${catColor(ct.id)}"><i></i>${esc(ct.nome)}</label>`).join("")}<button type="button" class="chipnova" data-snovacat="1">+ Nova categoria</button></div>
  <div class="row" id="s-novacatbox" hidden><label class="f" style="flex:2 1 160px">Nome da nova categoria<input class="in" id="s-novacat" maxlength="40" placeholder="ex.: Pets, Presentes"></label><button class="btn ghost" type="button" data-scriacat="1">Criar</button></div>`; }
function chipsForma(sel){ return `<div class="cats formas" role="radiogroup" aria-label="Forma de pagamento">${FORMAS.map(([id,n])=>`<input type="radio" name="s-forma" id="s-fm-${id}" value="${id}" ${id===sel?"checked":""}><label for="s-fm-${id}" style="--dot:var(--fm-${id})"><i></i>${n}</label>`).join("")}</div>`; }
function selDia(k,sel){ const dim=diasMes(k); let o=""; for(let d=1;d<=dim;d++){ const wd=new Date(kY(k),kM(k)-1,d).toLocaleDateString("pt-BR",{weekday:"short"}).replace(".",""); o+=`<option value="${d}" ${d===sel?"selected":""}>${pad2(d)} · ${wd}${k===todayKey&&d===today.getDate()?" (hoje)":""}</option>`; } return `<select class="in" id="s-dia">${o}</select>`; }
const selMes=(id,sel)=>`<select class="in" id="${id}">${MESES.map(x=>`<option value="${x}" ${x===sel?"selected":""}>${esc(nomeMes(x))}</option>`).join("")}</select>`;
function renderSheet(){
  const r=sheetRoot(), s=ui.sheet;
  if(!s){ r.innerHTML=""; document.body.classList.remove("sheet-open"); return; }
  document.body.classList.add("sheet-open");
  const k=mesSheet(), it=itemAtual(), novo=!s.id, diaPadrao=k===todayKey?today.getDate():1;
  if(!novo&&!it&&s.tipo!=="busca"){ closeSheet(); return; }
  const titulos={gasto:novo?"Nova despesa":"Editar despesa",avulso:novo?"Nova receita":"Editar receita",caixinha:novo?"Movimentar caixinha":"Editar caixinha",fixo:novo?"Nova conta fixa":"Editar conta fixa",fixoMes:it?it.desc:"",parcela:"Compra parcelada",renda:novo?"Nova renda fixa":"Editar renda fixa",rendaMes:it?it.nome:"",busca:"Buscar lançamentos",categoria:novo?"Nova categoria":"Editar categoria"};
  const abas=novo&&["gasto","avulso","caixinha","fixo"].includes(s.tipo)?`<div class="seg tipos" role="tablist">${[["gasto","Despesa"],["avulso","Receita"],["caixinha","Caixinha"],["fixo","Conta fixa"]].map(([t,l])=>`<input type="radio" name="s-tipo" id="s-t-${t}" value="${t}" ${s.tipo===t?"checked":""}><label for="s-t-${t}">${l}</label>`).join("")}</div>`:"";
  const valorCampo=(v,lab,auto=true)=>`<label class="f money bigval"><span id="s-valorlab">${lab||"Valor"}</span><input class="in num" id="s-valor" inputmode="numeric" placeholder="0,00" value="${esc(v!=null?moneyInput(v):(s.valorRasc||""))}" ${auto?"data-autofocus":""} required></label>`;
  const apagar=`<button class="btn danger" type="button" data-sapagar="1">Apagar</button>`;
  let corpo="", botoes="", sub=esc(nomeMes(k));
  if(s.tipo==="gasto"){
    const cat=it?it.cat:(ui.gCat&&catIndex(ui.gCat)>=0?ui.gCat:state.config.categorias[0]?.id);
    const forma=it?(it.forma||""):ui.gForma;
    corpo=`${valorCampo(it&&it.valor)}
      ${novo?`<label class="switch"><input type="checkbox" id="s-parc"><span></span>Compra parcelada</label>
      <div class="row" id="s-parcbox" hidden><label class="f narrow">Parcelas<input class="in num" id="s-n" type="number" min="2" max="48" value="2" inputmode="numeric"></label><label class="f narrow">Vence dia<input class="in num" id="s-venc" type="number" min="1" max="31" value="${diaPadrao}" inputmode="numeric"></label><p class="hint" id="s-parcinfo" style="flex:2 1 160px;align-self:center"></p></div>`:""}
      <div class="f"><span>Categoria</span>${chipsCampo(cat)}${it&&catIndex(it.cat)<0?'<p class="hint">A categoria desta despesa foi excluída. Escolha outra.</p>':""}</div>
      <div class="row"><label class="f">Dia${selDia(k,it?it.dia:diaPadrao)}</label><label class="f" style="flex:2 1 180px">Descrição (opcional)<input class="in" id="s-desc" maxlength="80" placeholder="ex.: feira, gasolina, farmácia" value="${esc(it?it.desc:"")}"></label></div>
      <div class="f"><span>Forma de pagamento</span>${chipsForma(forma)}</div>
      ${it&&it.forma==="credito"?`<label class="switch"><input type="checkbox" id="s-gpago" ${it.pago?"checked":""}><span></span>Já paguei esta compra</label>`:""}
      <p class="hint" id="s-fatinfo">${cartaoAtivo()?"No crédito, conta na fatura do cartão.":""}</p>`;
    botoes=novo?`<button class="btn ghost" type="submit" data-outro="1">Salvar e lançar outra</button><button class="btn" type="submit">Salvar</button>`:`${apagar}<button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="avulso"){
    corpo=`${valorCampo(it&&it.valor)}<div class="row"><label class="f">Dia${selDia(k,it?it.dia:diaPadrao)}</label><label class="f" style="flex:2 1 180px">Descrição<input class="in" id="s-desc" maxlength="60" placeholder="ex.: freela, Pix recebido, 13º" value="${esc(it?it.desc:"")}"></label></div>
      ${novo?`<label class="switch"><input type="checkbox" id="s-repete"><span></span>Recebo esse valor todo mês</label><p class="hint">Ligado, vira uma renda fixa que entra sozinha a partir deste mês.</p>`:""}`;
    botoes=novo?`<button class="btn" type="submit">Salvar</button>`:`${apagar}<button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="caixinha"){
    const tp=it?it.tipo:(s.cxTipo||"guardar");
    corpo=`<div class="seg" role="radiogroup" aria-label="Tipo"><input type="radio" name="s-cxtipo" id="s-cxG" value="guardar" ${tp==="guardar"?"checked":""}><label for="s-cxG">Guardar</label><input type="radio" name="s-cxtipo" id="s-cxR" value="retirar" ${tp==="retirar"?"checked":""}><label for="s-cxR">Retirar</label></div>
      ${valorCampo(it&&it.valor)}<div class="row"><label class="f">Dia${selDia(k,it?it.dia:diaPadrao)}</label><label class="f" style="flex:2 1 180px">Motivo (opcional)<input class="in" id="s-desc" maxlength="60" placeholder="ex.: reserva, viagem" value="${esc(it?it.desc:"")}"></label></div>
      <p class="hint">Saldo atual da caixinha: <b>${brl(caixinhaAte(k))}</b></p>`;
    botoes=novo?`<button class="btn" type="submit">Salvar</button>`:`${apagar}<button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="fixo"){
    const cat=it?it.cat:(ui.gCat&&catIndex(ui.gCat)>=0?ui.gCat:state.config.categorias[0]?.id);
    const desde=it?it.desde:(ui.tab==="mes"?k:todayKey);
    corpo=`<label class="f">Nome da conta<input class="in" id="s-nome" maxlength="40" placeholder="ex.: Aluguel, Internet, Academia" value="${esc(it?it.nome:"")}" ${s.valorRasc?"":"data-autofocus"}></label>
      ${valorCampo(it&&it.valor,"Valor por mês",false)}
      <div class="row"><label class="f narrow">Vence dia<input class="in num" id="s-diafixo" type="number" min="1" max="31" value="${it?it.dia:diaPadrao}"></label><label class="f">Começa em${selMes("s-desde",desde)}</label></div>
      <div class="f"><span>Categoria</span>${chipsCampo(cat)}</div>
      <div class="f"><span>Forma de pagamento</span>${chipsForma(it?it.forma:"boleto")}</div>
      <p class="hint">Entra sozinha nas despesas de todos os meses a partir do mês escolhido. Em cada mês você marca se já pagou.</p>`;
    const apartir=ui.tab==="mes"?k:todayKey;
    if(!novo) corpo+=`<div class="zona"><p class="hint">Excluir a partir de ${esc(abrMes(apartir))} mantém a conta nos meses anteriores (o histórico continua certo).</p><button class="link danger" type="button" data-sexcluirfixo="todos">Apagar de todos os meses</button></div>`;
    sub=""; botoes=novo?`<button class="btn" type="submit">Salvar</button>`:`<button class="btn danger" type="button" data-sexcluirfixo="mes">Excluir a partir de ${esc(abrMes(apartir))}</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="fixoMes"){
    corpo=`<p class="hint">${esc(catName(it.cat))} · vence dia ${pad2(it.dia)} · ${esc(formaNome(it.forma))}</p>
      <label class="switch"><input type="checkbox" id="s-pago" ${it.pago?"checked":""}><span></span>Já paguei esta conta</label>
      ${valorCampo(it.valor,"Valor neste mês")}
      <p class="hint">Valor padrão: ${brl(it.padrao)}. Mudar aqui vale só para ${esc(nomeMes(k).toLowerCase())}.</p>
      <div class="row2"><button class="btn ghost" type="button" data-spular="fixos">${it.pular?"Voltar a contar neste mês":"Pular só este mês"}</button><button class="btn ghost" type="button" data-sabrir="fixo">Editar conta fixa</button></div>`;
    botoes=`<button class="btn danger" type="button" data-sexcluirfixo="mes">Excluir conta</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="parcela"){
    const cartao=it.forma==="credito"&&cartaoAtivo(), prim=cartao?faturaMes(it.compra,it.dia):it.compra;
    corpo=`<p class="hint">Comprado em ${pad2(it.dia)}/${pad2(kM(it.compra))}/${kY(it.compra)} · parcelas de ${esc(abrMes(prim))} a ${esc(abrMes(shiftKey(prim,it.n-1)))}${cartao?" (na fatura)":""}</p>
      ${valorCampo(it.total,"Valor total da compra")}
      <div class="row"><label class="f narrow">Parcelas<input class="in num" id="s-n" type="number" min="2" max="48" value="${it.n}"></label>${cartao?"":`<label class="f narrow">Vence dia<input class="in num" id="s-venc" type="number" min="1" max="31" value="${it.venc||it.dia}"></label>`}<label class="f" style="flex:2 1 160px">Descrição<input class="in" id="s-desc" maxlength="80" value="${esc(it.desc)}"></label></div>
      ${(()=>{ const pm=parcelasDoMes(k).find(x=>x.id===it.id); return pm?`<label class="switch"><input type="checkbox" id="s-ppago" ${pm.pago?"checked":""}><span></span>Paguei a parcela ${pm.idx}/${pm.n} de ${esc(abrMes(k))} (${brl(pm.valor)})</label>`:""; })()}
      <div class="f"><span>Categoria</span>${chipsCampo(it.cat)}</div>
      <div class="f"><span>Forma de pagamento</span>${chipsForma(it.forma)}</div>`;
    sub=""; botoes=`<button class="btn danger" type="button" data-sapagar="1">Apagar compra</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="renda"){
    corpo=`<label class="f">Nome<input class="in" id="s-nome" maxlength="40" placeholder="ex.: Bolsa, Pensão, Aluguel recebido" value="${esc(it?it.nome:(s.nomeRasc||""))}" data-autofocus></label>
      ${valorCampo(it&&it.valor,"Valor por mês",false)}
      <label class="f">Começa em${selMes("s-desde",it?it.desde:(ui.tab==="mes"?k:todayKey))}</label>
      <p class="hint">Entra sozinha nas receitas de todos os meses a partir do mês escolhido.</p>`;
    sub=""; botoes=novo?`<button class="btn" type="submit">Salvar</button>`:`<button class="btn danger" type="button" data-sencerrar="rendas">Encerrar renda</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="rendaMes"){
    corpo=`${valorCampo(it.valor,"Valor neste mês")}<p class="hint">Valor padrão: ${brl(it.padrao)}. Mudar aqui vale só para ${esc(nomeMes(k).toLowerCase())}.</p>
      <div class="row2"><button class="btn ghost" type="button" data-spular="rendas">${it.pular?"Voltar a contar neste mês":"Pular só este mês"}</button><button class="btn ghost" type="button" data-sabrir="renda">Editar renda fixa</button></div>`;
    botoes=`<button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="categoria"){
    const usada=it?Object.values(state.months).reduce((a,m)=>a+(m.gastos||[]).filter(g=>g.cat===it.id).length,0)+state.config.fixos.filter(f=>f.cat===it.id).length+state.config.parcelas.filter(p=>p.cat===it.id).length:0;
    const usadas=new Set(state.config.categorias.filter(c=>c!==it).map(corIdx));
    const corSel=it?corIdx(it):[...Array(NCORES).keys()].find(i=>!usadas.has(i))??0;
    corpo=`<label class="f">Nome<input class="in" id="s-nome" maxlength="40" placeholder="ex.: Pets, Presentes, Viagem" value="${esc(it?it.nome:"")}" data-autofocus></label>
      <div class="f"><span>Cor</span><div class="cores" role="radiogroup" aria-label="Cor">${[...Array(NCORES).keys()].map(i=>`<input type="radio" name="s-cor" id="s-cor-${i}" value="${i}" ${i===corSel?"checked":""}><label for="s-cor-${i}" style="--dot:var(--c${i})" title="Cor ${i+1}"><span class="sr">Cor ${i+1}</span></label>`).join("")}</div></div>
      <label class="f money">Limite por mês (opcional)<input class="in num" id="s-valor" inputmode="numeric" placeholder="sem limite" value="${esc(it&&it.orcamento?moneyInput(it.orcamento):"")}"></label>
      ${it&&usada?`<p class="hint">Usada em ${usada} lançamento(s). Se excluir, eles continuam nas contas como "Sem categoria".</p>`:""}`;
    sub=""; botoes=novo?`<button class="btn" type="submit">Criar categoria</button>`:`<button class="btn danger" type="button" data-sapagar="1" ${state.config.categorias.length<=1?"disabled":""}>Excluir</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="busca"){
    corpo=`<label class="f"><span>Procure pela descrição, campo ou valor</span><input class="in" id="s-busca" type="search" placeholder="ex.: farmácia, aluguel, 89,90" value="${esc(s.q||"")}" data-autofocus autocomplete="off"></label><div id="s-result" class="busca"></div>`;
    sub="";
  }
  r.innerHTML=`<div class="sheet-wrap" data-sfechar="1"><form class="sheet" id="sheetForm" role="dialog" aria-modal="true" aria-labelledby="sheetTit" autocomplete="off" novalidate>
    <div class="sheethead"><h2 id="sheetTit">${esc(titulos[s.tipo])}</h2><span class="muted small">${sub}</span><button type="button" class="x" data-sfechar="1" aria-label="Fechar">×</button></div>
    ${abas}${corpo}<p class="erro" id="s-erro" hidden></p>${botoes?`<div class="sheetbtns">${botoes}</div>`:""}</form></div>`;
  if(s.tipo==="busca") atualizaBusca();
  if(s.tipo==="gasto") atualizaParc();
}
/* mostra o valor de cada parcela enquanto a pessoa digita */
function atualizaParc(){
  const box=document.getElementById("s-parcbox"), on=document.getElementById("s-parc"); if(!box||!on) return;
  box.hidden=!on.checked; document.getElementById("s-valorlab").textContent=on.checked?"Valor total da compra":"Valor";
  const v=parseMoney(document.getElementById("s-valor").value), n=Math.round(Number(document.getElementById("s-n").value)||0);
  document.getElementById("s-parcinfo").textContent=on.checked&&v>0&&n>=2?n+"x de "+brl(v/n)+", a primeira em "+abrMes(document.querySelector('#sheet input[name="s-forma"]:checked')?.value==="credito"?faturaMes(mesSheet(),Number(document.getElementById("s-dia").value)||1):mesSheet()):"";
}
/* busca em todos os meses */
function atualizaBusca(){
  const el=document.getElementById("s-result"); if(!el) return;
  const q=((document.getElementById("s-busca")||{}).value||"").trim().toLowerCase(); ui.sheet.q=q;
  if(q.length<2){ el.innerHTML='<p class="hint">Digite pelo menos 2 letras.</p>'; return; }
  const qn=parseMoney(q), res=[];
  const bate=(txt,v)=>String(txt||"").toLowerCase().includes(q)||(qn>0&&Math.abs((Number(v)||0)-qn)<0.005);
  MESES.slice().reverse().forEach(k=>{ const m=state.months[k]; if(!m) return;
    (m.gastos||[]).forEach(g=>{ if(bate(g.desc+" "+catName(g.cat),g.valor)) res.push({k,tipo:"gasto",id:g.id,t:g.desc||catName(g.cat),s:catName(g.cat)+" · dia "+pad2(g.dia),v:-g.valor}); });
    (m.avulsos||[]).forEach(x=>{ if(bate(x.desc,x.valor)) res.push({k,tipo:"avulso",id:x.id,t:x.desc||"Receita",s:"receita · dia "+pad2(x.dia),v:x.valor}); });
    (m.caixinha||[]).forEach(x=>{ if(bate(x.desc+" caixinha",x.valor)) res.push({k,tipo:"caixinha",id:x.id,t:x.desc||"Caixinha",s:(x.tipo==="guardar"?"guardou":"retirou")+" · dia "+pad2(x.dia),v:x.tipo==="guardar"?-x.valor:x.valor}); });
  });
  state.config.parcelas.forEach(p=>{ if(bate(p.desc+" "+catName(p.cat)+" parcela",p.total)) res.push({k:p.compra,tipo:"parcela",id:p.id,t:p.desc||"Compra parcelada",s:p.n+"x · "+catName(p.cat),v:-p.total}); });
  state.config.fixos.forEach(f=>{ if(bate(f.nome+" "+catName(f.cat)+" fixa",f.valor)) res.push({k:null,tipo:"fixo",id:f.id,t:f.nome,s:"conta fixa · dia "+pad2(f.dia),v:-f.valor}); });
  el.innerHTML=res.length?`<p class="hint">${res.length} resultado${res.length===1?"":"s"}</p>`+res.slice(0,60).map(x=>`<button type="button" class="item" data-sres="${x.tipo}" data-id="${esc(x.id)}" data-mes="${x.k||""}"><span class="pill">${x.k?esc(abrMes(x.k)):"fixa"}</span><span class="desc"><b>${esc(x.t)}</b><small>${esc(x.s)}</small></span><span class="v ${x.v>0?"pos":""}">${brl(Math.abs(x.v))}</span></button>`).join(""):'<p class="hint">Nada encontrado.</p>';
}
function erroSheet(msg,campo){ const e=document.getElementById("s-erro"); if(e){ e.textContent=msg; e.hidden=false; } if(campo){ const c=document.getElementById(campo); if(c) c.focus(); } }
function salvarSheet(outro){
  const s=ui.sheet, k=mesSheet();
  if(s.tipo==="busca") return;
  if(s.tipo==="categoria"){
    const nome=((document.getElementById("s-nome")||{}).value||"").trim(); if(!nome) return erroSheet("Dê um nome para a categoria.","s-nome");
    const lv=(document.getElementById("s-valor")||{}).value.trim(), lim=lv===""?0:parseMoney(lv); if(isNaN(lim)||lim<0) return erroSheet("Limite inválido. Ex.: 600,00","s-valor");
    const cor=Number((document.querySelector('#sheet input[name="s-cor"]:checked')||{}).value)||0;
    if(s.id) Object.assign(itemAtual(),{nome,orcamento:lim,cor}); else state.config.categorias.push({id:"c"+uidGen(),nome,orcamento:lim,cor});
    save("config"); closeSheet(); render(); toast(s.id?"Categoria atualizada.":"Categoria "+nome+" criada."); return;
  }
  const v=parseMoney((document.getElementById("s-valor")||{}).value);
  const val=id=>(document.getElementById(id)||{}).value, radio=n=>(document.querySelector(`#sheet input[name="${n}"]:checked`)||{}).value;
  const desc=(val("s-desc")||"").trim(), dia=Number(val("s-dia"))||1;
  if(s.tipo==="fixoMes"||s.tipo==="rendaMes"){
    if(!(v>=0)) return erroSheet("Digite um valor válido, ex.: 99,90","s-valor");
    const mapa=s.tipo==="fixoMes"?"fixos":"rendas", m=getMonth(k), o=Object.assign({},m[mapa][s.id]||{});
    if(s.tipo==="fixoMes"){ const pg=document.getElementById("s-pago").checked; if(pg&&!o.pago){ const h=new Date(); o.pagoEm=h.getFullYear()+"-"+pad2(h.getMonth()+1)+"-"+pad2(h.getDate()); } o.pago=pg; }
    const base=state.config[mapa].find(x=>x.id===s.id);
    if(base&&Math.abs(v-base.valor)<0.005) delete o.valor; else o.valor=v;
    m[mapa][s.id]=o; save(k); closeSheet(); render(); toast(o.pago?"Conta marcada como paga.":"Atualizado para "+abrMes(k)+"."); return;
  }
  if(s.tipo==="fixo"||s.tipo==="renda"){
    const nome=(val("s-nome")||"").trim(); if(!nome) return erroSheet(s.tipo==="fixo"?"Dê um nome para a conta, ex.: Aluguel":"Dê um nome, ex.: Bolsa","s-nome");
    if(!(v>0)) return erroSheet("Digite o valor por mês, ex.: 1.200,00","s-valor");
    const lista=s.tipo==="fixo"?"fixos":"rendas";
    const d=s.tipo==="fixo"?{nome,valor:v,dia:Math.min(31,Math.max(1,Math.round(Number(val("s-diafixo"))||1))),cat:radio("s-cat")||"",forma:radio("s-forma")||"boleto",desde:val("s-desde")||k}:{nome,valor:v,desde:val("s-desde")||k};
    if(s.id) Object.assign(itemAtual(),d); else state.config[lista].push(Object.assign({id:(s.tipo==="fixo"?"f":"r")+uidGen(),ate:null},d));
    save("config"); closeSheet(); render(); toast(s.id?"Atualizado.":(s.tipo==="fixo"?"Conta fixa criada. Ela entra sozinha todo mês.":"Renda fixa criada. Ela entra sozinha todo mês.")); return;
  }
  if(s.tipo==="parcela"){
    const n=Math.round(Number(val("s-n"))||0); if(!(v>0)) return erroSheet("Digite o valor total da compra","s-valor"); if(n<2||n>48) return erroSheet("Escolha de 2 a 48 parcelas","s-n");
    const cat=radio("s-cat"); if(!cat) return erroSheet("Escolha uma categoria para a compra.");
    const vc=Math.round(Number(val("s-venc"))||0), it=itemAtual();
    Object.assign(it,{total:v,n,desc,cat,forma:radio("s-forma")||"credito"}); if(vc>=1&&vc<=31) it.venc=vc; save("config");
    const sw=document.getElementById("s-ppago"); if(sw){ marcaPago("parc",it.id,k,sw.checked,true); }
    closeSheet(); render(); toast("Compra parcelada atualizada."); return;
  }
  if(!(v>0)) return erroSheet("Digite um valor maior que zero, ex.: 25,90","s-valor");
  const m=getMonth(k);
  if(s.tipo==="gasto"){
    const cat=radio("s-cat"), forma=radio("s-forma")||"";
    if(!cat) return erroSheet("Escolha uma categoria para esta despesa.");
    ui.gCat=cat; if(forma){ ui.gForma=forma; try{localStorage.setItem("meucaixa.ui.forma",forma)}catch(e){} }
    if(s.id){ const it=itemAtual(); Object.assign(it,{valor:v,cat,dia,desc,forma}); const sw=document.getElementById("s-gpago");
      if(forma!=="credito"){ delete it.pago; delete it.pagoEm; } else if(sw&&sw.checked!==!!it.pago){ it.pago=sw.checked; if(sw.checked){ const h=new Date(); it.pagoEm=h.getFullYear()+"-"+pad2(h.getMonth()+1)+"-"+pad2(h.getDate()); } else delete it.pagoEm; }
      save(k); closeSheet(); render(); toast("Despesa atualizada."); return; }
    const parc=document.getElementById("s-parc"), n=Math.round(Number(val("s-n"))||0);
    if(parc&&parc.checked){
      if(n<2||n>48) return erroSheet("Escolha de 2 a 48 parcelas","s-n");
      const vc=Math.round(Number(val("s-venc"))||dia);
      const p={id:"p"+uidGen(),desc,cat,forma:forma||"credito",total:v,n,compra:k,dia,venc:vc>=1&&vc<=31?vc:dia};
      state.config.parcelas.push(p); save("config");
      const fim=()=>toast(n+"x de "+brl(v/n)+" lançado.","Desfazer",()=>apagarItem("config","parcelas",p.id,"Compra parcelada desfeita."));
      if(outro){ ui.sheet={tipo:"gasto",id:null,mes:s.mes}; renderSheet(); document.getElementById("s-valor").focus(); render(); fim(); } else { closeSheet(); render(); fim(); }
      return;
    }
    const novo={id:uidGen(),dia,cat,valor:v,desc,forma}; m.gastos.push(novo); save(k);
    const msg=brl(v)+" em "+catName(cat)+" lançado"+(noCartao(novo)?" (fatura de "+abrMes(faturaMes(k,dia))+").":".");
    const fim=()=>toast(msg,"Desfazer",()=>apagarItem(k,"gastos",novo.id,"Lançamento desfeito."));
    if(outro){ ui.sheet={tipo:"gasto",id:null,mes:s.mes}; renderSheet(); document.getElementById("s-valor").focus(); render(); fim(); } else { closeSheet(); render(); fim(); }
    return;
  }
  if(s.tipo==="avulso"){
    const rep=document.getElementById("s-repete");
    if(rep&&rep.checked){ state.config.rendas.push({id:"r"+uidGen(),nome:desc||"Renda fixa",valor:v,desde:k,ate:null}); save("config"); closeSheet(); render(); toast("Renda fixa criada a partir de "+abrMes(k)+"."); return; }
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
    const b=e.target.closest("[data-sexcluirfixo],[data-sfechar],[data-sapagar],[data-sencerrar],[data-spular],[data-sabrir],[data-outro],[data-sres],[data-snovacat],[data-scriacat]");
    if(!b) return;
    if(b.dataset.sfechar!==undefined){ if(e.target===b||b.tagName==="BUTTON") closeSheet(); return; }
    const s=ui.sheet, k=mesSheet();
    if(b.dataset.outro){ e.preventDefault(); salvarSheet(true); return; }
    if(b.dataset.sexcluirfixo){ const id=s.id, apartir=b.dataset.sexcluirfixo==="todos"?null:(s.tipo==="fixoMes"||ui.tab==="mes"?k:todayKey); closeSheet(); excluirFixo(id,apartir); return; }
    if(b.dataset.snovacat){ const bx=document.getElementById("s-novacatbox"); bx.hidden=!bx.hidden; if(!bx.hidden) document.getElementById("s-novacat").focus(); return; }
    if(b.dataset.scriacat){ const inp=document.getElementById("s-novacat"), nome=(inp.value||"").trim(); if(!nome){ inp.focus(); return; }
      const usadas=new Set(state.config.categorias.map(corIdx)), cor=[...Array(NCORES).keys()].find(i=>!usadas.has(i))??0;
      const nova={id:"c"+uidGen(),nome,orcamento:0,cor}; state.config.categorias.push(nova); save("config");
      const valor=(document.getElementById("s-valor")||{}).value, desc=(document.getElementById("s-desc")||{}).value, forma=(document.querySelector('#sheet input[name="s-forma"]:checked')||{}).value, dia=(document.getElementById("s-dia")||{}).value;
      ui.gCat=nova.id; renderSheet();
      if(valor!=null) document.getElementById("s-valor").value=valor; if(desc!=null&&document.getElementById("s-desc")) document.getElementById("s-desc").value=desc; if(dia&&document.getElementById("s-dia")) document.getElementById("s-dia").value=dia; if(forma){ const f=document.getElementById("s-fm-"+forma); if(f) f.checked=true; }
      const r2=document.getElementById("s-cat-"+nova.id); if(r2) r2.checked=true; render(); toast("Categoria "+nome+" criada."); return; }
    if(b.dataset.sres){ const t=b.dataset.sres, id=b.dataset.id, mes=b.dataset.mes; closeSheet(); ui.tab=t==="fixo"?"ajustes":"mes";
      if(t!=="fixo"&&t!=="parcela"&&mes){ ui.month=mes; render(); openSheet(t,id); } else { render(); openSheet(t,id); } return; }
    if(b.dataset.sapagar){
      const id=s.id; closeSheet();
      if(s.tipo==="parcela") apagarItem("config","parcelas",id,"Compra parcelada apagada.");
      else if(s.tipo==="categoria") apagarItem("config","categorias",id,"Categoria excluída.");
      else apagarItem(k,s.tipo==="gasto"?"gastos":s.tipo==="avulso"?"avulsos":"caixinha",id,"Lançamento apagado.");
      return;
    }
    if(b.dataset.sencerrar){
      const lista=b.dataset.sencerrar, id=s.id, ate=shiftKey(todayKey,-1); closeSheet();
      const f=state.config[lista].find(x=>x.id===id); if(!f) return; const antes=clone(f);
      if(f.desde>ate){ apagarItem("config",lista,id,(lista==="fixos"?"Conta fixa":"Renda fixa")+" removida."); return; }
      f.ate=ate; save("config"); render();
      toast((lista==="fixos"?"Conta":"Renda")+" encerrada a partir de "+abrMes(todayKey)+".","Desfazer",()=>{ const g=state.config[lista].find(x=>x.id===id); if(g) g.ate=antes.ate; save("config"); render(); toast("Desfeito."); });
      return;
    }
    if(b.dataset.spular){ const mapa=b.dataset.spular, m=getMonth(k), o=Object.assign({},m[mapa][s.id]||{}); o.pular=!o.pular; if(o.pular) o.pago=false; m[mapa][s.id]=o; save(k); closeSheet(); render(); toast(o.pular?"Pulado em "+abrMes(k)+".":"Volta a contar em "+abrMes(k)+"."); return; }
    if(b.dataset.sabrir){ openSheet(b.dataset.sabrir,s.id); return; }
  });
  r.addEventListener("input",e=>{ if(e.target.id==="s-busca") atualizaBusca(); if(["s-valor","s-n"].includes(e.target.id)) atualizaParc(); });
  r.addEventListener("change",e=>{
    if(e.target.name==="s-tipo"){ const v=(document.getElementById("s-valor")||{}).value||""; ui.sheet={tipo:e.target.value,id:null,valorRasc:v,mes:ui.sheet.mes}; renderSheet(); const f=document.querySelector("#sheet [data-autofocus]"); if(f) f.focus(); return; }
    if(e.target.id==="s-parc"||e.target.name==="s-forma"||e.target.id==="s-dia") atualizaParc();
  });
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
  if(d.edit){ openSheet(d.edit,d.id,d.mes?{mes:d.mes}:null); return; }
  if(d.busca){ openSheet("busca"); return; }
  if(d.planilha){ exportarPlanilha(); return; }
  if(d.copialink){ const u=location.href; (navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>toast("Link copiado. Cole no Chrome ou Safari.")).catch(()=>prompt("Copie o link:",u)); return; }
  if(d.apagar==="pedir"){ ui.confirmaApagar=true; render(); const el=document.getElementById("txtApagar"); if(el) el.focus(); return; }
  if(d.apagar==="nao"){ ui.confirmaApagar=false; render(); return; }
  if(d.apagar==="sim"){ const el=document.getElementById("txtApagar"); if(!el||el.value.trim().toUpperCase()!=="APAGAR"){ toast("Digite APAGAR para confirmar."); if(el) el.focus(); return; } apagarTudo(); return; }
  if(d.delfixo){ excluirFixo(d.delfixo,ui.month); return; }
  if(d.pago){ const o=getMonth(ui.month).fixos[d.pago]||{}; marcaPago("fixo",d.pago,ui.month,!o.pago); return; }
  if(d.gpago){ const g=getMonth(d.mes||ui.month).gastos.find(x=>x.id===d.gpago); if(g) marcaGastoPago(d.mes||ui.month,d.gpago,!g.pago); return; }
  if(d.pagar){ const [t,id,k]=d.pagar.split("|"); let atual=false; const m=getMonth(k);
    if(t==="fat") atual=m.faturaPaga; else atual=!!((m[t==="fixo"?"fixos":"parcelas"][id]||{}).pago);
    marcaPago(t,id,k,!atual); return; }
  if(d.calendario){ exportarCalendario(); return; }
  if(d.delcat){ apagarItem("config","categorias",d.delcat,"Campo retirado."); return; }
  if(d.addcat){ const id="c"+uidGen(); state.config.categorias.push({id,nome:"Novo gasto",orcamento:0}); save("config"); render(); const el=document.getElementById("cn-"+id); if(el){ el.focus(); el.select(); } return; }
});
app.addEventListener("change",e=>{
  const t=e.target, money=()=>t.value.trim()===""?0:parseMoney(t.value);
  if(t.name==="ptema"){ tema=t.value; try{localStorage.setItem("meucaixa.tema",tema)}catch(e){} aplicaTema(); render(); return; }
  if(t.name==="lmodo"){ ui.loginModo=t.value; render(); return; }
  if(t.id==="impFile"&&t.files&&t.files[0]){ importar(t.files[0]); return; }
  if(t.id==="fatPaga"){ marcaPago("fat","fatura",ui.month,t.checked); return; }
  if(t.id==="notifOn"){ ligaNotif(t.checked); return; }
  if(t.id==="ccFecha"||t.id==="ccVence"){ const n=Math.round(Number(t.value)); state.config.cartao=Object.assign({fecha:null,vence:null},state.config.cartao); state.config.cartao[t.id==="ccFecha"?"fecha":"vence"]=n>=1&&n<=31?n:null; save("config"); render(); if(cartaoAtivo()) toast("Cartão configurado: compras no crédito contam no mês da fatura."); return; }
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
  else if(e.key==="/"){ e.preventDefault(); openSheet("busca"); }
  else if(e.key==="ArrowLeft") passo(-1);
  else if(e.key==="ArrowRight") passo(1);
});
/* deslizar para os lados troca o mês (celular) */
let tx=null, ty=null;
app.addEventListener("touchstart",e=>{ if(ui.tab!=="mes"||ui.sheet||e.touches.length!==1||e.target.closest(".chips,.tablewrap,input,select,.cats")){ tx=null; return; } tx=e.touches[0].clientX; ty=e.touches[0].clientY; },{passive:true});
app.addEventListener("touchend",e=>{ if(tx===null) return; const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty; tx=null;
  if(Math.abs(dx)>70&&Math.abs(dy)<45){ if(passo(dx<0?1:-1)){ app.classList.remove("slide-l","slide-r"); void app.offsetWidth; app.classList.add(dx<0?"slide-l":"slide-r"); } } },{passive:true});

setTimeout(()=>{ try{ const v=localStorage.getItem("mb.versao"); if(v&&v!==VERSAO&&mode!=="login") toast("MB Controle atualizado para a versão "+VERSAO+". Veja as novidades no Perfil."); localStorage.setItem("mb.versao",VERSAO); }catch(e){} },2500);
setInterval(()=>verificaLembretes(true),30*60000);
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible"){ verificaLembretes(true); if(ui.tab==="mes"&&!ui.sheet) render(); } });
/* quando o mês do calendário virar com o app aberto, atualiza sozinho */
setInterval(()=>{ const d=new Date(); if(keyOf(d.getFullYear(),d.getMonth()+1)!==todayKey&&!ui.sheet&&!dirty.size) location.reload(); },60000);

render();
init();
})();

/* o service worker é registrado no index.html */
