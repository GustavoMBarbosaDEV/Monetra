// @ts-check
// Ajudantes de meses, dinheiro e texto, e a máscara dos campos de valor.
"use strict";

const pad2=n=>String(Math.trunc(Number(n))||0).padStart(2,"0");
const keyOf=(y,m)=>y+"-"+pad2(m);
function shiftKey(k,n){ let y=+k.slice(0,4), m=+k.slice(5)+n; while(m>12){m-=12;y++;} while(m<1){m+=12;y--;} return keyOf(y,m); }
const kY=k=>+k.slice(0,4), kM=k=>+k.slice(5);
const diasMes=k=>new Date(kY(k),kM(k),0).getDate();
const nomeMes=k=>NOMES[kM(k)-1]+" "+kY(k);
const abrMes=k=>ABR[kM(k)-1].toLowerCase()+"/"+String(kY(k)).slice(2);
const brl=v=>(Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const valorGrande=v=>{ const t=brl(v), m=t.match(/^(-?)\s*R\$\s*([\d.]+)(,\d{2})$/); if(!m) return esc(t); return `<span class="sr">${esc(t.replace(/\s/g," "))}</span><span aria-hidden="true">${m[1]}<span class="vg-rs">R$</span>${m[2]}<span class="vg-cs">${m[3]}</span></span>`; };
const brlT=v=>(Number(v)||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const uidGen=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
const formaNome=f=>(FORMAS.find(x=>x[0]===f)||[null,"Não informado"])[1];
const IR_TIPOS=[["saude","Saúde"],["educacao","Educação"],["previdencia","Previdência privada (PGBL)"],["pensao","Pensão alimentícia"],["doacao","Doações incentivadas"],["outro","Outra dedução"]], IR_IDS=IR_TIPOS.map(x=>x[0]);
/**
 * @param {number} total
 * @param {number} n
 * @param {number} i
 * @returns {number}
 */
function valorParcela(total,n,i){ const c=Math.round((Number(total)||0)*100), b=Math.floor(c/n); return (i===n-1?c-b*(n-1):b)/100; }
function faltaParcelas(total,n,idx){ const c=Math.round((Number(total)||0)*100), b=Math.floor(c/n); return Math.max(0,c-b*(idx-1))/100; }
/**
 * @param {string|number|null|undefined} s
 * @returns {number}
 */
function parseMoney(s){
  s=String(s||"").replace(/R\$|\s/g,"");
  if(!s) return NaN;
  if(s.includes(",")) s=s.replace(/\./g,"").replace(",",".");
  else if(/^-?\d{1,3}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,"");
  const n=Number(s); return isFinite(n)?Math.round(n*100)/100:NaN;
}
const moneyInput=v=>(v===null||v===undefined||v===""||!Number(v))?"":Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const ehCampoDinheiro=el=>el&&el.tagName==="INPUT"&&el.closest(".money");
document.addEventListener("focusin",e=>{ const el=e.target; if(ehCampoDinheiro(el)&&el.value) setTimeout(()=>{ try{ el.select(); }catch(_){} },0); });
function mascaraDinheiro(el){
  const bruto=el.value, neg=!!el.dataset.neg&&bruto.includes("-"), todos=bruto.replace(/\D/g,""), dig=todos.replace(/^0+/,"").slice(0,13);
  el.value=dig?(neg?"-":"")+(Number(dig)/100).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}):(todos?"0,00":(neg?"-":""));
  try{ const n=el.value.length; el.setSelectionRange(n,n); }catch(_){}
}
document.addEventListener("input",e=>{ const el=e.target; if(ehCampoDinheiro(el)) mascaraDinheiro(el); if(el.id==="s-valor"&&document.getElementById("s-vgon")) setTimeout(()=>{ try{ atualizaVg(); }catch(_){} },0); },true);
document.addEventListener("paste",e=>{ const el=e.target; if(!ehCampoDinheiro(el)) return; const t=(e.clipboardData||window.clipboardData)?.getData("text")||""; let v=parseMoney(t); e.preventDefault(); if(isNaN(v)) return; if(v<0&&!el.dataset.neg) v=-v; el.value=v===0?"0,00":(v<0?"-":"")+moneyInput(Math.abs(v)); el.dispatchEvent(new Event("input",{bubbles:true})); },true);
document.addEventListener("blur",e=>{ const el=e.target; if(!ehCampoDinheiro(el)||!el.value.trim()) return; const v=parseMoney(el.value); if(v>0) el.value=moneyInput(v); else if(v<0&&el.dataset.neg) el.value="-"+moneyInput(-v); },true);
