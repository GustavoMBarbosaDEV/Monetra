// @ts-check
// Cliques, gestos, puxar para atualizar e botão +.
"use strict";
const app=document.getElementById("app");
function goMonth(k){ if(!mesesVisiveis().includes(k)) return; ui.month=k; render(); }
function passo(n){ const V=mesesVisiveis(), i=V.indexOf(ui.month)+n; if(V[i]){ goMonth(V[i]); return true; } return false; }
function setTab(t){ if(t!=="mes"&&ui.tab==="mes") marcaHist("tab"); else if(t==="mes"&&ui.tab!=="mes"&&history.state&&history.state.mb==="tab"){ ui.tab=t; _ignoraPop++; try{ history.back(); }catch(e){ _ignoraPop--; } render(); window.scrollTo({top:0}); return; } ui.tab=t; render(); window.scrollTo({top:0}); }
let desl=null, semCliqueAte=0;
function repeteHoje(k,id){
  const g=getMonth(k).gastos.find(x=>x.id===id); if(!g) return;
  const novo=Object.assign(clone(g),{id:uidGen(),dia:today.getDate()}); delete novo.pago; delete novo.pagoEm; delete novo.imp;
  getMonth(todayKey).gastos.push(novo); save(todayKey); render();
  toast("“"+(g.desc||catName(g.cat))+"” repetido hoje ("+brl(g.valor)+").","Desfazer",()=>apagarItem(todayKey,"gastos",novo.id,"Repetição desfeita."));
}
function soltaDesl(acao){
  const s=desl; desl=null; if(!s||!s.ativo) return;
  semCliqueAte=Date.now()+450;
  const row=s.row, volta=()=>{ row.classList.remove("arrastando"); if(row.parentElement) row.parentElement.classList.remove("desl-pai"); row.style.transform=""; row.style.transition=""; row.style.opacity=""; if(s.fundo) s.fundo.remove(); };
  const fazer=()=>{ volta(); if(acao==="apagar") apagarItem(s.mes,"gastos",s.id,"Lançamento apagado."); else if(s.pagar) marcaGastoPago(s.mes,s.id,true); else repeteHoje(s.mes,s.id);
    if(ui.sheet&&ui.sheet.tipo==="dia"){ renderSheet(); const f=toastAcao; if(f) toastAcao=()=>{ f(); if(ui.sheet&&ui.sheet.tipo==="dia") renderSheet(); }; } };
  if(!acao){ if(semMovimento()){ volta(); return; } row.style.transition="transform .18s ease"; row.style.transform=""; setTimeout(volta,190); return; }
  if(semMovimento()||acao!=="apagar"){ fazer(); return; }
  row.style.transition="transform .18s ease, opacity .18s ease"; row.style.transform="translateX("+(-row.offsetWidth)+"px)"; row.style.opacity="0"; setTimeout(fazer,180);
}
document.addEventListener("pointerdown",e=>{
  if(e.pointerType!=="touch"||desl) return;
  const t=/** @type {Element} */(e.target), row=/** @type {HTMLElement|null} */(t.closest&&t.closest("#app [data-desliza], #sheet .caldia [data-desliza]")); if(!row) return;
  const k=row.dataset.lmes||ui.month, g=getMonth(k).gastos.find(x=>x.id===row.dataset.desliza); if(!g) return;
  desl={row,id:g.id,mes:k,pagar:g.forma==="credito"&&!g.pago,x0:e.clientX,y0:e.clientY,dx:0,ativo:false,pronto:false,pid:e.pointerId,fundo:null};
});
document.addEventListener("pointermove",e=>{
  const s=desl; if(!s||e.pointerId!==s.pid) return;
  const dx=e.clientX-s.x0, dy=e.clientY-s.y0, row=s.row;
  if(!s.ativo){
    if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){ desl=null; return; }
    if(Math.abs(dx)<14||Math.abs(dx)<Math.abs(dy)*1.5) return;
    const pai=row.parentElement; if(!pai){ desl=null; return; }
    s.ativo=true; pai.classList.add("desl-pai");
    const f=document.createElement("div"); f.className="desl-fundo"; f.setAttribute("aria-hidden","true");
    f.style.top=row.offsetTop+"px"; f.style.left=row.offsetLeft+"px"; f.style.width=row.offsetWidth+"px"; f.style.height=row.offsetHeight+"px";
    f.innerHTML=`<span class="dir">${s.pagar?ICON.check+" Paga":ICON.repete+" Repetir hoje"}</span><span class="esq">Apagar ${ICON.lixo}</span>`;
    pai.insertBefore(f,row); s.fundo=f; row.classList.add("arrastando"); try{ row.setPointerCapture(e.pointerId); }catch(er){}
  }
  e.preventDefault();
  const w=row.offsetWidth, x=Math.max(-w,Math.min(w,dx)), pronto=Math.abs(x)>=Math.min(90,w*.35); s.dx=x;
  row.style.transform="translateX("+x+"px)";
  if(s.fundo) s.fundo.className="desl-fundo "+(x<0?"apaga":s.pagar?"paga":"repete")+(pronto?" pronto":"");
  if(pronto!==s.pronto){ s.pronto=pronto; if(pronto) vibra(12); }
});
document.addEventListener("pointerup",e=>{ const s=desl; if(!s||e.pointerId!==s.pid) return; if(!s.ativo){ desl=null; return; } soltaDesl(s.pronto?(s.dx<0?"apagar":"direita"):null); });
document.addEventListener("pointercancel",e=>{ const s=desl; if(!s||e.pointerId!==s.pid) return; if(s.ativo) soltaDesl(null); else desl=null; });
let grafToque=null, grafTimer=null;
function mostraDiaGraf(w,i){
  const sr=(w.dataset.serie||"").split(",").map(Number), n=sr.length, k=w.dataset.hsgraf||ui.month; if(n<2) return;
  i=Math.max(0,Math.min(n-1,Math.round(i))); clearTimeout(grafTimer);
  const x=i/(n-1), y=(70-4-(sr[i]-Number(w.dataset.mn))/(Number(w.dataset.rg)||1)*62)/70, dif=i?sr[i]-sr[i-1]:0, data=pad2(i+1)+"/"+pad2(kM(k));
  const mc=/** @type {HTMLElement|null} */(w.querySelector(".hs-marca")), bl=/** @type {HTMLElement|null} */(w.querySelector(".hs-balao")); if(!mc||!bl) return;
  mc.style.left=(x*100)+"%"; const pt=/** @type {HTMLElement|null} */(mc.firstElementChild); if(pt) pt.style.top=(y*100)+"%";
  bl.innerHTML=`<b>${brl(sr[i])}</b><small>${data}${Math.abs(dif)>=0.005?` · ${dif>0?"+":"−"}${brl(Math.abs(dif))} no dia`:""}</small>`;
  const L=w.clientWidth, bw=bl.offsetWidth; bl.style.left=Math.max(0,Math.min(L-bw,x*L-bw/2))+"px";
  w.classList.add("hs-ver"); w.dataset.i=String(i);
  w.setAttribute("aria-valuenow",String(i+1)); w.setAttribute("aria-valuetext",data+": "+brl(sr[i])+(Math.abs(dif)>=0.005?", "+(dif>0?"entrou ":"saiu ")+brl(Math.abs(dif))+" no dia":""));
}
function escondeGraf(w,ms){ clearTimeout(grafTimer); grafTimer=setTimeout(()=>w.classList.remove("hs-ver"),ms||0); }
const diaDoPonto=(w,e)=>{ const r=w.getBoundingClientRect(), n=(w.dataset.serie||"").split(",").length; return (e.clientX-r.left)/Math.max(1,r.width)*(n-1); };
app.addEventListener("pointerdown",e=>{ const t=/** @type {Element} */(e.target), w=/** @type {HTMLElement|null} */(t.closest&&t.closest(".hs-grafwrap")); if(!w) return;
  grafToque={w,pid:e.pointerId}; if(e.pointerType==="touch") vibra(8); mostraDiaGraf(w,diaDoPonto(w,e)); try{ w.setPointerCapture(e.pointerId); }catch(er){} });
