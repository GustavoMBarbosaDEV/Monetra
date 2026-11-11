// @ts-check
// Janelas (sheets): abrir, fechar e desenhar.
"use strict";
function sheetRoot(){ let r=document.getElementById("sheet"); if(!r){ r=document.createElement("div"); r.id="sheet"; r.inert=travado; document.body.appendChild(r); bindSheet(r); } return r; }
let sheetVoltaFoco=null;
function openSheet(tipo,id,extra){
  if(mode==="login"||!state.loaded||precisaTermos()) return;
  if(!ui.sheet){ sheetVoltaFoco=document.activeElement; marcaHist("sheet"); }
  ui.sheet=Object.assign({tipo,id:id||null},extra||{});
  renderSheet();
  const f=/** @type {HTMLElement|null} */(document.querySelector("#sheet [data-autofocus]")||document.querySelector("#sheet #sheetTit"));
  if(f){ if(f.id==="sheetTit") f.setAttribute("tabindex","-1"); setTimeout(()=>f.focus(),30); }
}
let _hist=0, _voltando=false, _ignoraPop=0;
function marcaHist(tipo){ try{ history.pushState({mb:tipo,n:++_hist},""); }catch(e){} }
window.addEventListener("popstate",()=>{
  if(_ignoraPop>0){ _ignoraPop--; return; }
  if(ui.sheet){ _voltando=true; closeSheet(); _voltando=false; return; }
  if(tutAberto&&typeof fecharTutorial==="function"){ try{ fecharTutorial(); }catch(e){} return; }
  if(ui.tab!=="mes"){ ui.tab="mes"; render(); window.scrollTo({top:0}); return; }
});
function closeSheet(){ const tinha=!!ui.sheet; if(tinha&&!_voltando&&history.state&&history.state.mb==="sheet"){ _ignoraPop++; try{ history.back(); }catch(e){ _ignoraPop--; } }
  ui.sheet=null; const r=document.getElementById("sheet"); if(r) r.innerHTML=""; document.body.classList.remove("sheet-open"); const _ap=document.getElementById("app"); if(_ap) _ap.inert=travado; if(sheetVoltaFoco&&document.contains(sheetVoltaFoco)) try{sheetVoltaFoco.focus()}catch(e){} sheetVoltaFoco=null; }
const mesSheet=()=>(ui.sheet&&ui.sheet.mes)||ui.month;
/** @returns {any} */
function itemAtual(){
  const s=ui.sheet; if(!s||!s.id) return null; const k=mesSheet(), m=getMonth(k);
  switch(s.tipo){
    case "gasto": return m.gastos.find(x=>x.id===s.id);
    case "avulso": return m.avulsos.find(x=>x.id===s.id);
    case "caixinha": return m.caixinha.find(x=>x.id===s.id);
    case "fixo": return state.config.fixos.find(x=>x.id===s.id);
    case "fixoMes": return fixosDoMes(k).find(x=>x.id===s.id);
    case "parcela": return state.config.parcelas.find(x=>x.id===s.id);
    case "renda": return state.config.rendas.find(x=>x.id===s.id);
    case "rendaMes": return rendasDoMes(k).find(x=>x.id===s.id);
    case "categoria": return state.config.categorias.find(x=>x.id===s.id);
    case "meta": return state.config.metas.find(x=>x.id===s.id);
    case "desafio": return (state.config.desafios||[]).find(x=>x.id===s.id);
    case "conta": return state.config.contas.find(x=>x.id===s.id);
    case "bem": return state.config.contas.find(x=>x.id===s.id&&ehBem(x));
    case "cartao": return state.config.cartoes.find(x=>x.id===s.id);
    case "transf": return m.transf.find(x=>x.id===s.id);
    case "divida": return state.config.dividas.find(x=>x.id===s.id);
    case "viagem": return state.config.viagens.find(x=>x.id===s.id);
  }
  return null;
}
function chipsCampo(sel){ return `<div class="cats" role="radiogroup" aria-label="Categoria">${state.config.categorias.map(ct=>`<input type="radio" name="s-cat" id="s-cat-${esc(ct.id)}" value="${esc(ct.id)}" ${ct.id===sel?"checked":""}><label for="s-cat-${esc(ct.id)}" style="--dot:${catColor(ct.id)}">${svgCat(catIc(ct.id),15)}${esc(ct.nome)}</label>`).join("")}<button type="button" class="chipnova" data-snovacat="1">+ Nova categoria</button></div>
  <div class="row" id="s-novacatbox" hidden><label class="f" style="flex:2 1 160px">Nome da nova categoria<input class="in" id="s-novacat" maxlength="40" placeholder="ex.: Pets, Presentes"></label><button class="btn ghost" type="button" data-scriacat="1">Criar</button></div>`; }
const linhaSub=x=>`<div class="subrow"><input class="in subnome" data-subid="${esc(x.id||"")}" maxlength="30" value="${esc(x.nome)}" aria-label="Nome da subcategoria"><button type="button" class="link" data-delsub="">remover</button></div>`;
function chipsSub(cat,sel){
  const ct=state.config.categorias.find(c=>c.id===cat), subs=(ct&&ct.subs)||[]; if(!subs.length) return "";
  return `<span>Subcategoria</span><div class="cats subcats" role="radiogroup" aria-label="Subcategoria"><input type="radio" name="s-sub" id="s-sub-0" value="" ${!sel?"checked":""}><label for="s-sub-0">Nenhuma</label>${subs.map(x=>`<input type="radio" name="s-sub" id="s-sub-${esc(x.id)}" value="${esc(x.id)}" ${x.id===sel?"checked":""}><label for="s-sub-${esc(x.id)}" style="--dot:${catColor(cat)}"><i></i>${esc(x.nome)}</label>`).join("")}</div>`;
}
function campoTags(tags){
  const sug=todasTags().filter(t=>!(tags||[]).includes(t)).slice(0,8);
  return `<label class="f">Etiquetas (opcional)<input class="in" id="s-tags" maxlength="120" autocomplete="off" placeholder="ex.: viagem, presente, trabalho" value="${esc((tags||[]).map(t=>"#"+t).join(" "))}"></label>
  ${sug.length?`<div class="tagsug">${sug.map(t=>`<button type="button" class="tag" data-addtag="${esc(t)}">#${esc(t)}</button>`).join("")}</div>`:""}`;
}
function atualizaSubBox(){ const bx=document.getElementById("s-subbox"); if(!bx) return; const cat=(document.querySelector('#sheet input[name="s-cat"]:checked')||{}).value; bx.innerHTML=chipsSub(cat,null); bx.hidden=!bx.innerHTML; }
function chipsForma(sel){ return `<div class="cats formas" role="radiogroup" aria-label="Forma de pagamento">${FORMAS.map(([id,n])=>`<input type="radio" name="s-forma" id="s-fm-${id}" value="${id}" ${id===sel?"checked":""}><label for="s-fm-${id}" style="--dot:var(--fm-${id})"><i></i>${n}</label>`).join("")}</div>`; }
function selConta(sel,lab,id){ const cs=contasMov(); if(cs.length<2) return ""; const v=contaOk(sel);
  return `<label class="f">${lab||"Conta"}<select class="in" id="${id||"s-conta"}">${cs.map(c=>`<option value="${esc(c.id)}" ${c.id===v?"selected":""}>${esc(c.nome)}</option>`).join("")}</select></label>`; }
function selCartao(sel){ const cs=state.config.cartoes; if(cs.length<2) return ""; const v=(cs.find(c=>c.id===sel)||cs[0]).id;
  return `<label class="f">Cartão<select class="in" id="s-cartao">${cs.map(c=>`<option value="${esc(c.id)}" ${c.id===v?"selected":""}>${esc(c.nome)}</option>`).join("")}</select></label>`; }
