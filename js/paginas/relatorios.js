// @ts-check
// Aba Relatórios: ano, divisão, patrimônio, IR, inflação, nota e assinaturas.
"use strict";
function viewAno(){
  const ini=inicioKey();
  if(!ini) return `<div class="empty-state">Os relatórios aparecem assim que você registrar sua primeira renda.<br>Vá no <b>Início</b> e informe o salário do mês (ou uma receita avulsa).</div>`;
  const ks=MESES.filter(k=>k>=ini&&k<=todayKey);
  if(!ks.length) return `<div class="empty-state">Seu controle começa em ${esc(nomeMes(ini).toLowerCase())}. Os relatórios mostram os meses a partir daí, até o mês atual.</div>`;
  const rows=ks.map(k=>({k,c:calc(k),ac:acumulado(k),cx:caixinhaAte(k)}));
  const T=rows.reduce((a,r)=>({rec:a.rec+r.c.receitas,des:a.des+r.c.despesas,sal:a.sal+r.c.saldo}),{rec:0,des:0,sal:0});
  const ult=rows[rows.length-1], periodo=abrMes(ks[0])+" a "+abrMes(ult.k)+" · "+ks.length+(ks.length===1?" mês":" meses");
  const comGasto=rows.filter(r=>r.c.despesas>0), media=comGasto.length?T.des/comGasto.length:0;
  const maior=comGasto.slice().sort((a,b)=>b.c.despesas-a.c.despesas)[0];
  const melhor=rows.slice().sort((a,b)=>b.c.saldo-a.c.saldo)[0];
  const max=Math.max(1,...rows.map(r=>Math.max(r.c.receitas,r.c.despesas)));
  const nice=(()=>{const p=Math.pow(10,Math.floor(Math.log10(max)));const s=[1,2,2.5,5,10].find(s=>s*p>=max);return s*p;})();
  const W=Math.max(360,rows.length*64+70),H=230,L=58,B=28,top=12,gw=(W-L-8)/rows.length,bw=Math.min(18,gw/3);
  const y=v=>top+(H-top-B)*(1-v/nice);
  const descG="Gráfico de receitas e despesas por mês: "+rows.map(r=>nomeMes(r.k)+", receitas "+brl(r.c.receitas)+" e despesas "+brl(r.c.despesas)).join("; ")+".";
  let svg=`<svg class="grafmes" viewBox="0 0 ${W} ${H}" style="min-width:${Math.min(W,560)}px" role="img" aria-label="${esc(descG)}">`;
  [0,.5,1].forEach(f=>{const v=nice*f;svg+=`<line x1="${L}" x2="${W-8}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="var(--muted)">${v>=1000?(v/1000).toLocaleString("pt-BR")+" mil":v.toLocaleString("pt-BR")}</text>`});
  rows.forEach((r,i)=>{const cx=L+gw*i+gw/2, cur=r.k===todayKey;
    const rx=Math.min(6,bw/2).toFixed(1), cl=cur?"cur":"past";
    svg+=`<rect class="${cl}" x="${cx-bw-1}" y="${y(r.c.receitas)}" width="${bw}" height="${Math.max(0,H-B-y(r.c.receitas))}" rx="${rx}" fill="var(--accent)"><title>${nomeMes(r.k)}: receitas ${brl(r.c.receitas)}</title></rect>`;
    svg+=`<rect class="${cl}" x="${cx+1}" y="${y(r.c.despesas)}" width="${bw}" height="${Math.max(0,H-B-y(r.c.despesas))}" rx="${rx}" fill="var(--c2)"><title>${nomeMes(r.k)}: despesas ${brl(r.c.despesas)}</title></rect>`;
    svg+=`<text x="${cx}" y="${H-10}" text-anchor="middle" font-size="11" fill="${cur?"var(--fg)":"var(--muted)"}" font-weight="${cur?700:400}">${ABR[kM(r.k)-1]}${kM(r.k)===1||i===0?" "+String(kY(r.k)).slice(2):""}</text>`;});
  svg+="</svg>";
  const cats=state.config.categorias;
  const catTot=cats.map((ct,i)=>({ct,i,v:rows.reduce((a,r)=>a+(r.c.porCat[ct.id]||0),0)})).filter(z=>z.v>0).sort((a,b)=>b.v-a.v);
  const fTot=FORMAS.map(([id,n])=>({id,n,v:rows.reduce((a,r)=>a+(r.c.porForma[id]||0),0)})).filter(z=>z.v>0).sort((a,b)=>b.v-a.v);
  const retroTopo=kM(todayKey)===12||kM(todayKey)===1;
  const pr=T.rec>0?T.des/T.rec:0, crA=pr<0.8?"var(--accent)":pr<1?"var(--warn)":"var(--bad)";
  const anel=T.rec>0?`<div class="card anelcard"><div class="anel"><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="none" stroke="var(--sunk)" stroke-width="5"/><circle class="anel-v" cx="22" cy="22" r="18" fill="none" stroke="${crA}" stroke-width="5" stroke-linecap="round" pathLength="100" stroke-dasharray="${Math.min(100,pr*100).toFixed(1)} 100" transform="rotate(-90 22 22)"/></svg><b style="color:${crA}">${Math.round(pr*100)}%</b></div>
    <div class="anel-t"><b>Das receitas viraram despesa</b><small>${pr<0.8?"Abaixo de 80% é um bom sinal.":pr<1?"Perto do limite: acima de 80% sobra pouco.":"Saiu mais do que entrou no período."} Média de gasto/mês: <b>${brl(media)}</b>.</small></div></div>`:"";
  return `${retroTopo?cardRetro():""}<div class="tiles">
    <div class="tile"><span class="lab">Receitas</span><span class="val">${brl(T.rec)}</span><span class="sub">${esc(periodo)}</span></div>
    <div class="tile"><span class="lab">Despesas</span><span class="val">${brl(T.des)}</span><span class="sub">${T.rec>0?Math.round(T.des/T.rec*100)+"% das receitas":"—"}</span></div>
    <div class="tile hero"><span class="lab">Saldo acumulado</span><span class="val ${ult.ac<0?"neg":"pos"}">${brl(ult.ac)}</span><span class="sub">até ${esc(abrMes(ult.k))}, com saldo inicial</span></div>
    <div class="tile"><span class="lab">Caixinha</span><span class="val">${brl(ult.cx)}</span><span class="sub">guardado até agora</span></div>
    <div class="tile"><span class="lab">Média de gasto/mês</span><span class="val">${brl(media)}</span><span class="sub">${comGasto.length} ${comGasto.length===1?"mês":"meses"} com lançamentos</span></div>
  </div>
  ${maior||melhor?`<div class="destaques">${maior?`<div><span class="lab">Mês que mais gastou</span><b>${esc(nomeMes(maior.k))}</b><span>${brl(maior.c.despesas)}</span></div>`:""}${melhor&&melhor.c.saldo>0?`<div><span class="lab">Melhor saldo</span><b>${esc(nomeMes(melhor.k))}</b><span class="pos">${brl(melhor.c.saldo)}</span></div>`:""}${catTot[0]?`<div><span class="lab">Categoria que mais pesou</span><b>${esc(catTot[0].ct.nome)}</b><span>${brl(catTot[0].v)} · ${Math.round(catTot[0].v/T.des*100)}%</span></div>`:""}</div>`:""}
  <div class="card chart"><div class="cardhead"><h2>Receitas x despesas</h2></div><div class="legend"><span><i style="background:var(--accent)"></i>Receitas</span><span><i style="background:var(--c2)"></i>Despesas</span></div><div class="tablewrap">${svg}</div></div>
  ${anel}${retroTopo?"":cardRetro()}
  ${cardPatrimonio()}
  ${cardAssinaturas(rows.length?T.rec/rows.length:0)}
  <div class="grid"><div class="col">${cardIR()}</div><div class="col">${cardInflacao()}</div></div>
  ${cardEtiquetas()}
  <div class="grid"><div class="card"><div class="cardhead"><h2>Mês a mês</h2><span class="num muted">valores em R$ · toque para abrir</span></div><div class="tablewrap"><table>
    <thead><tr><th>Mês</th><th>Receitas</th><th>Despesas</th><th>Saldo</th><th class="ac">Acumulado</th></tr></thead>
    <tbody>${rows.slice().reverse().map(r=>`<tr class="click ${r.k===todayKey?"cur":""}" data-open="${r.k}"><td>${esc(nomeMes(r.k))}${r.k===todayKey?' <small class="muted">atual</small>':""}</td><td>${brlT(r.c.receitas)}</td><td>${brlT(r.c.despesas)}</td><td class="${r.c.saldo<0?"neg":""}">${brlT(r.c.saldo)}</td><td class="ac ${r.ac<0?"neg":""}">${brlT(r.ac)}</td></tr>`).join("")}</tbody>
    <tfoot><tr><td>Total</td><td>${brlT(T.rec)}</td><td>${brlT(T.des)}</td><td>${brlT(T.sal)}</td><td class="ac">${brlT(ult.ac)}</td></tr></tfoot>
  </table></div></div>
  <div class="col"><div class="card"><h2>Para onde foi o dinheiro</h2>${catTot.length?`<div class="donutwrap">${donut(catTot.map(z=>({nome:z.ct.nome,v:z.v,cor:catColor(z.ct.id)})),T.des,brl(T.des),"no período")}<div class="bars">${catTot.map(z=>`<div class="bar" style="--dot:${catColor(z.ct.id)}"><div class="t"><b>${esc(z.ct.nome)}</b><span class="num">${brl(z.v)} · ${Math.round(z.v/T.des*100)}%</span></div><div class="track"><div style="width:${(z.v/catTot[0].v*100).toFixed(1)}%"></div></div><div class="delta">média ${brl(z.v/ks.length)}/mês</div></div>`).join("")}</div></div>`:`<div class="empty-state">Assim que você lançar despesas, o total por categoria aparece aqui.</div>`}</div>
  ${fTot.length?`<div class="card"><h2>Forma de pagamento no período</h2><div class="bars">${fTot.map(x=>`<div class="bar" style="--dot:var(--fm-${x.id})"><div class="t"><b>${esc(x.n)}</b><span class="num">${brl(x.v)} · ${Math.round(x.v/T.des*100)}%</span></div><div class="track"><div style="width:${(x.v/fTot[0].v*100).toFixed(1)}%"></div></div></div>`).join("")}</div></div>`:""}</div></div>`;
}

