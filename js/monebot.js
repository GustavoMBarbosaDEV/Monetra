// @ts-check
// MoneBot: perguntas e respostas com os dados do aparelho.
"use strict";
// Pergunte ao Monetra: entende perguntas em português e responde com os dados do próprio aparelho (nada sai dele)
/** @typedef {{tit:string,valor?:number|null,linhas:string[],barras?:{nome:string,v:number}[],ir?:{txt:string,cat:string,mes:MesKey}|null}} RespAssist */
const AS_SUGESTOES=["Quanto gastei com mercado este mês?","Onde mais gastei no mês passado?","Gastei mais que no mês passado?","Quanto gasto por mês em média?","Quando termino de pagar as parcelas?","Quanto está a fatura do cartão?","Quanto falta para as minhas metas?","Quanto tenho na caixinha?","Quanto gasto com contas fixas?","Quanto eu devo?"];
const AS_PARADA=new Set("quanto quantos quantas quanta qual quais quando onde como que o a os as um uma de do da dos das em no na nos nas ao aos com pra pro para por pelo pela meu minha meus minhas eu me mim ja foi foram foi esta estao esse este essa nesse neste nessa nesta tenho tive estou gastei gasto gastos gastando gastar gastamos despesa despesas paguei pago pagar mais menos total valor ate e ou mes meses ano vez vezes ai la isso aquilo tudo todo toda todos todas fiz tem teve".split(" "));
const AS_MESES=NOMES.map(n=>limpaPal(n));
/** Lê o período da pergunta. @param {string} t texto já limpo @returns {{ks:MesKey[],nome:string,resto:string}|null} */
function asPeriodo(t){
  const ateHoje=(/** @type {MesKey} */ a,/** @type {MesKey} */ b)=>{ const ks=[]; for(let k=a;k<=b&&ks.length<120;k=shiftKey(k,1)) ks.push(k); return ks; };
  let m;
  if((m=/\b(mes passado|mes anterior|ultimo mes)\b/.exec(t))){ const k=shiftKey(todayKey,-1); return {ks:[k],nome:nomeMes(k),resto:t.replace(m[0]," ")}; }
  if((m=/\bultimos? (\d{1,2}|dois|tres|seis|doze) meses\b/.exec(t))){ const n=Math.min(24,Math.max(1,Number({dois:2,tres:3,seis:6,doze:12}[m[1]]||m[1]))); return {ks:ateHoje(shiftKey(todayKey,1-n),todayKey),nome:"últimos "+n+" meses",resto:t.replace(m[0]," ")}; }
  if((m=/\b(este|esse|neste|nesse|no|deste|desse) ano\b/.exec(t))){ const y=kY(todayKey); return {ks:ateHoje(keyOf(y,1),todayKey),nome:String(y),resto:t.replace(m[0]," ")}; }
  if((m=/\b(este|esse|neste|nesse|deste|desse|o) mes\b|\bhoje\b/.exec(t))) return {ks:[todayKey],nome:nomeMes(todayKey),resto:t.replace(m[0]," ")};
  for(let i=0;i<12;i++){ const r=new RegExp("\\b"+AS_MESES[i]+"(?: de (20\\d\\d))?\\b"); if((m=r.exec(t))){
    let y=m[1]?Number(m[1]):kY(todayKey); if(!m[1]&&keyOf(y,i+1)>todayKey) y--; const k=keyOf(y,i+1); return {ks:[k],nome:nomeMes(k),resto:t.replace(m[0]," ")}; } }
  if((m=/\b(20\d\d)\b/.exec(t))){ const y=Number(m[1]), fim=y===kY(todayKey)?todayKey:keyOf(y,12); return {ks:ateHoje(keyOf(y,1),fim),nome:String(y),resto:t.replace(m[0]," ")}; }
  return null;
}
/** Palavras que sobram depois de tirar as comuns. @param {string} t */
const asTermos=t=>t.split(" ").filter(w=>w.length>=3&&!AS_PARADA.has(w));
/** Categoria cujo nome tem uma das palavras (mercado, luz, farmácia…). @param {string[]} ws */
function asCategoria(ws){
  for(const w of ws) for(const ct of state.config.categorias){
    const pal=limpaPal(ct.nome).split(" ").filter(p=>p.length>=3).concat((ct.subs||[]).flatMap(s=>limpaPal(s.nome||"").split(" ")));
    if(pal.some(p=>p===w||(w.length>=4&&(p.startsWith(w)||w.startsWith(p))&&p.length>=4))) return ct; }
  return null;
}
const asDespesas=(/** @type {MesKey[]} */ ks)=>ks.flatMap(k=>despesasDoMes(k).map(x=>Object.assign({},x,{_k:k})));
/** Itens pela data da compra (compra no cartão conta no mês em que foi feita). @param {MesKey[]} ks */
const asCompras=ks=>ks.flatMap(k=>/** @type {any[]} */(((state.months[k]||{}).gastos||[]).slice()).concat(fixosDoMes(k).filter(f=>!f.pular),parcelasDoMes(k)));
const asTotal=(/** @type {MesKey[]} */ ks)=>ks.reduce((a,k)=>a+calc(k).despesas,0);
/** @param {MesKey[]} ks */
function asPorCat(ks){ /** @type {Object<string,number>} */ const t={}; ks.forEach(k=>{ const pc=calc(k).porCat; Object.keys(pc).forEach(id=>{ t[id]=(t[id]||0)+pc[id]; }); }); return t; }
const asPct=(/** @type {number} */ a,/** @type {number} */ b)=>b>0?Math.round((a-b)/b*100):null;
/** Fim e restante de uma compra parcelada. @param {Parcela} p */
function asParcela(p){
  const cc=p.forma==="credito"?cartaoDe(p):null, prim=cc&&cartaoOk(cc)?faturaMes(p.compra,p.dia,cc):p.compra;
  let resta=0, n=0; for(let i=0;i<p.n;i++){ const mk=shiftKey(prim,i), o=((state.months[mk]||{}).parcelas||{})[p.id]||{}; if(mk>=todayKey&&!o.pago){ resta+=valorParcela(p.total,p.n,i); n++; } }
  return {fim:shiftKey(prim,p.n-1),resta:Math.round(resta*100)/100,n};
}
/** @param {string} q @returns {RespAssist|null} */
function responder(q){
  const t=" "+limpaPal(q)+" ", per=asPeriodo(t), resto=per?per.resto:t, ws=asTermos(resto.trim());
  const ks=per?per.ks:[todayKey], quando=(per?per.nome:nomeMes(todayKey)).toLowerCase(), emQ=(/^últimos/.test(quando)?"nos ":"em ")+quando, tem=(/** @type {RegExp} */ r)=>r.test(t);
  if(tem(/\b(ajuda|exemplos?|o que (voce )?(sabe|faz|responde|entende))\b/)) return {tit:"Pergunte sobre o seu dinheiro",linhas:["Eu respondo com os dados deste aparelho, sem enviar nada para fora. Toque numa sugestão ou escreva do seu jeito."]};
  if(tem(/\b(devo|deve|devendo|dividas?|emprestei|emprestimos?|me pagar)\b/)){
    const ds=state.config.dividas.map(d=>({d,falta:Math.max(0,Math.round((d.valor-pagoDiv(d))*100)/100)})).filter(x=>x.falta>0);
    const receber=tem(/\b(me deve|me devem|receber|emprestei|me pagar)\b/), lista=ds.filter(x=>x.d.tipo===(receber?"receber":"pagar"));
    if(!lista.length) return {tit:receber?"Ninguém te deve nada":"Você não tem dívidas em aberto",linhas:["Nada registrado em Dívidas, no Perfil."]};
    return {tit:receber?"Te devem":"Você deve",valor:soma(lista,x=>x.falta),linhas:[],barras:lista.sort((a,b)=>b.falta-a.falta).slice(0,6).map(x=>({nome:x.d.pessoa+(x.d.desc?" · "+x.d.desc:""),v:x.falta}))};
  }
  if(tem(/\b(metas?|objetivos?|sonhos?)\b/)){
    const ms=state.config.metas; if(!ms.length) return {tit:"Você ainda não tem metas",linhas:["Crie uma na aba Metas e eu acompanho quanto falta."]};
    const alvo=ms.find(mt=>ws.some(w=>limpaPal(mt.nome).split(" ").some(p=>p.length>=3&&(p.startsWith(w)||w.startsWith(p)))));
    if(alvo){ const i=infoMeta(alvo,todayKey); return {tit:i.feita?"Meta "+alvo.nome+" concluída":"Falta para "+alvo.nome,valor:i.falta,linhas:[Math.round(i.pct*100)+"% guardado ("+brl(i.saldo)+" de "+brl(alvo.alvo)+")."+(i.porMes&&!i.feita?" Guardando "+brl(i.porMes)+" por mês, você chega lá até "+nomeMes(/** @type {MesKey} */(alvo.prazo)).toLowerCase()+".":"")]}; }
    return {tit:"Suas metas",valor:soma(ms,mt=>infoMeta(mt,todayKey).falta),linhas:["Quanto falta, somando todas."],barras:ms.map(mt=>({nome:mt.nome+" · "+Math.round(infoMeta(mt,todayKey).pct*100)+"%",v:infoMeta(mt,todayKey).falta}))};
  }
  if(tem(/\b(caixinha|guardad[oa]s?|guardei|reserva|poupanca|economizei)\b/)){
    const tot=caixinhaAte(todayKey), mes=calc(todayKey);
    return {tit:"Na caixinha",valor:tot,linhas:[mes.guardado||mes.retirado?"Em "+nomeMes(todayKey).toLowerCase()+": guardou "+brl(mes.guardado)+" e retirou "+brl(mes.retirado)+".":"Nada guardado ou retirado em "+nomeMes(todayKey).toLowerCase()+"."]};
  }
  if(tem(/\b(parcelas?|parcelad[oa]s?|prestac(ao|oes)|termino de pagar|acabo de pagar|quito|quitar)\b/)){
    const ps=state.config.parcelas.map(p=>({p,i:asParcela(p)})).filter(x=>x.i.n>0);
    if(!ps.length) return {tit:"Nenhuma parcela em aberto",linhas:["Todas as compras parceladas já foram pagas."]};
    const uma=ps.find(x=>ws.some(w=>limpaPal(x.p.desc).split(" ").some(p=>p.length>=3&&(p.startsWith(w)||w.startsWith(p)))));
    if(uma) return {tit:uma.p.desc||"Compra parcelada",valor:uma.i.resta,linhas:["Faltam "+uma.i.n+" de "+uma.p.n+" parcelas. A última é em "+nomeMes(uma.i.fim).toLowerCase()+"."]};
    const fim=ps.map(x=>x.i.fim).sort().pop()||todayKey;
    return {tit:"Falta pagar em parcelas",valor:soma(ps,x=>x.i.resta),linhas:["Você fica livre de todas em "+nomeMes(fim).toLowerCase()+"."],barras:ps.sort((a,b)=>b.i.resta-a.i.resta).slice(0,6).map(x=>({nome:(x.p.desc||"Parcelada")+" · até "+abrMes(x.i.fim),v:x.i.resta}))};
  }
  if(tem(/\b(cartao|cartoes|fatura|faturas)\b/)||(tem(/\blimite\b/)&&!asCategoria(ws))){
    const cs=cartoesOk(); if(!cs.length) return {tit:"Nenhum cartão cadastrado",linhas:["Cadastre em Ajustes → Cartões, com o dia de fechamento e de vencimento."]};
    const um=cs.find(c=>ws.some(w=>limpaPal(c.nome).split(" ").some(p=>p.length>=3&&p.startsWith(w))))||null, lista=um?[um]:cs, k=per?per.ks[per.ks.length-1]:todayKey;
    if(tem(/\blimite\b/)) return {tit:"Limite livre"+(um?" no "+um.nome:""),valor:soma(lista,c=>usoCartao(c).livre),linhas:lista.map(c=>{ const u=usoCartao(c); return c.nome+": "+brl(u.usado)+" usados de "+brl(u.limite)+"."; })};
    return {tit:"Fatura de "+nomeMes(k).toLowerCase(),valor:soma(lista,c=>soma(faturaDoMes(k,c.id))),linhas:lista.map(c=>c.nome+": "+brl(soma(faturaDoMes(k,c.id)))+", vence dia "+c.vence+".")};
  }
  if(tem(/\b(contas? fixas?|fixos?|fixas|assinaturas?|mensalidades?)\b/)){
    const fx=fixosDoMes(ks[ks.length-1]).filter(f=>!f.pular); if(!fx.length) return {tit:"Nenhuma conta fixa",linhas:["Cadastre aluguel, luz e assinaturas em Ajustes → Contas fixas."]};
    return {tit:"Contas fixas de "+nomeMes(ks[ks.length-1]).toLowerCase(),valor:soma(fx),linhas:[fx.length+(fx.length===1?" conta":" contas")+", "+fx.filter(f=>f.pago).length+" já pagas."],barras:fx.slice().sort((a,b)=>b.valor-a.valor).slice(0,6).map(f=>({nome:f.desc,v:f.valor}))};
  }
  if(tem(/\b(recebi|receitas?|ganhei|entrou|entradas?|rendas?|salarios?)\b/)&&!tem(/\bgast/)){
    const v=ks.reduce((a,k)=>a+calc(k).receitas,0); return {tit:"Entrou "+emQ,valor:v,linhas:ks.length===1?["Saiu "+brl(calc(ks[0]).despesas)+" no mesmo mês."]:[]};
  }
  if(tem(/\bmedia\b|\bpor mes\b/)){
    const base=per&&per.ks.length>1?per.ks:[1,2,3].map(n=>shiftKey(todayKey,-n)), cs=base.filter(ativo); if(!cs.length) return {tit:"Ainda não há meses suficientes",linhas:["Assim que um mês fechar, eu calculo a média."]};
    const ct=asCategoria(ws), v=ct?cs.reduce((a,k)=>a+(calc(k).porCat[ct.id]||0),0)/cs.length:asTotal(cs)/cs.length;
    return {tit:"Média por mês"+(ct?" com "+ct.nome:""),valor:v,linhas:["Com base "+(per&&per.ks.length>1?emQ:cs.length===1?"no mês anterior":"nos "+cs.length+" meses anteriores")+"."]};
  }
  if(tem(/\b(compar\w*|mais que|menos que|mais do que|menos do que|em relacao|diferenca)\b/)){
    const nomes=AS_MESES.map((n,i)=>({i,pos:t.indexOf(" "+n+" ")})).filter(x=>x.pos>=0).sort((a,b)=>a.pos-b.pos);
    const mesDe=(/** @type {number} */ i)=>(asPeriodo(" "+AS_MESES[i]+" ")||{ks:[todayKey]}).ks[0];
    // "gastei mais que no mês passado?" compara o mês atual com o citado
    const comRef=tem(/\b(mais|menos) (que|do que)\b/)&&!!per&&per.ks.length===1&&per.ks[0]<todayKey&&nomes.length<2;
    const kA=nomes.length>=2?mesDe(nomes[0].i):comRef?todayKey:ks[0], kB=nomes.length>=2?mesDe(nomes[1].i):comRef?ks[0]:shiftKey(kA,-1);
    const a=calc(kA).despesas, b=calc(kB).despesas, p=asPct(a,b);
    const pa=calc(kA).porCat, pb=calc(kB).porCat, dif=state.config.categorias.map(c=>({nome:c.nome,v:(pa[c.id]||0)-(pb[c.id]||0)})).filter(x=>x.v>0.004).sort((x,y)=>y.v-x.v).slice(0,3);
    return {tit:(a>b?"Gastou mais":"Gastou menos")+" em "+nomeMes(kA).toLowerCase(),valor:a,linhas:[nomeMes(kB)+": "+brl(b)+(p!==null?" ("+(p>0?"+":"")+p+"%).":".")].concat(dif.length?["O que mais subiu:"]:[]),barras:dif.map(x=>({nome:x.nome,v:x.v}))};
  }
  if(tem(/\b(onde mais|maior(es)?|mais gast\w*|principais|top|para onde|pra onde)\b/)){
    const pc=asPorCat(ks), cats=Object.keys(pc).filter(id=>pc[id]>0).sort((a,b)=>pc[b]-pc[a]).slice(0,5);
    if(!cats.length) return {tit:"Nenhum gasto "+emQ,linhas:[]};
    const top=asDespesas(ks).sort((a,b)=>(b.valor||0)-(a.valor||0))[0];
    return {tit:"Onde mais gastou "+emQ,valor:asTotal(ks),linhas:top?["Maior gasto: "+(top.desc||catName(top.cat))+", "+brl(top.valor)+"."]:[],barras:cats.map(id=>({nome:catName(id),v:pc[id]})),ir:ks.length===1?{txt:"Ver "+catName(cats[0]),cat:cats[0],mes:ks[0]}:null};
  }
  if(tem(/\b(gast\w*|paguei|despesas?|quanto|custou|custa|limite|orcamento)\b/)&&ws.length){
    const ct=asCategoria(ws);
    if(ct){ const v=ks.reduce((a,k)=>a+(calc(k).porCat[ct.id]||0),0), lim=ks.length===1?limiteCat(ct,ks[0]):0;
      const ant=ks.length===1?(calc(shiftKey(ks[0],-1)).porCat[ct.id]||0):0, p=ks.length===1?asPct(v,ant):null;
      const linhas=[]; const mAnt=nomeMes(shiftKey(ks[0],-1)).toLowerCase(); if(p===0) linhas.push("Mesmo valor de "+mAnt+"."); else if(p!==null) linhas.push((p>0?"+":"")+p+"% em relação a "+mAnt+" ("+brl(ant)+").");
      if(lim>0) linhas.push(v>lim?"Passou "+brl(v-lim)+" do limite de "+brl(lim)+".":"Ainda cabem "+brl(lim-v)+" no limite de "+brl(lim)+".");
      return {tit:ct.nome+" "+emQ,valor:v,linhas,ir:ks.length===1?{txt:"Ver lançamentos",cat:ct.id,mes:ks[0]}:null}; }
    const its=asCompras(ks).filter(x=>{ const d=limpaPal((x.desc||"")+" "+(x.tags||[]).join(" ")); return ws.some(w=>d.split(" ").some(p=>p.startsWith(w))); });
    if(!its.length) return {tit:"Nada encontrado "+emQ,linhas:["Não achei gastos com “"+ws.join(" ")+"”. Veja os resultados da busca abaixo."]};
    return {tit:"“"+ws.join(" ")+"” "+emQ,valor:soma(its),linhas:[its.length+(its.length===1?" lançamento":" lançamentos")+(its.length>1?", média de "+brl(soma(its)/its.length)+" cada":"")+"."]};
  }
  if(tem(/\bquanto gastei\b|\btotal de gastos\b|\bgastei (no|em|este|esse)\b/)||(per&&tem(/\bgast/))){
    const v=asTotal(ks); return {tit:"Gastos "+emQ,valor:v,linhas:ks.length===1?["Entrou "+brl(calc(ks[0]).receitas)+" no mesmo mês."]:[]};
  }
  return null;
}
/** @param {RespAssist} r */
function htmlResposta(r){
  const max=r.barras&&r.barras.length?Math.max(...r.barras.map(b=>Math.abs(b.v)),0.01):1;
  return `<div class="assist" role="status" aria-live="polite"><span class="as-ic" aria-hidden="true">${icq("balao",18)}</span><div class="as-corpo">
    <b class="as-tit">${esc(r.tit)}</b>${typeof r.valor==="number"?`<span class="as-valor num">${brl(r.valor)}</span>`:""}
    ${r.linhas.map(l=>`<p>${esc(l)}</p>`).join("")}
    ${r.barras&&r.barras.length?`<ul class="as-barras">${r.barras.map(b=>`<li><span>${esc(b.nome)}</span><b class="num">${brl(b.v)}</b><i aria-hidden="true"><i style="width:${Math.max(4,Math.round(Math.abs(b.v)/max*100))}%"></i></i></li>`).join("")}</ul>`:""}
    ${r.ir?`<button type="button" class="btn mini ghost" data-ascat="${esc(r.ir.cat)}|${esc(r.ir.mes)}">${esc(r.ir.txt)}</button>`:""}</div></div>`;
}
// MoneBot: robô do Monetra que conversa usando responder(); a conversa fica só na memória desta sessão
/** @type {{eu:boolean,t?:string,r?:RespAssist}[]} */
let mbLog=[];
/** Robô com a cara do app: tela escura, olhos verdes e as barras do logo como sorriso. @param {number} px @param {string} [cls] */
const roboMB=(px,cls)=>`<svg class="robo ${cls||""}" viewBox="0 0 64 64" width="${px}" height="${px}" aria-hidden="true">  <g class="rb-corpo"><line x1="32" y1="7" x2="32" y2="14" stroke="#4CC79F" stroke-width="2.4" stroke-linecap="round"/><circle class="rb-ant" cx="32" cy="6" r="3.4" fill="#22D47A"/>
  <rect x="5" y="27" width="5" height="12" rx="2.5" fill="#0B3A2A" stroke="#4CC79F" stroke-width="1.4"/><rect x="54" y="27" width="5" height="12" rx="2.5" fill="#0B3A2A" stroke="#4CC79F" stroke-width="1.4"/>
  <rect x="9" y="14" width="46" height="38" rx="13" fill="#145C43" stroke="#4CC79F" stroke-width="1.6"/><rect x="15" y="20" width="34" height="24" rx="8" fill="#06150F"/>
  <g class="rb-olhos"><rect x="21" y="25" width="7" height="8" rx="3.5" fill="#22D47A"/><rect x="36" y="25" width="7" height="8" rx="3.5" fill="#22D47A"/></g>
  <g fill="#4CC79F"><rect x="26" y="38" width="3" height="2.6" rx="1"/><rect x="30.5" y="36.4" width="3" height="4.2" rx="1"/><rect x="35" y="34.6" width="3" height="6" rx="1"/></g></g></svg>`;
