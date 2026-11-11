// @ts-check
// Metas, desafios, conquistas e resumo da semana.
"use strict";
function donut(itens,total,centro,sub,clicavel){
  let acc=0;
  const arcs=total>0?itens.filter(x=>x.v>0).map(x=>{ const p=x.v/total*100, cl=clicavel&&x.id;
    const s=`<circle r="15.915" cx="21" cy="21" fill="none" stroke="${x.cor}" stroke-width="5.2" stroke-dasharray="${p.toFixed(3)} ${(100-p).toFixed(3)}" stroke-dashoffset="${(25-acc).toFixed(3)}"${cl?` class="fatia" data-fatia="${esc(x.id)}" tabindex="0" role="button" aria-label="${esc(x.nome+": "+brl(x.v)+". Ver lançamentos")}"`:""}><title>${esc(x.nome)}: ${brl(x.v)}</title></circle>`; acc+=p; return s; }).join(""):"";
  let a2=0; const marcas=[]; if(total>0) itens.filter(x=>x.v>0).forEach(x=>{ const p=x.v/total*100; marcas.push({x,p,m:a2+p/2}); a2+=p; });
  const top=marcas.slice().sort((a,b)=>b.p-a.p).slice(0,3).filter(z=>z.p>=6);
  const rot=top.map(z=>{ const ang=z.m/100*2*Math.PI, R=52; return `<span class="dlab" style="left:${(50+Math.sin(ang)*R).toFixed(1)}%;top:${(50-Math.cos(ang)*R).toFixed(1)}%;--dot:${z.x.cor}" aria-hidden="true">${esc((w=>w.length>11?w.slice(0,10)+"…":w)(String(z.x.nome).split(/[\s/]+/)[0]))} ${Math.round(z.p)}%</span>`; }).join("");
  return `<div class="donutbox"><svg viewBox="0 0 42 42" class="donut" role="${clicavel?"group":"img"}" aria-label="${esc("Gráfico de rosca, total "+centro+(top.length?": "+marcas.slice().sort((a,b)=>b.p-a.p).slice(0,5).map(z=>z.x.nome+" "+Math.round(z.p)+"%").join(", "):""))}"><circle r="15.915" cx="21" cy="21" fill="none" stroke="var(--sunk)" stroke-width="5.2"/>${arcs}
  <text x="21" y="20.2" text-anchor="middle" class="d1">${esc(centro)}</text><text x="21" y="25" text-anchor="middle" class="d2">${esc(sub)}</text></svg>${rot}</div>`;
}

