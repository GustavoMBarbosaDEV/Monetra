// @ts-check
// Backup, backup com senha, restauração e planilha.
"use strict";
function apagarItem(chave,lista,id,msg){
  const alvo=chave==="config"?state.config:getMonth(chave), arr=alvo[lista], idx=arr.findIndex(x=>x.id===id);
  if(idx<0) return; const item=arr[idx];
  alvo[lista]=arr.filter(x=>x.id!==id); marcaApagado(chave,id); save(chave); render();
  toast(msg,"Desfazer",()=>{ const a=chave==="config"?state.config:getMonth(chave); if(!a[lista].some(x=>x.id===id)){ a[lista].splice(Math.min(idx,a[lista].length),0,item); } desmarcaApagado(chave,id); save(chave); render(); toast("Desfeito."); });
}

const chaveBk=()=>"mb.backup."+(uid||"local");
function infoBackup(){ try{ return JSON.parse(localStorage.getItem(chaveBk())||"{}")||{}; }catch(e){ return {}; } }
function salvaInfoBackup(o){ try{ localStorage.setItem(chaveBk(),JSON.stringify(Object.assign(infoBackup(),o))); }catch(e){} }
function nLancamentos(){ let n=0; Object.values(state.months||{}).forEach(m=>{ n+=((m&&m.gastos)||[]).length+((m&&m.avulsos)||[]).length; }); return n+state.config.fixos.length+state.config.parcelas.length; }
function lembreteBackup(){
  if(mode==="login"||!state.loaded||(mode==="cloud"&&aberto!=="pessoal")) return null;
  const bk=infoBackup(), hj=hojeISO(), n=nLancamentos();
  if(n<10) return null;
  if(bk.depois&&bk.depois>hj) return null;
  const dias=bk.ultimo?entreDias(bk.ultimo,hj):null;
  if(dias!==null&&dias<30) return null;
  return {dias,local:mode!=="cloud",n};
}
const textoBackup=()=>JSON.stringify({app:"monetra",versao:2,exportadoEm:new Date().toISOString(),config:state.config,months:state.months},null,2);
function baixaArquivo(nome,texto){ const blob=new Blob([texto],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=nome; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500); }
function exportar(){ salvaInfoBackup({ultimo:hojeISO(),depois:null}); baixaArquivo("monetra-backup-"+new Date().toISOString().slice(0,10)+".json",textoBackup()); }
const BK_ITER=310000;
function paraB64(u){ let s=""; for(let i=0;i<u.length;i+=0x8000) s+=String.fromCharCode.apply(null,Array.from(u.subarray(i,i+0x8000))); return btoa(s); }
function deB64(t){ const s=atob(t), u=new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i); return u; }
async function chaveDaSenha(senha,sal,iter){ const k=await crypto.subtle.importKey("raw",new TextEncoder().encode(senha),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt:sal,iterations:iter},k,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]); }
async function cifraBackup(texto,senha){ const sal=crypto.getRandomValues(new Uint8Array(16)), iv=crypto.getRandomValues(new Uint8Array(12));
  const dados=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},await chaveDaSenha(senha,sal,BK_ITER),new TextEncoder().encode(texto)));
  return JSON.stringify({app:"monetra",cifrado:1,alg:"AES-GCM",kdf:"PBKDF2-SHA256",iter:BK_ITER,sal:paraB64(sal),iv:paraB64(iv),dados:paraB64(dados)}); }
/** @param {any} d @param {string} senha */
async function decifraBackup(d,senha){
  const b64ok=x=>typeof x==="string"&&/^[A-Za-z0-9+/]+={0,2}$/.test(x);
  if(d.alg!=="AES-GCM"||d.kdf!=="PBKDF2-SHA256"||!(Number.isInteger(d.iter)&&d.iter>=100000&&d.iter<=5000000)||!b64ok(d.sal)||!b64ok(d.iv)||!b64ok(d.dados)) throw new Error("formato");
  const txt=await crypto.subtle.decrypt({name:"AES-GCM",iv:deB64(d.iv)},await chaveDaSenha(senha,deB64(d.sal),d.iter),deB64(d.dados));
  return new TextDecoder().decode(txt); }
function aplicaBackup(b){
  const t=state.config.termos; state.config=b.config; if(!state.config.termos) state.config.termos=t; buildMeses(); save("config");
  Object.keys(b.months).forEach(k=>{ state.months[k]=b.months[k]; save(k); });
  return "Backup restaurado: "+b.meses+(b.meses===1?" mês":" meses")+" e "+b.lancamentos+(b.lancamentos===1?" lançamento.":" lançamentos."); }
