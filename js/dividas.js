// @ts-check
// Dívidas com pessoas.
"use strict";
const hojeISO=()=>{ const d=new Date(); return d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate()); };
const dataCurta=iso=>iso?iso.slice(8,10)+"/"+iso.slice(5,7)+(iso.slice(0,4)!==String(new Date().getFullYear())?"/"+iso.slice(2,4):""):"";
const pagoDiv=x=>Math.round(x.pags.reduce((a,p)=>a+p.valor,0)*100)/100;
const restaDiv=x=>Math.max(0,Math.round((x.valor-pagoDiv(x))*100)/100);
const quitada=x=>restaDiv(x)<0.005;
function diasAte(iso){ if(!iso) return null; const a=new Date(); a.setHours(0,0,0,0); const [y,m,d]=iso.split("-").map(Number); return Math.round((new Date(y,m-1,d).getTime()-a.getTime())/86400000); }
function cardDividas(){
  const ds=state.config.dividas, abertas=ds.filter(x=>!quitada(x)), q=ds.filter(quitada);
  const rec=abertas.filter(x=>x.tipo==="receber").reduce((a,x)=>a+restaDiv(x),0), pag=abertas.filter(x=>x.tipo==="pagar").reduce((a,x)=>a+restaDiv(x),0);
  const pessoas={}; abertas.forEach(x=>{ const k=norm(x.pessoa); (pessoas[k]=pessoas[k]||{nome:x.pessoa,itens:[],saldo:0}).itens.push(x); pessoas[k].saldo+=x.tipo==="receber"?restaDiv(x):-restaDiv(x); });
  const linha=x=>{ const dd=diasAte(x.venc), atras=dd!=null&&dd<0, r=restaDiv(x);
    return `<button type="button" class="item divrow ${atras?"atras":""}" data-edit="divida" data-id="${esc(x.id)}" style="--dot:${x.tipo==="receber"?"var(--good)":"var(--bad)"}"><span class="pill">${x.tipo==="receber"?"te deve":"você deve"}</span><span class="desc"><b class="${x.desc?"":"empty"}">${esc(x.desc||"sem descrição")}</b><small>${x.pags.length?"pago "+brl(pagoDiv(x))+" de "+brl(x.valor)+" · ":""}${x.venc?(atras?"venceu "+dataCurta(x.venc):dd===0?"vence hoje":"vence "+dataCurta(x.venc)):x.data?"desde "+dataCurta(x.data):""}</small></span><span class="v ${x.tipo==="receber"?"pos":"neg"}">${brl(r)}</span></button>`; };
  return `<div class="card" id="dividas"><div class="cardhead"><h2>Dívidas com pessoas</h2>${abertas.length?`<span class="tag">${abertas.length} em aberto</span>`:""}</div>
  ${ds.length?`<div class="assintot"><div><span class="lab">Te devem</span><b class="pos">${brl(rec)}</b></div><div><span class="lab">Você deve</span><b class="neg">${brl(pag)}</b></div><div><span class="lab">Saldo</span><b class="${rec-pag<0?"neg":""}">${brl(rec-pag)}</b></div></div>`
    :`<p class="hint">Anote quem te deve e para quem você deve: empréstimos, divisão de conta, vaquinha. Registre os pagamentos aos poucos e o app mostra quanto falta.</p>`}
  ${Object.values(pessoas).sort((a,b)=>Math.abs(b.saldo)-Math.abs(a.saldo)).map(pp=>`<div class="subhead pessoa"><span>${esc(pp.nome)}</span><span class="${pp.saldo>=0?"pos":"neg"}">${pp.saldo>=0?"te deve "+brl(pp.saldo):"você deve "+brl(-pp.saldo)}</span></div>${pp.itens.map(linha).join("")}`).join("")}
  ${q.length?`<button class="link" type="button" data-verquit="1">${ui.verQuit?"Esconder":"Ver"} quitadas (${q.length})</button>${ui.verQuit?`<div class="quitadas">${q.map(x=>`<button type="button" class="item" data-edit="divida" data-id="${esc(x.id)}" style="--dot:var(--line)"><span class="pill">quitada</span><span class="desc"><b>${esc(x.pessoa)}${x.desc?" · "+esc(x.desc):""}</b><small>${x.tipo==="receber"?"te devia":"você devia"} ${brl(x.valor)}</small></span><span class="v muted">${brl(x.valor)}</span></button>`).join("")}</div>`:""}`:""}
  <div class="row2"><button class="btn ghost" type="button" data-novo="divida" data-dtipo="receber">+ Alguém me deve</button><button class="btn ghost" type="button" data-novo="divida" data-dtipo="pagar">+ Eu devo</button></div>
  <button class="link" type="button" data-novo="simulador">Simular quitação de uma dívida com juros</button></div>`;
}
const catOutros=()=>(state.config.categorias.find(c=>/outro/.test(norm(c.nome)))||state.config.categorias[state.config.categorias.length-1]||{}).id;
function registrarPagDiv(tudo){
  const x=itemAtual(); if(!x) return;
  const r=restaDiv(x), campo=(document.getElementById("s-pagval")||{}).value||"";
  const v=tudo?r:(campo.trim()?parseMoney(campo):r);
  if(!(v>0)) return erroSheet("Informe quanto foi pago.","s-pagval");
  if(v>r+0.005) return erroSheet("O valor é maior do que falta ("+brl(r)+").","s-pagval");
  const pid=uidGen(); x.pags.push({id:pid,valor:Math.round(v*100)/100,data:hojeISO()});
  const lanca=(document.getElementById("s-paglanca")||{}).checked;
  if(lanca){ const m=getMonth(todayKey), dia=today.getDate();
    if(x.tipo==="receber") m.avulsos.push(marcaPor({id:"dv"+pid,dia,valor:v,desc:"Recebido de "+x.pessoa}));
    else m.gastos.push(marcaPor({id:"dv"+pid,dia,cat:catOutros(),valor:v,desc:"Pago a "+x.pessoa,forma:"pix"}));
    save(todayKey); }
  save("config"); render(); renderSheet();
  toast(quitada(x)?"Dívida quitada!":brl(v)+" registrado. Faltam "+brl(restaDiv(x))+"."+(lanca?" Lançado no mês.":""));
}