app.addEventListener("pointermove",e=>{
  if(grafToque&&grafToque.pid===e.pointerId){ const w=grafToque.w, i=Math.round(diaDoPonto(w,e)); if(String(i)!==w.dataset.i) mostraDiaGraf(w,i); return; }
  if(e.pointerType!=="mouse") return; const t=/** @type {Element} */(e.target), w=/** @type {HTMLElement|null} */(t.closest&&t.closest(".hs-grafwrap")); if(w) mostraDiaGraf(w,diaDoPonto(w,e)); });
const soltaGraf=e=>{ if(!grafToque||grafToque.pid!==e.pointerId) return; const w=grafToque.w; grafToque=null; if(e.pointerType!=="mouse") escondeGraf(w,1600); };
app.addEventListener("pointerup",soltaGraf); app.addEventListener("pointercancel",soltaGraf);
app.addEventListener("pointerout",e=>{ if(e.pointerType!=="mouse"||grafToque) return; const t=/** @type {Element} */(e.target), w=t.closest&&t.closest(".hs-grafwrap"), r=/** @type {Node|null} */(e.relatedTarget);
  if(w&&!(r&&w.contains(r))&&document.activeElement!==w) escondeGraf(/** @type {HTMLElement} */(w),150); });
app.addEventListener("keydown",e=>{ const t=/** @type {Element} */(e.target); if(!t.classList||!t.classList.contains("hs-grafwrap")) return; const w=/** @type {HTMLElement} */(t);
  const n=(w.dataset.serie||"").split(",").length, at=w.dataset.i!=null&&w.classList.contains("hs-ver")?Number(w.dataset.i):n-1;
  const novo={ArrowLeft:at-1,ArrowDown:at-1,ArrowRight:at+1,ArrowUp:at+1,Home:0,End:n-1,PageUp:at+7,PageDown:at-7}[e.key]; if(novo==null) return; e.preventDefault(); e.stopPropagation(); mostraDiaGraf(w,novo); });