const MB_FALLBACK=/** @type {RespAssist} */({tit:"Ainda não sei responder isso",linhas:["Pergunte sobre gastos, categorias, meses, parcelas, cartão, metas, caixinha, contas fixas ou dívidas. Toque numa sugestão para ver como."]});
function mbPergunta(/** @type {string} */ texto){
  const q=String(texto||"").replace(/\s+/g," ").trim().slice(0,160); if(!q) return;
  mbLog.push({eu:true,t:q}); mbLog.push({eu:false,r:responder(q.toLowerCase())||MB_FALLBACK}); if(mbLog.length>40) mbLog=mbLog.slice(-40);
  renderSheet(); const c=document.getElementById("mb-chat"); if(c) c.scrollTop=c.scrollHeight;
  const ult=mbLog[mbLog.length-1]; if(ult.r) anunciar(ult.r.tit+(typeof ult.r.valor==="number"?": "+brl(ult.r.valor):""));
  const i=/** @type {HTMLInputElement|null} */(document.getElementById("mb-perg")); if(i) i.focus();
}
function corpoMoneBot(){
  const ola=`<div class="mb-msg bot"><span class="mb-av">${roboMB(30)}</span><div class="mb-bolha"><b>Oi! Eu sou o MoneBot.</b><p>Pergunte sobre o seu dinheiro que eu respondo com os seus dados. Tudo é calculado neste aparelho, nada sai daqui.</p></div></div>`;
  const msgs=mbLog.map(m=>m.eu?`<div class="mb-msg eu"><div class="mb-bolha">${esc(m.t||"")}</div></div>`:`<div class="mb-msg bot"><span class="mb-av">${roboMB(30)}</span>${m.r?htmlResposta(m.r):""}</div>`).join("");
  const sug=AS_SUGESTOES.filter(x=>!mbLog.some(m=>m.eu&&m.t===x)).slice(0,mbLog.length?4:10);
  return `<div class="mb-chat" id="mb-chat" role="log" aria-live="polite">${ola}${msgs}</div>
    ${sug.length?`<div class="as-sug mb-sug">${sug.map(x=>`<button type="button" class="chip" data-asperg="${esc(x)}">${esc(x)}</button>`).join("")}</div>`:""}
    <div class="mb-envio"><label class="sr" for="mb-perg">Sua pergunta</label><input class="in" id="mb-perg" type="text" placeholder="Pergunte ao MoneBot…" autocomplete="off" enterkeyhint="send" maxlength="160" data-autofocus>
    ${ReconhecimentoVoz?`<button type="button" class="mb-bt" data-asvoz="1" aria-pressed="false" aria-label="Perguntar falando">${ICON_MIC}</button>`:""}<button type="submit" class="mb-bt envia" aria-label="Enviar pergunta">${icq("seta-cima",20)}</button></div>`;
}
/** Botão flutuante: só dentro do app (não na apresentação, no login ou nos termos). */
function botaoMoneBot(){
  const deve=state.loaded&&mode!=="login"&&!precisaTermos()&&!ui.lerTermos; let b=document.getElementById("monebot");
  if(!deve){ if(b) b.remove(); return; } if(b) return;
  b=document.createElement("button"); b.type="button"; b.id="monebot"; b.className="monebot"+(semMovimento()?"":" entra"); b.setAttribute("aria-label","Abrir o MoneBot, assistente do Monetra"); b.title="MoneBot";
  b.innerHTML=`${roboMB(46,"rb-vivo")}<span class="mb-nome" aria-hidden="true">MoneBot</span>`;
  b.title="MoneBot: toque para conversar, arraste para mudar de lugar";
  b.inert=travado; document.body.appendChild(b); arrastaBot(b); colocaBot(b);
}
// O botão pode ser arrastado; ao soltar, encosta na lateral mais próxima. A posição fica só neste aparelho.
const BOT_POS="mb.botpos";
/** @param {HTMLElement} b */
function limitesBot(b){ const m=12, cel=matchMedia("(max-width:760px)").matches;
  return {minX:m,maxX:Math.max(m,innerWidth-b.offsetWidth-m),minY:72,maxY:Math.max(72,innerHeight-b.offsetHeight-(cel?84:16))}; }
