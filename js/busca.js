// @ts-check
// Busca de telas.
"use strict";
/** @type {[string,string,string,{tab?:string,h2?:string,sheet?:string,extra?:Object}][]} */
const DESTINOS=[
  ["Início","resumo do mês, saldo e lançamentos","inicio home resumo saldo mes atual",{tab:"mes"}],
  ["Cartões de crédito","limite, fechamento e vencimento","cartoes cartao credito limite fatura nubank fechamento",{tab:"ajustes",h2:"Cartões de crédito"}],
  ["Fatura do cartão","quanto vai pagar neste mês","fatura cartao conta do cartao",{tab:"mes",h2:"Fatura"}],
  ["13º salário","calculadora da 1ª e 2ª parcela","13 13o 13º decimo terceiro salario gratificacao natal",{sheet:"calc",extra:{calc:"decimo"}}],
  ["Férias","calculadora de férias + 1/3","ferias 1/3 terco abono",{sheet:"calc",extra:{calc:"ferias"}}],
  ["Salário líquido","do bruto ao líquido, com INSS e IR","salario liquido bruto inss irrf desconto holerite",{sheet:"calc",extra:{calc:"liquido"}}],
  ["Quanto guardar por mês","para comprar algo no prazo","guardar juntar poupar comprar objetivo",{sheet:"calc",extra:{calc:"guardar"}}],
  ["Simulador de dívidas","juros, parcelas e quitação","simulador divida juros emprestimo financiamento quitar",{sheet:"simulador"}],
  ["Contas fixas","aluguel, luz, internet…","contas fixas fixa aluguel luz agua internet recorrente mensal",{tab:"ajustes",h2:"Contas fixas"}],
  ["Compras parceladas","parcelas em andamento","parcelas parcelado parcelada prestacao",{tab:"ajustes",h2:"Compras parceladas"}],
  ["Categorias","nomes, cores e limites","categorias categoria limite orcamento",{tab:"ajustes",h2:"Categorias de gastos"}],
  ["Regras automáticas","suas palavras para cada categoria","regras regra automatica palavras",{tab:"ajustes",h2:"Regras automáticas"}],
  ["Contas e bancos","saldo por banco ou carteira","contas bancos banco carteira conta corrente",{tab:"ajustes",h2:"Contas"}],
  ["Importar extrato","OFX, CSV ou PDF do banco","importar extrato ofx csv pdf banco fatura",{tab:"ajustes",h2:"Importar extrato do banco"}],
  ["Modo viagem","gastos em outra moeda","viagem moeda dolar euro cambio exterior",{tab:"ajustes",h2:"Modo viagem"}],
  ["Dívidas com pessoas","quem te deve e quem você deve","dividas emprestei devo deve emprestimo pessoa",{tab:"ajustes",h2:"Dívidas com pessoas"}],
  ["Metas","quanto falta para cada objetivo","metas meta objetivo sonho reserva caixinha",{tab:"metas",h2:"Metas de economia"}],
  ["Desafios e conquistas","30 dias sem delivery e outros","desafios desafio conquistas medalhas",{tab:"metas",h2:"Desafios"}],
  ["Relatórios","receitas x despesas e mês a mês","relatorios relatorio graficos ano anual comparar",{tab:"ano"}],
  ["Assinaturas","streaming e contas que se repetem","assinaturas assinatura netflix spotify streaming aumento caro reajuste",{tab:"ano",h2:"Assinaturas e contas fixas"}],
  ["Patrimônio","bens, investimentos e dívidas","patrimonio bens imovel casa apartamento carro veiculo investimento investimentos riqueza liquido",{tab:"ano",h2:"Patrimônio"}],
  ["Imposto de Renda","despesas dedutíveis do ano","imposto renda ir irpf declaracao dedutivel deducao saude educacao recibo",{tab:"ano",h2:"Imposto de Renda"}],
  ["Inflação pessoal","seus gastos x IPCA","inflacao ipca precos subiu aumento custo vida",{tab:"ano",h2:"Sua inflação x IPCA"}],
  ["Quanto renderia","caixinha e metas no CDI e na poupança","rendimento render renderia cdi poupanca juros investir selic",{tab:"metas",h2:"Quanto renderia"}],
  ["Saúde financeira","nota do mês de 0 a 100","saude financeira nota pontuacao score avaliacao",{tab:"mes",h2:"Saúde financeira"}],
  ["Divisão do mês","quem pagou e quem deve no compartilhado","divisao dividir rachar acerto acertar compartilhado casal quem pagou",{tab:"mes",h2:"Divisão do mês"}],
  ["Calendário","vencimentos do mês","calendario vencimentos agenda dia",{tab:"mes",h2:"Calendário"}],
  ["Notificações","avisos e lembretes do app","notificacoes avisos sino alertas",{sheet:"avisos"}],
  ["Lembretes","notificações de vencimento","lembretes lembrete notificacao vencimento",{tab:"perfil",h2:"Lembretes"}],
  ["Acessibilidade","texto maior, contraste, menos movimento","acessibilidade letra fonte texto grande contraste daltonismo movimento leitor",{tab:"perfil",h2:"Acessibilidade"}],
  ["Aparência","tema claro ou escuro","aparencia tema escuro claro dark",{tab:"perfil",h2:"Aparência"}],
  ["Bloqueio com PIN","senha para abrir o app","pin bloqueio senha seguranca",{tab:"perfil",h2:"Bloqueio com PIN"}],
  ["Backup e planilha","baixar backup ou Excel","backup exportar planilha excel restaurar",{tab:"perfil",h2:"Exportar e backup"}],
  ["Renda e saldos","salário padrão e saldo inicial","renda salario saldo inicial receita fixa",{tab:"perfil",h2:"Renda e saldos"}],
  ["Tutorial","como usar o app","tutorial ajuda como usar",{tab:"perfil",h2:"Tutorial"}],
  ["Perfil","sua conta","perfil conta sair login",{tab:"perfil"}],
  ["Ajustes","tudo que dá para configurar","ajustes configuracoes configurar engrenagem",{tab:"ajustes"}]
];
function destinosBusca(q){
  const ws=limpaPal(q).split(" ").filter(Boolean); if(!ws.length) return [];
  const bate=(lista,w)=>lista.some(p=>p.startsWith(w)||(w.length>=4&&w.startsWith(p)&&p.length>=3));
  return DESTINOS.map((d,i)=>{ const tit=limpaPal(d[0]).split(" "), pal=tit.concat(d[2].split(" "));
      return {d,i,ok:ws.every(w=>bate(pal,w)),nota:(tit[0].startsWith(ws[0])?0:ws.every(w=>bate(tit,w))?1:2)}; })
    .filter(x=>x.ok).sort((a,b)=>a.nota-b.nota||a.i-b.i).slice(0,4);
}
/** @param {number} i */
function irDestino(i){
  const d=DESTINOS[i]; if(!d) return; const a=d[3]; closeSheet();
  if(a.sheet){ openSheet(a.sheet,null,a.extra||null); return; }
  ui.tab=a.tab||"mes"; if(a.tab==="mes") ui.month=ui.month||todayKey; render();
  const hs=[...document.querySelectorAll("#conteudo h2")], h=a.h2?(hs.find(x=>x.textContent.trim()===a.h2)||hs.find(x=>x.textContent.trim().startsWith(/** @type {string} */(a.h2)))):null;
  const alvo=/** @type {HTMLElement|null} */(h?(h.closest(".card")||h):document.getElementById("conteudo"));
  if(!alvo){ window.scrollTo({top:0}); return; }
  setTimeout(()=>{ alvo.scrollIntoView({block:"start",behavior:semMovimento()?"auto":"smooth"}); if(h){ alvo.classList.remove("realce"); void alvo.offsetWidth; alvo.classList.add("realce"); setTimeout(()=>alvo.classList.remove("realce"),1600); }
    if(!alvo.hasAttribute("tabindex")) alvo.setAttribute("tabindex","-1"); alvo.focus({preventScroll:true}); anunciar("Aberto: "+d[0]); },60);
}
