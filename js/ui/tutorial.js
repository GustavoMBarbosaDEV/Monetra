// @ts-check
// Tutorial de boas-vindas.
"use strict";
const TUTKEY="mb.tutorial";
const tutVisto=()=>{ try{ return localStorage.getItem(TUTKEY)==="1"; }catch(e){ return true; } };
const marcaTutVisto=()=>{ try{ localStorage.setItem(TUTKEY,"1"); }catch(e){} };
let tutAberto=false, tutI=0;
function passosTutorial(){
  const nuvem=mode==="cloud", tecla=matchMedia("(hover:hover) and (pointer:fine)").matches;
  const L=(...xs)=>`<ul>${xs.filter(Boolean).map(x=>`<li>${x}</li>`).join("")}</ul>`;
  const AJ=tecla?"na aba <b>Ajustes</b> (no topo)":"em <b>Perfil → Ajustes</b>";
  return [
    {ic:"logo",t:"Bem-vindo ao Monetra",d:`Seu controle financeiro, <b>grátis e sem anúncios</b>. Em poucos passos você vê o básico e onde fica cada função.`+L(nuvem?"Seus dados ficam na sua conta e aparecem em qualquer aparelho.":"Sem login, os dados ficam só neste aparelho.","Dá para rever este tutorial depois em <b>Perfil → Tutorial</b>.")},
    {ic:"mes",t:"1. Comece pelo salário",d:`No <b>Início</b>, role até o card <b>Receitas</b> e informe o <b>salário deste mês</b>. O controle começa a contar a partir daí.`+L("Com o salário padrão cadastrado, o Início fica em <b>Aguardando salário</b>: mostra só o que pagar no mês. Quando ele cair, toque em <b>Meu salário caiu</b> e veja o saldo em conta, o <b>saldo livre</b> e <b>quanto dá para gastar por dia</b> até o fim do mês. Com conta em aberto, o card mostra também o que <b>falta pagar</b>.","Recebeu algo a mais? Use o atalho <b>Receita</b>, logo abaixo do saldo.",`Já tem dinheiro na conta? Informe o <b>saldo inicial</b> ${AJ} → <b>Contas</b>.`)},
    {ic:"mais",t:"2. Lance seus gastos",d:`Toque no <b>+</b> no centro da barra de baixo${tecla?" (ou aperte <b>N</b> no teclado)":""}, digite o valor e escolha a <b>categoria</b> e a <b>forma de pagamento</b>.`+L("Mais rápido: escreva <b>45 ifood pix</b> ou <b>120 mercado ontem</b> no campo rápido e aperte Enter. Prefere falar? Toque no <b>microfone</b> do campo.","Comprou parcelado? Ligue <b>Compra parcelada</b> (ou escreva <b>3x</b>).","<b>Segure o +</b> para escolher: despesa, receita, transferência ou por voz.","Despesa dedutível (saúde, educação…)? Escolha o tipo em <b>Imposto de Renda</b> e o resumo do ano aparece em Relatórios.","Errou? Toque no lançamento para editar, ou em <b>Desfazer</b>.","No celular, deslize o lançamento: para a <b>esquerda</b> apaga; para a <b>direita</b> repete hoje (no crédito, marca como paga).","No celular, a janela fecha no <b>X</b> ou arrastando o topo dela para baixo.")},
    {ic:"ajustes",t:"3. Contas fixas e cartões",d:`${tecla?"Na aba <b>Ajustes</b>":"Em <b>Perfil → Ajustes</b>"}, cadastre o que se repete todo mês e os seus cartões.`+L("<b>Contas fixas</b> (aluguel, internet) entram sozinhas todo mês; marque como paga.","<b>Cartões</b>: compras no crédito vão para a fatura certa, até a última parcela.","<b>Categorias</b>: com ícone, cor, limite por mês (a sobra pode passar para o mês seguinte) e subcategorias.")},
    {ic:"cofre",t:"4. Metas e desafios",d:`Na aba <b>Metas</b> ficam as metas de economia, os desafios e as conquistas.`+L("Crie <b>metas</b> com valor e prazo: o anel mostra quanto já guardou e o app diz quanto guardar por mês.","<b>Quanto renderia</b>: veja quanto a caixinha e as metas renderiam no CDI ou na poupança.","Topa um desafio? Ex.: <b>30 dias sem delivery</b>. O app acompanha sozinho.")},
    {ic:"ano",t:"5. Acompanhe para onde vai",d:`O <b>Início</b> mostra o saldo com gráfico (toque ou arraste nele para ver cada dia), a <b>previsão do fim do mês</b> e o orçamento por categoria. Toque em <b>Ouvir</b> no saldo para escutar o resumo do mês.`+L("No topo ficam 4 meses: o anterior, o atual e os próximos com fatura ou parcela para pagar. Para ir a qualquer outro, toque no <b>calendário</b> ao lado deles.","Mais abaixo: <b>calendário de gastos</b>, <b>para onde foi</b> (toque numa fatia para ver os lançamentos dela), <b>fatura do cartão</b> e <b>contas fixas</b> (marque como paga tocando no quadradinho e toque na conta para editar). No calendário: <b>anel</b> = vence, <b>ponto</b> = pago, <b>triângulo</b> = atrasado.","A <b>nota de saúde financeira</b> (0 a 100) mostra como foi o mês e explica cada ponto.","No celular, fora do Início, <b>deslize para os lados</b> para trocar de aba. Ao rolar, o saldo fica numa <b>barrinha no topo</b> (toque nela para voltar ao topo).")},
    {ic:"sino",t:"6. Não esqueça nenhuma conta",d:`O <b>sininho</b> no topo avisa contas que vencem amanhã, hoje ou estão atrasadas (com botão <b>Paguei</b>), limites estourando e o resumo da semana.`+L("Ative as <b>notificações</b> em <b>Perfil → Lembretes</b>.","No celular, <b>puxe a tela para baixo</b> no topo para atualizar os dados.","Para avisar até com o app fechado, use <b>Adicionar lembretes ao calendário</b>, no mesmo lugar.")},
    {ic:"ajustes",t:"7. Mapa: Ajustes",d:`Tudo o que dá para configurar fica ${AJ}. Toque no nome para abrir cada parte:`+L("<b>Contas fixas</b> e <b>Compras parceladas</b>.","<b>Modo viagem</b>: gastos em outra moeda, convertidos para real.","<b>Dívidas com pessoas</b>: quem te deve e quem você deve.","<b>Ferramentas</b>: simulador de quitação, 13º, férias, salário líquido e quanto guardar por mês.","<b>Importar extrato do banco</b>: baixe o extrato ou a fatura do cartão em <b>OFX</b>, <b>CSV</b> ou <b>PDF</b> no app do seu banco, toque em <b>Importar extrato</b> e escolha o arquivo (PDF com senha também funciona; até 5 MB em OFX/CSV e 20 MB em PDF). A categoria já vem sugerida e você escolhe o que entra.","<b>Contas</b>: separe por banco ou carteira, com saldo inicial.","<b>Cartões de crédito</b>: limite, fechamento e vencimento.","<b>Categorias de gastos</b>: ícone, cor, limite por mês e subcategorias.","<b>Regras automáticas</b>: ensine suas palavras (ex.: “petz” → Pets) e a categoria vem certa.")},
    {ic:"perfil",t:"8. Mapa: Perfil",d:`Na aba <b>Perfil</b> ficam sua conta e as preferências do app:`+L(nuvem?"<b>Controles compartilhados</b>: crie um controle com a família, separado do seu Pessoal, e convide com um <b>código que vale 7 dias</b>. Os botões no topo trocam entre eles.":"<b>Controles compartilhados</b>: disponíveis ao entrar com a conta Google.","<b>Renda e saldos</b>: salário padrão, outras rendas e saldo inicial.","<b>Aparência</b> (tema claro ou escuro) e <b>Bloqueio com PIN</b> (e digital).","<b>Lembretes</b>: notificações de vencimento e lembretes no calendário do celular.","<b>Acessibilidade</b>: texto maior, alto contraste, cores para daltonismo, modo calmo, modo foco, fonte de leitura fácil e botões maiores.","<b>Exportar e backup</b>: planilha para Excel, backup (também com senha) e restaurar backup.","<b>Novidades</b>, <b>Tutorial</b> e <b>Privacidade</b>.",`<b>Recomeçar do zero</b>${nuvem?" e <b>Excluir minha conta</b>":""}, no fim da página.`)},
    {ic:"ano",t:"9. Mapa: Relatórios",d:`Na aba <b>Relatórios</b> você vê o ano inteiro:`+L("<b>Receitas x despesas</b> e <b>mês a mês</b>, lado a lado.","<b>Para onde foi o dinheiro</b> e por <b>forma de pagamento</b>.","<b>Assinaturas e contas fixas</b>, com aviso quando uma fica mais cara.","<b>Imposto de Renda</b>: despesas dedutíveis do ano.","<b>Sua inflação x IPCA</b> e <b>etiquetas</b> (escreva #etiqueta na descrição).","<b>Patrimônio</b>: some imóveis, veículos e investimentos às suas contas.","<b>Retrospectiva</b> do ano em formato de stories.")},
    {ic:"busca",t:"10. Atalhos",d:`Para ir mais rápido:`+L("<b>MoneBot</b>, o robozinho no canto da tela: pergunte, por exemplo, “quanto gastei com mercado este mês?” (digitando ou falando). As respostas são calculadas neste aparelho. Arraste o robozinho para mudar de lugar.","<b>Busca</b> (lupa no topo): procure lançamentos ou telas. “extrato”, “13º”, “cartões” e “backup” levam direto ao lugar.","O <b>olho</b> no saldo do mês esconde os valores para usar o app em público.",nuvem?"No compartilhado, escolha <b>Quem pagou</b> na despesa: a <b>Divisão do mês</b>, no Início, mostra quem deve a quem.":null,"Com o app instalado, <b>compartilhe um comprovante</b> com o Monetra para lançar mais rápido.","No Android, dá para instalar o app pelo botão <b>Baixar o app para Android</b> da página inicial (antes de entrar).")},
    {ic:"check",t:"Pronto para começar!",d:`Comece informando o <b>salário deste mês</b>. Depois é só lançar os gastos do dia a dia no <b>+</b>.`,fim:true}
  ];
}
function abrirTutorial(){ tutAberto=true; tutI=0; renderTutorial(); }
function fecharTutorial(irSalario){
  tutAberto=false; marcaTutVisto(); const el=document.getElementById("tutorial"); if(el) el.remove(); document.body.classList.remove("tutorial");
  if(irSalario){ ui.tab="mes"; ui.month=todayKey; render(); window.scrollTo({top:0}); setTimeout(()=>{ const c=document.getElementById("salMes"); if(c){ c.scrollIntoView({block:"center",behavior:"smooth"}); c.focus({preventScroll:true}); } },150); }
}
function renderTutorial(){
  const ps=passosTutorial(), p=ps[tutI]; let el=document.getElementById("tutorial");
  if(!el){ el=document.createElement("div"); el.id="tutorial"; el.setAttribute("role","dialog"); el.setAttribute("aria-modal","true"); el.setAttribute("aria-labelledby","tutTit"); document.body.appendChild(el); document.body.classList.add("tutorial"); }
  const icone=p.ic==="logo"?`<img class="tutlogo" src="icons/logo-128.png" alt="">`:p.ic==="cofre"?`<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M5 9.5c0-2.5 3.1-4.5 7-4.5s7 2 7 4.5v4c0 2.6-2 4-3 4.5V20h-2.5v-1.6h-3V20H8v-2c-1.7-.8-3-2.3-3-4.5z"/><circle cx="15.5" cy="10.5" r=".9" fill="currentColor"/><path d="M10 7.5h3.5"/></svg>`:(ICON[p.ic]||"");
  el.innerHTML=`<div class="tutbox">
    <button type="button" class="tutpular" data-tut="pular">${p.fim?"Fechar":"Pular"}</button>
    <span class="tutic">${icone}</span>
    <h2 id="tutTit">${p.t}</h2>
    <div class="tuttxt">${p.d}</div>
    <div class="tutpontos" aria-label="Passo ${tutI+1} de ${ps.length}">${ps.map((_,i)=>`<i class="${i===tutI?"on":""}"></i>`).join("")}</div>
    <div class="row2">${tutI>0?`<button class="btn ghost" type="button" data-tut="-1">Anterior</button>`:`<span></span>`}${p.fim?`<button class="btn" type="button" data-tut="fim">Informar o salário</button>`:`<button class="btn" type="button" data-tut="1">${tutI===0?"Começar":"Próximo"}</button>`}</div>
  </div>`;
  const b=el.querySelector('[data-tut="1"],[data-tut="fim"]'); if(b) b.focus({preventScroll:true});
}
document.addEventListener("click",e=>{
  const b=e.target.closest("#tutorial [data-tut]"); if(!b) return;
  const a=b.dataset.tut, n=passosTutorial().length;
  if(a==="pular") return fecharTutorial(false);
  if(a==="fim") return fecharTutorial(true);
  tutI=Math.max(0,Math.min(n-1,tutI+Number(a))); renderTutorial();
});
document.addEventListener("keydown",e=>{ if(!tutAberto||travado) return;
  if(e.key==="Escape"){ e.preventDefault(); e.stopImmediatePropagation(); fecharTutorial(false); }
  else if(e.key==="ArrowRight"){ e.preventDefault(); e.stopImmediatePropagation(); const n=passosTutorial().length; if(tutI<n-1){ tutI++; renderTutorial(); } }
  else if(e.key==="ArrowLeft"){ e.preventDefault(); e.stopImmediatePropagation(); if(tutI>0){ tutI--; renderTutorial(); } }
},true);
function talvezTutorial(){
  if(tutAberto||tutVisto()||travado||ui.sheet||mode==="login"||!state.loaded||precisaTermos()) return;
  const n=Object.values(state.months).reduce((a,m)=>a+((m.gastos||[]).length+(m.avulsos||[]).length),0);
  if(inicioKey()||n>2){ marcaTutVisto(); return; }
  setTimeout(()=>{ if(!tutAberto&&!tutVisto()&&!travado&&!ui.sheet) abrirTutorial(); },400);
}

