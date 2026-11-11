// @ts-check
// Acessibilidade, valores escondidos e leitura em voz alta.
"use strict";
/** @typedef {{texto:number,contraste:boolean,daltonismo:boolean,semMov:boolean,calmo:boolean,dislexia:boolean,alvos:boolean,sublinhar:boolean,vibrar:boolean,foco:boolean,menosTexto:boolean,retroAuto:boolean}} A11y */
/** @type {A11y} */
const a11y=(()=>{ const pad={texto:1,contraste:false,daltonismo:false,semMov:false,calmo:false,dislexia:false,alvos:false,sublinhar:false,vibrar:true,foco:false,menosTexto:false,retroAuto:false};
  try{ const x=JSON.parse(localStorage.getItem("mb.a11y")||"{}"); if(x&&typeof x==="object"){ for(const k in pad){ if(typeof x[k]===typeof pad[k]) pad[k]=x[k]; } } }catch(e){}
  if(![1,1.15,1.3,1.5].includes(pad.texto)) pad.texto=1; return pad; })();
function aplicaA11y(){ const r=document.documentElement;
  r.style.setProperty("--escala",String(a11y.texto));
  [["contraste","a11y-contraste"],["daltonismo","a11y-dalt"],["semMov","a11y-semmov"],["calmo","a11y-calmo"],["dislexia","a11y-dislexia"],["alvos","a11y-alvos"],["sublinhar","a11y-sublinhar"],["menosTexto","a11y-menostexto"]].forEach(([k,c])=>r.classList.toggle(c,!!a11y[k]));
  r.classList.toggle("a11y-texto",a11y.texto!==1);
  if(a11y.dislexia&&!document.getElementById("fonte-dislexia")){ const l=document.createElement("link"); l.id="fonte-dislexia"; l.rel="stylesheet"; l.href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap"; document.head.appendChild(l); } }
function salvaA11y(){ try{ localStorage.setItem("mb.a11y",JSON.stringify(a11y)); }catch(e){} aplicaA11y(); }
aplicaA11y();
const RE_VALOR=/R\$|(^|[\s(])[-−]?\d{1,3}(\.\d{3})*,\d{2}(?!\d)/;
let privado=false; try{ privado=localStorage.getItem("mb.privado")==="1"; }catch(e){}
/** @param {Node} n */
function marcaTexto(n){ if(!RE_VALOR.test(n.nodeValue||"")) return; let el=n.parentElement; if(!el) return;
  if(el.classList.contains("vg-rs")||el.classList.contains("vg-cs")) el=el.parentElement||el;
  if(el.closest("textarea,select,option,title,script,style,.sr")) return; el.classList.add("pv"); }
/** @param {Node} raiz */
function marcaValores(raiz){ if(raiz.nodeType===3){ marcaTexto(raiz); return; } if(raiz.nodeType!==1) return; const w=document.createTreeWalker(raiz,NodeFilter.SHOW_TEXT); let n; while((n=w.nextNode())) marcaTexto(n); }
/** @type {MutationObserver|null} */
let obsPriv=null;
function aplicaPrivado(){
  document.documentElement.classList.toggle("privado",privado);
  if(!privado){ if(obsPriv) obsPriv.disconnect(); return; }
  if(!obsPriv) obsPriv=new MutationObserver(rs=>rs.forEach(r=>{ if(r.type==="characterData") marcaTexto(r.target); else r.addedNodes.forEach(marcaValores); }));
  marcaValores(document.body); obsPriv.observe(document.body,{childList:true,subtree:true,characterData:true});
}
function trocaPrivado(){ privado=!privado; try{ localStorage.setItem("mb.privado",privado?"1":"0"); }catch(e){} aplicaPrivado(); vibra(12); render(); anunciar(privado?"Valores escondidos.":"Valores visíveis."); }
aplicaPrivado();
const semMovimento=()=>{ if(a11y.semMov||a11y.calmo) return true; try{ return matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){ return false; } };
const temFala=()=>"speechSynthesis" in window&&typeof SpeechSynthesisUtterance!=="undefined";
const ReconhecimentoVoz=/** @type {any} */(window).SpeechRecognition||/** @type {any} */(window).webkitSpeechRecognition||null;
function vibra(ms){ try{ if(a11y.vibrar&&navigator.vibrate) navigator.vibrate(ms||14); }catch(e){} }
function valorFalado(v){ const n=Math.round(Math.abs(Number(v)||0)*100), r=Math.floor(n/100), c=n%100;
  const t=(r?r.toLocaleString("pt-BR")+(r===1?" real":" reais"):"")+(r&&c?" e ":"")+(c?c+(c===1?" centavo":" centavos"):"")||"zero reais"; return (v<0?"menos ":"")+t; }
function resumoFalado(k){ const c=calc(k), fx=fixosDoMes(k).filter(f=>!f.pular&&!f.pago), tfx=soma(fx.map(f=>({valor:f.valor})));
  const ps=pendencias(), atr=ps.filter(x=>x.dd<0), hoje=ps.filter(x=>x.dd===0), am=ps.filter(x=>x.dd===1);
  const al=k===todayKey?alertasOrcamento(k):[], passou=al.filter(a=>a.nivel==="passou"), ritmo=al.filter(a=>a.nivel==="ritmo"&&a.diaEstoura);
  const f=[`Resumo de ${nomeMes(k)}.`,`Saldo: ${valorFalado(c.saldo)}.`,`Entrou ${valorFalado(c.receitas)} e saiu ${valorFalado(c.despesas)}.`];
  if(fx.length) f.push(`Faltam pagar ${fx.length} ${fx.length===1?"conta fixa":"contas fixas"}, somando ${valorFalado(tfx)}.`); else if(fixosDoMes(k).length) f.push("Todas as contas fixas do mês estão pagas.");
  if(atr.length) f.push(`Atenção: ${atr.length} ${atr.length===1?"conta atrasada":"contas atrasadas"}: ${atr.map(x=>x.nome).join(", ")}.`);
  if(hoje.length) f.push(`Vence hoje: ${hoje.map(x=>x.nome+", "+valorFalado(x.valor)).join("; ")}.`);
  if(am.length) f.push(`Vence amanhã: ${am.map(x=>x.nome).join(", ")}.`);
  passou.forEach(a=>f.push(`${a.nome} passou do limite: gastou ${valorFalado(a.v)} de ${valorFalado(a.o)}.`));
  ritmo.slice(0,2).forEach(a=>f.push(`No ritmo de hoje, ${a.nome} estoura o limite no dia ${a.diaEstoura}.`));
  return f.join(" "); }
let falando=false;
function ouvirResumo(){ if(!temFala()) return; const ss=window.speechSynthesis;
  if(falando||ss.speaking){ ss.cancel(); falando=false; atualizaBotaoOuvir(); return; }
  const u=new SpeechSynthesisUtterance(resumoFalado(ui.month)); u.lang="pt-BR"; u.rate=1;
  const vz=ss.getVoices().find(v=>/^pt(-|_)BR/i.test(v.lang))||ss.getVoices().find(v=>/^pt/i.test(v.lang)); if(vz) u.voice=vz;
  u.onend=u.onerror=()=>{ falando=false; atualizaBotaoOuvir(); }; falando=true; atualizaBotaoOuvir(); ss.speak(u); }
function atualizaBotaoOuvir(){ document.querySelectorAll("[data-ouvir]").forEach(b=>{ b.classList.toggle("on",falando); b.setAttribute("aria-pressed",String(falando)); b.setAttribute("aria-label",falando?"Parar a leitura do resumo":"Ouvir resumo do mês"); const t=b.querySelector(".ov-t"); if(t) t.textContent=falando?"Parar":"Ouvir"; }); }
let ouvindo=null;
function lancarPorVoz(){ if(!ReconhecimentoVoz) return; const campo=/** @type {HTMLInputElement|null} */(document.getElementById("s-rapido")), bt=document.querySelector("[data-falar]"); if(!campo) return;
  if(ouvindo){ try{ ouvindo.stop(); }catch(e){} return; }
  const r=new ReconhecimentoVoz(); r.lang="pt-BR"; r.interimResults=true; r.maxAlternatives=1; ouvindo=r;
  if(bt){ bt.classList.add("on"); bt.setAttribute("aria-pressed","true"); bt.setAttribute("aria-label","Parar de ouvir"); }
  anunciar("Pode falar. Exemplo: 45 ifood pix.");
  r.onresult=e=>{ let t=""; for(let i=0;i<e.results.length;i++) t+=e.results[i][0].transcript; campo.value=t.replace(/\s+/g," ").trim().slice(0,100); campo.dispatchEvent(new Event("input",{bubbles:true})); };
  r.onerror=e=>{ if(e&&e.error==="not-allowed") toast("Permita o uso do microfone para lançar falando."); else if(e&&e.error!=="aborted"&&e.error!=="no-speech") toast("Não consegui ouvir. Tente de novo."); };
  r.onend=()=>{ ouvindo=null; const b2=document.querySelector("[data-falar]"); if(b2){ b2.classList.remove("on"); b2.setAttribute("aria-pressed","false"); b2.setAttribute("aria-label","Lançar falando"); } if(campo.value) { campo.focus(); anunciar("Entendi: "+campo.value+". Confira e toque em Salvar."); } };
  try{ r.start(); }catch(e){ ouvindo=null; } }
function cardA11y(){
  const sw=(k,t,d)=>`<label class="switch a11ysw"><input type="checkbox" data-a11y="${k}" ${a11y[k]?"checked":""}><span></span><em class="a11yt"><b>${t}</b><small>${d}</small></em></label>`;
  return `<div class="card" id="acessibilidade"><h2>Acessibilidade</h2>
    <p class="hint">Ajustes deste aparelho para deixar o Monetra mais fácil de ver, ler e tocar.</p>
    <div class="f"><span id="a11y-txt-lab">Tamanho do texto</span><div class="seg" role="radiogroup" aria-labelledby="a11y-txt-lab">${[[1,"A","Normal"],[1.15,"A+","Maior"],[1.3,"A++","Grande"],[1.5,"A+++","Muito grande"]].map(([v,l,n],i)=>`<input type="radio" name="a11ytexto" id="a11yt${i}" value="${v}" ${a11y.texto===v?"checked":""}><label for="a11yt${i}" aria-label="${n}">${l}</label>`).join("")}</div></div>
    <div class="a11ylista">
    ${sw("contraste","Alto contraste","Cores mais fortes, bordas visíveis e fundo sem brilho. Bom para baixa visão.")}
    ${sw("daltonismo","Cores para daltonismo","Paleta que funciona para os três tipos de daltonismo; positivo em azul e negativo em laranja, sempre com sinal ou texto junto.")}
    ${sw("semMov","Sem animações","Nada se mexe: valores, gráficos e janelas aparecem prontos.")}
    ${sw("calmo","Modo calmo","Sem brilhos, auras, confete e efeitos. Visual mais tranquilo para quem se incomoda com estímulos (autismo, enxaqueca, sensibilidade visual).")}
    ${sw("dislexia","Fonte de leitura fácil","Letra Atkinson Hyperlegible, com mais espaço entre letras e linhas. Ajuda com dislexia e baixa visão.")}
    ${sw("alvos","Botões maiores","Áreas de toque maiores e mais espaço entre elas. Ajuda quem tem tremor ou dificuldade motora.")}
    ${sw("foco","Modo foco no Início","Mostra só o essencial: saldo, atalhos, avisos, lançamentos, receitas, fatura e contas fixas. O resto fica a um toque.")}
    ${sw("menosTexto","Menos texto","Esconde as explicações longas dos quadros, deixando só números e botões.")}
    ${sw("sublinhar","Sublinhar links","Links e botões de texto sempre sublinhados.")}
    ${"vibrate" in navigator?sw("vibrar","Vibrar ao confirmar","Uma vibração curta quando algo é salvo, apagado ou marcado como pago. Ajuda quem não ouve ou não enxerga bem a tela."):""}
    </div></div>`;
}
