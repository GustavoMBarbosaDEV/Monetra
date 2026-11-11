// @ts-check
// Regras de categoria e lançamento rápido por texto.
"use strict";
const semAcento=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const limpaPal=t=>semAcento(t).replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim();
/**
 * @param {string} texto
 * @returns {string|null}
 */
function regraCat(texto){
  const t=" "+limpaPal(texto)+" "; if(t.trim()==="") return null;
  let melhor=null, tam=0;
  for(const ct of state.config.categorias) for(const p of (ct.palavras||[])){ const w=limpaPal(p); if(w&&w.length>tam&&t.includes(" "+w)){ melhor=ct.id; tam=w.length; } }
  return melhor;
}
const lePalavras=v=>[...new Set(String(v||"").split(/[,;\n]+/).map(x=>x.trim().replace(/\s+/g," ")).filter(x=>x.length>=2).map(x=>x.slice(0,30)))].slice(0,40);
const RAP_KW={carrinho:/^(mercado|supermercado|feira|padaria|acougue|hortifruti|atacad|assai|carrefour|sacolao)/,cafe:/^(cafe|lanche|salgado|cafeteria)/,taca:/^(ifood|restaurante|pizza|hamburguer|burger|bar|cerveja|cinema|show|rappi|lanchonete|almoco|jantar|delivery|netflix|spotify|streaming)/,
  carro:/^(uber|99|taxi|gasolina|combustivel|posto|alcool|etanol|estacionamento|pedagio|onibus|metro|passagem|oficina)/,saude:/^(farmacia|remedio|medico|consulta|dentista|exame|drogaria|academia)/,casa:/^(aluguel|condominio|iptu|reforma|moveis)/,
  raio:/^(luz|energia|agua|internet|gas|telefone|conta)/,celular:/^(celular|recarga|chip|plano)/,livro:/^(escola|curso|faculdade|livro|material|mensalidade)/,sacola:/^(roupa|sapato|tenis|shopping|loja|shein|shopee|amazon|mercadolivre|presente)/,pata:/^(pet|racao|veterinario|petshop)/};