/** @param {HTMLElement} b @param {number} x @param {number} y */
function poeBot(b,x,y){ const L=limitesBot(b);
  b.style.left=Math.round(Math.min(L.maxX,Math.max(L.minX,x)))+"px"; b.style.top=Math.round(Math.min(L.maxY,Math.max(L.minY,y)))+"px"; b.style.right="auto"; b.style.bottom="auto"; }
/** Volta para o lugar salvo (lado e altura relativa), se houver. @param {HTMLElement} b */
function colocaBot(b){ let p=null; try{ p=JSON.parse(localStorage.getItem(BOT_POS)||"null"); }catch(e){}
  if(!p||(p.lado!=="esq"&&p.lado!=="dir")||typeof p.y!=="number") return; const L=limitesBot(b);
  poeBot(b,p.lado==="esq"?L.minX:L.maxX,L.minY+Math.min(1,Math.max(0,p.y))*(L.maxY-L.minY)); }
/** @param {HTMLElement} b */
function arrastaBot(b){
  /** @type {{x:number,y:number,l:number,t:number,id:number}|null} */ let ini=null; let moveu=false, ignora=false;
  b.addEventListener("pointerdown",ev=>{ if(ev.button!==0) return; const r=b.getBoundingClientRect(); ini={x:ev.clientX,y:ev.clientY,l:r.left,t:r.top,id:ev.pointerId}; moveu=false; try{ b.setPointerCapture(ev.pointerId); }catch(e){} });
  b.addEventListener("pointermove",ev=>{ if(!ini||ev.pointerId!==ini.id) return; const dx=ev.clientX-ini.x, dy=ev.clientY-ini.y;
    if(!moveu){ if(Math.hypot(dx,dy)<8) return; moveu=true; b.classList.remove("encaixa"); b.classList.add("arrastando"); }
    poeBot(b,ini.l+dx,ini.t+dy); });
  const solta=()=>{ if(!ini) return; ini=null; if(!moveu) return; moveu=false; ignora=true; b.classList.remove("arrastando");
    const r=b.getBoundingClientRect(), L=limitesBot(b), lado=r.left+r.width/2<innerWidth/2?"esq":"dir";
    if(!semMovimento()) b.classList.add("encaixa"); poeBot(b,lado==="esq"?L.minX:L.maxX,r.top); vibra(8);
    try{ localStorage.setItem(BOT_POS,JSON.stringify({lado,y:L.maxY>L.minY?(Math.min(L.maxY,Math.max(L.minY,r.top))-L.minY)/(L.maxY-L.minY):1})); }catch(e){}
    setTimeout(()=>{ ignora=false; b.classList.remove("encaixa"); },350); };
  b.addEventListener("pointerup",solta); b.addEventListener("pointercancel",solta);
  b.addEventListener("click",ev=>{ if(ignora){ ev.preventDefault(); ignora=false; return; } vibra(10); openSheet("monebot"); });
}
addEventListener("resize",()=>{ const b=document.getElementById("monebot"); if(b) colocaBot(b); });
let asOuvindo=null;
function perguntarPorVoz(){ if(!ReconhecimentoVoz) return; const campo=/** @type {HTMLInputElement|null} */(document.getElementById("mb-perg")); if(!campo) return;
  if(asOuvindo){ try{ asOuvindo.stop(); }catch(e){} return; }
  const r=new ReconhecimentoVoz(); r.lang="pt-BR"; r.interimResults=true; r.maxAlternatives=1; asOuvindo=r;
  const marca=(/** @type {boolean} */ on)=>{ const b=document.querySelector("[data-asvoz]"); if(b){ b.classList.toggle("on",on); b.setAttribute("aria-pressed",String(on)); b.setAttribute("aria-label",on?"Parar de ouvir":"Perguntar falando"); } };
  marca(true); anunciar("Pode perguntar. Exemplo: quanto gastei com mercado este mês?");
  r.onresult=e=>{ let t=""; for(let i=0;i<e.results.length;i++) t+=e.results[i][0].transcript; campo.value=t.replace(/\s+/g," ").trim().slice(0,160); };
  r.onerror=e=>{ if(e&&e.error==="not-allowed") toast("Permita o uso do microfone para perguntar falando."); else if(e&&e.error!=="aborted"&&e.error!=="no-speech") toast("Não consegui ouvir. Tente de novo."); };
  r.onend=()=>{ asOuvindo=null; marca(false); const c=/** @type {HTMLInputElement|null} */(document.getElementById("mb-perg")); if(c&&c.value.trim()) mbPergunta(c.value); };
  try{ r.start(); }catch(e){ asOuvindo=null; marca(false); } }
