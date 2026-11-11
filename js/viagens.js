// @ts-check
// Modo viagem e moedas.
"use strict";
const MOEDAS=[["USD","Dólar americano"],["EUR","Euro"],["ARS","Peso argentino"],["CLP","Peso chileno"],["UYU","Peso uruguaio"],["PYG","Guarani (Paraguai)"],["COP","Peso colombiano"],["PEN","Sol (Peru)"],["BOB","Boliviano"],["MXN","Peso mexicano"],["GBP","Libra esterlina"],["CAD","Dólar canadense"],["AUD","Dólar australiano"],["CHF","Franco suíço"],["JPY","Iene"],["CNY","Yuan"],["BRL","Real (viagem no Brasil)"]];
function fmtMoeda(v,m){ try{ return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:m}); }catch(e){ return m+" "+Number(v||0).toFixed(2); } }
const fmtCot=n=>Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:4});
const lerCot=t=>{ const n=Number(String(t||"").trim().replace(/\./g,"").replace(",",".")); return isFinite(n)&&n>0?n:NaN; };
const emReais=(valor,vg)=>Math.round((Number(valor)||0)*(vg.moeda==="BRL"?1:vg.cotacao)*(1+(vg.moeda==="BRL"?0:(vg.taxa||0))/100)*100)/100;
const viagemNoDia=iso=>(state.config.viagens||[]).find(v=>v.inicio&&v.fim&&iso>=v.inicio&&iso<=v.fim)||null;
const viagemAtiva=()=>viagemNoDia(hojeISO());
function gastosViagem(id){ const out=[]; Object.keys(state.months).sort().forEach(k=>((state.months[k]||{}).gastos||[]).forEach(g=>{ if(g.viagemId===id) out.push(Object.assign({k},g)); }));
  (state.config.parcelas||[]).forEach(pp=>{ if(pp.viagemId===id) out.push(Object.assign({},pp,{k:pp.compra,valor:pp.total,desc:(pp.desc||"Compra parcelada")+" ("+pp.n+"x)",orig:pp.orig?Object.assign({},pp.orig):null})); });
  return out; }