const membrosGrupo=()=>grupoDoc&&grupoDoc.m?Object.keys(grupoDoc.m):[];
/** @param {MesKey} k */
function divisaoMes(k){
  const m=/** @type {any} */(state.months[k]||{}), pag={}; let semQuem=0, semQuemV=0;
  const poe=(quem,v)=>{ v=Number(v)||0; if(!(v>0)) return; if(!quem){ semQuem++; semQuemV+=v; return; } pag[quem]=(pag[quem]||0)+v; };
  (m.gastos||[]).forEach(g=>poe(g.pagou||g.por,g.valor));
  parcelasDoMes(k).forEach(p=>{ const pp=state.config.parcelas.find(x=>x.id===p.id); poe(pp&&(pp.pagou||pp.por),p.valor); });
  fixosDoMes(k).filter(f=>!f.pular&&f.pago).forEach(f=>poe(((m.fixos||{})[f.id]||{}).por,f.valor));
  const pessoas=[...new Set(membrosGrupo().concat(Object.keys(pag)))], total=Object.values(pag).reduce((a,v)=>a+v,0), parte=total/(pessoas.length||1);
  const acertos=(m.transf||[]).filter(t=>t.tipo==="acerto"), saldo={};
  pessoas.forEach(p=>saldo[p]=(pag[p]||0)-parte);
  acertos.forEach(a=>{ saldo[a.de]=(saldo[a.de]||0)+(Number(a.valor)||0); saldo[a.para]=(saldo[a.para]||0)-(Number(a.valor)||0); });
  const dev=pessoas.filter(p=>saldo[p]<-0.005).map(p=>({p,v:-saldo[p]})).sort((a,b)=>b.v-a.v), rec=pessoas.filter(p=>saldo[p]>0.005).map(p=>({p,v:saldo[p]})).sort((a,b)=>b.v-a.v), sug=[];
  let i=0, j=0; while(i<dev.length&&j<rec.length){ const v=Math.min(dev[i].v,rec[j].v); if(v>=0.01) sug.push({de:dev[i].p,para:rec[j].p,v:Math.round(v*100)/100}); dev[i].v-=v; rec[j].v-=v; if(dev[i].v<0.005) i++; if(rec[j].v<0.005) j++; }
  return {pessoas,pag,total,parte,saldo,acertos,sug,semQuem,semQuemV};
}
/** @param {MesKey} k */
function cardDivisao(k){
  if(!compartilhado()||membrosGrupo().length<2) return "";
  const D=divisaoMes(k), nm=p=>p===uid?"Você":(nomeDe(p)||"Ex-participante");
  const pessoas=D.pessoas.map(p=>{ const sd=D.saldo[p]||0; return `<div class="item divp"><span class="desc"><b>${esc(nm(p))}</b><small>pagou ${brl(D.pag[p]||0)} · parte ${brl(D.parte)}</small></span><span class="v ${sd>0.005?"pos":sd<-0.005?"neg":""}">${sd>0.005?"recebe "+brl(sd):sd<-0.005?"deve "+brl(-sd):"em dia"}</span></div>`; }).join("");
  const sug=D.sug.map(x=>`<div class="item divsug"><span class="desc"><b>${esc(nm(x.de))} → ${esc(nm(x.para))}</b><small>${x.de===uid?"você paga":esc(nm(x.de))+" paga"} ${brl(x.v)}${x.para===uid?" para você":""}</small></span><button type="button" class="btn mini" data-acerto="${esc(x.de+"|"+x.para+"|"+x.v)}" data-mes="${k}">Registrar acerto</button></div>`).join("");
  const ac=D.acertos.map(a=>`<div class="item divac"><span class="pill">dia ${pad2(a.dia)}</span><span class="desc"><b>${esc(nm(a.de))} pagou ${esc(nm(a.para).toLowerCase()==="você"?"você":nm(a.para))}</b><small>acerto registrado</small></span><span class="v">${brl(a.valor)}</span><button type="button" class="x lixo" data-delacerto="${esc(a.id)}" data-mes="${k}" aria-label="Apagar acerto de ${esc(brl(a.valor))}">${ICON.lixo}</button></div>`).join("");
  return `<div class="card" id="divisao"><div class="cardhead"><h2>Divisão do mês</h2><span class="num muted">${brl(D.total)}</span></div>
    <p class="hint">Despesas de ${esc(NOMES[kM(k)-1].toLowerCase())} divididas em partes iguais entre ${D.pessoas.length} pessoas.</p>
    <div>${pessoas}</div>
    ${sug?`<div class="subhead">Para acertar</div><div>${sug}</div>`:D.total>0?`<p class="hint"><b>Tudo acertado</b> neste mês.</p>`:""}
    ${ac?`<div class="subhead">Acertos feitos</div><div>${ac}</div>`:""}
    ${D.semQuem?`<p class="hint">${D.semQuem} lançamento${D.semQuem===1?"":"s"} (${brl(D.semQuemV)}) sem quem pagou ficaram de fora. Abra e escolha em “Quem pagou”.</p>`:""}
    <p class="hint">Na despesa, escolha <b>Quem pagou</b>. Contas fixas entram quando alguém marca como paga.</p></div>`;
}