const isoDe=(k,d)=>k+"-"+pad2(Math.min(diasMes(k),Math.max(1,Number(d)||1)));
const somaDias=(iso,n)=>{ const [y,m,d]=iso.split("-").map(Number), t=new Date(y,m-1,d+n); return keyOf(t.getFullYear(),t.getMonth()+1)+"-"+pad2(t.getDate()); };
const entreDias=(a,b)=>{ const f=x=>{ const [y,m,d]=x.split("-").map(Number); return Date.UTC(y,m-1,d); }; return Math.round((f(b)-f(a))/864e5); };
const fmtIso=x=>x.slice(8,10)+"/"+x.slice(5,7);
function todosGastos(){ const out=[]; Object.keys(state.months).forEach(k=>{ if(!/^\d{4}-\d{2}$/.test(k)) return; ((state.months[k]||{}).gastos||[]).forEach(g=>out.push({g,k,data:isoDe(k,g.dia)})); }); return out; }
const palavrasDes=d=>String(d.palavras||"").split(/[,;]+/).map(x=>semAcento(x).trim()).filter(x=>x.length>=2);
function casaDesafio(d,g){ const ps=palavrasDes(d), desc=semAcento(g.desc); return (!!d.cat&&g.cat===d.cat)||(ps.length>0&&ps.some(p=>desc.includes(p))); }
function estadoDesafio(d,gs){
  gs=gs||todosGastos(); const fim=somaDias(d.inicio,d.dias-1), hj=hojeISO();
  const dentro=gs.filter(x=>x.data>=d.inicio&&x.data<=fim&&casaDesafio(d,x.g)).sort((a,b)=>a.data<b.data?-1:1);
  const total=Math.round(soma(dentro.map(x=>x.g))*100)/100;
  const feitos=hj<d.inicio?0:Math.min(d.dias,entreDias(d.inicio,hj)+1);
  if(d.tipo==="sem"){ if(dentro.length&&dentro[0].data<=hj) return {st:"quebrou",quando:dentro[0].data,total,feitos:Math.max(0,entreDias(d.inicio,dentro[0].data)),fim,pct:Math.max(0,entreDias(d.inicio,dentro[0].data))/d.dias};
    return hj>fim?{st:"ok",total,feitos:d.dias,fim,pct:1}:{st:hj<d.inicio?"espera":"andando",total,feitos,fim,pct:feitos/d.dias}; }
  if(total>d.valor){ let acc=0, quando=null; for(const x of dentro){ acc+=Number(x.g.valor)||0; if(acc>d.valor){ quando=x.data; break; } } return {st:"quebrou",quando,total,feitos,fim,pct:Math.min(1,total/(d.valor||1))}; }
  return hj>fim?{st:"ok",total,feitos:d.dias,fim,pct:1}:{st:hj<d.inicio?"espera":"andando",total,feitos,fim,pct:d.valor?total/d.valor:0,resta:d.valor-total};
}
function textoDesafio(d,e){
  if(e.st==="ok") return d.tipo==="sem"?"Concluído! "+d.dias+" dias sem gastar com isso.":"Concluído! Gastou "+brl(e.total)+" de "+brl(d.valor)+".";
  if(e.st==="quebrou") return d.tipo==="sem"?"Não deu desta vez: gasto em "+fmtIso(e.quando)+", depois de "+e.feitos+" dia"+(e.feitos===1?"":"s")+".":"Passou do limite em "+fmtIso(e.quando)+": "+brl(e.total)+" de "+brl(d.valor)+".";
  if(e.st==="espera") return "Começa em "+fmtIso(d.inicio)+".";
  return d.tipo==="sem"?"Dia "+e.feitos+" de "+d.dias+" · termina em "+fmtIso(e.fim):"Gastou "+brl(e.total)+" de "+brl(d.valor)+" · dia "+e.feitos+" de "+d.dias;
}
function sequencias(gs){
  const dias=new Set(gs.map(x=>x.data)), hj=hojeISO();
  let atual=0, d=dias.has(hj)?hj:somaDias(hj,-1); while(dias.has(d)){ atual++; d=somaDias(d,-1); }
  let melhor=0; const ord=[...dias].filter(x=>x<=hj).sort(); let run=0, ant=null; ord.forEach(x=>{ run=ant&&entreDias(ant,x)===1?run+1:1; ant=x; if(run>melhor) melhor=run; });
  const fechados=MESES.filter(k=>k<todayKey&&ativo(k)&&(calc(k).receitas>0||calc(k).despesas>0));
  let azulAtual=0; for(let i=fechados.length-1;i>=0;i--){ if(calc(fechados[i]).saldo>=0&&(i===fechados.length-1||entre(fechados[i],fechados[i+1])===1)) azulAtual++; else break; }
  let azulMelhor=0, r=0; fechados.forEach((k,i)=>{ r=calc(k).saldo>=0?(i&&entre(fechados[i-1],k)===1?r+1:1):0; if(r>azulMelhor) azulMelhor=r; });
  return {atual,melhor,azulAtual,azulMelhor,fechados};
}
const ICQ={"seta-baixo":'<path d="M12 5v14M6 13l6 6 6-6"/>',"seta-cima":'<path d="M12 19V5M6 11l6-6 6 6"/>',troca:'<path d="M7 7h12l-3-3M17 17H5l3 3"/>',repete:'<path d="M17 4l3 3-3 3"/><path d="M4 12V9a2 2 0 0 1 2-2h14M7 20l-3-3 3-3"/><path d="M20 12v3a2 2 0 0 1-2 2H4"/>',tendencia:'<path d="M4 17l5-5 4 3 7-8"/><path d="M15 7h5v5"/>',engrenagem:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',chev:'<path d="m9 6 6 6-6 6"/>',broto:'<path d="M12 20v-8"/><path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6zM12 14c0-3-2.5-5-6-5 0 3 2.5 5 6 5z"/>',chama:'<path d="M12 21c-4 0-6.5-2.6-6.5-6 0-4 4-6 4.5-10 2.5 1.5 4 4 4 6 1-1 1.5-2 1.5-3 2 1.5 3 4 3 7 0 3.4-2.5 6-6.5 6z"/>',medalha:'<circle cx="12" cy="14" r="5"/><path d="M9 9.5 7 3h4l1 3 1-3h4l-2 6.5"/>',coracao:'<path d="M12 20s-7-4.4-7-9.6A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.4c0 5.2-7 9.6-7 9.6z"/>',nuvem:'<path d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.6 1.5A3.5 3.5 0 0 1 17 18z"/>',sol:'<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',trofeu:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6"/>',alvo:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8"/>',cofre:'<path d="M5 11a7 6 0 0 1 12.5-3.5L20 7v4l-1.5 1A7 6 0 0 1 15 17v2h-3v-1.5h-2V19H7v-2.3A6 6 0 0 1 5 11z"/>',bandeira:'<path d="M6 21V4M6 4h11l-2 4 2 4H6"/>',raio:'<path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12z"/>',estrela:'<path d="m12 4 2.4 5 5.4.7-4 3.7 1 5.4L12 16.3 7.2 18.8l1-5.4-4-3.7 5.4-.7z"/>',balao:'<path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><path d="M8 10h8M8 13h5"/>'};
const icq=(k,px)=>`<svg viewBox="0 0 24 24" width="${px||22}" height="${px||22}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICQ[k]||ICQ.estrela}</svg>`;
const CONQ=[
  {id:"primeiro",ic:"broto",nome:"Primeiro passo",como:"Lance sua primeira despesa."},
  {id:"semana",ic:"chama",nome:"Semana firme",como:"Lance gastos 7 dias seguidos."},
  {id:"mesint",ic:"medalha",nome:"Mês inteiro",como:"Lance gastos 30 dias seguidos."},
  {id:"azul1",ic:"coracao",nome:"No azul",como:"Feche um mês com saldo positivo."},
  {id:"azul3",ic:"nuvem",nome:"Trimestre no azul",como:"Feche 3 meses seguidos no azul."},
  {id:"azul6",ic:"sol",nome:"Semestre no azul",como:"Feche 6 meses seguidos no azul."},
  {id:"azul12",ic:"trofeu",nome:"Ano no azul",como:"Feche 12 meses seguidos no azul."},
  {id:"limite",ic:"alvo",nome:"Dentro do limite",como:"Feche um mês com limites sem estourar nenhum."},
  {id:"poupa",ic:"cofre",nome:"Poupador",como:"Guarde na caixinha 3 meses seguidos."},
  {id:"meta",ic:"bandeira",nome:"Meta batida",como:"Complete uma meta de economia."},
  {id:"desafio",ic:"raio",nome:"Desafiante",como:"Conclua um desafio."},
  {id:"cem",ic:"estrela",nome:"Centena",como:"Chegue a 100 despesas lançadas."}
];
function conquistas(){
  const gs=todosGastos(), sq=sequencias(gs), got={};
  got.primeiro=gs.length>0; got.semana=sq.melhor>=7; got.mesint=sq.melhor>=30; got.cem=gs.length>=100;
  got.azul1=sq.azulMelhor>=1; got.azul3=sq.azulMelhor>=3; got.azul6=sq.azulMelhor>=6; got.azul12=sq.azulMelhor>=12;
  got.limite=sq.fechados.some(k=>{ const c=calc(k), cs=state.config.categorias.filter(ct=>ct.orcamento>0); return cs.length&&c.despesas>0&&cs.every(ct=>(c.porCat[ct.id]||0)<=limiteCat(ct,k)); });
  let r=0, mp=0; MESES.filter(k=>k<=todayKey).forEach(k=>{ r=calc(k).guardado>0?r+1:0; if(r>mp) mp=r; }); got.poupa=mp>=3;
  got.meta=state.config.metas.some(mt=>infoMeta(mt,null).feita);
  got.desafio=(state.config.desafios||[]).some(d=>estadoDesafio(d,gs).st==="ok");
  return {sq,got,gs};
}
const MODELOS_DES={delivery:{nome:"30 dias sem delivery",tipo:"sem",palavras:"ifood, delivery, rappi, aiqfome",dias:30},impulso:{nome:"Semana sem compras",tipo:"sem",icCat:"sacola",dias:7},mercado:{nome:"Mercado no limite",tipo:"max",icCat:"carrinho",dias:30,valor:600},lazer:{nome:"15 dias com lazer contado",tipo:"max",icCat:"taca",dias:15,valor:200}};
function viewMetas(){
  const cf=state.config, cx=caixinhaAte(todayKey);
  return `<div class="pagetitle"><h2>Metas e desafios</h2><p>Guardado na caixinha: <b>${brl(cx)}</b>${cf.metas.length?" · "+cf.metas.length+" meta"+(cf.metas.length===1?"":"s"):""}</p></div>
  <div class="grid"><div class="col">
    <div class="card"><div class="cardhead"><h2>Metas de economia</h2><span class="num muted">${state.config.metas.length||""}</span></div>
    ${state.config.metas.length?`<div class="metas">${state.config.metas.map(mt=>linhaMeta(mt,null,true)).join("")}</div>`:`<div class="vazio">${BARRINHAS}<b>Nenhuma meta ainda</b><p>Crie metas como "Viagem", "Reserva de emergência" ou "Celular novo", com valor e prazo. O app calcula quanto guardar por mês.</p></div>`}
    <button class="btn ghost" data-novo="meta" type="button">+ Nova meta</button></div>
    ${cardRende()}
  </div><div class="col">${cardConquistas()}</div></div>`;
}
function cardConquistas(){
  if(mode==="login"||!state.loaded) return "";
  const {sq,got,gs}=conquistas(), ds=(state.config.desafios||[]).map(d=>({d,e:estadoDesafio(d,gs)}));
  const ativos=ds.filter(x=>x.e.st==="andando"||x.e.st==="espera"), antigos=ds.filter(x=>x.e.st==="ok"||x.e.st==="quebrou").slice(-3).reverse();
  const nGot=CONQ.filter(c=>got[c.id]).length;
  const linhaD=({d,e})=>`<button type="button" class="desafio ${e.st}" data-edit="desafio" data-id="${esc(d.id)}"><div class="t"><b>${esc(d.nome)}</b><span>${e.st==="ok"?"✓":e.st==="quebrou"?"✕":Math.round(e.pct*100)+"%"}</span></div><div class="track ${e.st==="quebrou"?"over":d.tipo==="max"&&e.pct>=0.85?"warn":""}"><div style="width:${Math.min(100,Math.round(e.pct*100))}%"></div></div><small>${esc(textoDesafio(d,e))}</small></button>`;
  return `<div class="card conq"><div class="cardhead"><h2>Conquistas e desafios</h2><span class="num muted">${nGot} de ${CONQ.length}</span></div>
    <div class="streaks"><div><span class="lab">Sequência lançando</span><b><span class="sti">${icq("chama",18)}</span>${sq.atual} dia${sq.atual===1?"":"s"}</b><small>recorde: ${sq.melhor}</small></div><div><span class="lab">Meses no azul seguidos</span><b><span class="sti">${icq("coracao",18)}</span>${sq.azulAtual}</b><small>recorde: ${sq.azulMelhor}</small></div></div>
    <h3>Desafios</h3>
    ${ativos.length?ativos.map(linhaD).join(""):`<div class="vazio">${BARRINHAS}<b>Nenhum desafio ativo</b><p>Desafie você mesmo: "30 dias sem delivery", "semana sem compras" ou um limite para o mercado. O app acompanha sozinho pelos seus lançamentos.</p></div>`}
    ${antigos.length?`<details class="desant"><summary>Anteriores (${antigos.length})</summary>${antigos.map(linhaD).join("")}</details>`:""}
    <button type="button" class="btn ghost" data-novo="desafio">+ Novo desafio</button>
    <h3>Conquistas</h3>
    <div class="conqs">${CONQ.map(c=>`<div class="conqb ${got[c.id]?"on":""}" title="${esc(c.como)}"><span class="bi" aria-hidden="true">${icq(c.ic)}</span><b>${esc(c.nome)}</b><small>${got[c.id]?"conquistada":esc(c.como)}</small></div>`).join("")}</div></div>`;
}
let _conqTimer=null;
function checaConquistas(){
  if(_conqTimer) clearTimeout(_conqTimer);
  _conqTimer=setTimeout(()=>{ _conqTimer=null; if(mode==="login"||!state.loaded||precisaTermos()) return;
    try{ const chave="mb.conq."+(uid||"local")+"."+(aberto||"p"); const raw=localStorage.getItem(chave), visto=raw?JSON.parse(raw):null;
      const {got,gs}=conquistas(), ds=(state.config.desafios||[]).map(d=>/** @type {[Desafio,string]} */([d,estadoDesafio(d,gs).st]));
      const metasF=state.config.metas.filter(mt=>{ try{ return infoMeta(mt,null).feita; }catch(e){ return false; } });
      const ant=shiftKey(todayKey,-1), ini=inicioKey(), cAnt=ini&&ant>=ini?calc(ant):null;
      const agora={c:CONQ.filter(c=>got[c.id]).map(c=>c.id),d:Object.fromEntries(ds.map(([d,st])=>[d.id,st])),m:metasF.map(mt=>mt.id),azul:visto&&visto.azul||""};
      if(visto){ const novas=CONQ.filter(c=>got[c.id]&&!(visto.c||[]).includes(c.id));
        const fins=ds.filter(([d,st])=>(st==="ok"||st==="quebrou")&&(visto.d||{})[d.id]!==st);
        const metaNova=visto.m?metasF.find(mt=>!visto.m.includes(mt.id)):null;
        const azul=cAnt&&cAnt.receitas>0&&cAnt.saldo>0&&visto.azul!==ant;
        if(metaNova) comemora("Meta atingida!","Você completou “"+metaNova.nome+"”. Parabéns!");
        else if(fins.length&&fins[0][1]==="ok") comemora("Desafio concluído!",fins[0][0].nome);
        else if(novas.length) comemora("Conquista desbloqueada!",novas[0].nome+(novas.length>1?" (+"+(novas.length-1)+")":""));
        else if(azul){ comemora("Mês fechado no azul!",nomeMes(ant)+" terminou com sobra de "+brl(cAnt.saldo)+"."); agora.azul=ant; }
        else if(fins.length){ toast("Desafio “"+fins[0][0].nome+"” não deu desta vez. Bora de novo?"); }
        if(cAnt&&!azul) agora.azul=ant; }
      else if(cAnt) agora.azul=ant;
      localStorage.setItem(chave,JSON.stringify(agora)); }catch(e){} },900);
}
/**
 * @param {string} titulo
 * @param {string} texto
 */
function comemora(titulo,texto){
  let el=document.getElementById("festa"); if(el) el.remove();
  el=document.createElement("div"); el.id="festa"; el.setAttribute("role","status"); el.setAttribute("aria-live","assertive");
  const pecas=semMovimento()?"":Array.from({length:36},(_,i)=>{ const a=-Math.PI/2+(Math.random()-.5)*Math.PI*1.3, d=120+Math.random()*170; return `<i class="c${i%4}" style="--dx:${(Math.cos(a)*d).toFixed(0)}px;--dy:${(Math.sin(a)*d).toFixed(0)}px;--r:${Math.round(Math.random()*540)}deg;--t:${(.9+Math.random()*.6).toFixed(2)}s;height:${(6+Math.random()*9).toFixed(0)}px"></i>`; }).join("");
  el.innerHTML=`<div class="festa-box"><span class="festa-conf" aria-hidden="true">${pecas}</span><span class="mbars" aria-hidden="true"><i></i><i></i><i></i></span><b>${esc(titulo)}</b><p>${esc(texto)}</p><button type="button" class="btn" data-festaok="1">Valeu!</button></div>`;
  document.body.appendChild(el); vibra(30);
  const fecha=()=>{ el.classList.add("sai"); setTimeout(()=>el.remove(),300); };
  const t=setTimeout(fecha,6000), tecla=(/** @type {KeyboardEvent} */e)=>{ if(e.key==="Escape"){ fecha(); } };
  el.addEventListener("click",()=>{ clearTimeout(t); fecha(); document.removeEventListener("keydown",tecla); }); document.addEventListener("keydown",tecla,{once:true});
  setTimeout(()=>{ const b=/** @type {HTMLElement|null} */(el.querySelector("[data-festaok]")); if(b) b.focus({preventScroll:true}); },60);
}
const ultimoDomingo=()=>{ const hj=hojeISO(), [y,m,d]=hj.split("-").map(Number), wd=new Date(y,m-1,d).getDay(); return wd===0?hj:somaDias(hj,-wd); };
function resumoSemana(fim,gs){
  gs=gs||todosGastos(); const ini=somaDias(fim,-6), iniA=somaDias(fim,-13), fimA=somaDias(fim,-7);
  const sem=gs.filter(x=>x.data>=ini&&x.data<=fim), ant=gs.filter(x=>x.data>=iniA&&x.data<=fimA);
  const tot=soma(sem.map(x=>x.g)), totA=soma(ant.map(x=>x.g));
  const pc=(arr)=>{ const o={}; arr.forEach(x=>{ o[x.g.cat]=(o[x.g.cat]||0)+(Number(x.g.valor)||0); }); return o; };
  const cs=pc(sem), ca=pc(ant), cats=[...new Set(Object.keys(cs).concat(Object.keys(ca)))].map(id=>({id,v:cs[id]||0,a:ca[id]||0,d:(cs[id]||0)-(ca[id]||0)}));
  const subiu=cats.filter(x=>x.d>0.005).sort((a,b)=>b.d-a.d)[0]||null, top=cats.filter(x=>x.v>0).sort((a,b)=>b.v-a.v).slice(0,4);
  const dias=[...Array(7)].map((_,i)=>{ const d=somaDias(ini,i); return {d,v:soma(sem.filter(x=>x.data===d).map(x=>x.g))}; });
  const maior=sem.slice().sort((a,b)=>(Number(b.g.valor)||0)-(Number(a.g.valor)||0))[0]||null;
  return {ini,fim,tot,totA,n:sem.length,subiu,top,dias,maior,var:totA>0?(tot-totA)/totA:null};
}
function textoVarSemana(r){ if(r.var===null) return r.tot>0?"primeira semana com lançamentos para comparar":"nenhum gasto nas duas semanas"; if(Math.abs(r.var)<0.005) return "igual à semana anterior"; return (r.var>0?"▲ ":"▼ ")+Math.round(Math.abs(r.var)*100)+"% vs semana anterior ("+brl(r.totA)+")"; }
function corpoSemana(fim){
  const r=resumoSemana(fim), max=Math.max(1,...r.dias.map(x=>x.v)), podeAvancar=fim<ultimoDomingo();
  return `<div class="semnav"><button type="button" class="iconbtn" data-semnav="-7" aria-label="Semana anterior">‹</button><b>${fmtIso(r.ini)} a ${fmtIso(r.fim)}</b><button type="button" class="iconbtn" data-semnav="7" aria-label="Próxima semana" ${podeAvancar?"":"disabled"}>›</button></div>
    <div class="semtot"><span class="lab">Gastou na semana</span><b>${brl(r.tot)}</b><small class="${r.var>0.005?"neg":r.var<-0.005?"pos":""}">${esc(textoVarSemana(r))}</small></div>
    <div class="semdias" role="img" aria-label="Gasto por dia da semana">${r.dias.map((x,i)=>`<div class="sd ${x.d===hojeISO()?"hoje":""}"><span class="sv">${x.v?valCurto(x.v):""}</span><i style="height:${Math.round(x.v/max*100)}%"></i><span class="sl">${["S","T","Q","Q","S","S","D"][i]}</span></div>`).join("")}</div>
    ${r.subiu?`<div class="semdest">${icoCat(r.subiu.id,16)}<span><b>${esc(catName(r.subiu.id))}</b> foi o que mais subiu: ${brl(r.subiu.v)} (+${brl(r.subiu.d)} vs semana anterior)</span></div>`:""}
    ${r.top.length?`<h3>Onde mais gastou</h3>${r.top.map(x=>`<div class="semcat">${icoCat(x.id,15)}<span class="t">${esc(catName(x.id))}</span><span class="v">${brl(x.v)}</span><small>${x.a>0?(x.d>=0?"+":"−")+brl(Math.abs(x.d)):"novo"}</small></div>`).join("")}`:`<p class="hint">Nenhuma despesa lançada nesta semana.</p>`}
    ${r.maior?`<p class="hint">${r.n} lançamento${r.n===1?"":"s"} · maior: ${brl(r.maior.g.valor)}${r.maior.g.desc?" ("+esc(r.maior.g.desc)+")":" em "+esc(catName(r.maior.g.cat))} no dia ${fmtIso(r.maior.data)}</p>`:""}`;
}
function avisoSemana(){
  if(mode==="login"||!state.loaded) return null;
  const hj=hojeISO(), [y,m,d]=hj.split("-").map(Number), wd=new Date(y,m-1,d).getDay(); if(!(wd===0||wd===1||wd===2)) return null;
  const r=resumoSemana(ultimoDomingo()); if(!(r.tot>0||r.totA>0)) return null; return r;
}
