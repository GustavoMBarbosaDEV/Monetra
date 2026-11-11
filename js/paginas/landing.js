// @ts-check
// Página de apresentação antes do login.
"use strict";
const appInstalado=()=>{ try{ return matchMedia("(display-mode: standalone)").matches||matchMedia("(display-mode: fullscreen)").matches||/** @type {any} */(navigator).standalone===true||document.referrer.startsWith("android-app://"); }catch(e){ return false; } };
const mostraApresentacao=()=>!ui.verLogin&&!appInstalado();
const logoM=(px,id)=>`<svg class="logom" viewBox="90 120 340 270" width="${px}" height="${Math.round(px*.8)}" aria-hidden="true"><defs><linearGradient id="${id}W" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--lgw1,#fff)"/><stop offset="1" stop-color="var(--lgw2,#C9D2CD)"/></linearGradient><linearGradient id="${id}G" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2BE08A"/><stop offset="1" stop-color="#0BA86A"/></linearGradient></defs><path class="l1" d="M100 135 L292 268 L257 302 L158 232 L158 378 L100 342 Z" fill="url(#${id}W)"/><path class="l2" d="M257 250 L413 135 L413 190 L292 272 Z" fill="url(#${id}G)"/><path class="l3" d="M358 222 L413 190 L413 345 L358 378 Z" fill="url(#${id}G)"/><rect class="r1" x="195" y="352" width="32" height="24" rx="2" fill="url(#${id}G)"/><rect class="r2" x="245" y="325" width="32" height="51" rx="2" fill="url(#${id}G)"/><rect class="r3" x="295" y="293" width="32" height="83" rx="2" fill="url(#${id}G)"/></svg>`;
function viewApresentacao(){
  const entrarBtn=`<button class="ap-btn pri" type="button" data-apres="criar" data-ev="cta_clique" data-evlocal="landing">Começar grátis <span aria-hidden="true">→</span></button>`;
  const apk=/Android/i.test(navigator.userAgent)?`<a class="ap-apk" href="obrigado?c=apk" data-ev="cta_clique" data-evlocal="landing-apk"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/></svg>Baixar o app para Android</a>`:"";
  const palavras="Controle seu dinheiro. Viva seus planos.".split(" ").map((w,i)=>{ const m=w.match(/^(.*?)([.,!?]?)$/)||["",w,""], dest=m[1].toLowerCase()==="dinheiro";
    return `<span class="ap-w" style="--i:${i}">${dest?`<span class="ap-dest">${esc(m[1])}</span>${esc(m[2])}`:esc(w)}</span>`; }).join(" ");
  const linha=[3900,3487,3487,3449,1949,1349,1349,1349,1349,1119,1055,695,695,695,599,509,464,412];
  const mx=Math.max(...linha), mn=Math.min(...linha), W=260, H=56;
  const d="M"+linha.map((v,i)=>(i/(linha.length-1)*W).toFixed(1)+","+(4+(1-(v-mn)/(mx-mn))*(H-8)).toFixed(1)).join(" L");
  const barra=(n,v,p,c,i)=>`<div class="ap-cat"><span class="ap-dot" style="--dot:var(--c${c})"></span><div><div class="ap-ct"><b>${n}</b><span>R$ ${v}</span></div><div class="track"><div style="width:${p}%;--dot:var(--c${c});--i:${i}"></div></div></div></div>`;
  const celular=`<div class="ap-cel"><div class="ap-tela"><i class="ap-notch"></i>
    <div class="ap-mini-top">${logoM(22,"lmc")}<b>Monetra</b></div>
    <div class="ap-hero"><small>SALDO DE OUTUBRO</small><b><span class="vg-rs">R$</span>417<span class="vg-cs">,80</span></b>
      <svg viewBox="0 0 ${W} ${H}" class="ap-spark" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/></svg>
      <div class="ap-duo"><span><small>RECEITAS</small>R$ 4.200</span><span><small>DESPESAS</small>R$ 3.182</span></div></div>
    <div class="ap-card">${barra("Mercado","508",43,0,0)}${barra("Lazer","308",68,1,1)}${barra("Transporte","282",56,3,2)}</div>
    <div class="ap-card ap-meta"><span class="ap-anel"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="var(--sunk)" stroke-width="5"/><circle cx="22" cy="22" r="18" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round" pathLength="100" stroke-dasharray="18 100" transform="rotate(-90 22 22)"/></svg><b>18%</b></span><span><b>Viagem para o Nordeste</b><small>R$ 900 de R$ 5.000</small></span></div>
  </div></div>`;
  const rec=(ic,olho,tit,txt,vis,lado)=>`<section class="ap-rec ${lado?"inv":""} ap-revela"><div class="ap-rt"><span class="ap-olho">${ic}${olho}</span><h2>${tit}</h2><p>${txt}</p></div><div class="ap-rv">${vis}</div></section>`;
  return `<div class="ap">
  <section class="ap-topo"><div class="ap-aurora" aria-hidden="true"><i></i><i></i><i></i></div><div class="ap-grade" aria-hidden="true"></div>
    <div class="ap-heroin">
      <div class="ap-txt">
        <span class="ap-selo"><i></i>Grátis · web e Android · versão ${VERSAO}</span>
        <div class="ap-logo">${logoM(64,"lmh")}</div>
        <h1 class="ap-tit">${palavras}</h1>
        <p class="ap-sub">Saldo do mês, contas fixas, cartões, metas e previsão, num app leve que funciona no celular e no computador.</p>
        <div class="ap-acoes">${entrarBtn}<button class="ap-btn sec" type="button" data-apres="entrar">Já tenho conta</button></div>
        ${apk}
        <ul class="ap-checks"><li>Sem anúncios</li><li>Seus dados só seus</li><li>Funciona sem internet</li></ul>
        <p class="ap-termos">Ao entrar, você lê e decide se aceita a <a href="privacidade">política de privacidade</a> e os <a href="termos">termos de uso</a>.</p>
      </div>
      <div class="ap-celwrap"><div class="ap-par">${celular}</div></div>
    </div>
  </section>
  <section class="ap-nums ap-revela">
    <div><b data-conta="0">0</b><span>reais por mês: é grátis</span></div>
    <div><b data-conta="2">2</b><span>temas, claro e escuro</span></div>
    <div><b data-conta="2">2</b><span>plataformas: web e Android</span></div>
    <div><b data-conta="1">1</b><span>toque para lançar um gasto</span></div>
  </section>
  <div class="ap-recs">
    ${rec(svgCat("dinheiro",16),"Saldo que se explica","Você bate o olho e entende o mês","O saldo mostra quanto entrou, quanto saiu e como chegou até aqui, com o acumulado dos meses anteriores e a comparação com o mês passado.",`<div class="ap-vcard ap-vsaldo"><small>SALDO DE OUTUBRO</small><b><span class="vg-rs">R$</span>417<span class="vg-cs">,80</span></b><span class="ap-ac">acumulado <b>R$ 1.232,90</b></span><svg viewBox="0 0 ${W} ${H}" class="ap-spark" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/></svg></div>`,false)}
    ${rec(ICON.cartao,"Contas e cartões sem susto","Fatura, fixas e parcelas no lugar certo","Cada cartão tem fechamento, vencimento e limite. As contas fixas viram um checklist do mês e as parcelas aparecem sozinhas até a última.",`<div class="ap-vcard ap-vfix">${[["Aluguel","vence dia 05","1.500",1],["Luz","vence dia 12","180",1],["Internet","vence dia 20","99,90",0]].map(([n,v,r,ok],i)=>`<div class="ap-fx" style="--i:${i}"><span class="ap-ck ${ok?"on":""}">${ok?ICON.check:""}</span><span><b>${n}</b><small>${v}</small></span><b>R$ ${r}</b></div>`).join("")}</div>`,true)}
    ${rec(icq("alvo",16),"Metas que andam","Guarde com um destino","A caixinha separa o dinheiro do saldo do mês e mostra quanto falta e quanto guardar por mês para chegar no prazo.",`<div class="ap-vcard ap-vmetas">${[[18,"Viagem","var(--accent)"],[3,"Reserva","var(--c7)"]].map(([p,n,c])=>`<div><span class="ap-anel g"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="var(--sunk)" stroke-width="4"/><circle class="ap-arc" cx="22" cy="22" r="18" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" pathLength="100" stroke-dasharray="${p} 100" transform="rotate(-90 22 22)"/></svg><b>${p}%</b></span><small>${n}</small></div>`).join("")}</div>`,false)}
    ${rec(icq("tendencia",16),"Previsão do mês","Saiba antes de estourar","Pelo ritmo de gastos, o Monetra avisa em que dia uma categoria vai passar do limite e quanto deve sobrar no fim do mês.",`<div class="ap-vcard"><div class="ap-ct"><b>Lazer / Restaurantes</b><span>R$ 308 / R$ 450</span></div><div class="track"><div style="width:68%;--dot:var(--warn)"></div></div><p class="ap-aviso">No ritmo de hoje, chega a R$ 530,44 e estoura no dia 27</p></div>`,true)}
    ${rec(ICON.cadeado,"Seus dados são seus","Privado por padrão","Login com Google, regras no servidor que só deixam o dono ler e gravar, e bloqueio com PIN ou digital no aparelho.",`<div class="ap-vcard ap-vlock"><span>${ICON.cadeado}</span></div>`,false)}
  </div>
  ${CASES.length?`<section class="ap-deps ap-revela"><h2>Quem usa o Monetra</h2><div class="ap-depl">${CASES.map(x=>`<figure class="ap-dep"><blockquote>${esc(x.texto)}</blockquote><figcaption>${x.foto?`<img src="${esc(x.foto)}" alt="" width="40" height="40" loading="lazy">`:""}<b>${esc(x.nome)}</b>${x.cidade?`<span>${esc(x.cidade)}</span>`:""}</figcaption></figure>`).join("")}</div></section>`:""}
  ${AVALIACOES.length?`<section class="ap-deps ap-revela"><h2>O que dizem do Monetra</h2><div class="ap-depl">${AVALIACOES.map(x=>`<figure class="ap-dep"><blockquote>${esc(x.texto)}</blockquote><figcaption>${x.foto?`<img src="${esc(x.foto)}" alt="" width="40" height="40" loading="lazy">`:""}<b>${esc(x.nome)}</b>${x.cidade?`<span>${esc(x.cidade)}</span>`:""}</figcaption></figure>`).join("")}</div></section>`:""}
  <section class="ap-quem ap-revela"><picture><source srcset="img/equipe-gustavo.webp" type="image/webp"><img src="img/equipe-gustavo.jpg" alt="Gustavo, criador do Monetra, sorrindo" width="144" height="144" loading="lazy" decoding="async"></picture>
    <div><h2>Quem faz o Monetra</h2><p><b>Gustavo M. Barbosa</b> criou o Monetra para organizar o próprio dinheiro e deixou grátis para todo mundo. Cada sugestão que chega por e-mail é lida e ajuda a decidir o que vem na próxima versão.</p></div></section>
  <section class="ap-faq ap-revela" id="faq"><h2>Perguntas frequentes</h2>
    ${FAQ.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}
    <p><a href="faq">Ver todas as perguntas</a></p></section>
  ${CONTATO_EMAIL||CONTATO_WHATS?`<section class="ap-faq ap-revela" id="contato"><h2>Fale com a gente</h2><p>Respondemos em até 24h, em dias úteis. Atendimento online para todo o Brasil.</p><ul class="ap-contato">${CONTATO_EMAIL?`<li>E-mail: <a href="mailto:${esc(CONTATO_EMAIL)}">${esc(CONTATO_EMAIL)}</a></li>`:""}${CONTATO_WHATS?`<li>WhatsApp: <a href="https://wa.me/${esc(CONTATO_WHATS)}" rel="noopener">abrir conversa</a></li>`:""}</ul></section>`:""}
  <section class="ap-fim ap-revela"><div class="ap-aurora fraca" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="ap-logo">${logoM(84,"lmf")}</div><h2>Comece pelo mês de hoje</h2><p>Abra no navegador ou instale no Android. Leva um minuto.</p>
    <div class="ap-acoes centro">${entrarBtn}<button class="ap-btn sec" type="button" data-apres="entrar">Já tenho conta</button></div>
    ${apk}</section>
  <footer class="ap-rod"><span>${logoM(22,"lmr")}<b>Monetra</b></span><nav class="ap-links" aria-label="Rodapé"><a href="faq">Perguntas frequentes</a><a href="privacidade">Privacidade</a><a href="termos">Termos de uso</a><a href="obrigado?c=apk" data-ev="cta_clique" data-evlocal="rodape-apk">Baixar para Android</a><a href="faq#contato">Contato</a></nav><span>Feito por Gustavo Martins Barbosa</span></footer>
  <div class="ap-fixo"><button class="ap-btn pri" type="button" data-apres="criar" data-ev="cta_clique" data-evlocal="fixo">Começar grátis</button>${apk?`<a class="ap-btn sec" href="obrigado?c=apk" data-ev="cta_clique" data-evlocal="fixo-apk">Baixar app</a>`:""}</div>
  </div>`;
}
let apObs=null;
function ligaApresentacao(){
  const ap=document.querySelector("#app .ap"); if(!ap) { if(apObs){ apObs.disconnect(); apObs=null; } return; }
  const calmo=semMovimento();
  const revela=[...ap.querySelectorAll(".ap-revela")];
  if(calmo||!("IntersectionObserver" in window)){ revela.forEach(el=>el.classList.add("vis")); return; }
  if(apObs) apObs.disconnect();
  apObs=new IntersectionObserver(es=>es.forEach(en=>{ if(!en.isIntersecting) return; const el=en.target; el.classList.add("vis"); apObs&&apObs.unobserve(el);
    el.querySelectorAll("[data-conta]").forEach(b=>{ const alvo=Number(/** @type {HTMLElement} */(b).dataset.conta)||0, t0=performance.now(); const passo=t=>{ const p=Math.min(1,(t-t0)/1200); b.textContent=String(Math.round(alvo*(1-Math.pow(1-p,3)))); if(p<1) requestAnimationFrame(passo); }; requestAnimationFrame(passo); }); }),{rootMargin:"0px 0px -12% 0px"});
  revela.forEach(el=>apObs&&apObs.observe(el));
}
let apRaf=0;
window.addEventListener("scroll",()=>{ if(apRaf) return; apRaf=requestAnimationFrame(()=>{ apRaf=0; const par=/** @type {HTMLElement|null} */(document.querySelector("#app .ap-par")); if(!par||semMovimento()) return;
  const topo=/** @type {HTMLElement} */(par.closest(".ap-topo")), r=topo.getBoundingClientRect(), p=Math.min(1,Math.max(0,-r.top/Math.max(1,r.height)));
  par.style.transform=`translateY(${(p*80).toFixed(1)}px) rotate(${(-6+p*6).toFixed(2)}deg)`; }); },{passive:true});
