// @ts-check
// Limpeza dos dados lidos, categorias, subcategorias e etiquetas.
"use strict";
/**
 * @param {any} x
 * @returns {Gasto|null}
 */
function limpaItem(x){
  if(!x||typeof x!=="object"||Array.isArray(x)) return null;
  const o=Object.assign({},x);
  o.id=String(x.id!=null?x.id:uidGen()); o.dia=Math.min(31,Math.max(1,Math.round(Number(x.dia))||1)); o.valor=Number(x.valor)||0; o.desc=x.desc==null?"":String(x.desc);
  ["cat","forma","contaId","cartaoId","sub","metaId","tipo","de","para","por","pagou","imp","viagemId"].forEach(k=>{ if(k in o){ if(o[k]==null) delete o[k]; else o[k]=String(o[k]); } });
  if("tags" in o){ if(Array.isArray(o.tags)) o.tags=[...new Set(o.tags.map(t=>String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9_-]+/g,"").slice(0,24)).filter(Boolean))].slice(0,10); else delete o.tags; }
  if("pagoEm" in o&&!(typeof o.pagoEm==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(o.pagoEm))) delete o.pagoEm;
  if("pago" in o) o.pago=!!o.pago;
  if("ir" in o&&!IR_IDS.includes(o.ir)) delete o.ir;
  if("orig" in o){ const g=o.orig; if(g&&typeof g==="object"&&/^[A-Z]{3}$/.test(g.moeda||"")) o.orig={moeda:g.moeda,valor:Number(g.valor)||0,cotacao:Number(g.cotacao)||0,taxa:Number(g.taxa)||0}; else delete o.orig; }
  return o;
}
const listaLimpa=a=>Array.isArray(a)?a.map(limpaItem).filter(Boolean):[];
const mesValido=k=>typeof k==="string"&&/^\d{4}-(0[1-9]|1[0-2])$/.test(k);
/**
 * @param {any} d
 * @returns {Mes}
 */
function normMonth(d){
  return {salario:(typeof d?.salario==="number"&&isFinite(d.salario))?d.salario:null,
    avulsos:listaLimpa(d?.avulsos),
    gastos:listaLimpa(d?.gastos),
    caixinha:listaLimpa(d?.caixinha),
    fixos:(d&&typeof d.fixos==="object"&&!Array.isArray(d.fixos))?d.fixos:{},
    rendas:(d&&typeof d.rendas==="object"&&!Array.isArray(d.rendas))?d.rendas:{},
    parcelas:(d&&typeof d.parcelas==="object"&&!Array.isArray(d.parcelas))?d.parcelas:{},
    faturasPagas:(d&&typeof d.faturasPagas==="object"&&!Array.isArray(d.faturasPagas))?d.faturasPagas:{},
    transf:listaLimpa(d?.transf),
    faturaPaga:!!(d&&d.faturaPaga)};
}
/**
 * @param {any} d
 * @returns {Config}
 */