const TIPOS_BEM=[["bem-imovel","Imóvel"],["bem-veiculo","Veículo"],["bem-outro","Outro bem"]];
const nomeBem=t=>(TIPOS_BEM.find(x=>x[0]===t)||[null,"Bem"])[1];
/** @param {MesKey} k */
function patrimonio(k){
  const dinheiro=temContas()?Object.values(saldosContas(k)).reduce((a,v)=>a+v,0):acumulado(k);
  const cx=caixinhaAte(k), bensL=state.config.contas.filter(ehBem), bensV=soma(bensL.map(b=>({valor:b.saldoInicial}))), dv=state.config.dividas||[];
  const receber=soma(dv.filter(x=>x.tipo==="receber"&&!quitada(x)).map(x=>({valor:restaDiv(x)}))), devo=soma(dv.filter(x=>x.tipo==="pagar"&&!quitada(x)).map(x=>({valor:restaDiv(x)})));
  const parc=soma(parcelasDoMes(k).map(p=>({valor:Math.max(0,faltaParcelas(p.total,p.n,p.idx)-p.valor)})));
  return {dinheiro,cx,bensL,bensV,receber,devo,parc,liq:dinheiro+cx+bensV+receber-devo-parc};
}
function cardPatrimonio(){
  if(!ativo(todayKey)) return "";
  const P=patrimonio(todayKey), pk=shiftKey(todayKey,-1), A=MESES.includes(pk)&&ativo(pk)?patrimonio(pk):null, dif=A?P.liq-A.liq:null;
  const lin=(lab,v,sub)=>`<div class="ptlin"><span><b>${lab}</b>${sub?`<small>${sub}</small>`:""}</span><span class="num ${v<0?"neg":""}">${v<0?"−":""}${brl(Math.abs(v))}</span></div>`;
  const inv=contasMov().filter(c=>c.tipo==="investimento").length;
  return `<div class="card" id="patrimonio"><div class="cardhead"><h2>Patrimônio</h2><span class="num muted">hoje</span></div>
    <div class="assintot"><div><span class="lab">Patrimônio líquido</span><b class="${P.liq<0?"neg":""}">${brl(P.liq)}</b><small>${dif!==null&&Math.abs(dif)>=0.005?(dif>0?"▲ ":"▼ ")+brl(Math.abs(dif))+" vs "+esc(abrMes(pk)):"o que você tem menos o que deve"}</small></div></div>
    <div class="ptlista">
      ${lin(temContas()?"Contas":"Saldo acumulado",P.dinheiro,temContas()?contasMov().length+(contasMov().length===1?" conta":" contas")+(inv?", com "+inv+(inv===1?" investimento":" investimentos"):""):"tudo o que sobrou nos meses, com o saldo inicial")}
      ${P.cx?lin("Caixinha",P.cx,"guardado nas metas e na caixinha"):""}
      ${P.bensL.map(b=>`<button type="button" class="ptlin ptbem" data-edit="bem" data-id="${esc(b.id)}"><span><b>${esc(b.nome)}</b><small>${esc(nomeBem(b.tipo))} · toque para atualizar o valor</small></span><span class="num">${brl(b.saldoInicial)}</span></button>`).join("")}
      ${P.receber?lin("A receber",P.receber,"o que outras pessoas te devem"):""}
      ${P.devo?lin("Dívidas",-P.devo,"o que você deve a outras pessoas"):""}
      ${P.parc?lin("Parcelas a vencer",-P.parc,"compras parceladas dos próximos meses"):""}
    </div>
    <div class="row2"><button class="btn ghost" type="button" data-novo="bem">+ Imóvel, veículo…</button><button class="btn ghost" type="button" data-novo="conta" data-ctipo="investimento">+ Investimento</button></div>
    <p class="hint">Bens entram pelo valor que você informar. Investimentos são contas: transfira para elas e o saldo aparece aqui.</p></div>`;
}