const BACKUP_MAX=10*1024*1024, BACKUP_MESES_MAX=600, BACKUP_ITENS_MAX=5000;
const CAMPOS_ITEM=["id","dia","valor","desc","cat","sub","forma","contaId","cartaoId","metaId","tipo","de","para","por","pagou","imp","viagemId","tags","pago","pagoEm","orig","ir"];
const ehObj=x=>!!x&&typeof x==="object"&&!Array.isArray(x);
const textoCurto=(v,max)=>String(v).slice(0,max);
function itemBackup(x){ const o={}; CAMPOS_ITEM.forEach(k=>{ if(k in x) o[k]=x[k]; });
  ["desc","imp"].forEach(k=>{ if(typeof o[k]==="string") o[k]=textoCurto(o[k],500); });
  ["cat","sub","forma","contaId","cartaoId","metaId","tipo","de","para","por","pagou","viagemId","ir"].forEach(k=>{ if(typeof o[k]==="string") o[k]=textoCurto(o[k],128); });
  o.id=textoCurto(o.id,128); return o; }
/** @param {any} m @returns {Object<string,any>} */
function mapaBackup(m){ /** @type {Object<string,any>} */ const out={}; if(!ehObj(m)) return out;
  Object.keys(m).slice(0,2000).forEach(id=>{ const x=m[id]; if(!ehObj(x)||!id||id.length>128) return; const o={};
    if("pago" in x) o.pago=!!x.pago;
    if(typeof x.pagoEm==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x.pagoEm)) o.pagoEm=x.pagoEm;
    if(typeof x.valor==="number"&&isFinite(x.valor)) o.valor=x.valor;
    if("pular" in x) o.pular=!!x.pular;
    if(typeof x.por==="string"&&x.por.length<=128) o.por=x.por;
    out[id]=o; });
  return out; }
