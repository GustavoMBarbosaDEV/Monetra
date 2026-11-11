// @ts-check
// Simulador de quitação, 13º, férias e salário líquido.
"use strict";
function simulaQuitacao(saldo,taxa,pag){
  const r=taxa/100; let b=saldo, juros=0, m=0; const serie=[saldo];
  if(!(saldo>0)||!(pag>0)) return null;
  if(r>0&&pag<=Math.round(saldo*r*100)/100+0.004) return {nunca:true,jurosMes:Math.round(saldo*r*100)/100};
  while(b>0.5&&m<600){ const j=Math.round(b*r*100)/100; juros+=j; b=Math.round((b+j-pag)*100)/100; m++; serie.push(Math.max(0,b)); }
  const ultimo=Math.round((pag+Math.min(0,b))*100)/100;
  return {meses:m,juros:Math.round(juros*100)/100,total:Math.round((saldo+juros)*100)/100,ultimo,serie,longo:m>=600};
}
const saldoPorParcelas=(taxa,n,pmt)=>{ const r=taxa/100; return r>0?pmt*(1-Math.pow(1+r,-n))/r:pmt*n; };
const nMeses=m=>m+(m===1?" mês":" meses");
const fmtMeses=m=>m<12?nMeses(m):Math.floor(m/12)+" ano"+(m>=24?"s":"")+(m%12?" e "+nMeses(m%12):"");
const mesDaqui=m=>nomeMes(shiftKey(todayKey,m-1)).toLowerCase();
function graficoSim(a,b){
  const W=320,H=120, n=Math.max(a.serie.length,b?b.serie.length:0), mx=Math.max(...a.serie,1);
  const pts=sr=>sr.map((v,i)=>`${(i/(n-1||1)*W).toFixed(1)},${(H-v/mx*H).toFixed(1)}`).join(" ");
  return `<svg class="simgraf" viewBox="0 -4 ${W} ${H+8}" preserveAspectRatio="none" role="img" aria-label="Saldo devedor ao longo dos meses"><polyline class="ga" points="${pts(a.serie)}"/>${b?`<polyline class="gb" points="${pts(b.serie)}"/>`:""}</svg>
    <div class="simleg"><span><i class="la"></i>pagando só o atual</span>${b?`<span><i class="lb"></i>com o valor extra</span>`:""}</div>`;
}
function resultadoSim(){
  const v=id=>parseMoney((document.getElementById(id)||{}).value||""), num=id=>{ const t=String((document.getElementById(id)||{}).value||"").replace(",","."); return Number(t)||0; };
  let saldo=v("s-simsaldo"); const taxa=num("s-simtaxa"), pag=v("s-simpag"), extra=v("s-simextra")||0, nP=Math.round(num("s-simn"));
  if(!(saldo>0)&&nP>0&&pag>0){ saldo=Math.round(saldoPorParcelas(taxa,nP,pag)*100)/100; const sl=document.getElementById("s-simsaldoinfo"); if(sl) sl.textContent="Saldo estimado pelas parcelas: "+brl(saldo); }
  else { const sl=document.getElementById("s-simsaldoinfo"); if(sl) sl.textContent=""; }
  if(!(saldo>0)||!(pag>0)) return `<p class="hint">Preencha quanto deve, os juros ao mês e quanto paga por mês para ver em quanto tempo quita.</p>`;
  const a=simulaQuitacao(saldo,taxa,pag), b=extra>0?simulaQuitacao(saldo,taxa,pag+extra):null;
  if(a.nunca&&!(b&&!b.nunca)) return `<div class="simalerta">Com ${brl(pag)} por mês a dívida <b>nunca acaba</b>: só os juros do mês dão ${brl(a.jurosMes)}. Pague mais que isso para o saldo começar a cair.</div>`;
  const bloco=(t,x,cls)=>x.nunca?`<div class="simcol ${cls}"><span class="lab">${t}</span><b>Nunca quita</b><small>juros de ${brl(x.jurosMes)}/mês comem a parcela</small></div>`:`<div class="simcol ${cls}"><span class="lab">${t}</span><b>${fmtMeses(x.meses)}</b><small>quita em ${esc(mesDaqui(x.meses))}${x.longo?" (ou mais)":""}</small><small>juros: <b>${brl(x.juros)}</b> · total: ${brl(x.total)}</small></div>`;
  let eco="";
  if(b&&!b.nunca){ eco=a.nunca?`<div class="simeco">Com ${brl(extra)} a mais por mês, a dívida passa a ter fim: quita em <b>${fmtMeses(b.meses)}</b>.</div>`:`<div class="simeco">Pagando ${brl(extra)} a mais por mês você quita <b>${fmtMeses(a.meses-b.meses)} antes</b> e economiza <b>${brl(Math.max(0,a.juros-b.juros))}</b> de juros.</div>`; }
  return `<div class="simres">${bloco("Pagando "+brl(pag)+"/mês",a,"a")}${b?bloco("Com "+brl(pag+extra)+"/mês",b,"b"):""}</div>${eco}${a.nunca?"":graficoSim(a,b&&!b.nunca?b:null)}
    <p class="hint">Conta simples com juros compostos sobre o saldo, mês a mês (sem IOF, multas ou seguros). Use a taxa que aparece na fatura ou no contrato.</p>`;
}
function atualizaSim(){ const el=document.getElementById("s-simres"); if(el) el.innerHTML=resultadoSim(); }
const TAB={ano:2026,
  inss:[[1621.00,0.075],[2902.84,0.09],[4354.27,0.12],[8475.55,0.14]],
  ir:[[2428.80,0,0],[2826.65,0.075,182.16],[3751.05,0.15,394.16],[4664.68,0.225,675.49],[Infinity,0.275,908.73]],
  dep:189.59, simplificado:607.20, isento:5000, redLim:7350, redA:978.62, redB:0.133145 };
