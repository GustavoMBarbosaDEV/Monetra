// @ts-check
// Dia do salário, fases do mês e card do salário.
"use strict";
const FERIADOS=["01-01","04-21","05-01","09-07","10-12","11-02","11-15","11-20","12-25"];
const cfgSal=()=>Object.assign({tipo:"util",dia:5,dia2:20,off:false},state.config.salarioDia||{});
function diaUtil(k,n){ const dim=diasMes(k); let c=0;
  for(let d=1;d<=dim;d++){ const w=new Date(kY(k),kM(k)-1,d).getDay(); if(w===0||w===6||FERIADOS.includes(pad2(kM(k))+"-"+pad2(d))) continue; if(++c>=n) return d; }
  return dim; }
function diasSalario(k){ const s=cfgSal(), dim=diasMes(k);
  if(s.tipo==="fixo") return [Math.min(s.dia,dim)];
  if(s.tipo==="quinz") return [Math.min(s.dia,dim),Math.min(s.dia2,dim)];
  return [diaUtil(k,s.dia)]; }
const salRecebido=k=>((state.months[k]||{}).avulsos||[]).filter(x=>x.sal);
function faseSalario(k){
  if(mode==="login"||!state.loaded||k!==todayKey||!ativo(k)||cfgSal().off||!(state.config.salarioPadrao>0)) return null;
  if(salRecebido(k).length) return "recebido";
  return typeof (state.months[k]||{}).salario==="number"?null:"espera";
}
function avisoSalario(){
  const k=todayKey, f=faseSalario(k), hoje=today.getDate(), ds=diasSalario(k);
  if(f==="espera") return hoje>=ds[0]?{parte:1}:null;
  if(f!=="recebido") return null;
  const r=salRecebido(k), u=r[r.length-1];
  if(!u.falta) return null;
  return hoje>=(ds.length>1?ds[1]:u.dia+1)?{parte:2}:null;
}
function contasSalario(k){
  const dim=diasMes(k), m=state.months[k], hoje=today.getDate(), out=[];
  fixosDoMes(k).filter(f=>!f.pular).forEach(f=>out.push({tipo:"fixo",id:f.id,nome:f.desc,valor:f.valor,dia:f.dia,pago:f.pago}));
  parcelasDoMes(k).filter(p=>!p.cartao).forEach(p=>out.push({tipo:"parc",id:p.id,nome:(p.desc||"Parcela")+" ("+p.idx+"/"+p.n+")",valor:p.valor,dia:p.dia,pago:p.pago}));
  cartoesOk().forEach(cc=>{ const t=soma(faturaDoMes(k,cc.id)); if(t>0) out.push({tipo:"fat",id:cc.id,nome:"Fatura "+cc.nome,valor:t,dia:Math.min(cc.vence,dim),pago:faturaPaga(m,cc.id)}); });
  (state.config.dividas||[]).filter(x=>x.tipo==="pagar"&&!quitada(x)&&x.venc&&x.venc.slice(0,7)<=k).forEach(x=>out.push({tipo:"div",id:x.id,nome:"Dívida com "+x.pessoa,valor:restaDiv(x),dia:x.venc.slice(0,7)<k?0:Number(x.venc.slice(8,10)),pago:false,div:true}));
  return out.map(x=>Object.assign(x,{dd:x.dia?x.dia-hoje:-1})).sort((a,b)=>Number(a.pago)-Number(b.pago)||a.dia-b.dia);
}
function linhaContaSal(x,k){
  const cls=x.pago?"pago":x.dd<0?"atraso":x.dd<=3?"breve":"";
  const quando=x.pago?"paga":x.dd<0?(x.dia?"venceu dia "+pad2(x.dia):"atrasada"):x.dd===0?"vence hoje":x.dd===1?"vence amanhã":x.dd<=3?"vence em "+x.dd+" dias":"vence dia "+pad2(x.dia);
  const acao=x.div?`<button class="btn ghost mini" type="button" data-edit="divida" data-id="${esc(x.id)}">Ver</button>`
    :`<button class="btn ${x.pago?"ghost ":""}mini" type="button" data-pagar="${esc(x.tipo+"|"+x.id+"|"+k)}" aria-label="${esc((x.pago?"Marcar como não paga: ":"Paguei: ")+x.nome)}">${x.pago?"Desfazer":"Paguei"}</button>`;
  return `<div class="aviso csal ${cls}"><span class="t"><b>${esc(x.nome)}</b><small>${esc(quando)}</small></span><span class="v num">${brl(x.valor)}</span>${acao}</div>`;
}
function heroSalario(k,fase,olho){
  const mesN=NOMES[kM(k)-1].toLowerCase(), cs=contasSalario(k), pend=cs.filter(x=>!x.pago), aPagar=soma(pend), hoje=today.getDate();
  const auras=`<i class="hs-aura" aria-hidden="true"></i><i class="hs-aura b2" aria-hidden="true"></i>`;
  if(fase==="espera"){
    const d0=diasSalario(k)[0], prev=hoje<d0?"previsto para o dia "+pad2(d0):hoje===d0?"previsto para hoje":"previsto desde o dia "+pad2(d0);
    const pago=soma(cs.filter(x=>x.pago)), antes=soma(((state.months[k]||{}).gastos||[]).filter(g=>!noCartao(g)));
    return `<div class="heroSaldo hsal espera ${hoje>d0?"sd-warn":"sd-ok"}">${auras}
    <div class="hs-top"><span class="hs-lab"><span class="lab">Aguardando salário</span>${olho}</span><span class="hs-dir"><span class="hs-selo"><i></i>${esc(prev)}</span></span></div>
    <b class="hs-val" data-v="${aPagar}">${valorGrande(aPagar)}</b>
    <div class="hs-sub">${aPagar>0?"para pagar em "+esc(mesN):"nada para pagar em "+esc(mesN)}${pago>0?` · já pago <b>${brl(pago)}</b>`:""}</div>
    ${antes>0?`<div class="hs-sub">Você já gastou <b>${brl(antes)}</b> antes do salário. Isso sai do saldo quando ele cair.</div>`:""}
    <button type="button" class="btn salcaiu" data-salcaiu="1">${ICON.dinheiro}Meu salário caiu</button>
  </div>`;
  }
  const r=salRecebido(k), u=r[r.length-1], acum=acumulado(k);
  const livre=Math.round((acum-soma(pend.filter(x=>x.div)))*100)/100, conta=Math.round((acum+soma(pend.filter(x=>!x.div)))*100)/100;
  // quanto dá para gastar por dia: saldo livre (já sem as contas que faltam) dividido pelos dias que restam
  const restam=k===todayKey?diasMes(k)-today.getDate()+1:diasMes(k), porDia=k>=todayKey&&livre>0?Math.floor(livre/restam*100)/100:null;
  const diasRest=k===todayKey?(restam===1?"último dia do mês":restam+" dias, contando hoje"):"dividido pelos "+restam+" dias";
  return `<div class="heroSaldo hsal ${conta<0?"neg sd-bad":livre<0?"sd-warn":"sd-ok"}">${auras}
    <div class="hs-top"><span class="hs-lab"><span class="lab">Saldo em conta</span>${olho}</span><span class="hs-dir"><span class="hs-selo"><i></i>${u.falta?"falta uma parte":"salário recebido"}</span></span></div>
    <b class="hs-val" data-v="${conta}">${valorGrande(conta)}</b>
    <div class="hs-sub">${r.length>1?"Salário de <b>"+brl(soma(r))+"</b> em "+r.length+" partes":"Salário de <b>"+brl(u.valor)+"</b> caiu dia "+pad2(u.dia)} · <button type="button" class="link" data-edit="avulso" data-id="${esc(u.id)}">Editar</button> · <button type="button" class="link" data-saldesfaz="1">Desfazer</button></div>
    ${porDia!==null&&aPagar>0?`<div class="hs-sub">Dá para gastar <b>${brl(porDia)}</b> por dia ${k===todayKey?"até o fim do mês":"neste mês"}.</div>`:""}
    <div class="hs-duo">${aPagar>0?`<div class="hs-mini"><span class="lab">Falta pagar</span><b data-v="${aPagar}">${valorGrande(aPagar)}</b></div>`:porDia!==null?`<div class="hs-mini"><span class="lab">Por dia</span><b data-v="${porDia}">${valorGrande(porDia)}</b><small>${esc(diasRest)}</small></div>`:""}<div class="hs-mini"><span class="lab">Saldo livre</span><b class="${livre<0?"neg":""}" data-v="${livre}">${valorGrande(livre)}</b></div></div>
    ${u.falta?`<button type="button" class="btn salcaiu" data-salcaiu="1">${ICON.dinheiro}A outra parte caiu</button>`:""}
  </div>`;
}
function cardContasSal(k,fase){
  const mesN=NOMES[kM(k)-1].toLowerCase(), cs=contasSalario(k), lista=fase==="espera"?cs:cs.filter(x=>!x.pago);
  if(fase==="recebido"&&!lista.length) return ""; // tudo pago: o card "Falta pagar" sai da tela
  const vazio=fase==="espera"?`<p class="hint">Nenhuma conta para ${esc(mesN)}. Cadastre contas fixas, parcelas e cartões em Ajustes para ver aqui o que pagar.</p>`:`<p class="hint">Tudo pago em ${esc(mesN)}. O saldo livre é seu.</p>`;
  return `<div class="card csalcard"><div class="cardhead"><h2>${fase==="espera"?"Contas de "+esc(mesN):"Falta pagar"}</h2><span class="num muted">${brl(soma(cs.filter(x=>!x.pago)))}</span></div>
    ${lista.length?`<div>${lista.map(x=>linhaContaSal(x,k)).join("")}</div>`:vazio}
    ${fase==="recebido"?`<p class="hint">Saldo livre é o saldo em conta menos o que ainda falta pagar no mês.</p>`:""}</div>`;
}
function desfazSal(k){
  const m=getMonth(k), tirados=m.avulsos.filter(x=>x.sal), antes=m.salario; if(!tirados.length) return;
  m.avulsos=m.avulsos.filter(x=>!x.sal); tirados.forEach(x=>marcaApagado(k,x.id)); m.salario=null; save(k); render();
  toast("Salário desfeito.","Refazer",()=>{ const a=getMonth(k); tirados.forEach(x=>{ desmarcaApagado(k,x.id); if(!a.avulsos.some(y=>y.id===x.id)) a.avulsos.push(x); }); a.salario=antes; save(k); render(); toast("Salário de volta."); });
}