function validaBackup(d){
  if(!ehObj(d)) throw new Error("Este arquivo não é um backup do Monetra.");
  if("app" in d&&d.app!=="monetra") throw new Error("Este arquivo é de outro aplicativo, não do Monetra.");
  if(!ehObj(d.config)||!ehObj(d.months)) throw new Error("O arquivo não tem as configurações e os meses de um backup do Monetra.");
  const ks=Object.keys(d.months).filter(mesValido);
  if(ks.length>BACKUP_MESES_MAX) throw new Error("O backup tem meses demais ("+ks.length+").");
  const months={}; let n=0;
  ks.forEach(k=>{ const bruto=d.months[k]; if(!ehObj(bruto)) return; const m=normMonth(bruto);
    ["avulsos","gastos","caixinha","transf"].forEach(l=>{ if(m[l].length>BACKUP_ITENS_MAX) throw new Error("O mês "+nomeMes(k).toLowerCase()+" tem lançamentos demais."); m[l]=m[l].map(itemBackup); n+=m[l].length; });
    m.fixos=mapaBackup(m.fixos); m.rendas=mapaBackup(m.rendas); m.parcelas=mapaBackup(m.parcelas);
    /** @type {Object<string,boolean>} */ const fp={}; if(ehObj(m.faturasPagas)) Object.keys(m.faturasPagas).slice(0,200).forEach(id=>{ if(id.length<=128) fp[id]=!!m.faturasPagas[id]; }); m.faturasPagas=fp;
    months[k]=m; });
  return {config:normConfig(d.config),months,meses:Object.keys(months).length,lancamentos:n};
}
function importar(file){
  if(mode==="cloud"&&aberto!=="pessoal"){ ui.importMsg="Para restaurar um backup, abra o controle Pessoal (botões no topo)."; render(); return; }
  const avisa=msg=>{ ui.importMsg=msg; render(); anunciar(msg); };
  if(!file) return;
  if(file.size>BACKUP_MAX){ avisa("Arquivo grande demais para um backup do Monetra (máximo 10 MB). Nada foi alterado."); return; }
  const r=new FileReader();
  r.onerror=()=>avisa("Não consegui ler o arquivo. Nada foi alterado.");
  r.onload=()=>{ let b;
    try{ let d; try{ d=JSON.parse(String(r.result)); }catch(e){ throw new Error("Este arquivo não é um backup do Monetra."); }
      if(ehObj(d)&&d.app==="monetra"&&d.cifrado===1){ ui.importMsg=""; openSheet("bkabrir",null,{arquivo:d}); return; }
      b=validaBackup(d); }
    catch(e){ avisa((e&&e.message?e.message:"Arquivo inválido.")+" Use um backup baixado pelo Monetra. Nada foi alterado."); return; }
    avisa(aplicaBackup(b)); };
  r.readAsText(file);
}
function exportarPlanilha(){
  const num=v=>(Number(v)||0).toFixed(2).replace(".",","), cel=s=>{ s=String(s??""); if(/^[=+\-@\t\r]/.test(s)&&!/^-?[\d.]+(,\d+)?$/.test(s)) s="'"+s; return '"'+s.replace(/"/g,'""')+'"'; };
  /** @type {Array<Array<string|number>>} */
  const linhas=[["Mês","Dia","Tipo","Categoria","Descrição","Forma de pagamento","Valor (R$)","Situação","Conta / cartão"]];
  const onde=x=>x&&x.forma==="credito"?((cartaoDe(x)||{}).nome||"Crédito"):(temContas()?nomeConta(x&&x.contaId):"");
  MESES.forEach(k=>{
    const m=normMonth(state.months[k]||{}), c=calc(k), mes=nomeMes(k);
    if(c.salario>0) linhas.push([mes,"","Receita","","Salário / renda fixa","",num(c.salario),""]);
    rendasDoMes(k).filter(r=>!r.pular).forEach(r=>linhas.push([mes,"","Receita fixa","",r.nome,"",num(r.valor),""]));
    m.avulsos.forEach(x=>linhas.push([mes,x.dia,"Receita avulsa","",x.desc,"",num(x.valor),""]));
    m.gastos.forEach(g=>linhas.push([mes,g.dia,"Despesa",catName(g.cat),g.desc,formaNome(g.forma),"-"+num(g.valor),noCartao(g)?"fatura de "+abrMes(faturaMes(k,g.dia,cartaoDe(g))):"",onde(g)]));
    m.transf.filter(t=>t.tipo!=="acerto").forEach(t=>linhas.push([mes,t.dia,"Transferência","",(t.desc||"")+" ("+nomeConta(t.de)+" → "+nomeConta(t.para)+")","",num(t.valor),"",""]));
    parcelasDoMes(k).forEach(p=>linhas.push([mes,p.dia,"Parcela "+p.idx+"/"+p.n,catName(p.cat),p.desc,formaNome(p.forma),"-"+num(p.valor),p.cartao?"na fatura":""]));
    fixosDoMes(k).filter(f=>!f.pular).forEach(f=>linhas.push([mes,f.dia,"Conta fixa",catName(f.cat),f.desc,formaNome(f.forma),"-"+num(f.valor),f.pago?"paga":"a pagar"]));
    m.caixinha.forEach(x=>linhas.push([mes,x.dia,x.tipo==="guardar"?"Caixinha (guardou)":"Caixinha (retirou)","",x.desc,"",(x.tipo==="guardar"?"-":"")+num(x.valor),""]));
  });
  const csv="﻿"+linhas.map(l=>l.map(cel).join(";")).join("\r\n");
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})); a.download="monetra-planilha-"+new Date().toISOString().slice(0,10)+".csv"; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
  toast("Planilha baixada.");
}
async function apagarTudo(){
  if(!souDono()) return;
  if(mode==="cloud"){
    setStatus("Apagando…","saving");
    const ids=new Set([...docIds,"config",...Object.keys(state.months).map(k=>"m-"+k)]);
    zeraFila(); try{ localStorage.removeItem(chavePend()); }catch(e){}
    try{ await Promise.all([...ids].map(id=>fb.deleteDoc(fb.doc(fb.db,...docsPath(),id)))); docIds.clear(); }
    catch(e){ console.error(e); setStatus("Não foi possível apagar — confira a internet","err"); return; }
  } else { try{ localStorage.removeItem(LSKEY); }catch(e){} }
  const termosAntes=state.config.termos; resetState(); if(mode!=="cloud"&&termosAntes){ state.config.termos=termosAntes; save("config"); } ui.confirmaApagar=false; ui.tab="mes"; ui.month=todayKey; render(); setStatus("Tudo apagado","ok"); toast("Seus dados foram apagados. Comece informando o salário do mês.");
}


