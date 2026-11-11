// @ts-check
// Contas fixas pagas, pendências e card de lembretes.
"use strict";
function excluirFixo(id,apartir){
  const f=state.config.fixos.find(x=>x.id===id); if(!f) return;
  if(!apartir||f.desde>=apartir){ apagarItem("config","fixos",id,"Conta fixa “"+f.nome+"” apagada."); return; }
  const antes=f.ate, novoAte=shiftKey(apartir,-1); f.ate=(f.ate&&f.ate<novoAte)?f.ate:novoAte; save("config"); render();
  toast("“"+f.nome+"” excluída a partir de "+abrMes(apartir)+".","Desfazer",()=>{ const g=state.config.fixos.find(x=>x.id===id); if(g){ g.ate=antes; save("config"); render(); toast("Desfeito."); } });
}
function marcaPago(tipo,id,k,pago,silencioso){
  const m=getMonth(k), hoje=new Date(), data=hoje.getFullYear()+"-"+pad2(hoje.getMonth()+1)+"-"+pad2(hoje.getDate());
  if(tipo==="fat"){ const cid=id&&id!=="fatura"?id:(state.config.cartoes[0]||{}).id; m.faturasPagas=Object.assign({},m.faturasPagas,{[cid]:pago}); if(state.config.cartoes[0]&&cid===state.config.cartoes[0].id) m.faturaPaga=pago;
    parcelasDoMes(k).filter(x=>x.cartao&&x.cartaoId===cid).forEach(x=>{ const o=Object.assign({},m.parcelas[x.id]||{}); o.pago=pago; if(pago) o.pagoEm=data; else delete o.pagoEm; m.parcelas[x.id]=o; });
    faturaDoMes(k,cid).filter(x=>!x.parcela).forEach(x=>{ const g=getMonth(x.compraK).gastos.find(y=>y.id===x.id); if(g){ g.pago=pago; if(pago) g.pagoEm=data; else delete g.pagoEm; if(x.compraK!==k) save(x.compraK); } }); }
  else { const mapa=tipo==="fixo"?"fixos":"parcelas"; const o=Object.assign({},m[mapa][id]||{}); o.pago=pago; if(pago) o.pagoEm=data; else delete o.pagoEm;
    if(pago&&compartilhado()) o.por=uid; else if(!pago) delete o.por;
    m[mapa][id]=o; }
  save(k); if(!silencioso){ render(); toast(pago?"Pagamento registrado.":"Marcado como não pago."); }
}
function marcaGastoPago(k,id,pago){
  const g=getMonth(k).gastos.find(x=>x.id===id); if(!g) return;
  const h=new Date(); g.pago=pago; if(pago) g.pagoEm=h.getFullYear()+"-"+pad2(h.getMonth()+1)+"-"+pad2(h.getDate()); else delete g.pagoEm;
  if(!pago&&noCartao(g)){ const c=cartaoDe(g), fk=faturaMes(k,g.dia,c), mf=getMonth(fk); if(mf.faturasPagas&&mf.faturasPagas[c.id]){ mf.faturasPagas[c.id]=false; save(fk); } }
  save(k); render(); toast(pago?"Despesa do cartão marcada como paga.":"Despesa do cartão marcada como não paga.");
}
function pendencias(){
  if(mode==="login"||!state.loaded) return [];
  const agora=new Date(); agora.setHours(0,0,0,0);
  const kAtual=keyOf(agora.getFullYear(),agora.getMonth()+1), out=[];
  [shiftKey(kAtual,-1),kAtual,shiftKey(kAtual,1)].forEach(k=>{
    const venc=d=>new Date(kY(k),kM(k)-1,d);
    fixosDoMes(k).filter(f=>!f.pular&&!f.pago).forEach(f=>out.push({tipo:"fixo",id:f.id,k,nome:f.desc,valor:f.valor,data:venc(f.dia)}));
    parcelasDoMes(k).filter(p=>!p.cartao&&!p.pago).forEach(p=>out.push({tipo:"parc",id:p.id,k,nome:(p.desc||"Parcela")+" ("+p.idx+"/"+p.n+")",valor:p.valor,data:venc(p.dia)}));
    cartoesOk().forEach(cc=>{ const t=soma(faturaDoMes(k,cc.id)), m=state.months[k]; if(t>0&&!faturaPaga(m,cc.id)) out.push({tipo:"fat",id:cc.id,k,nome:"Fatura "+cc.nome,valor:t,data:venc(Math.min(cc.vence,diasMes(k)))}); });
  });
  return out.map(x=>Object.assign(x,{dd:Math.round((+x.data-+agora)/86400000)})).filter(x=>x.dd<=1).sort((a,b)=>a.dd-b.dd);
}
const fmtData=d=>pad2(d.getDate())+"/"+pad2(d.getMonth()+1);
const estadoPend=x=>x.dd===1?{cls:"amanha",txt:"vence amanhã"}:x.dd===0?{cls:"hoje",txt:"vence hoje"}:{cls:"atraso",txt:"atrasada desde "+fmtData(x.data)};
function cardLembretes(){
  const ps=pendencias(), al=state.loaded&&mode!=="login"?alertasOrcamento(todayKey):[]; if(!ps.length&&!al.length) return "";
  const atr=ps.filter(x=>x.dd<0), hoje=ps.filter(x=>x.dd===0), am=ps.filter(x=>x.dd===1), passou=al.filter(a=>a.nivel==="passou");
  const partes=[]; let cls="info";
  if(atr.length){ partes.push(`<b>${atr.length} conta${atr.length===1?"":"s"} atrasada${atr.length===1?"":"s"}</b> · ${brl(soma(atr))}`); cls="atraso"; }
  if(hoje.length){ partes.push(`<b>${hoje.length} vence${hoje.length===1?"":"m"} hoje</b> · ${brl(soma(hoje))}`); if(cls!=="atraso") cls="hoje"; }
  if(am.length) partes.push(`${am.length} vence${am.length===1?"":"m"} amanhã`);
  const rit=al.filter(a=>a.nivel==="ritmo"), lim=al.filter(a=>a.nivel!=="ritmo");
  if(lim.length){ partes.push(passou.length?`${passou.length} categoria${passou.length===1?"":"s"} passou do limite`:`${lim.length} categoria${lim.length===1?"":"s"} perto do limite`); if(cls==="info") cls="hoje"; }
  if(rit.length) partes.push(rit.length===1?`${esc(rit[0].nome)} estoura o limite no dia ${rit[0].diaEstoura}`:`${rit.length} categorias em ritmo de estourar o limite`);
  return `<button type="button" class="faixa ${cls}" data-avisos="1"><span class="fx-ic">${ICON.sino}</span><span class="fx-t">${partes.map(p=>`<span class="fx-l">${p}</span>`).join("")}</span><span class="fx-ver">Ver</span></button>`;
}
