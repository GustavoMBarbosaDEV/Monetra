// @ts-check
// Salvar o que foi preenchido nas janelas e os cliques dentro delas.
"use strict";
function atualizaBusca(){
  const el=document.getElementById("s-result"); if(!el) return;
  const q=((document.getElementById("s-busca")||{}).value||"").trim().toLowerCase(); ui.sheet.q=q;
  const dest=q.length>=2||/^\d+º?$/.test(q)?destinosBusca(q):[];
  const blocoDest=dest.length?`<p class="hint">Ir para</p><div class="buscadest">${dest.map(x=>`<button type="button" class="item irpara" data-sir="${x.i}"><span class="ir-ic" aria-hidden="true">${icq("chev",16)}</span><span class="desc"><b>${esc(x.d[0])}</b><small>${esc(x.d[1])}</small></span></button>`).join("")}</div>`:"";
  if(q.length<2){ el.innerHTML=blocoDest||'<p class="hint">Digite pelo menos 2 letras. Dá para buscar telas também, como “cartões” ou “13º”.</p>'; return; }
  const qn=parseMoney(q), res=[];
  const qt=q.startsWith("#")?normTag(q):null;
  const bate=(txt,v,g)=>{ if(qt) return !!(g&&g.tags&&g.tags.some(t=>t.startsWith(qt))); return norm(txt).includes(norm(q))||(qn>0&&Math.abs((Number(v)||0)-qn)<0.005); };
  MESES.slice().reverse().forEach(k=>{ const m=state.months[k]; if(!m) return;
    (m.gastos||[]).forEach(g=>{ if(bate(g.desc+" "+catName(g.cat)+" "+subName(g.cat,g.sub)+" "+(g.tags||[]).map(t=>"#"+t).join(" "),g.valor,g)) res.push({k,tipo:"gasto",id:g.id,t:g.desc||catName(g.cat),s:catName(g.cat)+extraTxt(g)+" · dia "+pad2(g.dia),v:-g.valor}); });
    (m.avulsos||[]).forEach(x=>{ if(bate(x.desc,x.valor)) res.push({k,tipo:"avulso",id:x.id,t:x.desc||"Receita",s:"receita · dia "+pad2(x.dia),v:x.valor}); });
    (m.caixinha||[]).forEach(x=>{ if(bate(x.desc+" caixinha",x.valor)) res.push({k,tipo:"caixinha",id:x.id,t:x.desc||"Caixinha",s:(x.tipo==="guardar"?"guardou":"retirou")+" · dia "+pad2(x.dia),v:x.tipo==="guardar"?-x.valor:x.valor}); });
  });
  state.config.parcelas.forEach(p=>{ if(bate(p.desc+" "+catName(p.cat)+" "+subName(p.cat,p.sub)+" parcela "+(p.tags||[]).map(t=>"#"+t).join(" "),p.total,p)) res.push({k:p.compra,tipo:"parcela",id:p.id,t:p.desc||"Compra parcelada",s:p.n+"x · "+catName(p.cat)+extraTxt(p),v:-p.total}); });
  state.config.fixos.forEach(f=>{ if(bate(f.nome+" "+catName(f.cat)+" fixa",f.valor)) res.push({k:null,tipo:"fixo",id:f.id,t:f.nome,s:"conta fixa · dia "+pad2(f.dia),v:-f.valor}); });
  el.innerHTML=blocoDest+(res.length?`<p class="hint">${res.length} resultado${res.length===1?"":"s"}</p>`+res.slice(0,60).map(x=>`<button type="button" class="item" data-sres="${x.tipo}" data-id="${esc(x.id)}" data-mes="${x.k||""}"><span class="pill">${x.k?esc(abrMes(x.k)):"fixa"}</span><span class="desc"><b>${esc(x.t)}</b><small>${esc(x.s)}</small></span><span class="v ${x.v>0?"pos":""}">${brl(Math.abs(x.v))}</span></button>`).join(""):(blocoDest?"":'<p class="hint">Nada encontrado.</p>'));
}
function erroSheet(msg,campo){ salvando=false; const e=document.getElementById("s-erro"); if(e){ e.textContent=msg; e.hidden=false; } if(campo){ const c=document.getElementById(campo); if(c) c.focus(); } }
const TIPOS_COM_ITEM=["bem","desafio","viagem","gasto","avulso","caixinha","fixo","fixoMes","parcela","renda","rendaMes","categoria","meta","conta","cartao","transf","divida"];
let salvando=false;
const campoTexto=id=>{ const el=/** @type {HTMLInputElement|null} */(document.getElementById(id)); return el?el.value:""; };
function salvarSheet(outro){
  const s=ui.sheet, k=mesSheet(); if(!s) return;
  if(s.id&&TIPOS_COM_ITEM.includes(s.tipo)&&!itemAtual()){ closeSheet(); render(); toast("Este item foi apagado (talvez em outro aparelho)."); return; }
  if(salvando) return; salvando=true; setTimeout(()=>{ salvando=false; },350);
  if(s.tipo==="busca") return;
  if(s.tipo==="monebot"){ salvando=false; mbPergunta(campoTexto("mb-perg")); return; }
  if(s.tipo==="pin"){ salvarPin(); return; }
  if(s.tipo==="retro") return;
  if(s.tipo==="vincular"){ salvaSenhaConta(); return; }
  if(s.tipo==="salario"){
    const v=parseMoney((document.getElementById("s-valor")||{}).value); if(!(v>0)) return erroSheet("Digite quanto caiu na conta.","s-valor");
    const m=getMonth(k), dia=Number(valSel("s-dia"))||1, ct=valSel("s-conta")||state.config.contaSalario, ant=m.avulsos.filter(x=>x.sal), antes=m.salario;
    const falta=!!(/** @type {HTMLInputElement|null} */(document.getElementById("s-falta"))||{checked:false}).checked;
    const faltaAntes=ant.filter(x=>x.falta).map(x=>x.id); ant.forEach(x=>{ delete x.falta; });
    const av=marcaPor({id:uidGen(),dia,valor:v,desc:ant.length?"Salário (outra parte)":"Salário",sal:true}); if(falta) av.falta=true; if(ct) av.contaId=ct;
    m.salario=0; m.avulsos.push(av); save(k); closeSheet(); render(); vibra(20);
    anunciar("Salário de "+brl(v)+" registrado."); if(window.mbEvento) window.mbEvento("salario_caiu",{partes:ant.length+1});
    toast((ant.length?"Outra parte de ":"Salário de ")+brl(v)+" registrado."+(falta?" Aviso de novo quando a outra parte cair.":""),"Desfazer",()=>{ const a=getMonth(k); a.avulsos=a.avulsos.filter(x=>x.id!==av.id); marcaApagado(k,av.id); a.avulsos.forEach(x=>{ if(faltaAntes.includes(x.id)) x.falta=true; }); if(!a.avulsos.some(x=>x.sal)) a.salario=antes; save(k); render(); toast("Desfeito."); });
    return;
  }
  if(s.tipo==="viagem"){
    const nome=((document.getElementById("s-nome")||{}).value||"").trim(); if(!nome) return erroSheet("Dê um nome para a viagem.","s-nome");
    const inicio=(document.getElementById("s-vini")||{}).value||"", fim=(document.getElementById("s-vfim")||{}).value||"";
    if(!inicio||!fim) return erroSheet("Informe as datas de ida e de volta.",inicio?"s-vfim":"s-vini");
    if(fim<inicio) return erroSheet("A volta não pode ser antes da ida.","s-vfim");
    const moeda=(document.getElementById("s-vmoeda")||{}).value||"USD", cot=moeda==="BRL"?1:lerCot((document.getElementById("s-vcot")||{}).value);
    if(!(cot>0)) return erroSheet("Informe a cotação: quanto vale 1 "+moeda+" em reais (ex.: 5,40).","s-vcot");
    const tx=(document.getElementById("s-vtaxa")||{}).value.trim(), taxa=tx===""?0:lerCot(tx); if(tx!==""&&!(taxa>=0&&taxa<50)) return erroSheet("Taxa inválida. Ex.: 4,38","s-vtaxa");
    const ov=(document.getElementById("s-valor")||{}).value.trim(), orcamento=ov===""?0:parseMoney(ov);
    const d={nome,inicio,fim,moeda,cotacao:cot,taxa:taxa||0,orcamento:orcamento>0?orcamento:0};
    if(s.id) Object.assign(itemAtual(),d); else state.config.viagens.push(Object.assign({id:"v"+uidGen()},d));
    save("config"); closeSheet(); render(); toast(s.id?"Viagem atualizada.":"Viagem "+nome+" criada. Nos dias da viagem, a despesa já abre como gasto da viagem."); return;
  }
  if(s.tipo==="divida"){
    const pessoa=((document.getElementById("s-pessoa")||{}).value||"").trim(); if(!pessoa) return erroSheet("Quem é a pessoa?","s-pessoa");
    const vv=(document.getElementById("s-valor")||{}).value||"", valor=parseMoney(vv); if(!(valor>0)) return erroSheet("Informe o valor","s-valor");
    const tipo=(document.querySelector('#sheet input[name="s-dtipo"]:checked')||{}).value||"receber";
    const desc=((document.getElementById("s-desc")||{}).value||"").trim(), data=(document.getElementById("s-ddata")||{}).value||hojeISO(), venc=(document.getElementById("s-dvenc")||{}).value||null;
    if(s.id){ const x=itemAtual(); if(valor+0.005<pagoDiv(x)) return erroSheet("O valor não pode ser menor do que já foi pago ("+brl(pagoDiv(x))+").","s-valor"); Object.assign(x,{pessoa,valor,tipo,desc,data,venc}); }
    else state.config.dividas.push({id:"d"+uidGen(),pessoa,tipo,valor,desc,data,venc,pags:[]});
    save("config"); closeSheet(); render(); toast(s.id?"Dívida atualizada.":tipo==="receber"?pessoa+" te deve "+brl(valor)+".":"Você deve "+brl(valor)+" a "+pessoa+"."); return;
  }
  if(s.tipo==="importar"){ if(s.itens) importarExtrato(); else if(s.pedeSenha) tentaSenhaPDF(); return; }
  if(s.tipo==="excluirconta"){
    if(campoTexto("s-excluir").trim().toUpperCase()!=="EXCLUIR") return erroSheet("Digite EXCLUIR para confirmar.","s-excluir");
    const bt=/** @type {HTMLButtonElement|null} */(document.querySelector('#sheet button[type="submit"]')); if(bt){ bt.disabled=true; bt.textContent="Excluindo…"; }
    excluirConta().catch(e=>{ console.error("Excluir conta:",e&&e.code); if(bt){ bt.disabled=false; bt.textContent="Excluir minha conta para sempre"; }
      erroSheet(e&&e.message&&!e.code?e.message:"Não foi possível excluir agora ("+((e&&e.code)||"erro")+"). Confira a internet e tente de novo."); });
    return;
  }
  if(s.tipo==="bksenha"){
    const a=campoTexto("s-senha")||"", b=campoTexto("s-senha2")||"";
    if(a.length<8) return erroSheet("Use uma senha com pelo menos 8 caracteres.","s-senha");
    if(a!==b) return erroSheet("As duas senhas não são iguais.","s-senha2");
    const bt=/** @type {HTMLButtonElement|null} */(document.querySelector('#sheet button[type="submit"]')); if(bt){ bt.disabled=true; bt.textContent="Criptografando…"; }
    cifraBackup(textoBackup(),a).then(txt=>{ salvaInfoBackup({ultimo:hojeISO(),depois:null}); baixaArquivo("monetra-backup-"+new Date().toISOString().slice(0,10)+"-protegido.json",txt); closeSheet(); render(); toast("Backup com senha baixado."); })
      .catch(()=>{ if(bt){ bt.disabled=false; bt.textContent="Baixar backup com senha"; } erroSheet("Não consegui criptografar neste navegador."); });
    return;
  }
  if(s.tipo==="bkabrir"){
    const senha=campoTexto("s-senha")||""; if(!senha) return erroSheet("Digite a senha do backup.","s-senha");
    const arquivo=s.arquivo, bt=/** @type {HTMLButtonElement|null} */(document.querySelector('#sheet button[type="submit"]')); if(bt){ bt.disabled=true; bt.textContent="Abrindo…"; }
    decifraBackup(arquivo,senha).then(txt=>{ let b; try{ b=validaBackup(JSON.parse(txt)); }catch(e){ if(bt){ bt.disabled=false; bt.textContent="Restaurar backup"; } erroSheet((e&&e.message?e.message:"Backup inválido.")+" Nada foi alterado."); return; }
        const msg=aplicaBackup(b); closeSheet(); ui.importMsg=msg; render(); anunciar(msg); toast(msg); })
      .catch(()=>{ if(bt){ bt.disabled=false; bt.textContent="Restaurar backup"; } erroSheet("Senha errada ou arquivo corrompido. Nada foi alterado.","s-senha"); });
    return;
  }
  if(s.tipo==="bem"){
    const nome=((document.getElementById("s-nome")||{}).value||"").trim(); if(!nome) return erroSheet("Dê um nome, ex.: Apartamento","s-nome");
    const vb=parseMoney((document.getElementById("s-valor")||{}).value); if(!(vb>0)) return erroSheet("Informe quanto vale, ex.: 250.000,00","s-valor");
    const tipo=(document.querySelector('#sheet input[name="s-tipobem"]:checked')||{}).value||"bem-outro";
    if(s.id) Object.assign(itemAtual(),{nome,tipo,saldoInicial:vb}); else state.config.contas.push({id:"b"+uidGen(),nome,tipo,saldoInicial:vb});
    save("config"); closeSheet(); render(); toast(s.id?"Bem atualizado.":nome+" entrou no patrimônio."); return;
  }
  if(s.tipo==="conta"){
    const nome=((document.getElementById("s-nome")||{}).value||"").trim(); if(!nome) return erroSheet("Dê um nome para a conta, ex.: Nubank","s-nome");
    const si=(document.getElementById("s-valor")||{}).value.trim(), saldoI=si===""?0:parseMoney(si); if(isNaN(saldoI)) return erroSheet("Saldo inválido","s-valor");
    const tipo=(document.querySelector('#sheet input[name="s-tipoconta"]:checked')||{}).value||"corrente";
    let ct; if(s.id){ ct=itemAtual(); Object.assign(ct,{nome,tipo,saldoInicial:saldoI}); } else { ct={id:"a"+uidGen(),nome,tipo,saldoInicial:saldoI}; state.config.contas.push(ct); }
    const rec=document.getElementById("s-recebe").checked; if(rec) state.config.contaSalario=ct.id; else if(state.config.contaSalario===ct.id) state.config.contaSalario=null;
    save("config"); closeSheet(); render(); toast(s.id?"Conta atualizada.":"Conta "+nome+" criada."); return;
  }
  if(s.tipo==="cartao"){
    const nome=((document.getElementById("s-nome")||{}).value||"").trim(); if(!nome) return erroSheet("Dê um nome para o cartão, ex.: Nubank","s-nome");
    const dd=id=>{ const n=Math.round(Number((document.getElementById(id)||{}).value)); return n>=1&&n<=31?n:null; };
    const fecha=dd("s-fecha"), vence=dd("s-vence"); if(!fecha||!vence) return erroSheet("Informe o dia de fechamento e o de vencimento (1 a 31).","s-fecha");
    const lv=(document.getElementById("s-valor")||{}).value.trim(), limite=lv===""?0:parseMoney(lv); if(isNaN(limite)) return erroSheet("Limite inválido","s-valor");
    const d={nome,fecha,vence,limite,contaId:valSel("s-conta")};
    if(s.id) Object.assign(itemAtual(),d); else state.config.cartoes.push(Object.assign({id:"k"+uidGen()},d));
    save("config"); closeSheet(); render(); toast(s.id?"Cartão atualizado.":"Cartão "+nome+" cadastrado: compras no crédito contam no mês da fatura."); return;
  }
  if(s.tipo==="transf"){
    const v=parseMoney((document.getElementById("s-valor")||{}).value); if(!(v>0)) return erroSheet("Digite o valor da transferência","s-valor");
    const de=valSel("s-de"), para=valSel("s-para"); if(!de||!para||de===para) return erroSheet("Escolha duas contas diferentes.","s-para");
    const dia=Number(valSel("s-dia"))||1, desc=((document.getElementById("s-desc")||{}).value||"").trim(), m=getMonth(k);
    if(s.id) Object.assign(itemAtual(),{valor:v,de,para,dia,desc}); else m.transf.push({id:uidGen(),valor:v,de,para,dia,desc});
    save(k); closeSheet(); render(); toast(brl(v)+" de "+nomeConta(de)+" para "+nomeConta(para)+"."); return;
  }
  if(s.tipo==="desafio"){
    const nome=((document.getElementById("s-nome")||{}).value||"").trim(); if(!nome) return erroSheet("Dê um nome para o desafio.","s-nome");
    const tipo=(document.querySelector('#sheet input[name="s-dtipo"]:checked')||{}).value==="max"?"max":"sem";
    const valor=tipo==="max"?parseMoney((document.getElementById("s-valor")||{}).value):0; if(tipo==="max"&&!(valor>0)) return erroSheet("Digite o valor máximo, ex.: 200,00","s-valor");
    const cat=valSel("s-dcat")||null, palavras=((document.getElementById("s-dpal")||{}).value||"").trim().slice(0,80);
    if(!cat&&!palavrasDes({palavras}).length) return erroSheet("Escolha uma categoria ou escreva pelo menos uma palavra.","s-dpal");
    const dias=Math.min(365,Math.max(1,Number(valSel("s-ddias"))||30)), ini=(document.getElementById("s-dini")||{}).value||hojeISO();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(ini)) return erroSheet("Data de início inválida.","s-dini");
    /** @type {any} */
    const d={nome,tipo,valor:valor||0,cat,palavras,dias,inicio:ini};
    if(!state.config.desafios) state.config.desafios=[];
    if(s.id) Object.assign(itemAtual(),d); else state.config.desafios.push(Object.assign({id:"d"+uidGen()},d));
    save("config"); closeSheet(); render(); toast(s.id?"Desafio atualizado.":"Desafio começou! Boa sorte."); return;
  }
  if(s.tipo==="meta"){
    const nome=((document.getElementById("s-nome")||{}).value||"").trim(); if(!nome) return erroSheet("Dê um nome para a meta.","s-nome");
    const alvo=parseMoney((document.getElementById("s-valor")||{}).value); if(!(alvo>0)) return erroSheet("Digite quanto quer juntar, ex.: 3.000,00","s-valor");
    const pz=(document.getElementById("s-prazo")||{}).value||""; const prazo=/^\d{4}-\d{2}$/.test(pz)?pz:null;
    if(s.id) Object.assign(itemAtual(),{nome,alvo,prazo}); else state.config.metas.push({id:"m"+uidGen(),nome,alvo,prazo});
    save("config"); closeSheet(); render();
    const mt=state.config.metas.find(x=>x.nome===nome&&x.alvo===alvo), info=mt?infoMeta(mt,null):null;
    toast(s.id?"Meta atualizada.":"Meta criada"+(info&&info.porMes?": guarde "+brl(info.porMes)+" por mês.":".")); return;
  }
  if(s.tipo==="categoria"){
    const nome=((document.getElementById("s-nome")||{}).value||"").trim(); if(!nome) return erroSheet("Dê um nome para a categoria.","s-nome");
    const lv=(document.getElementById("s-valor")||{}).value.trim(), lim=lv===""?0:parseMoney(lv); if(isNaN(lim)||lim<0) return erroSheet("Limite inválido. Ex.: 600,00","s-valor");
    const cor=Number((document.querySelector('#sheet input[name="s-cor"]:checked')||{}).value)||0;
    const nova=((document.getElementById("s-subnova")||{}).value||"").trim();
    const subs=[...document.querySelectorAll("#s-sublista .subnome")].map(i=>({id:i.dataset.subid||("s"+uidGen()),nome:i.value.trim()})).filter(x=>x.nome);
    if(nova) subs.push({id:"s"+uidGen(),nome:nova});
    const icSel=(document.querySelector('#sheet input[name="s-ic"]:checked')||{}).value||null, ic=icSel&&ICAT[icSel]?icSel:null;
    const sobraOn=!!(document.getElementById("s-sobra")||{}).checked&&lim>0, antes=s.id?itemAtual():null;
    const sobraDesde=sobraOn?(antes&&antes.sobra&&antes.sobraDesde?antes.sobraDesde:todayKey):null;
    const palavras=lePalavras((document.getElementById("s-palavras")||{}).value);
    if(s.id) Object.assign(itemAtual(),{nome,orcamento:lim,cor,subs,ic,sobra:sobraOn,sobraDesde,palavras}); else state.config.categorias.push({id:"c"+uidGen(),nome,orcamento:lim,cor,subs,ic,sobra:sobraOn,sobraDesde,palavras});
    save("config"); closeSheet(); render(); toast(s.id?"Categoria atualizada.":"Categoria "+nome+" criada."); return;
  }
  const v=parseMoney((document.getElementById("s-valor")||{}).value);
  const val=id=>(document.getElementById(id)||{}).value, radio=n=>(document.querySelector(`#sheet input[name="${n}"]:checked`)||{}).value;
  const desc=(val("s-desc")||"").trim(), dia=Number(val("s-dia"))||1;
  if(s.tipo==="fixoMes"||s.tipo==="rendaMes"){
    if(!(v>=0)) return erroSheet("Digite um valor válido, ex.: 99,90","s-valor");
    const mapa=s.tipo==="fixoMes"?"fixos":"rendas", m=getMonth(k), o=Object.assign({},m[mapa][s.id]||{});
    if(s.tipo==="fixoMes"){ const pg=document.getElementById("s-pago").checked; if(pg&&!o.pago){ const h=new Date(); o.pagoEm=h.getFullYear()+"-"+pad2(h.getMonth()+1)+"-"+pad2(h.getDate()); } o.pago=pg; }
    const base=state.config[mapa].find(x=>x.id===s.id);
    if(base&&Math.abs(v-base.valor)<0.005) delete o.valor; else o.valor=v;
    m[mapa][s.id]=o; save(k); closeSheet(); render(); toast(o.pago?"Conta marcada como paga.":"Atualizado para "+abrMes(k)+"."); return;
  }
  if(s.tipo==="fixo"||s.tipo==="renda"){
    const nome=(val("s-nome")||"").trim(); if(!nome) return erroSheet(s.tipo==="fixo"?"Dê um nome para a conta, ex.: Aluguel":"Dê um nome, ex.: Bolsa","s-nome");
    if(!(v>0)) return erroSheet("Digite o valor por mês, ex.: 1.200,00","s-valor");
    const lista=s.tipo==="fixo"?"fixos":"rendas";
    /** @type {any} */
    const d=s.tipo==="fixo"?{nome,valor:v,dia:Math.min(31,Math.max(1,Math.round(Number(val("s-diafixo"))||1))),cat:radio("s-cat")||"",forma:radio("s-forma")||"boleto",desde:val("s-desde")||k}:{nome,valor:v,dia:Math.min(31,Math.max(1,Math.round(Number(val("s-diarenda"))||1))),desde:val("s-desde")||k};
    const ct=valSel("s-conta"); d.contaId=ct||null;
    if(s.id) Object.assign(itemAtual(),d); else state.config[lista].push(Object.assign({id:(s.tipo==="fixo"?"f":"r")+uidGen(),ate:null},d));
    save("config"); closeSheet(); render(); toast(s.id?"Atualizado.":(s.tipo==="fixo"?"Conta fixa criada. Ela entra sozinha todo mês.":"Renda fixa criada. Ela entra sozinha todo mês.")); return;
  }
  if(s.tipo==="parcela"){
    const n=Math.round(Number(val("s-n"))||0); if(!(v>0)) return erroSheet("Digite o valor total da compra","s-valor"); if(n<2||n>48) return erroSheet("Escolha de 2 a 48 parcelas","s-n");
    const cat=radio("s-cat"); if(!cat) return erroSheet("Escolha uma categoria para a compra.");
    const vc=Math.round(Number(val("s-venc"))||0), it=itemAtual();
    Object.assign(it,{total:v,n,desc,cat,forma:radio("s-forma")||"credito"}); if(vc>=1&&vc<=31) it.venc=vc;
    if(it.forma==="credito"){ delete it.contaId; const c2=valSel("s-cartao"); if(c2) it.cartaoId=c2; } else { delete it.cartaoId; const c3=valSel("s-conta"); if(c3) it.contaId=c3; else delete it.contaId; }
    save("config");
    const sw=document.getElementById("s-ppago"); if(sw){ marcaPago("parc",it.id,k,sw.checked,true); }
    closeSheet(); render(); toast("Compra parcelada atualizada."); return;
  }
  if(!(v>0)) return erroSheet("Digite um valor maior que zero, ex.: 25,90","s-valor");
  const m=getMonth(k);
  if(s.tipo==="gasto"){
    const cat=radio("s-cat"), forma=radio("s-forma")||"";
    if(!cat) return erroSheet("Escolha uma categoria para esta despesa.");
    const subSel=radio("s-sub")||null, sub=subSel&&subName(cat,subSel)?subSel:null, tags=lerTags(val("s-tags")), irT=val("s-ir")||"", pagouSel=compartilhado()?val("s-pagou")||"":"";
    const gm=val("s-gmes"), kd=gm&&(MESES.includes(gm)||gm===k)?gm:k, md=getMonth(kd), diaD=Math.min(dia,diasMes(kd)), emMes=kd!==ui.month?" em "+abrMes(kd):"";
    const vgOn=(document.getElementById("s-vgon")||{}).checked, vgSel=vgOn?(state.config.viagens||[]).find(x=>x.id===val("s-vgid")):null, vgMoeda=vgSel&&radio("s-vgmoeda")===vgSel.moeda?vgSel.moeda:"BRL";
    const old=s.id?itemAtual():null, mant=!!(old&&old.orig&&vgSel&&old.viagemId===vgSel.id&&old.orig.moeda===vgMoeda);
    const orig=vgSel&&vgMoeda!=="BRL"?{moeda:vgMoeda,valor:v,cotacao:mant?old.orig.cotacao:vgSel.cotacao,taxa:mant?old.orig.taxa:(vgSel.taxa||0)}:null, vv=orig?emReais(v,orig):v;
    const poeExtra=o=>{ if(IR_IDS.includes(irT)) o.ir=irT; else delete o.ir; if(pagouSel&&pagouSel!==(o.pagou||o.por)) o.pagou=pagouSel; if(sub) o.sub=sub; else delete o.sub; if(tags.length) o.tags=tags; else delete o.tags; if(vgSel) o.viagemId=vgSel.id; else delete o.viagemId; if(orig) o.orig=orig; else delete o.orig; return o; };
    ui.gCat=cat; if(forma){ ui.gForma=forma; try{localStorage.setItem("meucaixa.ui.forma",forma)}catch(e){} }
    const contaSel=forma!=="credito"?valSel("s-conta"):null, cartaoSel=forma==="credito"?valSel("s-cartao"):null;
    if(contaSel) ui.gConta=contaSel; if(cartaoSel) ui.gCartao=cartaoSel;
    const poeCC=o=>{ if(contaSel) o.contaId=contaSel; else delete o.contaId; if(cartaoSel) o.cartaoId=cartaoSel; else if(forma!=="credito") delete o.cartaoId; return o; };
    if(s.id){ const it=itemAtual(); Object.assign(it,{valor:vv,cat,dia:diaD,desc,forma}); poeCC(it); poeExtra(it); const sw=document.getElementById("s-gpago");
      if(forma!=="credito"){ delete it.pago; delete it.pagoEm; } else if(sw&&sw.checked!==!!it.pago){ it.pago=sw.checked; if(sw.checked){ const h=new Date(); it.pagoEm=h.getFullYear()+"-"+pad2(h.getMonth()+1)+"-"+pad2(h.getDate()); } else delete it.pagoEm; }
      if(kd!==k){ const mo=state.months[k]; mo.gastos=mo.gastos.filter(x=>x.id!==it.id); getMonth(kd).gastos.push(it); save(kd); }
      save(k); closeSheet(); render(); toast("Despesa atualizada"+(kd!==k?" e movida para "+abrMes(kd):"")+"."); return; }
    const parc=document.getElementById("s-parc"), n=Math.round(Number(val("s-n"))||0);
    if(parc&&parc.checked){
      if(n<2||n>48) return erroSheet("Escolha de 2 a 48 parcelas","s-n");
      const vc=Math.round(Number(val("s-venc"))||dia);
      const p=poeExtra(marcaPor(poeCC({id:"p"+uidGen(),desc,cat,forma:forma||"credito",total:vv,n,compra:kd,dia:diaD,venc:vc>=1&&vc<=31?vc:diaD})));
      state.config.parcelas.push(p); save("config");
      const fim=()=>toast(n+"x de "+brl(valorParcela(vv,n,0))+" lançado"+emMes+".","Desfazer",()=>apagarItem("config","parcelas",p.id,"Compra parcelada desfeita."));
      if(outro){ ui.sheet={tipo:"gasto",id:null,mes:kd}; renderSheet(); document.getElementById("s-valor").focus(); render(); fim(); } else { closeSheet(); render(); fim(); }
      return;
    }
    const novo=poeExtra(marcaPor(poeCC({id:uidGen(),dia:diaD,cat,valor:vv,desc,forma}))); md.gastos.push(novo); save(kd);
    const al=alertasOrcamento(kd).find(a=>a.id===cat);
    const msg=(orig?fmtMoeda(v,orig.moeda)+" ("+brl(vv)+")":brl(v))+" em "+catName(cat)+" lançado"+emMes+(noCartao(novo)?" (fatura de "+abrMes(faturaMes(kd,diaD,cartaoDe(novo)))+")":"")+(al?" · "+(al.nivel==="passou"?"passou do limite!":al.nivel==="ritmo"?"no ritmo atual estoura o limite no dia "+al.diaEstoura:Math.round(al.p*100)+"% do limite"):"")+".";
    const fim=()=>toast(msg,"Desfazer",()=>apagarItem(kd,"gastos",novo.id,"Lançamento desfeito."));
    if(outro){ ui.sheet={tipo:"gasto",id:null,mes:kd}; renderSheet(); document.getElementById("s-valor").focus(); render(); fim(); } else { closeSheet(); render(); fim(); }
    return;
  }
  if(s.tipo==="avulso"){
    const rep=document.getElementById("s-repete");
    const ctA=valSel("s-conta");
    if(rep&&rep.checked){ state.config.rendas.push({id:"r"+uidGen(),nome:desc||"Renda fixa",valor:v,dia:Math.min(31,Math.max(1,dia||1)),desde:k,ate:null,contaId:ctA}); save("config"); closeSheet(); render(); toast("Renda fixa criada a partir de "+abrMes(k)+"."); return; }
    let av; if(s.id){ av=itemAtual(); Object.assign(av,{valor:v,dia,desc}); } else { av=marcaPor({id:uidGen(),dia,desc,valor:v}); m.avulsos.push(av); }
    if(ctA) av.contaId=ctA; else delete av.contaId;
    save(k); closeSheet(); render(); toast(s.id?"Receita atualizada.":"Receita de "+brl(v)+" lançada."); return;
  }
  if(s.tipo==="caixinha"){
    const tipo=radio("s-cxtipo")||"guardar";
    const metaId=(document.getElementById("s-meta")||{}).value||"";
    if(!s.id&&tipo==="retirar"){
      const disp=metaId?saldoMeta(metaId,null):caixinhaAte(k)-state.config.metas.reduce((a,mt)=>a+Math.max(0,saldoMeta(mt.id,null)),0);
      if(v>disp+0.005) return erroSheet(metaId?"Essa meta só tem "+brl(Math.max(0,disp))+".":(state.config.metas.length?"Na caixinha Geral só tem "+brl(Math.max(0,disp))+". Escolha a meta de onde o dinheiro vai sair.":"A caixinha só tem "+brl(Math.max(0,disp))+"."),"s-valor");
    }
    let item; if(s.id){ item=itemAtual(); Object.assign(item,{valor:v,dia,desc,tipo}); } else { item=marcaPor({id:uidGen(),dia,tipo,valor:v,desc}); m.caixinha.push(item); }
    if(metaId) item.metaId=metaId; else delete item.metaId;
    save(k); closeSheet(); render();
    const mt=state.config.metas.find(x=>x.id===metaId), info=mt?infoMeta(mt,null):null;
    toast((tipo==="guardar"?brl(v)+" guardado":brl(v)+" retirado")+(mt?(tipo==="guardar"?" em ":" de ")+mt.nome+(info.feita?" · meta atingida!":" · "+Math.round(info.pct*100)+"% da meta"):(tipo==="guardar"?" na caixinha":" da caixinha"))+"."); return;
  }
}
function bindSheet(r){
  let apertouFundo=false;
  r.addEventListener("pointerdown",e=>{ apertouFundo=!!(e.target.classList&&e.target.classList.contains("sheet-wrap")); });
  r.addEventListener("click",e=>{
    const b=e.target.closest("[data-sir],[data-asperg],[data-ascat],[data-asvoz],[data-scat],[data-falar],[data-rauto],[data-mesano],[data-messel],[data-mesok],[data-calctipo],[data-calcmeta],[data-simtaxa],[data-simdiv],[data-avsemana],[data-avsal],[data-lg],[data-avaliar],[data-salextra],[data-semnav],[data-avbackup],[data-avbackupdepois],[data-desmodelo],[data-caledit],[data-callancar],[data-vgcot],[data-rtoque],[data-addtag],[data-addsub],[data-delsub],[data-divpag],[data-divquitar],[data-divdelpag],[data-avdiv],[data-avretro],[data-rpasso],[data-rano],[data-rshare],[data-avpagar],[data-avgrupo],[data-avmes],[data-avassin],[data-avperfil],[data-impok],[data-impvoltar],[data-impsenha],[data-sguardarmeta],[data-sexcluirfixo],[data-sfechar],[data-sapagar],[data-sencerrar],[data-spular],[data-sabrir],[data-outro],[data-sres],[data-snovacat],[data-scriacat]");
    if(!b) return;
    if(b.dataset.sfechar!==undefined){ if(b.tagName==="BUTTON"||(e.target===b&&apertouFundo)) closeSheet(); return; }
    const s=ui.sheet, k=mesSheet();
    if(b.dataset.outro){ e.preventDefault(); salvarSheet(true); return; }
    if(b.dataset.impok){ importarExtrato(); return; }
    if(b.dataset.addtag){ const inp=document.getElementById("s-tags"); if(inp){ const ts=lerTags(inp.value); if(!ts.includes(b.dataset.addtag)) ts.push(b.dataset.addtag); inp.value=ts.map(t=>"#"+t).join(" "); } b.remove(); return; }
    if(b.dataset.addsub){ const inp=document.getElementById("s-subnova"), nome=(inp.value||"").trim(); if(!nome){ inp.focus(); return; } const box=document.getElementById("s-sublista"); box.insertAdjacentHTML("beforeend",linhaSub({id:"",nome})); inp.value=""; inp.focus(); return; }
    if(b.dataset.delsub!==undefined){ b.closest(".subrow").remove(); return; }
    if(b.dataset.divpag){ registrarPagDiv(false); return; }
    if(b.dataset.divquitar){ registrarPagDiv(true); return; }
    if(b.dataset.divdelpag){ const x=itemAtual(); if(x){ x.pags=x.pags.filter(p=>p.id!==b.dataset.divdelpag); save("config"); render(); renderSheet(); toast("Pagamento apagado."); } return; }
    if(b.dataset.avdiv){ openSheet("divida",b.dataset.avdiv); return; }
    if(b.dataset.desmodelo){ ui.sheet=Object.assign({},ui.sheet,{mod:b.dataset.desmodelo}); renderSheet(); return; }
    if(b.dataset.caledit){ openSheet("gasto",b.dataset.caledit); return; }
    if(b.dataset.callancar){ openSheet("gasto",null,{dia:Number(b.dataset.callancar)}); return; }
    if(b.dataset.calctipo){ const sal=(document.getElementById("s-csal")||{}).value; ui.sheet.calc=b.dataset.calctipo; renderSheet(); const n=document.getElementById("s-csal"); if(n&&sal) { n.value=sal; atualizaCalc(); } return; }
    if(b.dataset.calcmeta){ const alvo=parseMoney((document.getElementById("s-calvo")||{}).value||""), meses=Math.round(Number((document.getElementById("s-cprazo")||{}).value)||0), nome=((document.getElementById("s-cnome")||{}).value||"").trim()||"Compra planejada";
      if(alvo>0&&meses>0){ state.config.metas.push({id:"m"+uidGen(),nome:nome.slice(0,40),alvo,prazo:shiftKey(todayKey,meses)}); save("config"); closeSheet(); render(); toast("Meta “"+nome+"” criada. Acompanhe em Ajustes → Metas."); } return; }
    if(b.dataset.simtaxa){ const t=document.getElementById("s-simtaxa"); if(t){ t.value=b.dataset.simtaxa; atualizaSim(); } return; }
    if(b.dataset.simdiv){ const x=(state.config.dividas||[]).find(d=>d.id===b.dataset.simdiv), el=document.getElementById("s-simsaldo"); if(x&&el){ el.value=moneyInput(restaDiv(x)); atualizaSim(); } return; }
    if(b.dataset.avsemana){ openSheet("semana",null,{fim:b.dataset.avsemana}); return; }
    if(b.dataset.avaliar){ try{ localStorage.setItem("mb.avaliar",b.dataset.avaliar==="1"?"1":String(Date.now()+30*864e5)); }catch(e){} setTimeout(()=>renderSheet(),50); return; }
    if(b.dataset.lg){ entrar(b.dataset.lg==="microsoft"?"microsoft":"google",true); return; }
    if(b.dataset.avsal){ openSheet("salario",null,{mes:todayKey}); return; }
    if(b.dataset.salextra){ openSheet("avulso",null,{mes:k}); return; }
    if(b.dataset.mesano){ ui.sheet.ano=(Number(ui.sheet.ano)||kY(ui.month))+Number(b.dataset.mesano); renderSheet(); return; }
    if(b.dataset.messel){ ui.sheet.sel=b.dataset.messel; ui.sheet.ano=kY(b.dataset.messel); renderSheet(); return; }
    if(b.dataset.mesok){ const k=ui.sheet.sel||ui.month; closeSheet(); goMonth(k); window.scrollTo({top:0}); return; }
    if(b.dataset.semnav){ const nf=somaDias(ui.sheet.fim||ultimoDomingo(),Number(b.dataset.semnav)); if(nf<=ultimoDomingo()){ ui.sheet.fim=nf; renderSheet(); } return; }
    if(b.dataset.avretro){ openSheet("retro",null,{ano:Number(b.dataset.avretro),slide:0}); return; }
    if(b.dataset.vgcot){ buscarCotacao(); return; }
    if(b.dataset.falar){ lancarPorVoz(); return; }
    if(b.dataset.rauto){ a11y.retroAuto=!a11y.retroAuto; salvaA11y(); renderSheet(); return; }
    if(b.dataset.rtoque){ const rr=b.getBoundingClientRect(), esq=/** @type {MouseEvent} */(e).clientX&&(/** @type {MouseEvent} */(e).clientX-rr.left)<rr.width/3;
      const nx=document.querySelector(esq?'#sheet [data-rpasso="-1"]':'#sheet [data-rpasso="1"]'); if(nx&&!/** @type {HTMLButtonElement} */(nx).disabled) /** @type {HTMLElement} */(nx).click(); else if(!esq){ const f=document.querySelector('#sheet .sheetbtns [data-sfechar]'); if(f) /** @type {HTMLElement} */(f).click(); } return; }
    if(b.dataset.rpasso){ s.slide=(s.slide||0)+Number(b.dataset.rpasso); renderSheet(); return; }
    if(b.dataset.rano){ s.ano=Number(b.dataset.rano); s.slide=0; renderSheet(); return; }
    if(b.dataset.rshare){ compartilharRetro(); return; }
    if(b.dataset.avpagar){ pagarPend(b.dataset.avpagar); renderSheet(); return; }
    if(b.dataset.avgrupo){ const g=b.dataset.avgrupo; closeSheet(); ui.tab="perfil"; ui.rolarPara="compartilhado"; if(g===aberto) render(); else trocarEspaco(g); return; }
    if(b.dataset.avmes){ closeSheet(); ui.tab="mes"; ui.month=todayKey; render(); window.scrollTo({top:0}); return; }
    if(b.dataset.avassin){ closeSheet(); ui.tab="ano"; ui.rolarPara="assinaturas"; render(); return; }
    if(b.dataset.avbackup){ exportar(); toast("Backup baixado. Guarde o arquivo em um lugar seguro (Drive, e-mail…)."); renderSheet(); render(); return; }
    if(b.dataset.avbackupdepois){ salvaInfoBackup({depois:somaDias(hojeISO(),7)}); toast("Ok, lembro de novo em 7 dias."); renderSheet(); render(); return; }
    if(b.dataset.avperfil){ closeSheet(); ui.tab="perfil"; ui.rolarPara="lembretes"; render(); return; }
    if(b.dataset.impvoltar){ s.itens=null; s.erroImp=""; s.pdfArq=null; s.pedeSenha=false; s.lendo=false; renderSheet(); return; }
    if(b.dataset.impsenha){ tentaSenhaPDF(); return; }
    if(b.dataset.sguardarmeta){ const id=s.id; openSheet("caixinha",null,{cxTipo:"guardar",metaId:id}); return; }
    if(b.dataset.sexcluirfixo){ const id=s.id, apartir=b.dataset.sexcluirfixo==="todos"?null:(s.tipo==="fixoMes"||ui.tab==="mes"?k:todayKey); closeSheet(); excluirFixo(id,apartir); return; }
    if(b.dataset.snovacat){ const bx=document.getElementById("s-novacatbox"); bx.hidden=!bx.hidden; if(!bx.hidden) document.getElementById("s-novacat").focus(); return; }
    if(b.dataset.scriacat){ const inp=document.getElementById("s-novacat"), nome=(inp.value||"").trim(); if(!nome){ inp.focus(); return; }
      const usadas=new Set(state.config.categorias.map(corIdx)), cor=[...Array(NCORES).keys()].find(i=>!usadas.has(i))??0;
      const nova={id:"c"+uidGen(),nome,orcamento:0,cor}; state.config.categorias.push(nova); save("config");
      const valor=(document.getElementById("s-valor")||{}).value, desc=(document.getElementById("s-desc")||{}).value, forma=(document.querySelector('#sheet input[name="s-forma"]:checked')||{}).value, dia=(document.getElementById("s-dia")||{}).value;
      ui.gCat=nova.id; renderSheet();
      if(valor!=null) document.getElementById("s-valor").value=valor; if(desc!=null&&document.getElementById("s-desc")) document.getElementById("s-desc").value=desc; if(dia&&document.getElementById("s-dia")) document.getElementById("s-dia").value=dia; if(forma){ const f=document.getElementById("s-fm-"+forma); if(f) f.checked=true; }
      const r2=document.getElementById("s-cat-"+nova.id); if(r2) r2.checked=true; render(); toast("Categoria "+nome+" criada."); return; }
    if(b.dataset.sir){ irDestino(Number(b.dataset.sir)); return; }
    if(b.dataset.asperg){ mbPergunta(b.dataset.asperg); return; }
    if(b.dataset.ascat){ const [cat,mes]=b.dataset.ascat.split("|"); closeSheet(); render(); openSheet("catmes",null,{cat,mes}); return; }
    if(b.dataset.asvoz){ perguntarPorVoz(); return; }
    if(b.dataset.scat){ const [t,id,mes]=b.dataset.scat.split("|"); closeSheet(); render(); openSheet(t,id,mes?{mes}:null); return; }
    if(b.dataset.sres){ const t=b.dataset.sres, id=b.dataset.id, mes=b.dataset.mes; closeSheet(); ui.tab=t==="fixo"?"ajustes":"mes";
      if(t!=="fixo"&&t!=="parcela"&&mes){ ui.month=mes; render(); openSheet(t,id); } else { render(); openSheet(t,id); } return; }
    if(b.dataset.sapagar){
      const id=s.id; closeSheet();
      if(s.tipo==="parcela") apagarItem("config","parcelas",id,"Compra parcelada apagada.");
      else if(s.tipo==="categoria") apagarItem("config","categorias",id,"Categoria excluída.");
      else if(s.tipo==="conta"){ if(state.config.contaSalario===id) state.config.contaSalario=null; apagarItem("config","contas",id,"Conta excluída (os lançamentos dela passam para a primeira conta)."); }
      else if(s.tipo==="cartao") apagarItem("config","cartoes",id,"Cartão excluído.");
      else if(s.tipo==="bem") apagarItem("config","contas",id,"Bem excluído do patrimônio.");
      else if(s.tipo==="transf") apagarItem(k,"transf",id,"Transferência apagada.");
      else if(s.tipo==="divida") apagarItem("config","dividas",id,"Dívida excluída.");
      else if(s.tipo==="viagem") apagarItem("config","viagens",id,"Viagem excluída (os gastos continuam no mês).");
      else if(s.tipo==="desafio") apagarItem("config","desafios",id,"Desafio excluído.");
      else if(s.tipo==="meta") apagarItem("config","metas",id,"Meta excluída (o dinheiro guardado volta para a caixinha geral).");
      else if(s.tipo==="avulso"&&getMonth(k).avulsos.some(x=>x.id===id&&x.sal)){ if(salRecebido(k).length===1) desfazSal(k); else apagarItem(k,"avulsos",id,"Parte do salário apagada."); }
      else apagarItem(k,s.tipo==="gasto"?"gastos":s.tipo==="avulso"?"avulsos":"caixinha",id,"Lançamento apagado.");
      return;
    }
    if(b.dataset.sencerrar){
      const lista=b.dataset.sencerrar, id=s.id, ate=shiftKey(todayKey,-1); closeSheet();
      const f=state.config[lista].find(x=>x.id===id); if(!f) return; const antes=clone(f);
      if(f.desde>ate){ apagarItem("config",lista,id,(lista==="fixos"?"Conta fixa":"Renda fixa")+" removida."); return; }
      f.ate=ate; save("config"); render();
      toast((lista==="fixos"?"Conta":"Renda")+" encerrada a partir de "+abrMes(todayKey)+".","Desfazer",()=>{ const g=state.config[lista].find(x=>x.id===id); if(g) g.ate=antes.ate; save("config"); render(); toast("Desfeito."); });
      return;
    }
    if(b.dataset.spular){ const mapa=b.dataset.spular, m=getMonth(k), o=Object.assign({},m[mapa][s.id]||{}); o.pular=!o.pular; if(o.pular) o.pago=false; m[mapa][s.id]=o; save(k); closeSheet(); render(); toast(o.pular?"Pulado em "+abrMes(k)+".":"Volta a contar em "+abrMes(k)+"."); return; }
    if(b.dataset.sabrir){ openSheet(b.dataset.sabrir,s.id); return; }
  });
  r.addEventListener("keydown",e=>{ if(e.target.id==="s-rapido"&&e.key==="Enter"){ e.preventDefault(); if(!salvando) aplicaRapido(true); } });
  r.addEventListener("input",e=>{ if(e.target.id==="s-desc"&&ui.sheet&&ui.sheet.tipo==="gasto"&&!ui.sheet.id){ const rc=regraCat(e.target.value), c=rc&&/** @type {HTMLInputElement|null} */(document.getElementById("s-cat-"+rc)); if(c&&!c.checked){ c.checked=true; c.dispatchEvent(new Event("change",{bubbles:true})); marcaPreenchido(c); anunciar("Categoria "+catName(rc)+", pela sua regra."); } }
    if(/^s-sim/.test(e.target.id)){ setTimeout(atualizaSim,0); return; } if(/^s-c/.test(e.target.id)&&ui.sheet&&ui.sheet.tipo==="calc"){ setTimeout(atualizaCalc,0); return; } if(e.target.id==="s-rapido"){ const pv=document.getElementById("s-rapprev"); if(pv) pv.innerHTML=previaRapido(e.target.value.trim()?interpretaRapido(e.target.value):null); clearTimeout(_rapT); _rapT=setTimeout(()=>{ const inp=document.getElementById("s-rapido"); if(inp&&inp.value.trim()){ aplicaRapido(false,true); if(document.activeElement!==inp) inp.focus(); } },250); return; } if(e.target.id==="s-busca") atualizaBusca(); if(["s-valor","s-n"].includes(e.target.id)) atualizaParc(); });
  r.addEventListener("change",e=>{
    if(e.target.name==="s-tipo"){ const v=(document.getElementById("s-valor")||{}).value||""; ui.sheet={tipo:e.target.value,id:null,valorRasc:v,mes:ui.sheet.mes}; renderSheet(); const f=document.querySelector("#sheet [data-autofocus]"); if(f) f.focus(); return; }
    if(e.target.id==="s-parc"||e.target.name==="s-forma"||e.target.id==="s-dia"||e.target.id==="s-cartao") atualizaParc();
    if(e.target.name==="s-forma") atualizaFormaBox();
    if(e.target.name==="s-cat") atualizaSubBox();
    if(e.target.id==="s-cvende"){ const d=document.getElementById("s-cdias"); if(d&&e.target.checked&&Number(d.value)>20) d.value=20; atualizaCalc(); }
    if(e.target.name==="s-dtipo"){ const bx=document.getElementById("s-dvalbox"); if(bx) bx.hidden=e.target.value!=="max"; }
    if(e.target.id==="s-vgon"||e.target.id==="s-vgid"||e.target.name==="s-vgmoeda") atualizaVg();
    if(e.target.id==="s-vmoeda"){ const c=document.getElementById("s-vcot"), l=document.getElementById("s-vcotlab"); if(l) l.textContent="Cotação (1 "+e.target.value+" em R$)"; if(c){ c.value=e.target.value==="BRL"?"1":""; } buscarCotacao(); }
    if(e.target.id==="s-gmes"){ const ds=document.getElementById("s-dia"), km=e.target.value; if(ds){ const d=Number(ds.value)||1; ds.outerHTML=selDia(km,Math.min(d,diasMes(km))); } atualizaParc(); }
    if(e.target.id==="s-arquivo"&&e.target.files&&e.target.files[0]){ abrirArquivoExtrato(e.target.files[0]); return; }
    if(e.target.id==="s-impcartao"){ ui.sheet.cartaoArq=e.target.checked; return; }
    if(e.target.id==="s-impconta"){ ui.sheet.contaImp=e.target.value; return; }
    if(e.target.id==="s-cartao"&&ui.sheet&&ui.sheet.tipo==="importar"){ ui.sheet.cartaoImp=e.target.value; return; }
    if(e.target.dataset.impi!==undefined){ const x=ui.sheet.itens[+e.target.dataset.impi]; x.incluir=e.target.checked; const row=e.target.closest(".imp"); if(row) row.classList.toggle("off",!x.incluir); const bt=document.querySelector("#sheet [data-impok]"); const n=ui.sheet.itens.filter(y=>y.incluir&&!y.bloq).length; if(bt) bt.textContent="Importar "+n+" lançamento"+(n===1?"":"s"); return; }
    if(e.target.dataset.impcat!==undefined){ ui.sheet.itens[+e.target.dataset.impcat].cat=e.target.value; return; }
  });
  r.addEventListener("submit",e=>{ e.preventDefault(); salvarSheet(!!(e.submitter&&e.submitter.dataset.outro)); });
}

