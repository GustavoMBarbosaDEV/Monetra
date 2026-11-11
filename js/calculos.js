// @ts-check
// Contas do mês: cartões, faturas, fixos, parcelas, saldos, metas e orçamento.
"use strict";

function inicioKey(){
  if(state.config.inicio) return state.config.inicio;
  const ks=Object.keys(state.months).filter(k=>{ const m=state.months[k]; return m&&((typeof m.salario==="number"&&m.salario>0)||(m.avulsos&&m.avulsos.length)); }).sort();
  return ks[0]||null;
}
const ativo=k=>{ const i=inicioKey(); return !!i&&k>=i; };
const entre=(a,b)=>(kY(b)-kY(a))*12+(kM(b)-kM(a));
const cartaoOk=c=>!!(c&&c.fecha&&c.vence);
const cartoesOk=()=>state.config.cartoes.filter(cartaoOk);
const cartaoAtivo=()=>cartoesOk().length>0;
const cartaoDe=x=>state.config.cartoes.find(c=>c.id===(x&&x.cartaoId))||state.config.cartoes[0]||null;
function faturaMes(compraK,dia,cartao){
  const c=cartao===undefined?state.config.cartoes[0]:cartao;
  if(!cartaoOk(c)) return compraK;
  const fechaK=dia<Math.min(c.fecha,diasMes(compraK))?compraK:shiftKey(compraK,1);
  return c.vence>c.fecha?fechaK:shiftKey(fechaK,1);
}
const noCartao=g=>g.forma==="credito"&&cartaoOk(cartaoDe(g));
function faturaPaga(m,cid){ if(!m) return false; if(m.faturasPagas&&cid in m.faturasPagas) return !!m.faturasPagas[cid]; return !!m.faturaPaga&&state.config.cartoes[0]&&state.config.cartoes[0].id===cid; }
function fixosDoMes(k){
  if(!ativo(k)) return [];
  const m=state.months[k], ov=(m&&m.fixos)||{}, dim=diasMes(k);
  return state.config.fixos.filter(f=>f.desde<=k&&(!f.ate||k<=f.ate)).map(f=>{
    const o=ov[f.id]||{};
    return {id:f.id, fixo:true, desc:f.nome, cat:f.cat, forma:f.forma, contaId:f.contaId||null, dia:Math.min(f.dia,dim), valor:(typeof o.valor==="number")?o.valor:f.valor, padrao:f.valor, pago:!!o.pago, pular:!!o.pular};
  }).sort((a,b)=>a.dia-b.dia);
}
function rendasDoMes(k){
  if(!ativo(k)) return [];
  const m=state.months[k], ov=(m&&m.rendas)||{};
  const dimR=diasMes(k);
  return state.config.rendas.filter(r=>r.desde<=k&&(!r.ate||k<=r.ate)).map(r=>{ const o=ov[r.id]||{}; return {id:r.id,nome:r.nome,dia:Math.min(Number(r.dia)||1,dimR),contaId:r.contaId||null,valor:(typeof o.valor==="number")?o.valor:r.valor,padrao:r.valor,pular:!!o.pular}; });
}
/**
 * @param {MesKey} k
 * @returns {ParcelaMes[]}
 */
function parcelasDoMes(k){
  const dim=diasMes(k), out=[];
  state.config.parcelas.forEach(p=>{
    const cc=p.forma==="credito"?cartaoDe(p):null, cartao=cartaoOk(cc);
    const primeiro=cartao?faturaMes(p.compra,p.dia,cc):p.compra, i=entre(primeiro,k);
    if(i<0||i>=p.n) return;
    const valor=valorParcela(p.total,p.n,i);
    const o=((state.months[k]||{}).parcelas||{})[p.id]||{};
    const dia=cartao?Math.min(cc.vence,dim):Math.min(p.venc||p.dia,dim);
    out.push({id:p.id,parcela:true,idx:i+1,n:p.n,desc:p.desc,cat:p.cat,sub:p.sub||null,tags:p.tags||[],forma:p.forma,contaId:p.contaId||null,cartaoId:cc?cc.id:null,dia,valor,total:p.total,compra:p.compra,cartao,pago:!!o.pago,pagoEm:typeof o.pagoEm==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(o.pagoEm)?o.pagoEm:null});
  });
  return out;
}
function cartaoDoMes(k){
  const avista=faturaDoMes(k).filter(x=>!x.parcela);
  ((state.months[k]||{}).gastos||[]).filter(g=>g.forma==="credito"&&!noCartao(g)).forEach(g=>avista.push(Object.assign({},g,{compraK:k})));
  const parc=parcelasDoMes(k).filter(p=>p.forma==="credito");
  return avista.concat(parc).sort((a,b)=>a.dia-b.dia);
}
/**
 * @param {MesKey} k
 * @param {string} [cid]
 * @returns {ItemMes[]}
 */
