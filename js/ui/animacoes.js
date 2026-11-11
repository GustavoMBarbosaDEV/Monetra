// @ts-check
// Animações de entrada, comemorações e arrastos.
"use strict";
/**
 * @param {HTMLElement} raiz
 * @param {boolean} cascata
 */
function animaEntrada(raiz,cascata){
  if(semMovimento()) return;
  const porCard=new Map();
  raiz.querySelectorAll(".track > *").forEach(el=>{ const c=el.closest(".card,.meta,.desafio,.viagemcard")||raiz, n=porCard.get(c)||0; porCard.set(c,n+1); el.style.setProperty("--i",String(Math.min(n,10))); });
  raiz.querySelectorAll(".hs-graf path[fill='none']").forEach(p=>p.setAttribute("pathLength","1"));
  const boot=document.getElementById("boot"), atraso=boot?Math.max(0,BOOT_MIN-performance.now())+250:0;
  raiz.style.setProperty("--atraso",atraso+"ms");
  raiz.classList.toggle("cascata",cascata);
  if(cascata){ let n=0; raiz.querySelectorAll(".saud, .months, .note, .heroSaldo, .qa, .faixa, .tiles > .tile, .pagetitle, .card").forEach(el=>{ if(el.parentElement&&el.parentElement.closest(".card")) return; el.style.setProperty("--c",String(Math.min(n++,12))); el.classList.add("entra"); }); }
  void raiz.offsetWidth; raiz.classList.add("anima");
  clearTimeout(timerAnima); timerAnima=setTimeout(()=>raiz.classList.remove("anima","cascata"),1900+atraso);
  contaValores(raiz,atraso);
}
let celebra="";
document.addEventListener("click",e=>{ const t=/** @type {Element} */(e.target), b=t&&t.closest&&t.closest("button.check"); if(!b||b.classList.contains("on")||b.disabled||semMovimento()) return;
  const at=[...b.attributes].filter(a=>a.name.startsWith("data-")).map(a=>`[${a.name}="${CSS.escape(a.value)}"]`).join(""); celebra=at?"button.check"+at:""; setTimeout(()=>{ celebra=""; },1200); },true);
/** @param {HTMLElement} raiz */
function festejaPago(raiz){ if(!celebra) return; const sel=celebra; celebra=""; let b; try{ b=raiz.querySelector(sel)||document.querySelector(sel); }catch(e){ return; } if(!b||!b.classList.contains("on")) return;
  const p=b.querySelector("path"); if(p) p.setAttribute("pathLength","1");
  b.classList.remove("pop"); void b.getBoundingClientRect(); b.classList.add("pop");
  const fx=document.createElement("span"); fx.className="confete"; fx.setAttribute("aria-hidden","true");
  for(let i=0;i<12;i++){ const a=i/12*Math.PI*2+Math.random()*.4, d=22+Math.random()*16, q=document.createElement("i"); q.style.setProperty("--dx",(Math.cos(a)*d).toFixed(1)+"px"); q.style.setProperty("--dy",(Math.sin(a)*d).toFixed(1)+"px"); q.style.setProperty("--r",Math.round(Math.random()*360)+"deg"); q.style.height=(5+Math.random()*6).toFixed(1)+"px"; q.className="c"+(i%3); fx.appendChild(q); }
  b.appendChild(fx); vibra(22); setTimeout(()=>{ fx.remove(); b.classList.remove("pop"); },900); }
let mesAnterior="";
/** @param {HTMLElement} raiz */
function deslizaMes(raiz){ const prev=mesAnterior; mesAnterior=ui.tab==="mes"?ui.month:""; if(!prev||prev===ui.month||ui.tab!=="mes"||semMovimento()) return;
  const box=/** @type {HTMLElement|null} */(raiz.querySelector(".months .chips")); if(!box) return;
  const de=/** @type {HTMLElement|null} */(box.querySelector(`[data-month="${prev}"]`)), para=/** @type {HTMLElement|null} */(box.querySelector(".chip.on")); if(!de||!para) return;
  const r=(el)=>({x:el.offsetLeft,y:el.offsetTop,w:el.offsetWidth,h:el.offsetHeight}), a=r(de), b=r(para);
  const ind=document.createElement("i"); ind.className="chipind"; ind.setAttribute("aria-hidden","true");
  Object.assign(ind.style,{left:a.x+"px",top:a.y+"px",width:a.w+"px",height:a.h+"px"}); box.appendChild(ind); box.classList.add("deslizando");
  requestAnimationFrame(()=>requestAnimationFrame(()=>Object.assign(ind.style,{left:b.x+"px",top:b.y+"px",width:b.w+"px",height:b.h+"px"})));
  setTimeout(()=>{ box.classList.remove("deslizando"); ind.remove(); },430); }