app.addEventListener("focusin",e=>{ const t=/** @type {Element} */(e.target); if(t.classList&&t.classList.contains("hs-grafwrap")&&!grafToque) mostraDiaGraf(/** @type {HTMLElement} */(t),Number(t.getAttribute("aria-valuenow")||1)-1); });
app.addEventListener("focusout",e=>{ const t=/** @type {Element} */(e.target); if(t.classList&&t.classList.contains("hs-grafwrap")) escondeGraf(/** @type {HTMLElement} */(t),0); });
function abreFatia(el){ const id=el.getAttribute("data-fatia"); if(!id) return; vibra(10); openSheet("catmes",null,{cat:id,mes:ui.month}); anunciar("Lançamentos de "+catName(id)+"."); }
app.addEventListener("click",e=>{ const t=/** @type {Element} */(e.target), f=t.closest&&t.closest("[data-fatia]"); if(f) abreFatia(f); });
app.addEventListener("submit",e=>{ const f=/** @type {HTMLElement|null} */(e.target instanceof Element?e.target.closest("[data-lgform]"):null); if(!f) return; e.preventDefault();
  if(f.dataset.lgform==="link"){ const em=campoTexto("lg-email").trim(); ui.lgEmail=em; if(!emailOk(em)){ erroLogin("Digite um e-mail válido.","lg-email"); return; } concluiLink(ui.linkHref||"",em); } else entrarEmail(); });