function faturaDoMes(k,cid){
  if(!cartaoAtivo()) return [];
  const out=[];
  for(let j=0;j<=2;j++){ const ck=shiftKey(k,-j), m=state.months[ck]; if(!m) continue;
    m.gastos.forEach(g=>{ if(g.forma!=="credito") return; const c=cartaoDe(g); if(!cartaoOk(c)||(cid&&c.id!==cid)) return; if(faturaMes(ck,g.dia,c)===k) out.push(Object.assign({},g,{compraK:ck,cartaoId:c.id})); }); }
  parcelasDoMes(k).filter(p=>p.cartao&&(!cid||p.cartaoId===cid)).forEach(p=>out.push(Object.assign({},p,{compraK:p.compra})));
  return out;
}
function usoCartao(c){
  let usado=0;
  Object.keys(state.months).forEach(mk=>{ ((state.months[mk]||{}).gastos||[]).forEach(g=>{ if(g.forma==="credito"&&!g.pago&&cartaoDe(g)&&cartaoDe(g).id===c.id) usado+=Number(g.valor)||0; }); });
  state.config.parcelas.forEach(p=>{ if(p.forma!=="credito"||!cartaoDe(p)||cartaoDe(p).id!==c.id) return;
    const prim=cartaoOk(c)?faturaMes(p.compra,p.dia,c):p.compra;
    for(let i=0;i<p.n;i++){ const mk=shiftKey(prim,i); const o=((state.months[mk]||{}).parcelas||{})[p.id]||{}; if(!o.pago) usado+=valorParcela(p.total,p.n,i); } });
  return {usado,limite:c.limite||0,livre:(c.limite||0)-usado};
}
function despesasDoMes(k){
  const m=state.months[k], manuais=(m?m.gastos:[]).filter(g=>!noCartao(g));
  return /** @type {ItemMes[]} */(manuais).concat(parcelasDoMes(k).filter(p=>!p.cartao), faturaDoMes(k), fixosDoMes(k).filter(f=>!f.pular));
}
const ehBem=c=>!!c&&String(c.tipo||"").startsWith("bem");
const contasMov=()=>state.config.contas.filter(c=>!ehBem(c));
const temContas=()=>contasMov().length>0;
const contaPrincipal=()=>contasMov()[0]||null;
const contaOk=id=>contasMov().some(c=>c.id===id)?id:(contaPrincipal()||{}).id;
const nomeConta=id=>{ const c=contasMov().find(x=>x.id===contaOk(id)); return c?c.nome:""; };
const saldoInicialTotal=()=>temContas()?soma(contasMov().map(c=>({valor:c.saldoInicial}))):state.config.saldoInicial;
/**
 * @param {MesKey} k
 * @returns {Object<string,number>}
 */