function normConfig(d){
  const ate=(typeof d?.ate==="string"&&/^\d{4}-\d{2}$/.test(d.ate)&&d.ate>=INICIO&&d.ate<=LIMITE_ATE)?d.ate:PADRAO_ATE;
  const cats=Array.isArray(d?.categorias)&&d.categorias.some(c=>c&&typeof c==="object")?d.categorias.filter(c=>c&&typeof c==="object").map(c=>({id:String(c.id),nome:String(c.nome||""),orcamento:Number(c.orcamento)||0,cor:(typeof c.cor==="number"&&c.cor>=0&&c.cor<12)?c.cor:null,ic:typeof c.ic==="string"&&/^[a-z]{2,12}$/.test(c.ic)?c.ic:null,sobra:c.sobra===true,sobraDesde:typeof c.sobraDesde==="string"&&/^\d{4}-(0[1-9]|1[0-2])$/.test(c.sobraDesde)?c.sobraDesde:null,palavras:Array.isArray(c.palavras)?c.palavras.filter(x=>typeof x==="string"&&x.trim()).map(x=>x.trim().slice(0,30)).slice(0,40):[],subs:Array.isArray(c.subs)?c.subs.filter(x=>x&&x.id&&x.nome).map(x=>({id:String(x.id),nome:String(x.nome)})):[]})):defaultConfig().categorias;
  const fixos=Array.isArray(d?.fixos)?d.fixos.filter(f=>f&&typeof f==="object").map(f=>({id:String(f.id),nome:String(f.nome||"Conta fixa"),cat:String(f.cat||""),valor:Number(f.valor)||0,dia:Math.min(31,Math.max(1,Number(f.dia)||1)),forma:String(f.forma||"boleto"),desde:/^\d{4}-\d{2}$/.test(f.desde||"")?f.desde:INICIO,ate:/^\d{4}-\d{2}$/.test(f.ate||"")?f.ate:null,contaId:f.contaId?String(f.contaId):null})):[];
  const inicio=(typeof d?.inicio==="string"&&/^\d{4}-\d{2}$/.test(d.inicio))?d.inicio:null;
  const mk=x=>/^\d{4}-\d{2}$/.test(x||"");
  const parcelas=Array.isArray(d?.parcelas)?d.parcelas.filter(p=>p&&p.id).map(p=>({por:p.por?String(p.por):null,pagou:p.pagou?String(p.pagou):null,ir:IR_IDS.includes(p.ir)?p.ir:null,viagemId:p.viagemId?String(p.viagemId):null,orig:p.orig&&/^[A-Z]{3}$/.test(p.orig.moeda||"")?{moeda:p.orig.moeda,valor:Number(p.orig.valor)||0,cotacao:Number(p.orig.cotacao)||0,taxa:Number(p.orig.taxa)||0}:null,sub:p.sub?String(p.sub):null,tags:Array.isArray(p.tags)?p.tags.map(String).slice(0,10):[],id:String(p.id),desc:String(p.desc||""),cat:String(p.cat||""),forma:String(p.forma||"credito"),total:Number(p.total)||0,n:Math.min(48,Math.max(2,Math.round(Number(p.n)||2))),compra:mk(p.compra)?p.compra:INICIO,dia:Math.min(31,Math.max(1,Number(p.dia)||1)),venc:(Number(p.venc)>=1&&Number(p.venc)<=31)?Math.round(Number(p.venc)):null,contaId:p.contaId?String(p.contaId):null,cartaoId:p.cartaoId?String(p.cartaoId):null})):[];
  const rendas=Array.isArray(d?.rendas)?d.rendas.filter(r=>r&&r.id).map(r=>({id:String(r.id),nome:String(r.nome||"Renda fixa"),valor:Number(r.valor)||0,dia:Math.min(31,Math.max(1,Math.round(Number(r.dia))||1)),desde:mk(r.desde)?r.desde:INICIO,ate:mk(r.ate)?r.ate:null,contaId:r.contaId?String(r.contaId):null})):[];
  const dd=n=>{ n=Math.round(Number(n)); return n>=1&&n<=31?n:null; };
  let cartoes=Array.isArray(d?.cartoes)?d.cartoes.filter(c=>c&&c.id).map(c=>({id:String(c.id),nome:String(c.nome||"Cartão"),fecha:dd(c.fecha),vence:dd(c.vence),limite:Number(c.limite)||0,contaId:c.contaId?String(c.contaId):null})):[];
  if(!cartoes.length&&dd(d?.cartao?.fecha)&&dd(d?.cartao?.vence)) cartoes=[{id:"k1",nome:"Cartão",fecha:dd(d.cartao.fecha),vence:dd(d.cartao.vence),limite:0,contaId:null}];
  const contas=Array.isArray(d?.contas)?d.contas.filter(c=>c&&c.id).map(c=>({id:String(c.id),nome:String(c.nome||"Conta"),tipo:String(c.tipo||"corrente"),saldoInicial:Number(c.saldoInicial)||0})):[];
  const contaSalario=d?.contaSalario&&contas.some(c=>c.id===d.contaSalario)?String(d.contaSalario):null;
  const metas=Array.isArray(d?.metas)?d.metas.filter(x=>x&&x.id).map(x=>({id:String(x.id),nome:String(x.nome||"Meta"),alvo:Number(x.alvo)||0,prazo:mk(x.prazo)?x.prazo:null})):[];
  const iso=x=>/^\d{4}-\d{2}-\d{2}$/.test(x||"")?x:null;
  const dividas=Array.isArray(d?.dividas)?d.dividas.filter(x=>x&&x.id).map(x=>({id:String(x.id),pessoa:String(x.pessoa||"Alguém"),tipo:x.tipo==="pagar"?"pagar":"receber",valor:Number(x.valor)||0,desc:String(x.desc||""),data:iso(x.data),venc:iso(x.venc),pags:Array.isArray(x.pags)?x.pags.filter(y=>y&&y.id).map(y=>({id:String(y.id),valor:Number(y.valor)||0,data:iso(y.data)})):[]})):[];
  const viagens=Array.isArray(d?.viagens)?d.viagens.filter(x=>x&&x.id).map(x=>({id:String(x.id),nome:String(x.nome||"Viagem"),moeda:/^[A-Z]{3}$/.test(x.moeda||"")?x.moeda:"USD",cotacao:Number(x.cotacao)>0?Number(x.cotacao):1,taxa:Math.max(0,Number(x.taxa)||0),inicio:iso(x.inicio),fim:iso(x.fim),orcamento:Math.max(0,Number(x.orcamento)||0)})):[];
  const desafios=Array.isArray(d?.desafios)?d.desafios.filter(x=>x&&x.id&&iso(x.inicio)).map(x=>({id:String(x.id),nome:String(x.nome||"Desafio").slice(0,50),tipo:x.tipo==="max"?"max":"sem",cat:x.cat?String(x.cat):null,palavras:String(x.palavras||"").slice(0,80),dias:Math.min(365,Math.max(1,Math.round(Number(x.dias)||30))),inicio:x.inicio,valor:Number(x.valor)>0?Number(x.valor):0})):[];
  const termos=d?.termos&&typeof d.termos.v==="string"?{v:d.termos.v,em:String(d.termos.em||"")}:null;
  const sd=d?.salarioDia, salarioDia=sd&&typeof sd==="object"&&!Array.isArray(sd)?{tipo:["util","fixo","quinz"].includes(sd.tipo)?sd.tipo:"util",dia:Math.min(31,Math.max(1,Math.round(Number(sd.dia))||5)),dia2:Math.min(31,Math.max(1,Math.round(Number(sd.dia2))||20)),off:sd.off===true}:null;
  return {desafios, viagens, dividas, termos, salarioPadrao:Number(d?.salarioPadrao)||0, saldoInicial:Number(d?.saldoInicial)||0, saldoCaixinha:Number(d?.saldoCaixinha)||0, ate, inicio, categorias:cats, fixos, parcelas, rendas, cartoes, contas, contaSalario, salarioDia, metas};
}
function getMonth(k){ if(!state.months[k]) state.months[k]=normMonth({}); else state.months[k]=Object.assign(normMonth({}),state.months[k]); return state.months[k]; }
const catIndex=id=>state.config.categorias.findIndex(c=>c.id===id);
const NCORES=12;
const corIdx=ct=>{ const i=state.config.categorias.indexOf(ct); return (typeof ct.cor==="number"&&ct.cor>=0&&ct.cor<NCORES)?ct.cor:(i%NCORES); };
const catColor=id=>{ const ct=state.config.categorias.find(c=>c.id===id); return ct?"var(--c"+corIdx(ct)+")":"var(--c8)"; };
const subName=(cat,sub)=>{ if(!sub) return ""; const ct=state.config.categorias.find(c=>c.id===cat); const x=ct&&(ct.subs||[]).find(y=>y.id===sub); return x?x.nome:""; };
const normTag=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/^#+/,"").replace(/[^a-z0-9_-]+/g,"").slice(0,24);
const lerTags=txt=>[...new Set(String(txt||"").split(/[\s,;]+/).map(normTag).filter(Boolean))].slice(0,10);
const tagsTxt=g=>(g.tags&&g.tags.length?" · "+g.tags.map(t=>"#"+t).join(" "):"");
const extraTxt=g=>{ const sn=subName(g.cat,g.sub); return (g.orig&&g.orig.moeda!=="BRL"?" · "+fmtMoeda(g.orig.valor,g.orig.moeda):"")+(sn?" · "+sn:"")+tagsTxt(g); };
function todasTags(){ const c={}; Object.values(state.months).forEach(m=>(m.gastos||[]).forEach(g=>(g.tags||[]).forEach(t=>c[t]=(c[t]||0)+1))); state.config.parcelas.forEach(pp=>(pp.tags||[]).forEach(t=>c[t]=(c[t]||0)+1)); return Object.entries(c).sort((a,b)=>b[1]-a[1]).map(x=>x[0]); }
const catName=id=>{ const c=state.config.categorias.find(c=>c.id===id); return c?c.nome:"Sem categoria"; };