const TAXAS_PAD={ipca:4.5,cdi:14.9};
const taxas=(()=>{ const t=Object.assign({},TAXAS_PAD); try{ const x=JSON.parse(localStorage.getItem("mb.taxas")||"{}"); ["ipca","cdi"].forEach(k=>{ if(typeof x[k]==="number"&&isFinite(x[k])&&x[k]>-20&&x[k]<100) t[k]=x[k]; }); }catch(e){} return t; })();
function salvaTaxas(){ try{ localStorage.setItem("mb.taxas",JSON.stringify(taxas)); }catch(e){} }
const lerTaxa=t=>{ const x=String(t||"").replace(/%/g,"").trim(); return x===""?NaN:numCSV(x); };
const pctTxt=v=>v.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:2})+"%";
const campoTaxa=(id,v,lab)=>`<label class="f taxa">${lab}<span class="taxain"><input class="in num" id="${id}" inputmode="decimal" value="${esc(String(v).replace(".",","))}" aria-describedby="${id}-d"><span aria-hidden="true">% ao ano</span></span></label>`;
const poupAA=()=>taxas.cdi>8.5?6.17:Math.max(0,taxas.cdi*0.7);
const aoMes=aa=>Math.pow(1+aa/100,1/12)-1;
const valorFuturo=(saldo,pmt,i,n)=>i?saldo*Math.pow(1+i,n)+pmt*(Math.pow(1+i,n)-1)/i:saldo+pmt*n;

