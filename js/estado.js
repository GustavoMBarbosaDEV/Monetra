// @ts-check
// Estado do app: configuração, meses carregados e preferências da tela.
"use strict";
/** @returns {Config} */
function defaultConfig(){ return {desafios:[],viagens:[],dividas:[],termos:null,salarioPadrao:0,saldoInicial:0,saldoCaixinha:0,ate:PADRAO_ATE,inicio:null,parcelas:[],rendas:[],metas:[],cartoes:[],contas:[],contaSalario:null,salarioDia:null,categorias:DEFAULT_CATS.map((n,i)=>({id:"c"+(i+1),nome:n,orcamento:0})),fixos:[]}; }
/** @type {{config:Config, months:Object<string,Mes>, loaded:boolean}} */
const state={config:defaultConfig(), months:{}, loaded:false};
let MESES=[];
const today=new Date();
const todayKey=keyOf(today.getFullYear(),today.getMonth()+1);
function buildMeses(){ MESES=[]; const fim=state.loaded?fimMeses():shiftKey(todayKey,2); let k=INICIO; while(k<=fim){ MESES.push(k); k=shiftKey(k,1); } }
function fimMeses(){ let fim=shiftKey(todayKey,2);
  try{ for(const p of state.config.parcelas||[]){ if(!p||!p.compra) continue; const cc=p.forma==="credito"?cartaoDe(p):null; const prim=cartaoOk(cc)?faturaMes(p.compra,p.dia,cc):p.compra; const u=shiftKey(prim,Math.max(1,Number(p.n)||1)-1); if(u>fim) fim=u; } }catch(e){}
  return fim>LIMITE_ATE?LIMITE_ATE:fim; }
function temContaNoMes(k){ try{ return parcelasDoMes(k).length>0||soma(faturaDoMes(k))>0; }catch(e){ return false; } }
function chipsMes(){
  const V=mesesVisiveis(), prev=shiftKey(todayKey,-1), max=4;
  let out=[prev,todayKey].filter(k=>V.includes(k));
  V.filter(k=>k>todayKey&&temContaNoMes(k)).forEach(k=>{ if(out.length<max) out.push(k); });
  V.filter(k=>k>todayKey).forEach(k=>{ if(out.length<max&&!out.includes(k)) out.push(k); });
  V.filter(k=>k<prev).reverse().forEach(k=>{ if(out.length<max) out.unshift(k); });
  out=[...new Set(out)].sort();
  if(ui.month&&V.includes(ui.month)&&!out.includes(ui.month)){
    out.push(ui.month); out.sort();
    while(out.length>max){ let far=-1, dist=-1; out.forEach((k,i)=>{ if(k===ui.month||k===todayKey) return; const d=Math.abs(entre(k,ui.month)); if(d>dist){ dist=d; far=i; } }); if(far<0) break; out.splice(far,1); }
  }
  return out;
}
function mesesVisiveis(){
  const comDados=Object.keys(state.months).filter(k=>{ const m=state.months[k]; return m&&((m.gastos&&m.gastos.length)||(m.avulsos&&m.avulsos.length)||(m.caixinha&&m.caixinha.length)||typeof m.salario==="number"); });
  const de=[inicioKey(),todayKey,...comDados].filter(Boolean).sort()[0];
  return MESES.filter(k=>k>=de);
}

/** @type {UI} */
const ui={abre:(()=>{ try{ const x=JSON.parse(localStorage.getItem("mb.abre")||"{}"); return x&&typeof x==="object"&&!Array.isArray(x)?x:{}; }catch(e){ return {}; } })(),tab:"mes",month:null,sheet:null,importMsg:"",loginModo:"entrar",gCat:null,gForma:"pix",filtro:""};
let mode="loading", uid=null, statusTxt="Carregando…", statusCls="";
buildMeses();
ui.month=todayKey;
try{ ui.gForma=localStorage.getItem("meucaixa.ui.forma")||"pix"; }catch(e){}

