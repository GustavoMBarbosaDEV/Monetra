// @ts-check
// Avisos rápidos na parte de baixo da tela.
"use strict";
let toastTimer=null, toastAcao=null;
function toast(msg,acaoTxt,acaoFn){
  vibra(14);
  let el=document.getElementById("toast");
  if(!el){ el=document.createElement("div"); el.id="toast"; el.className="toast"; el.setAttribute("role","status"); document.body.appendChild(el);
    el.addEventListener("click",e=>{ if(e.target.closest("[data-toastacao]")&&toastAcao){ const f=toastAcao; toastAcao=null; el.hidden=true; f(); } }); }
  toastAcao=acaoFn||null;
  el.innerHTML=`<span>${esc(msg)}</span>${acaoTxt?`<button type="button" data-toastacao="1">${esc(acaoTxt)}</button>`:""}`;
  el.hidden=false; el.classList.remove("entra"); void el.offsetWidth; el.classList.add("entra"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>{el.hidden=true; toastAcao=null;},acaoTxt?6000:(msg.length>60?5000:3500));
}

