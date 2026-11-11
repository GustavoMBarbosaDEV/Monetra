// @ts-check
// Aba Início: calendário, lançamentos, gráfico do saldo e cards do mês.
"use strict";
function vencimentosDoMes(k){
  const m=state.months[k], out=[];
  fixosDoMes(k).filter(f=>!f.pular).forEach(f=>out.push({t:"fixo",id:f.id,nome:f.desc,valor:f.valor,dia:f.dia,pago:f.pago}));
  parcelasDoMes(k).filter(p=>!p.cartao).forEach(p=>out.push({t:"parc",id:p.id,nome:(p.desc||"Parcela")+" ("+p.idx+"/"+p.n+")",valor:p.valor,dia:p.dia,pago:!!p.pago}));
  cartoesOk().forEach(cc=>{ const t=soma(faturaDoMes(k,cc.id)); if(t>0) out.push({t:"fat",id:cc.id,nome:"Fatura "+cc.nome,valor:t,dia:Math.min(cc.vence,diasMes(k)),pago:faturaPaga(m,cc.id)}); });
  return out;
}
function dadosCalendario(k){
  const dim=diasMes(k), dias=[...Array(dim+1)].map(()=>({g:0,n:0,v:[],r:0}));
  ((state.months[k]||{}).gastos||[]).forEach(g=>{ const d=Math.min(dim,Math.max(1,Number(g.dia)||1)); dias[d].g+=Number(g.valor)||0; dias[d].n++; });
  vencimentosDoMes(k).forEach(x=>dias[x.dia].v.push(x));
  const m=normMonth(state.months[k]||{}); (m.avulsos||[]).forEach(a=>{ const d=Math.min(dim,Math.max(1,Number(a.dia)||1)); dias[d].r+=Number(a.valor)||0; });
  rendasDoMes(k).filter(r=>!r.pular).forEach(r=>{ const d=Math.min(dim,Math.max(1,Number(r.dia)||1)); dias[d].r+=Number(r.valor)||0; });
  return dias;
}
const valCurto=v=>v>=10000?Math.round(v/1000)+"k":v>=1000?(Math.round(v/100)/10).toString().replace(".",",")+"k":String(Math.round(v));
function cardCalendario(k){
  if(!ativo(k)) return "";
  const dias=dadosCalendario(k), dim=diasMes(k), ini=new Date(kY(k),kM(k)-1,1).getDay(), max=Math.max(1,...dias.slice(1).map(d=>d.g));
  const hoje=k===todayKey?today.getDate():0, passado=k<todayKey;
  const sem=[]; for(let d=1;d<=dim;d++){ const w=Math.floor((ini+d-1)/7); (sem[w]=sem[w]||{a:d,b:d,t:0}); sem[w].b=d; sem[w].t+=dias[d].g; }
  const pesada=sem.filter(Boolean).slice().sort((a,b)=>b.t-a.t)[0], wPesada=pesada&&pesada.t>0?sem.indexOf(pesada):-1;
  let cel=""; for(let i=0;i<ini;i++) cel+=`<span class="cd vazio" aria-hidden="true"></span>`;
  for(let d=1;d<=dim;d++){ const x=dias[d], h=x.g>0?(0.18+0.82*x.g/max):0, w=Math.floor((ini+d-1)/7);
    const venc=x.v.length?x.v.map(v=>`<i class="vd ${v.pago?"ok":(passado||(hoje&&d<hoje))?"atr":"pend"}"></i>`).slice(0,3).join(""):"";
    const rot=`${d} de ${NOMES[kM(k)-1].toLowerCase()}: `+(x.g?"gastou "+brl(x.g):"sem gastos")+(x.v.length?", "+x.v.length+" vencimento"+(x.v.length>1?"s":""):"")+(x.r?", recebeu "+brl(x.r):"");
    cel+=`<button type="button" class="cd ${d===hoje?"hoje":""} ${w===wPesada?"pesada":""} ${hoje&&d>hoje?"futuro":""}" data-caldia="${d}" style="--h:${h.toFixed(2)}" aria-label="${esc(rot)}"><b>${d}</b>${x.g?`<span class="cg">${valCurto(x.g)}</span>`:x.r?`<span class="cr">+${valCurto(x.r)}</span>`:""}${venc?`<span class="cv">${venc}</span>`:""}</button>`; }
  return `<div class="card cal"><div class="cardhead"><h2>Calendário</h2><button type="button" class="btn ghost mini" data-semana="1">Resumo da semana</button></div><div class="calsub">${wPesada>=0?`<span class="num muted">semana mais pesada: <b>${pesada.a===pesada.b?pad2(pesada.a):pad2(pesada.a)+"–"+pad2(pesada.b)}</b> · ${brl(pesada.t)}</span>`:""}</div>
    <div class="calgrid" role="group" aria-label="Calendário de ${esc(nomeMes(k).toLowerCase())}">${["D","S","T","Q","Q","S","S"].map(x=>`<span class="cw" aria-hidden="true">${x}</span>`).join("")}${cel}</div>
    <div class="calleg"><span><i class="sq"></i>quanto mais forte, mais gasto no dia</span><span><i class="vd pend"></i>vence</span><span><i class="vd ok"></i>pago</span><span><i class="vd atr"></i>atrasado</span></div></div>`;
}
function corpoDia(k,d){
  const dias=dadosCalendario(k), x=dias[d], hoje=k===todayKey?today.getDate():0;
  const gs=((state.months[k]||{}).gastos||[]).filter(g=>Math.min(diasMes(k),Math.max(1,Number(g.dia)||1))===d);
  const linhasG=gs.map(g=>linhaLanc(Object.assign({},g),k).replace(/data-edit="gasto" data-id=/,'data-caledit=')).join("");
  const linhasV=x.v.map(v=>{ const atr=!v.pago&&(k<todayKey||(hoje&&d<hoje)); return `<div class="item calv ${v.pago?"ok":atr?"atr":"pend"}"><i class="vd ${v.pago?"ok":atr?"atr":"pend"}"></i><span class="desc"><b>${esc(v.nome)}</b><small>${v.pago?"paga":atr?"atrasada":"vence neste dia"}</small></span><span class="v">${brl(v.valor)}</span><button class="btn mini ${v.pago?"ghost":""}" type="button" data-avpagar="${v.t}|${esc(v.id)}|${k}">${v.pago?"Desfazer":"Paguei"}</button></div>`; }).join("");
  return `<div class="caldia">
    <div class="assintot"><div><span class="lab">Gastos</span><b>${brl(x.g)}</b><small>${x.n} lançamento${x.n===1?"":"s"}</small></div><div><span class="lab">Vencimentos</span><b>${brl(soma(x.v))}</b><small>${x.v.length} conta${x.v.length===1?"":"s"}</small></div>${x.r?`<div><span class="lab">Receitas</span><b class="pos">${brl(x.r)}</b><small>neste dia</small></div>`:""}</div>
    ${linhasV?`<h3>Contas</h3>${linhasV}`:""}
    ${linhasG?`<h3>Despesas</h3>${linhasG}`:`<p class="hint">Nenhuma despesa lançada em ${pad2(d)}/${pad2(kM(k))}.</p>`}
  </div>`;
}
function corpoCatMes(k,cat){
  const its=despesasDoMes(k).filter(g=>g.cat===cat).sort((a,b)=>(b.dia-a.dia)||((Number(b.valor)||0)-(Number(a.valor)||0))), tot=soma(its), c=calc(k);
  const p=c.despesas>0?Math.round(tot/c.despesas*100):0;
  const linha=g=>{ const dt=pad2(g.dia)+"/"+pad2(kM(g.compraK||k));
    const [alvo,sub]=g.fixo?["fixoMes|"+g.id+"|"+k,"conta fixa · vence dia "+pad2(g.dia)+(g.pago?" · paga":"")]:g.parcela?["parcela|"+g.id+"|","parcela "+g.idx+"/"+g.n+(g.cartao?" · no cartão":"")]:g.compraK?["gasto|"+g.id+"|"+g.compraK,"crédito · compra em "+dt]:["gasto|"+g.id+"|"+k,formaNome(g.forma)+" · "+dt];
    return `<button type="button" class="item" data-scat="${esc(alvo)}" style="--dot:${catColor(cat)}"><span class="desc"><b class="${g.desc?"":"empty"}">${esc(g.desc||"sem descrição")}</b><small>${esc(sub)}</small></span><span class="v">${brl(Number(g.valor)||0)}</span></button>`; };
  return `<div class="catmes"><div class="assintot"><div><span class="lab">Total</span><b>${brl(tot)}</b><small>${p}% das despesas do mês</small></div><div><span class="lab">Lançamentos</span><b>${its.length}</b><small>${its.length===1?"item":"itens"} nesta categoria</small></div></div>
    ${its.length?its.map(linha).join(""):'<p class="hint">Nada nesta categoria neste mês.</p>'}<p class="hint">Toque num item para editar.</p></div>`;
}
function esqueleto(){ return "<div class=\"skel\" role=\"status\" aria-busy=\"true\"><span class=\"sr\">Carregando seus lançamentos…</span>\n  <div class=\"card sk-hero\"><i class=\"sk\" style=\"width:38%;height:12px\"></i><i class=\"sk sk-gap\" style=\"width:62%;height:38px\"></i><i class=\"sk\" style=\"width:45%;height:12px\"></i><i class=\"sk sk-gap\" style=\"width:100%;height:64px\"></i><div class=\"sk-duo\"><i class=\"sk\" style=\"height:54px\"></i><i class=\"sk\" style=\"height:54px\"></i></div></div>\n  <div class=\"sk-qa\"><i class=\"sk\"></i><i class=\"sk\"></i><i class=\"sk\"></i><i class=\"sk\"></i></div>\n  <div class=\"card\"><i class=\"sk\" style=\"width:50%;height:16px\"></i><div class=\"sk-row\"><i class=\"sk sk-circ\"></i><div class=\"sk-col\"><i class=\"sk\" style=\"width:60%;height:13px\"></i><i class=\"sk\" style=\"width:38%;height:10px\"></i></div><i class=\"sk\" style=\"width:64px;height:14px\"></i></div><div class=\"sk-row\"><i class=\"sk sk-circ\"></i><div class=\"sk-col\"><i class=\"sk\" style=\"width:60%;height:13px\"></i><i class=\"sk\" style=\"width:38%;height:10px\"></i></div><i class=\"sk\" style=\"width:64px;height:14px\"></i></div><div class=\"sk-row\"><i class=\"sk sk-circ\"></i><div class=\"sk-col\"><i class=\"sk\" style=\"width:60%;height:13px\"></i><i class=\"sk\" style=\"width:38%;height:10px\"></i></div><i class=\"sk\" style=\"width:64px;height:14px\"></i></div><div class=\"sk-row\"><i class=\"sk sk-circ\"></i><div class=\"sk-col\"><i class=\"sk\" style=\"width:60%;height:13px\"></i><i class=\"sk\" style=\"width:38%;height:10px\"></i></div><i class=\"sk\" style=\"width:64px;height:14px\"></i></div></div></div>"; }
function linhaLanc(g,k){
  if(g.parcela) return `<div class="item fixrow parcrow" style="--dot:${catColor(g.cat)}">
    <button type="button" class="check ${g.pago?"on":""}" data-pagar="parc|${esc(g.id)}|${k}" aria-pressed="${g.pago}" aria-label="${g.pago?"Marcar parcela como não paga":"Marcar parcela como paga"}">${ICON.check}</button>
    <button type="button" class="fixinfo" data-edit="parcela" data-id="${esc(g.id)}"><b>${esc(g.desc||"Compra parcelada")}</b><small>parcela ${g.idx}/${g.n}${esc(extraTxt(g))} · vence dia ${pad2(g.dia)}${g.pago?" · paga"+(g.pagoEm?" em "+g.pagoEm.slice(8,10)+"/"+g.pagoEm.slice(5,7):""):""}</small></button>
    <span class="v">${brl(g.valor)}</span></div>`;
  const nota=noCartao(g)?" · fatura de "+abrMes(faturaMes(k,g.dia,cartaoDe(g))):"";
  if(g.forma==="credito") return `<div class="item fixrow parcrow" style="--dot:${catColor(g.cat)}" data-desliza="${esc(g.id)}" data-lmes="${k}">
    <button type="button" class="check ${g.pago?"on":""}" data-gpago="${esc(g.id)}" data-mes="${k}" aria-pressed="${!!g.pago}" aria-label="${g.pago?"Marcar como não paga":"Marcar como paga"}">${ICON.check}</button>
    <button type="button" class="fixinfo" data-edit="gasto" data-id="${esc(g.id)}" data-mes="${k}"><b class="${g.desc?"":"empty"}">${esc(g.desc||"sem descrição")}</b><small>${esc(catName(g.cat)+extraTxt(g))} · Crédito${esc(nota+porTxt(g))} · ${g.pago?"paga"+(g.pagoEm?" em "+g.pagoEm.slice(8,10)+"/"+g.pagoEm.slice(5,7):""):"não paga"}</small></button>
    <span class="v">${brl(g.valor)}</span></div>`;
  return `<button type="button" class="item gitem" data-edit="gasto" data-id="${esc(g.id)}" style="--dot:${catColor(g.cat)}" data-desliza="${esc(g.id)}" data-lmes="${k}">
    ${icoCat(g.cat)}
    <span class="desc"><b class="${g.desc?"":"empty"}">${esc(g.desc||catName(g.cat))}</b><small>${esc(catName(g.cat))} · ${esc(formaNome(g.forma)+extraTxt(g)+nota+porTxt(g))}</small></span>
    <span class="v">${valorGrande(g.valor)}</span></button>`;
}
const BARRINHAS='<span class="mbars" aria-hidden="true"><i></i><i></i><i></i></span>';
function linhaMeta(mt,k,anel){
  const i=infoMeta(mt,k), pc=Math.round(Math.min(1,i.pct)*100);
  const sub=i.feita?"Meta atingida!":i.atrasada?"Prazo passou · faltam "+brl(i.falta):mt.prazo?"Faltam "+brl(i.falta)+" · guarde "+brl(i.porMes)+"/mês até "+abrMes(mt.prazo):"Faltam "+brl(i.falta);
  const ring=anel?`<span class="manel" aria-hidden="true"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="var(--sunk)" stroke-width="5"/><circle class="anel-v" cx="22" cy="22" r="18" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" pathLength="100" stroke-dasharray="${pc} 100" transform="rotate(-90 22 22)"/></svg><b>${pc}%</b></span>`:"";
  return `<button type="button" class="meta ${anel?"comanel":""} ${i.feita?"feita":""} ${i.atrasada?"atrasada":""}" data-edit="meta" data-id="${esc(mt.id)}">${ring}<span class="mcorpo">
    <span class="mt"><b>${esc(mt.nome)}</b>${anel?"":`<em class="mpct">${pc}%</em>`}</span>
    <span class="mval num">${brl(i.saldo)} <small>de ${brl(mt.alvo)}</small></span>
    <span class="track"><span style="width:${(i.pct*100).toFixed(1)}%"></span></span>
    <small>${esc(sub)}</small></span></button>`;
}
function serieSaldo(k){
  const dim=diasMes(k), mov=new Array(dim+2).fill(0), m=normMonth(state.months[k]||{}), c=calc(k), dd=x=>Math.min(dim,Math.max(1,Number(x)||1));
  mov[1]+=c.salario; rendasDoMes(k).filter(r=>!r.pular).forEach(r=>mov[dd(r.dia)]+=Number(r.valor)||0); (m.avulsos||[]).forEach(a=>mov[dd(a.dia)]+=Number(a.valor)||0);
  despesasDoMes(k).forEach(g=>{ const cc=g.cartaoId?(state.config.cartoes.find(x=>x.id===g.cartaoId)):null; mov[dd(cc?cc.vence:g.dia)]-=Number(g.valor)||0; });
  (m.caixinha||[]).forEach(x=>mov[dd(x.dia)]+=(x.tipo==="guardar"?-1:1)*(Number(x.valor)||0));
  const ate=k===todayKey?today.getDate():dim, out=[]; let s=0; for(let d=1;d<=ate;d++){ s+=mov[d]; out.push(s); } return out;
}
function graficoSaldo(sr,k){
  if(sr.length<2) return "";
  const W=360,H=70, mx=Math.max(...sr), mn=Math.min(...sr,0), rg=(mx-mn)||1;
  const P=sr.map((v,i)=>[i/(sr.length-1)*W,H-4-(v-mn)/rg*(H-8)]), d="M"+P.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L"), u=P[P.length-1];
  const n=sr.length, ult=pad2(n)+"/"+pad2(kM(k))+": "+brl(sr[n-1]);
  return `<div class="hs-grafwrap" data-hsgraf="${k}" data-serie="${sr.map(v=>Math.round(v*100)/100).join(",")}" data-mn="${mn}" data-rg="${rg}" tabindex="0" role="slider" aria-label="Saldo dia a dia (use as setas para ver cada dia)" aria-valuemin="1" aria-valuemax="${n}" aria-valuenow="${n}" aria-valuetext="${esc(ult)}"><svg class="hs-graf" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="hsg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".32"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><path d="${d} L${W},${H} L0,${H}Z" fill="url(#hsg)"/><path class="hs-linha" d="${d}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/><circle cx="${u[0].toFixed(1)}" cy="${u[1].toFixed(1)}" r="3.5" fill="currentColor"/><circle class="hs-pulso" cx="${u[0].toFixed(1)}" cy="${u[1].toFixed(1)}" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg><span class="hs-marca" aria-hidden="true"><i></i></span><span class="hs-balao" aria-hidden="true"></span></div><span class="sr">Gráfico do saldo dia a dia: começou o mês em ${brl(sr[0])}, o menor valor foi ${brl(Math.min(...sr))} e hoje está em ${brl(sr[sr.length-1])}.</span>`;
}
const BOOT_MIN=1150;
function tiraBoot(){ const b=document.getElementById("boot"); if(!b||b.dataset.saindo) return; b.dataset.saindo="1"; const espera=Math.max(0,(semMovimento()?500:BOOT_MIN)-performance.now()); setTimeout(()=>{ b.classList.add("sai"); setTimeout(()=>b.remove(),400); },espera); }
const SECOES_RECOLHIVEIS=false;
function secaoMes(id,titulo,resumo,icone,html){
  if(!html||!String(html).trim()) return "";
  if(!SECOES_RECOLHIVEIS) return html;
  const ab=!!(ui.abre&&ui.abre[id]);
  return `<section class="mais ${ab?"aberta":""}" id="sec-${id}"><button type="button" class="maishead" data-abre="${id}" aria-expanded="${ab}" aria-controls="secb-${id}"><span class="mi" aria-hidden="true">${icone||""}</span><span class="mt"><b>${esc(titulo)}</b>${resumo?`<small>${resumo}</small>`:""}</span><span class="mc" aria-hidden="true">${icq("chev",18)}</span></button><div class="maisbody" id="secb-${id}">${html}</div></section>`;
}
function garanteVisivel(id){
  let el=document.getElementById(id); const sec=el&&el.closest(".mais:not(.aberta)");
  if(sec){ ui.abre=ui.abre||{}; ui.abre[sec.id.slice(4)]=true; render(); el=document.getElementById(id); }
  return el;
}
function viewMes(){
  const k=ui.month, m=getMonth(k), c=calc(k), cats=state.config.categorias, isCur=k===todayKey, fase=faseSalario(k);
  const prevK=shiftKey(k,-1), prev=MESES.includes(prevK)&&ativo(prevK)&&ativo(k)?calc(prevK):null;
  const acum=acumulado(k), cx=caixinhaAte(k), ini=inicioKey();
  const aviso=avisoConta()+avisoCompart()+(!ini?`<div class="note info">Seu controle ainda não começou. Informe o <b>salário deste mês</b> no card Receitas (ou lance uma receita) e os cálculos passam a contar a partir deste mês.</div>`
    :k<ini?`<div class="note info">Este mês é anterior ao início do seu controle (${esc(nomeMes(ini).toLowerCase())}). Aqui só conta o que você lançar à mão; salário padrão, rendas e contas fixas não entram.</div>`:"");
  const varDesp=prev?variacao(c.despesas,prev.despesas):"";
  const mesN=NOMES[kM(k)-1].toLowerCase(), varS=prev&&Math.abs(prev.saldo)>0.5?(c.saldo-prev.saldo)/Math.abs(prev.saldo):null;
  const pv=c.receitas>0&&fase!=="espera"?previsaoMes(k,c):null, alTop=isCur?alertasOrcamento(k).find(a=>a.diaEstoura||a.nivel==="passou"):null;
  const notaTxt=pv?(pv.ritmo>0?`No ritmo atual, ${mesN} termina com <b class="nowrap">≈&nbsp;${brl(pv.saldo)}</b>.`:`Sem gastos do dia a dia até agora: ${mesN} termina com <b>${brl(pv.saldo)}</b> se continuar assim.`):c.porDia!==null&&c.receitas>0?`Você pode gastar <b>${brl(c.porDia)}</b> por dia ${isCur?"até o fim do mês":"neste mês"}.`:"";
  const notaAl=alTop?(alTop.nivel==="passou"?` ${esc(alTop.nome)} passou do limite.`:` ${esc(alTop.nome)} estoura o limite no dia ${alTop.diaEstoura}.`):"";
  const saude=c.saldo<0?"bad":(c.receitas>0&&c.saldo<c.receitas*0.05)?"warn":(c.receitas>0||c.despesas>0)?"ok":"";
  const selo={ok:"mês saudável",warn:"mês apertado",bad:"mês no vermelho"}[saude];
  const olho=`<button type="button" class="olhobtn ${privado?"on":""}" data-privado="1" aria-pressed="${privado}" aria-label="Esconder valores" title="${privado?"Mostrar os valores":"Esconder os valores"}">${privado?ICON.olhoX:ICON.olho}</button>`;
  const tiles=(fase?heroSalario(k,fase,olho):`<div class="heroSaldo ${c.saldo<0?"neg":""} ${saude?"sd-"+saude:""}"><i class="hs-aura" aria-hidden="true"></i><i class="hs-aura b2" aria-hidden="true"></i>
    <div class="hs-top"><span class="hs-lab"><span class="lab">Saldo de ${esc(mesN)}</span>${olho}</span><span class="hs-dir">${selo?`<span class="hs-selo"><i></i>${selo}</span>`:""}${temFala()?`<button type="button" class="ouvir ${falando?"on":""}" data-ouvir="1" aria-pressed="${falando}" aria-label="${falando?"Parar a leitura do resumo":"Ouvir resumo do mês"}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3l4.5-4v13L7 14.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg><span class="ov-t">${falando?"Parar":"Ouvir"}</span></button>`:""}</span></div>
    <b class="hs-val" data-v="${c.saldo}">${valorGrande(c.saldo)}</b>
    <div class="hs-sub">${varS!==null?`<span class="${varS>=0?"hs-up":"hs-down"}">${varS>=0?"▲":"▼"} ${Math.round(Math.abs(varS)*100)}%</span> vs ${esc(NOMES[kM(prevK)-1].toLowerCase())} · `:""}acumulado <b>${brl(acum)}</b></div>
    ${graficoSaldo(serieSaldo(k),k)}
    <div class="hs-duo"><div class="hs-mini"><span class="lab">Receitas</span><b data-v="${c.receitas}">${valorGrande(c.receitas)}</b></div><div class="hs-mini"><span class="lab">Despesas</span><b data-v="${c.despesas}">${valorGrande(c.despesas)}</b></div></div>
  </div>`)+`
  <div class="qa">
    <button type="button" class="q" data-novo="gasto"><span class="qi">${icq("seta-baixo")}</span>Despesa</button>
    <button type="button" class="q" data-novo="avulso"><span class="qi">${icq("seta-cima")}</span>Receita</button>
    ${contasMov().length>1?`<button type="button" class="q" data-novo="transf"><span class="qi">${icq("troca")}</span>Transferir</button>`:`<button type="button" class="q" data-novo="fixo"><span class="qi">${icq("repete")}</span>Conta fixa</button>`}
    <button type="button" class="q" data-novo="caixinha" data-cxtipo="guardar"><span class="qi">${icq("cofre")}</span>Caixinha</button>
  </div>
  ${fase?cardContasSal(k,fase):""}
<!--LEMB-->
  ${notaTxt||notaAl?`<div class="nota"><span class="ni">${icq("tendencia",17)}</span><span>${notaTxt}${notaAl}${pv&&pv.cartao>0?`<small>e mais ≈ ${brl(pv.cartao)} no cartão até o fim do mês (fatura de ${esc(abrMes(shiftKey(k,1)))})</small>`:""}</span></div>`:""}
  ${(()=>{ const comLim=cats.filter(ct=>ct.orcamento>0), base=comLim.length?comLim:cats.filter(ct=>(c.porCat[ct.id]||0)>0).sort((a,b)=>(c.porCat[b.id]||0)-(c.porCat[a.id]||0)).slice(0,4);
      if(!base.length) return "";
      const linhas=base.slice(0,4).map(ct=>{ const v=c.porCat[ct.id]||0, o=comLim.length?limiteCat(ct,k):c.despesas, p=o>0?Math.min(100,v/o*100):0, cls=comLim.length&&v>o?"over":comLim.length&&p>=80?"warn":"";
        return `<div class="orow ${cls}" style="--dot:${catColor(ct.id)}">${icoCat(ct.id)}<span class="ot"><b>${esc(ct.nome)}</b><span class="track"><i style="width:${p.toFixed(1)}%"></i></span></span><span class="ov">${brl(v)}<small>${comLim.length?"de "+brl(o):Math.round(p)+"%"}</small></span></div>`; }).join("");
      return `<div class="card orc"><div class="cardhead"><h2>${comLim.length?"Orçamento do mês":"Onde mais gastou"}</h2><button type="button" class="link" data-rolar="onde">Ver tudo</button></div>${linhas}${comLim.length?"":`<button type="button" class="link" data-irajustes="categorias">Definir limites por categoria</button>`}</div>`; })()}`;
  const todos=m.gastos.filter(g=>g.forma!=="credito").concat(parcelasDoMes(k).filter(p=>p.forma!=="credito"));
  if(ui.filtro&&catIndex(ui.filtro)<0) ui.filtro="";
  const gastos=todos.filter(g=>!ui.filtro||g.cat===ui.filtro);
  const LIM=5, ordem=gastos.map((g,i)=>({g,i})).sort((a,b)=>(b.g.dia-a.g.dia)||(b.i-a.i)).map(x=>x.g);
  const todasAbertas=ui.verTodas===k, visiveis=todasAbertas?ordem:ordem.slice(0,LIM);
  const totDia={}; gastos.forEach(g=>{ totDia[g.dia]=(totDia[g.dia]||0)+(Number(g.valor)||0); });
  const byDay={}; visiveis.forEach(g=>{(byDay[g.dia]=byDay[g.dia]||[]).push(g)});
  const days=Object.keys(byDay).map(Number).sort((a,b)=>b-a);
  const lista=`<div class="card"><div class="cardhead"><h2>Últimos lançamentos</h2>
    <select class="in mini" id="filtroCat" aria-label="Filtrar por categoria"><option value="">Todas</option>${cats.map(ct=>`<option value="${esc(ct.id)}" ${ui.filtro===ct.id?"selected":""}>${esc(ct.nome)}</option>`).join("")}</select></div>
    <button type="button" class="btn wide desk" data-novo="gasto">${ICON.mais} Lançar despesa</button>
    ${gastos.length?`<p class="listaresumo">${gastos.length} despesa${gastos.length===1?"":"s"}${ui.filtro?" nesta categoria":""} · ${brl(soma(gastos))}</p>`:""}
    ${days.length?days.map(d=>{ const its=byDay[d], tot=totDia[d]||soma(its);
      const lab=new Date(kY(k),kM(k)-1,d).toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"}).replace(/\./g,"");
      return `<div class="day"><div class="dayhead"><span>${esc(lab)}${isCur&&d===today.getDate()?" · hoje":""}</span><span class="num">${brl(tot)}</span></div>${its.map(g=>linhaLanc(g,k)).join("")}</div>`; }).join("")
    :`<div class="empty-state">${ui.filtro?"Nenhuma despesa nessa categoria em "+NOMES[kM(k)-1].toLowerCase()+".":"Nenhuma despesa em "+NOMES[kM(k)-1].toLowerCase()+" ainda.<br>Toque em <b>+</b> para lançar a primeira."}</div>`}
    ${gastos.length>LIM?`<button type="button" class="btn ghost wide vermais" data-vertodas="${k}">${todasAbertas?"Mostrar só as 5 mais recentes":"Ver todas as "+gastos.length+" despesas"}</button>`:""}
    <p class="hint">Toque num lançamento para editar ou apagar. No celular, deslize: para a esquerda apaga, para a direita repete hoje (no crédito, marca como paga). Compras no cartão de crédito ficam em Contas fixas.</p></div>`;
  const fatura=cartoesOk().map(cc=>{
    const fat=faturaDoMes(k,cc.id), tot=soma(fat), prox=soma(faturaDoMes(shiftKey(k,1),cc.id)), lim=usoCartao(cc), pg=faturaPaga(m,cc.id);
    if(!fat.length&&!prox) return `<div class="card fatmini"><span class="ico" style="--dot:var(--accent)">${svgCat("dinheiro",16)}</span><span class="t"><b>Fatura ${esc(cc.nome)}</b><small>Sem compras · vence dia ${pad2(Math.min(cc.vence,diasMes(k)))}${cc.limite>0?" · limite livre "+brl(lim.livre):""}</small></span><span class="v">${brl(0)}</span></div>`;
    return `<div class="card fatcard"><div class="fatbox"><div class="fb-top"><div class="fb-t"><h2>Fatura ${esc(cc.nome)}</h2><small>vence dia ${pad2(Math.min(cc.vence,diasMes(k)))} · fecha dia ${pad2(cc.fecha)}${temContas()?" · paga pela conta "+esc(nomeConta(cc.contaId)):""}</small></div><b class="fb-v" data-v="${tot}">${valorGrande(tot)}</b></div>
      ${cc.limite>0?`<div class="bar ${lim.livre<0?"over":lim.livre<cc.limite*0.2?"warn":""}" style="--dot:var(--accent)"><div class="t"><b>Limite disponível</b><span class="num">${brl(lim.livre)} de ${brl(cc.limite)}</span></div><div class="track"><div style="width:${Math.max(0,Math.min(100,lim.livre/cc.limite*100)).toFixed(1)}%"></div></div></div>`:""}</div>
      ${fat.length?`<div>${fat.sort((a,b)=>(a.compraK+pad2(a.dia)).localeCompare(b.compraK+pad2(b.dia))).map(g=>`<button type="button" class="item" ${g.parcela?`data-edit="parcela" data-id="${esc(g.id)}"`:`data-edit="gasto" data-id="${esc(g.id)}" data-mes="${g.compraK}"`} style="--dot:${catColor(g.cat)}"><span class="pill">${esc(catName(g.cat))}</span><span class="desc"><b class="${g.desc?"":"empty"}">${esc(g.desc||"sem descrição")}</b><small>${g.parcela?"parcela "+g.idx+"/"+g.n:"compra em "+pad2(g.dia)+"/"+pad2(kM(g.compraK))}</small></span><span class="v">${brl(g.valor)}</span></button>`).join("")}</div>
        <label class="switch"><input type="checkbox" data-fatpaga="${esc(cc.id)}" ${pg?"checked":""}><span></span>Fatura paga</label>`:`<p class="hint">Nenhuma compra neste cartão para esta fatura.</p>`}
      ${prox>0?`<p class="hint">Já lançado para a fatura de ${esc(abrMes(shiftKey(k,1)))}: <b>${brl(prox)}</b></p>`:""}</div>`;
  }).join("");
  let contasCard="";
  if(temContas()){
    const S=saldosContas(k), tf=m.transf.filter(t=>t.tipo!=="acerto");
    contasCard=`<div class="card"><div class="cardhead"><h2>Contas</h2><span class="big">${brl(soma(Object.values(S).map(v=>({valor:v}))))}</span></div>
      <div class="contas">${contasMov().map(ct=>`<button type="button" class="conta" data-edit="conta" data-id="${esc(ct.id)}"><span class="ic">${ICON[ct.tipo==="dinheiro"?"dinheiro":ct.tipo==="poupanca"?"poupanca":"banco"]}</span><span class="desc"><b>${esc(ct.nome)}</b><small>${esc({corrente:"Conta corrente",poupanca:"Poupança",dinheiro:"Dinheiro",investimento:"Investimento",outra:"Outra"}[ct.tipo]||"Conta")}${state.config.contaSalario===ct.id||(!state.config.contaSalario&&ct===contaPrincipal())?" · recebe o salário":""}</small></span><span class="v num ${S[ct.id]<0?"neg":""}">${brl(S[ct.id])}</span></button>`).join("")}</div>
      ${tf.length?`<div class="subhead">Transferências de ${esc(NOMES[kM(k)-1].toLowerCase())}</div><div>${tf.slice().sort((a,b)=>a.dia-b.dia).map(t=>`<button type="button" class="item" data-edit="transf" data-id="${esc(t.id)}" style="--dot:var(--c3)"><span class="pill">dia ${pad2(t.dia)}</span><span class="desc"><b>${esc(nomeConta(t.de))} → ${esc(nomeConta(t.para))}</b><small>${esc(t.desc||"transferência")}</small></span><span class="v">${brl(t.valor)}</span></button>`).join("")}</div>`:""}
      <p class="hint">Saldo de cada conta até o fim de ${esc(NOMES[kM(k)-1].toLowerCase())}, com o que já foi lançado.</p>
      ${contasMov().length>1?`<button type="button" class="btn ghost" data-novo="transf">⇄ Transferir entre contas</button>`:""}</div>`;
  }
  const fx=fixosDoMes(k), cc=cartaoDoMes(k);
  const totalFix=c.fixosTotal+soma(cc), faltam=c.fixosPend+soma(cc.filter(x=>!x.pago));
  const linhaCartao=g=>{
    const chk=g.parcela?`data-pagar="parc|${esc(g.id)}|${k}"`:`data-gpago="${esc(g.id)}" data-mes="${g.compraK}"`;
    const edit=g.parcela?`data-edit="parcela" data-id="${esc(g.id)}" data-mes="${k}"`:`data-edit="gasto" data-id="${esc(g.id)}" data-mes="${g.compraK}"`;
    const info=g.parcela?`parcela ${g.idx}/${g.n}${g.idx===g.n?" · última parcela":" · até "+abrMes(shiftKey(k,g.n-g.idx))}`:`à vista · compra em ${pad2(g.dia)}/${pad2(kM(g.compraK))}`;
    return `<div class="item fixrow parcrow" style="--dot:${catColor(g.cat)}">
      <button type="button" class="check ${g.pago?"on":""}" ${chk} aria-pressed="${!!g.pago}" aria-label="${g.pago?"Marcar como não paga":"Marcar como paga"}">${ICON.check}</button>
      <button type="button" class="fixinfo" ${edit}><b class="${g.desc?"":"empty"}">${esc(g.desc||"Compra no cartão")}${g.parcela?` <em class="tag">${g.idx}/${g.n}</em>`:""}</b><small>${esc(info)} · ${g.pago?"paga"+(g.pagoEm?" em "+g.pagoEm.slice(8,10)+"/"+g.pagoEm.slice(5,7):""):"não paga"}</small></button>
      <span class="v">${brl(g.valor)}</span></div>`; };
  const fixas=`<div class="card"><div class="cardhead"><h2>Contas fixas</h2><span class="num muted">${fx.length||cc.length?brl(totalFix):""}</span></div>
    ${fx.length?`<div>${fx.map(f=>`<div class="item fixrow ${f.pular?"skip":""}" style="--dot:${catColor(f.cat)}">
      <button type="button" class="check ${f.pago?"on":""}" data-pago="${esc(f.id)}" aria-pressed="${f.pago}" aria-label="${f.pago?"Marcar como não paga":"Marcar como paga"}" ${f.pular?"disabled":""}>${ICON.check}</button>
      <button type="button" class="fixinfo" data-edit="fixoMes" data-id="${esc(f.id)}"><b>${esc(f.desc)}</b><small>${f.pular?"pulada neste mês":"vence dia "+pad2(f.dia)+" · "+esc(catName(f.cat))}</small></button>
      <span class="v">${f.pular?"—":brl(f.valor)}</span>
      <button type="button" class="x lixo" data-delfixo="${esc(f.id)}" aria-label="Excluir ${esc(f.desc)}" title="Excluir conta fixa">${ICON.lixo}</button></div>`).join("")}</div>`:""}
    ${cc.length?`<div class="subhead">Cartão de crédito</div><div>${cc.map(linhaCartao).join("")}</div>`:""}
    ${fx.length||cc.length?`<p class="hint">${faltam>0?"Falta pagar "+brl(faltam)+" este mês.":"Tudo pago neste mês."}</p>`
    :ativo(k)?`<p class="hint">Cadastre contas que se repetem todo mês (aluguel, internet, academia). Compras no cartão de crédito também aparecem aqui até a última parcela.</p>`:`<p class="hint">As contas fixas entram a partir do mês em que seu controle começa.</p>`}
    <button type="button" class="btn ghost" data-novo="fixo">+ Conta fixa</button></div>`;
  const rd=rendasDoMes(k);
  const receitas=`<div class="card"><div class="cardhead"><h2>Receitas</h2><span class="num muted">${brl(c.receitas)}</span></div>
    <label class="f money">Salário / renda fixa deste mês<input class="in num" id="salMes" inputmode="numeric" value="${esc(m.salario===0?"0,00":moneyInput(m.salario))}" placeholder="${esc(moneyInput(ativo(k)?state.config.salarioPadrao:0))}${ativo(k)?" (padrão)":""}"></label>
    <p class="hint">Em branco, usa o salário padrão definido no Perfil.</p>
    ${rd.length?`<div>${rd.map(r=>`<button type="button" class="item ${r.pular?"skip":""}" data-edit="rendaMes" data-id="${esc(r.id)}" style="--dot:var(--good)"><span class="pill">dia ${pad2(r.dia||1)}</span><span class="desc"><b>${esc(r.nome)}</b>${r.pular?"<small>pulada neste mês</small>":""}</span><span class="v pos">${r.pular?"—":brl(r.valor)}</span></button>`).join("")}</div>`:""}
    ${m.avulsos.length?(()=>{ const ord=m.avulsos.map((x,i)=>({x,i})).sort((p1,p2)=>(p2.x.dia-p1.x.dia)||(p2.i-p1.i)).map(o=>o.x), abertas=ui.verTodasRec===k, vis=abertas?ord:ord.slice(0,5);
      return `<div>${vis.map(x=>`<button type="button" class="item" data-edit="avulso" data-id="${esc(x.id)}" style="--dot:var(--good)"><span class="pill">dia ${pad2(x.dia)}</span><span class="desc"><b class="${x.desc?"":"empty"}">${esc(x.desc||"sem descrição")}</b></span><span class="v pos">${brl(x.valor)}</span></button>`).join("")}</div>
      ${ord.length>5?`<button type="button" class="btn ghost wide vermais" data-vertodasrec="${k}">${abertas?"Mostrar só as 5 mais recentes":"Ver todas as "+ord.length+" receitas avulsas"}</button>`:""}`; })():""}
    <button type="button" class="btn ghost" data-novo="avulso">+ Receita</button></div>`;
  const metas=state.config.metas, somaMetas=soma(metas.map(mt=>({valor:saldoMeta(mt.id,k)}))), geral=cx-somaMetas;
  const caixa=`<div class="card"><div class="cardhead"><h2>Caixinha</h2><span class="big">${brl(cx)}</span></div>
    <p class="hint">Guardar tira do saldo do mês; retirar devolve para ele.</p>
    ${metas.length?`<div class="metas">${metas.map(mt=>linhaMeta(mt,k)).join("")}<div class="metageral"><span>Geral (sem meta)</span><b class="num">${brl(geral)}</b></div></div>`:""}
    ${m.caixinha.length?`<div class="subhead">Movimentos de ${esc(NOMES[kM(k)-1].toLowerCase())}</div><div>${m.caixinha.slice().sort((a,b)=>a.dia-b.dia).map(x=>`<button type="button" class="item" data-edit="caixinha" data-id="${esc(x.id)}" style="--dot:${x.tipo==="guardar"?"var(--accent)":"var(--warn)"}"><span class="pill">dia ${pad2(x.dia)}</span><span class="desc"><b>${esc(x.desc||(x.tipo==="guardar"?"Guardou":"Retirou"))}</b><small>${x.desc?(x.tipo==="guardar"?"Guardou · ":"Retirou · "):""}${esc(nomeMeta(x.metaId))}</small></span><span class="v">${x.tipo==="guardar"?"+":"−"}${brl(x.valor)}</span></button>`).join("")}</div>`:""}
    <div class="row2"><button type="button" class="btn ghost" data-novo="caixinha" data-cxtipo="guardar">+ Guardar</button><button type="button" class="btn ghost badbtn" data-novo="caixinha" data-cxtipo="retirar">− Retirar</button></div>
    <button type="button" class="btn ghost" data-novo="meta">+ Nova meta de economia</button></div>`;
  const alR={}; if(k===todayKey) alertasOrcamento(k).forEach(a=>{ if(a.diaEstoura) alR[a.id]=a; });
  /** @type {Array<{id:string,nome:string,v:number,o:number,sb?:number,cor:string}>} */
  const itens=cats.map((ct,i)=>({id:ct.id,nome:ct.nome,v:c.porCat[ct.id]||0,o:limiteCat(ct,k),sb:sobraCat(ct,k),cor:catColor(ct.id)}));
  const semCat=Object.keys(c.porCat).filter(id=>catIndex(id)<0).reduce((a,id)=>a+c.porCat[id],0);
  if(semCat>0) itens.push({id:"",nome:"Sem categoria",v:semCat,o:0,cor:"var(--c8)"});
  const ordenados=itens.slice().sort((a,b)=>b.v-a.v);
  const porSub={}; despesasDoMes(k).forEach(g=>{ if(g.sub&&subName(g.cat,g.sub)){ const kk=g.cat; (porSub[kk]=porSub[kk]||{})[g.sub]=((porSub[kk]||{})[g.sub]||0)+(Number(g.valor)||0); } });
  const subsLinha=x=>{ const ps=porSub[x.id]; if(!ps) return ""; const tot=Object.values(ps).reduce((a,v)=>a+v,0), resto=x.v-tot;
    return `<div class="subs">${Object.entries(ps).sort((a,b)=>b[1]-a[1]).map(([sid,v])=>`<span>${esc(subName(x.id,sid))} <b>${brl(v)}</b></span>`).join("")}${resto>0.005?`<span>outros <b>${brl(resto)}</b></span>`:""}</div>`; };
  const onde=`<div class="card" id="onde"><div class="cardhead"><h2>Para onde foi</h2><span class="num muted">${varDesp?esc(varDesp):""}</span></div>
    <div class="donutwrap">${donut(ordenados,c.despesas,brl(c.despesas),"gasto no mês",true)}
    <div class="bars">${ordenados.filter(x=>x.v>0||x.o>0).map(x=>{ const pv=prev?(prev.porCat[x.id]||0):0; const p=x.o>0?x.v/x.o:0; const cls=x.o>0&&p>1?"over":x.o>0&&p>=.8?"warn":"";
      const w=x.o>0?Math.min(100,p*100):(c.despesas>0?x.v/c.despesas*100:0);
      const delta=prev&&(pv>0||x.v>0)?(x.v>pv?`<em class="up">▲ ${brl(x.v-pv)}</em>`:x.v<pv?`<em class="down">▼ ${brl(pv-x.v)}</em>`:""):"";
      return `<div class="bar ${cls}" style="--dot:${x.cor}"><div class="t"><b>${x.id?icoCat(x.id,14):""}${esc(x.nome)}</b><span class="num">${brl(x.v)}${x.o>0?" / "+brl(x.o):c.despesas>0?" · "+Math.round(x.v/c.despesas*100)+"%":""}</span></div><div class="track"><div style="width:${w.toFixed(1)}%"></div></div>${subsLinha(x)}${x.sb>0?`<div class="sobraln">inclui ${brl(x.sb)} que sobraram dos meses anteriores</div>`:""}${alR[x.id]?`<div class="ritmo">No ritmo de hoje, chega a ${brl(alR[x.id].proj)} e estoura no dia ${alR[x.id].diaEstoura}</div>`:""}${delta?`<div class="delta">${delta} vs ${abrMes(prevK)}</div>`:""}</div>`; }).join("")||'<p class="hint">Assim que você lançar despesas, aparece aqui quanto foi para cada categoria.</p>'}</div></div>
    <p class="hint">Toque numa fatia para ver os lançamentos. Limites por categoria ficam em Ajustes: amarelo a partir de 80%, vermelho quando passa.</p></div>`;
  const formas=FORMAS.map(([id,n])=>({id,n,v:c.porForma[id]||0})).concat([{id:"?",n:"Não informado",v:c.porForma["?"]||0}]).filter(x=>x.v>0).sort((a,b)=>b.v-a.v);
  const pag=`<div class="card"><div class="cardhead"><h2>Forma de pagamento</h2></div>
    ${formas.length?`<div class="bars">${formas.map(x=>`<div class="bar" style="--dot:var(--fm-${x.id==="?"?"na":x.id})"><div class="t"><b>${esc(x.n)}</b><span class="num">${brl(x.v)} · ${Math.round(x.v/c.despesas*100)}%</span></div><div class="track"><div style="width:${(x.v/formas[0].v*100).toFixed(1)}%"></div></div></div>`).join("")}</div>`:'<p class="hint">Mostra quanto saiu no Pix, débito, crédito, dinheiro e boleto.</p>'}
    ${!cartaoAtivo()&&c.porForma.credito>0?`<p class="hint">Dica: em Ajustes → Cartões de crédito, cadastre seu cartão com o dia de fechamento para as compras no crédito contarem no mês da fatura.</p>`:""}</div>`;
  if(!ini&&ui.abre.receitas===undefined) ui.abre.receitas=true;
  const nCart=cartoesOk().length, totFat=cartoesOk().reduce((a,cc)=>a+soma(faturaDoMes(k,cc.id)),0);
  const fatHtml=Array.isArray(fatura)?fatura.join(""):fatura;
  const secs1=secaoMes("cal","Calendário","gastos por dia e vencimentos",ICON.mes,cardCalendario(k))
    +secaoMes("onde","Para onde foi",c.despesas>0?brl(c.despesas)+" em despesas":"",svgCat("pontos",18),onde);
  const secs2=secaoMes("divisao","Divisão do mês","quem pagou e quem deve",ICON.grupo,cardDivisao(k))
    +secaoMes("nota","Saúde financeira","nota do mês",icq("coracao",18),cardNota(k,c))
    +secaoMes("contas","Contas",contasCard?"saldo por conta":"",ICON.banco,contasCard)
    +secaoMes("faturas",nCart>1?"Faturas dos cartões":"Fatura do cartão",nCart?brl(totFat):"",ICON.cartao,fatHtml)
    +secaoMes("fixas","Contas fixas",(fx.length||cc.length)?brl(totalFix):"",ICON.repete,fixas)
    +secaoMes("receitas","Receitas",brl(c.receitas),icq("seta-cima",18),receitas)
    +secaoMes("caixa","Caixinha",brl(cx),icq("cofre",18),caixa)
    +secaoMes("pag","Forma de pagamento","como você pagou",svgCat("dinheiro",18),pag);
  if(a11y.foco&&!ui.verTudo){
    const essenciais=secaoMes("faturas",nCart>1?"Faturas dos cartões":"Fatura do cartão",nCart?brl(totFat):"",ICON.cartao,fatHtml)+secaoMes("fixas","Contas fixas",(fx.length||cc.length)?brl(totalFix):"",ICON.repete,fixas)+secaoMes("receitas","Receitas",brl(c.receitas),icq("seta-cima",18),receitas);
    return aviso+tiles.replace('<!--LEMB-->',cardLembretes())+`<div class="grid"><div class="col">${lista}</div><div class="col">${essenciais}</div></div><button type="button" class="btn ghost wide vertudo" data-vertudo="1">Mostrar tudo do Início (calendário, gráficos, caixinha…)</button>`; }
  return aviso+(k===todayKey?cardViagemMes():"")+tiles.replace('<!--LEMB-->',cardLembretes())+`<div class="grid"><div class="col">${lista}${SECOES_RECOLHIVEIS?`<h2 class="maistit">Mais de ${esc(mesN)}</h2>`:""}${secs1}</div><div class="col">${secs2}</div></div>${a11y.foco?`<button type="button" class="btn ghost wide vertudo" data-vertudo="0">Voltar ao modo foco</button>`:""}`;
}

