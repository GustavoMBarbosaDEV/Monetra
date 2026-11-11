// @ts-check
// Retrospectiva do ano.
"use strict";
const DIAS_SEM=["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
function anosRetro(){ const ini=inicioKey(); if(!ini) return []; return [...new Set(MESES.filter(k=>k>=ini&&k<=todayKey).map(kY))].sort(); }
function dadosRetro(ano){
  const ini=inicioKey(); if(!ini) return null;
  const ks=MESES.filter(k=>kY(k)===ano&&k>=ini&&k<=todayKey); if(!ks.length) return null;
  const rows=ks.map(k=>({k,c:calc(k)}));
  const t=rows.reduce((a,r)=>({rec:a.rec+r.c.receitas,des:a.des+r.c.despesas,sal:a.sal+r.c.saldo,gu:a.gu+r.c.guardado,re:a.re+r.c.retirado,fx:a.fx+r.c.fixosTotal}),{rec:0,des:0,sal:0,gu:0,re:0,fx:0});
  const porCat={}; rows.forEach(r=>{ for(const id in r.c.porCat) porCat[id]=(porCat[id]||0)+r.c.porCat[id]; });
  const cats=Object.entries(porCat).filter(([,v])=>v>0).map(([id,v])=>({id,v,nome:catName(id)})).sort((a,b)=>b.v-a.v);
  const gastos=ks.flatMap(k=>((state.months[k]||{}).gastos||[]).map(g=>Object.assign({k},g)));
  const maior=gastos.slice().sort((a,b)=>b.valor-a.valor)[0]||null;
  const sem=[0,0,0,0,0,0,0], semN=[0,0,0,0,0,0,0]; gastos.forEach(g=>{ const d=new Date(kY(g.k),kM(g.k)-1,g.dia).getDay(); sem[d]+=g.valor; semN[d]++; });
  const diaTop=sem.some(v=>v>0)?sem.indexOf(Math.max(...sem)):null;
  const comGasto=rows.filter(r=>r.c.despesas>0);
  const caro=comGasto.slice().sort((a,b)=>b.c.despesas-a.c.despesas)[0]||null, barato=comGasto.length>1?comGasto.slice().sort((a,b)=>a.c.despesas-b.c.despesas)[0]:null;
  const melhor=rows.slice().sort((a,b)=>b.c.saldo-a.c.saldo)[0];
  const nLanc=ks.reduce((a,k)=>{ const m=/** @type {Partial<Mes>} */(state.months[k]||{}); return a+(m.gastos||[]).length+(m.avulsos||[]).length+(m.caixinha||[]).length; },0);
  const ult=ks[ks.length-1], metasFeitas=state.config.metas.filter(mt=>{ try{ return infoMeta(mt,ult).feita; }catch(e){ return false; } });
  return {ano,ks,rows,t,cats,maior,diaTop,semN,caro,barato,melhor,nLanc,metasFeitas,taxa:t.rec>0?t.sal/t.rec:0,parcial:ks[ks.length-1]===todayKey||kY(todayKey)===ano};
}
function slidesRetro(d){
  const per=abrMes(d.ks[0])+" a "+abrMes(d.ks[d.ks.length-1]);
  const sl=[];
  sl.push({cls:"capa",html:`<span class="rlab">Retrospectiva</span><b class="rbig">${d.ano}</b><p>O seu ${d.parcial?"ano até agora":"ano"} no Monetra: <b>${d.ks.length} ${d.ks.length===1?"mês":"meses"}</b> (${esc(per)}) e <b>${d.nLanc} lançamentos</b>.</p>
    ${anosRetro().length>1?`<div class="ranos">${anosRetro().map(a=>`<button type="button" class="${a===d.ano?"on":""}" data-rano="${a}">${a}</button>`).join("")}</div>`:""}`});
  sl.push({cls:"",html:`<span class="rlab">Entrou e saiu</span>
    <div class="rpar"><div><small>Entrou</small><b class="pos">${brl(d.t.rec)}</b></div><div><small>Saiu</small><b>${brl(d.t.des)}</b></div></div>
    <p>${d.t.sal>=0?`Sobraram <b class="pos">${brl(d.t.sal)}</b>. Você ficou com <b>${Math.round(d.taxa*100)}%</b> de tudo o que entrou.`:`Faltaram <b class="neg">${brl(-d.t.sal)}</b>: saiu mais do que entrou.`}</p>
    <p class="rsub">Em média, ${brl(d.t.des/d.ks.length)} de gastos por mês.</p>`});
  if(d.cats.length) sl.push({cls:"",html:`<span class="rlab">Para onde foi</span><p>O que mais pesou foi <b>${esc(d.cats[0].nome)}</b>, com ${brl(d.cats[0].v)}.</p>
    <div class="rcats">${d.cats.slice(0,5).map((c,i)=>`<div class="rcat"><span class="n">${i+1}</span><span class="t"><b>${esc(c.nome)}</b><i style="width:${Math.max(4,Math.round(c.v/d.cats[0].v*100))}%;background:${catColor(c.id)}"></i></span><span class="v">${brl(c.v)}<small>${d.t.des>0?Math.round(c.v/d.t.des*100):0}%</small></span></div>`).join("")}</div>`});
  if(d.caro) sl.push({cls:"",html:`<span class="rlab">Altos e baixos</span>
    <div class="rmeses"><div><small>Mês que mais gastou</small><b>${esc(nomeMes(d.caro.k))}</b><span>${brl(d.caro.c.despesas)}</span></div>
    ${d.barato?`<div><small>Mês mais econômico</small><b>${esc(nomeMes(d.barato.k))}</b><span>${brl(d.barato.c.despesas)}</span></div>`:""}
    ${d.melhor&&d.melhor.c.saldo>0?`<div><small>Melhor saldo</small><b>${esc(nomeMes(d.melhor.k))}</b><span class="pos">${brl(d.melhor.c.saldo)}</span></div>`:""}</div>`});
  if(d.maior) sl.push({cls:"",html:`<span class="rlab">Curiosidades</span>
    <p>Seu maior gasto foi <b>${esc(d.maior.desc||catName(d.maior.cat))}</b>: <b>${brl(d.maior.valor)}</b> em ${pad2(d.maior.dia)}/${pad2(kM(d.maior.k))}.</p>
    ${d.diaTop!=null?`<p>O dia da semana em que você mais gasta é <b>${DIAS_SEM[d.diaTop]}</b>${d.diaTop===0||d.diaTop===6?" (fim de semana!)":""}.</p>`:""}
    ${d.t.fx>0?`<p>As contas fixas somaram <b>${brl(d.t.fx)}</b> no período.</p>`:""}`});
  if(d.t.gu>0||d.metasFeitas.length) sl.push({cls:"",html:`<span class="rlab">Caixinha</span>
    <b class="rbig2 pos">${brl(d.t.gu-d.t.re)}</b><p>${d.t.gu-d.t.re>=0?"guardados a mais na caixinha":"tirados da caixinha"} no período (guardou ${brl(d.t.gu)}${d.t.re?", retirou "+brl(d.t.re):""}).</p>
    ${d.metasFeitas.length?`<p>Metas atingidas: <b>${d.metasFeitas.map(m=>esc(m.nome)).join(", ")}</b>.</p>`:""}`});
  const frase=d.taxa>=0.2?"Mandou muito bem: guardou mais de 20% do que entrou.":d.taxa>0?"Fechou no azul. Dá para mirar em guardar um pouco mais no próximo ano.":"Ano apertado. Use as metas e os limites por categoria para virar o jogo.";
  sl.push({cls:"fim",html:`<span class="rlab">Resumo de ${d.ano}</span><p class="rfrase">${frase}</p>
    <div class="rpar"><div><small>Entrou</small><b>${brl(d.t.rec)}</b></div><div><small>Saiu</small><b>${brl(d.t.des)}</b></div></div>
    <button class="btn wide" type="button" data-rshare="1">Compartilhar resumo</button>`});
  return sl;
}
function textoRetro(d){ return "Meu "+d.ano+" no Monetra\n"+"Entrou: "+brl(d.t.rec)+"\nSaiu: "+brl(d.t.des)+"\n"+(d.t.sal>=0?"Sobrou: "+brl(d.t.sal)+" ("+Math.round(d.taxa*100)+"%)":"Faltou: "+brl(-d.t.sal))+(d.cats[0]?"\nO que mais pesou: "+d.cats[0].nome:"")+"\n"+location.origin+location.pathname; }
async function compartilharRetro(){
  const d=dadosRetro(ui.sheet.ano); if(!d) return; const txt=textoRetro(d);
  try{ if(navigator.share){ await navigator.share({title:"Minha retrospectiva "+d.ano,text:txt}); return; } }catch(e){ if(e&&e.name==="AbortError") return; }
  try{ await navigator.clipboard.writeText(txt); toast("Resumo copiado."); }catch(e){ toast("Não foi possível copiar."); }
}
function cardRetro(){
  const anos=anosRetro(); if(!anos.length) return "";
  const a=anos[anos.length-1];
  return `<div class="card retrocard"><div><span class="rlab">Retrospectiva</span><b>Seu ${a} em números</b><small>Quanto entrou e saiu, onde mais gastou, seus recordes e curiosidades.</small></div><button class="btn" type="button" data-retro="${a}">Ver retrospectiva</button></div>`;
}