function itensIR(ano){
  const out=[];
  Object.keys(state.months).forEach(k=>{ if(!mesValido(k)||kY(k)!==ano) return; ((state.months[k]||{}).gastos||[]).forEach(g=>{ if(g.ir) out.push({tipo:g.ir,valor:Number(g.valor)||0,desc:g.desc||catName(g.cat),cat:g.cat,dia:g.dia,k,id:g.id,parc:false}); }); });
  const comIR=state.config.parcelas.filter(p=>p.ir); if(comIR.length) MESES.filter(k=>kY(k)===ano).forEach(k=>parcelasDoMes(k).forEach(p=>{ const pp=comIR.find(x=>x.id===p.id); if(pp) out.push({tipo:pp.ir,valor:p.valor,desc:(p.desc||"Compra parcelada")+" ("+p.idx+"/"+p.n+")",cat:p.cat,dia:p.dia,k,id:p.id,parc:true}); }));
  return out;
}
function anosIR(){ const s=new Set(); Object.keys(state.months).forEach(k=>{ if(mesValido(k)&&((state.months[k]||{}).gastos||[]).some(g=>g.ir)) s.add(kY(k)); }); state.config.parcelas.forEach(p=>{ if(p.ir) for(let i=0;i<=p.n;i++) s.add(kY(shiftKey(p.compra,i))); }); return [...s].sort((a,b)=>b-a); }
function cardIR(){
  const anos=anosIR();
  if(!anos.length) return `<div class="card" id="impostorenda"><div class="cardhead"><h2>Imposto de Renda</h2></div>
    <p class="hint">Ao lançar uma despesa (consulta, exame, escola, curso, previdência PGBL…), escolha em <b>Imposto de Renda</b> o tipo de dedução. Aqui aparece o total do ano por tipo, pronto para a declaração.</p></div>`;
  const pad=kM(todayKey)<=5&&anos.includes(kY(todayKey)-1)?kY(todayKey)-1:anos[0], ano=ui.irAno&&anos.includes(ui.irAno)?ui.irAno:pad;
  const its=itensIR(ano), tot=soma(its), porT=IR_TIPOS.map(([id,n])=>({id,n,its:its.filter(x=>x.tipo===id)})).map(x=>Object.assign(x,{v:soma(x.its)})).filter(x=>x.its.length).sort((a,b)=>b.v-a.v);
  return `<div class="card" id="impostorenda"><div class="cardhead"><h2>Imposto de Renda ${ano}</h2><span class="num muted">${brl(tot)}</span></div>
    ${anos.length>1?`<div class="chips irchips" role="group" aria-label="Ano">${anos.map(a=>`<button type="button" class="chip ${a===ano?"on":""}" data-irano="${a}" aria-pressed="${a===ano}">${a}</button>`).join("")}</div>`:""}
    <div class="assintot"><div><span class="lab">Total dedutível</span><b>${brl(tot)}</b><small>gasto em ${ano}</small></div><div><span class="lab">Lançamentos</span><b>${its.length}</b><small>marcados para o IR</small></div></div>
    <div class="bars">${porT.map(x=>`<details class="irtipo"><summary><div class="bar" style="--dot:var(--accent)"><div class="t"><b>${esc(x.n)}</b><span class="num">${brl(x.v)} · ${x.its.length} ${x.its.length===1?"item":"itens"}</span></div><div class="track"><div style="width:${(x.v/(porT[0].v||1)*100).toFixed(1)}%"></div></div></div></summary>
      <div>${x.its.slice().sort((a,b)=>(a.k+pad2(a.dia)).localeCompare(b.k+pad2(b.dia))).slice(0,60).map(g=>`<button type="button" class="item" ${g.parc?`data-edit="parcela" data-id="${esc(g.id)}"`:`data-edit="gasto" data-id="${esc(g.id)}" data-mes="${g.k}"`} style="--dot:${catColor(g.cat)}"><span class="pill">${pad2(g.dia)}/${pad2(kM(g.k))}</span><span class="desc"><b>${esc(g.desc)}</b><small>${esc(catName(g.cat))}</small></span><span class="v">${brl(g.valor)}</span></button>`).join("")}</div></details>`).join("")}</div>
    <p class="hint">Toque num tipo para ver os lançamentos. Guarde as notas e os recibos (com CPF ou CNPJ de quem recebeu). Saúde não tem limite; educação e PGBL têm limites anuais: confira as regras da Receita Federal do ano.</p></div>`;
}

function inflacaoPessoal(){
  const pares=[]; for(let i=1;i<=12;i++){ const k=shiftKey(todayKey,-i), a=shiftKey(k,-12); if(ativo(a)&&MESES.includes(a)&&MESES.includes(k)) pares.push([a,k]); }
  const antes={}, depois={}; pares.forEach(([a,k])=>{ const ca=calc(a), ck=calc(k); if(!(ca.despesas>0&&ck.despesas>0)) return; Object.entries(ca.porCat).forEach(([c,v])=>antes[c]=(antes[c]||0)+v); Object.entries(ck.porCat).forEach(([c,v])=>depois[c]=(depois[c]||0)+v); });
  const cats=Object.keys(antes).filter(c=>antes[c]>0&&(depois[c]||0)>0).map(c=>({id:c,a:antes[c],d:depois[c],p:depois[c]/antes[c]-1})).sort((x,y)=>y.p-x.p);
  const A=cats.reduce((s,x)=>s+x.a,0), D=cats.reduce((s,x)=>s+x.d,0);
  return {n:pares.length,cats,A,D,p:A>0?D/A-1:null};
}
function cardInflacao(){
  const I=inflacaoPessoal(), ip=taxas.ipca;
  const taxa=`${campoTaxa("tx-ipca",ip,"IPCA de referência (12 meses)")}<p class="hint" id="tx-ipca-d">Valor fixo que você pode mudar: confira o IPCA mais recente no site do IBGE.</p>`;
  if(I.p===null) return `<div class="card" id="inflacao"><div class="cardhead"><h2>Sua inflação x IPCA</h2></div>
    <p class="hint">Compara quanto você gastou em cada categoria com os mesmos meses do ano anterior. Aparece quando houver pelo menos um mês com lançamentos e o mesmo mês, um ano antes, também com lançamentos.</p>${taxa}</div>`;
  const pp=I.p*100, dif=pp-ip, cls=dif>1?"neg":dif<-1?"pos":"";
  const max=Math.max(...I.cats.map(x=>Math.abs(x.p)),0.01);
  return `<div class="card" id="inflacao"><div class="cardhead"><h2>Sua inflação x IPCA</h2><span class="num muted">${I.n} ${I.n===1?"mês":"meses"} comparados</span></div>
    <div class="assintot"><div><span class="lab">Seus gastos</span><b class="${cls}">${pp>=0?"+":"−"}${pctTxt(Math.abs(pp))}</b><small>vs o ano anterior</small></div><div><span class="lab">IPCA</span><b>${pctTxt(ip)}</b><small>referência</small></div></div>
    <p class="hint">${Math.abs(dif)<=1?"Seus gastos subiram parecido com a inflação oficial.":dif>0?"Seus gastos subiram <b>"+pctTxt(dif)+"</b> acima do IPCA: vale olhar as categorias que mais subiram.":"Seus gastos subiram <b>"+pctTxt(-dif)+"</b> abaixo do IPCA. Bom sinal!"}</p>
    <div class="bars">${I.cats.slice(0,8).map(x=>`<div class="bar ${x.p*100>ip+1?"over":""}" style="--dot:${catColor(x.id)}"><div class="t"><b>${icoCat(x.id,14)}${esc(catName(x.id))}</b><span class="num">${x.p>=0?"+":"−"}${pctTxt(Math.abs(x.p*100))} · ${brl(x.a)} → ${brl(x.d)}</span></div><div class="track"><div style="width:${(Math.abs(x.p)/max*100).toFixed(1)}%"></div></div></div>`).join("")}</div>
    <p class="hint">Não é só preço: conta também se você comprou mais ou menos. Só entram categorias com gasto nos dois períodos.</p>${taxa}</div>`;
}