function saldosContas(k){
  /** @type {Object<string,number>} */
  const S={}; contasMov().forEach(c=>S[c.id]=Number(c.saldoInicial)||0);
  if(!temContas()) return S;
  const add=(id,v)=>{ const c=contaOk(id); if(c) S[c]=(S[c]||0)+(Number(v)||0); };
  for(const mk of MESES){ if(mk>k) break;
    const m=normMonth(state.months[mk]||{}), c=calc(mk);
    add(state.config.contaSalario,c.salario);
    rendasDoMes(mk).filter(r=>!r.pular).forEach(r=>add(r.contaId,r.valor));
    m.avulsos.forEach(x=>add(x.contaId,x.valor));
    m.gastos.filter(g=>!noCartao(g)).forEach(g=>add(g.forma==="credito"?null:g.contaId,-g.valor));
    parcelasDoMes(mk).filter(p=>!p.cartao).forEach(p=>add(p.contaId,-p.valor));
    fixosDoMes(mk).filter(f=>!f.pular).forEach(f=>add(f.contaId,-f.valor));
    faturaDoMes(mk).forEach(x=>{ const cc=state.config.cartoes.find(y=>y.id===x.cartaoId); add(cc&&cc.contaId,-x.valor); });
    m.caixinha.forEach(x=>add(x.contaId,x.tipo==="guardar"?-x.valor:x.valor));
    m.transf.filter(t=>t.tipo!=="acerto").forEach(t=>{ add(t.de,-t.valor); add(t.para,t.valor); });
  }
  return S;
}
const soma=(arr,f)=>arr.reduce((a,x)=>a+(Number(f?f(x):x.valor)||0),0);
/**
 * @param {MesKey} k
 * @returns {CalcMes}
 */
function calc(k){
  const m=normMonth(state.months[k]||{});
  const salario=m.avulsos.some(x=>x.sal)?0:m.salario??(ativo(k)?state.config.salarioPadrao:0);
  const avulsos=soma(m.avulsos), rendas=soma(rendasDoMes(k).filter(r=>!r.pular));
  const lista=despesasDoMes(k), despesas=soma(lista);
  const fixos=fixosDoMes(k).filter(f=>!f.pular);
  const fixosTotal=soma(fixos), fixosPend=soma(fixos.filter(f=>!f.pago));
  const fatura=soma(faturaDoMes(k));
  const guardado=soma(m.caixinha.filter(x=>x.tipo==="guardar")), retirado=soma(m.caixinha.filter(x=>x.tipo==="retirar"));
  const c2=v=>Math.round(v*100)/100, receitas=c2(salario+avulsos+rendas), saldo=c2(receitas-despesas-guardado+retirado);
  const dim=diasMes(k);
  let porDia=null, porDiaSub="";
  if(k===todayKey){ const rest=dim-today.getDate()+1; porDia=Math.max(0,saldo)/rest; porDiaSub=rest+(rest===1?" dia restante":" dias restantes, contando hoje"); }
  else if(k>todayKey){ porDia=Math.max(0,saldo)/dim; porDiaSub="dividido pelos "+dim+" dias do mês"; }
  /** @type {Object<string,number>} */
  const porCat={};
  /** @type {Object<string,number>} */
  const porForma={};
  lista.forEach(g=>{ porCat[g.cat]=(porCat[g.cat]||0)+(Number(g.valor)||0); const f=g.forma||"?"; porForma[f]=(porForma[f]||0)+(Number(g.valor)||0); });
  return {salario,avulsos,rendas,despesas,receitas,saldo,guardado,retirado,porDia,porDiaSub,porCat,porForma,dim,fixosTotal,fixosPend,fatura,pct:receitas>0?despesas/receitas:0};
}
function caixinhaAte(k){ let s=state.config.saldoCaixinha; for(const x of MESES){ const c=calc(x); s+=c.guardado-c.retirado; if(x===k) break; } return s; }
function saldoMeta(id,k){
  let s=0; Object.keys(state.months).forEach(mk=>{ if(k&&mk>k) return; ((state.months[mk]||{}).caixinha||[]).forEach(x=>{ if(x.metaId===id) s+=(x.tipo==="guardar"?1:-1)*(Number(x.valor)||0); }); });
  return s;
}
function infoMeta(mt,k){
  const saldo=saldoMeta(mt.id,k), falta=Math.max(0,mt.alvo-saldo), pct=mt.alvo>0?Math.min(1,saldo/mt.alvo):0;
  const meses=mt.prazo?Math.max(1,entre(todayKey,mt.prazo)+1):null;
  return {saldo,falta,pct,meses,porMes:meses?falta/meses:null,atrasada:!!mt.prazo&&mt.prazo<todayKey&&falta>0,feita:mt.alvo>0&&falta<=0};
}
const nomeMeta=id=>{ const m=state.config.metas.find(x=>x.id===id); return m?m.nome:"Geral"; };
/**
 * @param {MesKey} k
 * @param {CalcMes} [c]
 * @returns {Previsao|null}
 */
