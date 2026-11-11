// @ts-check
// Sininho de avisos, notificações e lembretes no calendário.
"use strict";
function avisos(){
  if(mode==="login"||!state.loaded) return {itens:[],n:0};
  /** @type {any[]} */
  const itens=[];
  Object.keys(pedidosG||{}).forEach(g=>(pedidosG[g]||[]).forEach(p=>itens.push({tipo:"pedido",g,p})));
  pendencias().forEach(x=>itens.push({tipo:"conta",x}));
  alertasOrcamento(todayKey).forEach(a=>itens.push({tipo:"orc",a}));
  const bkL=lembreteBackup(); if(bkL&&bkL.local) itens.push({tipo:"backup",b:bkL});
  (state.config.dividas||[]).filter(x=>!quitada(x)&&x.venc&&diasAte(x.venc)<=1).forEach(x=>itens.push({tipo:"divida",x}));
  const salA=avisoSalario(); if(salA) itens.unshift({tipo:"salario",parte:salA.parte});
  const n=itens.length;
  let rep=[]; try{ rep=assinaturas().repetidos; }catch(e){}
  rep.forEach(r=>itens.push({tipo:"dica",r}));
  try{ aumentos().forEach(a=>itens.push({tipo:"aumento",a})); }catch(e){}
  if(bkL&&!bkL.local) itens.push({tipo:"backup",b:bkL});
  const rs=avisoSemana(); if(rs) itens.push({tipo:"semana",r:rs});
  const mesAt=kM(todayKey), anoR=mesAt===12?kY(todayKey):mesAt===1?kY(todayKey)-1:null;
  if(anoR&&anosRetro().includes(anoR)) itens.push({tipo:"retro",ano:anoR});
  if(pedeAvaliacao()) itens.push({tipo:"avaliar"});
  return {itens,n};
}
function pedeAvaliacao(){
  if(!linkContato("x")||mode==="login"||!state.loaded||nLancamentos()<30) return false;
  const i=inicioKey(); if(!i||entre(i,todayKey)<1) return false;
  try{ const v=Number(localStorage.getItem("mb.avaliar")||0); return v!==1&&Date.now()>v; }catch(e){ return false; }
}
function botaoSino(){
  const n=avisos().n;
  return `<button type="button" class="iconbtn sino" data-avisos="1" aria-label="Notificações${n?": "+n+" nova"+(n===1?"":"s"):""}" title="Notificações">${ICON.sino}${n?`<i class="badge">${n>9?"9+":n}</i>`:""}</button>`;
}
function listaAvisos(){
  const {itens}=avisos();
  if(!itens.length) return `<div class="avisovazio">${ICON.sino}<b>Tudo em dia</b><span>Nenhuma conta vencendo, nenhum limite estourado e nenhum pedido esperando.</span></div>`;
  const linha=(cls,ic,titulo,sub,acao)=>`<div class="aviso ${cls}"><span class="ic">${ic}</span><span class="t"><b>${titulo}</b><small>${sub}</small></span>${acao||""}</div>`;
  const grupos={pedido:[],conta:[],orc:[],dica:[]};
  itens.forEach(it=>{
    if(it.tipo==="salario") grupos.conta.push(linha("pedido",icq("seta-cima",18),it.parte===2?"A outra parte do salário caiu?":"Seu salário caiu?","Toque para confirmar e ver o saldo do mês",`<button class="btn mini" type="button" data-avsal="1">Confirmar</button>`));
    if(it.tipo==="pedido"){ const nome=((eu.grupos||{})[it.g]||{}).nome||""; grupos.pedido.push(linha("pedido",ICON.grupo,esc(primeiroNome(it.p.nome))+" quer entrar em “"+esc(nome)+"”",esc(it.p.email||"e-mail não confirmado"),`<button class="btn mini" type="button" data-avgrupo="${esc(it.g)}">Ver pedido</button>`)); }
    if(it.tipo==="conta"){ const x=it.x, e=estadoPend(x); grupos.conta.push(linha("pagar "+e.cls,x.dd<0?ICON_ALERTA:ICON_RELOGIO,esc(x.nome)+" · "+brl(x.valor),esc(e.txt)+(x.dd>=0?" · "+fmtData(x.data):""),`<button class="btn mini" type="button" data-avpagar="${x.tipo}|${esc(x.id)}|${x.k}">Paguei</button>`)); }
    if(it.tipo==="divida"){ const x=it.x, dd=diasAte(x.venc), cls=dd<0?"atraso":dd===0?"hoje":"amanha";
      grupos.conta.push(linha("pagar "+cls,ICON.grupo,x.tipo==="receber"?esc(x.pessoa)+" te deve "+brl(restaDiv(x)):"Você deve "+brl(restaDiv(x))+" a "+esc(x.pessoa),dd<0?"combinado para "+dataCurta(x.venc)+" (passou)":dd===0?"combinado para hoje":"combinado para amanhã",`<button class="btn ghost mini" type="button" data-avdiv="${esc(x.id)}">Ver</button>`)); }
    if(it.tipo==="orc"){ const a=it.a; grupos.orc.push(linha("orc "+(a.nivel==="passou"?"atraso":"amanha"),`<i class="bola" style="background:${catColor(a.id)}"></i>`,esc(textoAlerta(a)),"limite de "+brl(a.o)+" em "+esc(abrMes(todayKey)),`<button class="btn ghost mini" type="button" data-avmes="1">Ver mês</button>`)); }
    if(it.tipo==="backup"){ const b=it.b; (b.local?grupos.conta:grupos.dica).push(linha(b.local?"pagar amanha":"dica",ICON.check,"Hora de fazer um backup",(b.dias===null?"Você ainda não baixou nenhum backup":"Último backup há "+b.dias+" dias")+(b.local?" · sem login, seus dados ficam só neste aparelho":" · uma cópia sua, além da nuvem"),`<span class="bkbtns"><button class="btn mini" type="button" data-avbackup="1">Baixar</button><button class="btn ghost mini" type="button" data-avbackupdepois="1">Depois</button></span>`)); }
    if(it.tipo==="semana"){ const r=it.r; grupos.dica.push(linha("pedido",ICON.ano||ICON.mais,"Sua semana: "+brl(r.tot),esc(textoVarSemana(r))+(r.subiu?" · mais subiu: "+esc(catName(r.subiu.id)):""),`<button class="btn mini" type="button" data-avsemana="${r.fim}">Ver</button>`)); }
    if(it.tipo==="avaliar") grupos.dica.push(linha("dica",ICON.mais,"Está gostando do Monetra?","Conte em uma frase como está sendo. Com sua permissão, ela pode aparecer no site.",`<span class="bkbtns"><a class="btn mini" href="${esc(linkContato("Minha avaliação do Monetra: "))}" target="_blank" rel="noopener" data-avaliar="1">Avaliar</a><button class="btn ghost mini" type="button" data-avaliar="0">Agora não</button></span>`));
    if(it.tipo==="retro") grupos.dica.push(linha("pedido",ICON.ano||ICON.mais,"Sua retrospectiva de "+it.ano+" está pronta","quanto entrou, saiu e seus recordes do ano",`<button class="btn mini" type="button" data-avretro="${it.ano}">Ver</button>`));
    if(it.tipo==="dica"){ const r=it.r; grupos.dica.push(linha("dica",ICON.mais,"“"+esc(r.nome)+"” parece uma assinatura",r.meses.size+" dos últimos 4 meses · média "+brl(r.media),`<button class="btn ghost mini" type="button" data-avassin="1">Ver</button>`)); }
    if(it.tipo==="aumento"){ const a=it.a; grupos.dica.push(linha("dica",ICON_ALERTA,"“"+esc(a.nome)+"” ficou "+esc(pctTxt(a.p*100))+" mais caro","de "+brl(a.de)+" para "+brl(a.para),`<button class="btn ghost mini" type="button" data-avassin="1">Ver</button>`)); }
  });
  const bloco=(t,arr)=>arr.length?`<div class="subhead">${t}</div>${arr.join("")}`:"";
  return bloco("Pedidos para entrar",grupos.pedido)+bloco(grupos.conta.some(x=>x.includes("data-avbackup"))&&grupos.conta.length===1?"Seus dados":"Contas e dívidas",grupos.conta)+bloco("Limites do mês",grupos.orc)+bloco("Dicas",grupos.dica)
    +(notifOn?"":`<p class="hint">Quer receber esses avisos mesmo com o app fechado? <button class="link" type="button" data-avperfil="1">Ative as notificações no Perfil</button>.</p>`);
}
function pagarPend(spec){ const [t,id,k]=spec.split("|"); let atual=false; const m=getMonth(k);
  if(t==="fat") atual=faturaPaga(m,id); else atual=!!((m[t==="fixo"?"fixos":"parcelas"][id]||{}).pago);
  marcaPago(t,id,k,!atual); }

