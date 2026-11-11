// @ts-check
// Importar extrato em OFX, CSV ou PDF.
"use strict";
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim();
function lerArquivoTexto(file){ return file.arrayBuffer().then(buf=>{ try{ return new TextDecoder("utf-8",{fatal:true}).decode(buf); }catch(e){ return new TextDecoder("windows-1252").decode(buf); } }); }
function parseOFX(t){
  const out=[];
  t.split(/<STMTTRN>/i).slice(1).forEach(b=>{
    b=b.split(/<\/STMTTRN>/i)[0];
    const tag=n=>{ const m=b.match(new RegExp("<"+n+">([^<\\r\\n]*)","i")); return m?m[1].trim():""; };
    const d=tag("DTPOSTED"), v=numCSV(tag("TRNAMT")), iso=/^\d{8}/.test(d)?dataOk(d.slice(0,4)+"-"+d.slice(4,6)+"-"+d.slice(6,8)):null;
    if(!iso||!isFinite(v)||v===0) return;
    out.push({data:iso,valor:v,desc:(tag("MEMO")||tag("NAME")).replace(/\s+/g," "),fitid:tag("FITID")});
  });
  return out;
}
function linhaCSV(l,sep){ const r=[]; let cur="",q=false; for(let i=0;i<l.length;i++){ const ch=l[i]; if(ch==='"'){ if(q&&l[i+1]==='"'){ cur+='"'; i++; } else q=!q; } else if(ch===sep&&!q){ r.push(cur); cur=""; } else cur+=ch; } r.push(cur); return r.map(x=>x.trim()); }
function numCSV(s){ s=String(s||"").replace(/R\$|\s/g,""); if(!s) return NaN; const neg=/^\(.*\)$/.test(s)||/-$/.test(s)||/^-/.test(s); s=s.replace(/[()\-+]/g,"");
  if(s.includes(",")&&s.lastIndexOf(",")>s.lastIndexOf(".")) s=s.replace(/\./g,"").replace(",","."); else if(/^\d{1,3}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,""); else s=s.replace(/,/g,"");
  const n=Number(s); return isFinite(n)?(neg?-n:n):NaN; }
const dataOk=iso=>{ const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso||""); if(!m) return null; const mo=+m[2], d=+m[3]; return mo>=1&&mo<=12&&d>=1&&d<=diasMes(m[1]+"-"+m[2])?iso:null; };
function dataCSV(s){ s=String(s||"").trim(); let m=s.match(/^(\d{4})-(\d{2})-(\d{2})/); if(m) return dataOk(m[1]+"-"+m[2]+"-"+m[3]);
  m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/); if(m){ const y=m[3].length===2?"20"+m[3]:m[3]; return dataOk(y+"-"+pad2(m[2])+"-"+pad2(m[1])); } return null; }
