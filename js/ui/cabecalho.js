// @ts-check
// Cabeçalho, avatar e barra de navegação.
"use strict";
function header(){
  const t=(id,l)=>`<button role="tab" data-tab="${id}" aria-selected="${ui.tab===id}">${l}</button>`;
  const logado=mode!=="login"&&!precisaTermos();
  return `<div class="top"><div class="brand"><img class="logo" src="icons/marca.png" alt="" width="34" height="27"><h1>Monetra</h1><button type="button" class="status ${statusCls}" id="status" data-status="1" title="${esc(statusTxt)}"><i></i><span class="stt">${esc(statusTxt)}</span></button></div>
  <div class="topright">${logado?`<div class="tabs" role="tablist">${t("mes","Início")}${t("ano","Relatórios")}${t("metas","Metas")}${t("ajustes","Ajustes")}</div>`:botaoTema()}
  ${logado&&state.loaded?`<button type="button" class="iconbtn" data-busca="1" aria-label="Buscar lançamentos e telas" title="Buscar (tecla /)">${ICON.busca}</button>`:""}
  ${logado&&state.loaded?botaoSino():""}
  ${logado&&state.loaded?`<button type="button" class="avatarbtn ${ui.tab==="perfil"?"on":""}" data-tab="perfil" aria-label="Abrir meu perfil" title="Meu perfil">${avatar(36)}</button>`:""}</div></div>
  ${logado&&mode==="cloud"?seletorEspaco():""}
  ${ui.tab==="mes"&&logado&&state.loaded?`<div class="saud"><small>${(()=>{ const h=new Date().getHours(); return h<12?"Bom dia,":h<18?"Boa tarde,":"Boa noite,"; })()}</small><h2>${esc(authUser?primeiroNome(meuNome()):"bem-vindo")} <span class="mbars mini" aria-hidden="true"><i></i><i></i><i></i></span></h2></div>`:""}
  ${ui.tab==="mes"&&logado?`<div class="months">
  <div class="chips">${chipsMes().map(k=>`<button class="chip ${k===ui.month?"on":""} ${k===todayKey?"now":""}" data-month="${k}" aria-label="${esc(nomeMes(k))}${k===ui.month?" (aberto)":""}">${ABR[kM(k)-1]} <small>${String(kY(k)).slice(2)}</small></button>`).join("")}</div>
  <button type="button" class="mescal" data-mescal="1" aria-label="Escolher outro mês" title="Todos os meses">${ICON.mes}</button></div>`:""}
  ${mode==="local"&&state.loaded?`<div class="note">Modo local: sem conexão com o login, os dados ficam só neste aparelho.</div>`:""}
  ${avisoMudanca()}`;
}
function avisoMudanca(){
  if(!enderecoAntigo()) return "";
  const novo=ENDERECO_NOVO.replace(/^https:\/\/|\/$/g,"");
  const comDados=mode!=="login"&&state.loaded&&nLancamentos()>0, bk=infoBackup(), fezBk=!!(bk.ultimo&&bk.ultimo===hojeISO());
  const ir=`<a class="btn${comDados&&!fezBk?" ghost":""}" href="${esc(ENDERECO_NOVO+location.search.slice(0,500))}">Ir para o novo endereço</a>`;
  return `<div class="note info mudanca" role="status"><b>O Monetra mudou de endereço: ${novo}</b>
  <span>Seus lançamentos na nuvem continuam lá: é só entrar com a mesma conta Google. O PIN, as preferências e o que fica só neste aparelho não vão junto, porque o navegador trata o endereço novo como outro app.${comDados?(fezBk?" Backup de hoje baixado: pode ir.":" Antes de ir, baixe um backup."):""}</span>
  <span class="mdbtns">${comDados?`<button class="btn${fezBk?" ghost":""}" type="button" data-bkurgente="1">${fezBk?"Baixar de novo":"Baixar backup"}</button>`:""}${ir}</span></div>`;
}
function avatar(px){
  const nome=(authUser&&(authUser.displayName||authUser.email))||"";
  if(authUser&&authUser.photoURL) return `<img class="avatar" src="${esc(authUser.photoURL)}" alt="" width="${px}" height="${px}" referrerpolicy="no-referrer">`;
  const ini=nome?nome.trim().split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase():"";
  return `<span class="avatar" style="width:${px}px;height:${px}px">${ini?esc(ini):ICON.perfil}</span>`;
}
function posicionaBanda(){ const app=document.getElementById("app"), band=app&&app.querySelector(".band"); if(!band) return;
  const y=el=>el.getBoundingClientRect().bottom+window.scrollY;
  const hero=app.querySelector(".heroSaldo"), fim=hero?y(hero)+42:Math.max(...[".top",".espacos",".months",".note",".pagetitle"].map(q=>app.querySelector("#topo > "+q+", #conteudo > "+q)).filter(el=>el&&el.offsetHeight>0).map(y),0)+(app.querySelector(".pagetitle")?14:4);
  band.style.height=Math.max(120,Math.round(fim))+"px"; document.body.classList.toggle("combanda",!!hero); }
window.addEventListener("resize",()=>{ try{ posicionaBanda(); }catch(e){} });
function bottomNav(){
  if(mode==="login"||!state.loaded||precisaTermos()) return "";
  const np=pendencias().length;
  const ICN={mes:ICON.inicio,ano:ICON.relat,metas:ICON.metas,perfil:ICON.perfil};
  const b=(id,l)=>`<button type="button" data-tab="${id}" class="${ui.tab===id?"on":""}" aria-current="${ui.tab===id?"page":"false"}">${ICN[id]}${id==="mes"&&np?`<i class="badge">${np}</i>`:""}<span>${l}</span></button>`;
  return `<nav class="bottomnav" aria-label="Navegação"><i class="navind" aria-hidden="true"></i>${b("mes","Início")}${b("ano","Relatórios")}<span class="navfab"><button class="fab" type="button" data-novo="gasto" aria-label="Nova despesa (segure para mais opções)" aria-expanded="false" title="Toque: despesa · Segure: mais opções">${ICON.mais}</button></span>${b("metas","Metas")}${b("perfil","Perfil")}</nav>`;
}