let notifOn=false; try{ notifOn=localStorage.getItem("mb.notif")==="1"; }catch(e){}
let ultimaVerif=0;
async function mostraNotif(titulo,corpo,tag){
  try{ const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();
    const op={body:corpo,tag,icon:"icons/icon-192.png",badge:"icons/icon-192.png",renotify:false};
    if(reg) await reg.showNotification(titulo,op); else new Notification(titulo,op); }catch(e){ console.warn(e); }
}
function verificaLembretes(forcar){
  if(!notifOn||!("Notification" in window)||Notification.permission!=="granted") return;
  if(!forcar&&Date.now()-ultimaVerif<60000) return; ultimaVerif=Date.now();
  let vistos={}; try{ vistos=JSON.parse(localStorage.getItem("mb.notif.vistos")||"{}"); }catch(e){}
  const d=new Date(), hoje=d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate());
  pendencias().forEach(x=>{
    const e=x.dd===1?"amanha":x.dd===0?"hoje":"atraso", chave=[x.tipo,x.id,x.k,e,e==="atraso"?hoje:""].join(":");
    if(vistos[chave]) return; vistos[chave]=hoje;
    const titulo=e==="amanha"?"Vence amanhã: "+x.nome:e==="hoje"?"Vence hoje: "+x.nome:"Conta atrasada: "+x.nome;
    mostraNotif(titulo,brl(x.valor)+(e==="atraso"?" · venceu em "+fmtData(x.data):"")+" — toque para abrir o Monetra.",chave);
  });
  alertasOrcamento(todayKey).forEach(a=>{ const chave=["orc",a.id,todayKey,a.nivel].join(":"); if(vistos[chave]) return; vistos[chave]=hoje;
    mostraNotif(a.nivel==="passou"?"Limite estourado: "+a.nome:a.nivel==="ritmo"?"Ritmo alto: "+a.nome:"Atenção ao limite: "+a.nome, textoAlerta(a)+" Toque para ver.",chave); });
  const salN=avisoSalario(); if(salN){ const chave="salario:"+todayKey+":"+salN.parte; if(!vistos[chave]){ vistos[chave]=hoje; mostraNotif(salN.parte===2?"A outra parte do salário caiu?":"Seu salário caiu?","Toque para confirmar no Monetra e ver o saldo do mês.",chave); } }
  const rsN=avisoSemana(); if(rsN){ const chave="semana:"+rsN.fim; if(!vistos[chave]){ vistos[chave]=hoje; mostraNotif("Resumo da semana: "+brl(rsN.tot),textoVarSemana(rsN)+(rsN.subiu?". Mais subiu: "+catName(rsN.subiu.id):"")+". Toque para ver.",chave); } }
  const bkN=lembreteBackup(); if(bkN){ const chave="backup:"+todayKey; if(!vistos[chave]){ vistos[chave]=hoje; mostraNotif("Hora de fazer um backup",(bkN.dias===null?"Você ainda não baixou nenhum backup.":"Último backup há "+bkN.dias+" dias.")+" Toque para abrir o Monetra.",chave); } }
  for(const k in vistos) if(vistos[k]<shiftKey(hoje.slice(0,7),-2)) delete vistos[k];
  try{ localStorage.setItem("mb.notif.vistos",JSON.stringify(vistos)); }catch(e){}
}
async function ligaNotif(on){
  if(!on){ notifOn=false; try{localStorage.setItem("mb.notif","0")}catch(e){} render(); return; }
  if(!("Notification" in window)){ toast("Este navegador não permite notificações. Use os lembretes no calendário."); render(); return; }
  const p=Notification.permission==="granted"?"granted":await Notification.requestPermission();
  notifOn=p==="granted"; try{localStorage.setItem("mb.notif",notifOn?"1":"0")}catch(e){}
  render();
  if(notifOn){ toast("Notificações ativadas."); mostraNotif("Monetra","Pronto! Você vai ser avisado um dia antes, no dia e se uma conta atrasar.","teste"); verificaLembretes(true); }
  else toast("O navegador bloqueou as notificações. Libere nas configurações do site.");
}
function exportarCalendario(){
  const esc2=t=>String(t||"").replace(/\\/g,"\\\\").replace(/[,;]/g,m=>"\\"+m).replace(/\n/g,"\\n");
  const ymd=d=>d.getFullYear()+pad2(d.getMonth()+1)+pad2(d.getDate());
  const stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+/,"");
  const L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Monetra//PT-BR","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:Monetra - contas"];
  let n=0;
  const ev=(uid,data,titulo,desc)=>{ n++; L.push("BEGIN:VEVENT","UID:"+uid+"@mbcontrole","DTSTAMP:"+stamp,"DTSTART:"+ymd(data)+"T090000","DTEND:"+ymd(data)+"T091500","SUMMARY:"+esc2(titulo),"DESCRIPTION:"+esc2(desc),"BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+esc2(titulo),"TRIGGER:PT0M","END:VALARM","END:VEVENT"); };
  const tres=(base,data,nome,valor)=>{ const ant=new Date(data); ant.setDate(ant.getDate()-1); const dep=new Date(data); dep.setDate(dep.getDate()+1);
    ev(base+"-antes",ant,"Amanhã vence: "+nome+" ("+brl(valor)+")","Lembrete do Monetra.");
    ev(base+"-dia",data,"Hoje vence: "+nome+" ("+brl(valor)+")","Depois de pagar, marque como paga no Monetra.");
    ev(base+"-atraso",dep,"Atrasou? "+nome+" venceu ontem","Se ainda não pagou, a conta está atrasada. Se já pagou, ignore."); };
  for(let i=0;i<12;i++){ const k=shiftKey(todayKey,i), dim=diasMes(k);
    state.config.fixos.filter(f=>f.desde<=k&&(!f.ate||k<=f.ate)&&(!inicioKey()||k>=inicioKey())).forEach(f=>{ const o=((state.months[k]||{}).fixos||{})[f.id]||{}; if(o.pago||o.pular) return; tres("f"+f.id+k,new Date(kY(k),kM(k)-1,Math.min(f.dia,dim)),f.nome,typeof o.valor==="number"?o.valor:f.valor); });
    parcelasDoMes(k).filter(p=>!p.cartao&&!p.pago).forEach(p=>tres("p"+p.id+k,new Date(kY(k),kM(k)-1,p.dia),(p.desc||"Parcela")+" "+p.idx+"/"+p.n,p.valor));
    cartoesOk().forEach(cc=>{ const m=state.months[k], tf=soma(faturaDoMes(k,cc.id)); if(tf>0&&!faturaPaga(m,cc.id)) tres("fat"+cc.id+k,new Date(kY(k),kM(k)-1,Math.min(cc.vence,dim)),"Fatura "+cc.nome,soma(faturaDoMes(k,cc.id))); });
  }
  L.push("END:VCALENDAR");
  if(!n){ toast("Nenhuma conta com vencimento para colocar no calendário."); return; }
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([L.join("\r\n")],{type:"text/calendar;charset=utf-8"})); a.download="monetra-lembretes.ics"; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
  toast("Arquivo de lembretes baixado ("+(n/3)+" vencimentos). Abra para adicionar ao calendário.");
}