app.addEventListener("keydown",e=>{ const t=/** @type {Element} */(e.target); if((e.key==="Enter"||e.key===" ")&&t.getAttribute&&t.getAttribute("data-fatia")){ e.preventDefault(); e.stopPropagation(); abreFatia(t); } });
document.addEventListener("click",e=>{ if(Date.now()<semCliqueAte){ semCliqueAte=0; e.stopPropagation(); e.preventDefault(); } },true);
app.addEventListener("click",e=>{
  const b=e.target.closest("button,tr[data-open]"); if(!b) return;
  const d=b.dataset;
  if(d.espaco){ if(d.irpara){ ui.tab="perfil"; ui.rolarPara=d.irpara; } if(d.espaco===aberto) render(); else trocarEspaco(d.espaco); return; }
  if(d.irpara){ ui.tab="perfil"; render(); setTimeout(()=>{ const el=document.getElementById(d.irpara); if(el) el.scrollIntoView({block:"start",behavior:"smooth"}); },60); return; }
  if(d.tab){ setTab(d.tab); return; }
  if(d.abre){ ui.abre[d.abre]=!ui.abre[d.abre]; try{ localStorage.setItem("mb.abre",JSON.stringify(ui.abre)); }catch(e){} render(); if(ui.abre[d.abre]){ const sc=document.getElementById("sec-"+d.abre); if(sc) setTimeout(()=>sc.scrollIntoView({block:"nearest",behavior:"smooth"}),40); } return; }
  if(d.rolar){ const el=garanteVisivel(d.rolar); if(el) el.scrollIntoView({block:"start",behavior:"smooth"}); return; }
  if(d.irajustes){ setTab("ajustes"); return; }
  if(d.vertudo){ ui.verTudo=d.vertudo==="1"; render(); anunciar(ui.verTudo?"Mostrando tudo do Início.":"Modo foco: só o essencial."); return; }
  if(d.ouvir){ ouvirResumo(); return; }
  if(d.pular){ const m=document.getElementById("conteudo"), alvo=/** @type {HTMLElement|null} */(m&&(m.querySelector(".pagetitle h2, .heroSaldo, h2, h1")||m.firstElementChild));
    if(alvo){ if(!alvo.hasAttribute("tabindex")) alvo.setAttribute("tabindex","-1"); alvo.classList.add("alvo-pulo"); alvo.focus({preventScroll:true}); alvo.scrollIntoView({block:"start"}); } return; }
  if(d.login){ entrar(d.login==="microsoft"?"microsoft":"google"); return; }
  if(d.lg){ if(d.lg==="senha") esqueciSenha(); else if(d.lg==="link") enviarLink(); else if(d.lg==="anon") testarSemConta(); return; }
  if(d.reenviar){ const u=fb&&fb.auth.currentUser; if(u) iniciaAppCheck().then(()=>fb.sendEmailVerification(u,{url:urlRetorno()})).then(()=>toast("Link de confirmação enviado para "+u.email+".")).catch(e=>toast(traduzErro(e)||"Não deu para enviar agora.")); return; }
  if(d.apres){ ui.verLogin=true; if(d.apres==="criar") ui.loginModo="criar"; render(); window.scrollTo({top:0}); return; }
  if(d.termos){ acaoTermos(d.termos); return; }
  if(d.comp){ acaoComp(d.comp,d.id); return; }
  if(d.virafixo!==undefined){ virarFixo(+d.virafixo); return; }
  if(d.logout&&ehAnonimo()){ if(++sairAnon<2){ toast("Sem conta, os lançamentos do teste são apagados ao sair. Toque de novo em Sair para confirmar, ou crie sua conta antes."); setTimeout(()=>{ sairAnon=0; },6000); return; } sairAnon=0; excluirConta().catch(()=>encerraSessao()); return; }
  if(d.logout&&!navigator.onLine&&temPendLocal()){ if(++sairOff<2){ toast("Sem internet: há lançamentos ainda não enviados. Eles ficam guardados neste aparelho e sobem quando você entrar de novo nele. Toque de novo em Sair para confirmar."); setTimeout(()=>{ sairOff=0; },6000); return; } sairOff=0; }
  if(d.logout){ setStatus("Salvando antes de sair…","saving"); salvaPendentes().finally(()=>encerraSessao()); return; }
  if(d.tema){ trocaTema(); return; }
  if(d.privado){ trocaPrivado(); return; }
  if(d.bkurgente){ exportar(); toast("Backup baixado. Guarde o arquivo em um lugar seguro (Drive, e-mail…)."); anunciar("Backup baixado."); render(); return; }
  if(d.acerto){ const [de,para,v]=d.acerto.split("|"), mes=d.mes||ui.month, valor=Number(v); if(!(valor>0)) return;
    const a={id:uidGen(),tipo:"acerto",de,para,valor,dia:mes===todayKey?today.getDate():diasMes(mes),desc:"Acerto"}; getMonth(mes).transf.push(a); save(mes); render(); vibra(16);
    toast("Acerto de "+brl(valor)+" registrado.","Desfazer",()=>apagarItem(mes,"transf",a.id,"Acerto desfeito.")); return; }
  if(d.delacerto){ apagarItem(d.mes||ui.month,"transf",d.delacerto,"Acerto apagado."); return; }
  if(d.irano){ ui.irAno=Number(d.irano); render(); anunciar("Imposto de Renda de "+d.irano+"."); return; }
  if(d.dicaok){ fechaDica(d.dicaok,b); return; }
  if(d.topo){ window.scrollTo({top:0,behavior:semMovimento()?"auto":"smooth"}); const m=document.getElementById("conteudo"); if(m) m.focus({preventScroll:true}); return; }
  if(d.export){ exportar(); return; }
  if(d.month){ goMonth(d.month); return; }
  if(d.mescal){ openSheet("meses",null,{ano:kY(ui.month),sel:ui.month}); return; }
  if(d.nav){ passo(Number(d.nav)); return; }
  if(d.open){ ui.tab="mes"; goMonth(d.open); window.scrollTo({top:0}); return; }
  if(d.vertag){ openSheet("busca",null,{q:"#"+d.vertag}); return; }
  if(d.vertodasrec){ ui.verTodasRec=ui.verTodasRec===d.vertodasrec?null:d.vertodasrec; render(); return; }
  if(d.vercats){ const abrindo=!ui.verCats; ui.verCats=abrindo; render(); if(!abrindo){ const c=document.querySelector("[data-vercats]"); if(c) c.closest(".card").scrollIntoView({block:"start",behavior:"smooth"}); } return; }
  if(d.vertodas){ const abrindo=ui.verTodas!==d.vertodas; ui.verTodas=abrindo?d.vertodas:null; render(); if(!abrindo){ const c=document.querySelector(".listaresumo"); if(c) c.closest(".card").scrollIntoView({block:"start",behavior:"smooth"}); } return; }
  if(d.verquit){ ui.verQuit=!ui.verQuit; render(); return; }
  if(d.novo&&d.calc){ openSheet("calc",null,{calc:d.calc}); return; }
  if(d.novo){ openSheet(d.novo,null,d.ctipo?{ctTipo:d.ctipo}:d.cxtipo?{cxTipo:d.cxtipo}:d.pinmodo?{pinModo:d.pinmodo}:d.dtipo?{dTipo:d.dtipo}:null); return; }
  if(d.addregra){ const pi=/** @type {HTMLInputElement|null} */(document.getElementById("rg-pal")), ci=/** @type {HTMLSelectElement|null} */(document.getElementById("rg-cat"));
    const pal=lePalavras(pi&&pi.value)[0], ct=ci&&state.config.categorias.find(c=>c.id===ci.value);
    if(!pal||!ct){ toast("Escreva a palavra da regra (pelo menos 2 letras)."); if(pi) pi.focus(); return; }
    const ja=state.config.categorias.find(c=>(c.palavras||[]).some(p=>limpaPal(p)===limpaPal(pal)));
    if(ja) ja.palavras=ja.palavras.filter(p=>limpaPal(p)!==limpaPal(pal));
    ct.palavras=(ct.palavras||[]).concat(pal).slice(0,40); save("config"); render(); toast("Regra criada: “"+pal+"” vai para "+ct.nome+"."+(ja&&ja!==ct?" (saiu de "+ja.nome+")":""));
    setTimeout(()=>{ const x=document.getElementById("rg-pal"); if(x) x.focus({preventScroll:true}); },50); return; }
  if(d.edit){ openSheet(d.edit,d.id,Object.assign({},d.mes?{mes:d.mes}:{},d.foco?{foco:d.foco}:{})); return; }
  if(d.busca){ openSheet("busca"); return; }
  if(d.planilha){ exportarPlanilha(); return; }
  if(d.copialink){ const u=location.href; (navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>toast("Link copiado. Cole no Chrome ou Safari.")).catch(()=>prompt("Copie o link:",u)); return; }
  if(d.apagar==="pedir"){ ui.confirmaApagar=true; render(); const el=document.getElementById("txtApagar"); if(el) el.focus(); return; }
  if(d.apagar==="nao"){ ui.confirmaApagar=false; render(); return; }
  if(d.apagar==="sim"){ const el=document.getElementById("txtApagar"); if(!el||el.value.trim().toUpperCase()!=="APAGAR"){ toast("Digite APAGAR para confirmar."); if(el) el.focus(); return; } apagarTudo(); return; }
  if(d.delfixo){ excluirFixo(d.delfixo,ui.month); return; }
  if(d.pago){ const o=getMonth(ui.month).fixos[d.pago]||{}; marcaPago("fixo",d.pago,ui.month,!o.pago); return; }
  if(d.gpago){ const g=getMonth(d.mes||ui.month).gastos.find(x=>x.id===d.gpago); if(g) marcaGastoPago(d.mes||ui.month,d.gpago,!g.pago); return; }
  if(d.pagar){ pagarPend(d.pagar); return; }
  if(d.salcaiu){ openSheet("salario",null,{mes:todayKey}); return; }
  if(d.saldesfaz){ desfazSal(todayKey); return; }
  if(d.avisos){ openSheet("avisos"); return; }
  if(d.semana){ openSheet("semana",null,{fim:ultimoDomingo()}); return; }
  if(d.caldia){ openSheet("dia",null,{dia:Number(d.caldia)}); return; }
  if(d.status){ toast(statusTxt); return; }
  if(d.tutorial){ abrirTutorial(); return; }
  if(d.retro){ openSheet("retro",null,{ano:Number(d.retro),slide:0}); return; }
  if(d.calendario){ exportarCalendario(); return; }
  if(d.delcat){ apagarItem("config","categorias",d.delcat,"Campo retirado."); return; }
  if(d.addcat){ const id="c"+uidGen(); state.config.categorias.push({id,nome:"Novo gasto",orcamento:0}); save("config"); render(); const el=document.getElementById("cn-"+id); if(el){ el.focus(); el.select(); } return; }
});
app.addEventListener("change",e=>{
  const t=e.target, money=()=>t.value.trim()===""?0:parseMoney(t.value);
  if(t.name==="a11ytexto"){ a11y.texto=Number(t.value)||1; salvaA11y(); render(); anunciar("Tamanho do texto alterado."); return; }
  if(t.dataset&&t.dataset.a11y){ const k=t.dataset.a11y; if(k in a11y&&typeof a11y[k]==="boolean"){ a11y[k]=!!t.checked; salvaA11y(); render(); anunciar((t.checked?"Ligado: ":"Desligado: ")+((t.closest("label")||{}).querySelector?t.closest("label").querySelector("b").textContent:"")); } return; }
  if(t.name==="ptema"){ tema=t.value; try{localStorage.setItem("meucaixa.tema",tema)}catch(e){} aplicaTema(); render(); return; }
  if(t.name==="lmodo"){ ui.loginModo=t.value; render(); return; }
  if(t.id==="tx-ipca"||t.id==="tx-cdi"){ const v=lerTaxa(t.value), kk=t.id.slice(3); if(!(v>-20&&v<100)){ toast("Taxa inválida. Use, por exemplo, 4,5"); t.value=String(taxas[kk]).replace(".",","); return; }
    taxas[kk]=Math.round(v*100)/100; salvaTaxas(); render(); anunciar((kk==="ipca"?"IPCA":"CDI")+" de referência: "+pctTxt(taxas[kk])+" ao ano."); return; }
  if(t.id==="pinBio"){ if(t.checked) ligarBio(); else desligarBio(); return; }
  if(t.id==="pinApos"){ const c=pinCfg(); if(c){ c.apos=Number(t.value)||0; salvaPinCfg(c); toast("Pronto."); } return; }
  if(t.id==="t-li"){ const b=document.getElementById("t-aceitar"); if(b) b.disabled=!t.checked; return; }
  if(t.id==="impFile"&&t.files&&t.files[0]){ importar(t.files[0]); return; }
  if(t.dataset&&t.dataset.fatpaga){ marcaPago("fat",t.dataset.fatpaga,ui.month,t.checked); return; }
  if(t.id==="notifOn"){ ligaNotif(t.checked); return; }
  if(t.id==="filtroCat"){ ui.filtro=t.value; render(); return; }
  if(t.id==="salMes"){ const v=t.value.trim()===""?null:parseMoney(t.value); if(v!==null&&isNaN(v)){ toast("Valor inválido. Use, por exemplo, 2.800,00"); return; } getMonth(ui.month).salario=v; save(ui.month); if(v>0&&!state.config.salarioPadrao){ setTimeout(()=>toast("Salário de "+abrMes(ui.month)+" salvo.","Repetir todo mês",()=>{ state.config.salarioPadrao=v; save("config"); render(); toast("Pronto: "+brl(v)+" entra todo mês. Dá para mudar no Perfil."); }),60); } render(); return; }
  if(t.id==="cfSal"||t.id==="cfSaldo"||t.id==="cfCx"){ const v=money(); if(isNaN(v)){ toast("Valor inválido. Use, por exemplo, 2.800,00"); return; } state.config[{cfSal:"salarioPadrao",cfSaldo:"saldoInicial",cfCx:"saldoCaixinha"}[t.id]]=v;
    if(t.id==="cfSal"&&v>0&&!inicioKey()){ state.config.inicio=MESES.includes(todayKey)?todayKey:MESES[0]; toast("Controle começa em "+nomeMes(state.config.inicio).toLowerCase()+"."); }
    save("config"); render(); return; }
  if(t.id==="cfSalTipo"||t.id==="cfSalDia"||t.id==="cfSalDia2"||t.id==="cfSalModo"){ const sd=cfgSal();
    if(t.id==="cfSalTipo"){ sd.tipo=t.value; if(sd.tipo==="util") sd.dia=Math.min(sd.dia,20); }
    else if(t.id==="cfSalModo") sd.off=!t.checked;
    else { const n=Math.round(Number(t.value)); if(!(n>=1&&n<=31)){ toast("Use um dia entre 1 e 31."); render(); return; } sd[t.id==="cfSalDia"?"dia":"dia2"]=sd.tipo==="util"&&t.id==="cfSalDia"?Math.min(n,20):n; }
    state.config.salarioDia=sd; save("config"); render(); return; }
  if(t.id==="cfInicio"){ state.config.inicio=t.value||null; save("config"); if(!mesesVisiveis().includes(ui.month)) ui.month=todayKey; render(); return; }
  if(t.dataset.catname){ const c=state.config.categorias.find(c=>c.id===t.dataset.catname); if(c){ c.nome=t.value.trim()||"Sem nome"; save("config"); render(); } return; }
  if(t.dataset.catorc){ const c=state.config.categorias.find(c=>c.id===t.dataset.catorc), v=money(); if(c&&!isNaN(v)){ c.orcamento=Math.max(0,v); save("config"); render(); } return; }
});
document.addEventListener("keydown",e=>{
  if(e.key!=="Tab") return; const box=tutAberto?document.querySelector("#tutorial .tutbox"):ui.sheet?document.querySelector("#sheet .sheet"):null; if(!box||travado) return;
  const f=[...box.querySelectorAll('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled&&x.offsetParent!==null&&x.type!=="hidden"); if(!f.length) return;
  const i=f.indexOf(document.activeElement); if(e.shiftKey&&(i<=0)){ e.preventDefault(); f[f.length-1].focus(); } else if(!e.shiftKey&&(i===-1||i===f.length-1)){ e.preventDefault(); f[0].focus(); }
});
document.addEventListener("keydown",e=>{
  if(travado||tutAberto) return;
  if(e.key==="Escape"&&ui.sheet){ closeSheet(); return; }
  if(ui.sheet&&ui.sheet.tipo==="retro"&&(e.key==="ArrowRight"||e.key==="ArrowLeft")){ const b=document.querySelector(e.key==="ArrowRight"?'#sheet [data-rpasso="1"]':'#sheet [data-rpasso="-1"]'); if(b&&!b.disabled) b.click(); return; }
  const tag=(e.target.tagName||"").toLowerCase(); if(tag==="input"||tag==="select"||tag==="textarea"||ui.sheet||e.ctrlKey||e.metaKey||e.altKey) return;
  if(mode==="login"||!state.loaded) return;
  if(e.key==="/"){ e.preventDefault(); openSheet("busca"); return; }
  if(ui.tab!=="mes") return;
  if(e.key==="n"||e.key==="N"){ e.preventDefault(); openSheet("gasto"); }
  else if(e.key==="ArrowLeft") passo(-1);
  else if(e.key==="ArrowRight") passo(1);
});
const PUXA_LIM=80;
let puxa=null, atualizando=false;
function indPuxa(){ let el=document.getElementById("puxa"); if(!el){ el=document.createElement("div"); el.id="puxa"; el.className="puxa"; el.setAttribute("aria-hidden","true");
  el.innerHTML=`<span class="puxa-ic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg></span><span class="puxa-t"></span>`; document.body.appendChild(el); } return el; }
function mostraPuxa(dy,txt,cls){ const el=indPuxa(); el.className="puxa on"+(cls?" "+cls:""); el.style.transform="translate(-50%,"+Math.round(Math.min(dy,PUXA_LIM*1.4)*.6-56)+"px)";
  el.style.setProperty("--giro",Math.min(1,dy/PUXA_LIM)*180+"deg"); const t=el.querySelector(".puxa-t"); if(t) t.textContent=txt; }
function somePuxa(){ const el=document.getElementById("puxa"); if(!el) return; el.className="puxa"; el.style.transform=""; }
async function atualizaDados(){
  if(atualizando) return; atualizando=true; mostraPuxa(PUXA_LIM,"Atualizando…","gira"); vibra(14);
  try{ if(mode==="cloud"&&fb){ await salvaPendentes(); await abrirEspaco(); } else { if(mode==="local") loadLocal(); render(); } anunciar("Dados atualizados."); }
  catch(e){ console.error(e); toast("Não foi possível atualizar agora."); }
  finally{ setTimeout(()=>{ atualizando=false; somePuxa(); },semMovimento()?0:450); }
}
app.addEventListener("touchstart",e=>{ puxa=null; if(atualizando||ui.sheet||tutAberto||mode==="login"||!state.loaded||e.touches.length!==1||window.scrollY>0) return;
  if(e.target.closest("input,select,textarea,.tablewrap,.chips")) return; puxa={y0:e.touches[0].clientY,x0:e.touches[0].clientX,dy:0,ativo:false,pronto:false}; },{passive:true});
app.addEventListener("touchmove",e=>{ const p=puxa; if(!p) return; const dy=e.touches[0].clientY-p.y0, dx=e.touches[0].clientX-p.x0;
  if(!p.ativo){ if(Math.abs(dx)>Math.abs(dy)||dy<0||(desl&&desl.ativo)||window.scrollY>0){ if(Math.abs(dx)>8||dy<-8) puxa=null; return; } if(dy<12) return; p.ativo=true; }
  p.dy=dy; const pronto=dy>=PUXA_LIM; if(pronto&&!p.pronto) vibra(10); p.pronto=pronto; mostraPuxa(dy,pronto?"Solte para atualizar":"Puxe para atualizar",pronto?"pronto":""); },{passive:true});
const soltaPuxa=()=>{ const p=puxa; puxa=null; if(!p||!p.ativo) return; if(p.pronto) atualizaDados(); else somePuxa(); };
app.addEventListener("touchend",soltaPuxa,{passive:true}); app.addEventListener("touchcancel",soltaPuxa,{passive:true});
let tx=null, ty=null;
app.addEventListener("touchstart",e=>{ if(ui.sheet||tutAberto||mode==="login"||!state.loaded||precisaTermos()||e.touches.length!==1||e.target.closest(".chips,.tablewrap,input,select,textarea,.cats,.seg,[data-desliza],.hs-grafwrap,.stories")){ tx=null; return; } tx=e.touches[0].clientX; ty=e.touches[0].clientY; },{passive:true});
app.addEventListener("touchend",e=>{ if(tx===null) return; const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty; tx=null;
  if(!(Math.abs(dx)>70&&Math.abs(dy)<45)||(desl&&desl.ativo)) return;
  if(ui.tab==="mes"){ if(passo(dx<0?1:-1)){ app.classList.remove("slide-l","slide-r"); void app.offsetWidth; app.classList.add(dx<0?"slide-l":"slide-r"); } return; }
  const i=ORDEM_ABAS.indexOf(ui.tab), alvo=ORDEM_ABAS[i+(dx<0?1:-1)]; if(i<0||!alvo) return; vibra(8); setTab(alvo); },{passive:true});
let fabTimer=0, fabSegurou=false;
const ICON_MIC='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>';
/** @param {boolean} foco */
function fechaFabMenu(foco){ const m=document.getElementById("fabmenu"); if(!m) return; m.remove(); fabSegurou=false; const f=/** @type {HTMLElement|null} */(document.querySelector(".bottomnav .fab")); if(f){ f.setAttribute("aria-expanded","false"); if(foco) f.focus({preventScroll:true}); } }
function abreFabMenu(){
  if(mode==="login"||!state.loaded||ui.sheet||document.getElementById("fabmenu")) return;
  const fab=/** @type {HTMLElement|null} */(document.querySelector(".bottomnav .fab")), r=fab?fab.getBoundingClientRect():null;
  const ops=[["gasto","Despesa",icq("seta-baixo")],["avulso","Receita",icq("seta-cima")]].concat(contasMov().length>1?[["transf","Transferência",icq("troca")]]:[]).concat(ReconhecimentoVoz?[["voz","Por voz",ICON_MIC]]:[]);
  const m=document.createElement("div"); m.id="fabmenu"; m.className="fabmenu"+(semMovimento()?"":" entra"); m.setAttribute("role","menu"); m.setAttribute("aria-label","Novo lançamento");
  m.innerHTML=ops.map(([t,l,ic])=>`<button type="button" role="menuitem" data-fabop="${t}"><span class="qi">${ic}</span>${l}</button>`).join("");
  if(r) m.style.bottom=Math.round(innerHeight-r.top+12)+"px";
  document.body.appendChild(m); if(fab) fab.setAttribute("aria-expanded","true");
  vibra(18); const b=/** @type {HTMLElement|null} */(m.querySelector("button")); if(b) b.focus({preventScroll:true}); anunciar("Menu do novo lançamento: "+ops.map(o=>o[1]).join(", ")+".");
}
document.addEventListener("pointerdown",e=>{ const t=e.target; if(!(t instanceof Element)) return;
  if(document.getElementById("fabmenu")&&!t.closest("#fabmenu")) fechaFabMenu(false);
  if(!t.closest(".bottomnav .fab")) return;
  fabSegurou=false; if(e.pointerType==="mouse") return; clearTimeout(fabTimer); fabTimer=setTimeout(()=>{ fabSegurou=true; abreFabMenu(); },450); });
["pointerup","pointercancel"].forEach(ev=>document.addEventListener(ev,()=>clearTimeout(fabTimer)));
document.addEventListener("contextmenu",e=>{ const t=e.target; if(!(t instanceof Element)||!t.closest(".bottomnav .fab")) return; e.preventDefault(); clearTimeout(fabTimer); fabSegurou=true; abreFabMenu(); });
document.addEventListener("click",e=>{ const t=e.target; if(fabSegurou&&t instanceof Element&&t.closest(".bottomnav .fab")){ fabSegurou=false; e.stopPropagation(); e.preventDefault(); } },true);
document.addEventListener("click",e=>{ const t=e.target, b=t instanceof Element&&t.closest("#fabmenu [data-fabop]"); if(!b) return; const op=b.getAttribute("data-fabop"); fabSegurou=false; fechaFabMenu(true);
  if(op==="voz"){ openSheet("gasto"); lancarPorVoz(); return; } openSheet(op); });
document.addEventListener("keydown",e=>{ const m=document.getElementById("fabmenu"); if(!m) return;
  if(e.key==="Escape"){ e.preventDefault(); e.stopImmediatePropagation(); fechaFabMenu(true); return; }
  if(e.key==="Tab"){ fechaFabMenu(false); return; }
  const bs=/** @type {HTMLElement[]} */([...m.querySelectorAll("button")]), i=bs.indexOf(/** @type {HTMLElement} */(document.activeElement));
  const j={ArrowDown:i+1,ArrowRight:i+1,ArrowUp:i-1,ArrowLeft:i-1,Home:0,End:bs.length-1}[e.key]; if(j==null) return;
  e.preventDefault(); e.stopImmediatePropagation(); bs[(j+bs.length)%bs.length].focus(); },true);