function previsaoMes(k,c){
  if(k!==todayKey||!ativo(k)) return null;
  c=c||calc(k); const dim=c.dim, dia=today.getDate(), rest=dim-dia;
  if(dia<3||rest<1) return null;
  const grande=c.receitas>0?c.receitas*0.2:Infinity;
  const ate=((state.months[k]||{}).gastos||[]).filter(g=>(Number(g.dia)||1)<=dia), gs=ate.filter(g=>(Number(g.valor)||0)<=grande), foraRitmo=ate.length-gs.length;
  const caixa=gs.filter(g=>!noCartao(g)), cartao=gs.filter(g=>noCartao(g));
  const rCaixa=soma(caixa)/dia, rCartao=soma(cartao)/dia;
  const porCat={}; caixa.forEach(g=>{ porCat[g.cat]=(porCat[g.cat]||0)+(Number(g.valor)||0); });
  const r2=v=>Math.round(v*100)/100;
  return {dia,rest,dim,ritmo:r2(rCaixa),extra:r2(rCaixa*rest),saldo:r2(c.saldo-rCaixa*rest),cartao:r2(rCartao*rest),foraRitmo,grande,ritmoCat:id=>(porCat[id]||0)/dia};
}
/**
 * @param {Categoria|null|undefined} ct
 * @param {MesKey} k
 * @returns {number}
 */
function sobraCat(ct,k){
  if(!ct||!ct.sobra||!(ct.orcamento>0)) return 0;
  const desde=ct.sobraDesde||k; if(desde>=k) return 0;
  let carry=0;
  for(let mk=desde, n=0; mk<k&&n<120; mk=shiftKey(mk,1), n++){ if(!ativo(mk)) continue; const lim=ct.orcamento+carry, g=calc(mk).porCat[ct.id]||0; carry=Math.max(0,Math.round((lim-g)*100)/100); }
  return carry;
}
const limiteCat=(ct,k)=>ct&&ct.orcamento>0?Math.round((ct.orcamento+sobraCat(ct,k))*100)/100:0;
function alertasOrcamento(k){
  const c=calc(k), pv=previsaoMes(k,c);
  return state.config.categorias.filter(ct=>ct.orcamento>0).map(ct=>{ const v=c.porCat[ct.id]||0, o=limiteCat(ct,k), p=v/o;
    let nivel=p>=1?"passou":p>=0.8?"80":"", proj=null, diaEstoura=null;
    if(pv&&pv.dia>=5&&p<1){ const r=pv.ritmoCat(ct.id); proj=Math.round((v+r*pv.rest)*100)/100;
      if(r>0&&proj>o){ diaEstoura=Math.min(pv.dim,pv.dia+Math.max(1,Math.ceil((o-v)/r))); if(!nivel) nivel="ritmo"; } }
    return {id:ct.id,nome:ct.nome,v,o,p,nivel,proj,diaEstoura}; }).filter(x=>x.nivel).sort((a,b)=>Number(a.nivel==="ritmo")-Number(b.nivel==="ritmo")||b.p-a.p);
}
function textoAlerta(a){ if(a.nivel==="ritmo") return "No ritmo de hoje, "+a.nome+" estoura o limite no dia "+a.diaEstoura+" ("+brl(a.v)+" de "+brl(a.o)+" até agora).";
  return a.nivel==="passou"?a.nome+" passou do limite: "+brl(a.v)+" de "+brl(a.o)+".":a.nome+" chegou a "+Math.round(a.p*100)+"% do limite ("+brl(a.v)+" de "+brl(a.o)+")"+(a.diaEstoura?"; no ritmo de hoje, estoura no dia "+a.diaEstoura:"")+"."; }
function acumulado(k){ let s=saldoInicialTotal(); for(const x of MESES){ s+=calc(x).saldo; if(x===k) break; } return s; }
function variacao(atual,anterior){ if(!(anterior>0)) return ""; const p=(atual-anterior)/anterior; if(Math.abs(p)<0.005) return "igual ao mês anterior"; return (p>0?"▲ ":"▼ ")+Math.round(Math.abs(p)*100)+"% vs "+abrMes(shiftKey(ui.month,-1)); }