function cardRende(){
  const cx=Math.max(0,caixinhaAte(todayKey)), iC=aoMes(taxas.cdi), iP=aoMes(poupAA());
  const ganho=(i,n)=>valorFuturo(cx,0,i,n)-cx;
  const metas=state.config.metas.filter(mt=>mt.alvo>0).map(mt=>({mt,i:infoMeta(mt,todayKey)})).filter(x=>!x.i.feita);
  const linhaM=({mt,i})=>{ const s=Math.max(0,i.saldo);
    if(i.meses&&i.porMes!==null&&!i.atrasada){ const n=i.meses, fv=valorFuturo(s,i.porMes,iC,n), ex=fv-(s+i.porMes*n), pmt=iC?Math.max(0,(mt.alvo-s*Math.pow(1+iC,n))*iC/(Math.pow(1+iC,n)-1)):i.porMes;
      return `<div class="rendemeta"><b>${esc(mt.nome)}</b><small>Guardando ${brl(i.porMes)}/mês até ${esc(abrMes(mt.prazo))}, no CDI rende ≈ <b>${brl(ex)}</b> a mais. Com o rendimento, bastaria guardar ≈ <b>${brl(pmt)}</b>/mês.</small></div>`; }
    return `<div class="rendemeta"><b>${esc(mt.nome)}</b><small>${s>0?`Os ${brl(s)} guardados rendem ≈ <b>${brl(valorFuturo(s,0,iC,12)-s)}</b> em 12 meses no CDI (${brl(valorFuturo(s,0,iP,12)-s)} na poupança).`:"Comece a guardar para ver quanto rende."}</small></div>`; };
  return `<div class="card" id="rende"><div class="cardhead"><h2>Quanto renderia</h2><span class="num muted">CDI ${pctTxt(taxas.cdi)}</span></div>
    ${cx>0?`<div class="assintot"><div><span class="lab">Caixinha em 1 mês</span><b>+${brl(ganho(iC,1))}</b><small>no CDI · ${brl(ganho(iP,1))} na poupança</small></div><div><span class="lab">Em 12 meses</span><b>+${brl(ganho(iC,12))}</b><small>no CDI · ${brl(ganho(iP,12))} na poupança</small></div></div>`
      :`<p class="hint">Guarde dinheiro na caixinha para ver quanto ele renderia por mês.</p>`}
    ${metas.length?`<div class="subhead">Suas metas</div>${metas.map(linhaM).join("")}`:""}
    ${campoTaxa("tx-cdi",taxas.cdi,"CDI de referência")}<p class="hint" id="tx-cdi-d">Estimativa com 100% do CDI, antes do IR (de 15% a 22,5% do rendimento). A poupança é isenta e rende ${pctTxt(poupAA())} ao ano com esta taxa (sem a TR). Mude a taxa quando quiser.</p></div>`;
}

/**
 * @param {MesKey} k
 * @param {CalcMes} c
 */
function notaSaude(k,c){
  if(!(c.receitas>0)) return null;
  const cl=x=>Math.max(0,Math.min(1,x)), itens=[];
  const sobra=(c.receitas-c.despesas)/c.receitas;
  itens.push({t:"Sobra do mês",max:30,pts:30*cl(sobra/0.2),txt:sobra<0?"Saiu "+brl(c.despesas-c.receitas)+" a mais do que entrou.":"Sobrou "+Math.round(sobra*100)+"% das receitas. Nota cheia a partir de 20%."});
  const dHoje=k===todayKey?today.getDate():k<todayKey?99:0;
  const atras=fixosDoMes(k).filter(f=>!f.pular&&!f.pago&&f.dia<dHoje).length+parcelasDoMes(k).filter(p=>!p.cartao&&!p.pago&&p.dia<dHoje).length
    +cartoesOk().filter(cc=>soma(faturaDoMes(k,cc.id))>0&&!faturaPaga(state.months[k],cc.id)&&Math.min(cc.vence,diasMes(k))<dHoje).length;
  itens.push({t:"Contas em dia",max:20,pts:Math.max(0,20-7*atras),txt:atras?atras+(atras===1?" conta venceu e não foi marcada como paga.":" contas venceram e não foram marcadas como pagas."):"Nenhuma conta atrasada."});
  const lim=state.config.categorias.filter(ct=>ct.orcamento>0), dentro=lim.filter(ct=>(c.porCat[ct.id]||0)<=limiteCat(ct,k)+0.005).length;
  itens.push({t:"Limites por categoria",max:20,pts:lim.length?20*dentro/lim.length:10,txt:lim.length?dentro+" de "+lim.length+" categorias dentro do limite.":"Sem limites definidos: defina em Ajustes → Categorias para ganhar estes pontos."});
  const g=(c.guardado-c.retirado)/c.receitas;
  itens.push({t:"Guardou na caixinha",max:15,pts:15*cl(g/0.1),txt:g>0?"Guardou "+brl(c.guardado-c.retirado)+" ("+Math.round(g*100)+"% das receitas). Nota cheia a partir de 10%.":"Nada guardado neste mês."});
  const fixas=(c.fixosTotal+soma(parcelasDoMes(k)))/c.receitas;
  itens.push({t:"Peso das contas fixas",max:15,pts:15*cl((1-fixas)/0.5),txt:"Contas fixas e parcelas levam "+Math.round(fixas*100)+"% das receitas. Nota cheia até 50%."});
  const nota=Math.round(itens.reduce((s,x)=>s+x.pts,0));
  return {nota,itens,nivel:nota>=80?"Ótima":nota>=60?"Boa":nota>=40?"Atenção":"Crítica",cls:nota>=60?"ok":nota>=40?"warn":"bad"};
}
/**
 * @param {MesKey} k
 * @param {CalcMes} c
 */