function resumoViagem(vg){
  const gs=gastosViagem(vg.id), total=Math.round(gs.reduce((a,g)=>a+(Number(g.valor)||0),0)*100)/100;
  const emMoeda=gs.reduce((a,g)=>a+(g.orig&&g.orig.moeda===vg.moeda?g.orig.valor:(vg.moeda==="BRL"?g.valor:0)),0);
  const porCat={}; gs.forEach(g=>porCat[g.cat]=(porCat[g.cat]||0)+(Number(g.valor)||0));
  const dias=vg.inicio&&vg.fim?Math.max(1,Math.round((new Date(vg.fim+"T12:00").getTime()-new Date(vg.inicio+"T12:00").getTime())/86400000)+1):1;
  const hoje=hojeISO(), passados=vg.inicio&&hoje>=vg.inicio?Math.min(dias,Math.round((new Date((hoje<vg.fim?hoje:vg.fim)+"T12:00").getTime()-new Date(vg.inicio+"T12:00").getTime())/86400000)+1):0;
  return {gs,total,emMoeda,porCat,dias,passados,porDia:passados?total/passados:0,resta:vg.orcamento?vg.orcamento-total:null};
}
const estadoViagem=vg=>{ const h=hojeISO(); return !vg.inicio||!vg.fim?"":h<vg.inicio?"proxima":h>vg.fim?"encerrada":"ativa"; };
function cardViagemMes(){
  const vg=viagemAtiva(); if(!vg) return "";
  const r=resumoViagem(vg), pct=vg.orcamento?Math.min(100,r.total/vg.orcamento*100):0;
  return `<div class="card viagemcard"><div class="cardhead"><h2>${ICON.aviao}${esc(vg.nome)}</h2><span class="tag">dia ${r.passados} de ${r.dias}</span></div>
    <div class="vgnums"><div><span class="lab">Gasto na viagem</span><b>${brl(r.total)}</b>${vg.moeda!=="BRL"?`<small>${fmtMoeda(r.emMoeda,vg.moeda)} lançados em ${vg.moeda}</small>`:""}</div>
    ${vg.orcamento?`<div><span class="lab">${r.resta>=0?"Ainda pode gastar":"Passou do orçamento"}</span><b class="${r.resta<0?"neg":"pos"}">${brl(Math.abs(r.resta))}</b><small>de ${brl(vg.orcamento)}</small></div>`:""}
    ${vg.moeda!=="BRL"?`<div><span class="lab">Cotação usada</span><b>1 ${esc(vg.moeda)} = ${brl(vg.cotacao)}</b><small>${vg.taxa?"+ "+fmtCot(vg.taxa)+"% de taxas":"sem taxas extras"}</small></div>`:""}</div>
    ${vg.orcamento?`<div class="track ${r.resta<0?"over":pct>=80?"warn":""}"><div style="width:${pct.toFixed(1)}%"></div></div>`:""}
    <div class="row2"><button class="btn" type="button" data-novo="gasto">+ Gasto da viagem</button><button class="btn ghost" type="button" data-edit="viagem" data-id="${esc(vg.id)}">Ver viagem</button></div></div>`;
}
function cardViagens(){
  const vs=(state.config.viagens||[]).slice().sort((a,b)=>String(b.inicio||"").localeCompare(String(a.inicio||"")));
  const rot={ativa:"acontecendo",proxima:"próxima",encerrada:"encerrada"};
  return `<div class="card" id="viagens"><div class="cardhead"><h2>Modo viagem</h2>${viagemAtiva()?'<span class="tag">em viagem</span>':""}</div>
  ${vs.length?`<div>${vs.map(vg=>{ const r=resumoViagem(vg), e=estadoViagem(vg); return `<button type="button" class="item" data-edit="viagem" data-id="${esc(vg.id)}" style="--dot:var(--accent)"><span class="pill">${esc(rot[e]||"")}</span><span class="desc"><b>${esc(vg.nome)}</b><small>${dataCurta(vg.inicio)} a ${dataCurta(vg.fim)} · ${esc(vg.moeda)}${vg.orcamento?" · orçamento "+brl(vg.orcamento):""}</small></span><span class="v">${brl(r.total)}</span></button>`; }).join("")}</div>`
    :`<p class="hint">Vai viajar? Cadastre a viagem com a moeda do destino. Durante a viagem, os gastos podem ser lançados na moeda de lá e o app converte para real, soma tudo e mostra quanto ainda dá para gastar.</p>`}
  <button class="btn ghost" type="button" data-novo="viagem">+ Nova viagem</button></div>`;
}
async function buscarCotacao(){
  const sel=document.getElementById("s-vmoeda"), out=document.getElementById("s-vcotinfo"), inp=document.getElementById("s-vcot"); if(!sel||!inp) return;
  const m=sel.value; if(m==="BRL"){ inp.value="1"; return; }
  out.textContent="Buscando a cotação de hoje…";
  try{ const r=await fetch("https://open.er-api.com/v6/latest/"+m,{cache:"no-store"}), j=await r.json(), v=j&&j.rates&&j.rates.BRL;
    if(!(v>0)) throw 0; inp.value=fmtCot(v); out.innerHTML="Cotação comercial de hoje: "+esc(fmtMoeda(1,m))+" = "+esc(brl(v))+". Fonte: <a href=\"https://www.exchangerate-api.com\" target=\"_blank\" rel=\"noopener\">ExchangeRate-API</a>. O cartão costuma cobrar um pouco mais.";
  }catch(e){ out.textContent="Não deu para buscar agora. Digite a cotação (quanto vale 1 "+m+" em reais)."; }
}
function blocoViagemGasto(it,k){
  const vs=state.config.viagens||[]; if(!vs.length) return "";
  const doItem=it&&it.viagemId&&vs.find(v=>v.id===it.viagemId), ativa=viagemAtiva(), vg=doItem||(!it?ativa:null)||ativa; if(!vg&&!doItem) return "";
  const on=it?!!doItem:!!ativa, moedaSel=it&&doItem&&it.orig?it.orig.moeda:(it?"BRL":vg.moeda);
  return `<div class="viagembox"><label class="switch"><input type="checkbox" id="s-vgon" ${on?"checked":""}><span></span>${ICON.aviao} Gasto da viagem</label>
    <div id="s-vgdet" ${on?"":"hidden"}>
      ${vs.length>1?`<label class="f">Viagem<select class="in" id="s-vgid">${vs.map(v=>`<option value="${esc(v.id)}" ${v.id===vg.id?"selected":""}>${esc(v.nome)}</option>`).join("")}</select></label>`:`<input type="hidden" id="s-vgid" value="${esc(vg.id)}">`}
      <div class="seg" role="radiogroup" aria-label="Moeda do valor" id="s-vgseg">${vg.moeda!=="BRL"?`<input type="radio" name="s-vgmoeda" id="s-vgm1" value="${esc(vg.moeda)}" ${moedaSel!=="BRL"?"checked":""}><label for="s-vgm1">Em ${esc(vg.moeda)}</label>`:""}<input type="radio" name="s-vgmoeda" id="s-vgm2" value="BRL" ${moedaSel==="BRL"||vg.moeda==="BRL"?"checked":""}><label for="s-vgm2">Em reais</label></div>
      <p class="hint" id="s-vgconv"></p></div></div>`;
}
function atualizaVg(){
  const on=document.getElementById("s-vgon"); if(!on) return;
  const det=document.getElementById("s-vgdet"); det.hidden=!on.checked;
  const vg=(state.config.viagens||[]).find(v=>v.id===((document.getElementById("s-vgid")||{}).value)); if(!vg) return;
  const seg=document.getElementById("s-vgseg"); if(seg&&seg.dataset.moeda!==vg.moeda){
    const atual=(document.querySelector('#sheet input[name="s-vgmoeda"]:checked')||{}).value, estr=vg.moeda!=="BRL"&&(!seg.dataset.moeda||atual!=="BRL");
    seg.innerHTML=(vg.moeda!=="BRL"?`<input type="radio" name="s-vgmoeda" id="s-vgm1" value="${esc(vg.moeda)}" ${estr?"checked":""}><label for="s-vgm1">Em ${esc(vg.moeda)}</label>`:"")+`<input type="radio" name="s-vgmoeda" id="s-vgm2" value="BRL" ${estr?"":"checked"}><label for="s-vgm2">Em reais</label>`; seg.dataset.moeda=vg.moeda; }
  const moeda=(document.querySelector('#sheet input[name="s-vgmoeda"]:checked')||{}).value||"BRL", estrangeira=on.checked&&moeda!=="BRL";
  const parc=(document.getElementById("s-parc")||{}).checked, lab=document.getElementById("s-valorlab"); if(lab) lab.textContent=(parc?"Valor total da compra":"Valor")+(estrangeira?" em "+moeda:"");
  const v=parseMoney((document.getElementById("s-valor")||{}).value), conv=document.getElementById("s-vgconv");
  if(conv) conv.innerHTML=estrangeira?(v>0?"≈ <b>"+esc(brl(emReais(v,vg)))+"</b> · ":"")+esc(fmtMoeda(1,moeda))+" = "+esc(brl(vg.cotacao))+(vg.taxa?" + "+esc(fmtCot(vg.taxa))+"% de taxas":""):(on.checked?"O valor em reais entra na viagem "+esc(vg.nome)+".":"");
}

