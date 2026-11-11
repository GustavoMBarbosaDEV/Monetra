// @ts-check
// Controles compartilhados: convites, pedidos, membros e troca de espaço.
"use strict";
const primeiroNome=n=>String(n||"").trim().split(/[\s@]+/)[0]||"alguém";
const meuNome=()=>(authUser&&(authUser.displayName||authUser.email))||"Alguém";
const euMembro=()=>({nome:meuNome(),email:(authUser&&authUser.email)||"",foto:(authUser&&authUser.photoURL)||"",desde:new Date().toISOString()});
const compartilhado=()=>mode==="cloud"&&aberto!=="pessoal";
const souDono=()=>mode!=="cloud"||aberto==="pessoal"||!!(grupoDoc&&grupoDoc.dono===uid);
function nomeDe(id){ if(id===uid) return "você"; const x=grupoDoc&&grupoDoc.m&&grupoDoc.m[id]; return x?primeiroNome(x.nome):""; }
const marcaPor=o=>{ if(compartilhado()) o.por=uid; return o; };
const porTxt=g=>{ const q=g.pagou||g.por; return compartilhado()&&q&&nomeDe(q)?" · "+(g.pagou?"pago por ":"")+nomeDe(q):""; };
const CODE_ALF="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function novoCodigo(n){ const a=new Uint32Array(n||8); crypto.getRandomValues(a); return Array.from(a,x=>CODE_ALF[x%32]).join(""); }
const CONVITE_DIAS=7;
const linkConvite=c=>location.origin+location.pathname+"?convite="+c;
const falhou=e=>{ console.error(e); toast("Não deu certo ("+(e&&e.code||"erro")+")."+(negado(e)?" Confira se as regras novas do Firebase foram publicadas.":"")); };
async function trocarEspaco(g){ if(g===aberto) return; await salvaPendentes(); await euSet("ativo",null,g); abrirEspaco(); }
async function criarGrupo(){ if(ui.ocupado) return; ui.ocupado=true; try{ return await _criarGrupo(); } finally{ ui.ocupado=false; } }
async function _criarGrupo(){
  const el=document.getElementById("grNome"), nome=String(el?el.value:"").trim().slice(0,40);
  if(!nome){ ui.compErro="Dê um nome, por exemplo: Casa, Viagem, Família."; render(); return; }
  const F=fb, g="g"+novoCodigo(16).toLowerCase();
  try{
    await F.setDoc(F.doc(F.db,"grupos",g),{nome,dono:uid,codigo:null,criado:new Date().toISOString(),m:{[uid]:euMembro()}});
    await salvaPendentes(); await euSet("grupos",g,{nome,dono:true}); refazVigias(); ui.compErro="";
    await euSet("ativo",null,g); ui.tab="perfil"; abrirEspaco("Controle “"+nome+"” criado. Ele começa do zero; convide quem vai usar com você.");
  }catch(e){ falhou(e); }
}
async function gerarConvite(){ if(ui.ocupado) return; ui.ocupado=true; try{ return await _gerarConvite(); } finally{ ui.ocupado=false; } }
async function _gerarConvite(quieto){
  const F=fb, g=aberto, cod=novoCodigo(8);
  try{
    if(grupoDoc&&grupoDoc.codigo) await F.deleteDoc(F.doc(F.db,"convites",grupoDoc.codigo)).catch(()=>{});
    await F.setDoc(F.doc(F.db,"convites",cod),{grupo:g,dono:uid,nome:(grupoDoc&&grupoDoc.nome)||"",donoNome:meuNome(),em:new Date().toISOString(),criado:F.serverTimestamp()});
    await F.updateDoc(F.doc(F.db,"grupos",g),{codigo:cod});
    if(!quieto) toast("Código de convite criado.");
    return true;
  }catch(e){ if(quieto) console.error(e); else falhou(e); return false; }
}
async function compartilharConvite(){
  const c=grupoDoc&&grupoDoc.codigo; if(!c) return;
  const txt="Entre no controle “"+grupoDoc.nome+"” no Monetra. Código: "+c+"\n"+linkConvite(c);
  try{ if(navigator.share){ await navigator.share({title:"Monetra",text:txt}); return; } }catch(e){ if(e&&e.name==="AbortError") return; }
  try{ await navigator.clipboard.writeText(txt); toast("Convite copiado. Cole no WhatsApp ou onde quiser."); }catch(e){ toast("Código: "+c); }
}
async function pedirEntrada(){ if(ui.ocupado) return; ui.ocupado=true; try{ return await _pedirEntrada(); } finally{ ui.ocupado=false; } }
async function _pedirEntrada(){
  const el=document.getElementById("convCod"), F=fb, cod=String(el?el.value:"").toUpperCase().replace(/[^A-Z0-9]/g,"");
  const erro=m=>{ ui.convErro=m; render(); };
  if(cod.length!==8) return erro("O código tem 8 letras e números.");
  try{
    const c=await F.getDoc(F.doc(F.db,"convites",cod));
    if(!c.exists()) return erro("Código não encontrado. Confira com quem te convidou ou peça um código novo.");
    const g=c.data().grupo, nome=c.data().nome||"compartilhado", cr=c.data().criado;
    if(!cr||typeof cr.toMillis!=="function"||cr.toMillis()<Date.now()-CONVITE_DIAS*864e5) return erro("Esse código venceu (vale "+CONVITE_DIAS+" dias). Peça um código novo a quem te convidou.");
    if((eu.grupos||{})[g]) return erro("Você já participa do controle “"+nome+"”.");
    await F.setDoc(F.doc(F.db,"grupos",g,"pedidos",uid),{codigo:cod,nome:meuNome(),email:authUser.emailVerified?(authUser.email||""):"",foto:authUser.photoURL||"",em:new Date().toISOString()});
    await euSet("pendentes",g,{nome,donoNome:c.data().donoNome||""}); refazVigias();
    ui.convErro=""; ui.conviteUrl=null; render();
    toast("Pedido enviado. Agora é só "+primeiroNome(c.data().donoNome)+" aceitar.");
  }catch(e){ console.error(e); erro("Não foi possível enviar o pedido ("+(e.code||"erro")+")."); }
}
async function cancelarPedido(g){
  await euSet("pendentes",g,null); refazVigias(); render();
  try{ await fb.deleteDoc(fb.doc(fb.db,"grupos",g,"pedidos",uid)); }catch(e){}
  toast("Pedido cancelado.");
}
async function responderPedido(g,id,aceitar){
  const F=fb, p=(pedidosG[g]||[]).find(x=>x.uid===id); if(!p) return;
  try{
    if(aceitar) await F.updateDoc(F.doc(F.db,"grupos",g),{["m."+id]:{nome:p.nome||"",email:p.email||"",foto:p.foto||"",desde:new Date().toISOString()}});
    await F.deleteDoc(F.doc(F.db,"grupos",g,"pedidos",id));
    toast(aceitar?primeiroNome(p.nome)+" agora participa de “"+(((eu.grupos||{})[g]||{}).nome||"")+"”.":"Pedido recusado.");
  }catch(e){ falhou(e); }
}
async function removerMembro(id){
  const nome=nomeDe(id);
  try{ await fb.updateDoc(fb.doc(fb.db,"grupos",aberto),{["m."+id]:fb.deleteField()}); }catch(e){ falhou(e); return; }
  let trocou=false;
  if(grupoDoc&&grupoDoc.codigo&&!ui.ocupado){ ui.ocupado=true; try{ trocou=await _gerarConvite(true); } finally{ ui.ocupado=false; } }
  toast(nome+" não participa mais deste controle."+(trocou?" O código de convite foi trocado.":""));
}
async function sairDoGrupo(){
  const g=aberto, nome=((eu.grupos||{})[g]||{}).nome||"";
  if(!navigator.onLine){ toast("Sem internet. Para sair do controle, conecte e tente de novo."); return; }
  await salvaPendentes(); seqEspaco++; pararEspaco();
  try{ await fb.updateDoc(fb.doc(fb.db,"grupos",g),{["m."+uid]:fb.deleteField()}); }
  catch(e){ if(!negado(e)&&!(e&&e.code==="not-found")){ falhou(e); abrirEspaco(); return; } }
  await euSet("grupos",g,null); await euSet("ativo",null,"pessoal"); refazVigias();
  abrirEspaco("Você saiu de “"+nome+"”. Voltou para o Pessoal.");
}
async function excluirGrupo(){
  const F=fb, g=aberto, nome=(grupoDoc&&grupoDoc.nome)||"";
  try{
    seqEspaco++; pararEspaco();
    if(grupoDoc&&grupoDoc.codigo) await F.deleteDoc(F.doc(F.db,"convites",grupoDoc.codigo)).catch(()=>{});
    await Promise.all([...docIds].map(id=>F.deleteDoc(F.doc(F.db,"grupos",g,"docs",id))));
    await Promise.all((pedidosG[g]||[]).map(p=>F.deleteDoc(F.doc(F.db,"grupos",g,"pedidos",p.uid)).catch(()=>{})));
    await F.deleteDoc(F.doc(F.db,"grupos",g));
    await euSet("grupos",g,null); await euSet("ativo",null,"pessoal"); refazVigias();
    abrirEspaco("Controle “"+nome+"” excluído.");
  }catch(e){ falhou(e); abrirEspaco(); }
}
function seletorEspaco(){
  const gs=meusGrupos(); if(mode!=="cloud"||!gs.length) return "";
  const b=(id,nome,np)=>`<button type="button" role="tab" data-espaco="${esc(id)}" class="${aberto===id?"on":""}" aria-selected="${aberto===id}">${id==="pessoal"?ICON.perfil:ICON.grupo}<span>${esc(nome)}</span>${np?`<i class="badge">${np}</i>`:""}</button>`;
  return `<div class="espacos" role="tablist" aria-label="Qual controle abrir">${b("pessoal","Pessoal")}${gs.map(x=>b(x.id,x.nome,(pedidosG[x.id]||[]).length)).join("")}</div>`;
}
function cardCompartilhado(){
  if(mode!=="cloud") return "";
  const pessoa=(nome,email,extra)=>`<div class="membro"><span class="avatar" style="width:34px;height:34px">${esc(primeiroNome(nome).slice(0,1).toUpperCase())}</span><span class="t"><b>${esc(nome||email||"Pessoa")}</b><small>${esc(email||"")}</small></span>${extra||""}</div>`;
  let topo="";
  if(aberto!=="pessoal"&&grupoDoc){
    const gd=grupoDoc, dono=gd.dono===uid, ms=Object.entries(gd.m||{}).sort((a,b)=>(a[0]===gd.dono?-1:b[0]===gd.dono?1:0)), ped=pedidosG[aberto]||[];
    topo=`<div class="grupoatual"><span class="lab">Aberto agora</span><b>${esc(gd.nome)}</b><small>${ms.length} pessoa${ms.length===1?"":"s"} · seu controle Pessoal continua só seu</small></div>
    ${ped.length&&dono?`<div class="subhead">Pedidos para entrar</div><div class="membros">${ped.map(p=>pessoa(p.nome,p.email||"e-mail não confirmado",`<span class="acoes"><button class="btn ghost mini" type="button" data-comp="recusar" data-id="${esc(p.uid)}">Recusar</button><button class="btn mini" type="button" data-comp="aceitar" data-id="${esc(p.uid)}">Aceitar</button></span>`)).join("")}</div>`:""}
    <div class="subhead">Quem participa</div>
    <div class="membros">${ms.map(([id,x])=>pessoa(x.nome,x.email,(id===gd.dono?'<span class="tag">dono</span>':"")+(id===uid?'<span class="tag">você</span>':"")+(dono&&id!==uid?`<button class="link" type="button" data-comp="remover" data-id="${esc(id)}">remover</button>`:""))).join("")}</div>
    ${dono?(gd.codigo?`<div class="convite"><span class="lab">Código de convite</span><b>${esc(gd.codigo)}</b></div>
      <div class="row2"><button class="btn" type="button" data-comp="enviar">Enviar convite</button><button class="btn ghost" type="button" data-comp="novo">Gerar outro código</button></div>
      <p class="hint">A pessoa abre o link (ou digita o código no Perfil dela) e você aceita o pedido aqui. O código vale ${CONVITE_DIAS} dias; depois disso, gere outro.</p>`
      :`<button class="btn" type="button" data-comp="novo">Convidar alguém</button>`):""}
    <div class="zonaperigo" id="excluirgrupo">${dono?`<p class="hint">Excluir apaga este controle compartilhado e todos os lançamentos dele, para todas as pessoas. O seu controle Pessoal não é afetado.</p>
      <button class="btn danger wide" type="button" data-comp="excluir">${ICON.lixo||""}Excluir o controle “${esc(gd.nome)}”</button>`
      :`<p class="hint">Ao sair, você deixa de ver este controle. O seu controle Pessoal não é afetado.</p>
      <button class="btn danger wide" type="button" data-comp="sair">Sair de “${esc(gd.nome)}”</button>`}</div>`;
  }
  const gs=meusGrupos(), pend=Object.entries(eu.pendentes||{});
  const lista=aberto==="pessoal"&&gs.length?`<div class="subhead">Seus controles compartilhados</div><div class="membros">${gs.map(x=>`<div class="membro"><span class="avatar" style="width:34px;height:34px">${ICON.grupo}</span><span class="t"><b>${esc(x.nome)}</b><small>${x.dono?"você criou":"participante"}${(pedidosG[x.id]||[]).length?" · "+(pedidosG[x.id]||[]).length+" pedido(s) para entrar":""}</small></span><span class="acoes"><button class="btn ghost mini" type="button" data-espaco="${esc(x.id)}" data-irpara="compartilhado">Abrir</button><button class="btn danger mini" type="button" data-espaco="${esc(x.id)}" data-irpara="excluirgrupo">${x.dono?"Excluir":"Sair"}</button></span></div>`).join("")}</div>`:"";
  const pendTxt=pend.length?`<div class="subhead">Pedidos que você enviou</div><div class="membros">${pend.map(([g,x])=>`<div class="membro"><span class="avatar" style="width:34px;height:34px">${ICON.grupo}</span><span class="t"><b>${esc(x.nome||"Controle compartilhado")}</b><small>aguardando ${esc(primeiroNome(x.donoNome))} aceitar</small></span><button class="link" type="button" data-comp="cancelar" data-id="${esc(g)}">cancelar</button></div>`).join("")}</div>`:"";
  return `<div class="card" id="compartilhado"><h2>Controles compartilhados</h2>
  ${topo||`<p class="hint">Crie um controle separado para dividir com outra pessoa (a casa, uma viagem, a família). Ele começa do zero e quem participa <b>não vê o seu controle Pessoal</b>. Para trocar de um para o outro, use os botões no topo da tela.</p>`}
  ${lista}${pendTxt}
  <div class="subhead">Criar um controle compartilhado</div>
  <div class="convrow"><input class="in nome" id="grNome" maxlength="40" autocomplete="off" placeholder="Nome (ex.: Casa)"><button class="btn" type="button" data-comp="criar">Criar</button></div>
  ${ui.compErro?`<p class="erro">${esc(ui.compErro)}</p>`:""}
  <div class="subhead">Entrar com um código de convite</div>
  <div class="convrow"><input class="in" id="convCod" maxlength="9" autocomplete="off" autocapitalize="characters" placeholder="Código de 8 letras" value="${esc(ui.conviteUrl||"")}"><button class="btn" type="button" data-comp="entrar">Pedir para entrar</button></div>
  ${ui.convErro?`<p class="erro">${esc(ui.convErro)}</p>`:""}</div>`;
}
function avisoCompart(){
  if(mode!=="cloud") return "";
  const g=Object.keys(pedidosG).find(k=>(pedidosG[k]||[]).length); if(!g) return "";
  const p=pedidosG[g], nome=((eu.grupos||{})[g]||{}).nome||"";
  return `<div class="note info">${esc(primeiroNome(p[0].nome))}${p.length>1?" e mais "+(p.length-1):""} quer entrar em “${esc(nome)}”. <button class="link" type="button" data-espaco="${esc(g)}" data-irpara="compartilhado">Ver pedido</button></div>`;
}
function acaoComp(a,id){
  const dois=(chave,msg)=>{ if(ui[chave]!==(id||true)){ ui[chave]=id||true; toast(msg); setTimeout(()=>{ ui[chave]=null; },5000); return false; } ui[chave]=null; return true; };
  if(a==="criar") return criarGrupo();
  if(a==="novo") return gerarConvite();
  if(a==="enviar") return compartilharConvite();
  if(a==="entrar") return pedirEntrada();
  if(a==="cancelar") return cancelarPedido(id);
  if(a==="aceitar") return responderPedido(aberto,id,true);
  if(a==="recusar") return responderPedido(aberto,id,false);
  if(a==="remover"){ if(dois("confRem","Toque de novo em “remover” para confirmar.")) removerMembro(id); return; }
  if(a==="sair"){ if(dois("confSair","Toque de novo em “Sair” para confirmar.")) sairDoGrupo(); return; }
  if(a==="excluir"){ if(dois("confExc","Toque de novo para excluir. Todos os lançamentos deste controle compartilhado serão apagados.")) excluirGrupo(); return; }
}
