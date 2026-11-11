// @ts-check
// Dicas de cada tela e barra do saldo no topo.
"use strict";
const DICAS={mes:"Segure o <b>+</b> para lançar receita, transferência ou por voz. Deslize a tela para os lados para trocar o mês, e um lançamento para apagar ou repetir.",
  ano:"Aqui ficam os meses lado a lado, o resumo do <b>Imposto de Renda</b>, sua <b>inflação pessoal</b> e as assinaturas que ficaram mais caras. Deslize para os lados para trocar de aba.",
  metas:"O quadro <b>Quanto renderia</b> mostra o rendimento da caixinha e das metas no CDI e na poupança. A taxa pode ser mudada lá.",
  perfil:"Aqui ficam seus dados, a acessibilidade, as notificações e o tutorial. Deslize para os lados para trocar de aba.",
  ajustes:"Categorias, cartões, contas e regras automáticas ficam aqui. Use a <b>busca</b> no topo para achar qualquer ajuste."};
/** @type {Object<string,number>} */
let dicasVistas={}; try{ dicasVistas=JSON.parse(localStorage.getItem("mb.dicas")||"{}")||{}; }catch(e){}
function dicaTela(){ if(mode==="login"||precisaTermos()||ui.lerTermos||!tutVisto()||tutAberto||dicasVistas[ui.tab]||!DICAS[ui.tab]) return "";
  return `<div class="dicatela" role="note" aria-label="Dica"><span class="dt-ic" aria-hidden="true">${icq("estrela",18)}</span><p>${DICAS[ui.tab]}</p><button type="button" class="btn mini" data-dicaok="${ui.tab}">Entendi</button></div>`; }
/**
 * @param {string} t
 * @param {Element} b
 */
function fechaDica(t,b){ dicasVistas[t]=1; try{ localStorage.setItem("mb.dicas",JSON.stringify(dicasVistas)); }catch(e){}
  const el=b&&b.closest(".dicatela"), fim=()=>{ if(el) el.remove(); posicionaBanda(); const m=document.getElementById("conteudo"); if(m) m.focus({preventScroll:true}); };
  anunciar("Dica fechada."); if(!el||semMovimento()){ fim(); return; } el.classList.add("sai"); setTimeout(fim,200); }
function barraTopo(){ if(mode==="login"||!state.loaded||precisaTermos()) return "";
  const c=ui.tab==="mes"?calc(ui.month):null, t=c?"Saldo de "+NOMES[kM(ui.month)-1].toLowerCase():nomeAba();
  return `<button type="button" class="barsaldo" id="barsaldo" data-topo="1" aria-hidden="true" tabindex="-1" aria-label="${esc(t+(c?": "+brl(c.saldo):"")+". Voltar ao topo")}"><img src="icons/marca.png" alt="" width="22" height="18"><span class="bs-t">${esc(t)}</span>${c?`<b class="bs-v ${c.saldo<0?"neg":""}">${brl(c.saldo)}</b>`:""}<span class="bs-up">${icq("seta-cima",16)}</span></button>`; }
let rafTopo=0;
function checaTopo(){ const b=document.getElementById("barsaldo"); if(!b) return; const ref=document.querySelector("#app .heroSaldo")||document.getElementById("topo");
  const on=!!ref&&window.scrollY>60&&ref.getBoundingClientRect().bottom<0; if(on===b.classList.contains("on")) return;
  b.classList.toggle("on",on); b.setAttribute("aria-hidden",String(!on)); b.tabIndex=on?0:-1; }
window.addEventListener("scroll",()=>{ if(!rafTopo) rafTopo=requestAnimationFrame(()=>{ rafTopo=0; checaTopo(); }); },{passive:true});