function cardNota(k,c){
  const N=notaSaude(k,c); if(!N) return "";
  const cor={ok:"var(--accent)",warn:"var(--warn)",bad:"var(--bad)"}[N.cls];
  return `<div class="card notacard" id="nota"><div class="cardhead"><h2>Saúde financeira</h2><span class="num muted">${esc(abrMes(k))}</span></div>
    <div class="anelcard"><div class="anel" role="img" aria-label="Nota ${N.nota} de 100: ${N.nivel}"><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="none" stroke="var(--sunk)" stroke-width="5"/><circle class="anel-v" cx="22" cy="22" r="18" fill="none" stroke="${cor}" stroke-width="5" stroke-linecap="round" pathLength="100" stroke-dasharray="${N.nota} 100" transform="rotate(-90 22 22)"/></svg><b style="color:${cor}" aria-hidden="true">${N.nota}</b></div>
    <div class="anel-t"><b>Nota ${N.nota} de 100 · ${N.nivel}</b><small>${esc((N.itens.slice().sort((a,b)=>(b.max-b.pts)-(a.max-a.pts))[0]||{}).txt||"")}</small></div></div>
    <details class="notadet"><summary>Como a nota é calculada</summary><ul>${N.itens.map(x=>`<li><span><b>${esc(x.t)}</b><small>${esc(x.txt)}</small></span><em>${Math.round(x.pts)}/${x.max}</em></li>`).join("")}</ul></details></div>`;
}

function aumentos(){
  const out=[];
  fixosDoMes(todayKey).filter(f=>!f.pular).forEach(f=>{ for(let i=1;i<=3;i++){ const a=fixosDoMes(shiftKey(todayKey,-i)).find(x=>x.id===f.id&&!x.pular); if(!a) continue; if(f.valor>a.valor+0.5&&f.valor>a.valor*1.01) out.push({nome:f.desc,de:a.valor,para:f.valor,k:shiftKey(todayKey,-i),cat:f.cat}); return; } });
  const ks=[0,1,2,3].map(i=>shiftKey(todayKey,-i)), nomesFixos=new Set(state.config.fixos.map(f=>norm(f.nome))), mapa={};
  ks.forEach(k=>((state.months[k]||{}).gastos||[]).forEach(g=>{ const d=norm(g.desc); if(!d||nomesFixos.has(d)) return; const x=mapa[d]||(mapa[d]={nome:g.desc.trim(),cat:g.cat,por:{}}); if(!(k in x.por)) x.por[k]=Number(g.valor)||0; }));
  Object.values(mapa).forEach(x=>{ const tem=ks.filter(k=>k in x.por); if(tem.length<3) return; const [ult,ant]=tem; if(x.por[ult]>x.por[ant]+0.5&&x.por[ult]>x.por[ant]*1.01) out.push({nome:x.nome,de:x.por[ant],para:x.por[ult],k:ant,cat:x.cat}); });
  return out.map(a=>Object.assign(a,{p:a.para/a.de-1})).sort((a,b)=>(b.para-b.de)-(a.para-a.de));
}

function cardEtiquetas(){
  const tot={};
  Object.keys(state.months).forEach(k=>((state.months[k]||{}).gastos||[]).forEach(g=>(g.tags||[]).forEach(t=>{ const x=tot[t]||(tot[t]={v:0,n:0,meses:new Set()}); x.v+=Number(g.valor)||0; x.n++; x.meses.add(k); })));
  state.config.parcelas.forEach(pp=>(pp.tags||[]).forEach(t=>{ const x=tot[t]||(tot[t]={v:0,n:0,meses:new Set()}); x.v+=pp.total; x.n++; x.meses.add(pp.compra); }));
  const ls=Object.entries(tot).sort((a,b)=>b[1].v-a[1].v); if(!ls.length) return "";
  const max=ls[0][1].v||1;
  return `<div class="card" id="etiquetas"><div class="cardhead"><h2>Etiquetas</h2><span class="num muted">toque para ver os lançamentos</span></div>
  <div class="bars">${ls.slice(0,12).map(([t,x])=>`<button type="button" class="bar tagbar" data-vertag="${esc(t)}" style="--dot:var(--accent)"><div class="t"><b>#${esc(t)}</b><span class="num">${brl(x.v)} · ${x.n} lançamento${x.n===1?"":"s"}</span></div><div class="track"><div style="width:${Math.max(3,x.v/max*100).toFixed(1)}%"></div></div></button>`).join("")}</div></div>`;
}