function parseCSV(t){
  const linhas=t.replace(/\r/g,"").split("\n").filter(l=>l.trim()); if(linhas.length<2) return {itens:[],cartao:false};
  let hi=linhas.slice(0,15).findIndex(l=>/data|date/i.test(l)); if(hi<0) hi=0;
  const h=linhas[hi], sep=h.split(";").length>h.split(",").length?";":(h.split("\t").length>h.split(",").length?"\t":",");
  const cols=linhaCSV(h,sep).map(norm);
  const iD=cols.findIndex(c=>/^(data|date|dt)/.test(c)||/data/.test(c));
  const achar=res=>{ for(const re of res){ const i=cols.findIndex((c,j)=>j!==iD&&re.test(c)); if(i>=0) return i; } return -1; };
  const iV=achar([/^valor$|^amount$|^value$/,/valor|amount|value|quantia/]), iDesc=achar([/descri/,/title|titulo|historico|memo|estabelecimento|name|nome/,/lancamento/]), iId=achar([/identificador|^id$/]);
  const cartao=cols.includes("title")&&cols.includes("amount");
  const itens=[];
  if(iD<0||iV<0) return {itens,cartao,erro:"Não encontrei as colunas de data e valor neste arquivo."};
  linhas.slice(hi+1).forEach(l=>{ const c=linhaCSV(l,sep), d=dataCSV(c[iD]), v=numCSV(c[iV]); if(!d||!isFinite(v)||v===0) return; itens.push({data:d,valor:v,desc:(iDesc>=0?c[iDesc]:"").replace(/\s+/g," "),fitid:iId>=0?c[iId]:""}); });
  return {itens,cartao};
}
const PDFJS_DIR="vendor/pdfjs-6.5.438/";
/** @type {Promise<any>|null} */
let pdfjsProm=null;
function carregaPdfjs(){
  if(!pdfjsProm) pdfjsProm=import(new URL(PDFJS_DIR+"pdf.min.mjs",document.baseURI).href).then(m=>{ m.GlobalWorkerOptions.workerSrc=new URL(PDFJS_DIR+"pdf.worker.min.mjs",document.baseURI).href; return m; }).catch(e=>{ pdfjsProm=null; throw Object.assign(new Error("pdfjs"),{name:"PdfjsLoad",cause:e}); });
  return pdfjsProm;
}
/** @param {ArrayBuffer} buf @param {string} [senha] */
async function textoPDF(buf,senha){
  const pdfjs=await carregaPdfjs();
  const tarefa=pdfjs.getDocument({data:new Uint8Array(buf),password:senha||undefined,isEvalSupported:false,disableFontFace:true,enableXfa:false,verbosity:0});
  const doc=await tarefa.promise;
  /** @type {string[]} */
  const linhas=[];
  try{
    for(let p=1;p<=Math.min(doc.numPages,80);p++){
      const pg=await doc.getPage(p), tc=await pg.getTextContent();
      /** @type {{y:number,h:number,itens:{x:number,w:number,s:string}[]}[]} */
      const grupos=[];
      tc.items.forEach(/** @param {any} it */ it=>{ if(!it.str||!it.str.trim()) return; const x=it.transform[4], y=it.transform[5], h=Math.abs(it.height||it.transform[3])||8;
        let g=grupos.find(g=>Math.abs(g.y-y)<=Math.max(2,Math.min(g.h,h)*0.45)); if(!g){ g={y,h,itens:[]}; grupos.push(g); } g.itens.push({x,w:it.width||0,s:it.str}); });
      grupos.sort((a,b)=>b.y-a.y).forEach(g=>{ g.itens.sort((a,b)=>a.x-b.x); let t="", fim=-1; g.itens.forEach(i=>{ t+=(fim>=0&&i.x-fim>1?" ":"")+i.s; fim=i.x+i.w; }); t=t.replace(/\s+/g," ").trim(); if(t) linhas.push(t); });
      pg.cleanup();
    }
  }finally{ tarefa.destroy(); }
  return linhas;
}
const MES3={jan:1,fev:2,mar:3,abr:4,mai:5,jun:6,jul:7,ago:8,set:9,out:10,nov:11,dez:12};
const RE_DATA_N=/(^|[^\d])(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?(?![\d\/])/;
const RE_DATA_M=/(^|[^\da-z])(\d{1,2})(?:\s*(?:de\s+|\/|-)?\s*)(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-zç]*\.?(?:\s*(?:de\s+|\/|-)?\s*(\d{4}))?(?![a-z])/;
const RE_VALOR_PDF=/(^|[^\d.,\w$])((?:US\$|USD|U\$)\s?)?([-−–+]?)\s?(R\$)?\s?([-−–]?)\s?(\d[\d.]*,\d{2})(?![\d])(\s?\(?[DC]\)?(?![a-zà-ú]))?/gi;
const PDF_SO_DATA=new Set(["segunda","terca","quarta","quinta","sexta","sabado","domingo","feira","hoje","ontem"]);
const RE_PDF_IGNORA=/\bsaldo\b|\btotal\b|subtotal|limite (total|disponivel|de credito)|pagamento minimo|valor minimo|melhor dia|vencimento|fechamento|fatura anterior|encargos (do|financeiros)|^data\b|lancamentos? futuros|^resumo|^periodo|^pagina|^agencia|^conta\b|\bcpf\b|\bcnpj\b/;
/** @param {string} dd @param {string} mm @param {string|undefined} aa @param {number} anoRef */
function dataPDF(dd,mm,aa,anoRef){
  const d=+dd, mo=+mm; if(!(d>=1&&d<=31&&mo>=1&&mo<=12)) return null;
  let y=aa?(aa.length===2?2000+Number(aa):Number(aa)):anoRef;
  let iso=dataOk(y+"-"+pad2(mo)+"-"+pad2(d));
  if(iso&&!aa){ const lim=new Date(); lim.setDate(lim.getDate()+45); if(new Date(iso+"T12:00:00")>lim) iso=dataOk((y-1)+"-"+pad2(mo)+"-"+pad2(d)); }
  return iso;
}
/** @param {string} l @param {number} anoRef */
function achaDataPDF(l,anoRef){
  const n=norm(l), a=RE_DATA_N.exec(n), b=RE_DATA_M.exec(n);
  const posA=a?a.index+a[1].length:Infinity, posB=b?b.index+b[1].length:Infinity;
  if(a&&posA<=posB){ const iso=dataPDF(a[2],a[3],a[4],anoRef); if(iso) return {iso,ini:posA,fim:a.index+a[0].length}; }
  if(b){ const iso=dataPDF(b[2],String(MES3[/** @type {keyof typeof MES3} */(b[3])]),b[4],anoRef); if(iso) return {iso,ini:posB,fim:b.index+b[0].length}; }
  return null;
}
/** @param {string} l */
function valoresPDF(l){
  /** @type {{v:number,ini:number,fim:number,rs:boolean,sinal:boolean}[]} */
  const out=[]; RE_VALOR_PDF.lastIndex=0; let m;
  while((m=RE_VALOR_PDF.exec(l))){
    const ini=m.index+m[1].length, fim=m.index+m[0].length; if(m[2]) continue;
    const corpo=m[6]; if(!/^\d{1,3}(\.\d{3})*,\d{2}$|^\d+,\d{2}$/.test(corpo)) continue;
    const dc=(m[7]||"").replace(/[\s()]/g,"").toUpperCase(), neg=/[-−–]/.test(m[3]+m[5])||dc==="D";
    const v=numCSV(corpo); if(!isFinite(v)||v===0) continue;
    out.push({v:neg?-v:v,ini,fim,rs:!!m[4],sinal:!!(m[3]||m[5]||dc)});
  }
  return out;
}
/** @param {string[]} linhas */
function parsePDF(linhas){
  const tudo=norm(linhas.join(" "));
  if(tudo.replace(/[^a-z0-9]/g,"").length<20) return {itens:[],cartao:false,erro:"Este PDF não tem texto para ler: parece uma imagem ou um documento escaneado. Baixe o extrato em OFX ou CSV no app do banco."};
  const anos=/** @type {Object<string,number>} */({}); (tudo.match(/\b20\d{2}\b/g)||[]).forEach(a=>{ anos[a]=(anos[a]||0)+1; });
  const anoRef=Number(Object.keys(anos).sort((a,b)=>anos[b]-anos[a])[0])||today.getFullYear();
  const pts=(re,t)=>(t.match(re)||[]).length;
  const cartao=pts(/fatura|cartao de credito|limite (total|disponivel)|pagamento minimo|melhor dia de compra/g,tudo)>pts(/extrato|saldo (anterior|do dia|disponivel|em conta)|conta corrente|agencia/g,tudo);
  /** @type {{data:string,valor:number,desc:string,fitid:string}[]} */
  const itens=[]; let dataCtx="", sinalCtx=0;
  const ls=linhas.map(l=>({l,n:norm(l),dt:achaDataPDF(l,anoRef),vs:valoresPDF(l)}));
  const temSinal=ls.some(x=>x.vs.some(v=>v.sinal));
  ls.forEach(({l,n,dt,vs})=>{
    if(/total de saidas|^saidas\b|saidas do dia/.test(n)) sinalCtx=-1; else if(/total de entradas|^entradas\b|entradas do dia/.test(n)) sinalCtx=1;
    if(dt&&!vs.length){ const resto=n.slice(0,dt.ini)+n.slice(dt.fim); if(!resto.split(/[^a-z]+/).some(w=>w.length>=3&&!PDF_SO_DATA.has(w))) dataCtx=dt.iso; return; }
    if(dt&&RE_PDF_IGNORA.test(n)&&vs.length){ dataCtx=dt.iso; return; }
    if(!vs.length||RE_PDF_IGNORA.test(n)) return;
    const data=dt?dt.iso:dataCtx; if(!data) return;
    const usados=vs.filter(x=>!dt||x.ini>=dt.fim); if(!usados.length) return;
    const comRS=usados.filter(x=>x.rs), alvo=comRS.length===1?comRS[0]:usados[0];
    let desc=l;
    const cortes=[...usados.map(x=>[x.ini,x.fim])]; if(dt) cortes.push([dt.ini,dt.fim]);
    cortes.sort((a,b)=>b[0]-a[0]).forEach(([i,f])=>{ desc=desc.slice(0,i)+" "+desc.slice(f); });
    desc=desc.replace(/(US\$|USD|U\$)\s?\d[\d.]*,\d{2}/gi," ").replace(/R\$|US\$|\bUSD\b/gi," ").replace(/(^|\s)\d{4,}(?=\s|$)/g," ").replace(/\s+/g," ").replace(/^[\s\-–—:|•·]+|[\s\-–—:|•·]+$/g,"").trim();
    if(desc.length<2) return;
    let v=alvo.v;
    if(!alvo.sinal&&!cartao){ const nd=norm(desc); v=temSinal||sinalCtx>0||/recebid|deposito|salario|credito em conta|estorno|rendimento|resgate|devolu/.test(nd)?Math.abs(v):-Math.abs(v); }
    itens.push({data,valor:v,desc,fitid:""});
  });
  return {itens,cartao,erro:itens.length?"":"Não reconheci nenhum lançamento neste PDF. Cada linha precisa ter data e valor. Se puder, baixe o extrato em OFX ou CSV no app do banco."};
}
const REGRAS_CAT=[[/mercad|supermerc|atacad|assai|carrefour|hortifrut|padaria|acougue|sacolao|atacarejo/,/mercado|aliment/],
  [/uber|99app|\b99\b|posto|shell|ipiranga|petrobras|combust|estacion|onibus|metro|pedagio|recarga.*transporte/,/transp|combust/],
  [/farm|droga|raia|pacheco|pague menos|panvel|hospital|clinica|laborat|odonto|consulta/,/saude|farm/],
  [/ifood|restaur|lanch|pizza|burger|\bbar\b|cinema|ingresso|rappi|mcdonald|sorvet|cafe/,/lazer|restaur/],
  [/netflix|spotify|prime video|disney|hbo|internet|\bvivo\b|\bclaro\b|\btim\b|energia|cemig|enel|light|copel|celesc|sabesp|copasa|saneago|\bagua\b|\bgas\b/,/contas|luz|internet/],
  [/escola|curso|faculd|universidade|udemy|alura|livraria|mensalidade/,/educa/],
  [/aluguel|condominio|iptu|imobiliaria/,/moradia|aluguel/],
  [/loja|shopping|renner|riachuelo|\bc&a\b|shein|shopee|magalu|magazine|americanas|mercado ?livre|amazon|zara|centauro|netshoes/,/compras|vestu/]];
function sugerirCategoria(desc){
  const rg=regraCat(desc); if(rg) return rg;
  const d=norm(desc);
  if(d) for(const k of Object.keys(state.months).sort().reverse()){ const g=((state.months[k]||{}).gastos||[]).find(x=>x.desc&&norm(x.desc)===d&&catIndex(x.cat)>=0); if(g) return g.cat; }
  for(const [re,alvo] of REGRAS_CAT) if(re.test(d)){ const ct=state.config.categorias.find(c=>alvo.test(norm(c.nome))); if(ct) return ct.id; }
  const outros=state.config.categorias.find(c=>/outro/.test(norm(c.nome))); return (outros||state.config.categorias[0]||{}).id;
}
function sugerirForma(desc,cartao){ if(cartao) return "credito"; const d=norm(desc); if(/pix/.test(d)) return "pix"; if(/boleto|titulo|pagto|pagamento de conta/.test(d)) return "boleto"; if(/saque/.test(d)) return "dinheiro"; return "debito"; }
function preparaImportacao(lista,cartao){
  return lista.map(x=>{
    const k=x.data.slice(0,7), dia=Number(x.data.slice(8,10)), tipo=cartao?(x.valor>0?"gasto":"ignorar"):(x.valor<0?"gasto":"receita"), valor=Math.abs(x.valor);
    const m=state.months[k], dn=norm(x.desc);
    const dup=!!m&&(((m.gastos||[]).concat(m.avulsos||[])).some(g=>(x.fitid&&g.imp===x.fitid)||(g.dia===dia&&Math.abs(g.valor-valor)<0.005&&norm(g.desc)===dn)));
    const fatura=/pagamento.*fatura|fatura.*cartao|pgto.*fatura|pagamento recebido/.test(dn);
    const fora=!MESES.includes(k);
    let obs=dup?"já lançado":fatura?"pagamento de fatura (já contado no cartão)":fora?"fora do período do app":tipo==="ignorar"?"pagamento ou estorno":"";
    return {k,dia,valor,desc:x.desc,fitid:x.fitid,tipo,cat:tipo==="gasto"?sugerirCategoria(x.desc):null,forma:tipo==="gasto"?sugerirForma(x.desc,cartao):null,incluir:!obs,obs,bloq:fora||tipo==="ignorar"};
  }).sort((a,b)=>(a.k+pad2(a.dia)).localeCompare(b.k+pad2(b.dia)));
}
/** @param {File} file @param {string} [senha] */
const EXTRATO_TXT_MB=5, EXTRATO_PDF_MB=20;
async function abrirArquivoExtrato(file,senha){
  const s=ui.sheet; if(!s||s.tipo!=="importar") return;
  const ck=/** @type {HTMLInputElement|null} */(document.getElementById("s-impcartao"));
  if(ck) s.cartaoMarcado=ck.checked;
  s.contaImp=valSel("s-impconta")||s.contaImp; s.cartaoImp=valSel("s-cartao")||s.cartaoImp;
  const ehPDF=/\.pdf$/i.test(file.name)||file.type==="application/pdf", maxMB=ehPDF?EXTRATO_PDF_MB:EXTRATO_TXT_MB;
  if(file.size>maxMB*1024*1024){ s.erroImp="Arquivo grande demais para um extrato (máximo "+maxMB+" MB). Exporte um período menor no app do banco."; s.itens=null; s.pdfArq=null; s.pedeSenha=false; renderSheet(); anunciar(s.erroImp); return; }
  try{
    let r;
    if(ehPDF){
      s.lendo=true; s.erroImp=""; renderSheet(); anunciar("Lendo o PDF.");
      r=parsePDF(await textoPDF(await file.arrayBuffer(),senha));
      s.lendo=false; s.pdfArq=null; s.pedeSenha=false;
    } else {
      const t=await lerArquivoTexto(file);
      const ehOFX=/<OFX>|OFXHEADER|<STMTTRN>/i.test(t);
      r=ehOFX?{itens:parseOFX(t),cartao:false}:parseCSV(t);
    }
    const cartao=!!s.cartaoMarcado||r.cartao;
    if(!r.itens.length){ s.erroImp=r.erro||"Não encontrei lançamentos neste arquivo. Confira se é um extrato em OFX, CSV ou PDF."; s.itens=null; renderSheet(); anunciar(s.erroImp); return; }
    s.erroImp=""; s.arquivo=file.name; s.cartaoArq=cartao;
    s.itens=preparaImportacao(r.itens,cartao); renderSheet(); anunciar(r.itens.length+" lançamento"+(r.itens.length===1?"":"s")+" encontrado"+(r.itens.length===1?"":"s")+". Confira antes de importar.");
  }catch(e){
    const err=/** @type {any} */(e); s.lendo=false;
    if(ehPDF&&err&&err.name==="PasswordException"){
      s.pdfArq=file; s.pedeSenha=true; s.itens=null;
      s.erroImp=err.code===2?"Senha incorreta. Confira e tente de novo.":"";
      renderSheet(); anunciar(s.erroImp||"Este PDF tem senha. Digite a senha do arquivo."); vibra(err.code===2?40:0);
      const i=document.getElementById("s-impsenha"); if(i) i.focus();
      return;
    }
    console.error("Importar extrato:",err&&err.name);
    s.pdfArq=null; s.pedeSenha=false;
    s.erroImp=err&&err.name==="PdfjsLoad"?"Não consegui carregar o leitor de PDF. Confira a internet e tente de novo.":ehPDF?"Não consegui ler este PDF. Se puder, baixe o extrato em OFX ou CSV no app do banco.":"Não consegui ler o arquivo.";
    renderSheet(); anunciar(s.erroImp);
  }
}
function tentaSenhaPDF(){
  const s=ui.sheet, i=/** @type {HTMLInputElement|null} */(document.getElementById("s-impsenha"));
  const v=i?i.value:""; if(i) i.value="";
  if(!s||!s.pdfArq) return;
  if(!v){ s.erroImp="Digite a senha do PDF."; renderSheet(); anunciar(s.erroImp); const j=document.getElementById("s-impsenha"); if(j) j.focus(); return; }
  abrirArquivoExtrato(s.pdfArq,v);
}
function importarExtrato(){
  const s=ui.sheet, its=(s.itens||[]).filter(x=>x.incluir&&!x.bloq); if(!its.length) return erroSheet("Marque pelo menos um lançamento para importar.");
  const criados=[], meses=new Set();
  its.forEach(x=>{ const m=getMonth(x.k), id=uidGen(), base=marcaPor({id,dia:x.dia,valor:x.valor,desc:x.desc}); if(x.fitid) base.imp=x.fitid;
    if(x.tipo==="gasto"){ Object.assign(base,{cat:x.cat,forma:x.forma}); if(x.forma==="credito"){ if(s.cartaoImp) base.cartaoId=s.cartaoImp; } else if(s.contaImp) base.contaId=s.contaImp; m.gastos.push(base); criados.push([x.k,"gastos",id]); }
    else { if(s.contaImp) base.contaId=s.contaImp; m.avulsos.push(base); criados.push([x.k,"avulsos",id]); }
    meses.add(x.k); });
  meses.forEach(k=>save(k)); closeSheet(); render();
  toast(its.length+" lançamento"+(its.length===1?"":"s")+" importado"+(its.length===1?"":"s")+".","Desfazer",()=>{ const ms=new Set(); criados.forEach(([k,l,id])=>{ const m=getMonth(k); m[l]=m[l].filter(x=>x.id!==id); ms.add(k); }); ms.forEach(k=>save(k)); render(); toast("Importação desfeita."); });
}