const valSel=id=>(document.getElementById(id)||{}).value||null;
function atualizaFormaBox(){ const f=(document.querySelector('#sheet input[name="s-forma"]:checked')||{}).value; const a=document.getElementById("s-contabox"), b=document.getElementById("s-cartaobox"); if(a) a.hidden=f==="credito"; if(b) b.hidden=f!=="credito"; }
function selDia(k,sel){ const dim=diasMes(k); let o=""; for(let d=1;d<=dim;d++){ const wd=new Date(kY(k),kM(k)-1,d).toLocaleDateString("pt-BR",{weekday:"short"}).replace(".",""); o+=`<option value="${d}" ${d===sel?"selected":""}>${pad2(d)} · ${wd}${k===todayKey&&d===today.getDate()?" (hoje)":""}</option>`; } return `<select class="in" id="s-dia">${o}</select>`; }
const selMes=(id,sel)=>`<select class="in" id="${id}">${(sel&&!MESES.includes(sel)?[sel].concat(MESES):MESES).map(x=>`<option value="${x}" ${x===sel?"selected":""}>${esc(nomeMes(x))}</option>`).join("")}</select>`;
function renderSheet(){
  const r=sheetRoot(), s=ui.sheet;
  if(!s){ r.innerHTML=""; document.body.classList.remove("sheet-open"); return; }
  document.body.classList.add("sheet-open"); const _ap=document.getElementById("app"); if(_ap) _ap.inert=true;
  const k=mesSheet(), it=itemAtual(), novo=!s.id, diaPadrao=s.dia&&s.tipo!=="dia"?Math.min(diasMes(k),Number(s.dia)||1):k===todayKey?today.getDate():1;
  if(!novo&&!it&&s.tipo!=="busca"&&s.tipo!=="importar"&&s.tipo!=="avisos"&&s.tipo!=="dia"&&s.tipo!=="catmes"&&s.tipo!=="semana"&&s.tipo!=="meses"&&s.tipo!=="simulador"&&s.tipo!=="calc"&&s.tipo!=="pin"&&s.tipo!=="retro"&&s.tipo!=="monebot"){ closeSheet(); return; }
  const titulos={monebot:"MoneBot",catmes:s.tipo==="catmes"?catName(s.cat):"",gasto:novo?"Nova despesa":"Editar despesa",avulso:novo?"Nova receita":"Editar receita",vincular:ehAnonimo()?"Criar sua conta":"Formas de entrar",salario:salRecebido(k).length?"A outra parte caiu":"Meu salário caiu",caixinha:novo?"Movimentar caixinha":"Editar caixinha",fixo:novo?"Nova conta fixa":"Editar conta fixa",fixoMes:it?it.desc:"",parcela:"Compra parcelada",renda:novo?"Nova renda fixa":"Editar renda fixa",rendaMes:it?it.nome:"",busca:"Buscar no app",categoria:novo?"Nova categoria":"Editar categoria",meta:novo?"Nova meta de economia":"Meta de economia",conta:novo?"Nova conta":"Editar conta",cartao:novo?"Novo cartão de crédito":"Editar cartão",bksenha:"Backup com senha",bkabrir:"Abrir backup com senha",excluirconta:"Excluir minha conta",bem:novo?"Novo bem":"Editar bem",transf:novo?"Transferir entre contas":"Editar transferência",importar:"Importar extrato do banco",avisos:"Notificações",calc:"Calculadoras",simulador:"Simulador de quitação",semana:"Resumo da semana",meses:"Selecione o mês e o ano",desafio:novo?"Novo desafio":"Desafio",dia:ui.sheet&&ui.sheet.tipo==="dia"?(()=>{ const kk=mesSheet(), dt=new Date(kY(kk),kM(kk)-1,Number(ui.sheet.dia)||1); const t=DIAS_SEM[dt.getDay()]+", "+pad2(dt.getDate())+" de "+NOMES[dt.getMonth()].toLowerCase(); return t[0].toUpperCase()+t.slice(1); })():"",retro:"Retrospectiva",viagem:novo?"Nova viagem":"Viagem",divida:novo?((s.dTipo||"receber")==="pagar"?"Eu devo":"Alguém me deve"):"Dívida",pin:ui.sheet&&ui.sheet.pinModo==="trocar"?"Trocar PIN":ui.sheet&&ui.sheet.pinModo==="desligar"?"Desligar o PIN":"Criar PIN"};
  const abas=novo&&["gasto","avulso","caixinha","fixo"].includes(s.tipo)?`<div class="seg tipos" role="radiogroup" aria-label="Tipo de lançamento">${[["gasto","Despesa"],["avulso","Receita"],["caixinha","Caixinha"],["fixo","Conta fixa"]].map(([t,l])=>`<input type="radio" name="s-tipo" id="s-t-${t}" value="${t}" ${s.tipo===t?"checked":""}><label for="s-t-${t}">${l}</label>`).join("")}</div>`:"";
  const valorCampo=(v,lab,auto=true)=>`<label class="f money bigval"><span id="s-valorlab">${lab||"Valor"}</span><input class="in num" id="s-valor" inputmode="numeric" placeholder="0,00" value="${esc(v===0?"0,00":v!=null?moneyInput(v):(s.valorRasc||""))}" ${auto?"data-autofocus":""} required></label>`;
  const apagar=`<button class="btn danger" type="button" data-sapagar="1">Apagar</button>`;
  let corpo="", botoes="", sub=esc(nomeMes(k));
  if(s.tipo==="gasto"){
    const cat=it?it.cat:(ui.gCat&&catIndex(ui.gCat)>=0?ui.gCat:state.config.categorias[0]?.id);
    const forma=it?(it.forma||""):ui.gForma;
    corpo=`${novo?`<div class="rapido"><label class="rp-in"><span class="rp-ic" aria-hidden="true">${icq("raio",17)}</span><span class="sr">Lançamento rápido</span><input class="in" id="s-rapido" autocomplete="off" enterkeyhint="send" maxlength="100" placeholder="Rápido: 45 ifood pix · 120 mercado ontem"></label>${ReconhecimentoVoz?`<button type="button" class="falar" data-falar="1" aria-pressed="false" aria-label="Lançar falando"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg></button>`:""}<div class="rp-prev" id="s-rapprev" aria-live="polite">${previaRapido(null)}</div></div>`:""}
      ${valorCampo(it?(it.orig&&it.orig.moeda!=="BRL"&&(state.config.viagens||[]).some(v=>v.id===it.viagemId)?it.orig.valor:it.valor):null)}
      ${blocoViagemGasto(it,k)}
      ${novo?`<label class="switch"><input type="checkbox" id="s-parc"><span></span>Compra parcelada</label>
      <div class="row" id="s-parcbox" hidden><label class="f narrow">Parcelas<input class="in num" id="s-n" type="number" min="2" max="48" value="2" inputmode="numeric"></label><label class="f narrow">Vence dia<input class="in num" id="s-venc" type="number" min="1" max="31" value="${diaPadrao}" inputmode="numeric"></label><p class="hint" id="s-parcinfo" style="flex:2 1 160px;align-self:center"></p></div>`:""}
      <div class="f"><span>Categoria</span>${chipsCampo(cat)}${it&&catIndex(it.cat)<0?'<p class="hint">A categoria desta despesa foi excluída. Escolha outra.</p>':""}</div>
      <div class="f" id="s-subbox" ${chipsSub(cat,it&&it.sub)?"":"hidden"}>${chipsSub(cat,it&&it.sub)}</div>
      <div class="row"><label class="f">Mês${selMes("s-gmes",k)}</label><label class="f" style="flex:0 1 150px">Dia${selDia(k,it?it.dia:diaPadrao)}</label></div>
      <label class="f">Descrição (opcional)<input class="in" id="s-desc" maxlength="80" placeholder="ex.: feira, gasolina, farmácia" value="${esc(it?it.desc:"")}"></label>
      <div class="f"><span>Forma de pagamento</span>${chipsForma(forma)}</div>
      ${it&&it.forma==="credito"?`<label class="switch"><input type="checkbox" id="s-gpago" ${it.pago?"checked":""}><span></span>Já paguei esta compra</label>`:""}
      <div id="s-contabox">${selConta(it?it.contaId:ui.gConta,"Sai da conta")}</div><div id="s-cartaobox">${selCartao(it?it.cartaoId:ui.gCartao)}</div>
      <p class="hint" id="s-fatinfo">${cartaoAtivo()?"No crédito, conta na fatura do cartão.":""}</p>
      ${compartilhado()&&membrosGrupo().length>1?`<label class="f">Quem pagou<select class="in" id="s-pagou">${it&&!(it.pagou||it.por)?'<option value="" selected>Não informado</option>':""}${membrosGrupo().map(id=>`<option value="${esc(id)}" ${(it?(it.pagou||it.por):uid)===id?"selected":""}>${esc(id===uid?"Eu":nomeDe(id)||"Pessoa")}</option>`).join("")}</select></label>`:""}
      <label class="f">Imposto de Renda<select class="in" id="s-ir"><option value="">Não entra no IR</option>${IR_TIPOS.map(([id,n])=>`<option value="${id}" ${it&&it.ir===id?"selected":""}>Dedutível: ${esc(n)}</option>`).join("")}</select></label>
      ${campoTags(it&&it.tags)}`;
    botoes=novo?`<button class="btn ghost" type="button" data-outro="1">Salvar e lançar outra</button><button class="btn" type="submit">Salvar</button>`:`${apagar}<button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="avulso"){
    corpo=`${valorCampo(it&&it.valor)}<div class="row"><label class="f">Dia${selDia(k,it?it.dia:diaPadrao)}</label><label class="f" style="flex:2 1 180px">Descrição<input class="in" id="s-desc" maxlength="60" placeholder="ex.: freela, Pix recebido, 13º" value="${esc(it?it.desc:"")}"></label></div>
      ${selConta(it?it.contaId:null,"Entra na conta")}
      ${novo?`<label class="switch"><input type="checkbox" id="s-repete"><span></span>Recebo esse valor todo mês</label><p class="hint">Ligado, vira uma renda fixa que entra sozinha a partir deste mês.</p>`:""}`;
    botoes=novo?`<button class="btn" type="submit">Salvar</button>`:`${apagar}<button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="vincular"){
    const anon=ehAnonimo(), u=authUser, provs=((u&&u.providerData)||[]).map(p=>NOMES_PROV[p.providerId]||p.providerId);
    corpo=`<p>${anon?"Crie sua conta e continue com tudo o que você lançou no teste.":"Você entra com: <b>"+esc(provs.join(", ")||"—")+"</b>. Adicione outra forma de entrar na mesma conta."}</p>
      <div class="lgprov">${temProv("google.com")?"":`<button class="btn google" type="button" data-lg="google">Continuar com Google</button>`}</div>
      ${temProv("password")?"":`<div class="lgsep"><span>ou com e-mail e senha</span></div>
      <label class="f">E-mail<input class="in" id="s-lgemail" type="email" inputmode="email" autocomplete="email" value="${esc(anon?"":(u&&u.email)||"")}" ${!anon&&u&&u.email?"readonly":""}></label>
      <label class="f">Senha<input class="in" id="s-lgsenha" type="password" autocomplete="new-password" minlength="8" aria-describedby="s-lgregra"></label><p class="hint" id="s-lgregra">Mínimo de 8 caracteres, com letras e números.</p>`}`;
    botoes=temProv("password")?"":`<button class="btn" type="submit">${anon?"Criar conta com e-mail":"Criar senha"}</button>`;
  }else if(s.tipo==="salario"){
    const rec=salRecebido(k), cf=cfgSal(), ja=soma(rec), padrao=state.config.salarioPadrao, resto=Math.max(0,Math.round((padrao-ja)*100)/100);
    const sug=rec.length?(resto||null):cf.tipo==="quinz"?Math.round(padrao/2*100)/100:padrao;
    corpo=`${valorCampo(sug,"Quanto caiu na conta")}<div class="row"><label class="f">Dia${selDia(k,k===todayKey?today.getDate():1)}</label></div>
      ${selConta(state.config.contaSalario,"Caiu na conta")}
      <label class="switch"><input type="checkbox" id="s-falta" ${!rec.length&&cf.tipo==="quinz"?"checked":""}><span></span>Ainda vou receber outra parte (adiantamento ou quinzena)</label>
      <p class="hint">${rec.length?"Já recebido em "+esc(abrMes(k))+": "+brl(ja)+".":"Valor do salário padrão. Mude se caiu diferente."} Ganhou um extra (bônus, freela)? <button class="link" type="button" data-salextra="1">Lance como receita</button>.</p>`;
    botoes=`<button class="btn" type="submit">Confirmar</button>`;
  }else if(s.tipo==="caixinha"){
    const tp=it?it.tipo:(s.cxTipo||"guardar");
    corpo=`<div class="seg" role="radiogroup" aria-label="Tipo"><input type="radio" name="s-cxtipo" id="s-cxG" value="guardar" ${tp==="guardar"?"checked":""}><label for="s-cxG">Guardar</label><input type="radio" name="s-cxtipo" id="s-cxR" value="retirar" ${tp==="retirar"?"checked":""}><label for="s-cxR">Retirar</label></div>
      ${valorCampo(it&&it.valor)}<div class="row"><label class="f">Dia${selDia(k,it?it.dia:diaPadrao)}</label><label class="f" style="flex:2 1 180px">Motivo (opcional)<input class="in" id="s-desc" maxlength="60" placeholder="ex.: reserva, viagem" value="${esc(it?it.desc:"")}"></label></div>
      ${state.config.metas.length?`<label class="f">Caixinha<select class="in" id="s-meta"><option value="">Geral (sem meta)</option>${state.config.metas.map(mt=>`<option value="${esc(mt.id)}" ${(it?it.metaId:s.metaId)===mt.id?"selected":""}>${esc(mt.nome)} — ${brl(saldoMeta(mt.id,null))} de ${brl(mt.alvo)}</option>`).join("")}</select></label>`:""}
      <p class="hint">Saldo atual da caixinha: <b>${brl(caixinhaAte(k))}</b></p>`;
    botoes=novo?`<button class="btn" type="submit">Salvar</button>`:`${apagar}<button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="fixo"){
    const cat=it?it.cat:(ui.gCat&&catIndex(ui.gCat)>=0?ui.gCat:state.config.categorias[0]?.id);
    const desde=it?it.desde:k;
    corpo=`<label class="f">Nome da conta<input class="in" id="s-nome" maxlength="40" placeholder="ex.: Aluguel, Internet, Academia" value="${esc(it?it.nome:"")}" ${s.valorRasc?"":"data-autofocus"}></label>
      ${valorCampo(it&&it.valor,"Valor por mês",false)}
      <div class="row"><label class="f narrow">Vence dia<input class="in num" id="s-diafixo" type="number" min="1" max="31" value="${it?it.dia:diaPadrao}"></label><label class="f">Começa em${selMes("s-desde",desde)}</label></div>
      <div class="f"><span>Categoria</span>${chipsCampo(cat)}</div>
      <div class="f"><span>Forma de pagamento</span>${chipsForma(it?it.forma:"boleto")}</div>
      ${selConta(it?it.contaId:null,"Sai da conta")}
      <p class="hint">Entra sozinha nas despesas de todos os meses a partir do mês escolhido. Em cada mês você marca se já pagou.</p>`;
    const apartir=ui.tab==="mes"?k:todayKey;
    if(!novo) corpo+=`<div class="zona"><p class="hint">Excluir a partir de ${esc(abrMes(apartir))} mantém a conta nos meses anteriores (o histórico continua certo).</p><button class="link danger" type="button" data-sexcluirfixo="todos">Apagar de todos os meses</button></div>`;
    sub=""; botoes=novo?`<button class="btn" type="submit">Salvar</button>`:`<button class="btn danger" type="button" data-sexcluirfixo="mes">Excluir a partir de ${esc(abrMes(apartir))}</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="fixoMes"){
    corpo=`<p class="hint">${esc(catName(it.cat))} · vence dia ${pad2(it.dia)} · ${esc(formaNome(it.forma))}</p>
      <label class="switch"><input type="checkbox" id="s-pago" ${it.pago?"checked":""}><span></span>Já paguei esta conta</label>
      ${valorCampo(it.valor,"Valor neste mês")}
      <p class="hint">Valor padrão: ${brl(it.padrao)}. Mudar aqui vale só para ${esc(nomeMes(k).toLowerCase())}.</p>
      <div class="row2"><button class="btn ghost" type="button" data-spular="fixos">${it.pular?"Voltar a contar neste mês":"Pular só este mês"}</button><button class="btn ghost" type="button" data-sabrir="fixo">Editar conta fixa</button></div>`;
    botoes=`<button class="btn danger" type="button" data-sexcluirfixo="mes">Excluir conta</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="parcela"){
    const ccp=it.forma==="credito"?cartaoDe(it):null, cartao=cartaoOk(ccp), prim=cartao?faturaMes(it.compra,it.dia,ccp):it.compra;
    corpo=`<p class="hint">Comprado em ${pad2(it.dia)}/${pad2(kM(it.compra))}/${kY(it.compra)} · parcelas de ${esc(abrMes(prim))} a ${esc(abrMes(shiftKey(prim,it.n-1)))}${cartao?" (na fatura)":""}</p>
      ${valorCampo(it.total,"Valor total da compra")}
      <div class="row"><label class="f narrow">Parcelas<input class="in num" id="s-n" type="number" min="2" max="48" value="${it.n}"></label>${cartao?"":`<label class="f narrow">Vence dia<input class="in num" id="s-venc" type="number" min="1" max="31" value="${it.venc||it.dia}"></label>`}<label class="f" style="flex:2 1 160px">Descrição<input class="in" id="s-desc" maxlength="80" value="${esc(it.desc)}"></label></div>
      ${(()=>{ const pm=parcelasDoMes(k).find(x=>x.id===it.id); return pm?`<label class="switch"><input type="checkbox" id="s-ppago" ${pm.pago?"checked":""}><span></span>Paguei a parcela ${pm.idx}/${pm.n} de ${esc(abrMes(k))} (${brl(pm.valor)})</label>`:""; })()}
      <div class="f"><span>Categoria</span>${chipsCampo(it.cat)}</div>
      <div class="f"><span>Forma de pagamento</span>${chipsForma(it.forma)}</div>
      <div id="s-contabox">${selConta(it.contaId,"Sai da conta")}</div><div id="s-cartaobox">${selCartao(it.cartaoId)}</div>`;
    sub=""; botoes=`<button class="btn danger" type="button" data-sapagar="1">Apagar compra</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="renda"){
    corpo=`<label class="f">Nome<input class="in" id="s-nome" maxlength="40" placeholder="ex.: Bolsa, Pensão, Aluguel recebido" value="${esc(it?it.nome:(s.nomeRasc||""))}" data-autofocus></label>
      ${valorCampo(it&&it.valor,"Valor por mês",false)}
      <div class="row"><label class="f narrow">Cai no dia<input class="in num" id="s-diarenda" type="number" min="1" max="31" inputmode="numeric" value="${it?(it.dia||1):1}"></label><label class="f">Começa em${selMes("s-desde",it?it.desde:k)}</label></div>
      ${selConta(it?it.contaId:null,"Entra na conta")}
      <p class="hint">Entra sozinha nas receitas de todos os meses a partir do mês escolhido.</p>`;
    sub=""; botoes=novo?`<button class="btn" type="submit">Salvar</button>`:`<button class="btn danger" type="button" data-sencerrar="rendas">Encerrar renda</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="rendaMes"){
    corpo=`${valorCampo(it.valor,"Valor neste mês")}<p class="hint">Valor padrão: ${brl(it.padrao)}. Mudar aqui vale só para ${esc(nomeMes(k).toLowerCase())}.</p>
      <div class="row2"><button class="btn ghost" type="button" data-spular="rendas">${it.pular?"Voltar a contar neste mês":"Pular só este mês"}</button><button class="btn ghost" type="button" data-sabrir="renda">Editar renda fixa</button></div>`;
    botoes=`<button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="categoria"){
    const usada=it?Object.values(state.months).reduce((a,m)=>a+(m.gastos||[]).filter(g=>g.cat===it.id).length,0)+state.config.fixos.filter(f=>f.cat===it.id).length+state.config.parcelas.filter(p=>p.cat===it.id).length:0;
    const usadas=new Set(state.config.categorias.filter(c=>c!==it).map(corIdx));
    const corSel=it?corIdx(it):[...Array(NCORES).keys()].find(i=>!usadas.has(i))??0;
    corpo=`<label class="f">Nome<input class="in" id="s-nome" maxlength="40" placeholder="ex.: Pets, Presentes, Viagem" value="${esc(it?it.nome:"")}" ${s.foco==="regras"?"":"data-autofocus"}></label>
      <div class="f"><span>Ícone</span><div class="icones" role="radiogroup" aria-label="Ícone">${Object.keys(ICAT).map(kk=>{ const sel=it?(it.ic||icAuto(it.nome)):"pontos"; return `<input type="radio" name="s-ic" id="s-ic-${kk}" value="${kk}" ${kk===sel?"checked":""}><label for="s-ic-${kk}" title="${ICAT_NOMES[kk]}">${svgCat(kk,20)}<span class="sr">${ICAT_NOMES[kk]}</span></label>`; }).join("")}</div></div>
      <div class="f"><span>Cor</span><div class="cores" role="radiogroup" aria-label="Cor">${[...Array(NCORES).keys()].map(i=>`<input type="radio" name="s-cor" id="s-cor-${i}" value="${i}" ${i===corSel?"checked":""}><label for="s-cor-${i}" style="--dot:var(--c${i})" title="Cor ${i+1}"><span class="sr">Cor ${i+1}</span></label>`).join("")}</div></div>
      <label class="f money">Limite por mês (opcional)<input class="in num" id="s-valor" inputmode="numeric" placeholder="sem limite" value="${esc(it&&it.orcamento?moneyInput(it.orcamento):"")}"></label>
      <div class="f sobrabox"><label class="switch"><input type="checkbox" id="s-sobra" ${it&&it.sobra?"checked":""}><span></span>Sobra passa para o mês seguinte</label>
        <p class="hint">Ex.: limite de R$ 800 e gastou R$ 700: os R$ 100 que sobraram entram no limite do mês seguinte (R$ 900). Se passar do limite, a sobra zera. ${it&&it.sobra&&sobraCat(it,todayKey)>0?`<b>Em ${esc(abrMes(todayKey))}: ${brl(limiteCat(it,todayKey))} (${brl(it.orcamento)} + ${brl(sobraCat(it,todayKey))} de sobra).</b>`:"Só vale para categorias com limite e começa a contar a partir deste mês."}</p></div>
      <div class="f"><span>Subcategorias (opcional)</span><div id="s-sublista">${((it&&it.subs)||[]).map(linhaSub).join("")}</div>
        <div class="convrow"><input class="in" id="s-subnova" maxlength="30" placeholder="ex.: Mercado, Restaurante, iFood"><button class="btn ghost" type="button" data-addsub="1">Adicionar</button></div>
        <p class="hint">O limite e o gráfico continuam pela categoria; as subcategorias mostram o detalhe.</p></div>
      <label class="f">Regras automáticas (opcional)<textarea class="in" id="s-palavras" rows="2" maxlength="600" placeholder="ex.: pet shop, ração, petz" ${s.foco==="regras"?"data-autofocus":""}>${esc(((it&&it.palavras)||[]).join(", "))}</textarea></label>
      <p class="hint">Palavras separadas por vírgula. Quando a descrição de uma despesa tiver uma delas, ela já entra nesta categoria — no lançamento rápido, ao digitar a descrição e na importação de extrato.</p>
      ${it&&usada?`<p class="hint">Usada em ${usada} lançamento(s). Se excluir, eles continuam nas contas como "Sem categoria".</p>`:""}`;
    sub=""; botoes=novo?`<button class="btn" type="submit">Criar categoria</button>`:`<button class="btn danger" type="button" data-sapagar="1" ${state.config.categorias.length<=1?"disabled":""}>Excluir</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="conta"){
    const primeira=!contasMov().length, recebe=it?(state.config.contaSalario||(contasMov()[0]||{}).id)===it.id:primeira;
    corpo=`<label class="f">Nome<input class="in" id="s-nome" maxlength="30" placeholder="ex.: Nubank, Caixa, Carteira" value="${esc(it?it.nome:"")}" data-autofocus></label>
      <div class="seg" role="radiogroup" aria-label="Tipo de conta">${[["corrente","Corrente"],["poupanca","Poupança"],["dinheiro","Dinheiro"],["investimento","Investimento"],["outra","Outra"]].map(([v,l])=>`<input type="radio" name="s-tipoconta" id="s-tc-${v}" value="${v}" ${(it?it.tipo:(s.ctTipo||"corrente"))===v?"checked":""}><label for="s-tc-${v}">${l}</label>`).join("")}</div>
      ${valorCampo(it?it.saldoInicial:(primeira&&state.config.saldoInicial?state.config.saldoInicial:null),"Saldo que a conta tinha no início do controle",false)}
      <label class="switch"><input type="checkbox" id="s-recebe" ${recebe?"checked":""}><span></span>O salário cai nesta conta</label>
      <p class="hint">Lançamentos sem conta escolhida usam a primeira conta da lista${contasMov()[0]&&!primeira?" ("+esc(contasMov()[0].nome)+")":""}.</p>`;
    sub=""; botoes=novo?`<button class="btn" type="submit">Criar conta</button>`:`<button class="btn danger" type="button" data-sapagar="1">Excluir conta</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="bksenha"){
    corpo=`<p class="hint">O arquivo sai criptografado (AES-GCM). Só abre com a senha: <b>sem ela, ninguém recupera o backup, nem você</b>. Guarde a senha num gerenciador de senhas.</p>
      <label class="f">Senha (mínimo 8 caracteres)<input class="in" id="s-senha" type="password" autocomplete="new-password" minlength="8" maxlength="200" required data-autofocus></label>
      <label class="f">Repita a senha<input class="in" id="s-senha2" type="password" autocomplete="new-password" minlength="8" maxlength="200" required></label>`;
    sub=""; botoes=`<button class="btn" type="submit">Baixar backup com senha</button>`;
  }else if(s.tipo==="bkabrir"){
    corpo=`<p class="hint">Este backup está protegido por senha. Digite a senha usada ao baixar. Se estiver errada, nada é alterado.</p>
      <label class="f">Senha do backup<input class="in" id="s-senha" type="password" autocomplete="current-password" maxlength="200" required data-autofocus></label>`;
    sub=""; botoes=`<button class="btn" type="submit">Restaurar backup</button>`;
  }else if(s.tipo==="excluirconta"){
    const gs=meusGrupos(), meus=gs.filter(g=>g.dono), outros=gs.filter(g=>!g.dono);
    corpo=`<p><b>Isto apaga para sempre:</b></p>
      <ul class="exclista"><li>todos os seus lançamentos, contas, cartões, metas e configurações do controle Pessoal;</li>
      ${meus.length?`<li>os controles compartilhados que você criou, <b>para todas as pessoas</b>: ${meus.map(g=>"“"+esc(g.nome||"Sem nome")+"”").join(", ")};</li>`:""}
      ${outros.length?`<li>a sua participação em ${outros.map(g=>"“"+esc(g.nome||"Sem nome")+"”").join(", ")} (os lançamentos desses controles continuam com as outras pessoas);</li>`:""}
      <li>a sua conta de login no Monetra.</li></ul>
      <p class="hint">Quer guardar uma cópia? Feche esta janela e baixe um backup antes, em Perfil → Exportar e backup. O Google pode pedir para você entrar de novo antes de excluir.</p>
      <label class="f">Para confirmar, digite EXCLUIR<input class="in" id="s-excluir" autocomplete="off" placeholder="EXCLUIR" data-autofocus></label>`;
    sub=""; botoes=`<button class="btn danger" type="submit">Excluir minha conta para sempre</button>`;
  }else if(s.tipo==="bem"){
    corpo=`<label class="f">Nome<input class="in" id="s-nome" maxlength="30" placeholder="ex.: Apartamento, Carro, Moto" value="${esc(it?it.nome:"")}" data-autofocus></label>
      <div class="seg" role="radiogroup" aria-label="Tipo de bem">${TIPOS_BEM.map(([v,l])=>`<input type="radio" name="s-tipobem" id="s-tb-${v}" value="${v}" ${(it?it.tipo:"bem-imovel")===v?"checked":""}><label for="s-tb-${v}">${l}</label>`).join("")}</div>
      ${valorCampo(it?it.saldoInicial:null,"Quanto vale hoje (aproximado)",false)}
      <p class="hint">Entra no seu patrimônio, em Relatórios. Não mexe no saldo do mês. Atualize o valor de vez em quando.</p>`;
    sub=""; botoes=novo?`<button class="btn" type="submit">Adicionar ao patrimônio</button>`:`<button class="btn danger" type="button" data-sapagar="1">Excluir</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="cartao"){
    const u=it?usoCartao(it):null;
    corpo=`<label class="f">Nome do cartão<input class="in" id="s-nome" maxlength="30" placeholder="ex.: Nubank, Inter, Itaú" value="${esc(it?it.nome:"")}" data-autofocus></label>
      <div class="row"><label class="f">Fecha dia<input class="in num" id="s-fecha" type="number" min="1" max="31" inputmode="numeric" placeholder="ex.: 25" value="${it&&it.fecha?it.fecha:""}"></label><label class="f">Vence dia<input class="in num" id="s-vence" type="number" min="1" max="31" inputmode="numeric" placeholder="ex.: 5" value="${it&&it.vence?it.vence:""}"></label></div>
      ${valorCampo(it?it.limite:null,"Limite do cartão (opcional)",false)}
      ${selConta(it?it.contaId:null,"A fatura é paga pela conta")}
      ${u&&it.limite?`<p class="hint">Usado: <b>${brl(u.usado)}</b> · livre: <b>${brl(u.livre)}</b> (compras e parcelas ainda não pagas).</p>`:`<p class="hint">Compras feitas até o dia anterior ao fechamento entram na fatura do mês; no dia do fechamento, já vão para a próxima.</p>`}`;
    sub=""; botoes=novo?`<button class="btn" type="submit">Salvar cartão</button>`:`<button class="btn danger" type="button" data-sapagar="1">Excluir cartão</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="transf"){
    const cs=contasMov();
    corpo=`${valorCampo(it&&it.valor)}
      <div class="row">${selConta(it?it.de:cs[0]&&cs[0].id,"Sai de","s-de")}${selConta(it?it.para:cs[1]&&cs[1].id,"Vai para","s-para")}</div>
      <div class="row"><label class="f">Dia${selDia(k,it?it.dia:diaPadrao)}</label><label class="f" style="flex:2 1 180px">Descrição (opcional)<input class="in" id="s-desc" maxlength="60" placeholder="ex.: saque, guardar na poupança" value="${esc(it?it.desc:"")}"></label></div>
      <p class="hint">Transferência só muda o saldo das contas. Não conta como receita nem como despesa.</p>`;
    botoes=novo?`<button class="btn" type="submit">Transferir</button>`:`${apagar}<button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="importar"){
    sub="";
    if(s.pedeSenha&&s.pdfArq){
      corpo=`<p class="hint"><b>${esc(s.pdfArq.name)}</b> tem senha. Digite a senha do arquivo para o app ler o extrato. A senha não fica salva.</p>
        <label class="f">Senha do PDF<input class="in" type="password" id="s-impsenha" autocomplete="off" autocapitalize="off" spellcheck="false" data-autofocus ${s.erroImp?'aria-invalid="true" aria-describedby="s-imperro"':""}></label>
        ${s.lendo?`<p class="hint" role="status">Lendo o PDF…</p>`:""}
        ${s.erroImp?`<p class="erro" id="s-imperro" role="alert">${esc(s.erroImp)}</p>`:""}`;
      botoes=`<button class="btn ghost" type="button" data-impvoltar="1">Outro arquivo</button><button class="btn" type="button" data-impsenha="1">Abrir PDF</button>`;
    } else if(!s.itens){
      corpo=`<p class="hint">No app ou no site do seu banco, procure <b>Extrato</b> (ou a fatura do cartão) e a opção de <b>exportar / baixar</b> em <b>OFX</b>, <b>CSV</b> (Excel) ou <b>PDF</b>. Depois escolha o arquivo aqui. OFX e CSV costumam vir mais completos; o PDF precisa ter texto (não serve foto ou documento escaneado).</p>
        ${selConta(s.contaImp,"Os lançamentos são da conta","s-impconta")}
        <label class="switch"><input type="checkbox" id="s-impcartao" ${s.cartaoMarcado?"checked":""}><span></span>É a fatura de um cartão de crédito</label>
        ${state.config.cartoes.length>1?`<div id="s-impcartaobox">${selCartao(s.cartaoImp)}</div>`:""}
        <label class="btn wide" for="s-arquivo" style="cursor:pointer">Escolher arquivo do extrato<input type="file" id="s-arquivo" accept=".ofx,.csv,.txt,.pdf,text/csv,application/x-ofx,application/pdf" hidden></label>
        ${s.lendo?`<p class="hint" role="status">Lendo o arquivo…</p>`:""}
        ${s.erroImp?`<p class="erro" role="alert">${esc(s.erroImp)}</p>`:""}
        <p class="hint">O app sugere a categoria de cada gasto e desmarca o que já foi lançado. Você confere antes de importar.</p>`;
    } else {
      const its=s.itens, inc=its.filter(x=>x.incluir&&!x.bloq), cats=state.config.categorias;
      corpo=`<p class="hint"><b>${esc(s.arquivo||"Arquivo")}</b> · ${its.length} lançamentos · ${inc.filter(x=>x.tipo==="gasto").length} despesa${inc.filter(x=>x.tipo==="gasto").length===1?"":"s"} (${brl(soma(inc.filter(x=>x.tipo==="gasto")))}) e ${inc.filter(x=>x.tipo==="receita").length} receita${inc.filter(x=>x.tipo==="receita").length===1?"":"s"} (${brl(soma(inc.filter(x=>x.tipo==="receita")))}) marcadas</p>
        <div class="implista">${its.slice(0,400).map((x,i)=>`<div class="imp ${x.incluir&&!x.bloq?"":"off"} ${x.tipo}">
          <input type="checkbox" data-impi="${i}" ${x.incluir&&!x.bloq?"checked":""} ${x.bloq?"disabled":""} aria-label="Importar este lançamento">
          <span class="d">${pad2(x.dia)}/${pad2(kM(x.k))}</span>
          <span class="t"><b>${esc(x.desc||"sem descrição")}</b>${x.obs?`<small>${esc(x.obs)}</small>`:""}
            ${x.tipo==="gasto"?`<select class="in mini" data-impcat="${i}" aria-label="Categoria">${cats.map(c=>`<option value="${esc(c.id)}" ${c.id===x.cat?"selected":""}>${esc(c.nome)}</option>`).join("")}</select>`:x.tipo==="receita"?`<small class="pos">receita</small>`:""}</span>
          <span class="v ${x.tipo==="receita"?"pos":""}">${x.tipo==="receita"?"+":"−"}${brl(x.valor)}</span></div>`).join("")}</div>
        ${its.length>400?`<p class="hint">Mostrando os 400 primeiros.</p>`:""}`;
      botoes=`<button class="btn ghost" type="button" data-impvoltar="1">Outro arquivo</button><button class="btn" type="button" data-impok="1">Importar ${inc.length} lançamento${inc.length===1?"":"s"}</button>`;
    }
  }else if(s.tipo==="desafio"){
    const e=it?estadoDesafio(it):null, tp=it?it.tipo:(s.mod&&MODELOS_DES[s.mod]?MODELOS_DES[s.mod].tipo:"sem"), md=s.mod&&MODELOS_DES[s.mod]||{};
    const catSel=it?it.cat:(md.icCat?((state.config.categorias.find(c=>catIc(c.id)===md.icCat)||{}).id||""):"");
    corpo=`${novo?`<div class="f"><span>Comece por um modelo</span><div class="cats modelos">${Object.entries(MODELOS_DES).map(([kk,m])=>`<button type="button" class="tag ${s.mod===kk?"on":""}" data-desmodelo="${kk}">${esc(m.nome)}</button>`).join("")}</div></div>`:""}
      ${e?`<div class="desafio ${e.st}" style="cursor:default"><div class="track ${e.st==="quebrou"?"over":""}"><div style="width:${Math.min(100,Math.round(e.pct*100))}%"></div></div><small>${esc(textoDesafio(it,e))}</small></div>`:""}
      <label class="f">Nome<input class="in" id="s-nome" maxlength="50" placeholder="ex.: 30 dias sem delivery" value="${esc(it?it.nome:md.nome||"")}"></label>
      <div class="f"><span>Tipo</span><div class="seg"><input type="radio" name="s-dtipo" id="s-dt-sem" value="sem" ${tp==="sem"?"checked":""}><label for="s-dt-sem">Não gastar nada</label><input type="radio" name="s-dtipo" id="s-dt-max" value="max" ${tp==="max"?"checked":""}><label for="s-dt-max">Gastar no máximo</label></div></div>
      <div id="s-dvalbox" ${tp==="max"?"":"hidden"}>${valorCampo(it?it.valor:md.valor||null,"Valor máximo no período",false)}</div>
      <label class="f">Com o quê (categoria)<select class="in" id="s-dcat"><option value="">Qualquer categoria (use as palavras)</option>${state.config.categorias.map(c=>`<option value="${esc(c.id)}" ${c.id===catSel?"selected":""}>${esc(c.nome)}</option>`).join("")}</select></label>
      <label class="f">Palavras na descrição (opcional)<input class="in" id="s-dpal" maxlength="80" placeholder="ex.: ifood, delivery, rappi" value="${esc(it?it.palavras:md.palavras||"")}"></label>
      <div class="row"><label class="f">Duração<select class="in" id="s-ddias">${[7,10,15,21,30,60,90].concat(it&&![7,10,15,21,30,60,90].includes(it.dias)?[it.dias]:[]).map(n=>`<option value="${n}" ${n===(it?it.dias:md.dias||30)?"selected":""}>${n} dias</option>`).join("")}</select></label><label class="f">Começa em<input class="in" id="s-dini" type="date" value="${it?it.inicio:hojeISO()}"></label></div>
      <p class="hint">O app confere sozinho pelos seus lançamentos: conta se a despesa for da categoria escolhida <b>ou</b> tiver uma das palavras na descrição.</p>`;
    sub=""; botoes=novo?`<button class="btn" type="submit">Começar desafio</button>`:`<button class="btn danger" type="button" data-sapagar="1">Excluir</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="meta"){
    const i=it?infoMeta(it,null):null;
    corpo=`<label class="f">Nome da meta<input class="in" id="s-nome" maxlength="40" placeholder="ex.: Viagem, Reserva de emergência" value="${esc(it?it.nome:"")}" data-autofocus></label>
      ${valorCampo(it&&it.alvo,"Quanto quer juntar",false)}
      <label class="f">Prazo (opcional)<input class="in" id="s-prazo" type="month" min="${todayKey}" value="${it&&it.prazo?it.prazo:""}"></label>
      ${i?`<div class="metas">${linhaMeta(it,null).replace('data-edit="meta"','data-x="1"')}</div><button class="btn ghost" type="button" data-sguardarmeta="1">+ Guardar nesta meta</button>`:`<p class="hint">Com prazo, o app mostra quanto guardar por mês para chegar lá.</p>`}`;
    sub=""; botoes=novo?`<button class="btn" type="submit">Criar meta</button>`:`<button class="btn danger" type="button" data-sapagar="1">Excluir meta</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="viagem"){
    const r=it?resumoViagem(it):null, mo=it?it.moeda:"USD";
    corpo=`<label class="f">Nome da viagem<input class="in" id="s-nome" maxlength="40" placeholder="ex.: Chile 2027, Férias em Paris" value="${esc(it?it.nome:"")}" ${novo?"data-autofocus":""}></label>
      <div class="row"><label class="f">Ida<input class="in" id="s-vini" type="date" value="${esc(it&&it.inicio?it.inicio:hojeISO())}"></label><label class="f">Volta<input class="in" id="s-vfim" type="date" value="${esc(it&&it.fim?it.fim:"")}"></label></div>
      <label class="f">Moeda do destino<select class="in" id="s-vmoeda">${MOEDAS.map(([c,n])=>`<option value="${c}" ${c===mo?"selected":""}>${c} · ${esc(n)}</option>`).join("")}</select></label>
      <div class="row"><label class="f"><span id="s-vcotlab">Cotação (1 ${esc(mo)} em R$)</span><input class="in" id="s-vcot" inputmode="decimal" placeholder="ex.: 5,40" value="${esc(it?fmtCot(it.cotacao):"")}"></label><label class="f narrow">Taxas %<input class="in" id="s-vtaxa" inputmode="decimal" placeholder="0" value="${esc(it&&it.taxa?fmtCot(it.taxa):"")}"></label></div>
      <p class="hint" id="s-vcotinfo">${novo?"":"Mudar a cotação vale para os próximos gastos; os já lançados mantêm a cotação do dia em que foram lançados."}</p>
      <button class="btn ghost" type="button" data-vgcot="1">Buscar cotação de hoje</button>
      <p class="hint">Em "Taxas %", some o IOF e o spread que o seu cartão ou banco cobra em compras no exterior (confira no app do banco). Deixe 0 se pagar em dinheiro trocado.</p>
      <label class="f money">Orçamento da viagem em R$ (opcional)<input class="in num" id="s-valor" inputmode="numeric" placeholder="sem limite" value="${esc(it&&it.orcamento?moneyInput(it.orcamento):"")}"></label>`
      +(r?`<div class="divpags"><div class="subhead">Resumo</div>
        <div class="assintot"><div><span class="lab">Total</span><b>${brl(r.total)}</b>${it.moeda!=="BRL"?`<small>${fmtMoeda(r.emMoeda,it.moeda)} em ${it.moeda}</small>`:""}</div><div><span class="lab">Por dia</span><b>${brl(r.porDia)}</b><small>${r.passados} de ${r.dias} dias</small></div>${it.orcamento?`<div><span class="lab">${r.resta>=0?"Resta":"Passou"}</span><b class="${r.resta<0?"neg":"pos"}">${brl(Math.abs(r.resta))}</b></div>`:""}</div>
        ${Object.keys(r.porCat).length?`<div class="bars">${Object.entries(r.porCat).sort((a,b)=>b[1]-a[1]).map(([cid,v])=>`<div class="bar" style="--dot:${catColor(cid)}"><div class="t"><b>${esc(catName(cid))}</b><span class="num">${brl(v)}</span></div><div class="track"><div style="width:${(r.total?v/r.total*100:0).toFixed(1)}%"></div></div></div>`).join("")}</div>`:`<p class="hint">Nenhum gasto lançado nesta viagem ainda.</p>`}
        ${r.gs.length?`<div class="subhead">Gastos (${r.gs.length})</div>${r.gs.slice().reverse().slice(0,40).map(g=>`<div class="pagrow"><span>${pad2(g.dia)}/${pad2(kM(g.k))}</span><b>${esc(g.desc||catName(g.cat))}</b><small class="muted">${g.orig&&g.orig.moeda!=="BRL"?esc(fmtMoeda(g.orig.valor,g.orig.moeda)):""}</small><span>${brl(g.valor)}</span></div>`).join("")}`:""}</div>`:"");
    sub=""; botoes=novo?`<button class="btn" type="submit">Criar viagem</button>`:`${apagar}<button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="divida"){
    const tp=it?it.tipo:(s.dTipo||"receber"), nomes=[...new Set(state.config.dividas.map(x=>x.pessoa))];
    corpo=`<div class="seg" role="radiogroup" aria-label="Tipo"><input type="radio" name="s-dtipo" id="s-dtR" value="receber" ${tp==="receber"?"checked":""}><label for="s-dtR">Me devem</label><input type="radio" name="s-dtipo" id="s-dtP" value="pagar" ${tp==="pagar"?"checked":""}><label for="s-dtP">Eu devo</label></div>
      <label class="f">Pessoa<input class="in" id="s-pessoa" maxlength="40" list="s-pessoas" placeholder="ex.: João" value="${esc(it?it.pessoa:"")}" ${novo?"data-autofocus":""}></label><datalist id="s-pessoas">${nomes.map(n=>`<option value="${esc(n)}">`).join("")}</datalist>
      ${valorCampo(it&&it.valor,"Valor total",false)}
      <label class="f">Do que é (opcional)<input class="in" id="s-desc" maxlength="60" placeholder="ex.: empréstimo, conta do bar" value="${esc(it?it.desc:"")}"></label>
      <div class="row"><label class="f">Data<input class="in" id="s-ddata" type="date" value="${esc(it&&it.data?it.data:hojeISO())}"></label><label class="f">Combinado para (opcional)<input class="in" id="s-dvenc" type="date" value="${esc(it&&it.venc?it.venc:"")}"></label></div>`
      +(it?`<div class="divpags"><div class="subhead">Pagamentos</div>
        ${it.pags.length?it.pags.map(p=>`<div class="pagrow"><span>${dataCurta(p.data)}</span><b>${brl(p.valor)}</b><button type="button" class="link" data-divdelpag="${esc(p.id)}" aria-label="Apagar pagamento">apagar</button></div>`).join(""):`<p class="hint">Nenhum pagamento ainda.</p>`}
        <p class="divresta">${quitada(it)?`<b class="pos">Quitada</b>`:`Falta <b>${brl(restaDiv(it))}</b> de ${brl(it.valor)}`}</p>
        ${quitada(it)?"":`<div class="convrow"><label class="f money" style="flex:1"><span class="sr">Valor pago</span><input class="in num" id="s-pagval" inputmode="numeric" placeholder="${moneyInput(restaDiv(it))}"></label><button class="btn" type="button" data-divpag="1">Registrar</button></div>
        <label class="switch"><input type="checkbox" id="s-paglanca"><span></span>Lançar no mês como ${it.tipo==="receber"?"receita":"despesa"}</label>
        <button class="link" type="button" data-divquitar="1">Quitar tudo (${brl(restaDiv(it))})</button>`}</div>`:"");
    sub=""; botoes=novo?`<button class="btn" type="submit">Salvar</button>`:`${apagar}<button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="retro"){
    const d=dadosRetro(s.ano), sl=d?slidesRetro(d):[]; s.slide=Math.max(0,Math.min(s.slide||0,sl.length-1));
    corpo=d?`<div class="rprog">${sl.map((x,i)=>`<i class="${i<s.slide?"on":i===s.slide?"on cur":""}"></i>`).join("")}</div><div class="rslide ${sl[s.slide].cls}" data-rtoque="1">${sl[s.slide].html}</div>`:`<p class="hint">Ainda não há dados para a retrospectiva.</p>`;
    sub=d?(s.slide+1)+" de "+sl.length+` <button type="button" class="rauto" data-rauto="1" aria-pressed="${a11y.retroAuto}">${a11y.retroAuto?"Pausar":"Avançar sozinha"}</button>`:""; botoes=d?`<button class="btn ghost" type="button" data-rpasso="-1" ${s.slide===0?"disabled":""}>Anterior</button>${s.slide<sl.length-1?`<button class="btn" type="button" data-rpasso="1">Próximo</button>`:`<button class="btn" type="button" data-sfechar="1">Fechar</button>`}`:"";
  }else if(s.tipo==="pin"){
    const campo=(id,lab,auto)=>`<label class="f">${lab}<input class="in pinin" id="${id}" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="${PINLEN}" autocomplete="off" ${auto?"data-autofocus":""}></label>`;
    corpo=(s.pinModo!=="criar"?campo("s-pinatual","PIN atual",true):"")+(s.pinModo!=="desligar"?campo("s-pinnovo","Novo PIN ("+PINLEN+" números)",s.pinModo==="criar")+campo("s-pinrep","Repita o novo PIN"):"")
      +(s.pinModo==="criar"?`<p class="hint">${mode==="cloud"?"Guarde bem: se esquecer, é preciso sair e entrar de novo com a conta Google para tirar o PIN.":"Guarde bem: sem login, se esquecer o PIN a única saída é apagar os dados deste aparelho."}</p>`:"");
    sub=""; botoes=`<button class="btn ${s.pinModo==="desligar"?"danger":""}" type="submit">${s.pinModo==="desligar"?"Desligar PIN":s.pinModo==="trocar"?"Trocar PIN":"Criar PIN"}</button>`;
  }else if(s.tipo==="avisos"){
    corpo=`<div class="avisos">${listaAvisos()}</div>`; sub=""; botoes="";
  }else if(s.tipo==="calc"){
    corpo=corpoCalc(s.calc||"decimo"); sub=""; botoes="";
  }else if(s.tipo==="simulador"){
    const devo=(state.config.dividas||[]).filter(x=>x.tipo==="pagar"&&!quitada(x));
    corpo=`<p class="hint">Descubra em quanto tempo quita uma dívida (cartão, cheque especial, empréstimo ou financiamento) e quanto economiza pagando um pouco a mais.</p>
      ${devo.length?`<div class="f"><span>Usar uma dívida anotada</span><div class="cats">${devo.map(x=>`<button type="button" class="tag" data-simdiv="${esc(x.id)}">${esc(x.pessoa)} · ${brl(restaDiv(x))}</button>`).join("")}</div></div>`:""}
      <label class="f money">Quanto deve hoje<input class="in num" id="s-simsaldo" inputmode="numeric" placeholder="0,00" value="${s.simSaldo?moneyInput(s.simSaldo):""}"></label>
      <p class="hint" id="s-simsaldoinfo"></p>
      <div class="row"><label class="f">Juros ao mês (%)<input class="in num" id="s-simtaxa" inputmode="decimal" placeholder="ex.: 2,5" maxlength="6"></label><label class="f">Ou: faltam quantas parcelas?<input class="in num" id="s-simn" type="number" min="1" max="600" inputmode="numeric" placeholder="opcional"></label></div>
      <div class="f"><span>Taxas de exemplo (confira a sua)</span><div class="cats">${[["Rotativo do cartão","14"],["Cheque especial","8"],["Empréstimo pessoal","4"],["Consignado","1,8"],["Financiamento","1,2"]].map(([n,t])=>`<button type="button" class="tag" data-simtaxa="${t}">${n} ~${t}%</button>`).join("")}</div></div>
      <div class="row"><label class="f money">Paga por mês hoje<input class="in num" id="s-simpag" inputmode="numeric" placeholder="0,00"></label><label class="f money">E se pagar a mais?<input class="in num" id="s-simextra" inputmode="numeric" placeholder="0,00"></label></div>
      <div id="s-simres">${resultadoSim()}</div>`;
    sub=""; botoes="";
  }else if(s.tipo==="meses"){
    const V=mesesVisiveis(), a0=kY(V[0]), a1=kY(V[V.length-1]), ano=Math.min(a1,Math.max(a0,Number(s.ano)||kY(ui.month))), sel=s.sel||ui.month;
    corpo=`<div class="mesano"><div class="mesnav"><button type="button" class="iconbtn" data-mesano="-1" aria-label="Ano anterior" ${ano<=a0?"disabled":""}>‹</button><b>${ano}</b><button type="button" class="iconbtn" data-mesano="1" aria-label="Próximo ano" ${ano>=a1?"disabled":""}>›</button></div>
      <div class="mesgrid">${ABR.map((ab,i)=>{ const k=keyOf(ano,i+1), ok=V.includes(k), conta=ok&&k>todayKey&&temContaNoMes(k);
        return `<button type="button" class="mg ${k===sel?"on":""} ${k===todayKey?"now":""}" data-messel="${k}" ${ok?"":"disabled"} aria-pressed="${k===sel}" aria-label="${esc(nomeMes(k))}${conta?", com conta a pagar":""}">${esc(ab.toUpperCase())}${conta?'<i class="mgdot" aria-hidden="true"></i>':""}</button>`; }).join("")}</div>
      <p class="hint mgleg"><i class="mgdot" aria-hidden="true"></i> mês com fatura ou parcela para pagar</p></div>`;
    sub=""; botoes=`<button class="btn" type="button" data-mesok="1">Ver ${esc(nomeMes(sel).toLowerCase())}</button>`;
  }else if(s.tipo==="semana"){
    corpo=`<div class="semana">${corpoSemana(s.fim||ultimoDomingo())}</div>`; sub=""; botoes="";
  }else if(s.tipo==="catmes"){
    corpo=corpoCatMes(k,s.cat); sub=esc(nomeMes(k)); botoes="";
  }else if(s.tipo==="dia"){
    const dd=Math.min(diasMes(k),Math.max(1,Number(s.dia)||1));
    corpo=corpoDia(k,dd); sub=esc(nomeMes(k));
    botoes=`<button class="btn" type="button" data-callancar="${dd}">${ICON.mais||"+"} Lançar despesa neste dia</button>`;
  }else if(s.tipo==="monebot"){
    corpo=corpoMoneBot(); sub="";
  }else if(s.tipo==="busca"){
    corpo=`<label class="f"><span>Procure lançamentos (descrição, categoria, valor, #etiqueta) ou telas, como “cartões” e “13º”</span><input class="in" id="s-busca" type="search" placeholder="ex.: farmácia, aluguel, 89,90" value="${esc(s.q||"")}" data-autofocus autocomplete="off"></label><div id="s-result" class="busca"></div>`;
    sub="";
  }
  r.innerHTML=`<div class="sheet-wrap ${s.tipo==="retro"?"stories"+(a11y.retroAuto?" auto":""):""}" data-sfechar="1" role="dialog" aria-modal="true" aria-labelledby="sheetTit"><form class="sheet${s.tipo==="retro"?" st"+((s.slide||0)%6):""}" id="sheetForm" autocomplete="off" novalidate>
    <div class="sheethead"><h2 id="sheetTit">${esc(titulos[s.tipo])}</h2><span class="muted small">${sub}</span><button type="button" class="x" data-sfechar="1" aria-label="Fechar">×</button></div>
    ${abas}${corpo}<p class="erro" id="s-erro" hidden></p>${botoes?`<div class="sheetbtns">${botoes}</div>`:""}</form></div>`;
  if(s.tipo==="busca") atualizaBusca();
  if(s.tipo==="monebot"){ const c=document.getElementById("mb-chat"); if(c) c.scrollTop=c.scrollHeight; }
  clearTimeout(timerStory);
  if(s.tipo==="retro"&&a11y.retroAuto&&!semMovimento()){ const fixo=s.slide; timerStory=setTimeout(()=>{ if(ui.sheet===s&&s.slide===fixo){ const nx=document.querySelector('#sheet [data-rpasso="1"]'); if(nx) nx.click(); } },6500); }
  if(s.tipo==="gasto") atualizaVg();
  setTimeout(()=>encolheValores(document.getElementById("sheet")),0);
  if(s.tipo==="conta"){ const ev=document.getElementById("s-valor"); if(ev) ev.dataset.neg="1"; }
  if(s.tipo==="gasto") atualizaParc();
  if(s.tipo==="gasto"||s.tipo==="parcela") atualizaFormaBox();
}
function atualizaParc(){
  const box=document.getElementById("s-parcbox"), on=document.getElementById("s-parc"); if(!box||!on) return;
  box.hidden=!on.checked; document.getElementById("s-valorlab").textContent=on.checked?"Valor total da compra":"Valor"; if(document.getElementById("s-vgon")) atualizaVg();
  let v=parseMoney(document.getElementById("s-valor").value); const n=Math.round(Number(document.getElementById("s-n").value)||0);
  const vgOn=document.getElementById("s-vgon"), vgP=vgOn&&vgOn.checked?(state.config.viagens||[]).find(x=>x.id===((document.getElementById("s-vgid")||{}).value)):null, mP=(document.querySelector('#sheet input[name="s-vgmoeda"]:checked')||{}).value;
  if(vgP&&mP&&mP!=="BRL"&&v>0) v=emReais(v,vgP);
  document.getElementById("s-parcinfo").textContent=on.checked&&v>0&&n>=2?(valorParcela(v,n,0)===valorParcela(v,n,n-1)?n+"x de "+brl(valorParcela(v,n,0)):n+"x de "+brl(valorParcela(v,n,0))+" (última "+brl(valorParcela(v,n,n-1))+")")+", a primeira em "+abrMes(document.querySelector('#sheet input[name="s-forma"]:checked')?.value==="credito"?faturaMes((document.getElementById("s-gmes")||{}).value||((document.getElementById("s-gmes")||{}).value||mesSheet()),Number(document.getElementById("s-dia").value)||1,state.config.cartoes.find(c=>c.id===valSel("s-cartao"))||state.config.cartoes[0]||null):((document.getElementById("s-gmes")||{}).value||mesSheet())):"";
}