function assinaturas(){
  const fixos=state.config.fixos.filter(f=>f.desde<=todayKey&&(!f.ate||f.ate>=todayKey)).slice().sort((a,b)=>b.valor-a.valor);
  const parcelas=parcelasDoMes(todayKey).map(p=>{ return Object.assign({},p,{falta:faltaParcelas(p.total,p.n,p.idx),fim:shiftKey(todayKey,p.n-p.idx)}); }).sort((a,b)=>b.valor-a.valor);
  const ks=[0,1,2,3].map(i=>shiftKey(todayKey,-i)), nomesFixos=new Set(state.config.fixos.map(f=>norm(f.nome))), mapa={};
  ks.forEach(k=>((state.months[k]||{}).gastos||[]).forEach(g=>{ const d=norm(g.desc); if(!d||nomesFixos.has(d)) return;
    const x=mapa[d]||(mapa[d]={nome:g.desc.trim(),meses:new Set(),vals:[],cat:g.cat,forma:g.forma,dia:g.dia}); if(x.nome===x.nome.toLowerCase()&&/[A-ZÀ-Ý]/.test(g.desc)) x.nome=g.desc.trim(); if(!x.meses.has(k)){ x.meses.add(k); x.vals.push(g.valor); } }));
  const repetidos=Object.values(mapa).filter(x=>x.meses.size>=3).map(x=>Object.assign(x,{media:Math.round(x.vals.reduce((a,v)=>a+v,0)/x.vals.length*100)/100})).sort((a,b)=>b.media-a.media);
  const mes=fixos.reduce((a,f)=>a+f.valor,0), mesParc=parcelas.reduce((a,p)=>a+p.valor,0);
  return {fixos,parcelas,repetidos,mes,mesParc};
}
function cardAssinaturas(rendaMedia){
  const A=assinaturas(); ui.repetidos=A.repetidos;
  const tot=A.mes+A.mesParc, AU=aumentos();
  const subiu=AU.length?`<div class="subhead">Ficou mais caro</div><div>${AU.map(a=>`<div class="item aumento" style="--dot:${catColor(a.cat)}"><span class="desc"><b>${esc(a.nome)}</b><small>de ${brl(a.de)} (${esc(abrMes(a.k))}) para ${brl(a.para)} agora</small></span><span class="v neg">+${pctTxt(a.p*100)}</span></div>`).join("")}</div><p class="hint">Vale conferir se o aumento era esperado ou se dá para trocar de plano.</p>`:"";
  if(!A.fixos.length&&!A.parcelas.length&&!A.repetidos.length) return `<div class="card"><h2>Assinaturas e contas fixas</h2>
    <p class="hint">Aqui aparece tudo o que se repete todo mês (aluguel, internet, Netflix, academia...) com o total por mês e por ano. Cadastre como conta fixa e elas entram sozinhas todo mês.</p>
    <button class="btn" type="button" data-novo="fixo">+ Nova conta fixa</button></div>`;
  return `<div class="card assin" id="assinaturas"><div class="cardhead"><h2>Assinaturas e contas fixas</h2><span class="tag">${brl(tot)}/mês</span></div>
  ${subiu}
  <div class="assintot"><div><span class="lab">Por mês</span><b>${brl(A.mes)}</b><small>contas fixas</small></div><div><span class="lab">Por ano</span><b>${brl(A.mes*12)}</b><small>se nada mudar</small></div>${rendaMedia>0?`<div><span class="lab">Da sua renda</span><b>${Math.round(tot/rendaMedia*100)}%</b><small>fixas + parcelas</small></div>`:""}</div>
  ${A.fixos.length?`<div class="subhead">Contas fixas (${A.fixos.length})</div><div>${A.fixos.map(f=>`<button type="button" class="item" data-edit="fixo" data-id="${esc(f.id)}" style="--dot:${catColor(f.cat)}"><span class="pill">dia ${pad2(f.dia)}</span><span class="desc"><b>${esc(f.nome)}</b><small>${esc(catName(f.cat))} · ${brl(f.valor*12)} por ano</small></span><span class="v">${brl(f.valor)}</span></button>`).join("")}</div>`:""}
  ${A.parcelas.length?`<div class="subhead">Parcelas em andamento (${brl(A.mesParc)}/mês)</div><div>${A.parcelas.map(p=>`<button type="button" class="item" data-edit="parcela" data-id="${esc(p.id)}" style="--dot:${catColor(p.cat)}"><span class="pill">${p.idx}/${p.n}</span><span class="desc"><b>${esc(p.desc||"Compra parcelada")}</b><small>${p.idx===p.n?"última parcela":"termina em "+esc(abrMes(p.fim))} · faltam ${brl(p.falta)}</small></span><span class="v">${brl(p.valor)}</span></button>`).join("")}</div>`:""}
  ${A.repetidos.length?`<div class="subhead">Parece que se repete</div><p class="hint">Estes gastos apareceram em quase todos os últimos meses. Se for assinatura, transforme em conta fixa para entrar sozinha.</p>
    <div>${A.repetidos.map((r,i)=>`<div class="item repet" style="--dot:${catColor(r.cat)}"><span class="desc"><b>${esc(r.nome)}</b><small>${r.meses.size} dos últimos 4 meses · média ${brl(r.media)}</small></span><button class="btn ghost mini" type="button" data-virafixo="${i}">Virar conta fixa</button></div>`).join("")}</div>`:""}
  </div>`;
}
function virarFixo(i){
  const r=(ui.repetidos||[])[i]; if(!r) return;
  const id="f"+uidGen(), desde=shiftKey(todayKey,1);
  state.config.fixos.push({id,nome:r.nome,cat:r.cat,valor:r.media,dia:Math.min(31,Math.max(1,r.dia||1)),forma:r.forma||"debito",desde,ate:null,contaId:null});
  save("config"); render();
  toast("“"+r.nome+"” virou conta fixa a partir de "+abrMes(desde)+".","Desfazer",()=>apagarItem("config","fixos",id,"Conta fixa desfeita."));
}