const c2=v=>Math.round(v*100)/100;
function inssDe(v){ let ant=0, t=0; for(const [teto,al] of TAB.inss){ if(v<=ant) break; t+=(Math.min(v,teto)-ant)*al; ant=teto; } return c2(t); }
function irDe(bruto,inss,deps){
  const base=Math.max(0,bruto-Math.max(inss+deps*TAB.dep,TAB.simplificado)), f=TAB.ir.find(x=>base<=x[0]);
  let imp=Math.max(0,base*f[1]-f[2]);
  if(bruto<=TAB.isento) imp=0; else if(bruto<=TAB.redLim) imp=Math.max(0,imp-(TAB.redA-TAB.redB*bruto));
  return {imp:c2(imp),base:c2(base),simpl:TAB.simplificado>inss+deps*TAB.dep};
}
function calcRes(tipo){
  const v=id=>parseMoney((document.getElementById(id)||{}).value||"")||0, n=id=>Number(String((document.getElementById(id)||{}).value||"").replace(",","."))||0;
  const L=(r,x,cls)=>`<div class="cl ${cls||""}"><span>${r}</span><b>${x}</b></div>`;
  const nota=`<p class="hint">Estimativa com as tabelas de ${TAB.ano} do INSS e do Imposto de Renda (com a isenção até R$ 5.000 e a redução até R$ 7.350). Pensão, plano de saúde e outros descontos da empresa não entram. Confira no holerite.</p>`;
  if(tipo==="liquido"){ const sal=v("s-csal"), deps=Math.max(0,Math.round(n("s-cdep"))), out=v("s-cout"); if(!(sal>0)) return `<p class="hint">Informe o salário bruto.</p>`;
    const i=inssDe(sal), r=irDe(sal,i,deps), liq=c2(sal-i-r.imp-out);
    return `<div class="calcbox">${L("Salário bruto",brl(sal))}${L("INSS","− "+brl(i))}${L("Imposto de Renda"+(r.simpl&&r.imp>0?" (desconto simplificado)":r.imp===0&&sal>TAB.ir[0][0]?" (isento até R$ 5.000)":""),"− "+brl(r.imp))}${out?L("Outros descontos","− "+brl(out)):""}${L("Salário líquido",brl(liq),"tot")}</div>${nota}`; }
  if(tipo==="decimo"){ const sal=v("s-csal"), meses=Math.min(12,Math.max(1,Math.round(n("s-cmeses")||12))), deps=Math.max(0,Math.round(n("s-cdep"))); if(!(sal>0)) return `<p class="hint">Informe o salário bruto.</p>`;
    const tot=c2(sal*meses/12), p1=c2(tot/2), i=inssDe(tot), r=irDe(tot,i,deps), p2=c2(tot-p1-i-r.imp);
    return `<div class="calcbox">${L("13º bruto ("+meses+"/12)",brl(tot))}${L("1ª parcela (até 30/11, sem descontos)",brl(p1),"dest")}${L("INSS sobre o 13º","− "+brl(i))}${L("Imposto de Renda sobre o 13º","− "+brl(r.imp))}${L("2ª parcela (até 20/12)",brl(p2),"dest")}${L("13º líquido total",brl(c2(p1+p2)),"tot")}</div>${nota}`; }
  if(tipo==="ferias"){ const sal=v("s-csal"), deps=Math.max(0,Math.round(n("s-cdep"))), vende=!!(document.getElementById("s-cvende")||{}).checked; let dias=Math.round(n("s-cdias")||30); dias=Math.min(vende?20:30,Math.max(5,dias)); if(!(sal>0)) return `<p class="hint">Informe o salário bruto.</p>`;
    const fer=c2(sal/30*dias), terco=c2(fer/3), bruto=c2(fer+terco), i=inssDe(bruto), r=irDe(bruto,i,deps), abono=vende?c2(sal/30*10*4/3):0, liq=c2(bruto-i-r.imp+abono);
    return `<div class="calcbox">${L(dias+" dias de férias",brl(fer))}${L("1/3 constitucional",brl(terco))}${L("INSS","− "+brl(i))}${L("Imposto de Renda","− "+brl(r.imp))}${vende?L("Venda de 10 dias + 1/3 (sem desconto)",brl(abono)):""}${L("Você recebe",brl(liq),"tot")}</div><p class="hint">Pago até 2 dias antes de começar as férias. No mês seguinte o salário vem menor, porque os dias de férias já foram pagos.</p>${nota}`; }
  if(tipo==="guardar"){ const alvo=v("s-calvo"), tem=v("s-ctem"), meses=Math.max(1,Math.round(n("s-cprazo"))), taxa=n("s-crend")/100; if(!(alvo>0)||!(n("s-cprazo")>0)) return `<p class="hint">Informe quanto custa e em quantos meses quer comprar.</p>`;
    const fv=alvo-tem*Math.pow(1+taxa,meses); if(fv<=0) return `<div class="calcbox">${L("Você já tem o suficiente","✓","tot")}</div><p class="hint">Com o que já guardou${taxa?" e o rendimento":""}, chega lá sem guardar mais nada.</p>`;
    const pmt=c2(taxa>0?fv*taxa/(Math.pow(1+taxa,meses)-1):fv/meses), aportes=c2(pmt*meses), rend=c2(alvo-tem-aportes);
    return `<div class="calcbox">${L("Guarde por mês",brl(pmt),"tot")}${L("Você vai depositar",brl(aportes))}${taxa>0?L("O rendimento completa",brl(Math.max(0,rend))):""}${L("Pronto em",esc(nomeMes(shiftKey(todayKey,meses)).toLowerCase()))}</div>
      <button class="btn ghost" type="button" data-calcmeta="1">Criar meta de economia com esses valores</button><p class="hint">Rendimento opcional: use o da sua aplicação (ex.: poupança ou CDB). Sem rendimento, a conta é só dividir.</p>`; }
  return "";
}
function corpoCalc(tipo){
  const sal=state.config.salarioPadrao>0?moneyInput(state.config.salarioPadrao):"";
  const campoSal=`<label class="f money">Salário bruto (CLT)<input class="in num" id="s-csal" inputmode="numeric" placeholder="0,00" value="${sal}"></label>`;
  const campoDep=`<label class="f">Dependentes no IR<input class="in num" id="s-cdep" type="number" min="0" max="20" value="0" inputmode="numeric"></label>`;
  const abas=`<div class="seg calcabas" role="tablist">${[["decimo","13º"],["ferias","Férias"],["liquido","Salário líquido"],["guardar","Quanto guardar"]].map(([k,l])=>`<button type="button" role="tab" aria-selected="${k===tipo}" data-calctipo="${k}">${l}</button>`).join("")}</div>`;
  let f="";
  if(tipo==="decimo") f=`${campoSal}<div class="row"><label class="f">Meses trabalhados no ano<input class="in num" id="s-cmeses" type="number" min="1" max="12" value="12" inputmode="numeric"></label>${campoDep}</div><p class="hint">Conta 1 mês para cada mês com 15 dias ou mais de trabalho.</p>`;
  if(tipo==="ferias") f=`${campoSal}<div class="row"><label class="f">Dias de férias<input class="in num" id="s-cdias" type="number" min="5" max="30" value="30" inputmode="numeric"></label>${campoDep}</div><label class="switch"><input type="checkbox" id="s-cvende"><span></span>Vender 10 dias (abono)</label>`;
  if(tipo==="liquido") f=`${campoSal}<div class="row">${campoDep}<label class="f money">Outros descontos (opcional)<input class="in num" id="s-cout" inputmode="numeric" placeholder="0,00"></label></div>`;
  if(tipo==="guardar") f=`<label class="f">O que quer comprar<input class="in" id="s-cnome" maxlength="40" placeholder="ex.: celular novo, viagem"></label><div class="row"><label class="f money">Quanto custa<input class="in num" id="s-calvo" inputmode="numeric" placeholder="0,00"></label><label class="f money">Já tenho guardado<input class="in num" id="s-ctem" inputmode="numeric" placeholder="0,00"></label></div><div class="row"><label class="f">Em quantos meses<input class="in num" id="s-cprazo" type="number" min="1" max="360" inputmode="numeric" placeholder="ex.: 10"></label><label class="f">Rendimento ao mês (%)<input class="in num" id="s-crend" inputmode="decimal" placeholder="opcional, ex.: 0,8" maxlength="5"></label></div>`;
  setTimeout(atualizaCalc,0);
  return abas+f+`<div id="s-calcres"></div>`;
}
function atualizaCalc(){ const el=document.getElementById("s-calcres"); if(el&&ui.sheet) el.innerHTML=calcRes(ui.sheet.calc||"decimo"); }
