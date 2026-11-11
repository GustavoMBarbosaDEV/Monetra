// @ts-check
// Atalhos do app instalado e comprovantes compartilhados.
"use strict";
let atalhoPendente=new URLSearchParams(location.search).get("acao");
{ const cv=new URLSearchParams(location.search).get("convite"); if(cv){ ui.conviteUrl=cv.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8); atalhoPendente="convite"; } }
let textoCompart="";
{ const q=new URLSearchParams(location.search), t=[q.get("st"),q.get("sx"),q.get("su")].filter(Boolean).join(" ").trim(); if(t){ textoCompart=t.slice(0,600); atalhoPendente="compartilhar"; } }
function textoRapidoDe(t){
  let x=String(t||"").replace(/https?:\/\/\S+/g," ").replace(/\s+/g," ").trim(), valor="";
  const m=x.match(/R\$\s*-?\s*(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/i); if(m){ valor=m[1]; x=x.replace(m[0]," "); }
  x=x.replace(/\b(\d{1,2})\/(\d{1,2})\/\d{2,4}\b/g,"$1/$2").replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g," ").replace(/[|•·:;"“”()[\]*_]/g," ").replace(/\s+/g," ").trim();
  x=x.replace(/(^|\s)(comprovante|transfer[eê]ncia|enviad[oa]|recebid[oa]|realizad[oa]|efetuad[oa]|aprovad[oa]|pagamento|voc[eê]|pagou|compra|valor|data|hora|em|às|as)(?=\s|$)/gi," ").replace(/\s+/g," ").trim().replace(/(^|\bpix\s+)(de|para|no|na)\s+/gi,"$1");
  return ((valor?valor+" ":"")+x.split(" ").slice(0,10).join(" ")).slice(0,100);
}
function trataAtalho(){
  if(!atalhoPendente||!state.loaded||mode==="login") return;
  const a=atalhoPendente; atalhoPendente=null;
  try{ history.replaceState(null,"",location.pathname); }catch(e){}
  if(a==="convite"){ ui.tab="perfil"; setTimeout(()=>{ render(); const el=document.getElementById("compartilhado"); if(el) el.scrollIntoView({block:"start"}); if(mode!=="cloud") toast("O controle compartilhado precisa do login com Google."); },50); return; }
  ui.tab="mes"; ui.month=todayKey;
  if(a==="compartilhar"){ setTimeout(()=>{ render(); openSheet("gasto"); const inp=/** @type {HTMLInputElement|null} */(document.getElementById("s-rapido"));
    if(inp){ inp.value=textoRapidoDe(textoCompart); inp.dispatchEvent(new Event("input",{bubbles:true})); }
    anunciar("Texto recebido no lançamento rápido. Confira os campos e toque em Salvar."); },50); return; }
  if(a==="nova-despesa") setTimeout(()=>{ render(); openSheet("gasto"); },50); else setTimeout(render,50);
}