let temaPos=-1;
/** @param {HTMLElement} raiz */
function deslizaTema(raiz){ const seg=/** @type {HTMLElement|null} */(raiz.querySelector('.seg[aria-label="Tema"]')); if(!seg){ temaPos=-1; return; }
  const ins=[...seg.querySelectorAll("input")], p=ins.findIndex(i=>/** @type {HTMLInputElement} */(i).checked); if(p<0) return;
  seg.classList.add("segdesliza"); const poe=i=>seg.style.setProperty("--pos",String(i));
  if(temaPos<0||temaPos===p||semMovimento()){ poe(p); temaPos=p; return; }
  seg.style.setProperty("--trans","none"); poe(temaPos); void seg.offsetWidth; seg.style.removeProperty("--trans"); requestAnimationFrame(()=>poe(p)); temaPos=p; }
let navPos=-1;
/** @param {HTMLElement} raiz */
function moveIndicadorNav(raiz){ const ind=/** @type {HTMLElement|null} */(raiz.querySelector(".bottomnav .navind")); if(!ind) return;
  const ord=["mes","ano","","metas","perfil"], p=ord.indexOf(ui.tab); if(p<0){ ind.style.opacity="0"; return; }
  const poe=i=>ind.style.setProperty("--pos",String(i));
  if(navPos<0||navPos===p||semMovimento()){ poe(p); navPos=p; return; }
  ind.style.transition="none"; poe(navPos); void ind.offsetWidth; ind.style.transition=""; requestAnimationFrame(()=>poe(p)); navPos=p; }
/** @type {{sh:HTMLElement,y0:number,t0:number,dy:number,id:number}|null} */
let arrasto=null;
document.addEventListener("pointerdown",e=>{ const t=e.target; if(!(t instanceof Element)||innerWidth>760) return; const sh=/** @type {HTMLElement|null} */(t.closest("#sheet .sheet"));
  if(!sh||sh.closest(".stories")||!t.closest(".sheethead")||t.closest("button,input,select,textarea,a,label")) return;
  arrasto={sh,y0:e.clientY,t0:performance.now(),dy:0,id:e.pointerId}; sh.style.transition="none"; });
document.addEventListener("pointermove",e=>{ if(!arrasto||e.pointerId!==arrasto.id) return; const dy=Math.max(0,e.clientY-arrasto.y0); arrasto.dy=dy;
  arrasto.sh.style.transform=`translateY(${dy}px)`; const w=arrasto.sh.parentElement; if(w) w.style.backgroundColor=`rgba(8,14,11,${Math.max(0,.5-dy/700).toFixed(3)})`; },{passive:true});
/** @param {PointerEvent} e */
const soltaArrasto=e=>{ if(!arrasto||e.pointerId!==arrasto.id) return; const a=arrasto; arrasto=null; const v=a.dy/Math.max(1,performance.now()-a.t0);
  a.sh.style.transition="transform .22s ease";
  if(a.dy>110||(a.dy>40&&v>0.6)){ a.sh.style.transform="translateY(110%)"; setTimeout(()=>{ if(ui.sheet) closeSheet(); },200); }
  else { a.sh.style.transform=""; const w=a.sh.parentElement; if(w) w.style.backgroundColor=""; } };
document.addEventListener("pointerup",soltaArrasto); document.addEventListener("pointercancel",soltaArrasto);
/**
 * @param {HTMLElement} raiz
 * @param {number} atraso
 */
function contaValores(raiz,atraso){
  const alvos=[...raiz.querySelectorAll(".hs-val, .hs-mini b, .tile .val, .fb-v")].map(el=>{
    const h=el.innerHTML;
    if(el.dataset.v!==undefined){ const v=Number(el.dataset.v); return v?{el,h,v,rico:true}:null; }
    if(el.children.length) return null; const t=el.textContent, m=t.match(/R\$\s*([\d.]+,\d{2})/); if(!m) return null;
    const v=parseFloat(m[1].replace(/\./g,"").replace(",","."))*(/^\s*-/.test(t)?-1:1); return v?{el,h,v,rico:false}:null; }).filter(Boolean);
  if(!alvos.length) return;
  const ini=performance.now()+(atraso||0), dur=750, ease=x=>1-Math.pow(1-x,4);
  const passo=agora=>{ const p=Math.max(0,Math.min(1,(agora-ini)/dur)), k=ease(p);
    alvos.forEach(a=>{ if(!a.el.isConnected) return; if(p>=1) a.el.innerHTML=a.h; else if(a.rico) a.el.innerHTML=valorGrande(a.v*k); else a.el.textContent=brl(a.v*k); });
    if(p<1) requestAnimationFrame(passo); };
  alvos.forEach(a=>{ if(a.rico) a.el.innerHTML=valorGrande(0); else a.el.textContent=brl(0); }); requestAnimationFrame(passo);
}
function encolheValores(raiz){ if(!raiz) return; raiz.querySelectorAll(".tile .val, .hs-val, .assintot b, .rpar b, .vgnums b").forEach(el=>{ el.style.fontSize=""; let f=parseFloat(getComputedStyle(el).fontSize), n=0; while(el.scrollWidth>el.clientWidth+1&&f>12&&n<20){ f-=1; n++; el.style.fontSize=f+"px"; } }); }
