// @ts-check
// Desenho da tela e anúncios para leitor de tela.
"use strict";
function render(){
  if(state.loaded) buildMeses();
  if(mode!=="loading") tiraBoot();
  const a=document.activeElement, inApp=a&&document.getElementById("app").contains(a);
  const fid=inApp&&a.id, sel=(fid&&"selectionStart" in a)?[a.selectionStart,a.selectionEnd]:null;
  const app=document.getElementById("app");
  const corpo=mode==="login"?(ui.lerTermos?viewTermos(false):mostraApresentacao()?viewApresentacao():viewLogin()):!state.loaded?esqueleto():precisaTermos()?viewTermos(true):ui.lerTermos?viewTermos(false):ui.tab==="mes"?viewMes():ui.tab==="ano"?viewAno():ui.tab==="metas"?viewMetas():ui.tab==="perfil"?perfilComIcones():viewAjustes();
  const rolY=window.scrollY;
  const vista=[mode,state.loaded,ui.tab,ui.month,typeof aberto==="undefined"?"":aberto].join("|"), novaVista=vista!==ultimaVista;
  const novaTela=vista.split("|").slice(0,3).join("|")!==ultimaVista.split("|").slice(0,3).join("|"); ultimaVista=vista;
  app.classList.remove("anima","cascata");
  app.innerHTML='<div class="band" aria-hidden="true"></div><button type="button" class="pular" data-pular="1">Pular para o conteúdo</button>'+barraTopo()+'<header id="topo" class="lm">'+header()+'</header><main id="conteudo" class="lm" tabindex="-1" aria-label="'+esc(nomeAba())+'">'+(state.loaded?dicaTela():"")+corpo+'</main>'+bottomNav();
  posicionaBanda();
  const comAbas=state.loaded&&mode!=="login"&&!precisaTermos();
  if(comAbas&&abaAnterior&&abaAnterior!==ui.tab&&!semMovimento()){ const dd=ORDEM_ABAS.indexOf(ui.tab)-ORDEM_ABAS.indexOf(abaAnterior), mn=document.getElementById("conteudo"); if(mn&&dd) mn.classList.add(dd>0?"aba-vem-dir":"aba-vem-esq"); }
  abaAnterior=comAbas?ui.tab:null;
  if(state.loaded&&mode!=="login") checaConquistas();
  if(fid){ const el=document.getElementById(fid); if(el){ el.focus({preventScroll:true}); if(sel&&el.setSelectionRange){ try{el.setSelectionRange(sel[0],sel[1])}catch(e){} } } }
  const on=document.querySelector(".chip.on"), barra=on&&on.parentElement; if(barra&&!fid){ barra.scrollLeft=Math.max(0,on.offsetLeft-barra.offsetLeft-(barra.clientWidth-on.clientWidth)/2); }
  if(Math.abs(window.scrollY-rolY)>1) window.scrollTo(0,rolY);
  if(state.loaded&&mode!=="login"&&!precisaTermos()){ setTimeout(()=>verificaLembretes(false),500); trataAtalho(); talvezTutorial(); }
  encolheValores(document.getElementById("app"));
  if(novaVista&&state.loaded&&mode!=="login") animaEntrada(app,novaTela);
  festejaPago(app);
  ajustaAcessivel(app,novaTela,novaVista);
  ligaApresentacao();
  moveIndicadorNav(app);
  deslizaMes(app); deslizaTema(app);
  checaTopo();
  botaoMoneBot();
  if(ui.rolarPara&&state.loaded){ const _id=ui.rolarPara, _e=document.getElementById(_id), _s=_e&&_e.closest(".mais:not(.aberta)"); if(_s){ ui.abre[_s.id.slice(4)]=true; ui.rolarPara=null; render(); ui.rolarPara=null; setTimeout(()=>{ const e2=document.getElementById(_id); e2&&e2.scrollIntoView({block:"center",behavior:"smooth"}); },60); } const el=document.getElementById(ui.rolarPara||"__nada"); if(el){ ui.rolarPara=null; setTimeout(()=>el.scrollIntoView({block:"center",behavior:"smooth"}),60); } }
}
const nomeAba=()=>mode==="login"?"Entrar no Monetra":({mes:"Início",ano:"Relatórios",metas:"Metas e desafios",perfil:"Perfil",ajustes:"Ajustes"})[ui.tab]||"Monetra";
function anunciar(msg){ let r=document.getElementById("aviso-sr"); if(!r){ r=document.createElement("div"); r.id="aviso-sr"; r.className="sr"; r.setAttribute("aria-live","polite"); r.setAttribute("aria-atomic","true"); document.body.appendChild(r); }
  const el=r; el.textContent=""; setTimeout(()=>{ el.textContent=msg; },60); }
function ajustaAcessivel(raiz,novaTela,novaVista){
  raiz.querySelectorAll(".tablewrap").forEach(w=>{ const c=w.closest(".card"), h=c&&c.querySelector("h2"); w.setAttribute("tabindex","0"); w.setAttribute("role","region"); w.setAttribute("aria-label",(h?h.textContent.trim():"Tabela")+" (role para os lados para ver tudo)"); });
  if(novaVista&&state.loaded&&mode!=="login"){ const c=ui.tab==="mes"?calc(ui.month):null;
    anunciar(novaTela?nomeAba()+(c?". "+nomeMes(ui.month)+", saldo de "+brl(c.saldo):""):(c?nomeMes(ui.month)+", saldo de "+brl(c.saldo):"")); }
}
let ultimaVista="", timerAnima=0, timerStory=0;
const ORDEM_ABAS=["mes","ano","metas","perfil","ajustes"];
/** @type {string|null} */
let abaAnterior=null;