function interpretaRapido(txt){
  const out={valor:null,cat:null,sub:null,forma:null,cartao:null,dia:null,mes:null,n:null,desc:"",por:[]};
  let t=" "+String(txt||"").trim()+" ";
  const hoje=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  const tira=re=>{ const m=t.match(re); if(m) t=t.replace(m[0]," "); return m; };
  let m=tira(/\s(\d{1,2})\s?x(?=\s)/i); if(m){ const n=+m[1]; if(n>=2&&n<=48) out.n=n; }
  const poeData=d=>{ out.dia=d.getDate(); out.mes=keyOf(d.getFullYear(),d.getMonth()+1); };
  if(tira(/\s(anteontem)(?=\s)/i)) poeData(new Date(hoje.getTime()-2*864e5));
  else if(tira(/\s(ontem)(?=\s)/i)) poeData(new Date(hoje.getTime()-864e5));
  else if(tira(/\s(hoje)(?=\s)/i)) poeData(hoje);
  else if((m=tira(/\s(\d{1,2})\/(\d{1,2})(?=\s)/))){ const d=+m[1], mm=+m[2]; if(d>=1&&d<=31&&mm>=1&&mm<=12){ let y=hoje.getFullYear(); if(keyOf(y,mm)>shiftKey(todayKey,2)) y--; const k=keyOf(y,mm); out.mes=k; out.dia=Math.min(d,diasMes(k)); } }
  else if((m=tira(/\sdia\s(\d{1,2})(?=\s)/i))){ const d=+m[1]; if(d>=1&&d<=31){ out.mes=ui.month; out.dia=Math.min(d,diasMes(ui.month)); } }
  m=tira(/\s(?:r\$\s?)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?:\s?reais)?(?=\s)/i);
  if(m){ const raw=m[1]; const v=/\.\d{3}(,|$)/.test(raw)?Number(raw.replace(/\./g,"").replace(",",".")):Number(raw.replace(",",".")); if(v>0) out.valor=Math.round(v*100)/100; }
  const palavras=t.split(/\s+/).filter(Boolean), resto=[];
  palavras.forEach(w=>{ const n=semAcento(w).replace(/[^a-z0-9]/g,"");
    if(!out.forma&&/^pix$/.test(n)) out.forma="pix";
    else if(!out.forma&&/^(debito|deb)$/.test(n)) out.forma="debito";
    else if(!out.forma&&/^(credito|cartao|cc|cred)$/.test(n)) out.forma="credito";
    else if(!out.forma&&/^(dinheiro|especie|cash)$/.test(n)) out.forma="dinheiro";
    else if(!out.forma&&/^boleto$/.test(n)) out.forma="boleto";
    else if(n&&state.config.cartoes.some(c=>semAcento(c.nome).replace(/[^a-z0-9]/g,"")===n)){ out.forma="credito"; out.cartao=state.config.cartoes.find(c=>semAcento(c.nome).replace(/[^a-z0-9]/g,"")===n).id; }
    else if(!/^(no|na|em|de|do|da|com|pelo|pela|e|o|a)$/.test(n)||!resto.length) resto.push(w); });
  while(resto.length&&/^(no|na|em|de|do|da|com|pelo|pela|e)$/i.test(semAcento(resto[resto.length-1]))) resto.pop();
  out.desc=resto.join(" ").slice(0,80); if(out.desc) out.desc=out.desc[0].toUpperCase()+out.desc.slice(1);
  const chaves=resto.map(w=>semAcento(w).replace(/[^a-z0-9]/g,"")).filter(w=>w.length>=2);
  const porRegra=out.desc?regraCat(out.desc):null; if(porRegra){ out.cat=porRegra; out.por.push("sua regra"); }
  if(chaves.length&&!out.cat){
    const cont={}, formas={}; Object.keys(state.months).sort().reverse().slice(0,12).forEach(mk=>((state.months[mk]||{}).gastos||[]).forEach(g=>{ const d=semAcento(g.desc); if(!d) return; if(chaves.some(w=>d.split(/[^a-z0-9]+/).includes(w))){ if(catIndex(g.cat)>=0) cont[g.cat]=(cont[g.cat]||0)+1; if(g.forma) formas[g.forma]=(formas[g.forma]||0)+1; } }));
    const melhor=Object.keys(cont).sort((a,b)=>cont[b]-cont[a])[0];
    if(melhor){ out.cat=melhor; out.por.push("histórico"); if(!out.forma){ const f=Object.keys(formas).sort((a,b)=>formas[b]-formas[a])[0]; if(f){ out.forma=f; out.formaHist=true; } } }
    if(!out.cat) for(const ct of state.config.categorias){ const nomes=semAcento(ct.nome).split(/[^a-z0-9]+/).filter(x=>x.length>=3);
      const sub=(ct.subs||[]).find(x=>chaves.some(w=>w.length>=3&&semAcento(x.nome).startsWith(w)));
      if(sub){ out.cat=ct.id; out.sub=sub.id; break; }
      if(chaves.some(w=>w.length>=3&&nomes.some(nm=>nm.startsWith(w)||w.startsWith(nm)))){ out.cat=ct.id; break; } }
    if(!out.cat){ const ic=Object.keys(RAP_KW).find(k=>chaves.some(w=>RAP_KW[k].test(w))); if(ic){ const alt={cafe:["cafe","taca","carrinho"],celular:["celular","raio"],pata:["pata","sacola"],livro:["livro"],saude:["saude"]}[ic]||[ic];
      for(const k of alt){ const ct=state.config.categorias.find(c=>catIc(c.id)===k); if(ct){ out.cat=ct.id; break; } } } }
  }
  return out;
}
function previaRapido(r){
  if(!r||!r.valor) return `<span class="muted">Comece pelo valor: <b>45 ifood</b>, <b>120 mercado ontem pix</b>, <b>600 tv 3x crédito</b></span>`;
  const forma=r.forma||ui.gForma||"pix", cat=r.cat||(ui.gCat&&catIndex(ui.gCat)>=0?ui.gCat:state.config.categorias[0]?.id);
  const quando=r.mes&&(r.mes!==mesSheet()||r.dia!==(mesSheet()===todayKey?today.getDate():1))?pad2(r.dia)+"/"+pad2(kM(r.mes)):(mesSheet()===todayKey?"hoje":"dia 01");
  return `<b>${brl(r.valor)}</b>${r.n?` em ${r.n}x`:""} · <span style="--dot:${catColor(cat)}" class="rp-cat">${svgCat(catIc(cat),13)}${esc(catName(cat))}${r.cat?"":" (padrão)"}</span> · ${esc(formaNome(forma))}${r.cartao?" "+esc((state.config.cartoes.find(c=>c.id===r.cartao)||{}).nome||""):""} · ${quando}${r.desc?` · “${esc(r.desc)}”`:""}<small>Já preenchido no formulário abaixo · Enter para salvar</small>`;
}
function aplicaRapido(salvar,silencioso){
  const inp=document.getElementById("s-rapido"); if(!inp) return false;
  const r=interpretaRapido(inp.value); if(!r.valor){ if(!silencioso) erroSheet("Escreva o valor primeiro. Ex.: 45 ifood","s-rapido"); return false; }
  const ev=el=>{ if(!el) return; el.dispatchEvent(new Event("change",{bubbles:true})); if(silencioso) marcaPreenchido(el); };
  const v=document.getElementById("s-valor"); if(v){ v.value=moneyInput(r.valor); v.dispatchEvent(new Event("input",{bubbles:true})); if(silencioso) marcaPreenchido(v); }
  if(r.cat){ const c=document.getElementById("s-cat-"+r.cat); if(c){ c.checked=true; ev(c); } }
  if(r.sub){ const sb=document.getElementById("s-sub-"+r.sub); if(sb){ sb.checked=true; } }
  if(r.forma){ const f=document.getElementById("s-fm-"+r.forma); if(f){ f.checked=true; ev(f); } }
  if(r.cartao){ const c=document.getElementById("s-cartao"); if(c){ c.value=r.cartao; ev(c); } }
  if(r.mes){ const gm=document.getElementById("s-gmes"); if(gm&&[...gm.options].some(o=>o.value===r.mes)){ gm.value=r.mes; ev(gm); } const ds=document.getElementById("s-dia"); if(ds) ds.value=String(r.dia); }
  if(r.n){ const pc=document.getElementById("s-parc"); if(pc){ pc.checked=true; const bx=document.getElementById("s-parcbox"); if(bx) bx.hidden=false; const n=document.getElementById("s-n"); if(n) n.value=r.n; ev(pc); } }
  const d=document.getElementById("s-desc"); if(d&&r.desc){ d.value=r.desc; if(silencioso) marcaPreenchido(d); }
  if(salvar){ salvarSheet(false); } return true;
}
function marcaPreenchido(el){ const alvo=el.matches('input[type=radio],input[type=checkbox]')?(document.querySelector(`label[for="${el.id}"]`)||el.parentElement):el;
  if(!alvo) return; alvo.classList.remove("rp-ok"); void alvo.offsetWidth; alvo.classList.add("rp-ok"); setTimeout(()=>alvo.classList.remove("rp-ok"),900); }
let _rapT=null;
