// @ts-check
(function(){
"use strict";
/* =====================================================================
   Monetra — controle de gastos
   ===================================================================== */
/* ---------------------------------------------------------------------
   Tipos (JSDoc) — só para o editor e para o "tsc --noEmit" checarem o código.
   Não mudam nada no funcionamento: são comentários.
   Base: defaultConfig, normConfig, normMonth e limpaItem.
   --------------------------------------------------------------------- */
/** Chave de mês no formato "AAAA-MM" (ex.: "2026-10").
 * @typedef {string} MesKey */
/** Data no formato "AAAA-MM-DD".
 * @typedef {string} DataISO */
/** Forma de pagamento: "pix" | "debito" | "credito" | "dinheiro" | "boleto" (ou outra vinda de importação).
 * @typedef {string} Forma */
/**
 * Valor original em moeda estrangeira (modo viagem).
 * @typedef {Object} ValorOrig
 * @property {string} moeda   código de 3 letras (USD, EUR…)
 * @property {number} valor
 * @property {number} cotacao
 * @property {number} taxa
 */
/**
 * Lançamento genérico de um mês (despesa, receita avulsa, caixinha ou transferência) — saída de limpaItem.
 * Os campos opcionais só existem em alguns tipos de lançamento.
 * @typedef {Object} Gasto
 * @property {string} id
 * @property {number} dia          1 a 31
 * @property {number} valor
 * @property {string} desc
 * @property {string} [cat]        id da categoria
 * @property {string} [sub]        id da subcategoria
 * @property {Forma}  [forma]
 * @property {string} [contaId]
 * @property {string} [cartaoId]
 * @property {string} [metaId]     caixinha: meta ligada
 * @property {string} [tipo]       caixinha: "guardar" | "retirar"
 * @property {string} [de]         transferência: conta de origem
 * @property {string} [para]       transferência: conta de destino
 * @property {string} [por]        quem lançou (controle compartilhado)
 * @property {string} [imp]        id da importação de extrato
 * @property {string} [viagemId]
 * @property {string[]} [tags]
 * @property {boolean} [pago]
 * @property {DataISO} [pagoEm]
 * @property {ValorOrig} [orig]
 */
/**
 * Lançamento como aparece nas listas calculadas (faturaDoMes, cartaoDoMes, despesasDoMes):
 * um Gasto, uma parcela do mês ou uma conta fixa do mês, com alguns campos a mais.
 * @typedef {Object} ItemMes
 * @property {string} id
 * @property {number} dia
 * @property {number} valor
 * @property {string} [desc]
 * @property {string} [cat]
 * @property {string|null} [sub]
 * @property {Forma}  [forma]
 * @property {string|null} [contaId]
 * @property {string|null} [cartaoId]
 * @property {string[]} [tags]
 * @property {boolean} [pago]
 * @property {MesKey} [compraK]    mês da compra (itens de fatura)
 * @property {boolean} [parcela]
 * @property {number} [idx]        parcela: número desta parcela
 * @property {number} [n]          parcela: total de parcelas
 * @property {boolean} [fixo]
 * @property {boolean} [pular]
 * @property {boolean} [cartao]
 */
/**
 * Parcela de uma compra parcelada que cai num mês (saída de parcelasDoMes).
 * @typedef {Object} ParcelaMes
 * @property {string} id
 * @property {true} parcela
 * @property {number} idx          número desta parcela (1 = primeira)
 * @property {number} n            total de parcelas
 * @property {string} desc
 * @property {string} cat
 * @property {string|null} sub
 * @property {string[]} tags
 * @property {Forma} forma
 * @property {string|null} contaId
 * @property {string|null} cartaoId
 * @property {number} dia
 * @property {number} valor
 * @property {number} total
 * @property {MesKey} compra
 * @property {boolean} cartao      true quando entra na fatura de um cartão
 * @property {boolean} pago
 * @property {DataISO|null} pagoEm
 */
/**
 * Mês guardado (saída de normMonth). As chaves de fixos/rendas/parcelas/faturasPagas são ids.
 * @typedef {Object} Mes
 * @property {number|null} salario
 * @property {Gasto[]} avulsos     receitas avulsas
 * @property {Gasto[]} gastos      despesas lançadas à mão
 * @property {Gasto[]} caixinha
 * @property {Object<string,{pago?:boolean,valor?:number,pular?:boolean,pagoEm?:string}>} fixos
 * @property {Object<string,{valor?:number,pular?:boolean,pago?:boolean,pagoEm?:string}>} rendas
 * @property {Object<string,{pago?:boolean,pagoEm?:string}>} parcelas
 * @property {Object<string,boolean>} faturasPagas
 * @property {Gasto[]} transf
 * @property {boolean} faturaPaga  versões antigas (um cartão só)
 */
/**
 * @typedef {Object} Subcategoria
 * @property {string} id
 * @property {string} nome
 */
/**
 * @typedef {Object} Categoria
 * @property {string} id
 * @property {string} nome
 * @property {number} orcamento    limite do mês (0 = sem limite)
 * @property {number|null} [cor]   0 a 11
 * @property {string|null} [ic]    nome do ícone
 * @property {boolean} [sobra]     orçamento com sobra acumulada
 * @property {MesKey|null} [sobraDesde]
 * @property {Subcategoria[]} [subs]
 */
/**
 * Conta fixa (aluguel, internet…).
 * @typedef {Object} Fixo
 * @property {string} id
 * @property {string} nome
 * @property {string} cat
 * @property {number} valor
 * @property {number} dia
 * @property {Forma} forma
 * @property {MesKey} desde
 * @property {MesKey|null} ate
 * @property {string|null} contaId
 */
/**
 * Compra parcelada (cadastro).
 * @typedef {Object} Parcela
 * @property {string} id
 * @property {string} desc
 * @property {string} cat
 * @property {string|null} sub
 * @property {string[]} tags
 * @property {Forma} forma
 * @property {number} total
 * @property {number} n            2 a 48
 * @property {MesKey} compra
 * @property {number} dia
 * @property {number|null} venc    dia de vencimento (fora do cartão)
 * @property {string|null} contaId
 * @property {string|null} cartaoId
 * @property {string|null} viagemId
 * @property {ValorOrig|null} orig
 */
/**
 * Renda fixa (bolsa, pensão, aluguel recebido…).
 * @typedef {Object} Renda
 * @property {string} id
 * @property {string} nome
 * @property {number} valor
 * @property {number} dia          dia em que cai (1 a 31; rendas antigas sem dia = 1)
 * @property {MesKey} desde
 * @property {MesKey|null} ate
 * @property {string|null} contaId
 */
/**
 * @typedef {Object} Cartao
 * @property {string} id
 * @property {string} nome
 * @property {number|null} fecha   dia de fechamento
 * @property {number|null} vence   dia de vencimento
 * @property {number} limite
 * @property {string|null} contaId conta que paga a fatura
 */
/**
 * Conta bancária / carteira.
 * @typedef {Object} Conta
 * @property {string} id
 * @property {string} nome
 * @property {string} tipo         "corrente" | "poupanca" | "dinheiro"…
 * @property {number} saldoInicial
 */
/**
 * Meta de economia.
 * @typedef {Object} Meta
 * @property {string} id
 * @property {string} nome
 * @property {number} alvo
 * @property {MesKey|null} prazo
 */
/**
 * @typedef {Object} PagamentoDivida
 * @property {string} id
 * @property {number} valor
 * @property {DataISO|null} data
 */
/**
 * Dívida com uma pessoa.
 * @typedef {Object} Divida
 * @property {string} id
 * @property {string} pessoa
 * @property {"pagar"|"receber"} tipo
 * @property {number} valor
 * @property {string} desc
 * @property {DataISO|null} data
 * @property {DataISO|null} venc
 * @property {PagamentoDivida[]} pags
 */
/**
 * @typedef {Object} Viagem
 * @property {string} id
 * @property {string} nome
 * @property {string} moeda
 * @property {number} cotacao
 * @property {number} taxa         % (IOF + spread)
 * @property {DataISO|null} inicio
 * @property {DataISO|null} fim
 * @property {number} orcamento
 */
/**
 * @typedef {Object} Desafio
 * @property {string} id
 * @property {string} nome
 * @property {"sem"|"max"} tipo    "sem" = não gastar; "max" = gastar no máximo `valor`
 * @property {string|null} cat
 * @property {string} palavras
 * @property {number} dias
 * @property {DataISO} inicio
 * @property {number} valor
 */
/**
 * Configurações (saída de normConfig / defaultConfig).
 * @typedef {Object} Config
 * @property {Desafio[]} desafios
 * @property {Viagem[]} viagens
 * @property {Divida[]} dividas
 * @property {{v:string,em:string}|null} termos
 * @property {number} salarioPadrao
 * @property {number} saldoInicial
 * @property {number} saldoCaixinha
 * @property {MesKey} ate
 * @property {MesKey|null} inicio
 * @property {Parcela[]} parcelas
 * @property {Renda[]} rendas
 * @property {Meta[]} metas
 * @property {Cartao[]} cartoes
 * @property {Conta[]} contas
 * @property {string|null} contaSalario
 * @property {Categoria[]} categorias
 * @property {Fixo[]} fixos
 */
/**
 * Folha (janela) aberta. `tipo` diz qual é; os outros campos dependem do tipo.
 * @typedef {Object} Folha
 * @property {string} tipo
 * @property {string|null} id
 * @property {MesKey} [mes]
 * @property {number} [ano]
 * @property {string} [calc]
 * @property {number} [dia]
 * @property {string} [fim]
 * @property {MesKey} [sel]
 * @property {string} [q]
 * @property {Array<any>} [itens]
 * @property {string} [pinModo]
 * @property {boolean} [cartaoArq]   importação: o arquivo é fatura de cartão
 * @property {string} [cartaoImp]
 * @property {string} [contaImp]
 * @property {string} [dTipo]       dívida: "receber" | "pagar"
 * @property {string} [cxTipo]      caixinha: "guardar" | "retirar"
 * @property {number} [slide]       retrospectiva: tela atual
 * @property {any} [mod]             importação: itens lidos do extrato
 * @property {string} [erroImp]
 * @property {any} [arquivo]
 * @property {string} [valorRasc]
 * @property {number} [simSaldo]
 * @property {string} [metaId]
 * @property {string} [nomeRasc]
 */
/**
 * Estado da interface (o que está aberto, filtros, mensagens temporárias).
 * @typedef {Object} UI
 * @property {Object<string,boolean>} abre   seções abertas (guardado no aparelho)
 * @property {string} tab                    "mes" | "ano" | "metas" | "perfil" | "ajustes"
 * @property {MesKey|null} month
 * @property {Folha|null} sheet
 * @property {string} importMsg
 * @property {string} loginModo
 * @property {boolean} [verLogin]   pulou a página de apresentação e quer ver o cartão de login
 * @property {string|null} gCat              última categoria usada
 * @property {Forma} gForma                  última forma de pagamento usada
 * @property {string} filtro                 filtro de categoria em "Últimos lançamentos"
 * @property {string|null} [gConta]
 * @property {string|null} [gCartao]
 * @property {string} [forma]
 * @property {string|null} [rolarPara]       id do elemento para rolar depois de desenhar
 * @property {boolean} [ocupado]
 * @property {boolean} [lerTermos]
 * @property {number} [revogarCont]     toques em "Retirar meu aceite"
 * @property {boolean} [verQuit]
 * @property {boolean} [verCats]
 * @property {string|null} [verTodas]
 * @property {string|null} [verTodasRec]
 * @property {string} [convErro]
 * @property {string} [compErro]
 * @property {boolean} [confirmaApagar]
 * @property {boolean} [recusouTermos]
 * @property {string} [conviteUrl]
 * @property {any} [repetidos]
 */
/**
 * Resultado de calc(k).
 * @typedef {Object} CalcMes
 * @property {number} salario
 * @property {number} avulsos
 * @property {number} rendas
 * @property {number} despesas
 * @property {number} receitas
 * @property {number} saldo
 * @property {number} guardado
 * @property {number} retirado
 * @property {number|null} porDia
 * @property {string} porDiaSub
 * @property {Object<string,number>} porCat
 * @property {Object<string,number>} porForma
 * @property {number} dim          dias do mês
 * @property {number} fixosTotal
 * @property {number} fixosPend
 * @property {number} fatura
 * @property {number} pct          despesas / receitas
 */
/**
 * Resultado de previsaoMes(k).
 * @typedef {Object} Previsao
 * @property {number} dia
 * @property {number} rest
 * @property {number} dim
 * @property {number} ritmo        gasto do dia a dia por dia (fora do cartão)
 * @property {number} extra
 * @property {number} saldo        saldo previsto para o fim do mês
 * @property {number} cartao       previsto no cartão até o fim do mês
 * @property {number} foraRitmo    compras grandes que não entram no ritmo
 * @property {number} grande
 * @property {(id:string)=>number} ritmoCat
 */
const NOMES=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const ABR=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const INICIO="2026-09", PADRAO_ATE="2027-12", LIMITE_ATE="2036-12";
const DEFAULT_CATS=["Mercado / Alimentação","Moradia (aluguel, condomínio)","Contas (luz, água, internet, celular)","Transporte / Combustível","Saúde / Farmácia","Educação","Lazer / Restaurantes","Compras / Vestuário","Outros"];
const FORMAS=[["pix","Pix"],["debito","Débito"],["credito","Crédito"],["dinheiro","Dinheiro"],["boleto","Boleto"]];
const LSKEY="meucaixa.v1";
/* Versão do app — ao publicar, atualize aqui, no sw.js (CACHE) e no CHANGELOG.md */
const VERSAO="5.0.29";
const NOVIDADES=[
  "Novo painel Acessibilidade no Perfil, salvo neste aparelho: tamanho do texto (até 150%), alto contraste, cores para daltonismo, sem animações, modo calmo, fonte de leitura fácil, botões maiores e links sublinhados.",
  "Com cores para daltonismo, positivo fica azul e negativo laranja, e barras acima do limite ganham listras, sem depender só da cor.",
  "O modo calmo tira brilhos, auras, confete e efeitos, para quem se incomoda com estímulos visuais."
];

/* ---------- utilidades ---------- */
const pad2=n=>String(Math.trunc(Number(n))||0).padStart(2,"0");
const keyOf=(y,m)=>y+"-"+pad2(m);
function shiftKey(k,n){ let y=+k.slice(0,4), m=+k.slice(5)+n; while(m>12){m-=12;y++;} while(m<1){m+=12;y--;} return keyOf(y,m); }
const kY=k=>+k.slice(0,4), kM=k=>+k.slice(5);
const diasMes=k=>new Date(kY(k),kM(k),0).getDate();
const nomeMes=k=>NOMES[kM(k)-1]+" "+kY(k);
const abrMes=k=>ABR[kM(k)-1].toLowerCase()+"/"+String(kY(k)).slice(2);
const brl=v=>(Number(v)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
/* valor de destaque: "R$" e centavos menores que o número inteiro (o texto lido é o mesmo de brl) */
const valorGrande=v=>{ const t=brl(v), m=t.match(/^(-?)\s*R\$\s*([\d.]+)(,\d{2})$/); if(!m) return esc(t); return `<span class="sr">${esc(t.replace(/\s/g," "))}</span><span aria-hidden="true">${m[1]}<span class="vg-rs">R$</span>${m[2]}<span class="vg-cs">${m[3]}</span></span>`; };
const brlT=v=>(Number(v)||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}); // tabela: sem "R$" para caber no celular
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const uidGen=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
const formaNome=f=>(FORMAS.find(x=>x[0]===f)||[null,"Não informado"])[1];
/* Aceita "1.200", "1.200,50", "1200", "25,9", "R$ 2.800,00". Ponto seguido de 3 dígitos = milhar. */
/* valor de cada parcela em centavos inteiros: a diferença de centavos fica na última */
/**
 * Valor da parcela i (0 = primeira) de um total dividido em n, em centavos inteiros.
 * @param {number} total
 * @param {number} n
 * @param {number} i
 * @returns {number}
 */
function valorParcela(total,n,i){ const c=Math.round((Number(total)||0)*100), b=Math.floor(c/n); return (i===n-1?c-b*(n-1):b)/100; }
function faltaParcelas(total,n,idx){ const c=Math.round((Number(total)||0)*100), b=Math.floor(c/n); return Math.max(0,c-b*(idx-1))/100; }
/**
 * Lê um valor digitado ("1.200,50", "R$ 2.800", "25,9"). Devolve NaN se não for número.
 * @param {string|number|null|undefined} s
 * @returns {number}
 */
function parseMoney(s){
  s=String(s||"").replace(/R\$|\s/g,"");
  if(!s) return NaN;
  if(s.includes(",")) s=s.replace(/\./g,"").replace(",",".");
  else if(/^-?\d{1,3}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,"");
  const n=Number(s); return isFinite(n)?Math.round(n*100)/100:NaN;
}
/* Valor para mostrar num campo: vazio quando é zero (para não juntar com o que a pessoa digitar) */
const moneyInput=v=>(v===null||v===undefined||v===""||!Number(v))?"":Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
/* Campos de dinheiro: seleciona tudo ao tocar, aceita só números/ponto/vírgula e formata ao sair */
const ehCampoDinheiro=el=>el&&el.tagName==="INPUT"&&el.closest(".money");
document.addEventListener("focusin",e=>{ const el=e.target; if(ehCampoDinheiro(el)&&el.value) setTimeout(()=>{ try{ el.select(); }catch(_){} },0); });
/* Máscara estilo banco: os números entram da direita para a esquerda, já com ponto do milhar e vírgula dos centavos */
function mascaraDinheiro(el){
  const bruto=el.value, neg=!!el.dataset.neg&&bruto.includes("-"), todos=bruto.replace(/\D/g,""), dig=todos.replace(/^0+/,"").slice(0,13);
  el.value=dig?(neg?"-":"")+(Number(dig)/100).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}):(todos?"0,00":(neg?"-":""));
  try{ const n=el.value.length; el.setSelectionRange(n,n); }catch(_){}
}
document.addEventListener("input",e=>{ const el=e.target; if(ehCampoDinheiro(el)) mascaraDinheiro(el); if(el.id==="s-valor"&&document.getElementById("s-vgon")) setTimeout(()=>{ try{ atualizaVg(); }catch(_){} },0); },true);
/* Colar "1.200" ou "1200,50" mantém o valor certo */
document.addEventListener("paste",e=>{ const el=e.target; if(!ehCampoDinheiro(el)) return; const t=(e.clipboardData||window.clipboardData)?.getData("text")||""; let v=parseMoney(t); e.preventDefault(); if(isNaN(v)) return; if(v<0&&!el.dataset.neg) v=-v; el.value=v===0?"0,00":(v<0?"-":"")+moneyInput(Math.abs(v)); el.dispatchEvent(new Event("input",{bubbles:true})); },true);
document.addEventListener("blur",e=>{ const el=e.target; if(!ehCampoDinheiro(el)||!el.value.trim()) return; const v=parseMoney(el.value); if(v>0) el.value=moneyInput(v); else if(v<0&&el.dataset.neg) el.value="-"+moneyInput(-v); },true);
/* ícones das categorias (traço simples, herdam a cor da categoria) */
const ICAT={
  carrinho:'<path d="M3 4h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.2"/><circle cx="9.5" cy="19.5" r="1.3"/><circle cx="17" cy="19.5" r="1.3"/>',
  casa:'<path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10v9h11v-9"/><path d="M10 19v-5h4v5"/>',
  raio:'<path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12z"/>',
  carro:'<path d="M5 13.5 6.8 8.3A2 2 0 0 1 8.7 7h6.6a2 2 0 0 1 1.9 1.3l1.8 5.2"/><rect x="3.5" y="13" width="17" height="4.5" rx="1.5"/><path d="M6 17.5V19.5M18 17.5V19.5"/><circle cx="7.5" cy="15.3" r=".7"/><circle cx="16.5" cy="15.3" r=".7"/>',
  saude:'<path d="M12 20s-7-4.4-7-9.6A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.4c0 5.2-7 9.6-7 9.6z"/><path d="M12 11v4M10 13h4"/>',
  livro:'<path d="M4.5 5.5c2.5-1 5-1 7.5.5 2.5-1.5 5-1.5 7.5-.5v13c-2.5-1-5-1-7.5.5-2.5-1.5-5-1.5-7.5-.5z"/><path d="M12 6v13"/>',
  taca:'<path d="M7 4h10l-1 6a4 4 0 0 1-8 0z"/><path d="M12 14v6M8.5 20h7"/>',
  sacola:'<path d="M5.5 8h13l-1 12h-11z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
  pata:'<circle cx="7" cy="10" r="1.7"/><circle cx="17" cy="10" r="1.7"/><circle cx="10" cy="6.5" r="1.6"/><circle cx="14" cy="6.5" r="1.6"/><path d="M12 12.5c-2.6 0-4.5 2.7-4.5 4.6 0 1.5 1.3 2.2 2.6 1.8l1.9-.6 1.9.6c1.3.4 2.6-.3 2.6-1.8 0-1.9-1.9-4.6-4.5-4.6z"/>',
  presente:'<path d="M4.5 9.5h15v3h-15zM6 12.5h12V20H6zM12 9.5V20"/><path d="M12 9.5c-1.5-3.5-5-3.5-5-1.2C7 9.5 9 9.5 12 9.5zm0 0c1.5-3.5 5-3.5 5-1.2 0 1.2-2 1.2-5 1.2z"/>',
  aviao:'<path d="M10.5 20.5 12 16l-6.5-2.7a1 1 0 0 1-.1-1.8L7 10.6l5 1.6 4.2-6.5a2 2 0 0 1 3.4 2.1L17 13.2l1.4 5a1 1 0 0 1-.5 1.2l-1.2.6-3-4.4-1.9 4.9z"/>',
  cafe:'<path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z"/><path d="M16 10.5h1.5a2 2 0 0 1 0 4H16"/><path d="M8 4.5c0 1 1 1 1 2M11.5 4.5c0 1 1 1 1 2"/>',
  celular:'<rect x="7.5" y="3.5" width="9" height="17" rx="2"/><path d="M11 17.5h2"/>',
  dinheiro:'<rect x="3.5" y="7" width="17" height="10" rx="2"/><circle cx="12" cy="12" r="2.3"/>',
  pontos:'<circle cx="6.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="17.5" cy="12" r="1.3"/>'
};
const ICON_ALERTA='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 2.8 19.5a1 1 0 0 0 .9 1.5h16.6a1 1 0 0 0 .9-1.5z"/><path d="M12 10v4.5M12 17.6v.1"/></svg>', ICON_RELOGIO='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>';
const ICAT_NOMES={carrinho:"Mercado",casa:"Casa",raio:"Contas",carro:"Transporte",saude:"Saúde",livro:"Educação",taca:"Lazer",sacola:"Compras",pata:"Pet",presente:"Presente",aviao:"Viagem",cafe:"Café",celular:"Celular",dinheiro:"Dinheiro",pontos:"Outros"};
function icAuto(nome){ const n=String(nome||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  return /mercad|aliment|super|feira/.test(n)?"carrinho":/morad|alug|casa|condom/.test(n)?"casa":/conta|luz|agua|internet|energia/.test(n)?"raio":/transp|combust|carro|uber|gasol/.test(n)?"carro":/saude|farm|medic/.test(n)?"saude":/educa|escola|curso|faculd/.test(n)?"livro":/lazer|restaur|bar|cinema/.test(n)?"taca":/compra|vestu|roupa|loja/.test(n)?"sacola":/pet|cachorro|gato/.test(n)?"pata":/present/.test(n)?"presente":/viag/.test(n)?"aviao":/cafe|padar|lanche/.test(n)?"cafe":/celular|telefone/.test(n)?"celular":/invest|poup/.test(n)?"dinheiro":"pontos"; }
const catIc=id=>{ const ct=state.config.categorias.find(c=>c.id===id); const k=ct?(ICAT[ct.ic]?ct.ic:icAuto(ct.nome)):"pontos"; return k; };
const svgCat=(k,px)=>`<svg viewBox="0 0 24 24" width="${px||18}" height="${px||18}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICAT[k]||ICAT.pontos}</svg>`;
const icoCat=(id,px)=>`<span class="ico" style="--dot:${catColor(id)}">${svgCat(catIc(id),px)}</span>`;
const ICON={
  inicio:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10v9h11v-9"/><path d="M10 19v-5h4v5"/></svg>',
  relat:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M5 20V11M10 20V5M15 20v-7M20 20V8"/></svg>',
  metas:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
  aviao:'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M10.5 20.5 12 16l-6.5-2.7a1 1 0 0 1-.1-1.8L7 10.6l5 1.6 4.2-6.5a2 2 0 0 1 3.4 2.1L17 13.2l1.4 5a1 1 0 0 1-.5 1.2l-1.2.6-3-4.4-1.9 4.9z"/></svg>',
  digital:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6.5 6.2A7.5 7.5 0 0 1 19.5 11v1.2"/><path d="M4.6 9.4a7.6 7.6 0 0 0-.1 1.6v2.5"/><path d="M8 18.5a14 14 0 0 0 1-5.5V11a3 3 0 0 1 6 0v1.5"/><path d="M12 11v2a17 17 0 0 1-1.6 7"/><path d="M15 15.5a20 20 0 0 1-1 4.5"/><path d="M18.6 15.2c-.1 1.2-.3 2.4-.6 3.5"/></svg>',
  cadeado:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  apagar:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 6h10a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 18H9l-5.5-6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 9.5l5 5M17 9.5l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  sino:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 1.9H4.4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9.8 20.6a2.4 2.4 0 0 0 4.4 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  grupo:'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="9" cy="8.5" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="16.5" cy="9.5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 19c.9-3 3-4.6 5.5-4.6s4.6 1.6 5.5 4.6M14.5 14.6c.6-.2 1.3-.3 2-.3 2.1 0 3.7 1.3 4.4 3.9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  lixo:'<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  banco:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 9l9-5 9 5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  dinheiro:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="2.5" y="6" width="19" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  poupanca:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 11a7 6 0 0 1 13-2h2v4l-2 1v3h-3v-2H10v2H7v-3a6 6 0 0 1-2-3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="15" cy="10.5" r="1" fill="currentColor"/></svg>',
  cartao:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M2.5 10h19M6 15h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  busca:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 15.5L20 20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  mes:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  ano:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 20V11M10 20V5M15 20v-7M20 20V8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  ajustes:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="16" cy="7" r="2.3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="10" cy="17" r="2.3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  perfil:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="8.5" r="3.8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4.5 20c1.3-3.6 4.2-5.5 7.5-5.5s6.2 1.9 7.5 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  mais:'<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  check:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  repete:'<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

/* ---------- estado ---------- */
/** @returns {Config} */
function defaultConfig(){ return {desafios:[],viagens:[],dividas:[],termos:null,salarioPadrao:0,saldoInicial:0,saldoCaixinha:0,ate:PADRAO_ATE,inicio:null,parcelas:[],rendas:[],metas:[],cartoes:[],contas:[],contaSalario:null,categorias:DEFAULT_CATS.map((n,i)=>({id:"c"+(i+1),nome:n,orcamento:0})),fixos:[]}; }
/** @type {{config:Config, months:Object<string,Mes>, loaded:boolean}} */
const state={config:defaultConfig(), months:{}, loaded:false};
let MESES=[];
const today=new Date();
const todayKey=keyOf(today.getFullYear(),today.getMonth()+1);
/* Meses existentes: de setembro/2026 até 2 meses depois do mês atual (avança sozinho com o calendário) */
function buildMeses(){ MESES=[]; const fim=state.loaded?fimMeses():shiftKey(todayKey,2); let k=INICIO; while(k<=fim){ MESES.push(k); k=shiftKey(k,1); } }
/* até onde vão os meses: 2 meses à frente ou até a última parcela a pagar (cartão ou não) */
function fimMeses(){ let fim=shiftKey(todayKey,2);
  try{ for(const p of state.config.parcelas||[]){ if(!p||!p.compra) continue; const cc=p.forma==="credito"?cartaoDe(p):null; const prim=cartaoOk(cc)?faturaMes(p.compra,p.dia,cc):p.compra; const u=shiftKey(prim,Math.max(1,Number(p.n)||1)-1); if(u>fim) fim=u; } }catch(e){}
  return fim>LIMITE_ATE?LIMITE_ATE:fim; }
/* mês futuro com fatura do cartão ou parcela para pagar */
function temContaNoMes(k){ try{ return parcelasDoMes(k).length>0||soma(faturaDoMes(k))>0; }catch(e){ return false; } }
/* os 4 meses da barra: anterior, atual e os próximos com conta a pagar (completa com os seguintes) */
function chipsMes(){
  const V=mesesVisiveis(), prev=shiftKey(todayKey,-1), max=4;
  let out=[prev,todayKey].filter(k=>V.includes(k));
  V.filter(k=>k>todayKey&&temContaNoMes(k)).forEach(k=>{ if(out.length<max) out.push(k); });
  V.filter(k=>k>todayKey).forEach(k=>{ if(out.length<max&&!out.includes(k)) out.push(k); });
  V.filter(k=>k<prev).reverse().forEach(k=>{ if(out.length<max) out.unshift(k); });
  out=[...new Set(out)].sort();
  if(ui.month&&V.includes(ui.month)&&!out.includes(ui.month)){
    out.push(ui.month); out.sort();
    while(out.length>max){ let far=-1, dist=-1; out.forEach((k,i)=>{ if(k===ui.month||k===todayKey) return; const d=Math.abs(entre(k,ui.month)); if(d>dist){ dist=d; far=i; } }); if(far<0) break; out.splice(far,1); }
  }
  return out;
}
/* Meses que aparecem na barra: do início do controle (ou do mês atual) até 2 meses à frente */
function mesesVisiveis(){
  const comDados=Object.keys(state.months).filter(k=>{ const m=state.months[k]; return m&&((m.gastos&&m.gastos.length)||(m.avulsos&&m.avulsos.length)||(m.caixinha&&m.caixinha.length)||typeof m.salario==="number"); });
  const de=[inicioKey(),todayKey,...comDados].filter(Boolean).sort()[0];
  return MESES.filter(k=>k>=de);
}

/** @type {UI} */
const ui={abre:(()=>{ try{ const x=JSON.parse(localStorage.getItem("mb.abre")||"{}"); return x&&typeof x==="object"&&!Array.isArray(x)?x:{}; }catch(e){ return {}; } })(),tab:"mes",month:null,sheet:null,importMsg:"",loginModo:"entrar",gCat:null,gForma:"pix",filtro:""};
let mode="loading", uid=null, statusTxt="Carregando…", statusCls="";
buildMeses();
ui.month=todayKey;
try{ ui.gForma=localStorage.getItem("meucaixa.ui.forma")||"pix"; }catch(e){}

/* limpa cada lançamento vindo de fora (nuvem, backup, outro participante): tipos certos e nada de HTML escondido */
/**
 * @param {any} x
 * @returns {Gasto|null}
 */
function limpaItem(x){
  if(!x||typeof x!=="object"||Array.isArray(x)) return null;
  const o=Object.assign({},x);
  o.id=String(x.id!=null?x.id:uidGen()); o.dia=Math.min(31,Math.max(1,Math.round(Number(x.dia))||1)); o.valor=Number(x.valor)||0; o.desc=x.desc==null?"":String(x.desc);
  ["cat","forma","contaId","cartaoId","sub","metaId","tipo","de","para","por","imp","viagemId"].forEach(k=>{ if(k in o){ if(o[k]==null) delete o[k]; else o[k]=String(o[k]); } });
  if("tags" in o){ if(Array.isArray(o.tags)) o.tags=[...new Set(o.tags.map(t=>String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9_-]+/g,"").slice(0,24)).filter(Boolean))].slice(0,10); else delete o.tags; }
  if("pagoEm" in o&&!(typeof o.pagoEm==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(o.pagoEm))) delete o.pagoEm;
  if("pago" in o) o.pago=!!o.pago;
  if("orig" in o){ const g=o.orig; if(g&&typeof g==="object"&&/^[A-Z]{3}$/.test(g.moeda||"")) o.orig={moeda:g.moeda,valor:Number(g.valor)||0,cotacao:Number(g.cotacao)||0,taxa:Number(g.taxa)||0}; else delete o.orig; }
  return o;
}
const listaLimpa=a=>Array.isArray(a)?a.map(limpaItem).filter(Boolean):[];
const mesValido=k=>typeof k==="string"&&/^\d{4}-(0[1-9]|1[0-2])$/.test(k);
/**
 * @param {any} d
 * @returns {Mes}
 */
function normMonth(d){
  return {salario:(typeof d?.salario==="number"&&isFinite(d.salario))?d.salario:null,
    avulsos:listaLimpa(d?.avulsos),
    gastos:listaLimpa(d?.gastos),
    caixinha:listaLimpa(d?.caixinha),
    fixos:(d&&typeof d.fixos==="object"&&!Array.isArray(d.fixos))?d.fixos:{},
    rendas:(d&&typeof d.rendas==="object"&&!Array.isArray(d.rendas))?d.rendas:{},
    parcelas:(d&&typeof d.parcelas==="object"&&!Array.isArray(d.parcelas))?d.parcelas:{},
    faturasPagas:(d&&typeof d.faturasPagas==="object"&&!Array.isArray(d.faturasPagas))?d.faturasPagas:{},
    transf:listaLimpa(d?.transf),
    faturaPaga:!!(d&&d.faturaPaga)};
}
/**
 * @param {any} d
 * @returns {Config}
 */
function normConfig(d){
  const ate=(typeof d?.ate==="string"&&/^\d{4}-\d{2}$/.test(d.ate)&&d.ate>=INICIO&&d.ate<=LIMITE_ATE)?d.ate:PADRAO_ATE;
  const cats=Array.isArray(d?.categorias)&&d.categorias.length?d.categorias.map(c=>({id:String(c.id),nome:String(c.nome||""),orcamento:Number(c.orcamento)||0,cor:(typeof c.cor==="number"&&c.cor>=0&&c.cor<12)?c.cor:null,ic:typeof c.ic==="string"&&/^[a-z]{2,12}$/.test(c.ic)?c.ic:null,sobra:c.sobra===true,sobraDesde:typeof c.sobraDesde==="string"&&/^\d{4}-(0[1-9]|1[0-2])$/.test(c.sobraDesde)?c.sobraDesde:null,subs:Array.isArray(c.subs)?c.subs.filter(x=>x&&x.id&&x.nome).map(x=>({id:String(x.id),nome:String(x.nome)})):[]})):defaultConfig().categorias;
  const fixos=Array.isArray(d?.fixos)?d.fixos.map(f=>({id:String(f.id),nome:String(f.nome||"Conta fixa"),cat:String(f.cat||""),valor:Number(f.valor)||0,dia:Math.min(31,Math.max(1,Number(f.dia)||1)),forma:String(f.forma||"boleto"),desde:/^\d{4}-\d{2}$/.test(f.desde||"")?f.desde:INICIO,ate:/^\d{4}-\d{2}$/.test(f.ate||"")?f.ate:null,contaId:f.contaId?String(f.contaId):null})):[];
  const inicio=(typeof d?.inicio==="string"&&/^\d{4}-\d{2}$/.test(d.inicio))?d.inicio:null;
  const mk=x=>/^\d{4}-\d{2}$/.test(x||"");
  const parcelas=Array.isArray(d?.parcelas)?d.parcelas.filter(p=>p&&p.id).map(p=>({viagemId:p.viagemId?String(p.viagemId):null,orig:p.orig&&/^[A-Z]{3}$/.test(p.orig.moeda||"")?{moeda:p.orig.moeda,valor:Number(p.orig.valor)||0,cotacao:Number(p.orig.cotacao)||0,taxa:Number(p.orig.taxa)||0}:null,sub:p.sub?String(p.sub):null,tags:Array.isArray(p.tags)?p.tags.map(String).slice(0,10):[],id:String(p.id),desc:String(p.desc||""),cat:String(p.cat||""),forma:String(p.forma||"credito"),total:Number(p.total)||0,n:Math.min(48,Math.max(2,Math.round(Number(p.n)||2))),compra:mk(p.compra)?p.compra:INICIO,dia:Math.min(31,Math.max(1,Number(p.dia)||1)),venc:(Number(p.venc)>=1&&Number(p.venc)<=31)?Math.round(Number(p.venc)):null,contaId:p.contaId?String(p.contaId):null,cartaoId:p.cartaoId?String(p.cartaoId):null})):[];
  const rendas=Array.isArray(d?.rendas)?d.rendas.filter(r=>r&&r.id).map(r=>({id:String(r.id),nome:String(r.nome||"Renda fixa"),valor:Number(r.valor)||0,dia:Math.min(31,Math.max(1,Math.round(Number(r.dia))||1)),desde:mk(r.desde)?r.desde:INICIO,ate:mk(r.ate)?r.ate:null,contaId:r.contaId?String(r.contaId):null})):[];
  const dd=n=>{ n=Math.round(Number(n)); return n>=1&&n<=31?n:null; };
  /* vários cartões; o cartão único das versões antigas vira o primeiro da lista */
  let cartoes=Array.isArray(d?.cartoes)?d.cartoes.filter(c=>c&&c.id).map(c=>({id:String(c.id),nome:String(c.nome||"Cartão"),fecha:dd(c.fecha),vence:dd(c.vence),limite:Number(c.limite)||0,contaId:c.contaId?String(c.contaId):null})):[];
  if(!cartoes.length&&dd(d?.cartao?.fecha)&&dd(d?.cartao?.vence)) cartoes=[{id:"k1",nome:"Cartão",fecha:dd(d.cartao.fecha),vence:dd(d.cartao.vence),limite:0,contaId:null}];
  const contas=Array.isArray(d?.contas)?d.contas.filter(c=>c&&c.id).map(c=>({id:String(c.id),nome:String(c.nome||"Conta"),tipo:String(c.tipo||"corrente"),saldoInicial:Number(c.saldoInicial)||0})):[];
  const contaSalario=d?.contaSalario&&contas.some(c=>c.id===d.contaSalario)?String(d.contaSalario):null;
  const metas=Array.isArray(d?.metas)?d.metas.filter(x=>x&&x.id).map(x=>({id:String(x.id),nome:String(x.nome||"Meta"),alvo:Number(x.alvo)||0,prazo:mk(x.prazo)?x.prazo:null})):[];
  const iso=x=>/^\d{4}-\d{2}-\d{2}$/.test(x||"")?x:null;
  const dividas=Array.isArray(d?.dividas)?d.dividas.filter(x=>x&&x.id).map(x=>({id:String(x.id),pessoa:String(x.pessoa||"Alguém"),tipo:x.tipo==="pagar"?"pagar":"receber",valor:Number(x.valor)||0,desc:String(x.desc||""),data:iso(x.data),venc:iso(x.venc),pags:Array.isArray(x.pags)?x.pags.filter(y=>y&&y.id).map(y=>({id:String(y.id),valor:Number(y.valor)||0,data:iso(y.data)})):[]})):[];
  const viagens=Array.isArray(d?.viagens)?d.viagens.filter(x=>x&&x.id).map(x=>({id:String(x.id),nome:String(x.nome||"Viagem"),moeda:/^[A-Z]{3}$/.test(x.moeda||"")?x.moeda:"USD",cotacao:Number(x.cotacao)>0?Number(x.cotacao):1,taxa:Math.max(0,Number(x.taxa)||0),inicio:iso(x.inicio),fim:iso(x.fim),orcamento:Math.max(0,Number(x.orcamento)||0)})):[];
  const desafios=Array.isArray(d?.desafios)?d.desafios.filter(x=>x&&x.id&&iso(x.inicio)).map(x=>({id:String(x.id),nome:String(x.nome||"Desafio").slice(0,50),tipo:x.tipo==="max"?"max":"sem",cat:x.cat?String(x.cat):null,palavras:String(x.palavras||"").slice(0,80),dias:Math.min(365,Math.max(1,Math.round(Number(x.dias)||30))),inicio:x.inicio,valor:Number(x.valor)>0?Number(x.valor):0})):[];
  const termos=d?.termos&&typeof d.termos.v==="string"?{v:d.termos.v,em:String(d.termos.em||"")}:null;
  return {desafios, viagens, dividas, termos, salarioPadrao:Number(d?.salarioPadrao)||0, saldoInicial:Number(d?.saldoInicial)||0, saldoCaixinha:Number(d?.saldoCaixinha)||0, ate, inicio, categorias:cats, fixos, parcelas, rendas, cartoes, contas, contaSalario, metas};
}
function getMonth(k){ if(!state.months[k]) state.months[k]=normMonth({}); else state.months[k]=Object.assign(normMonth({}),state.months[k]); return state.months[k]; }
const catIndex=id=>state.config.categorias.findIndex(c=>c.id===id);
const NCORES=12;
const corIdx=ct=>{ const i=state.config.categorias.indexOf(ct); return (typeof ct.cor==="number"&&ct.cor>=0&&ct.cor<NCORES)?ct.cor:(i%NCORES); };
const catColor=id=>{ const ct=state.config.categorias.find(c=>c.id===id); return ct?"var(--c"+corIdx(ct)+")":"var(--c8)"; };
const subName=(cat,sub)=>{ if(!sub) return ""; const ct=state.config.categorias.find(c=>c.id===cat); const x=ct&&(ct.subs||[]).find(y=>y.id===sub); return x?x.nome:""; };
const normTag=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/^#+/,"").replace(/[^a-z0-9_-]+/g,"").slice(0,24);
const lerTags=txt=>[...new Set(String(txt||"").split(/[\s,;]+/).map(normTag).filter(Boolean))].slice(0,10);
const tagsTxt=g=>(g.tags&&g.tags.length?" · "+g.tags.map(t=>"#"+t).join(" "):"");
const extraTxt=g=>{ const sn=subName(g.cat,g.sub); return (g.orig&&g.orig.moeda!=="BRL"?" · "+fmtMoeda(g.orig.valor,g.orig.moeda):"")+(sn?" · "+sn:"")+tagsTxt(g); };
function todasTags(){ const c={}; Object.values(state.months).forEach(m=>(m.gastos||[]).forEach(g=>(g.tags||[]).forEach(t=>c[t]=(c[t]||0)+1))); state.config.parcelas.forEach(pp=>(pp.tags||[]).forEach(t=>c[t]=(c[t]||0)+1)); return Object.entries(c).sort((a,b)=>b[1]-a[1]).map(x=>x[0]); }
const catName=id=>{ const c=state.config.categorias.find(c=>c.id===id); return c?c.nome:"Sem categoria"; };

/* ---------- cálculos ---------- */
/* Mês em que o controle começa: o escolhido no Perfil, ou o primeiro mês em que a pessoa registrou renda.
   Antes dele, salário padrão, rendas fixas e contas fixas não entram (só o que foi lançado à mão). */
function inicioKey(){
  if(state.config.inicio) return state.config.inicio;
  const ks=Object.keys(state.months).filter(k=>{ const m=state.months[k]; return m&&((typeof m.salario==="number"&&m.salario>0)||(m.avulsos&&m.avulsos.length)); }).sort();
  return ks[0]||null;
}
const ativo=k=>{ const i=inicioKey(); return !!i&&k>=i; };
const entre=(a,b)=>(kY(b)-kY(a))*12+(kM(b)-kM(a));
/* ---------- cartões de crédito (vários) ---------- */
const cartaoOk=c=>!!(c&&c.fecha&&c.vence);
const cartoesOk=()=>state.config.cartoes.filter(cartaoOk);
const cartaoAtivo=()=>cartoesOk().length>0;
/* cartão de uma compra no crédito: o escolhido, ou o primeiro cadastrado */
const cartaoDe=x=>state.config.cartoes.find(c=>c.id===(x&&x.cartaoId))||state.config.cartoes[0]||null;
/* Em que mês uma compra no crédito é paga (mês de vencimento da fatura do cartão) */
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
/* Parcelas que caem no mês k (no cartão, a 1ª parcela vai na fatura da compra) */
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
    out.push({id:p.id,parcela:true,idx:i+1,n:p.n,desc:p.desc,cat:p.cat,sub:p.sub||null,tags:p.tags||[],forma:p.forma,contaId:p.contaId||null,cartaoId:cc?cc.id:null,dia,valor,total:p.total,compra:p.compra,cartao,pago:!!o.pago,pagoEm:o.pagoEm||null});
  });
  return out;
}
/* Compras no cartão de crédito que caem no mês k: à vista (no mês da fatura, ou da compra sem cartão configurado) e parcelas até a última */
function cartaoDoMes(k){
  const avista=faturaDoMes(k).filter(x=>!x.parcela);
  ((state.months[k]||{}).gastos||[]).filter(g=>g.forma==="credito"&&!noCartao(g)).forEach(g=>avista.push(Object.assign({},g,{compraK:k})));
  const parc=parcelasDoMes(k).filter(p=>p.forma==="credito");
  return avista.concat(parc).sort((a,b)=>a.dia-b.dia);
}
/* Compras no crédito (lançadas em qualquer mês) cuja fatura vence em k — de um cartão ou de todos */
/**
 * @param {MesKey} k
 * @param {string} [cid]   id do cartão; sem ele, todos os cartões
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
/* Limite do cartão: quanto está comprometido (compras e parcelas ainda não pagas) */
function usoCartao(c){
  let usado=0;
  Object.keys(state.months).forEach(mk=>{ ((state.months[mk]||{}).gastos||[]).forEach(g=>{ if(g.forma==="credito"&&!g.pago&&cartaoDe(g)&&cartaoDe(g).id===c.id) usado+=Number(g.valor)||0; }); });
  state.config.parcelas.forEach(p=>{ if(p.forma!=="credito"||!cartaoDe(p)||cartaoDe(p).id!==c.id) return;
    const prim=cartaoOk(c)?faturaMes(p.compra,p.dia,c):p.compra;
    for(let i=0;i<p.n;i++){ const mk=shiftKey(prim,i); const o=((state.months[mk]||{}).parcelas||{})[p.id]||{}; if(!o.pago) usado+=valorParcela(p.total,p.n,i); } });
  return {usado,limite:c.limite||0,livre:(c.limite||0)-usado};
}
/* Tudo que conta como despesa no mês k */
function despesasDoMes(k){
  const m=state.months[k], manuais=(m?m.gastos:[]).filter(g=>!noCartao(g));
  return /** @type {ItemMes[]} */(manuais).concat(parcelasDoMes(k).filter(p=>!p.cartao), faturaDoMes(k), fixosDoMes(k).filter(f=>!f.pular));
}
/* ---------- contas (corrente, poupança, dinheiro…) ---------- */
const temContas=()=>state.config.contas.length>0;
const contaPrincipal=()=>state.config.contas[0]||null;
const contaOk=id=>state.config.contas.some(c=>c.id===id)?id:(contaPrincipal()||{}).id;
const nomeConta=id=>{ const c=state.config.contas.find(x=>x.id===contaOk(id)); return c?c.nome:""; };
const saldoInicialTotal=()=>temContas()?soma(state.config.contas.map(c=>({valor:c.saldoInicial}))):state.config.saldoInicial;
/* Saldo de cada conta até o mês k (inclusive) */
/**
 * Saldo de cada conta até o mês k, por id da conta.
 * @param {MesKey} k
 * @returns {Object<string,number>}
 */
function saldosContas(k){
  /** @type {Object<string,number>} */
  const S={}; state.config.contas.forEach(c=>S[c.id]=Number(c.saldoInicial)||0);
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
    m.transf.forEach(t=>{ add(t.de,-t.valor); add(t.para,t.valor); });
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
  const salario=m.salario??(ativo(k)?state.config.salarioPadrao:0);
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
/* Metas de economia: saldo guardado em cada meta (até o mês k) */
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
/* Previsão do fim do mês: projeta o gasto do dia a dia (lançamentos avulsos até hoje) pelos dias que faltam.
   Contas fixas e parcelas já estão no saldo; só o gasto variável é estimado. Só para o mês atual. */
/**
 * @param {MesKey} k
 * @param {CalcMes} [c]   resultado de calc(k), se já tiver
 * @returns {Previsao|null}
 */
function previsaoMes(k,c){
  if(k!==todayKey||!ativo(k)) return null;
  c=c||calc(k); const dim=c.dim, dia=today.getDate(), rest=dim-dia;
  if(dia<3||rest<1) return null;
  const grande=c.receitas>0?c.receitas*0.2:Infinity; /* compras grandes e isoladas (TV, viagem) já estão no saldo, mas não viram ritmo */
  const ate=((state.months[k]||{}).gastos||[]).filter(g=>(Number(g.dia)||1)<=dia), gs=ate.filter(g=>(Number(g.valor)||0)<=grande), foraRitmo=ate.length-gs.length;
  const caixa=gs.filter(g=>!noCartao(g)), cartao=gs.filter(g=>noCartao(g));
  const rCaixa=soma(caixa)/dia, rCartao=soma(cartao)/dia;
  const porCat={}; caixa.forEach(g=>{ porCat[g.cat]=(porCat[g.cat]||0)+(Number(g.valor)||0); });
  const r2=v=>Math.round(v*100)/100;
  return {dia,rest,dim,ritmo:r2(rCaixa),extra:r2(rCaixa*rest),saldo:r2(c.saldo-rCaixa*rest),cartao:r2(rCartao*rest),foraRitmo,grande,ritmoCat:id=>(porCat[id]||0)/dia};
}
/* Orçamento com sobra acumulada (opcional por categoria): o que não foi gasto do limite passa para o mês seguinte.
   Estourou? A sobra zera e o mês seguinte recomeça com o limite normal. Conta a partir do mês em que a opção foi ligada. */
/**
 * Sobra acumulada do limite de uma categoria que entra no mês k.
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
/* Alertas de orçamento: categorias com limite que chegaram a 80%, passaram, ou que no ritmo atual vão passar */
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

/* ---------- persistência ---------- */
const dirty=new Set(), timers={}, writing={}, again={}, apagados={}, docIds=new Set(), base={};
let retryTimer=null;
/* cópia das edições ainda não confirmadas pelo servidor: sobrevive a fechar o app sem internet */
const ABA=(()=>{ try{ let a=sessionStorage.getItem("mb.aba"); if(!a){ a=Math.random().toString(36).slice(2,10); sessionStorage.setItem("mb.aba",a); } return a; }catch(e){ return "x"; } })();
const prefixoPend=()=>"mb.pend."+uid+"."+aberto+".", chavePend=()=>prefixoPend()+ABA;
/* junta na gaveta desta aba o que outras abas (já fechadas) deixaram sem enviar */
function recolhePend(){ try{ const pre=prefixoPend(), meu=lerPend(); Object.keys(localStorage).filter(k=>k.startsWith(pre)&&k!==chavePend()).forEach(k=>{ const o=JSON.parse(localStorage.getItem(k)||"{}"); Object.keys(o).forEach(id=>{ if(!meu[id]) meu[id]=o[id]; }); localStorage.removeItem(k); }); if(Object.keys(meu).length) localStorage.setItem(chavePend(),JSON.stringify(meu)); return meu; }catch(e){ return lerPend(); } }
function lerPend(){ try{ return JSON.parse(localStorage.getItem(chavePend())||"{}"); }catch(e){ return {}; } }
function gravaPend(id,body,enviado){ if(mode!=="cloud"||!uid) return; try{ const o=lerPend(); if(body) o[id]={body,base:base[id]||null}; else if(o[id]&&(!enviado||J(o[id].body)===J(enviado))) delete o[id]; if(Object.keys(o).length) localStorage.setItem(chavePend(),JSON.stringify(o)); else localStorage.removeItem(chavePend()); }catch(e){} }
function zeraFila(){ Object.keys(timers).forEach(k=>{ clearTimeout(timers[k]); delete timers[k]; }); [writing,again,apagados,base].forEach(o=>Object.keys(o).forEach(k=>delete o[k])); dirty.clear(); clearTimeout(retryTimer); }
/* manda já o que está esperando (antes de trocar de controle ou sair da conta) */
async function salvaPendentes(){
  if(mode!=="cloud") return;
  const ids=[...dirty]; Object.keys(timers).forEach(k=>{ clearTimeout(timers[k]); delete timers[k]; });
  if(!navigator.onLine||!ids.length) return;
  await Promise.race([Promise.all(ids.map(id=>flush(id))),new Promise(r=>setTimeout(r,6000))]);
}
function setStatus(t,c){ statusTxt=t; statusCls=c; const el=document.getElementById("status"); if(el){el.className="status "+c; el.title=t; el.innerHTML="<i></i><span class=\"stt\">"+esc(t)+"</span>";} }
const docIdFor=k=>k==="config"?"config":"m-"+k;
const bodyFor=id=>clone(id==="config"?state.config:getMonth(id.slice(2)));
/* lembra o que foi apagado aqui, para a mesclagem não "ressuscitar" o item */
function marcaApagado(chave,id){ const d=docIdFor(chave); (apagados[d]=apagados[d]||new Set()).add(id); }
function desmarcaApagado(chave,id){ const d=docIdFor(chave); if(apagados[d]) apagados[d].delete(id); }
function save(k){
  const id=docIdFor(k);
  if(mode==="local"){ try{ localStorage.setItem(LSKEY,JSON.stringify({config:state.config,months:state.months})); setStatus("Salvo neste aparelho","ok"); }catch(e){ setStatus("Não foi possível salvar","err"); } return; }
  if(mode!=="cloud") return;
  dirty.add(id); gravaPend(id,bodyFor(id)); setStatus(navigator.onLine?"Salvando…":"Sem internet — salvo no aparelho, envia quando voltar",navigator.onLine?"saving":"ok");
  clearTimeout(timers[id]); timers[id]=setTimeout(()=>{ delete timers[id]; flush(id); },400);
}
/* Junta o que está no servidor com o que está aqui: itens novos de outro aparelho não se perdem */
const LISTAS_MES=["gastos","avulsos","caixinha","transf"], LISTAS_CFG=["categorias","fixos","parcelas","rendas","metas","cartoes","contas","dividas","viagens","desafios"];
const MAPAS_MES=["fixos","rendas","parcelas","faturasPagas"];
const J=x=>JSON.stringify(x===undefined?null:x);
/* Mescla em 3 vias: local (o que está aqui), servidor (o que está lá agora) e b (a última versão do servidor que este aparelho viu).
   O que só mudou lá vem para cá; o que só mudou aqui vai para lá; o que foi apagado de um lado some dos dois. Retorna true se o local mudou. */
function mescla(local,servidor,id){
  const b=base[id]||(id==="config"?normConfig({}):normMonth({})), del=apagados[id]||new Set(), listas=id==="config"?LISTAS_CFG:LISTAS_MES, mapas=id==="config"?[]:MAPAS_MES;
  let mudou=false;
  listas.forEach(l=>{
    const L=local[l]||[], S=(servidor[l]||[]).filter(x=>x&&x.id), B=b?(b[l]||[]):null;
    const mS=new Map(S.map(x=>[x.id,x])), mB=new Map((B||[]).filter(x=>x&&x.id).map(x=>[x.id,x])), res=[];
    L.forEach(x=>{ const sx=mS.get(x.id), bx=mB.get(x.id);
      if(!sx){ if(bx&&J(bx)===J(x)){ mudou=true; return; } res.push(x); return; }           /* apagado lá e intocado aqui: some */
      if(bx&&J(bx)===J(x)&&J(sx)!==J(x)){ res.push(sx); mudou=true; return; }               /* só mudou lá: fica a versão de lá */
      res.push(x); });
    const ids=new Set(L.map(x=>x.id));
    S.forEach(sx=>{ if(ids.has(sx.id)||del.has(sx.id)) return; if(B&&mB.has(sx.id)) return;  /* apagado aqui */
      res.push(sx); mudou=true; });
    local[l]=res;
  });
  mapas.forEach(mp=>{
    const L=Object.assign({},local[mp]||{}), S=servidor[mp]||{}, B=b?(b[mp]||{}):null;
    new Set([...Object.keys(L),...Object.keys(S)]).forEach(k=>{
      const inL=k in L, inS=k in S, inB=!!B&&(k in B);
      if(inL&&inS){ if(inB&&J(B[k])===J(L[k])&&J(S[k])!==J(L[k])){ L[k]=S[k]; mudou=true; } }
      else if(inS&&!inL){ if(!inB){ L[k]=S[k]; mudou=true; } }
      else if(inL&&!inS){ if(inB&&J(B[k])===J(L[k])){ delete L[k]; mudou=true; } }
    });
    local[mp]=L;
  });
  Object.keys(local).forEach(k=>{ if(listas.includes(k)||mapas.includes(k)) return; if(J(local[k])===J(b[k])&&J(servidor[k])!==J(local[k])&&(k in servidor)){ local[k]=servidor[k]; mudou=true; } });
  return mudou;
}
async function flush(id){
  if(mode!=="cloud"||!uid||!fb) return;
  if(writing[id]){ again[id]=true; return; }
  if(!navigator.onLine){ setStatus("Sem internet — salvo no aparelho, envia quando voltar","ok"); return; }
  writing[id]=true; let ok=false;
  const esp=aberto, meu=uid, ref=fb.doc(fb.db,...docsPath(),id), local0=bodyFor(id);
  let corpo=null, mudou=false;
  try{
    await fb.runTransaction(fb.db,async tx=>{
      const snap=await tx.get(ref), body=clone(local0);
      mudou=snap.exists()?mescla(body,id==="config"?normConfig(snap.data()):normMonth(snap.data()),id):false;
      if(id==="config"&&Array.isArray(body.desafios)&&!body.desafios.length) delete body.desafios;
      tx.set(ref,body); corpo=body;
    });
    ok=true;
  }catch(e){ console.error(e); }
  writing[id]=false;
  if(esp!==aberto||meu!==uid) return;               /* trocou de controle ou de conta no meio: não mexe na tela */
  if(ok){
    const editouDepois=!!timers[id]||again[id]||J(bodyFor(id))!==J(local0);
    base[id]=clone(editouDepois?local0:corpo); docIds.add(id); delete apagados[id];
    if(!editouDepois){ if(mudou){ if(id==="config"){ state.config=normConfig(corpo); buildMeses(); } else state.months[id.slice(2)]=normMonth(corpo); render(); } dirty.delete(id); gravaPend(id,null,local0); }
    if(again[id]){ again[id]=false; return flush(id); }
    if(!dirty.size) setStatus("Tudo salvo","ok");
  } else {
    if(again[id]){ again[id]=false; return flush(id); }
    setStatus("Não deu para salvar agora — tento de novo em instantes","err");
    clearTimeout(retryTimer); retryTimer=setTimeout(()=>[...dirty].forEach(x=>flush(x)),8000);
  }
}
window.addEventListener("offline",()=>{ if(mode==="cloud") setStatus("Sem internet — o que você lançar fica salvo no aparelho e envia quando voltar","ok"); });
window.addEventListener("online",()=>{ if(mode==="cloud"){ setStatus(dirty.size?"Sincronizando…":"Sincronizado",dirty.size?"saving":"ok"); [...dirty].forEach(id=>flush(id)); } });
function loadLocal(){
  try{ const raw=localStorage.getItem(LSKEY); if(raw){ const d=JSON.parse(raw); if(d.config){ state.config=normConfig(d.config); buildMeses(); } if(d.months) for(const k in d.months) if(mesValido(k)) state.months[k]=normMonth(d.months[k]); } }catch(e){}
}
function resetState(){ state.config=defaultConfig(); state.months={}; buildMeses(); }
let fb=null, authUser=null, unsub=null, loginErro="";
/* espaço = de quem são os dados abertos (o próprio uid ou o do dono do controle compartilhado) */
/* aberto = "pessoal" (users/{uid}/docs) ou o id de um controle compartilhado (grupos/{id}/docs) */
let aberto="pessoal", eu={}, euCarregado=false, grupoDoc=null, pedidosG={}, unsubs=[], unsubsFixos=[], seqEspaco=0, perdendo={};
const FB_V="10.12.2";
async function init(){
  const cfg=window.FIREBASE_CONFIG;
  if(!cfg||!cfg.apiKey||/COLE|SUA_/i.test(cfg.apiKey)){ mode="local"; loadLocal(); state.loaded=true; setStatus("Modo local (sem login)",""); render(); return; }
  try{
    const base="https://www.gstatic.com/firebasejs/"+FB_V+"/";
    const [A,U,F]=await Promise.all([import(base+"firebase-app.js"),import(base+"firebase-auth.js"),import(base+"firebase-firestore.js")]);
    const app=A.initializeApp(cfg), auth=U.getAuth(app);
    let db; try{ db=F.initializeFirestore(app,{localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()})}); }catch(e){ db=F.getFirestore(app); }
    fb={...U,...F,db,auth};
    U.getRedirectResult(auth).then(r=>{ if(r) boasVindas(r); }).catch(e=>{ loginErro=traduzErro(e); render(); });
    U.onAuthStateChanged(auth,user=>{
      pararEspaco(); dirty.clear();
      if(!user){ if(travado) destravar(); zeraFila(); unsubsFixos.forEach(f=>{ try{f()}catch(e){} }); unsubsFixos=[]; authUser=null; uid=null; aberto="pessoal"; eu={}; euCarregado=false; grupoDoc=null; pedidosG={}; mode="login"; resetState(); state.loaded=true; closeSheet(); render(); return; }
      authUser=user; uid=user.uid; mode="cloud"; abrirEspaco();
    });
  }catch(e){ console.error(e); mode="local"; loadLocal(); state.loaded=true; setStatus("Sem conexão com o login — modo local","err"); render(); }
}
/* ---------- controles compartilhados (separados do Pessoal) ---------- */
const docsPath=()=>aberto==="pessoal"?["users",uid,"docs"]:["grupos",aberto,"docs"];
function pararEspaco(){ if(unsub){ unsub(); unsub=null; } unsubs.forEach(f=>{ try{f()}catch(e){} }); unsubs=[]; }
async function salvaEu(obj){ Object.assign(eu,obj); try{ fb.setDoc(fb.doc(fb.db,"users",uid,"meta","eu"),obj,{merge:true}).catch(e=>console.error(e)); }catch(e){ console.error(e); } }
async function euSet(chave,sub,valor){
  let remoto;
  if(sub){ eu[chave]=Object.assign({},eu[chave]||{}); if(valor==null){ delete eu[chave][sub]; remoto={[chave]:{[sub]:fb.deleteField()}}; } else { eu[chave][sub]=valor; remoto={[chave]:{[sub]:valor}}; } }
  else { eu[chave]=valor; remoto={[chave]:valor}; }
  try{ fb.setDoc(fb.doc(fb.db,"users",uid,"meta","eu"),remoto,{merge:true}).catch(e=>console.error(e)); }catch(e){ console.error(e); }
}
const negado=e=>e&&e.code==="permission-denied";
const meusGrupos=()=>Object.entries(eu.grupos||{}).map(([id,x])=>Object.assign({id},x)).sort((a,b)=>String(a.nome).localeCompare(String(b.nome)));
async function abrirEspaco(aviso){
  const F=fb, meu=uid, seq=++seqEspaco;
  closeSheet(); pararEspaco(); zeraFila(); resetState(); state.loaded=false; grupoDoc=null; setStatus("Carregando…",""); render();
  if(!euCarregado){
    try{ const d=await F.getDoc(F.doc(F.db,"users",meu,"meta","eu")); eu=d.exists()?d.data():{}; }catch(e){ eu={}; }
    if(seq!==seqEspaco||uid!==meu) return;
    euCarregado=true; refazVigias();
  }
  aberto=eu.ativo&&eu.grupos&&eu.grupos[eu.ativo]?eu.ativo:"pessoal";
  if(aberto!=="pessoal"){
    let ok;
    try{ const g=await F.getDoc(F.doc(F.db,"grupos",aberto)); ok=!!(g.exists()&&g.data().m&&g.data().m[meu]); if(ok) grupoDoc=g.data(); }
    catch(e){ ok=negado(e)?false:true; } /* sem internet: continua no compartilhado */
    if(seq!==seqEspaco) return;
    if(!ok){ const nome=(eu.grupos[aberto]||{}).nome||""; await euSet("grupos",aberto,null); await euSet("ativo",null,"pessoal"); refazVigias(); aberto="pessoal"; aviso="Você não faz mais parte do controle “"+nome+"”. Voltou para o Pessoal."; }
  }
  const g=aberto;
  unsub=F.onSnapshot(F.collection(F.db,...docsPath()),snap=>{
    let changed=!state.loaded;
    docIds.clear(); snap.docs.forEach(doc=>docIds.add(doc.id));
    snap.docs.forEach(doc=>{
      const valido=doc.id==="config"||(doc.id.startsWith("m-")&&mesValido(doc.id.slice(2))); if(!valido) return;
      const d=doc.data();
      /** @type {any} config ou mês, conforme o documento */
      const norm=doc.id==="config"?normConfig(d):normMonth(d);
      if(dirty.has(doc.id)) return;
      base[doc.id]=clone(norm);
      if(doc.id==="config"){ if(J(norm)!==J(state.config)){ state.config=norm; buildMeses(); changed=true; } }
      else { const k=doc.id.slice(2); if(J(norm)!==J(state.months[k]||null)){ state.months[k]=norm; changed=true; } }
    });
    /* documento apagado em outro aparelho (ex.: "Recomeçar do zero"): some daqui também */
    if(state.loaded&&typeof snap.docChanges==="function") snap.docChanges().forEach(ch=>{ if(ch.type!=="removed"||dirty.has(ch.doc.id)) return; const id=ch.doc.id; delete base[id];
      if(id==="config"){ state.config=defaultConfig(); buildMeses(); changed=true; } else if(id.startsWith("m-")&&state.months[id.slice(2)]){ delete state.months[id.slice(2)]; changed=true; } });
    if(!state.loaded){ state.loaded=true; if(!mesesVisiveis().includes(ui.month)) ui.month=todayKey;
      /* edições que ficaram guardadas sem internet voltam e são enviadas */
      const pend=recolhePend(); Object.keys(pend).forEach(id=>{ const pd=pend[id]; if(!pd||!pd.body) return; if(pd.base) base[id]=pd.base; else delete base[id];
        if(id==="config"){ state.config=normConfig(pd.body); buildMeses(); } else if(id.startsWith("m-")&&mesValido(id.slice(2))) state.months[id.slice(2)]=normMonth(pd.body); else return;
        dirty.add(id); changed=true; if(navigator.onLine) setTimeout(()=>flush(id),300); });
    }
    if(!dirty.size) setStatus(snap.metadata.fromCache&&!navigator.onLine?"Sem internet — salvo no aparelho":"Sincronizado","ok");
    if(changed) render();
  },err=>{ console.error(err); if(negado(err)&&g!=="pessoal"){ perdeuGrupo(g); return; } setStatus("Sem acesso aos dados ("+(err.code||"erro")+")","err"); state.loaded=true; render(); });
  if(g!=="pessoal") unsubs.push(F.onSnapshot(F.doc(F.db,"grupos",g),d=>{
    if(!d.exists()&&d.metadata&&d.metadata.fromCache) return;
    grupoDoc=d.exists()?d.data():null;
    if(!(grupoDoc&&grupoDoc.m&&grupoDoc.m[meu])){ perdeuGrupo(g); return; }
    const x=(eu.grupos||{})[g]; if(x&&grupoDoc.nome&&x.nome!==grupoDoc.nome) euSet("grupos",g,Object.assign({},x,{nome:grupoDoc.nome}));
    render();
  },err=>{ if(negado(err)) perdeuGrupo(g); }));
  if(aviso) setTimeout(()=>toast(aviso),300);
}
async function perdeuGrupo(g){
  if(perdendo[g]||!(eu.grupos||{})[g]) return; perdendo[g]=true;
  const nome=((eu.grupos||{})[g]||{}).nome||"compartilhado";
  await euSet("grupos",g,null); if(eu.ativo===g||aberto===g) await euSet("ativo",null,"pessoal"); refazVigias();
  perdendo[g]=false; if(aberto===g) abrirEspaco("Você não faz mais parte do controle “"+nome+"”. Voltou para o Pessoal."); else { render(); toast("Você não faz mais parte do controle “"+nome+"”."); }
}
/* avisos que valem em qualquer controle aberto: pedidos para os meus controles e respostas aos meus pedidos */
function refazVigias(){
  unsubsFixos.forEach(f=>{ try{f()}catch(e){} }); unsubsFixos=[]; pedidosG={};
  const F=fb, meu=uid;
  meusGrupos().filter(x=>x.dono).forEach(x=>unsubsFixos.push(F.onSnapshot(F.collection(F.db,"grupos",x.id,"pedidos"),q=>{ pedidosG[x.id]=q.docs.map(d=>Object.assign({uid:d.id},d.data())); render(); },()=>{})));
  meusGrupos().forEach(x=>unsubsFixos.push(F.onSnapshot(F.doc(F.db,"grupos",x.id),d=>{ if(!d.exists()&&d.metadata&&d.metadata.fromCache) return; if(!(d.exists()&&d.data().m&&d.data().m[meu])) perdeuGrupo(x.id); },e=>{ if(negado(e)) perdeuGrupo(x.id); })));
  Object.keys(eu.pendentes||{}).forEach(g=>unsubsFixos.push(F.onSnapshot(F.doc(F.db,"grupos",g,"pedidos",meu),d=>{ if(!d.exists()) resolvePendente(g); },()=>{})));
}
async function resolvePendente(g){
  const p=(eu.pendentes||{})[g]; if(!p) return;
  let ok=false, nome=p.nome||"";
  try{ const d=await fb.getDoc(fb.doc(fb.db,"grupos",g)); ok=!!(d.exists()&&d.data().m&&d.data().m[uid]); if(ok) nome=d.data().nome||nome; }catch(e){ if(!negado(e)) return; }
  if(!(eu.pendentes||{})[g]) return;
  await euSet("pendentes",g,null);
  if(ok){ await euSet("grupos",g,{nome,dono:false}); toast("Pedido aceito! “"+nome+"” já aparece no topo da tela."); }
  else toast("Seu pedido para entrar em “"+nome+"” não foi aceito.");
  refazVigias(); render();
}
const primeiroNome=n=>String(n||"").trim().split(/[\s@]+/)[0]||"alguém";
const meuNome=()=>(authUser&&(authUser.displayName||authUser.email))||"Alguém";
const euMembro=()=>({nome:meuNome(),email:(authUser&&authUser.email)||"",foto:(authUser&&authUser.photoURL)||"",desde:new Date().toISOString()});
const compartilhado=()=>mode==="cloud"&&aberto!=="pessoal";
const souDono=()=>mode!=="cloud"||aberto==="pessoal"||!!(grupoDoc&&grupoDoc.dono===uid);
function nomeDe(id){ if(id===uid) return "você"; const x=grupoDoc&&grupoDoc.m&&grupoDoc.m[id]; return x?primeiroNome(x.nome):""; }
const marcaPor=o=>{ if(compartilhado()) o.por=uid; return o; };
const porTxt=g=>compartilhado()&&g.por&&nomeDe(g.por)?" · "+nomeDe(g.por):"";
const CODE_ALF="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function novoCodigo(n){ const a=new Uint32Array(n||8); crypto.getRandomValues(a); return Array.from(a,x=>CODE_ALF[x%32]).join(""); }
const linkConvite=c=>location.origin+location.pathname+"?convite="+c;
const falhou=e=>{ console.error(e); toast("Não deu certo ("+(e&&e.code||"erro")+")."+(negado(e)?" Confira se as regras novas do Firebase foram publicadas.":"")); };
async function trocarEspaco(g){ if(g===aberto) return; await salvaPendentes(); await euSet("ativo",null,g); abrirEspaco(); }
async function criarGrupo(){ if(ui.ocupado) return; ui.ocupado=true; try{ return await _criarGrupo(); } finally{ ui.ocupado=false; } }
async function _criarGrupo(){
  const el=document.getElementById("grNome"), nome=String(el?el.value:"").trim().slice(0,40);
  if(!nome){ ui.compErro="Dê um nome, por exemplo: Casa, Viagem, Família."; render(); return; }
  const F=fb, g="g"+novoCodigo(16).toLowerCase();
  try{
    await F.setDoc(F.doc(F.db,"grupos",g),{nome,dono:uid,codigo:null,criado:new Date().toISOString(),m:{[uid]:euMembro()}});
    await salvaPendentes(); await euSet("grupos",g,{nome,dono:true}); refazVigias(); ui.compErro="";
    await euSet("ativo",null,g); ui.tab="perfil"; abrirEspaco("Controle “"+nome+"” criado. Ele começa do zero; convide quem vai usar com você.");
  }catch(e){ falhou(e); }
}
async function gerarConvite(){ if(ui.ocupado) return; ui.ocupado=true; try{ return await _gerarConvite(); } finally{ ui.ocupado=false; } }
async function _gerarConvite(){
  const F=fb, g=aberto, cod=novoCodigo(8);
  try{
    if(grupoDoc&&grupoDoc.codigo) await F.deleteDoc(F.doc(F.db,"convites",grupoDoc.codigo)).catch(()=>{});
    await F.setDoc(F.doc(F.db,"convites",cod),{grupo:g,dono:uid,nome:(grupoDoc&&grupoDoc.nome)||"",donoNome:meuNome(),em:new Date().toISOString()});
    await F.updateDoc(F.doc(F.db,"grupos",g),{codigo:cod});
    toast("Código de convite criado.");
  }catch(e){ falhou(e); }
}
async function compartilharConvite(){
  const c=grupoDoc&&grupoDoc.codigo; if(!c) return;
  const txt="Entre no controle “"+grupoDoc.nome+"” no Monetra. Código: "+c+"\n"+linkConvite(c);
  try{ if(navigator.share){ await navigator.share({title:"Monetra",text:txt}); return; } }catch(e){ if(e&&e.name==="AbortError") return; }
  try{ await navigator.clipboard.writeText(txt); toast("Convite copiado. Cole no WhatsApp ou onde quiser."); }catch(e){ toast("Código: "+c); }
}
async function pedirEntrada(){ if(ui.ocupado) return; ui.ocupado=true; try{ return await _pedirEntrada(); } finally{ ui.ocupado=false; } }
async function _pedirEntrada(){
  const el=document.getElementById("convCod"), F=fb, cod=String(el?el.value:"").toUpperCase().replace(/[^A-Z0-9]/g,"");
  const erro=m=>{ ui.convErro=m; render(); };
  if(cod.length!==8) return erro("O código tem 8 letras e números.");
  try{
    const c=await F.getDoc(F.doc(F.db,"convites",cod));
    if(!c.exists()) return erro("Código não encontrado. Confira com quem te convidou ou peça um código novo.");
    const g=c.data().grupo, nome=c.data().nome||"compartilhado";
    if((eu.grupos||{})[g]) return erro("Você já participa do controle “"+nome+"”.");
    await F.setDoc(F.doc(F.db,"grupos",g,"pedidos",uid),{codigo:cod,nome:meuNome(),email:authUser.email||"",foto:authUser.photoURL||"",em:new Date().toISOString()});
    await euSet("pendentes",g,{nome,donoNome:c.data().donoNome||""}); refazVigias();
    ui.convErro=""; ui.conviteUrl=null; render();
    toast("Pedido enviado. Agora é só "+primeiroNome(c.data().donoNome)+" aceitar.");
  }catch(e){ console.error(e); erro("Não foi possível enviar o pedido ("+(e.code||"erro")+")."); }
}
async function cancelarPedido(g){
  await euSet("pendentes",g,null); refazVigias(); render();
  try{ await fb.deleteDoc(fb.doc(fb.db,"grupos",g,"pedidos",uid)); }catch(e){}
  toast("Pedido cancelado.");
}
async function responderPedido(g,id,aceitar){
  const F=fb, p=(pedidosG[g]||[]).find(x=>x.uid===id); if(!p) return;
  try{
    if(aceitar) await F.updateDoc(F.doc(F.db,"grupos",g),{["m."+id]:{nome:p.nome||"",email:p.email||"",foto:p.foto||"",desde:new Date().toISOString()}});
    await F.deleteDoc(F.doc(F.db,"grupos",g,"pedidos",id));
    toast(aceitar?primeiroNome(p.nome)+" agora participa de “"+(((eu.grupos||{})[g]||{}).nome||"")+"”.":"Pedido recusado.");
  }catch(e){ falhou(e); }
}
async function removerMembro(id){
  const nome=nomeDe(id);
  try{ await fb.updateDoc(fb.doc(fb.db,"grupos",aberto),{["m."+id]:fb.deleteField()}); toast(nome+" não participa mais deste controle."); }catch(e){ falhou(e); }
}
async function sairDoGrupo(){
  const g=aberto, nome=((eu.grupos||{})[g]||{}).nome||""; await salvaPendentes(); seqEspaco++; pararEspaco();
  try{ await fb.updateDoc(fb.doc(fb.db,"grupos",g),{["m."+uid]:fb.deleteField()}); }catch(e){ console.error(e); }
  await euSet("grupos",g,null); await euSet("ativo",null,"pessoal"); refazVigias();
  abrirEspaco("Você saiu de “"+nome+"”. Voltou para o Pessoal.");
}
async function excluirGrupo(){
  const F=fb, g=aberto, nome=(grupoDoc&&grupoDoc.nome)||"";
  try{
    seqEspaco++; pararEspaco();
    if(grupoDoc&&grupoDoc.codigo) await F.deleteDoc(F.doc(F.db,"convites",grupoDoc.codigo)).catch(()=>{});
    await Promise.all([...docIds].map(id=>F.deleteDoc(F.doc(F.db,"grupos",g,"docs",id))));
    await Promise.all((pedidosG[g]||[]).map(p=>F.deleteDoc(F.doc(F.db,"grupos",g,"pedidos",p.uid)).catch(()=>{})));
    await F.deleteDoc(F.doc(F.db,"grupos",g));
    await euSet("grupos",g,null); await euSet("ativo",null,"pessoal"); refazVigias();
    abrirEspaco("Controle “"+nome+"” excluído.");
  }catch(e){ falhou(e); abrirEspaco(); }
}
function seletorEspaco(){
  const gs=meusGrupos(); if(mode!=="cloud"||!gs.length) return "";
  const b=(id,nome,np)=>`<button type="button" role="tab" data-espaco="${esc(id)}" class="${aberto===id?"on":""}" aria-selected="${aberto===id}">${id==="pessoal"?ICON.perfil:ICON.grupo}<span>${esc(nome)}</span>${np?`<i class="badge">${np}</i>`:""}</button>`;
  return `<div class="espacos" role="tablist" aria-label="Qual controle abrir">${b("pessoal","Pessoal")}${gs.map(x=>b(x.id,x.nome,(pedidosG[x.id]||[]).length)).join("")}</div>`;
}
function cardCompartilhado(){
  if(mode!=="cloud") return "";
  const pessoa=(nome,email,extra)=>`<div class="membro"><span class="avatar" style="width:34px;height:34px">${esc(primeiroNome(nome).slice(0,1).toUpperCase())}</span><span class="t"><b>${esc(nome||email||"Pessoa")}</b><small>${esc(email||"")}</small></span>${extra||""}</div>`;
  let topo="";
  if(aberto!=="pessoal"&&grupoDoc){
    const gd=grupoDoc, dono=gd.dono===uid, ms=Object.entries(gd.m||{}).sort((a,b)=>(a[0]===gd.dono?-1:b[0]===gd.dono?1:0)), ped=pedidosG[aberto]||[];
    topo=`<div class="grupoatual"><span class="lab">Aberto agora</span><b>${esc(gd.nome)}</b><small>${ms.length} pessoa${ms.length===1?"":"s"} · seu controle Pessoal continua só seu</small></div>
    ${ped.length&&dono?`<div class="subhead">Pedidos para entrar</div><div class="membros">${ped.map(p=>pessoa(p.nome,p.email,`<span class="acoes"><button class="btn ghost mini" type="button" data-comp="recusar" data-id="${esc(p.uid)}">Recusar</button><button class="btn mini" type="button" data-comp="aceitar" data-id="${esc(p.uid)}">Aceitar</button></span>`)).join("")}</div>`:""}
    <div class="subhead">Quem participa</div>
    <div class="membros">${ms.map(([id,x])=>pessoa(x.nome,x.email,(id===gd.dono?'<span class="tag">dono</span>':"")+(id===uid?'<span class="tag">você</span>':"")+(dono&&id!==uid?`<button class="link" type="button" data-comp="remover" data-id="${esc(id)}">remover</button>`:""))).join("")}</div>
    ${dono?(gd.codigo?`<div class="convite"><span class="lab">Código de convite</span><b>${esc(gd.codigo)}</b></div>
      <div class="row2"><button class="btn" type="button" data-comp="enviar">Enviar convite</button><button class="btn ghost" type="button" data-comp="novo">Gerar outro código</button></div>
      <p class="hint">A pessoa abre o link (ou digita o código no Perfil dela) e você aceita o pedido aqui.</p>`
      :`<button class="btn" type="button" data-comp="novo">Convidar alguém</button>`):""}
    <div class="zonaperigo" id="excluirgrupo">${dono?`<p class="hint">Excluir apaga este controle compartilhado e todos os lançamentos dele, para todas as pessoas. O seu controle Pessoal não é afetado.</p>
      <button class="btn danger wide" type="button" data-comp="excluir">${ICON.lixo||""}Excluir o controle “${esc(gd.nome)}”</button>`
      :`<p class="hint">Ao sair, você deixa de ver este controle. O seu controle Pessoal não é afetado.</p>
      <button class="btn danger wide" type="button" data-comp="sair">Sair de “${esc(gd.nome)}”</button>`}</div>`;
  }
  const gs=meusGrupos(), pend=Object.entries(eu.pendentes||{});
  const lista=aberto==="pessoal"&&gs.length?`<div class="subhead">Seus controles compartilhados</div><div class="membros">${gs.map(x=>`<div class="membro"><span class="avatar" style="width:34px;height:34px">${ICON.grupo}</span><span class="t"><b>${esc(x.nome)}</b><small>${x.dono?"você criou":"participante"}${(pedidosG[x.id]||[]).length?" · "+(pedidosG[x.id]||[]).length+" pedido(s) para entrar":""}</small></span><span class="acoes"><button class="btn ghost mini" type="button" data-espaco="${esc(x.id)}" data-irpara="compartilhado">Abrir</button><button class="btn danger mini" type="button" data-espaco="${esc(x.id)}" data-irpara="excluirgrupo">${x.dono?"Excluir":"Sair"}</button></span></div>`).join("")}</div>`:"";
  const pendTxt=pend.length?`<div class="subhead">Pedidos que você enviou</div><div class="membros">${pend.map(([g,x])=>`<div class="membro"><span class="avatar" style="width:34px;height:34px">${ICON.grupo}</span><span class="t"><b>${esc(x.nome||"Controle compartilhado")}</b><small>aguardando ${esc(primeiroNome(x.donoNome))} aceitar</small></span><button class="link" type="button" data-comp="cancelar" data-id="${esc(g)}">cancelar</button></div>`).join("")}</div>`:"";
  return `<div class="card" id="compartilhado"><h2>Controles compartilhados</h2>
  ${topo||`<p class="hint">Crie um controle separado para dividir com outra pessoa (a casa, uma viagem, a família). Ele começa do zero e quem participa <b>não vê o seu controle Pessoal</b>. Para trocar de um para o outro, use os botões no topo da tela.</p>`}
  ${lista}${pendTxt}
  <div class="subhead">Criar um controle compartilhado</div>
  <div class="convrow"><input class="in nome" id="grNome" maxlength="40" autocomplete="off" placeholder="Nome (ex.: Casa)"><button class="btn" type="button" data-comp="criar">Criar</button></div>
  ${ui.compErro?`<p class="erro">${esc(ui.compErro)}</p>`:""}
  <div class="subhead">Entrar com um código de convite</div>
  <div class="convrow"><input class="in" id="convCod" maxlength="9" autocomplete="off" autocapitalize="characters" placeholder="Código de 8 letras" value="${esc(ui.conviteUrl||"")}"><button class="btn" type="button" data-comp="entrar">Pedir para entrar</button></div>
  ${ui.convErro?`<p class="erro">${esc(ui.convErro)}</p>`:""}</div>`;
}
function avisoCompart(){
  if(mode!=="cloud") return "";
  const g=Object.keys(pedidosG).find(k=>(pedidosG[k]||[]).length); if(!g) return "";
  const p=pedidosG[g], nome=((eu.grupos||{})[g]||{}).nome||"";
  return `<div class="note info">${esc(primeiroNome(p[0].nome))}${p.length>1?" e mais "+(p.length-1):""} quer entrar em “${esc(nome)}”. <button class="link" type="button" data-espaco="${esc(g)}" data-irpara="compartilhado">Ver pedido</button></div>`;
}
function acaoComp(a,id){
  const dois=(chave,msg)=>{ if(ui[chave]!==(id||true)){ ui[chave]=id||true; toast(msg); setTimeout(()=>{ ui[chave]=null; },5000); return false; } ui[chave]=null; return true; };
  if(a==="criar") return criarGrupo();
  if(a==="novo") return gerarConvite();
  if(a==="enviar") return compartilharConvite();
  if(a==="entrar") return pedirEntrada();
  if(a==="cancelar") return cancelarPedido(id);
  if(a==="aceitar") return responderPedido(aberto,id,true);
  if(a==="recusar") return responderPedido(aberto,id,false);
  if(a==="remover"){ if(dois("confRem","Toque de novo em “remover” para confirmar.")) removerMembro(id); return; }
  if(a==="sair"){ if(dois("confSair","Toque de novo em “Sair” para confirmar.")) sairDoGrupo(); return; }
  if(a==="excluir"){ if(dois("confExc","Toque de novo para excluir. Todos os lançamentos deste controle compartilhado serão apagados.")) excluirGrupo(); return; }
}
function traduzErro(e){ const c=e&&e.code||""; if(c.includes("unauthorized-domain")) return "Este endereço ainda não foi autorizado no Firebase (Authentication → Configurações → Domínios autorizados)."; if(c.includes("popup-closed")||c.includes("cancelled")) return ""; if(c.includes("network")) return "Sem internet. Tente de novo."; return "Não foi possível entrar ("+c+")."; }
async function entrar(){
  loginErro=""; const p=new fb.GoogleAuthProvider(); p.setCustomParameters({prompt:"select_account"});
  try{ const r=await fb.signInWithPopup(fb.auth,p); boasVindas(r); }
  catch(e){ const c=e.code||""; if(c.includes("popup-blocked")||c.includes("operation-not-supported")){ await fb.signInWithRedirect(fb.auth,p); } else { loginErro=traduzErro(e); render(); } }
}
function boasVindas(r){
  try{ const info=fb.getAdditionalUserInfo(r); const nome=((r.user&&r.user.displayName)||"").split(" ")[0];
    toast(info&&info.isNewUser?"Conta criada! Bem-vindo(a)"+(nome?", "+nome:"")+".":"Bem-vindo(a) de volta"+(nome?", "+nome:"")+"."); }catch(e){}
}

/* ---------- tema ---------- */
let tema="auto"; try{ tema=localStorage.getItem("meucaixa.tema")||"auto"; }catch(e){}
function aplicaTema(){
  const r=document.documentElement;
  if(tema==="claro") r.setAttribute("data-theme","light"); else if(tema==="escuro") r.setAttribute("data-theme","dark"); else r.removeAttribute("data-theme");
  const escuro=tema==="escuro"||(tema==="auto"&&window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches);
  r.classList.toggle("tema-escuro",!!escuro); r.classList.toggle("tema-claro",!escuro);
  const m=document.querySelector('meta[name="theme-color"]'); if(m) m.content=escuro?"#060807":"#04261A";
}
function trocaTema(){ tema={auto:"escuro",escuro:"claro",claro:"auto"}[tema]||"auto"; try{localStorage.setItem("meucaixa.tema",tema)}catch(e){} aplicaTema(); render(); }
function botaoTema(){
  const ic={claro:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></g></svg>',
    escuro:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
    auto:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M12 3a9 9 0 0 1 0 18z"/></svg>'}[tema];
  const nome={claro:"Claro",escuro:"Escuro",auto:"Automático"}[tema];
  return `<button class="themebtn" data-tema="1" type="button" title="Tema: ${nome} (clique para trocar)" aria-label="Tema: ${nome}. Clique para trocar">${ic}<span>${nome}</span></button>`;
}
if(window.matchMedia) try{ matchMedia("(prefers-color-scheme: dark)").addEventListener("change",aplicaTema); }catch(e){}
aplicaTema();

/* ---------- aviso (toast) com Desfazer ---------- */
let toastTimer=null, toastAcao=null;
function toast(msg,acaoTxt,acaoFn){
  let el=document.getElementById("toast");
  if(!el){ el=document.createElement("div"); el.id="toast"; el.className="toast"; el.setAttribute("role","status"); document.body.appendChild(el);
    el.addEventListener("click",e=>{ if(e.target.closest("[data-toastacao]")&&toastAcao){ const f=toastAcao; toastAcao=null; el.hidden=true; f(); } }); }
  toastAcao=acaoFn||null;
  el.innerHTML=`<span>${esc(msg)}</span>${acaoTxt?`<button type="button" data-toastacao="1">${esc(acaoTxt)}</button>`:""}`;
  el.hidden=false; el.classList.remove("entra"); void el.offsetWidth; el.classList.add("entra"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>{el.hidden=true; toastAcao=null;},acaoTxt?6000:(msg.length>60?5000:3500));
}
/* Faz uma alteração guardando uma cópia para poder desfazer */
function comDesfazer(chave,msg,fn){
  const antes=clone(chave==="config"?state.config:getMonth(chave));
  fn(); save(chave); render();
  toast(msg,"Desfazer",()=>{ if(chave==="config"){ state.config=antes; buildMeses(); } else state.months[chave]=antes; save(chave); render(); toast("Desfeito."); });
}

/* Exclui uma conta fixa a partir de um mês (os meses anteriores continuam com ela). Sem mês: apaga de todos. */
function excluirFixo(id,apartir){
  const f=state.config.fixos.find(x=>x.id===id); if(!f) return;
  if(!apartir||f.desde>=apartir){ apagarItem("config","fixos",id,"Conta fixa “"+f.nome+"” apagada."); return; }
  const antes=f.ate, novoAte=shiftKey(apartir,-1); f.ate=(f.ate&&f.ate<novoAte)?f.ate:novoAte; save("config"); render();
  toast("“"+f.nome+"” excluída a partir de "+abrMes(apartir)+".","Desfazer",()=>{ const g=state.config.fixos.find(x=>x.id===id); if(g){ g.ate=antes; save("config"); render(); toast("Desfeito."); } });
}
/* Marca conta fixa, parcela ou fatura como paga (guarda a data do pagamento) */
function marcaPago(tipo,id,k,pago,silencioso){
  const m=getMonth(k), hoje=new Date(), data=hoje.getFullYear()+"-"+pad2(hoje.getMonth()+1)+"-"+pad2(hoje.getDate());
  if(tipo==="fat"){ const cid=id&&id!=="fatura"?id:(state.config.cartoes[0]||{}).id; m.faturasPagas=Object.assign({},m.faturasPagas,{[cid]:pago}); if(state.config.cartoes[0]&&cid===state.config.cartoes[0].id) m.faturaPaga=pago;
    parcelasDoMes(k).filter(x=>x.cartao&&x.cartaoId===cid).forEach(x=>{ const o=Object.assign({},m.parcelas[x.id]||{}); o.pago=pago; if(pago) o.pagoEm=data; else delete o.pagoEm; m.parcelas[x.id]=o; });
    faturaDoMes(k,cid).filter(x=>!x.parcela).forEach(x=>{ const g=getMonth(x.compraK).gastos.find(y=>y.id===x.id); if(g){ g.pago=pago; if(pago) g.pagoEm=data; else delete g.pagoEm; if(x.compraK!==k) save(x.compraK); } }); }
  else { const mapa=tipo==="fixo"?"fixos":"parcelas"; const o=Object.assign({},m[mapa][id]||{}); o.pago=pago; if(pago) o.pagoEm=data; else delete o.pagoEm; m[mapa][id]=o; }
  save(k); if(!silencioso){ render(); toast(pago?"Pagamento registrado.":"Marcado como não pago."); }
}
/* Paga / não paga numa despesa do cartão de crédito */
function marcaGastoPago(k,id,pago){
  const g=getMonth(k).gastos.find(x=>x.id===id); if(!g) return;
  const h=new Date(); g.pago=pago; if(pago) g.pagoEm=h.getFullYear()+"-"+pad2(h.getMonth()+1)+"-"+pad2(h.getDate()); else delete g.pagoEm;
  if(!pago&&noCartao(g)){ const c=cartaoDe(g), fk=faturaMes(k,g.dia,c), mf=getMonth(fk); if(mf.faturasPagas&&mf.faturasPagas[c.id]){ mf.faturasPagas[c.id]=false; save(fk); } }
  save(k); render(); toast(pago?"Despesa do cartão marcada como paga.":"Despesa do cartão marcada como não paga.");
}
/* Contas que vencem amanhã, hoje ou já venceram (mês anterior e atual) */
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
/* ---------- bloqueio com PIN (vale só para este aparelho) ---------- */
const PINKEY="mb.pin", PINLEN=4;
function pinCfg(){ try{ const c=JSON.parse(localStorage.getItem(PINKEY)||"null"); return c&&c.hash?c:null; }catch(e){ return null; } }
function salvaPinCfg(c){ try{ if(c) localStorage.setItem(PINKEY,JSON.stringify(c)); else localStorage.removeItem(PINKEY); }catch(e){} }
async function hashPin(pin,salt){ const h=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("mbc:"+salt+":"+pin)); return Array.from(new Uint8Array(h),b=>b.toString(16).padStart(2,"0")).join(""); }
async function confere(pin){ const c=pinCfg(); return !!c&&(await hashPin(pin,c.salt))===c.hash; }
async function definePin(pin,apos){ const salt=novoCodigo(16), c=pinCfg(), n={salt,hash:await hashPin(pin,salt),apos:apos!=null?apos:(c&&c.apos!=null?c.apos:1)}; if(c&&c.bio) n.bio=c.bio; salvaPinCfg(n); }
let travado=false, pinDig="", saiuEm=0, pinMsg="", esqueciPin=false;
const errosPin=()=>{ try{ return JSON.parse(localStorage.getItem("mb.pin.erros")||'{"n":0,"ate":0}'); }catch(e){ return {n:0,ate:0}; } };
const salvaErros=x=>{ try{ localStorage.setItem("mb.pin.erros",JSON.stringify(x)); }catch(e){} };
function travar(){ const c=pinCfg(); if(!c||travado) return; travado=true; pinDig=""; pinMsg=""; esqueciPin=false; document.body.classList.add("travado"); renderLock(); if(c.bio) setTimeout(()=>usarBio(true),350); }
function destravar(){ travado=false; pinDig=""; document.body.classList.remove("travado"); const el=document.getElementById("lock"); if(el) el.remove(); }
function renderLock(){
  let el=document.getElementById("lock"); if(!el){ el=document.createElement("div"); el.id="lock"; el.setAttribute("role","dialog"); el.setAttribute("aria-modal","true"); el.setAttribute("aria-label","App bloqueado"); document.body.appendChild(el); }
  const er=errosPin(), espera=Math.max(0,Math.ceil((er.ate-Date.now())/1000));
  if(espera>0) setTimeout(()=>{ if(travado) renderLock(); },1000);
  const nome=authUser&&authUser.displayName?primeiroNome(authUser.displayName):"";
  const tec=n=>`<button type="button" class="tecla" data-k="${n}" ${espera?"disabled":""}>${n}</button>`;
  el.innerHTML=esqueciPin?`<div class="lockbox">
      <span class="lockic">${ICON.cadeado}</span><h2>Esqueceu o PIN?</h2>
      ${mode==="cloud"?`<p>Para tirar o PIN deste aparelho, saia e entre de novo com a sua conta Google. Seus lançamentos continuam guardados na nuvem.</p>
        <button class="btn wide" type="button" data-lk="sair">Sair e entrar de novo</button>`
      :`<p>Sem login, os dados ficam só neste aparelho e não há como confirmar que é você. A única saída é apagar os dados deste aparelho e começar de novo.</p>
        <button class="btn danger wide" type="button" data-lk="apagar">Apagar os dados deste aparelho</button>`}
      <button class="link" type="button" data-lk="voltar">Voltar e tentar de novo</button></div>`
  :`<div class="lockbox">
    <img class="lklogo" src="icons/logo-128.png" alt="" width="64" height="64">
    <h2>${nome?"Olá, "+esc(nome):"Monetra"}</h2>
    <p class="${pinMsg?"erro":""}" aria-live="polite">${espera?"Muitas tentativas. Tente de novo em "+espera+"s.":pinMsg?esc(pinMsg):"Digite seu PIN para abrir"}</p>
    <div class="pontos ${pinMsg?"treme":""}">${Array.from({length:PINLEN},(_,i)=>`<i class="${i<pinDig.length?"on":""}"></i>`).join("")}</div>
    <div class="teclado">${[1,2,3,4,5,6,7,8,9].map(tec).join("")}<span></span>${tec(0)}<button type="button" class="tecla del" data-k="del" aria-label="Apagar" ${espera?"disabled":""}>${ICON.apagar}</button></div>
    ${pinCfg()&&pinCfg().bio?`<button class="btn ghost bio" type="button" data-lk="bio">${ICON.digital}Usar digital</button>`:""}
    <button class="link" type="button" data-lk="esqueci">Esqueci o PIN</button></div>`;
}
async function teclaPin(k){
  if(!travado) return;
  if(errosPin().ate>Date.now()) return;
  if(k==="del"){ pinDig=pinDig.slice(0,-1); pinMsg=""; renderLock(); return; }
  if(!/^\d$/.test(k)||pinDig.length>=PINLEN) return;
  pinDig+=k; pinMsg=""; renderLock();
  if(pinDig.length<PINLEN) return;
  if(await confere(pinDig)){ salvaErros({n:0,ate:0}); destravar(); return; }
  const er=errosPin(); er.n++; if(er.n>=5){ er.ate=Date.now()+30000*Math.pow(2,Math.min(4,er.n-5)); }
  salvaErros(er); pinDig=""; pinMsg=er.n>=5?"":"PIN errado"+(er.n>=3?" ("+(5-er.n)+" tentativa"+(5-er.n===1?"":"s")+" antes de esperar)":""); renderLock();
}
document.addEventListener("click",e=>{
  const lk=e.target.closest("#lock [data-k],#lock [data-lk]"); if(!lk) return;
  if(lk.dataset.k) return teclaPin(lk.dataset.k);
  const a=lk.dataset.lk;
  if(a==="bio"){ usarBio(false); return; }
  if(a==="esqueci"){ esqueciPin=true; renderLock(); }
  if(a==="voltar"){ esqueciPin=false; renderLock(); }
  if(a==="sair"){ salvaPinCfg(null); salvaErros({n:0,ate:0}); destravar(); if(fb) fb.signOut(fb.auth); }
  if(a==="apagar"){ if(!lk.dataset.ok){ lk.dataset.ok="1"; lk.textContent="Toque de novo para apagar tudo"; return; } try{ localStorage.removeItem(LSKEY); }catch(e){} salvaPinCfg(null); salvaErros({n:0,ate:0}); location.reload(); }
});
document.addEventListener("keydown",e=>{ if(!travado) return; if(esqueciPin){ if(e.key!=="Tab"&&e.key!=="Enter"&&e.key!==" ") e.preventDefault(); return; } if(e.key.length===1&&!/^\d$/.test(e.key)){ e.preventDefault(); return; } if(/^\d$/.test(e.key)){ e.preventDefault(); teclaPin(e.key); } else if(e.key==="Backspace"){ e.preventDefault(); teclaPin("del"); } },true);
const diaAberto=new Date().toDateString();
document.addEventListener("visibilitychange",()=>{ if(!document.hidden&&new Date().toDateString()!==diaAberto&&!dirty.size&&!ui.sheet) location.reload(); });
document.addEventListener("visibilitychange",()=>{
  const c=pinCfg(); if(!c) return;
  if(document.hidden){ saiuEm=Date.now(); return; }
  if(saiuEm&&Date.now()-saiuEm>=(Number(c.apos)||0)*60000) travar();
  saiuEm=0;
});
/* desbloqueio por digital/rosto (WebAuthn com o leitor do próprio aparelho) */
const b64u={enc:buf=>btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""),dec:t=>Uint8Array.from(atob(t.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((t.length+3)%4)),c=>c.charCodeAt(0))};
let bioOk=null;
(async()=>{ try{ bioOk=!!(window.PublicKeyCredential&&PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); }catch(e){ bioOk=false; } if(state.loaded&&ui.tab==="perfil") render(); })();
async function ligarBio(){
  const c=pinCfg(); if(!c) return;
  try{
    const cred=await navigator.credentials.create({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),rp:{name:"Monetra"},
      user:{id:crypto.getRandomValues(new Uint8Array(16)),name:(authUser&&authUser.email)||"monetra",displayName:(authUser&&authUser.displayName)||"Monetra"},
      pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],authenticatorSelection:{authenticatorAttachment:"platform",userVerification:"required",residentKey:"discouraged"},timeout:60000,attestation:"none"}});
    c.bio=b64u.enc(cred.rawId); salvaPinCfg(c); render(); toast("Pronto: o app abre com a sua digital (ou rosto). O PIN continua valendo.");
  }catch(e){ console.warn(e); render(); toast(e&&e.name==="NotAllowedError"?"Cancelado.":"Não foi possível ligar a digital neste aparelho."); }
}
function desligarBio(){ const c=pinCfg(); if(c){ delete c.bio; salvaPinCfg(c); } render(); toast("Digital desligada. O app vai pedir só o PIN."); }
let bioRodando=false;
async function usarBio(auto){
  const c=pinCfg(); if(!c||!c.bio||!travado||bioRodando) return; bioRodando=true;
  try{ await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),allowCredentials:[{type:"public-key",id:b64u.dec(c.bio),transports:["internal"]}],userVerification:"required",timeout:60000}});
    salvaErros({n:0,ate:0}); destravar(); }
  catch(e){ if(!auto&&travado){ pinMsg="Não deu para usar a digital. Digite o PIN."; renderLock(); } }
  finally{ bioRodando=false; }
}
function cardPin(){
  const c=pinCfg();
  return `<div class="card" id="bloqueio"><div class="cardhead"><h2>Bloqueio com PIN</h2>${c?'<span class="tag">ligado</span>':""}</div>
  ${c?`<p class="hint">O app pede o PIN de ${PINLEN} números ao abrir neste aparelho. Cada aparelho tem o seu.</p>
    <label class="f">Pedir o PIN de novo quando voltar para o app<select class="in" id="pinApos">${[[0,"Na hora"],[1,"Depois de 1 minuto fora"],[5,"Depois de 5 minutos fora"],[15,"Depois de 15 minutos fora"]].map(([v,t])=>`<option value="${v}" ${Number(c.apos)===v?"selected":""}>${t}</option>`).join("")}</select></label>
    ${bioOk?`<label class="switch"><input type="checkbox" id="pinBio" ${c.bio?"checked":""}><span></span>Desbloquear com digital (ou rosto)</label>`:bioOk===false?`<p class="hint">Desbloqueio por digital: este aparelho ou navegador não oferece leitor de digital para sites.</p>`:""}
    <div class="row2"><button class="btn ghost" type="button" data-novo="pin" data-pinmodo="trocar">Trocar PIN</button><button class="btn ghost" type="button" data-novo="pin" data-pinmodo="desligar">Desligar</button></div>`
  :`<p class="hint">Proteja o app com um PIN de ${PINLEN} números, pedido sempre que abrir neste aparelho. Bom para quando outras pessoas usam o seu celular.</p>
    <button class="btn" type="button" data-novo="pin" data-pinmodo="criar">${ICON.cadeado}Criar PIN</button>`}</div>`;
}
async function salvarPin(){
  const s=ui.sheet, v=id=>((document.getElementById(id)||{}).value||"").trim(), ok=x=>new RegExp("^\\d{"+PINLEN+"}$").test(x);
  if(s.pinModo!=="criar"&&!(await confere(v("s-pinatual")))) return erroSheet("PIN atual errado.","s-pinatual");
  if(s.pinModo==="desligar"){ salvaPinCfg(null); closeSheet(); render(); toast("Bloqueio com PIN desligado neste aparelho."); return; }
  const n=v("s-pinnovo"), r=v("s-pinrep");
  if(!ok(n)) return erroSheet("O PIN precisa ter "+PINLEN+" números.","s-pinnovo");
  if(/^(\d)\1+$/.test(n)||"0123456789".includes(n)||"9876543210".includes(n)) return erroSheet("Escolha um PIN menos óbvio (evite 1111 ou 1234).","s-pinnovo");
  if(n!==r) return erroSheet("Os dois PINs não são iguais.","s-pinrep");
  await definePin(n); closeSheet(); render(); toast(s.pinModo==="criar"?"PIN criado. O app vai pedir ao abrir neste aparelho.":"PIN trocado.");
}

/* ---------- tutorial de boas-vindas ---------- */
const TUTKEY="mb.tutorial";
const tutVisto=()=>{ try{ return localStorage.getItem(TUTKEY)==="1"; }catch(e){ return true; } };
const marcaTutVisto=()=>{ try{ localStorage.setItem(TUTKEY,"1"); }catch(e){} };
let tutAberto=false, tutI=0;
function passosTutorial(){
  const nuvem=mode==="cloud", tecla=matchMedia("(hover:hover) and (pointer:fine)").matches;
  const L=(...xs)=>`<ul>${xs.map(x=>`<li>${x}</li>`).join("")}</ul>`;
  return [
    {ic:"logo",t:"Bem-vindo ao Monetra",d:`Seu controle financeiro, <b>grátis e sem anúncios</b>. Em 1 minuto você aprende o básico.`+L(nuvem?"Seus dados ficam na sua conta e aparecem em qualquer aparelho.":"Sem login, os dados ficam só neste aparelho.","Dá para rever este tutorial depois em <b>Perfil → Tutorial</b>.")},
    {ic:"mes",t:"1. Comece pelo salário",d:`No <b>Início</b>, role até o card <b>Receitas</b> e informe o <b>salário deste mês</b>. O controle começa a contar a partir daí.`+L("Recebeu algo a mais? Use o atalho <b>Receita</b>, logo abaixo do saldo.","Já tem dinheiro na conta? Informe o <b>saldo inicial</b> em Perfil → Ajustes → Contas.")},
    {ic:"mais",t:"2. Lance seus gastos",d:`Toque no <b>+</b> no centro da barra de baixo${tecla?" (ou aperte <b>N</b> no teclado)":""}, digite o valor e escolha a <b>categoria</b> e a <b>forma de pagamento</b>.`+L("Mais rápido: escreva <b>45 ifood pix</b> ou <b>120 mercado ontem</b> no campo rápido e aperte Enter.","Comprou parcelado? Ligue <b>Compra parcelada</b> (ou escreva <b>3x</b>).","Errou? Toque no lançamento para editar, ou em <b>Desfazer</b>.","No celular, a janela fecha no <b>X</b> ou arrastando o topo dela para baixo.")},
    {ic:"ajustes",t:"3. Contas fixas e cartões",d:`Em <b>Perfil → Ajustes</b>, cadastre o que se repete todo mês e os seus cartões.`+L("<b>Contas fixas</b> (aluguel, internet) entram sozinhas todo mês; marque como paga.","<b>Cartões</b>: compras no crédito vão para a fatura certa, até a última parcela.","<b>Categorias</b>: com ícone, cor, limite por mês (a sobra pode passar para o mês seguinte) e subcategorias.")},
    {ic:"cofre",t:"4. Metas e desafios",d:`Na aba <b>Metas</b> ficam as metas de economia, os desafios e as conquistas.`+L("Crie <b>metas</b> com valor e prazo: o anel mostra quanto já guardou e o app diz quanto guardar por mês.","Topa um desafio? Ex.: <b>30 dias sem delivery</b>. O app acompanha sozinho.")},
    {ic:"ano",t:"5. Acompanhe para onde vai",d:`O <b>Início</b> mostra o saldo com gráfico, a <b>previsão do fim do mês</b> e o orçamento por categoria.`+L("No topo ficam 4 meses: o anterior, o atual e os próximos com fatura ou parcela para pagar. Para ir a qualquer outro, toque no <b>calendário</b> ao lado deles.","Mais abaixo: <b>calendário de gastos</b>, <b>para onde foi</b>, <b>fatura do cartão</b> e <b>contas fixas</b> (marque como paga tocando no quadradinho e toque na conta para editar). No calendário: <b>anel</b> = vence, <b>ponto</b> = pago, <b>triângulo</b> = atrasado.","<b>Relatórios</b>: meses lado a lado, quanto das receitas virou despesa, assinaturas, etiquetas e a retrospectiva do ano em formato de stories.")},
    {ic:"sino",t:"6. Não esqueça nenhuma conta",d:`O <b>sininho</b> no topo avisa contas que vencem amanhã, hoje ou estão atrasadas (com botão <b>Paguei</b>), limites estourando e o resumo da semana.`+L("Ative as <b>notificações</b> em Perfil → Lembretes.","Para avisar até com o app fechado, use <b>Adicionar lembretes ao calendário</b>.")},
    {ic:"grupo",t:"7. Tem muito mais",d:`Quando precisar, está tudo em <b>Perfil → Ajustes</b>:`+L("<b>Ferramentas</b>: simulador de quitação, 13º, férias, salário líquido e quanto guardar.","<b>Importar extrato</b> (OFX/CSV), <b>modo viagem</b> e <b>dívidas</b> com pessoas.",nuvem?"<b>Controle compartilhado</b> com a família, separado do seu Pessoal.":"Controle compartilhado (com login Google).","<b>PIN e digital</b>, planilha para Excel e backup.","<b>Acessibilidade</b> (em Perfil): texto maior, alto contraste, cores para daltonismo, modo calmo, fonte de leitura fácil e botões maiores.")},
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
/* aparece sozinho só para quem está começando (sem renda e quase sem lançamentos) */
function talvezTutorial(){
  if(tutAberto||tutVisto()||travado||ui.sheet||mode==="login"||!state.loaded||precisaTermos()) return;
  const n=Object.values(state.months).reduce((a,m)=>a+((m.gastos||[]).length+(m.avulsos||[]).length),0);
  if(inicioKey()||n>2){ marcaTutVisto(); return; }
  setTimeout(()=>{ if(!tutAberto&&!tutVisto()&&!travado&&!ui.sheet) abrirTutorial(); },400);
}

/* ---------- central de notificações (sininho no topo) ---------- */
function avisos(){
  if(mode==="login"||!state.loaded) return {itens:[],n:0};
  /** @type {any[]} */
  const itens=[];
  Object.keys(pedidosG||{}).forEach(g=>(pedidosG[g]||[]).forEach(p=>itens.push({tipo:"pedido",g,p})));
  pendencias().forEach(x=>itens.push({tipo:"conta",x}));
  alertasOrcamento(todayKey).forEach(a=>itens.push({tipo:"orc",a}));
  const bkL=lembreteBackup(); if(bkL&&bkL.local) itens.push({tipo:"backup",b:bkL});
  (state.config.dividas||[]).filter(x=>!quitada(x)&&x.venc&&diasAte(x.venc)<=1).forEach(x=>itens.push({tipo:"divida",x}));
  const n=itens.length;
  let rep=[]; try{ rep=assinaturas().repetidos; }catch(e){}
  rep.forEach(r=>itens.push({tipo:"dica",r}));
  if(bkL&&!bkL.local) itens.push({tipo:"backup",b:bkL});
  const rs=avisoSemana(); if(rs) itens.push({tipo:"semana",r:rs});
  const mesAt=kM(todayKey), anoR=mesAt===12?kY(todayKey):mesAt===1?kY(todayKey)-1:null;
  if(anoR&&anosRetro().includes(anoR)) itens.push({tipo:"retro",ano:anoR});
  return {itens,n};
}
function botaoSino(){
  const n=avisos().n;
  return `<button type="button" class="iconbtn sino" data-avisos="1" aria-label="Notificações${n?": "+n+" nova"+(n===1?"":"s"):""}" title="Notificações">${ICON.sino}${n?`<i class="badge">${n>9?"9+":n}</i>`:""}</button>`;
}
function listaAvisos(){
  const {itens}=avisos();
  if(!itens.length) return `<div class="avisovazio">${ICON.sino}<b>Tudo em dia</b><span>Nenhuma conta vencendo, nenhum limite estourado e nenhum pedido esperando.</span></div>`;
  const linha=(cls,ic,titulo,sub,acao)=>`<div class="aviso ${cls}"><span class="ic">${ic}</span><span class="t"><b>${titulo}</b><small>${sub}</small></span>${acao||""}</div>`;
  const grupos={pedido:[],conta:[],orc:[],dica:[]};
  itens.forEach(it=>{
    if(it.tipo==="pedido"){ const nome=((eu.grupos||{})[it.g]||{}).nome||""; grupos.pedido.push(linha("pedido",ICON.grupo,esc(primeiroNome(it.p.nome))+" quer entrar em “"+esc(nome)+"”",esc(it.p.email||""),`<button class="btn mini" type="button" data-avgrupo="${esc(it.g)}">Ver pedido</button>`)); }
    if(it.tipo==="conta"){ const x=it.x, e=estadoPend(x); grupos.conta.push(linha("pagar "+e.cls,x.dd<0?ICON_ALERTA:ICON_RELOGIO,esc(x.nome)+" · "+brl(x.valor),esc(e.txt)+(x.dd>=0?" · "+fmtData(x.data):""),`<button class="btn mini" type="button" data-avpagar="${x.tipo}|${esc(x.id)}|${x.k}">Paguei</button>`)); }
    if(it.tipo==="divida"){ const x=it.x, dd=diasAte(x.venc), cls=dd<0?"atraso":dd===0?"hoje":"amanha";
      grupos.conta.push(linha("pagar "+cls,ICON.grupo,x.tipo==="receber"?esc(x.pessoa)+" te deve "+brl(restaDiv(x)):"Você deve "+brl(restaDiv(x))+" a "+esc(x.pessoa),dd<0?"combinado para "+dataCurta(x.venc)+" (passou)":dd===0?"combinado para hoje":"combinado para amanhã",`<button class="btn ghost mini" type="button" data-avdiv="${esc(x.id)}">Ver</button>`)); }
    if(it.tipo==="orc"){ const a=it.a; grupos.orc.push(linha("orc "+(a.nivel==="passou"?"atraso":"amanha"),`<i class="bola" style="background:${catColor(a.id)}"></i>`,esc(textoAlerta(a)),"limite de "+brl(a.o)+" em "+esc(abrMes(todayKey)),`<button class="btn ghost mini" type="button" data-avmes="1">Ver mês</button>`)); }
    if(it.tipo==="backup"){ const b=it.b; (b.local?grupos.conta:grupos.dica).push(linha(b.local?"pagar amanha":"dica",ICON.check,"Hora de fazer um backup",(b.dias===null?"Você ainda não baixou nenhum backup":"Último backup há "+b.dias+" dias")+(b.local?" · sem login, seus dados ficam só neste aparelho":" · uma cópia sua, além da nuvem"),`<span class="bkbtns"><button class="btn mini" type="button" data-avbackup="1">Baixar</button><button class="btn ghost mini" type="button" data-avbackupdepois="1">Depois</button></span>`)); }
    if(it.tipo==="semana"){ const r=it.r; grupos.dica.push(linha("pedido",ICON.ano||ICON.mais,"Sua semana: "+brl(r.tot),esc(textoVarSemana(r))+(r.subiu?" · mais subiu: "+esc(catName(r.subiu.id)):""),`<button class="btn mini" type="button" data-avsemana="${r.fim}">Ver</button>`)); }
    if(it.tipo==="retro") grupos.dica.push(linha("pedido",ICON.ano||ICON.mais,"Sua retrospectiva de "+it.ano+" está pronta","quanto entrou, saiu e seus recordes do ano",`<button class="btn mini" type="button" data-avretro="${it.ano}">Ver</button>`));
    if(it.tipo==="dica"){ const r=it.r; grupos.dica.push(linha("dica",ICON.mais,"“"+esc(r.nome)+"” parece uma assinatura",r.meses.size+" dos últimos 4 meses · média "+brl(r.media),`<button class="btn ghost mini" type="button" data-avassin="1">Ver</button>`)); }
  });
  const bloco=(t,arr)=>arr.length?`<div class="subhead">${t}</div>${arr.join("")}`:"";
  return bloco("Pedidos para entrar",grupos.pedido)+bloco(grupos.conta.some(x=>x.includes("data-avbackup"))&&grupos.conta.length===1?"Seus dados":"Contas e dívidas",grupos.conta)+bloco("Limites do mês",grupos.orc)+bloco("Dicas",grupos.dica)
    +(notifOn?"":`<p class="hint">Quer receber esses avisos mesmo com o app fechado? <button class="link" type="button" data-avperfil="1">Ative as notificações no Perfil</button>.</p>`);
}
function pagarPend(spec){ const [t,id,k]=spec.split("|"); let atual=false; const m=getMonth(k);
  if(t==="fat") atual=faturaPaga(m,id); else atual=!!((m[t==="fixo"?"fixos":"parcelas"][id]||{}).pago);
  marcaPago(t,id,k,!atual); }

/* Notificações do navegador (funcionam com o app aberto ou em segundo plano) */
let notifOn=false; try{ notifOn=localStorage.getItem("mb.notif")==="1"; }catch(e){}
let ultimaVerif=0;
async function mostraNotif(titulo,corpo,tag){
  try{ const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();
    const op={body:corpo,tag,icon:"icons/icon-192.png",badge:"icons/icon-192.png",renotify:false};
    if(reg) await reg.showNotification(titulo,op); else new Notification(titulo,op); }catch(e){ console.warn(e); }
}
function verificaLembretes(forcar){
  if(!notifOn||!("Notification" in window)||Notification.permission!=="granted") return;
  if(!forcar&&Date.now()-ultimaVerif<60000) return; ultimaVerif=Date.now();
  let vistos={}; try{ vistos=JSON.parse(localStorage.getItem("mb.notif.vistos")||"{}"); }catch(e){}
  const d=new Date(), hoje=d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate());
  pendencias().forEach(x=>{
    const e=x.dd===1?"amanha":x.dd===0?"hoje":"atraso", chave=[x.tipo,x.id,x.k,e,e==="atraso"?hoje:""].join(":");
    if(vistos[chave]) return; vistos[chave]=hoje;
    const titulo=e==="amanha"?"Vence amanhã: "+x.nome:e==="hoje"?"Vence hoje: "+x.nome:"Conta atrasada: "+x.nome;
    mostraNotif(titulo,brl(x.valor)+(e==="atraso"?" · venceu em "+fmtData(x.data):"")+" — toque para abrir o Monetra.",chave);
  });
  alertasOrcamento(todayKey).forEach(a=>{ const chave=["orc",a.id,todayKey,a.nivel].join(":"); if(vistos[chave]) return; vistos[chave]=hoje;
    mostraNotif(a.nivel==="passou"?"Limite estourado: "+a.nome:a.nivel==="ritmo"?"Ritmo alto: "+a.nome:"Atenção ao limite: "+a.nome, textoAlerta(a)+" Toque para ver.",chave); });
  const rsN=avisoSemana(); if(rsN){ const chave="semana:"+rsN.fim; if(!vistos[chave]){ vistos[chave]=hoje; mostraNotif("Resumo da semana: "+brl(rsN.tot),textoVarSemana(rsN)+(rsN.subiu?". Mais subiu: "+catName(rsN.subiu.id):"")+". Toque para ver.",chave); } }
  const bkN=lembreteBackup(); if(bkN){ const chave="backup:"+todayKey; if(!vistos[chave]){ vistos[chave]=hoje; mostraNotif("Hora de fazer um backup",(bkN.dias===null?"Você ainda não baixou nenhum backup.":"Último backup há "+bkN.dias+" dias.")+" Toque para abrir o Monetra.",chave); } }
  for(const k in vistos) if(vistos[k]<shiftKey(hoje.slice(0,7),-2)) delete vistos[k];
  try{ localStorage.setItem("mb.notif.vistos",JSON.stringify(vistos)); }catch(e){}
}
async function ligaNotif(on){
  if(!on){ notifOn=false; try{localStorage.setItem("mb.notif","0")}catch(e){} render(); return; }
  if(!("Notification" in window)){ toast("Este navegador não permite notificações. Use os lembretes no calendário."); render(); return; }
  const p=Notification.permission==="granted"?"granted":await Notification.requestPermission();
  notifOn=p==="granted"; try{localStorage.setItem("mb.notif",notifOn?"1":"0")}catch(e){}
  render();
  if(notifOn){ toast("Notificações ativadas."); mostraNotif("Monetra","Pronto! Você vai ser avisado um dia antes, no dia e se uma conta atrasar.","teste"); verificaLembretes(true); }
  else toast("O navegador bloqueou as notificações. Libere nas configurações do site.");
}
/* Lembretes no calendário (avisam mesmo com o app fechado) */
function exportarCalendario(){
  const esc2=t=>String(t||"").replace(/\\/g,"\\\\").replace(/[,;]/g,m=>"\\"+m).replace(/\n/g,"\\n");
  const ymd=d=>d.getFullYear()+pad2(d.getMonth()+1)+pad2(d.getDate());
  const stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+/,"");
  const L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Monetra//PT-BR","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:Monetra - contas"];
  let n=0;
  const ev=(uid,data,titulo,desc)=>{ n++; L.push("BEGIN:VEVENT","UID:"+uid+"@mbcontrole","DTSTAMP:"+stamp,"DTSTART:"+ymd(data)+"T090000","DTEND:"+ymd(data)+"T091500","SUMMARY:"+esc2(titulo),"DESCRIPTION:"+esc2(desc),"BEGIN:VALARM","ACTION:DISPLAY","DESCRIPTION:"+esc2(titulo),"TRIGGER:PT0M","END:VALARM","END:VEVENT"); };
  const tres=(base,data,nome,valor)=>{ const ant=new Date(data); ant.setDate(ant.getDate()-1); const dep=new Date(data); dep.setDate(dep.getDate()+1);
    ev(base+"-antes",ant,"Amanhã vence: "+nome+" ("+brl(valor)+")","Lembrete do Monetra.");
    ev(base+"-dia",data,"Hoje vence: "+nome+" ("+brl(valor)+")","Depois de pagar, marque como paga no Monetra.");
    ev(base+"-atraso",dep,"Atrasou? "+nome+" venceu ontem","Se ainda não pagou, a conta está atrasada. Se já pagou, ignore."); };
  for(let i=0;i<12;i++){ const k=shiftKey(todayKey,i), dim=diasMes(k);
    state.config.fixos.filter(f=>f.desde<=k&&(!f.ate||k<=f.ate)&&(!inicioKey()||k>=inicioKey())).forEach(f=>{ const o=((state.months[k]||{}).fixos||{})[f.id]||{}; if(o.pago||o.pular) return; tres("f"+f.id+k,new Date(kY(k),kM(k)-1,Math.min(f.dia,dim)),f.nome,typeof o.valor==="number"?o.valor:f.valor); });
    parcelasDoMes(k).filter(p=>!p.cartao&&!p.pago).forEach(p=>tres("p"+p.id+k,new Date(kY(k),kM(k)-1,p.dia),(p.desc||"Parcela")+" "+p.idx+"/"+p.n,p.valor));
    cartoesOk().forEach(cc=>{ const m=state.months[k], tf=soma(faturaDoMes(k,cc.id)); if(tf>0&&!faturaPaga(m,cc.id)) tres("fat"+cc.id+k,new Date(kY(k),kM(k)-1,Math.min(cc.vence,dim)),"Fatura "+cc.nome,soma(faturaDoMes(k,cc.id))); });
  }
  L.push("END:VCALENDAR");
  if(!n){ toast("Nenhuma conta com vencimento para colocar no calendário."); return; }
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([L.join("\r\n")],{type:"text/calendar;charset=utf-8"})); a.download="monetra-lembretes.ics"; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
  toast("Arquivo de lembretes baixado ("+(n/3)+" vencimentos). Abra para adicionar ao calendário.");
}

/* Desfazer item por item (não sobrescreve outras mudanças feitas no meio tempo) */
function apagarItem(chave,lista,id,msg){
  const alvo=chave==="config"?state.config:getMonth(chave), arr=alvo[lista], idx=arr.findIndex(x=>x.id===id);
  if(idx<0) return; const item=arr[idx];
  alvo[lista]=arr.filter(x=>x.id!==id); marcaApagado(chave,id); save(chave); render();
  toast(msg,"Desfazer",()=>{ const a=chave==="config"?state.config:getMonth(chave); if(!a[lista].some(x=>x.id===id)){ a[lista].splice(Math.min(idx,a[lista].length),0,item); } desmarcaApagado(chave,id); save(chave); render(); toast("Desfeito."); });
}

/* ---------- backup ---------- */
/* lembrete mensal de backup: guarda neste aparelho quando foi o último e quando pediu para lembrar depois */
const chaveBk=()=>"mb.backup."+(uid||"local");
function infoBackup(){ try{ return JSON.parse(localStorage.getItem(chaveBk())||"{}")||{}; }catch(e){ return {}; } }
function salvaInfoBackup(o){ try{ localStorage.setItem(chaveBk(),JSON.stringify(Object.assign(infoBackup(),o))); }catch(e){} }
function nLancamentos(){ let n=0; Object.values(state.months||{}).forEach(m=>{ n+=((m&&m.gastos)||[]).length+((m&&m.avulsos)||[]).length; }); return n+state.config.fixos.length+state.config.parcelas.length; }
function lembreteBackup(){
  if(mode==="login"||!state.loaded||(mode==="cloud"&&aberto!=="pessoal")) return null;
  const bk=infoBackup(), hj=hojeISO(), n=nLancamentos(); if(n<10) return null;
  if(bk.depois&&bk.depois>hj) return null;
  const dias=bk.ultimo?entreDias(bk.ultimo,hj):null;
  if(dias!==null&&dias<30) return null;
  return {dias,local:mode!=="cloud",n};
}
function exportar(){
  salvaInfoBackup({ultimo:hojeISO(),depois:null});
  const blob=new Blob([JSON.stringify({app:"monetra",versao:2,exportadoEm:new Date().toISOString(),config:state.config,months:state.months},null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="monetra-backup-"+new Date().toISOString().slice(0,10)+".json"; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
}
function importar(file){
  if(mode==="cloud"&&aberto!=="pessoal"){ ui.importMsg="Para restaurar um backup, abra o controle Pessoal (botões no topo)."; render(); return; }
  const r=new FileReader();
  r.onload=()=>{ try{ const d=JSON.parse(String(r.result)); if(!d.config||!d.months) throw 0;
    const t=state.config.termos; state.config=normConfig(d.config); if(!state.config.termos) state.config.termos=t; buildMeses(); save("config");
    for(const k in d.months){ if(!mesValido(k)) continue; state.months[k]=normMonth(d.months[k]); save(k); }
    ui.importMsg="Backup restaurado."; render(); }catch(e){ ui.importMsg="Arquivo inválido. Use um backup baixado pelo Monetra."; render(); } };
  r.readAsText(file);
}
/* Planilha (abre no Excel e no Google Planilhas) */
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
    m.transf.forEach(t=>linhas.push([mes,t.dia,"Transferência","",(t.desc||"")+" ("+nomeConta(t.de)+" → "+nomeConta(t.para)+")","",num(t.valor),"",""]));
    parcelasDoMes(k).forEach(p=>linhas.push([mes,p.dia,"Parcela "+p.idx+"/"+p.n,catName(p.cat),p.desc,formaNome(p.forma),"-"+num(p.valor),p.cartao?"na fatura":""]));
    fixosDoMes(k).filter(f=>!f.pular).forEach(f=>linhas.push([mes,f.dia,"Conta fixa",catName(f.cat),f.desc,formaNome(f.forma),"-"+num(f.valor),f.pago?"paga":"a pagar"]));
    m.caixinha.forEach(x=>linhas.push([mes,x.dia,x.tipo==="guardar"?"Caixinha (guardou)":"Caixinha (retirou)","",x.desc,"",(x.tipo==="guardar"?"-":"")+num(x.valor),""]));
  });
  const csv="﻿"+linhas.map(l=>l.map(cel).join(";")).join("\r\n");
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})); a.download="monetra-planilha-"+new Date().toISOString().slice(0,10)+".csv"; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
  toast("Planilha baixada.");
}
/* Apaga tudo da pessoa e recomeça do zero */
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


/* atalhos do ícone do app (manifest): ?acao=nova-despesa | ?acao=lembretes */
let atalhoPendente=new URLSearchParams(location.search).get("acao");
{ const cv=new URLSearchParams(location.search).get("convite"); if(cv){ ui.conviteUrl=cv.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8); atalhoPendente="convite"; } }
function trataAtalho(){
  if(!atalhoPendente||!state.loaded||mode==="login") return;
  const a=atalhoPendente; atalhoPendente=null;
  try{ history.replaceState(null,"",location.pathname); }catch(e){}
  if(a==="convite"){ ui.tab="perfil"; setTimeout(()=>{ render(); const el=document.getElementById("compartilhado"); if(el) el.scrollIntoView({block:"start"}); if(mode!=="cloud") toast("O controle compartilhado precisa do login com Google."); },50); return; }
  ui.tab="mes"; ui.month=todayKey;
  if(a==="nova-despesa") setTimeout(()=>{ render(); openSheet("gasto"); },50); else setTimeout(render,50);
}

/* =====================================================================
   TELAS
   ===================================================================== */
function render(){
  if(state.loaded) buildMeses();
  if(mode!=="loading") tiraBoot();
  const a=document.activeElement, inApp=a&&document.getElementById("app").contains(a);
  const fid=inApp&&a.id, sel=(fid&&"selectionStart" in a)?[a.selectionStart,a.selectionEnd]:null;
  const app=document.getElementById("app");
  const corpo=mode==="login"?(ui.lerTermos?viewTermos(false):mostraApresentacao()?viewApresentacao():viewLogin()):!state.loaded?'<div class="empty-state">Carregando seus lançamentos…</div>':precisaTermos()?viewTermos(true):ui.lerTermos?viewTermos(false):!state.loaded?'<div class="empty-state">Carregando seus lançamentos…</div>':ui.tab==="mes"?viewMes():ui.tab==="ano"?viewAno():ui.tab==="metas"?viewMetas():ui.tab==="perfil"?perfilComIcones():viewAjustes();
  const rolY=window.scrollY;
  /* movimento só quando a tela muda (aba, mês, login, carregou), não a cada digitação */
  const vista=[mode,state.loaded,ui.tab,ui.month,typeof aberto==="undefined"?"":aberto].join("|"), novaVista=vista!==ultimaVista;
  const novaTela=vista.split("|").slice(0,3).join("|")!==ultimaVista.split("|").slice(0,3).join("|"); ultimaVista=vista;
  app.classList.remove("anima","cascata");
  app.innerHTML='<div class="band" aria-hidden="true"></div><button type="button" class="pular" data-pular="1">Pular para o conteúdo</button><header id="topo" class="lm">'+header()+'</header><main id="conteudo" class="lm" tabindex="-1" aria-label="'+esc(nomeAba())+'">'+corpo+'</main>'+bottomNav();
  posicionaBanda();
  if(state.loaded&&mode!=="login") checaConquistas();
  if(fid){ const el=document.getElementById(fid); if(el){ el.focus({preventScroll:true}); if(sel&&el.setSelectionRange){ try{el.setSelectionRange(sel[0],sel[1])}catch(e){} } } }
  /* centraliza o mês escolhido na barra só na horizontal, sem mexer na rolagem da página */
  const on=document.querySelector(".chip.on"), barra=on&&on.parentElement; if(barra&&!fid){ barra.scrollLeft=Math.max(0,on.offsetLeft-barra.offsetLeft-(barra.clientWidth-on.clientWidth)/2); }
  if(Math.abs(window.scrollY-rolY)>1) window.scrollTo(0,rolY);
  if(state.loaded&&mode!=="login"&&!precisaTermos()){ setTimeout(()=>verificaLembretes(false),500); trataAtalho(); talvezTutorial(); }
  /* valores muito grandes diminuem de tamanho até caber, sem cortar o número */
  encolheValores(document.getElementById("app"));
  if(novaVista&&state.loaded&&mode!=="login") animaEntrada(app,novaTela);
  festejaPago(app);
  ajustaAcessivel(app,novaTela,novaVista);
  ligaApresentacao();
  moveIndicadorNav(app);
  deslizaMes(app); deslizaTema(app);
  if(ui.rolarPara&&state.loaded){ const _id=ui.rolarPara, _e=document.getElementById(_id), _s=_e&&_e.closest(".mais:not(.aberta)"); if(_s){ ui.abre[_s.id.slice(4)]=true; ui.rolarPara=null; render(); ui.rolarPara=null; setTimeout(()=>{ const e2=document.getElementById(_id); e2&&e2.scrollIntoView({block:"center",behavior:"smooth"}); },60); } const el=document.getElementById(ui.rolarPara||"__nada"); if(el){ ui.rolarPara=null; setTimeout(()=>el.scrollIntoView({block:"center",behavior:"smooth"}),60); } }
}
/* ---------- acessibilidade: nome da tela, avisos falados e regiões ---------- */
const nomeAba=()=>mode==="login"?"Entrar no Monetra":({mes:"Início",ano:"Relatórios",metas:"Metas e desafios",perfil:"Perfil",ajustes:"Ajustes"})[ui.tab]||"Monetra";
/** fala uma frase para o leitor de tela, sem mudar nada na tela */
function anunciar(msg){ let r=document.getElementById("aviso-sr"); if(!r){ r=document.createElement("div"); r.id="aviso-sr"; r.className="sr"; r.setAttribute("aria-live","polite"); r.setAttribute("aria-atomic","true"); document.body.appendChild(r); }
  const el=r; el.textContent=""; setTimeout(()=>{ el.textContent=msg; },60); }
/** depois de cada desenho: rolagens laterais alcançáveis pelo teclado e janela aberta isolando o fundo */
function ajustaAcessivel(raiz,novaTela,novaVista){
  raiz.querySelectorAll(".tablewrap").forEach(w=>{ const c=w.closest(".card"), h=c&&c.querySelector("h2"); w.setAttribute("tabindex","0"); w.setAttribute("role","region"); w.setAttribute("aria-label",(h?h.textContent.trim():"Tabela")+" (role para os lados para ver tudo)"); });
  if(novaVista&&state.loaded&&mode!=="login"){ const c=ui.tab==="mes"?calc(ui.month):null;
    anunciar(novaTela?nomeAba()+(c?". "+nomeMes(ui.month)+", saldo de "+brl(c.saldo):""):(c?nomeMes(ui.month)+", saldo de "+brl(c.saldo):"")); }
}
/* ---------- movimento: valores contam até o número, barras enchem e gráficos se desenham ----------
   Roda só quando a tela muda. Quem desativou animações no aparelho vê tudo pronto, sem movimento. */
let ultimaVista="", timerAnima=0, timerStory=0;
/* ---------- acessibilidade: preferências deste aparelho ---------- */
/** @typedef {{texto:number,contraste:boolean,daltonismo:boolean,semMov:boolean,calmo:boolean,dislexia:boolean,alvos:boolean,sublinhar:boolean}} A11y */
/** @type {A11y} */
const a11y=(()=>{ const pad={texto:1,contraste:false,daltonismo:false,semMov:false,calmo:false,dislexia:false,alvos:false,sublinhar:false};
  try{ const x=JSON.parse(localStorage.getItem("mb.a11y")||"{}"); if(x&&typeof x==="object"){ for(const k in pad){ if(typeof x[k]===typeof pad[k]) pad[k]=x[k]; } } }catch(e){}
  if(![1,1.15,1.3,1.5].includes(pad.texto)) pad.texto=1; return pad; })();
function aplicaA11y(){ const r=document.documentElement;
  r.style.setProperty("--escala",String(a11y.texto));
  [["contraste","a11y-contraste"],["daltonismo","a11y-dalt"],["semMov","a11y-semmov"],["calmo","a11y-calmo"],["dislexia","a11y-dislexia"],["alvos","a11y-alvos"],["sublinhar","a11y-sublinhar"]].forEach(([k,c])=>r.classList.toggle(c,!!a11y[k]));
  r.classList.toggle("a11y-texto",a11y.texto!==1);
  if(a11y.dislexia&&!document.getElementById("fonte-dislexia")){ const l=document.createElement("link"); l.id="fonte-dislexia"; l.rel="stylesheet"; l.href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap"; document.head.appendChild(l); } }
function salvaA11y(){ try{ localStorage.setItem("mb.a11y",JSON.stringify(a11y)); }catch(e){} aplicaA11y(); }
aplicaA11y();
const semMovimento=()=>{ if(a11y.semMov||a11y.calmo) return true; try{ return matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){ return false; } };
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
    ${sw("sublinhar","Sublinhar links","Links e botões de texto sempre sublinhados.")}
    </div></div>`;
}
/** @param {HTMLElement} raiz @param {boolean} cascata */
function animaEntrada(raiz,cascata){
  if(semMovimento()) return;
  /* barras de cada quadro enchem uma depois da outra */
  const porCard=new Map();
  raiz.querySelectorAll(".track > *").forEach(el=>{ const c=el.closest(".card,.meta,.desafio,.viagemcard")||raiz, n=porCard.get(c)||0; porCard.set(c,n+1); el.style.setProperty("--i",String(Math.min(n,10))); });
  raiz.querySelectorAll(".hs-graf path[fill='none']").forEach(p=>p.setAttribute("pathLength","1"));
  /* na abertura, espera a tela do logo sair para o movimento não acontecer escondido atrás dela */
  const boot=document.getElementById("boot"), atraso=boot?Math.max(0,BOOT_MIN-performance.now())+250:0;
  raiz.style.setProperty("--atraso",atraso+"ms");
  /* quadros entram em cascata na abertura e ao trocar de aba (ao trocar de mês, só os números e barras) */
  raiz.classList.toggle("cascata",cascata);
  if(cascata){ let n=0; raiz.querySelectorAll(".saud, .months, .note, .heroSaldo, .qa, .faixa, .tiles > .tile, .pagetitle, .card").forEach(el=>{ if(el.parentElement&&el.parentElement.closest(".card")) return; el.style.setProperty("--c",String(Math.min(n++,12))); el.classList.add("entra"); }); }
  void raiz.offsetWidth; raiz.classList.add("anima");
  clearTimeout(timerAnima); timerAnima=setTimeout(()=>raiz.classList.remove("anima","cascata"),1900+atraso);
  contaValores(raiz,atraso);
}
/* ao marcar uma conta como paga: check que se desenha e um confete de barrinhas (sobrevive ao render) */
let celebra="";
document.addEventListener("click",e=>{ const t=/** @type {Element} */(e.target), b=t&&t.closest&&t.closest("button.check"); if(!b||b.classList.contains("on")||b.disabled||semMovimento()) return;
  const at=[...b.attributes].filter(a=>a.name.startsWith("data-")).map(a=>`[${a.name}="${CSS.escape(a.value)}"]`).join(""); celebra=at?"button.check"+at:""; setTimeout(()=>{ celebra=""; },1200); },true);
/** @param {HTMLElement} raiz */
function festejaPago(raiz){ if(!celebra) return; const sel=celebra; celebra=""; let b; try{ b=raiz.querySelector(sel)||document.querySelector(sel); }catch(e){ return; } if(!b||!b.classList.contains("on")) return;
  const p=b.querySelector("path"); if(p) p.setAttribute("pathLength","1");
  b.classList.remove("pop"); void b.getBoundingClientRect(); b.classList.add("pop");
  const fx=document.createElement("span"); fx.className="confete"; fx.setAttribute("aria-hidden","true");
  for(let i=0;i<12;i++){ const a=i/12*Math.PI*2+Math.random()*.4, d=22+Math.random()*16, q=document.createElement("i"); q.style.setProperty("--dx",(Math.cos(a)*d).toFixed(1)+"px"); q.style.setProperty("--dy",(Math.sin(a)*d).toFixed(1)+"px"); q.style.setProperty("--r",Math.round(Math.random()*360)+"deg"); q.style.height=(5+Math.random()*6).toFixed(1)+"px"; q.className="c"+(i%3); fx.appendChild(q); }
  b.appendChild(fx); setTimeout(()=>{ fx.remove(); b.classList.remove("pop"); },900); }
/* barra de meses: um destaque desliza do mês anterior até o mês escolhido */
let mesAnterior="";
/** @param {HTMLElement} raiz */
function deslizaMes(raiz){ const prev=mesAnterior; mesAnterior=ui.tab==="mes"?ui.month:""; if(!prev||prev===ui.month||ui.tab!=="mes"||semMovimento()) return;
  const box=/** @type {HTMLElement|null} */(raiz.querySelector(".months .chips")); if(!box) return;
  const de=/** @type {HTMLElement|null} */(box.querySelector(`[data-month="${prev}"]`)), para=/** @type {HTMLElement|null} */(box.querySelector(".chip.on")); if(!de||!para) return;
  const r=(el)=>({x:el.offsetLeft,y:el.offsetTop,w:el.offsetWidth,h:el.offsetHeight}), a=r(de), b=r(para);
  const ind=document.createElement("i"); ind.className="chipind"; ind.setAttribute("aria-hidden","true");
  Object.assign(ind.style,{left:a.x+"px",top:a.y+"px",width:a.w+"px",height:a.h+"px"}); box.appendChild(ind); box.classList.add("deslizando");
  requestAnimationFrame(()=>requestAnimationFrame(()=>Object.assign(ind.style,{left:b.x+"px",top:b.y+"px",width:b.w+"px",height:b.h+"px"})));
  setTimeout(()=>{ box.classList.remove("deslizando"); ind.remove(); },430); }
/* tema no Perfil: o destaque desliza até a opção escolhida */
let temaPos=-1;
/** @param {HTMLElement} raiz */
function deslizaTema(raiz){ const seg=/** @type {HTMLElement|null} */(raiz.querySelector('.seg[aria-label="Tema"]')); if(!seg){ temaPos=-1; return; }
  const ins=[...seg.querySelectorAll("input")], p=ins.findIndex(i=>/** @type {HTMLInputElement} */(i).checked); if(p<0) return;
  seg.classList.add("segdesliza"); const poe=i=>seg.style.setProperty("--pos",String(i));
  if(temaPos<0||temaPos===p||semMovimento()){ poe(p); temaPos=p; return; }
  seg.style.setProperty("--trans","none"); poe(temaPos); void seg.offsetWidth; seg.style.removeProperty("--trans"); requestAnimationFrame(()=>poe(p)); temaPos=p; }
/* barra inferior: indicador que desliza até a aba aberta (parte da posição anterior) */
let navPos=-1;
/** @param {HTMLElement} raiz */
function moveIndicadorNav(raiz){ const ind=/** @type {HTMLElement|null} */(raiz.querySelector(".bottomnav .navind")); if(!ind) return;
  const ord=["mes","ano","","metas","perfil"], p=ord.indexOf(ui.tab); if(p<0){ ind.style.opacity="0"; return; }
  const poe=i=>ind.style.setProperty("--pos",String(i));
  if(navPos<0||navPos===p||semMovimento()){ poe(p); navPos=p; return; }
  ind.style.transition="none"; poe(navPos); void ind.offsetWidth; ind.style.transition=""; requestAnimationFrame(()=>poe(p)); navPos=p; }
/* janelas (lançamento, edição…): arrastar para baixo pelo topo fecha, no celular */
/** @type {{sh:HTMLElement,y0:number,t0:number,dy:number,id:number}|null} */
let arrasto=null;
document.addEventListener("pointerdown",e=>{ const t=e.target; if(!(t instanceof Element)||innerWidth>760) return; const sh=/** @type {HTMLElement|null} */(t.closest("#sheet .sheet"));
  if(!sh||sh.closest(".stories")||!t.closest(".sheethead")||t.closest("button,input,select,textarea,a,label")) return;
  arrasto={sh,y0:e.clientY,t0:performance.now(),dy:0,id:e.pointerId}; sh.style.transition="none"; });
document.addEventListener("pointermove",e=>{ if(!arrasto||e.pointerId!==arrasto.id) return; const dy=Math.max(0,e.clientY-arrasto.y0); arrasto.dy=dy;
  arrasto.sh.style.transform=`translateY(${dy}px)`; const w=arrasto.sh.parentElement; if(w) w.style.backgroundColor=`rgba(8,14,11,${Math.max(0,.5-dy/700).toFixed(3)})`; },{passive:true});
/** @param {PointerEvent} e */
const soltaArrasto=e=>{ if(!arrasto||e.pointerId!==arrasto.id) return; const a=arrasto; arrasto=null; const v=a.dy/Math.max(1,performance.now()-a.t0);
  a.sh.style.transition="transform .22s ease";
  if(a.dy>110||(a.dy>40&&v>0.6)){ a.sh.style.transform="translateY(110%)"; setTimeout(()=>{ if(ui.sheet) closeSheet(); },200); }
  else { a.sh.style.transform=""; const w=a.sh.parentElement; if(w) w.style.backgroundColor=""; } };
document.addEventListener("pointerup",soltaArrasto); document.addEventListener("pointercancel",soltaArrasto);
/* conta de zero até o valor nos números grandes; no fim volta exatamente o texto original */
/** @param {HTMLElement} raiz @param {number} atraso */
function contaValores(raiz,atraso){
  const alvos=[...raiz.querySelectorAll(".hs-val, .hs-mini b, .tile .val, .fb-v")].map(el=>{
    const h=el.innerHTML;
    if(el.dataset.v!==undefined){ const v=Number(el.dataset.v); return v?{el,h,v,rico:true}:null; }
    if(el.children.length) return null; const t=el.textContent, m=t.match(/R\$\s*([\d.]+,\d{2})/); if(!m) return null;
    const v=parseFloat(m[1].replace(/\./g,"").replace(",","."))*(/^\s*-/.test(t)?-1:1); return v?{el,h,v,rico:false}:null; }).filter(Boolean);
  if(!alvos.length) return;
  const ini=performance.now()+(atraso||0), dur=750, ease=x=>1-Math.pow(1-x,4);
  const passo=agora=>{ const p=Math.max(0,Math.min(1,(agora-ini)/dur)), k=ease(p);
    alvos.forEach(a=>{ if(!a.el.isConnected) return; if(p>=1) a.el.innerHTML=a.h; else if(a.rico) a.el.innerHTML=valorGrande(a.v*k); else a.el.textContent=brl(a.v*k); });
    if(p<1) requestAnimationFrame(passo); };
  alvos.forEach(a=>{ if(a.rico) a.el.innerHTML=valorGrande(0); else a.el.textContent=brl(0); }); requestAnimationFrame(passo);
}
/* valores muito grandes diminuem de tamanho até caber, sem cortar o número */
function encolheValores(raiz){ if(!raiz) return; raiz.querySelectorAll(".tile .val, .hs-val, .assintot b, .rpar b, .vgnums b").forEach(el=>{ el.style.fontSize=""; let f=parseFloat(getComputedStyle(el).fontSize), n=0; while(el.scrollWidth>el.clientWidth+1&&f>12&&n<20){ f-=1; n++; el.style.fontSize=f+"px"; } }); }
function header(){
  const t=(id,l)=>`<button role="tab" data-tab="${id}" aria-selected="${ui.tab===id}">${l}</button>`;
  const logado=mode!=="login"&&!precisaTermos();
  return `<div class="top"><div class="brand"><img class="logo" src="icons/marca.png" alt="" width="34" height="27"><h1>Monetra</h1><button type="button" class="status ${statusCls}" id="status" data-status="1" title="${esc(statusTxt)}"><i></i><span class="stt">${esc(statusTxt)}</span></button></div>
  <div class="topright">${logado?`<div class="tabs" role="tablist">${t("mes","Início")}${t("ano","Relatórios")}${t("metas","Metas")}${t("ajustes","Ajustes")}</div>`:botaoTema()}
  ${logado&&state.loaded?`<button type="button" class="iconbtn" data-busca="1" aria-label="Buscar lançamentos" title="Buscar (tecla /)">${ICON.busca}</button>`:""}
  ${logado&&state.loaded?botaoSino():""}
  ${logado&&state.loaded?`<button type="button" class="avatarbtn ${ui.tab==="perfil"?"on":""}" data-tab="perfil" aria-label="Abrir meu perfil" title="Meu perfil">${avatar(36)}</button>`:""}</div></div>
  ${logado&&mode==="cloud"?seletorEspaco():""}
  ${ui.tab==="mes"&&logado&&state.loaded?`<div class="saud"><small>${(()=>{ const h=new Date().getHours(); return h<12?"Bom dia,":h<18?"Boa tarde,":"Boa noite,"; })()}</small><h2>${esc(authUser?primeiroNome(meuNome()):"bem-vindo")} <span class="mbars mini" aria-hidden="true"><i></i><i></i><i></i></span></h2></div>`:""}
  ${ui.tab==="mes"&&logado?`<div class="months">
  <div class="chips">${chipsMes().map(k=>`<button class="chip ${k===ui.month?"on":""} ${k===todayKey?"now":""}" data-month="${k}" aria-label="${esc(nomeMes(k))}${k===ui.month?" (aberto)":""}">${ABR[kM(k)-1]} <small>${String(kY(k)).slice(2)}</small></button>`).join("")}</div>
  <button type="button" class="mescal" data-mescal="1" aria-label="Escolher outro mês" title="Todos os meses">${ICON.mes}</button></div>`:""}
  ${mode==="local"&&state.loaded?`<div class="note">Modo local: sem conexão com o login, os dados ficam só neste aparelho.</div>`:""}`;
}
function avatar(px){
  const nome=(authUser&&(authUser.displayName||authUser.email))||"";
  if(authUser&&authUser.photoURL) return `<img class="avatar" src="${esc(authUser.photoURL)}" alt="" width="${px}" height="${px}" referrerpolicy="no-referrer">`;
  const ini=nome?nome.trim().split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase():"";
  return `<span class="avatar" style="width:${px}px;height:${px}px">${ini?esc(ini):ICON.perfil}</span>`;
}
/* faixa do topo: termina um pouco abaixo do saldo (Início) ou do cabeçalho (outras abas) */
function posicionaBanda(){ const app=document.getElementById("app"), band=app&&app.querySelector(".band"); if(!band) return;
  const y=el=>el.getBoundingClientRect().bottom+window.scrollY;
  const hero=app.querySelector(".heroSaldo"), fim=hero?y(hero)+42:Math.max(...[".top",".espacos",".months",".note",".pagetitle"].map(q=>app.querySelector("#topo > "+q+", #conteudo > "+q)).filter(el=>el&&el.offsetHeight>0).map(y),0)+(app.querySelector(".pagetitle")?14:4);
  band.style.height=Math.max(120,Math.round(fim))+"px"; document.body.classList.toggle("combanda",!!hero); }
window.addEventListener("resize",()=>{ try{ posicionaBanda(); }catch(e){} });
function bottomNav(){
  if(mode==="login"||!state.loaded||precisaTermos()) return "";
  const np=pendencias().length;
  const ICN={mes:ICON.inicio,ano:ICON.relat,metas:ICON.metas,perfil:ICON.perfil};
  const b=(id,l)=>`<button type="button" data-tab="${id}" class="${ui.tab===id?"on":""}" aria-current="${ui.tab===id?"page":"false"}">${ICN[id]}${id==="mes"&&np?`<i class="badge">${np}</i>`:""}<span>${l}</span></button>`;
  return `<nav class="bottomnav" aria-label="Navegação"><i class="navind" aria-hidden="true"></i>${b("mes","Início")}${b("ano","Relatórios")}<span class="navfab"><button class="fab" type="button" data-novo="gasto" aria-label="Novo lançamento">${ICON.mais}</button></span>${b("metas","Metas")}${b("perfil","Perfil")}</nav>`;
}
/* ---------- página de apresentação (só no site, antes do login; no app instalado vai direto ao login) ---------- */
const appInstalado=()=>{ try{ return matchMedia("(display-mode: standalone)").matches||matchMedia("(display-mode: fullscreen)").matches||/** @type {any} */(navigator).standalone===true||document.referrer.startsWith("android-app://"); }catch(e){ return false; } };
const mostraApresentacao=()=>!ui.verLogin&&!appInstalado();
const logoM=(px,id)=>`<svg class="logom" viewBox="90 120 340 270" width="${px}" height="${Math.round(px*.8)}" aria-hidden="true"><defs><linearGradient id="${id}W" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--lgw1,#fff)"/><stop offset="1" stop-color="var(--lgw2,#C9D2CD)"/></linearGradient><linearGradient id="${id}G" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2BE08A"/><stop offset="1" stop-color="#0BA86A"/></linearGradient></defs><path class="l1" d="M100 135 L292 268 L257 302 L158 232 L158 378 L100 342 Z" fill="url(#${id}W)"/><path class="l2" d="M257 250 L413 135 L413 190 L292 272 Z" fill="url(#${id}G)"/><path class="l3" d="M358 222 L413 190 L413 345 L358 378 Z" fill="url(#${id}G)"/><rect class="r1" x="195" y="352" width="32" height="24" rx="2" fill="url(#${id}G)"/><rect class="r2" x="245" y="325" width="32" height="51" rx="2" fill="url(#${id}G)"/><rect class="r3" x="295" y="293" width="32" height="83" rx="2" fill="url(#${id}G)"/></svg>`;
function viewApresentacao(){
  const inApp=/FBAN|FBAV|FB_IAB|Instagram|Line\/|LinkedInApp|TikTok|musical_ly|Snapchat|Twitter/i.test(navigator.userAgent);
  const entrarBtn=`<button class="ap-btn pri" type="button" ${inApp?'data-apres="entrar"':'data-login="1"'}>Entrar com Google <span aria-hidden="true">→</span></button>`;
  /* título: a palavra "dinheiro" leva o degradê verde-azulado; a pontuação fica fora do efeito */
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
        <div class="ap-acoes">${entrarBtn}<button class="ap-btn sec" type="button" data-apres="criar">Criar conta grátis</button></div>
        <ul class="ap-checks"><li>Sem anúncios</li><li>Seus dados só seus</li><li>Funciona sem internet</li></ul>
        <p class="ap-termos">Ao entrar, você lê e decide se aceita os <button class="link" type="button" data-termos="ler">termos de privacidade</button>.</p>
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
  <section class="ap-fim ap-revela"><div class="ap-aurora fraca" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="ap-logo">${logoM(84,"lmf")}</div><h2>Comece pelo mês de hoje</h2><p>Abra no navegador ou instale no Android. Leva um minuto.</p>
    <div class="ap-acoes centro">${entrarBtn}<button class="ap-btn sec" type="button" data-apres="entrar">Já tenho conta</button></div></section>
  <footer class="ap-rod"><span>${logoM(22,"lmr")}<b>Monetra</b></span><span>Feito por Gustavo Martins Barbosa</span></footer>
  </div>`;
}
/* apresentação: parallax do celular (sem invadir a seção de baixo), números que contam e seções que aparecem ao rolar */
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
function viewLogin(){
  const novo=ui.loginModo==="criar";
  return `<div class="login card">
  <div class="loginmarca"><img src="icons/logo-128.png" alt="" width="56" height="56"><span><b>Monetra</b><small>Controle financeiro</small></span></div>
  <div class="seg" role="radiogroup" aria-label="Entrar ou criar conta" style="width:100%"><input type="radio" name="lmodo" id="lmE" value="entrar" ${novo?"":"checked"}><label for="lmE">Entrar</label><input type="radio" name="lmodo" id="lmC" value="criar" ${novo?"checked":""}><label for="lmC">Criar conta</label></div>
  <h2>${novo?"Crie sua conta grátis":"Seu controle de gastos, só seu"}</h2>
  <p>${novo?"Use sua conta Google: não precisa inventar senha nem preencher cadastro. Sua página começa vazia e só você vê os seus lançamentos.":"Entre com a conta Google que você usou para criar sua conta. Cada pessoa tem a própria página: ninguém vê os lançamentos de outra pessoa."}</p>
  <button class="btn google" data-login="1" type="button"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>${novo?"Criar conta com Google":"Entrar com Google"}</button>
  ${/FBAN|FBAV|FB_IAB|Instagram|Line\/|LinkedInApp|TikTok|musical_ly|Snapchat|Twitter/i.test(navigator.userAgent)?`<div class="note">Você abriu o link dentro de outro app (Instagram, Facebook…), e o Google não permite entrar por aqui. Toque nos <b>três pontinhos</b> e escolha <b>Abrir no navegador</b> (Chrome ou Safari).<br><button class="link" type="button" data-copialink="1">Copiar link</button></div>`:""}
  ${loginErro?`<p class="note">${esc(loginErro)}</p>`:""}
  <p class="hint">${novo?"Já tem conta? Clique em Entrar.":"Primeira vez aqui? Clique em Criar conta."} Seus dados ficam salvos na nuvem e aparecem em qualquer aparelho onde você entrar.</p>
  <p class="hint">Ao entrar, você vai ler e decidir se aceita os <button class="link" type="button" data-termos="ler">termos de privacidade</button>.</p></div>`;
}

/* ---------- gráfico de rosca ---------- */
function donut(itens,total,centro,sub){
  let acc=0;
  const arcs=total>0?itens.filter(x=>x.v>0).map(x=>{ const p=x.v/total*100; const s=`<circle r="15.915" cx="21" cy="21" fill="none" stroke="${x.cor}" stroke-width="5.2" stroke-dasharray="${p.toFixed(3)} ${(100-p).toFixed(3)}" stroke-dashoffset="${(25-acc).toFixed(3)}"><title>${esc(x.nome)}: ${brl(x.v)}</title></circle>`; acc+=p; return s; }).join(""):"";
  /* nome das 3 maiores fatias direto no gráfico (só as que têm pelo menos 6%) */
  let a2=0; const marcas=[]; if(total>0) itens.filter(x=>x.v>0).forEach(x=>{ const p=x.v/total*100; marcas.push({x,p,m:a2+p/2}); a2+=p; });
  const top=marcas.slice().sort((a,b)=>b.p-a.p).slice(0,3).filter(z=>z.p>=6);
  const rot=top.map(z=>{ const ang=z.m/100*2*Math.PI, R=52; return `<span class="dlab" style="left:${(50+Math.sin(ang)*R).toFixed(1)}%;top:${(50-Math.cos(ang)*R).toFixed(1)}%;--dot:${z.x.cor}" aria-hidden="true">${esc((w=>w.length>11?w.slice(0,10)+"…":w)(String(z.x.nome).split(/[\s/]+/)[0]))} ${Math.round(z.p)}%</span>`; }).join("");
  return `<div class="donutbox"><svg viewBox="0 0 42 42" class="donut" role="img" aria-label="${esc("Gráfico de rosca, total "+centro+(top.length?": "+marcas.slice().sort((a,b)=>b.p-a.p).slice(0,5).map(z=>z.x.nome+" "+Math.round(z.p)+"%").join(", "):""))}"><circle r="15.915" cx="21" cy="21" fill="none" stroke="var(--sunk)" stroke-width="5.2"/>${arcs}
  <text x="21" y="20.2" text-anchor="middle" class="d1">${esc(centro)}</text><text x="21" y="25" text-anchor="middle" class="d2">${esc(sub)}</text></svg>${rot}</div>`;
}

/* ---------- aba Mês ---------- */
/* ---------- conquistas e desafios ---------- */
const isoDe=(k,d)=>k+"-"+pad2(Math.min(diasMes(k),Math.max(1,Number(d)||1)));
const somaDias=(iso,n)=>{ const [y,m,d]=iso.split("-").map(Number), t=new Date(y,m-1,d+n); return keyOf(t.getFullYear(),t.getMonth()+1)+"-"+pad2(t.getDate()); };
const entreDias=(a,b)=>{ const f=x=>{ const [y,m,d]=x.split("-").map(Number); return Date.UTC(y,m-1,d); }; return Math.round((f(b)-f(a))/864e5); };
const fmtIso=x=>x.slice(8,10)+"/"+x.slice(5,7);
function todosGastos(){ const out=[]; Object.keys(state.months).forEach(k=>{ if(!/^\d{4}-\d{2}$/.test(k)) return; ((state.months[k]||{}).gastos||[]).forEach(g=>out.push({g,k,data:isoDe(k,g.dia)})); }); return out; }
const palavrasDes=d=>String(d.palavras||"").split(/[,;]+/).map(x=>semAcento(x).trim()).filter(x=>x.length>=2);
function casaDesafio(d,g){ const ps=palavrasDes(d), desc=semAcento(g.desc); return (!!d.cat&&g.cat===d.cat)||(ps.length>0&&ps.some(p=>desc.includes(p))); }
function estadoDesafio(d,gs){
  gs=gs||todosGastos(); const fim=somaDias(d.inicio,d.dias-1), hj=hojeISO();
  const dentro=gs.filter(x=>x.data>=d.inicio&&x.data<=fim&&casaDesafio(d,x.g)).sort((a,b)=>a.data<b.data?-1:1);
  const total=Math.round(soma(dentro.map(x=>x.g))*100)/100;
  const feitos=hj<d.inicio?0:Math.min(d.dias,entreDias(d.inicio,hj)+1);
  if(d.tipo==="sem"){ if(dentro.length&&dentro[0].data<=hj) return {st:"quebrou",quando:dentro[0].data,total,feitos:Math.max(0,entreDias(d.inicio,dentro[0].data)),fim,pct:Math.max(0,entreDias(d.inicio,dentro[0].data))/d.dias};
    return hj>fim?{st:"ok",total,feitos:d.dias,fim,pct:1}:{st:hj<d.inicio?"espera":"andando",total,feitos,fim,pct:feitos/d.dias}; }
  if(total>d.valor){ let acc=0, quando=null; for(const x of dentro){ acc+=Number(x.g.valor)||0; if(acc>d.valor){ quando=x.data; break; } } return {st:"quebrou",quando,total,feitos,fim,pct:Math.min(1,total/(d.valor||1))}; }
  return hj>fim?{st:"ok",total,feitos:d.dias,fim,pct:1}:{st:hj<d.inicio?"espera":"andando",total,feitos,fim,pct:d.valor?total/d.valor:0,resta:d.valor-total};
}
function textoDesafio(d,e){
  if(e.st==="ok") return d.tipo==="sem"?"Concluído! "+d.dias+" dias sem gastar com isso.":"Concluído! Gastou "+brl(e.total)+" de "+brl(d.valor)+".";
  if(e.st==="quebrou") return d.tipo==="sem"?"Não deu desta vez: gasto em "+fmtIso(e.quando)+", depois de "+e.feitos+" dia"+(e.feitos===1?"":"s")+".":"Passou do limite em "+fmtIso(e.quando)+": "+brl(e.total)+" de "+brl(d.valor)+".";
  if(e.st==="espera") return "Começa em "+fmtIso(d.inicio)+".";
  return d.tipo==="sem"?"Dia "+e.feitos+" de "+d.dias+" · termina em "+fmtIso(e.fim):"Gastou "+brl(e.total)+" de "+brl(d.valor)+" · dia "+e.feitos+" de "+d.dias;
}
function sequencias(gs){
  const dias=new Set(gs.map(x=>x.data)), hj=hojeISO();
  let atual=0, d=dias.has(hj)?hj:somaDias(hj,-1); while(dias.has(d)){ atual++; d=somaDias(d,-1); }
  let melhor=0; const ord=[...dias].filter(x=>x<=hj).sort(); let run=0, ant=null; ord.forEach(x=>{ run=ant&&entreDias(ant,x)===1?run+1:1; ant=x; if(run>melhor) melhor=run; });
  const fechados=MESES.filter(k=>k<todayKey&&ativo(k)&&(calc(k).receitas>0||calc(k).despesas>0));
  let azulAtual=0; for(let i=fechados.length-1;i>=0;i--){ if(calc(fechados[i]).saldo>=0&&(i===fechados.length-1||entre(fechados[i],fechados[i+1])===1)) azulAtual++; else break; }
  let azulMelhor=0, r=0; fechados.forEach((k,i)=>{ r=calc(k).saldo>=0?(i&&entre(fechados[i-1],k)===1?r+1:1):0; if(r>azulMelhor) azulMelhor=r; });
  return {atual,melhor,azulAtual,azulMelhor,fechados};
}
const ICQ={"seta-baixo":'<path d="M12 5v14M6 13l6 6 6-6"/>',"seta-cima":'<path d="M12 19V5M6 11l6-6 6 6"/>',troca:'<path d="M7 7h12l-3-3M17 17H5l3 3"/>',repete:'<path d="M17 4l3 3-3 3"/><path d="M4 12V9a2 2 0 0 1 2-2h14M7 20l-3-3 3-3"/><path d="M20 12v3a2 2 0 0 1-2 2H4"/>',tendencia:'<path d="M4 17l5-5 4 3 7-8"/><path d="M15 7h5v5"/>',engrenagem:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',chev:'<path d="m9 6 6 6-6 6"/>',broto:'<path d="M12 20v-8"/><path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6zM12 14c0-3-2.5-5-6-5 0 3 2.5 5 6 5z"/>',chama:'<path d="M12 21c-4 0-6.5-2.6-6.5-6 0-4 4-6 4.5-10 2.5 1.5 4 4 4 6 1-1 1.5-2 1.5-3 2 1.5 3 4 3 7 0 3.4-2.5 6-6.5 6z"/>',medalha:'<circle cx="12" cy="14" r="5"/><path d="M9 9.5 7 3h4l1 3 1-3h4l-2 6.5"/>',coracao:'<path d="M12 20s-7-4.4-7-9.6A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.4c0 5.2-7 9.6-7 9.6z"/>',nuvem:'<path d="M7 18a4 4 0 0 1-.5-8 5.5 5.5 0 0 1 10.6 1.5A3.5 3.5 0 0 1 17 18z"/>',sol:'<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',trofeu:'<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6"/>',alvo:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8"/>',cofre:'<path d="M5 11a7 6 0 0 1 12.5-3.5L20 7v4l-1.5 1A7 6 0 0 1 15 17v2h-3v-1.5h-2V19H7v-2.3A6 6 0 0 1 5 11z"/>',bandeira:'<path d="M6 21V4M6 4h11l-2 4 2 4H6"/>',raio:'<path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12z"/>',estrela:'<path d="m12 4 2.4 5 5.4.7-4 3.7 1 5.4L12 16.3 7.2 18.8l1-5.4-4-3.7 5.4-.7z"/>'};
const icq=(k,px)=>`<svg viewBox="0 0 24 24" width="${px||22}" height="${px||22}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICQ[k]||ICQ.estrela}</svg>`;
const CONQ=[
  {id:"primeiro",ic:"broto",nome:"Primeiro passo",como:"Lance sua primeira despesa."},
  {id:"semana",ic:"chama",nome:"Semana firme",como:"Lance gastos 7 dias seguidos."},
  {id:"mesint",ic:"medalha",nome:"Mês inteiro",como:"Lance gastos 30 dias seguidos."},
  {id:"azul1",ic:"coracao",nome:"No azul",como:"Feche um mês com saldo positivo."},
  {id:"azul3",ic:"nuvem",nome:"Trimestre no azul",como:"Feche 3 meses seguidos no azul."},
  {id:"azul6",ic:"sol",nome:"Semestre no azul",como:"Feche 6 meses seguidos no azul."},
  {id:"azul12",ic:"trofeu",nome:"Ano no azul",como:"Feche 12 meses seguidos no azul."},
  {id:"limite",ic:"alvo",nome:"Dentro do limite",como:"Feche um mês com limites sem estourar nenhum."},
  {id:"poupa",ic:"cofre",nome:"Poupador",como:"Guarde na caixinha 3 meses seguidos."},
  {id:"meta",ic:"bandeira",nome:"Meta batida",como:"Complete uma meta de economia."},
  {id:"desafio",ic:"raio",nome:"Desafiante",como:"Conclua um desafio."},
  {id:"cem",ic:"estrela",nome:"Centena",como:"Chegue a 100 despesas lançadas."}
];
function conquistas(){
  const gs=todosGastos(), sq=sequencias(gs), got={};
  got.primeiro=gs.length>0; got.semana=sq.melhor>=7; got.mesint=sq.melhor>=30; got.cem=gs.length>=100;
  got.azul1=sq.azulMelhor>=1; got.azul3=sq.azulMelhor>=3; got.azul6=sq.azulMelhor>=6; got.azul12=sq.azulMelhor>=12;
  got.limite=sq.fechados.some(k=>{ const c=calc(k), cs=state.config.categorias.filter(ct=>ct.orcamento>0); return cs.length&&c.despesas>0&&cs.every(ct=>(c.porCat[ct.id]||0)<=limiteCat(ct,k)); });
  let r=0, mp=0; MESES.filter(k=>k<=todayKey).forEach(k=>{ r=calc(k).guardado>0?r+1:0; if(r>mp) mp=r; }); got.poupa=mp>=3;
  got.meta=state.config.metas.some(mt=>infoMeta(mt,null).feita);
  got.desafio=(state.config.desafios||[]).some(d=>estadoDesafio(d,gs).st==="ok");
  return {sq,got,gs};
}
const MODELOS_DES={delivery:{nome:"30 dias sem delivery",tipo:"sem",palavras:"ifood, delivery, rappi, aiqfome",dias:30},impulso:{nome:"Semana sem compras",tipo:"sem",icCat:"sacola",dias:7},mercado:{nome:"Mercado no limite",tipo:"max",icCat:"carrinho",dias:30,valor:600},lazer:{nome:"15 dias com lazer contado",tipo:"max",icCat:"taca",dias:15,valor:200}};
function viewMetas(){
  const cf=state.config, cx=caixinhaAte(todayKey);
  return `<div class="pagetitle"><h2>Metas e desafios</h2><p>Guardado na caixinha: <b>${brl(cx)}</b>${cf.metas.length?" · "+cf.metas.length+" meta"+(cf.metas.length===1?"":"s"):""}</p></div>
  <div class="grid"><div class="col">
    <div class="card"><div class="cardhead"><h2>Metas de economia</h2><span class="num muted">${state.config.metas.length||""}</span></div>
    ${state.config.metas.length?`<div class="metas">${state.config.metas.map(mt=>linhaMeta(mt,null,true)).join("")}</div>`:`<div class="vazio">${BARRINHAS}<b>Nenhuma meta ainda</b><p>Crie metas como "Viagem", "Reserva de emergência" ou "Celular novo", com valor e prazo. O app calcula quanto guardar por mês.</p></div>`}
    <button class="btn ghost" data-novo="meta" type="button">+ Nova meta</button></div>
  </div><div class="col">${cardConquistas()}</div></div>`;
}
function cardConquistas(){
  if(mode==="login"||!state.loaded) return "";
  const {sq,got,gs}=conquistas(), ds=(state.config.desafios||[]).map(d=>({d,e:estadoDesafio(d,gs)}));
  const ativos=ds.filter(x=>x.e.st==="andando"||x.e.st==="espera"), antigos=ds.filter(x=>x.e.st==="ok"||x.e.st==="quebrou").slice(-3).reverse();
  const nGot=CONQ.filter(c=>got[c.id]).length;
  const linhaD=({d,e})=>`<button type="button" class="desafio ${e.st}" data-edit="desafio" data-id="${esc(d.id)}"><div class="t"><b>${esc(d.nome)}</b><span>${e.st==="ok"?"✓":e.st==="quebrou"?"✕":Math.round(e.pct*100)+"%"}</span></div><div class="track ${e.st==="quebrou"?"over":d.tipo==="max"&&e.pct>=0.85?"warn":""}"><div style="width:${Math.min(100,Math.round(e.pct*100))}%"></div></div><small>${esc(textoDesafio(d,e))}</small></button>`;
  return `<div class="card conq"><div class="cardhead"><h2>Conquistas e desafios</h2><span class="num muted">${nGot} de ${CONQ.length}</span></div>
    <div class="streaks"><div><span class="lab">Sequência lançando</span><b><span class="sti">${icq("chama",18)}</span>${sq.atual} dia${sq.atual===1?"":"s"}</b><small>recorde: ${sq.melhor}</small></div><div><span class="lab">Meses no azul seguidos</span><b><span class="sti">${icq("coracao",18)}</span>${sq.azulAtual}</b><small>recorde: ${sq.azulMelhor}</small></div></div>
    <h3>Desafios</h3>
    ${ativos.length?ativos.map(linhaD).join(""):`<div class="vazio">${BARRINHAS}<b>Nenhum desafio ativo</b><p>Desafie você mesmo: "30 dias sem delivery", "semana sem compras" ou um limite para o mercado. O app acompanha sozinho pelos seus lançamentos.</p></div>`}
    ${antigos.length?`<details class="desant"><summary>Anteriores (${antigos.length})</summary>${antigos.map(linhaD).join("")}</details>`:""}
    <button type="button" class="btn ghost" data-novo="desafio">+ Novo desafio</button>
    <h3>Conquistas</h3>
    <div class="conqs">${CONQ.map(c=>`<div class="conqb ${got[c.id]?"on":""}" title="${esc(c.como)}"><span class="bi" aria-hidden="true">${icq(c.ic)}</span><b>${esc(c.nome)}</b><small>${got[c.id]?"conquistada":esc(c.como)}</small></div>`).join("")}</div></div>`;
}
/* avisa conquistas novas e desafios que terminaram (uma vez por aparelho) */
let _conqTimer=null;
function checaConquistas(){
  if(_conqTimer) clearTimeout(_conqTimer);
  _conqTimer=setTimeout(()=>{ _conqTimer=null; if(mode==="login"||!state.loaded||precisaTermos()) return;
    try{ const chave="mb.conq."+(uid||"local")+"."+(aberto||"p"); const raw=localStorage.getItem(chave), visto=raw?JSON.parse(raw):null;
      const {got,gs}=conquistas(), ds=(state.config.desafios||[]).map(d=>/** @type {[Desafio,string]} */([d,estadoDesafio(d,gs).st]));
      const agora={c:CONQ.filter(c=>got[c.id]).map(c=>c.id),d:Object.fromEntries(ds.map(([d,st])=>[d.id,st]))};
      if(visto){ const novas=CONQ.filter(c=>got[c.id]&&!(visto.c||[]).includes(c.id));
        const fins=ds.filter(([d,st])=>(st==="ok"||st==="quebrou")&&(visto.d||{})[d.id]!==st);
        if(novas.length) toast("Conquista desbloqueada: "+novas[0].nome+(novas.length>1?" (+"+(novas.length-1)+")":""));
        else if(fins.length){ const [d,st]=fins[0]; toast(st==="ok"?"Desafio concluído: "+d.nome:"Desafio “"+d.nome+"” não deu desta vez. Bora de novo?"); } }
      localStorage.setItem(chave,JSON.stringify(agora)); }catch(e){} },900);
}
/* ---------- resumo da semana (segunda a domingo) ---------- */
function domingoDe(iso){ const [y,m,d]=iso.split("-").map(Number), wd=new Date(y,m-1,d).getDay(); return somaDias(iso,wd===0?0:7-wd); }
const ultimoDomingo=()=>{ const hj=hojeISO(), [y,m,d]=hj.split("-").map(Number), wd=new Date(y,m-1,d).getDay(); return wd===0?hj:somaDias(hj,-wd); };
function resumoSemana(fim,gs){
  gs=gs||todosGastos(); const ini=somaDias(fim,-6), iniA=somaDias(fim,-13), fimA=somaDias(fim,-7);
  const sem=gs.filter(x=>x.data>=ini&&x.data<=fim), ant=gs.filter(x=>x.data>=iniA&&x.data<=fimA);
  const tot=soma(sem.map(x=>x.g)), totA=soma(ant.map(x=>x.g));
  const pc=(arr)=>{ const o={}; arr.forEach(x=>{ o[x.g.cat]=(o[x.g.cat]||0)+(Number(x.g.valor)||0); }); return o; };
  const cs=pc(sem), ca=pc(ant), cats=[...new Set(Object.keys(cs).concat(Object.keys(ca)))].map(id=>({id,v:cs[id]||0,a:ca[id]||0,d:(cs[id]||0)-(ca[id]||0)}));
  const subiu=cats.filter(x=>x.d>0.005).sort((a,b)=>b.d-a.d)[0]||null, top=cats.filter(x=>x.v>0).sort((a,b)=>b.v-a.v).slice(0,4);
  const dias=[...Array(7)].map((_,i)=>{ const d=somaDias(ini,i); return {d,v:soma(sem.filter(x=>x.data===d).map(x=>x.g))}; });
  const maior=sem.slice().sort((a,b)=>(Number(b.g.valor)||0)-(Number(a.g.valor)||0))[0]||null;
  return {ini,fim,tot,totA,n:sem.length,subiu,top,dias,maior,var:totA>0?(tot-totA)/totA:null};
}
function textoVarSemana(r){ if(r.var===null) return r.tot>0?"primeira semana com lançamentos para comparar":"nenhum gasto nas duas semanas"; if(Math.abs(r.var)<0.005) return "igual à semana anterior"; return (r.var>0?"▲ ":"▼ ")+Math.round(Math.abs(r.var)*100)+"% vs semana anterior ("+brl(r.totA)+")"; }
function corpoSemana(fim){
  const r=resumoSemana(fim), max=Math.max(1,...r.dias.map(x=>x.v)), podeAvancar=fim<ultimoDomingo();
  return `<div class="semnav"><button type="button" class="iconbtn" data-semnav="-7" aria-label="Semana anterior">‹</button><b>${fmtIso(r.ini)} a ${fmtIso(r.fim)}</b><button type="button" class="iconbtn" data-semnav="7" aria-label="Próxima semana" ${podeAvancar?"":"disabled"}>›</button></div>
    <div class="semtot"><span class="lab">Gastou na semana</span><b>${brl(r.tot)}</b><small class="${r.var>0.005?"neg":r.var<-0.005?"pos":""}">${esc(textoVarSemana(r))}</small></div>
    <div class="semdias" role="img" aria-label="Gasto por dia da semana">${r.dias.map((x,i)=>`<div class="sd ${x.d===hojeISO()?"hoje":""}"><span class="sv">${x.v?valCurto(x.v):""}</span><i style="height:${Math.round(x.v/max*100)}%"></i><span class="sl">${["S","T","Q","Q","S","S","D"][i]}</span></div>`).join("")}</div>
    ${r.subiu?`<div class="semdest">${icoCat(r.subiu.id,16)}<span><b>${esc(catName(r.subiu.id))}</b> foi o que mais subiu: ${brl(r.subiu.v)} (+${brl(r.subiu.d)} vs semana anterior)</span></div>`:""}
    ${r.top.length?`<h3>Onde mais gastou</h3>${r.top.map(x=>`<div class="semcat">${icoCat(x.id,15)}<span class="t">${esc(catName(x.id))}</span><span class="v">${brl(x.v)}</span><small>${x.a>0?(x.d>=0?"+":"−")+brl(Math.abs(x.d)):"novo"}</small></div>`).join("")}`:`<p class="hint">Nenhuma despesa lançada nesta semana.</p>`}
    ${r.maior?`<p class="hint">${r.n} lançamento${r.n===1?"":"s"} · maior: ${brl(r.maior.g.valor)}${r.maior.g.desc?" ("+esc(r.maior.g.desc)+")":" em "+esc(catName(r.maior.g.cat))} no dia ${fmtIso(r.maior.data)}</p>`:""}`;
}
/* aparece no sininho de domingo a terça, sobre a semana que terminou no domingo */
function avisoSemana(){
  if(mode==="login"||!state.loaded) return null;
  const hj=hojeISO(), [y,m,d]=hj.split("-").map(Number), wd=new Date(y,m-1,d).getDay(); if(!(wd===0||wd===1||wd===2)) return null;
  const r=resumoSemana(ultimoDomingo()); if(!(r.tot>0||r.totA>0)) return null; return r;
}
/* ---------- simulador de quitação de dívidas / financiamento ---------- */
function simulaQuitacao(saldo,taxa,pag){
  const r=taxa/100; let b=saldo, juros=0, m=0; const serie=[saldo];
  if(!(saldo>0)||!(pag>0)) return null;
  if(r>0&&pag<=Math.round(saldo*r*100)/100+0.004) return {nunca:true,jurosMes:Math.round(saldo*r*100)/100};
  while(b>0.5&&m<600){ const j=Math.round(b*r*100)/100; juros+=j; b=Math.round((b+j-pag)*100)/100; m++; serie.push(Math.max(0,b)); }
  const ultimo=Math.round((pag+Math.min(0,b))*100)/100;
  return {meses:m,juros:Math.round(juros*100)/100,total:Math.round((saldo+juros)*100)/100,ultimo,serie,longo:m>=600};
}
const saldoPorParcelas=(taxa,n,pmt)=>{ const r=taxa/100; return r>0?pmt*(1-Math.pow(1+r,-n))/r:pmt*n; };
const nMeses=m=>m+(m===1?" mês":" meses");
const fmtMeses=m=>m<12?nMeses(m):Math.floor(m/12)+" ano"+(m>=24?"s":"")+(m%12?" e "+nMeses(m%12):"");
const mesDaqui=m=>nomeMes(shiftKey(todayKey,m-1)).toLowerCase();
function graficoSim(a,b){
  const W=320,H=120, n=Math.max(a.serie.length,b?b.serie.length:0), mx=Math.max(...a.serie,1);
  const pts=sr=>sr.map((v,i)=>`${(i/(n-1||1)*W).toFixed(1)},${(H-v/mx*H).toFixed(1)}`).join(" ");
  return `<svg class="simgraf" viewBox="0 -4 ${W} ${H+8}" preserveAspectRatio="none" role="img" aria-label="Saldo devedor ao longo dos meses"><polyline class="ga" points="${pts(a.serie)}"/>${b?`<polyline class="gb" points="${pts(b.serie)}"/>`:""}</svg>
    <div class="simleg"><span><i class="la"></i>pagando só o atual</span>${b?`<span><i class="lb"></i>com o valor extra</span>`:""}</div>`;
}
function resultadoSim(){
  const v=id=>parseMoney((document.getElementById(id)||{}).value||""), num=id=>{ const t=String((document.getElementById(id)||{}).value||"").replace(",","."); return Number(t)||0; };
  let saldo=v("s-simsaldo"); const taxa=num("s-simtaxa"), pag=v("s-simpag"), extra=v("s-simextra")||0, nP=Math.round(num("s-simn"));
  if(!(saldo>0)&&nP>0&&pag>0){ saldo=Math.round(saldoPorParcelas(taxa,nP,pag)*100)/100; const sl=document.getElementById("s-simsaldoinfo"); if(sl) sl.textContent="Saldo estimado pelas parcelas: "+brl(saldo); }
  else { const sl=document.getElementById("s-simsaldoinfo"); if(sl) sl.textContent=""; }
  if(!(saldo>0)||!(pag>0)) return `<p class="hint">Preencha quanto deve, os juros ao mês e quanto paga por mês para ver em quanto tempo quita.</p>`;
  const a=simulaQuitacao(saldo,taxa,pag), b=extra>0?simulaQuitacao(saldo,taxa,pag+extra):null;
  if(a.nunca&&!(b&&!b.nunca)) return `<div class="simalerta">Com ${brl(pag)} por mês a dívida <b>nunca acaba</b>: só os juros do mês dão ${brl(a.jurosMes)}. Pague mais que isso para o saldo começar a cair.</div>`;
  const bloco=(t,x,cls)=>x.nunca?`<div class="simcol ${cls}"><span class="lab">${t}</span><b>Nunca quita</b><small>juros de ${brl(x.jurosMes)}/mês comem a parcela</small></div>`:`<div class="simcol ${cls}"><span class="lab">${t}</span><b>${fmtMeses(x.meses)}</b><small>quita em ${esc(mesDaqui(x.meses))}${x.longo?" (ou mais)":""}</small><small>juros: <b>${brl(x.juros)}</b> · total: ${brl(x.total)}</small></div>`;
  let eco="";
  if(b&&!b.nunca){ eco=a.nunca?`<div class="simeco">Com ${brl(extra)} a mais por mês, a dívida passa a ter fim: quita em <b>${fmtMeses(b.meses)}</b>.</div>`:`<div class="simeco">Pagando ${brl(extra)} a mais por mês você quita <b>${fmtMeses(a.meses-b.meses)} antes</b> e economiza <b>${brl(Math.max(0,a.juros-b.juros))}</b> de juros.</div>`; }
  return `<div class="simres">${bloco("Pagando "+brl(pag)+"/mês",a,"a")}${b?bloco("Com "+brl(pag+extra)+"/mês",b,"b"):""}</div>${eco}${a.nunca?"":graficoSim(a,b&&!b.nunca?b:null)}
    <p class="hint">Conta simples com juros compostos sobre o saldo, mês a mês (sem IOF, multas ou seguros). Use a taxa que aparece na fatura ou no contrato.</p>`;
}
function atualizaSim(){ const el=document.getElementById("s-simres"); if(el) el.innerHTML=resultadoSim(); }
/* ---------- calculadoras brasileiras (13º, férias, salário líquido, quanto guardar) ----------
   Tabelas de 2026 — ATUALIZE todo ano (INSS: Portaria do MPS; IR: Receita Federal / Lei 15.270/2025). */
const TAB={ano:2026,
  inss:[[1621.00,0.075],[2902.84,0.09],[4354.27,0.12],[8475.55,0.14]],
  ir:[[2428.80,0,0],[2826.65,0.075,182.16],[3751.05,0.15,394.16],[4664.68,0.225,675.49],[Infinity,0.275,908.73]],
  dep:189.59, simplificado:607.20, isento:5000, redLim:7350, redA:978.62, redB:0.133145 };
const c2=v=>Math.round(v*100)/100;
function inssDe(v){ let ant=0, t=0; for(const [teto,al] of TAB.inss){ if(v<=ant) break; t+=(Math.min(v,teto)-ant)*al; ant=teto; } return c2(t); }
function irDe(bruto,inss,deps){
  const base=Math.max(0,bruto-Math.max(inss+deps*TAB.dep,TAB.simplificado)), f=TAB.ir.find(x=>base<=x[0]);
  let imp=Math.max(0,base*f[1]-f[2]);
  if(bruto<=TAB.isento) imp=0; else if(bruto<=TAB.redLim) imp=Math.max(0,imp-(TAB.redA-TAB.redB*bruto));
  return {imp:c2(imp),base:c2(base),simpl:TAB.simplificado>inss+deps*TAB.dep};
}
function calcRes(tipo){
  const v=id=>parseMoney((document.getElementById(id)||{}).value||"")||0, n=id=>Number(String((document.getElementById(id)||{}).value||"").replace(",","."))||0;
  const L=(r,x,cls)=>`<div class="cl ${cls||""}"><span>${r}</span><b>${x}</b></div>`;
  const nota=`<p class="hint">Estimativa com as tabelas de ${TAB.ano} do INSS e do Imposto de Renda (com a isenção até R$ 5.000 e a redução até R$ 7.350). Pensão, plano de saúde e outros descontos da empresa não entram. Confira no holerite.</p>`;
  if(tipo==="liquido"){ const sal=v("s-csal"), deps=Math.max(0,Math.round(n("s-cdep"))), out=v("s-cout"); if(!(sal>0)) return `<p class="hint">Informe o salário bruto.</p>`;
    const i=inssDe(sal), r=irDe(sal,i,deps), liq=c2(sal-i-r.imp-out);
    return `<div class="calcbox">${L("Salário bruto",brl(sal))}${L("INSS","− "+brl(i))}${L("Imposto de Renda"+(r.simpl&&r.imp>0?" (desconto simplificado)":r.imp===0&&sal>TAB.ir[0][0]?" (isento até R$ 5.000)":""),"− "+brl(r.imp))}${out?L("Outros descontos","− "+brl(out)):""}${L("Salário líquido",brl(liq),"tot")}</div>${nota}`; }
  if(tipo==="decimo"){ const sal=v("s-csal"), meses=Math.min(12,Math.max(1,Math.round(n("s-cmeses")||12))), deps=Math.max(0,Math.round(n("s-cdep"))); if(!(sal>0)) return `<p class="hint">Informe o salário bruto.</p>`;
    const tot=c2(sal*meses/12), p1=c2(tot/2), i=inssDe(tot), r=irDe(tot,i,deps), p2=c2(tot-p1-i-r.imp);
    return `<div class="calcbox">${L("13º bruto ("+meses+"/12)",brl(tot))}${L("1ª parcela (até 30/11, sem descontos)",brl(p1),"dest")}${L("INSS sobre o 13º","− "+brl(i))}${L("Imposto de Renda sobre o 13º","− "+brl(r.imp))}${L("2ª parcela (até 20/12)",brl(p2),"dest")}${L("13º líquido total",brl(c2(p1+p2)),"tot")}</div>${nota}`; }
  if(tipo==="ferias"){ const sal=v("s-csal"), deps=Math.max(0,Math.round(n("s-cdep"))), vende=!!(document.getElementById("s-cvende")||{}).checked; let dias=Math.round(n("s-cdias")||30); dias=Math.min(vende?20:30,Math.max(5,dias)); if(!(sal>0)) return `<p class="hint">Informe o salário bruto.</p>`;
    const fer=c2(sal/30*dias), terco=c2(fer/3), bruto=c2(fer+terco), i=inssDe(bruto), r=irDe(bruto,i,deps), abono=vende?c2(sal/30*10*4/3):0, liq=c2(bruto-i-r.imp+abono);
    return `<div class="calcbox">${L(dias+" dias de férias",brl(fer))}${L("1/3 constitucional",brl(terco))}${L("INSS","− "+brl(i))}${L("Imposto de Renda","− "+brl(r.imp))}${vende?L("Venda de 10 dias + 1/3 (sem desconto)",brl(abono)):""}${L("Você recebe",brl(liq),"tot")}</div><p class="hint">Pago até 2 dias antes de começar as férias. No mês seguinte o salário vem menor, porque os dias de férias já foram pagos.</p>${nota}`; }
  if(tipo==="guardar"){ const alvo=v("s-calvo"), tem=v("s-ctem"), meses=Math.max(1,Math.round(n("s-cprazo"))), taxa=n("s-crend")/100; if(!(alvo>0)||!(n("s-cprazo")>0)) return `<p class="hint">Informe quanto custa e em quantos meses quer comprar.</p>`;
    const fv=alvo-tem*Math.pow(1+taxa,meses); if(fv<=0) return `<div class="calcbox">${L("Você já tem o suficiente","✓","tot")}</div><p class="hint">Com o que já guardou${taxa?" e o rendimento":""}, chega lá sem guardar mais nada.</p>`;
    const pmt=c2(taxa>0?fv*taxa/(Math.pow(1+taxa,meses)-1):fv/meses), aportes=c2(pmt*meses), rend=c2(alvo-tem-aportes);
    return `<div class="calcbox">${L("Guarde por mês",brl(pmt),"tot")}${L("Você vai depositar",brl(aportes))}${taxa>0?L("O rendimento completa",brl(Math.max(0,rend))):""}${L("Pronto em",esc(nomeMes(shiftKey(todayKey,meses)).toLowerCase()))}</div>
      <button class="btn ghost" type="button" data-calcmeta="1">Criar meta de economia com esses valores</button><p class="hint">Rendimento opcional: use o da sua aplicação (ex.: poupança ou CDB). Sem rendimento, a conta é só dividir.</p>`; }
  return "";
}
function corpoCalc(tipo){
  const sal=state.config.salarioPadrao>0?moneyInput(state.config.salarioPadrao):"";
  const campoSal=`<label class="f money">Salário bruto (CLT)<input class="in num" id="s-csal" inputmode="numeric" placeholder="0,00" value="${sal}"></label>`;
  const campoDep=`<label class="f">Dependentes no IR<input class="in num" id="s-cdep" type="number" min="0" max="20" value="0" inputmode="numeric"></label>`;
  const abas=`<div class="seg calcabas" role="tablist">${[["decimo","13º"],["ferias","Férias"],["liquido","Salário líquido"],["guardar","Quanto guardar"]].map(([k,l])=>`<button type="button" role="tab" aria-selected="${k===tipo}" data-calctipo="${k}">${l}</button>`).join("")}</div>`;
  let f="";
  if(tipo==="decimo") f=`${campoSal}<div class="row"><label class="f">Meses trabalhados no ano<input class="in num" id="s-cmeses" type="number" min="1" max="12" value="12" inputmode="numeric"></label>${campoDep}</div><p class="hint">Conta 1 mês para cada mês com 15 dias ou mais de trabalho.</p>`;
  if(tipo==="ferias") f=`${campoSal}<div class="row"><label class="f">Dias de férias<input class="in num" id="s-cdias" type="number" min="5" max="30" value="30" inputmode="numeric"></label>${campoDep}</div><label class="switch"><input type="checkbox" id="s-cvende"><span></span>Vender 10 dias (abono)</label>`;
  if(tipo==="liquido") f=`${campoSal}<div class="row">${campoDep}<label class="f money">Outros descontos (opcional)<input class="in num" id="s-cout" inputmode="numeric" placeholder="0,00"></label></div>`;
  if(tipo==="guardar") f=`<label class="f">O que quer comprar<input class="in" id="s-cnome" maxlength="40" placeholder="ex.: celular novo, viagem"></label><div class="row"><label class="f money">Quanto custa<input class="in num" id="s-calvo" inputmode="numeric" placeholder="0,00"></label><label class="f money">Já tenho guardado<input class="in num" id="s-ctem" inputmode="numeric" placeholder="0,00"></label></div><div class="row"><label class="f">Em quantos meses<input class="in num" id="s-cprazo" type="number" min="1" max="360" inputmode="numeric" placeholder="ex.: 10"></label><label class="f">Rendimento ao mês (%)<input class="in num" id="s-crend" inputmode="decimal" placeholder="opcional, ex.: 0,8" maxlength="5"></label></div>`;
  setTimeout(atualizaCalc,0);
  return abas+f+`<div id="s-calcres"></div>`;
}
function atualizaCalc(){ const el=document.getElementById("s-calcres"); if(el&&ui.sheet) el.innerHTML=calcRes(ui.sheet.calc||"decimo"); }
/* ---------- lançamento rápido por texto ("45 ifood pix", "120 mercado ontem", "300 tv 3x crédito") ---------- */
const semAcento=t=>String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const RAP_KW={carrinho:/^(mercado|supermercado|feira|padaria|acougue|hortifruti|atacad|assai|carrefour|sacolao)/,cafe:/^(cafe|lanche|salgado|cafeteria)/,taca:/^(ifood|restaurante|pizza|hamburguer|burger|bar|cerveja|cinema|show|rappi|lanchonete|almoco|jantar|delivery|netflix|spotify|streaming)/,
  carro:/^(uber|99|taxi|gasolina|combustivel|posto|alcool|etanol|estacionamento|pedagio|onibus|metro|passagem|oficina)/,saude:/^(farmacia|remedio|medico|consulta|dentista|exame|drogaria|academia)/,casa:/^(aluguel|condominio|iptu|reforma|moveis)/,
  raio:/^(luz|energia|agua|internet|gas|telefone|conta)/,celular:/^(celular|recarga|chip|plano)/,livro:/^(escola|curso|faculdade|livro|material|mensalidade)/,sacola:/^(roupa|sapato|tenis|shopping|loja|shein|shopee|amazon|mercadolivre|presente)/,pata:/^(pet|racao|veterinario|petshop)/};
function interpretaRapido(txt){
  const out={valor:null,cat:null,sub:null,forma:null,cartao:null,dia:null,mes:null,n:null,desc:"",por:[]};
  let t=" "+String(txt||"").trim()+" ";
  const hoje=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  const tira=re=>{ const m=t.match(re); if(m) t=t.replace(m[0]," "); return m; };
  /* parcelas: 3x, 10 x */
  let m=tira(/\s(\d{1,2})\s?x(?=\s)/i); if(m){ const n=+m[1]; if(n>=2&&n<=48) out.n=n; }
  /* data: hoje, ontem, anteontem, dia 12, 12/10 */
  const poeData=d=>{ out.dia=d.getDate(); out.mes=keyOf(d.getFullYear(),d.getMonth()+1); };
  if(tira(/\s(anteontem)(?=\s)/i)) poeData(new Date(hoje.getTime()-2*864e5));
  else if(tira(/\s(ontem)(?=\s)/i)) poeData(new Date(hoje.getTime()-864e5));
  else if(tira(/\s(hoje)(?=\s)/i)) poeData(hoje);
  else if((m=tira(/\s(\d{1,2})\/(\d{1,2})(?=\s)/))){ const d=+m[1], mm=+m[2]; if(d>=1&&d<=31&&mm>=1&&mm<=12){ let y=hoje.getFullYear(); if(keyOf(y,mm)>shiftKey(todayKey,2)) y--; const k=keyOf(y,mm); out.mes=k; out.dia=Math.min(d,diasMes(k)); } }
  else if((m=tira(/\sdia\s(\d{1,2})(?=\s)/i))){ const d=+m[1]; if(d>=1&&d<=31){ out.mes=ui.month; out.dia=Math.min(d,diasMes(ui.month)); } }
  /* valor: 45 · 45,90 · 1.200 · 1.200,50 · R$ 12.5 */
  m=tira(/\s(?:r\$\s?)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?:\s?reais)?(?=\s)/i);
  if(m){ const raw=m[1]; const v=/\.\d{3}(,|$)/.test(raw)?Number(raw.replace(/\./g,"").replace(",",".")):Number(raw.replace(",",".")); if(v>0) out.valor=Math.round(v*100)/100; }
  /* forma de pagamento e cartão pelo nome */
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
  if(chaves.length){
    /* 1) pelo histórico: despesas com a mesma palavra na descrição */
    const cont={}, formas={}; Object.keys(state.months).sort().reverse().slice(0,12).forEach(mk=>((state.months[mk]||{}).gastos||[]).forEach(g=>{ const d=semAcento(g.desc); if(!d) return; if(chaves.some(w=>d.split(/[^a-z0-9]+/).includes(w))){ if(catIndex(g.cat)>=0) cont[g.cat]=(cont[g.cat]||0)+1; if(g.forma) formas[g.forma]=(formas[g.forma]||0)+1; } }));
    const melhor=Object.keys(cont).sort((a,b)=>cont[b]-cont[a])[0];
    if(melhor){ out.cat=melhor; out.por.push("histórico"); if(!out.forma){ const f=Object.keys(formas).sort((a,b)=>formas[b]-formas[a])[0]; if(f){ out.forma=f; out.formaHist=true; } } }
    /* 2) pelo nome da categoria ou subcategoria */
    if(!out.cat) for(const ct of state.config.categorias){ const nomes=semAcento(ct.nome).split(/[^a-z0-9]+/).filter(x=>x.length>=3);
      const sub=(ct.subs||[]).find(x=>chaves.some(w=>w.length>=3&&semAcento(x.nome).startsWith(w)));
      if(sub){ out.cat=ct.id; out.sub=sub.id; break; }
      if(chaves.some(w=>w.length>=3&&nomes.some(nm=>nm.startsWith(w)||w.startsWith(nm)))){ out.cat=ct.id; break; } }
    /* 3) por palavras conhecidas (ifood, uber, farmácia...) */
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
/* destaca por um instante o campo que o lançamento rápido preencheu */
function marcaPreenchido(el){ const alvo=el.matches('input[type=radio],input[type=checkbox]')?(document.querySelector(`label[for="${el.id}"]`)||el.parentElement):el;
  if(!alvo) return; alvo.classList.remove("rp-ok"); void alvo.offsetWidth; alvo.classList.add("rp-ok"); setTimeout(()=>alvo.classList.remove("rp-ok"),900); }
let _rapT=null;
/* ---------- calendário do mês ---------- */
function vencimentosDoMes(k){
  const m=state.months[k], out=[];
  fixosDoMes(k).filter(f=>!f.pular).forEach(f=>out.push({t:"fixo",id:f.id,nome:f.desc,valor:f.valor,dia:f.dia,pago:f.pago}));
  parcelasDoMes(k).filter(p=>!p.cartao).forEach(p=>out.push({t:"parc",id:p.id,nome:(p.desc||"Parcela")+" ("+p.idx+"/"+p.n+")",valor:p.valor,dia:p.dia,pago:!!p.pago}));
  cartoesOk().forEach(cc=>{ const t=soma(faturaDoMes(k,cc.id)); if(t>0) out.push({t:"fat",id:cc.id,nome:"Fatura "+cc.nome,valor:t,dia:Math.min(cc.vence,diasMes(k)),pago:faturaPaga(m,cc.id)}); });
  return out;
}
function dadosCalendario(k){
  const dim=diasMes(k), dias=[...Array(dim+1)].map(()=>({g:0,n:0,v:[],r:0}));
  ((state.months[k]||{}).gastos||[]).forEach(g=>{ const d=Math.min(dim,Math.max(1,Number(g.dia)||1)); dias[d].g+=Number(g.valor)||0; dias[d].n++; });
  vencimentosDoMes(k).forEach(x=>dias[x.dia].v.push(x));
  const m=normMonth(state.months[k]||{}); (m.avulsos||[]).forEach(a=>{ const d=Math.min(dim,Math.max(1,Number(a.dia)||1)); dias[d].r+=Number(a.valor)||0; });
  rendasDoMes(k).filter(r=>!r.pular).forEach(r=>{ const d=Math.min(dim,Math.max(1,Number(r.dia)||1)); dias[d].r+=Number(r.valor)||0; });
  return dias;
}
const valCurto=v=>v>=10000?Math.round(v/1000)+"k":v>=1000?(Math.round(v/100)/10).toString().replace(".",",")+"k":String(Math.round(v));
function cardCalendario(k){
  if(!ativo(k)) return "";
  const dias=dadosCalendario(k), dim=diasMes(k), ini=new Date(kY(k),kM(k)-1,1).getDay(), max=Math.max(1,...dias.slice(1).map(d=>d.g));
  const hoje=k===todayKey?today.getDate():0, passado=k<todayKey;
  /* semanas (domingo a sábado) para achar a mais pesada */
  const sem=[]; for(let d=1;d<=dim;d++){ const w=Math.floor((ini+d-1)/7); (sem[w]=sem[w]||{a:d,b:d,t:0}); sem[w].b=d; sem[w].t+=dias[d].g; }
  const pesada=sem.filter(Boolean).slice().sort((a,b)=>b.t-a.t)[0], wPesada=pesada&&pesada.t>0?sem.indexOf(pesada):-1;
  let cel=""; for(let i=0;i<ini;i++) cel+=`<span class="cd vazio" aria-hidden="true"></span>`;
  for(let d=1;d<=dim;d++){ const x=dias[d], h=x.g>0?(0.18+0.82*x.g/max):0, w=Math.floor((ini+d-1)/7);
    const venc=x.v.length?x.v.map(v=>`<i class="vd ${v.pago?"ok":(passado||(hoje&&d<hoje))?"atr":"pend"}"></i>`).slice(0,3).join(""):"";
    const rot=`${d} de ${NOMES[kM(k)-1].toLowerCase()}: `+(x.g?"gastou "+brl(x.g):"sem gastos")+(x.v.length?", "+x.v.length+" vencimento"+(x.v.length>1?"s":""):"")+(x.r?", recebeu "+brl(x.r):"");
    cel+=`<button type="button" class="cd ${d===hoje?"hoje":""} ${w===wPesada?"pesada":""} ${hoje&&d>hoje?"futuro":""}" data-caldia="${d}" style="--h:${h.toFixed(2)}" aria-label="${esc(rot)}"><b>${d}</b>${x.g?`<span class="cg">${valCurto(x.g)}</span>`:x.r?`<span class="cr">+${valCurto(x.r)}</span>`:""}${venc?`<span class="cv">${venc}</span>`:""}</button>`; }
  return `<div class="card cal"><div class="cardhead"><h2>Calendário</h2><button type="button" class="btn ghost mini" data-semana="1">Resumo da semana</button></div><div class="calsub">${wPesada>=0?`<span class="num muted">semana mais pesada: <b>${pesada.a===pesada.b?pad2(pesada.a):pad2(pesada.a)+"–"+pad2(pesada.b)}</b> · ${brl(pesada.t)}</span>`:""}</div>
    <div class="calgrid" role="group" aria-label="Calendário de ${esc(nomeMes(k).toLowerCase())}">${["D","S","T","Q","Q","S","S"].map(x=>`<span class="cw" aria-hidden="true">${x}</span>`).join("")}${cel}</div>
    <div class="calleg"><span><i class="sq"></i>quanto mais forte, mais gasto no dia</span><span><i class="vd pend"></i>vence</span><span><i class="vd ok"></i>pago</span><span><i class="vd atr"></i>atrasado</span></div></div>`;
}
function corpoDia(k,d){
  const dias=dadosCalendario(k), x=dias[d], dt=new Date(kY(k),kM(k)-1,d), hoje=k===todayKey?today.getDate():0;
  const gs=((state.months[k]||{}).gastos||[]).filter(g=>Math.min(diasMes(k),Math.max(1,Number(g.dia)||1))===d);
  const linhasG=gs.map(g=>linhaLanc(Object.assign({},g),k).replace(/data-edit="gasto" data-id=/,'data-caledit=')).join("");
  const linhasV=x.v.map(v=>{ const atr=!v.pago&&(k<todayKey||(hoje&&d<hoje)); return `<div class="item calv ${v.pago?"ok":atr?"atr":"pend"}"><i class="vd ${v.pago?"ok":atr?"atr":"pend"}"></i><span class="desc"><b>${esc(v.nome)}</b><small>${v.pago?"paga":atr?"atrasada":"vence neste dia"}</small></span><span class="v">${brl(v.valor)}</span><button class="btn mini ${v.pago?"ghost":""}" type="button" data-avpagar="${v.t}|${esc(v.id)}|${k}">${v.pago?"Desfazer":"Paguei"}</button></div>`; }).join("");
  return `<div class="caldia">
    <div class="assintot"><div><span class="lab">Gastos</span><b>${brl(x.g)}</b><small>${x.n} lançamento${x.n===1?"":"s"}</small></div><div><span class="lab">Vencimentos</span><b>${brl(soma(x.v))}</b><small>${x.v.length} conta${x.v.length===1?"":"s"}</small></div>${x.r?`<div><span class="lab">Receitas</span><b class="pos">${brl(x.r)}</b><small>neste dia</small></div>`:""}</div>
    ${linhasV?`<h3>Contas</h3>${linhasV}`:""}
    ${linhasG?`<h3>Despesas</h3>${linhasG}`:`<p class="hint">Nenhuma despesa lançada em ${pad2(d)}/${pad2(kM(k))}.</p>`}
  </div>`;
}
function linhaLanc(g,k){
  if(g.parcela) return `<div class="item fixrow parcrow" style="--dot:${catColor(g.cat)}">
    <button type="button" class="check ${g.pago?"on":""}" data-pagar="parc|${esc(g.id)}|${k}" aria-pressed="${g.pago}" aria-label="${g.pago?"Marcar parcela como não paga":"Marcar parcela como paga"}">${ICON.check}</button>
    <button type="button" class="fixinfo" data-edit="parcela" data-id="${esc(g.id)}"><b>${esc(g.desc||"Compra parcelada")}</b><small>parcela ${g.idx}/${g.n}${esc(extraTxt(g))} · vence dia ${pad2(g.dia)}${g.pago?" · paga"+(g.pagoEm?" em "+g.pagoEm.slice(8,10)+"/"+g.pagoEm.slice(5,7):""):""}</small></button>
    <span class="v">${brl(g.valor)}</span></div>`;
  const nota=noCartao(g)?" · fatura de "+abrMes(faturaMes(k,g.dia,cartaoDe(g))):"";
  if(g.forma==="credito") return `<div class="item fixrow parcrow" style="--dot:${catColor(g.cat)}">
    <button type="button" class="check ${g.pago?"on":""}" data-gpago="${esc(g.id)}" data-mes="${k}" aria-pressed="${!!g.pago}" aria-label="${g.pago?"Marcar como não paga":"Marcar como paga"}">${ICON.check}</button>
    <button type="button" class="fixinfo" data-edit="gasto" data-id="${esc(g.id)}" data-mes="${k}"><b class="${g.desc?"":"empty"}">${esc(g.desc||"sem descrição")}</b><small>${esc(catName(g.cat)+extraTxt(g))} · Crédito${esc(nota+porTxt(g))} · ${g.pago?"paga"+(g.pagoEm?" em "+g.pagoEm.slice(8,10)+"/"+g.pagoEm.slice(5,7):""):"não paga"}</small></button>
    <span class="v">${brl(g.valor)}</span></div>`;
  return `<button type="button" class="item gitem" data-edit="gasto" data-id="${esc(g.id)}" style="--dot:${catColor(g.cat)}">
    ${icoCat(g.cat)}
    <span class="desc"><b class="${g.desc?"":"empty"}">${esc(g.desc||catName(g.cat))}</b><small>${esc(catName(g.cat))} · ${esc(formaNome(g.forma)+extraTxt(g)+nota+porTxt(g))}</small></span>
    <span class="v">${valorGrande(g.valor)}</span></button>`;
}
/* motivo das barrinhas do logo, usado nas telas vazias */
const BARRINHAS='<span class="mbars" aria-hidden="true"><i></i><i></i><i></i></span>';
function linhaMeta(mt,k,anel){
  const i=infoMeta(mt,k), pc=Math.round(Math.min(1,i.pct)*100);
  const sub=i.feita?"Meta atingida!":i.atrasada?"Prazo passou · faltam "+brl(i.falta):mt.prazo?"Faltam "+brl(i.falta)+" · guarde "+brl(i.porMes)+"/mês até "+abrMes(mt.prazo):"Faltam "+brl(i.falta);
  const ring=anel?`<span class="manel" aria-hidden="true"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="var(--sunk)" stroke-width="5"/><circle class="anel-v" cx="22" cy="22" r="18" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" pathLength="100" stroke-dasharray="${pc} 100" transform="rotate(-90 22 22)"/></svg><b>${pc}%</b></span>`:"";
  return `<button type="button" class="meta ${anel?"comanel":""} ${i.feita?"feita":""} ${i.atrasada?"atrasada":""}" data-edit="meta" data-id="${esc(mt.id)}">${ring}<span class="mcorpo">
    <span class="mt"><b>${esc(mt.nome)}</b>${anel?"":`<em class="mpct">${pc}%</em>`}</span>
    <span class="mval num">${brl(i.saldo)} <small>de ${brl(mt.alvo)}</small></span>
    <span class="track"><span style="width:${(i.pct*100).toFixed(1)}%"></span></span>
    <small>${esc(sub)}</small></span></button>`;
}
function serieSaldo(k){
  const dim=diasMes(k), mov=new Array(dim+2).fill(0), m=normMonth(state.months[k]||{}), c=calc(k), dd=x=>Math.min(dim,Math.max(1,Number(x)||1));
  mov[1]+=c.salario; rendasDoMes(k).filter(r=>!r.pular).forEach(r=>mov[dd(r.dia)]+=Number(r.valor)||0); (m.avulsos||[]).forEach(a=>mov[dd(a.dia)]+=Number(a.valor)||0);
  despesasDoMes(k).forEach(g=>{ const cc=g.cartaoId?(state.config.cartoes.find(x=>x.id===g.cartaoId)):null; mov[dd(cc?cc.vence:g.dia)]-=Number(g.valor)||0; });
  (m.caixinha||[]).forEach(x=>mov[dd(x.dia)]+=(x.tipo==="guardar"?-1:1)*(Number(x.valor)||0));
  const ate=k===todayKey?today.getDate():dim, out=[]; let s=0; for(let d=1;d<=ate;d++){ s+=mov[d]; out.push(s); } return out;
}
function graficoSaldo(sr){
  if(sr.length<2) return "";
  const W=360,H=70, mx=Math.max(...sr), mn=Math.min(...sr,0), rg=(mx-mn)||1;
  const P=sr.map((v,i)=>[i/(sr.length-1)*W,H-4-(v-mn)/rg*(H-8)]), d="M"+P.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" L"), u=P[P.length-1];
  return `<svg class="hs-graf" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="hsg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".32"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><path d="${d} L${W},${H} L0,${H}Z" fill="url(#hsg)"/><path class="hs-linha" d="${d}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/><circle cx="${u[0].toFixed(1)}" cy="${u[1].toFixed(1)}" r="3.5" fill="currentColor"/><circle class="hs-pulso" cx="${u[0].toFixed(1)}" cy="${u[1].toFixed(1)}" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg><span class="sr">Gráfico do saldo dia a dia: começou o mês em ${brl(sr[0])}, o menor valor foi ${brl(Math.min(...sr))} e hoje está em ${brl(sr[sr.length-1])}.</span>`;
}
/* tela de abertura (logo em tela cheia) some com um fade quando o app fica pronto */
/* a abertura fica pelo menos o tempo das barras do M subirem */
const BOOT_MIN=1150;
function tiraBoot(){ const b=document.getElementById("boot"); if(!b||b.dataset.saindo) return; b.dataset.saindo="1"; const espera=Math.max(0,(semMovimento()?500:BOOT_MIN)-performance.now()); setTimeout(()=>{ b.classList.add("sai"); setTimeout(()=>b.remove(),400); },espera); }
const SECOES_RECOLHIVEIS=false;
/* seção recolhível do Início (celular) */
function secaoMes(id,titulo,resumo,icone,html){
  if(!html||!String(html).trim()) return "";
  /* 5.0.10: as caixas voltaram a ficar sempre abertas (contas fixas e faturas visíveis para marcar e editar) */
  if(!SECOES_RECOLHIVEIS) return html;
  const ab=!!(ui.abre&&ui.abre[id]);
  return `<section class="mais ${ab?"aberta":""}" id="sec-${id}"><button type="button" class="maishead" data-abre="${id}" aria-expanded="${ab}" aria-controls="secb-${id}"><span class="mi" aria-hidden="true">${icone||""}</span><span class="mt"><b>${esc(titulo)}</b>${resumo?`<small>${resumo}</small>`:""}</span><span class="mc" aria-hidden="true">${icq("chev",18)}</span></button><div class="maisbody" id="secb-${id}">${html}</div></section>`;
}
/* abre a seção recolhida que contém o elemento (para "Ver tudo", avisos etc.) */
function garanteVisivel(id){
  let el=document.getElementById(id); const sec=el&&el.closest(".mais:not(.aberta)");
  if(sec){ ui.abre=ui.abre||{}; ui.abre[sec.id.slice(4)]=true; render(); el=document.getElementById(id); }
  return el;
}
function viewMes(){
  const k=ui.month, m=getMonth(k), c=calc(k), cats=state.config.categorias, isCur=k===todayKey;
  const prevK=shiftKey(k,-1), prev=MESES.includes(prevK)&&ativo(prevK)&&ativo(k)?calc(prevK):null;
  const acum=acumulado(k), cx=caixinhaAte(k), ini=inicioKey();
  const aviso=avisoCompart()+(!ini?`<div class="note info">Seu controle ainda não começou. Informe o <b>salário deste mês</b> no card Receitas (ou lance uma receita) e os cálculos passam a contar a partir deste mês.</div>`
    :k<ini?`<div class="note info">Este mês é anterior ao início do seu controle (${esc(nomeMes(ini).toLowerCase())}). Aqui só conta o que você lançar à mão; salário padrão, rendas e contas fixas não entram.</div>`:"");
  const subRec=[ "salário "+brl(c.salario), c.rendas?"fixas "+brl(c.rendas):"", c.avulsos?"avulsos "+brl(c.avulsos):"" ].filter(Boolean).join(" · ");
  const varDesp=prev?variacao(c.despesas,prev.despesas):"";
  const usoPct=c.receitas>0?Math.round((c.despesas+c.guardado-c.retirado)/c.receitas*100):null;
  const mesN=NOMES[kM(k)-1].toLowerCase(), varS=prev&&Math.abs(prev.saldo)>0.5?(c.saldo-prev.saldo)/Math.abs(prev.saldo):null;
  const pv=c.receitas>0?previsaoMes(k,c):null, alTop=isCur?alertasOrcamento(k).find(a=>a.diaEstoura||a.nivel==="passou"):null;
  const notaTxt=pv?(pv.ritmo>0?`No ritmo atual, ${mesN} termina com <b class="nowrap">≈&nbsp;${brl(pv.saldo)}</b>.`:`Sem gastos do dia a dia até agora: ${mesN} termina com <b>${brl(pv.saldo)}</b> se continuar assim.`):c.porDia!==null&&c.receitas>0?`Você pode gastar <b>${brl(c.porDia)}</b> por dia ${isCur?"até o fim do mês":"neste mês"}.`:"";
  const notaAl=alTop?(alTop.nivel==="passou"?` ${esc(alTop.nome)} passou do limite.`:` ${esc(alTop.nome)} estoura o limite no dia ${alTop.diaEstoura}.`):"";
  /* saúde do mês: muda a cor da "aura" do cartão e o selo */
  const saude=c.saldo<0?"bad":(c.receitas>0&&c.saldo<c.receitas*0.05)?"warn":(c.receitas>0||c.despesas>0)?"ok":"";
  const selo={ok:"mês saudável",warn:"mês apertado",bad:"mês no vermelho"}[saude];
  const tiles=`<div class="heroSaldo ${c.saldo<0?"neg":""} ${saude?"sd-"+saude:""}"><i class="hs-aura" aria-hidden="true"></i><i class="hs-aura b2" aria-hidden="true"></i>
    <div class="hs-top"><span class="lab">Saldo de ${esc(mesN)}</span>${selo?`<span class="hs-selo"><i></i>${selo}</span>`:""}</div>
    <b class="hs-val" data-v="${c.saldo}">${valorGrande(c.saldo)}</b>
    <div class="hs-sub">${varS!==null?`<span class="${varS>=0?"hs-up":"hs-down"}">${varS>=0?"▲":"▼"} ${Math.round(Math.abs(varS)*100)}%</span> vs ${esc(NOMES[kM(prevK)-1].toLowerCase())} · `:""}acumulado <b>${brl(acum)}</b></div>
    ${graficoSaldo(serieSaldo(k))}
    <div class="hs-duo"><div class="hs-mini"><span class="lab">Receitas</span><b data-v="${c.receitas}">${valorGrande(c.receitas)}</b></div><div class="hs-mini"><span class="lab">Despesas</span><b data-v="${c.despesas}">${valorGrande(c.despesas)}</b></div></div>
  </div>
  <div class="qa">
    <button type="button" class="q" data-novo="gasto"><span class="qi">${icq("seta-baixo")}</span>Despesa</button>
    <button type="button" class="q" data-novo="avulso"><span class="qi">${icq("seta-cima")}</span>Receita</button>
    ${state.config.contas.length>1?`<button type="button" class="q" data-novo="transf"><span class="qi">${icq("troca")}</span>Transferir</button>`:`<button type="button" class="q" data-novo="fixo"><span class="qi">${icq("repete")}</span>Conta fixa</button>`}
    <button type="button" class="q" data-novo="caixinha" data-cxtipo="guardar"><span class="qi">${icq("cofre")}</span>Caixinha</button>
  </div>
<!--LEMB-->
  ${notaTxt||notaAl?`<div class="nota"><span class="ni">${icq("tendencia",17)}</span><span>${notaTxt}${notaAl}${pv&&pv.cartao>0?`<small>e mais ≈ ${brl(pv.cartao)} no cartão até o fim do mês (fatura de ${esc(abrMes(shiftKey(k,1)))})</small>`:""}</span></div>`:""}
  ${(()=>{ const comLim=cats.filter(ct=>ct.orcamento>0), base=comLim.length?comLim:cats.filter(ct=>(c.porCat[ct.id]||0)>0).sort((a,b)=>(c.porCat[b.id]||0)-(c.porCat[a.id]||0)).slice(0,4);
      if(!base.length) return "";
      const linhas=base.slice(0,4).map(ct=>{ const v=c.porCat[ct.id]||0, o=comLim.length?limiteCat(ct,k):c.despesas, p=o>0?Math.min(100,v/o*100):0, cls=comLim.length&&v>o?"over":comLim.length&&p>=80?"warn":"";
        return `<div class="orow ${cls}" style="--dot:${catColor(ct.id)}">${icoCat(ct.id)}<span class="ot"><b>${esc(ct.nome)}</b><span class="track"><i style="width:${p.toFixed(1)}%"></i></span></span><span class="ov">${brl(v)}<small>${comLim.length?"de "+brl(o):Math.round(p)+"%"}</small></span></div>`; }).join("");
      return `<div class="card orc"><div class="cardhead"><h2>${comLim.length?"Orçamento do mês":"Onde mais gastou"}</h2><button type="button" class="link" data-rolar="onde">Ver tudo</button></div>${linhas}${comLim.length?"":`<button type="button" class="link" data-irajustes="categorias">Definir limites por categoria</button>`}</div>`; })()}`;
  /* lançamentos do mês (compras feitas neste mês + parcelas fora do cartão) */
  const todos=m.gastos.filter(g=>g.forma!=="credito").concat(parcelasDoMes(k).filter(p=>p.forma!=="credito"));
  if(ui.filtro&&catIndex(ui.filtro)<0) ui.filtro="";
  const gastos=todos.filter(g=>!ui.filtro||g.cat===ui.filtro);
  /* mostra só as 5 mais recentes (dia mais novo primeiro; no mesmo dia, a lançada por último); "Ver todas" abre o resto */
  const LIM=5, ordem=gastos.map((g,i)=>({g,i})).sort((a,b)=>(b.g.dia-a.g.dia)||(b.i-a.i)).map(x=>x.g);
  const todasAbertas=ui.verTodas===k, visiveis=todasAbertas?ordem:ordem.slice(0,LIM);
  const totDia={}; gastos.forEach(g=>{ totDia[g.dia]=(totDia[g.dia]||0)+(Number(g.valor)||0); });
  const byDay={}; visiveis.forEach(g=>{(byDay[g.dia]=byDay[g.dia]||[]).push(g)});
  const days=Object.keys(byDay).map(Number).sort((a,b)=>b-a);
  const lista=`<div class="card"><div class="cardhead"><h2>Últimos lançamentos</h2>
    <select class="in mini" id="filtroCat" aria-label="Filtrar por categoria"><option value="">Todas</option>${cats.map(ct=>`<option value="${esc(ct.id)}" ${ui.filtro===ct.id?"selected":""}>${esc(ct.nome)}</option>`).join("")}</select></div>
    <button type="button" class="btn wide desk" data-novo="gasto">${ICON.mais} Lançar despesa</button>
    ${gastos.length?`<p class="listaresumo">${gastos.length} despesa${gastos.length===1?"":"s"}${ui.filtro?" nesta categoria":""} · ${brl(soma(gastos))}</p>`:""}
    ${days.length?days.map(d=>{ const its=byDay[d], tot=totDia[d]||soma(its);
      const lab=new Date(kY(k),kM(k)-1,d).toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"}).replace(/\./g,"");
      return `<div class="day"><div class="dayhead"><span>${esc(lab)}${isCur&&d===today.getDate()?" · hoje":""}</span><span class="num">${brl(tot)}</span></div>${its.map(g=>linhaLanc(g,k)).join("")}</div>`; }).join("")
    :`<div class="empty-state">${ui.filtro?"Nenhuma despesa nessa categoria em "+NOMES[kM(k)-1].toLowerCase()+".":"Nenhuma despesa em "+NOMES[kM(k)-1].toLowerCase()+" ainda.<br>Toque em <b>+</b> para lançar a primeira."}</div>`}
    ${gastos.length>LIM?`<button type="button" class="btn ghost wide vermais" data-vertodas="${k}">${todasAbertas?"Mostrar só as 5 mais recentes":"Ver todas as "+gastos.length+" despesas"}</button>`:""}
    <p class="hint">Toque num lançamento para editar ou apagar. Compras no cartão de crédito ficam em Contas fixas.</p></div>`;
  /* faturas dos cartões (uma por cartão configurado) */
  const fatura=cartoesOk().map(cc=>{
    const fat=faturaDoMes(k,cc.id), tot=soma(fat), prox=soma(faturaDoMes(shiftKey(k,1),cc.id)), lim=usoCartao(cc), pg=faturaPaga(m,cc.id);
    if(!fat.length&&!prox) return `<div class="card fatmini"><span class="ico" style="--dot:var(--accent)">${svgCat("dinheiro",16)}</span><span class="t"><b>Fatura ${esc(cc.nome)}</b><small>Sem compras · vence dia ${pad2(Math.min(cc.vence,diasMes(k)))}${cc.limite>0?" · limite livre "+brl(lim.livre):""}</small></span><span class="v">${brl(0)}</span></div>`;
    return `<div class="card fatcard"><div class="fatbox"><div class="fb-top"><div class="fb-t"><h2>Fatura ${esc(cc.nome)}</h2><small>vence dia ${pad2(Math.min(cc.vence,diasMes(k)))} · fecha dia ${pad2(cc.fecha)}${temContas()?" · paga pela conta "+esc(nomeConta(cc.contaId)):""}</small></div><b class="fb-v" data-v="${tot}">${valorGrande(tot)}</b></div>
      ${cc.limite>0?`<div class="bar ${lim.livre<0?"over":lim.livre<cc.limite*0.2?"warn":""}" style="--dot:var(--accent)"><div class="t"><b>Limite disponível</b><span class="num">${brl(lim.livre)} de ${brl(cc.limite)}</span></div><div class="track"><div style="width:${Math.max(0,Math.min(100,lim.livre/cc.limite*100)).toFixed(1)}%"></div></div></div>`:""}</div>
      ${fat.length?`<div>${fat.sort((a,b)=>(a.compraK+pad2(a.dia)).localeCompare(b.compraK+pad2(b.dia))).map(g=>`<button type="button" class="item" ${g.parcela?`data-edit="parcela" data-id="${esc(g.id)}"`:`data-edit="gasto" data-id="${esc(g.id)}" data-mes="${g.compraK}"`} style="--dot:${catColor(g.cat)}"><span class="pill">${esc(catName(g.cat))}</span><span class="desc"><b class="${g.desc?"":"empty"}">${esc(g.desc||"sem descrição")}</b><small>${g.parcela?"parcela "+g.idx+"/"+g.n:"compra em "+pad2(g.dia)+"/"+pad2(kM(g.compraK))}</small></span><span class="v">${brl(g.valor)}</span></button>`).join("")}</div>
        <label class="switch"><input type="checkbox" data-fatpaga="${esc(cc.id)}" ${pg?"checked":""}><span></span>Fatura paga</label>`:`<p class="hint">Nenhuma compra neste cartão para esta fatura.</p>`}
      ${prox>0?`<p class="hint">Já lançado para a fatura de ${esc(abrMes(shiftKey(k,1)))}: <b>${brl(prox)}</b></p>`:""}</div>`;
  }).join("");
  /* contas (saldo de cada uma até este mês) e transferências */
  let contasCard="";
  if(temContas()){
    const S=saldosContas(k), tf=m.transf;
    contasCard=`<div class="card"><div class="cardhead"><h2>Contas</h2><span class="big">${brl(soma(Object.values(S).map(v=>({valor:v}))))}</span></div>
      <div class="contas">${state.config.contas.map(ct=>`<button type="button" class="conta" data-edit="conta" data-id="${esc(ct.id)}"><span class="ic">${ICON[ct.tipo==="dinheiro"?"dinheiro":ct.tipo==="poupanca"?"poupanca":"banco"]}</span><span class="desc"><b>${esc(ct.nome)}</b><small>${esc({corrente:"Conta corrente",poupanca:"Poupança",dinheiro:"Dinheiro",outra:"Outra"}[ct.tipo]||"Conta")}${state.config.contaSalario===ct.id||(!state.config.contaSalario&&ct===contaPrincipal())?" · recebe o salário":""}</small></span><span class="v num ${S[ct.id]<0?"neg":""}">${brl(S[ct.id])}</span></button>`).join("")}</div>
      ${tf.length?`<div class="subhead">Transferências de ${esc(NOMES[kM(k)-1].toLowerCase())}</div><div>${tf.slice().sort((a,b)=>a.dia-b.dia).map(t=>`<button type="button" class="item" data-edit="transf" data-id="${esc(t.id)}" style="--dot:var(--c3)"><span class="pill">dia ${pad2(t.dia)}</span><span class="desc"><b>${esc(nomeConta(t.de))} → ${esc(nomeConta(t.para))}</b><small>${esc(t.desc||"transferência")}</small></span><span class="v">${brl(t.valor)}</span></button>`).join("")}</div>`:""}
      <p class="hint">Saldo de cada conta até o fim de ${esc(NOMES[kM(k)-1].toLowerCase())}, com o que já foi lançado.</p>
      ${state.config.contas.length>1?`<button type="button" class="btn ghost" data-novo="transf">⇄ Transferir entre contas</button>`:""}</div>`;
  }
  /* contas fixas + compras no cartão de crédito (aparecem até o mês da última parcela) */
  const fx=fixosDoMes(k), cc=cartaoDoMes(k);
  const totalFix=c.fixosTotal+soma(cc), faltam=c.fixosPend+soma(cc.filter(x=>!x.pago));
  const linhaCartao=g=>{
    const chk=g.parcela?`data-pagar="parc|${esc(g.id)}|${k}"`:`data-gpago="${esc(g.id)}" data-mes="${g.compraK}"`;
    const edit=g.parcela?`data-edit="parcela" data-id="${esc(g.id)}" data-mes="${k}"`:`data-edit="gasto" data-id="${esc(g.id)}" data-mes="${g.compraK}"`;
    const info=g.parcela?`parcela ${g.idx}/${g.n}${g.idx===g.n?" · última parcela":" · até "+abrMes(shiftKey(k,g.n-g.idx))}`:`à vista · compra em ${pad2(g.dia)}/${pad2(kM(g.compraK))}`;
    return `<div class="item fixrow parcrow" style="--dot:${catColor(g.cat)}">
      <button type="button" class="check ${g.pago?"on":""}" ${chk} aria-pressed="${!!g.pago}" aria-label="${g.pago?"Marcar como não paga":"Marcar como paga"}">${ICON.check}</button>
      <button type="button" class="fixinfo" ${edit}><b class="${g.desc?"":"empty"}">${esc(g.desc||"Compra no cartão")}${g.parcela?` <em class="tag">${g.idx}/${g.n}</em>`:""}</b><small>${esc(info)} · ${g.pago?"paga"+(g.pagoEm?" em "+g.pagoEm.slice(8,10)+"/"+g.pagoEm.slice(5,7):""):"não paga"}</small></button>
      <span class="v">${brl(g.valor)}</span></div>`; };
  const fixas=`<div class="card"><div class="cardhead"><h2>Contas fixas</h2><span class="num muted">${fx.length||cc.length?brl(totalFix):""}</span></div>
    ${fx.length?`<div>${fx.map(f=>`<div class="item fixrow ${f.pular?"skip":""}" style="--dot:${catColor(f.cat)}">
      <button type="button" class="check ${f.pago?"on":""}" data-pago="${esc(f.id)}" aria-pressed="${f.pago}" aria-label="${f.pago?"Marcar como não paga":"Marcar como paga"}" ${f.pular?"disabled":""}>${ICON.check}</button>
      <button type="button" class="fixinfo" data-edit="fixoMes" data-id="${esc(f.id)}"><b>${esc(f.desc)}</b><small>${f.pular?"pulada neste mês":"vence dia "+pad2(f.dia)+" · "+esc(catName(f.cat))}</small></button>
      <span class="v">${f.pular?"—":brl(f.valor)}</span>
      <button type="button" class="x lixo" data-delfixo="${esc(f.id)}" aria-label="Excluir ${esc(f.desc)}" title="Excluir conta fixa">${ICON.lixo}</button></div>`).join("")}</div>`:""}
    ${cc.length?`<div class="subhead">Cartão de crédito</div><div>${cc.map(linhaCartao).join("")}</div>`:""}
    ${fx.length||cc.length?`<p class="hint">${faltam>0?"Falta pagar "+brl(faltam)+" este mês.":"Tudo pago neste mês."}</p>`
    :ativo(k)?`<p class="hint">Cadastre contas que se repetem todo mês (aluguel, internet, academia). Compras no cartão de crédito também aparecem aqui até a última parcela.</p>`:`<p class="hint">As contas fixas entram a partir do mês em que seu controle começa.</p>`}
    <button type="button" class="btn ghost" data-novo="fixo">+ Conta fixa</button></div>`;
  /* receitas */
  const rd=rendasDoMes(k);
  const receitas=`<div class="card"><div class="cardhead"><h2>Receitas</h2><span class="num muted">${brl(c.receitas)}</span></div>
    <label class="f money">Salário / renda fixa deste mês<input class="in num" id="salMes" inputmode="numeric" value="${esc(m.salario===0?"0,00":moneyInput(m.salario))}" placeholder="${esc(moneyInput(ativo(k)?state.config.salarioPadrao:0))}${ativo(k)?" (padrão)":""}"></label>
    <p class="hint">Em branco, usa o salário padrão definido no Perfil.</p>
    ${rd.length?`<div>${rd.map(r=>`<button type="button" class="item ${r.pular?"skip":""}" data-edit="rendaMes" data-id="${esc(r.id)}" style="--dot:var(--good)"><span class="pill">dia ${pad2(r.dia||1)}</span><span class="desc"><b>${esc(r.nome)}</b>${r.pular?"<small>pulada neste mês</small>":""}</span><span class="v pos">${r.pular?"—":brl(r.valor)}</span></button>`).join("")}</div>`:""}
    ${m.avulsos.length?(()=>{ const ord=m.avulsos.map((x,i)=>({x,i})).sort((p1,p2)=>(p2.x.dia-p1.x.dia)||(p2.i-p1.i)).map(o=>o.x), abertas=ui.verTodasRec===k, vis=abertas?ord:ord.slice(0,5);
      return `<div>${vis.map(x=>`<button type="button" class="item" data-edit="avulso" data-id="${esc(x.id)}" style="--dot:var(--good)"><span class="pill">dia ${pad2(x.dia)}</span><span class="desc"><b class="${x.desc?"":"empty"}">${esc(x.desc||"sem descrição")}</b></span><span class="v pos">${brl(x.valor)}</span></button>`).join("")}</div>
      ${ord.length>5?`<button type="button" class="btn ghost wide vermais" data-vertodasrec="${k}">${abertas?"Mostrar só as 5 mais recentes":"Ver todas as "+ord.length+" receitas avulsas"}</button>`:""}`; })():""}
    <button type="button" class="btn ghost" data-novo="avulso">+ Receita</button></div>`;
  /* caixinha (geral + metas de economia) */
  const metas=state.config.metas, somaMetas=soma(metas.map(mt=>({valor:saldoMeta(mt.id,k)}))), geral=cx-somaMetas;
  const caixa=`<div class="card"><div class="cardhead"><h2>Caixinha</h2><span class="big">${brl(cx)}</span></div>
    <p class="hint">Guardar tira do saldo do mês; retirar devolve para ele.</p>
    ${metas.length?`<div class="metas">${metas.map(mt=>linhaMeta(mt,k)).join("")}<div class="metageral"><span>Geral (sem meta)</span><b class="num">${brl(geral)}</b></div></div>`:""}
    ${m.caixinha.length?`<div class="subhead">Movimentos de ${esc(NOMES[kM(k)-1].toLowerCase())}</div><div>${m.caixinha.slice().sort((a,b)=>a.dia-b.dia).map(x=>`<button type="button" class="item" data-edit="caixinha" data-id="${esc(x.id)}" style="--dot:${x.tipo==="guardar"?"var(--accent)":"var(--warn)"}"><span class="pill">dia ${pad2(x.dia)}</span><span class="desc"><b>${esc(x.desc||(x.tipo==="guardar"?"Guardou":"Retirou"))}</b><small>${x.desc?(x.tipo==="guardar"?"Guardou · ":"Retirou · "):""}${esc(nomeMeta(x.metaId))}</small></span><span class="v">${x.tipo==="guardar"?"+":"−"}${brl(x.valor)}</span></button>`).join("")}</div>`:""}
    <div class="row2"><button type="button" class="btn ghost" data-novo="caixinha" data-cxtipo="guardar">+ Guardar</button><button type="button" class="btn ghost badbtn" data-novo="caixinha" data-cxtipo="retirar">− Retirar</button></div>
    <button type="button" class="btn ghost" data-novo="meta">+ Nova meta de economia</button></div>`;
  /* para onde foi */
  const alR={}; if(k===todayKey) alertasOrcamento(k).forEach(a=>{ if(a.diaEstoura) alR[a.id]=a; });
  /** @type {Array<{id:string,nome:string,v:number,o:number,sb?:number,cor:string}>} */
  const itens=cats.map((ct,i)=>({id:ct.id,nome:ct.nome,v:c.porCat[ct.id]||0,o:limiteCat(ct,k),sb:sobraCat(ct,k),cor:catColor(ct.id)}));
  const semCat=Object.keys(c.porCat).filter(id=>catIndex(id)<0).reduce((a,id)=>a+c.porCat[id],0);
  if(semCat>0) itens.push({id:"",nome:"Sem categoria",v:semCat,o:0,cor:"var(--c8)"});
  const ordenados=itens.slice().sort((a,b)=>b.v-a.v);
  const porSub={}; despesasDoMes(k).forEach(g=>{ if(g.sub&&subName(g.cat,g.sub)){ const kk=g.cat; (porSub[kk]=porSub[kk]||{})[g.sub]=((porSub[kk]||{})[g.sub]||0)+(Number(g.valor)||0); } });
  const subsLinha=x=>{ const ps=porSub[x.id]; if(!ps) return ""; const tot=Object.values(ps).reduce((a,v)=>a+v,0), resto=x.v-tot;
    return `<div class="subs">${Object.entries(ps).sort((a,b)=>b[1]-a[1]).map(([sid,v])=>`<span>${esc(subName(x.id,sid))} <b>${brl(v)}</b></span>`).join("")}${resto>0.005?`<span>outros <b>${brl(resto)}</b></span>`:""}</div>`; };
  const onde=`<div class="card" id="onde"><div class="cardhead"><h2>Para onde foi</h2><span class="num muted">${varDesp?esc(varDesp):""}</span></div>
    <div class="donutwrap">${donut(ordenados,c.despesas,brl(c.despesas),"gasto no mês")}
    <div class="bars">${ordenados.filter(x=>x.v>0||x.o>0).map(x=>{ const pv=prev?(prev.porCat[x.id]||0):0; const p=x.o>0?x.v/x.o:0; const cls=x.o>0&&p>1?"over":x.o>0&&p>=.8?"warn":"";
      const w=x.o>0?Math.min(100,p*100):(c.despesas>0?x.v/c.despesas*100:0);
      const delta=prev&&(pv>0||x.v>0)?(x.v>pv?`<em class="up">▲ ${brl(x.v-pv)}</em>`:x.v<pv?`<em class="down">▼ ${brl(pv-x.v)}</em>`:""):"";
      return `<div class="bar ${cls}" style="--dot:${x.cor}"><div class="t"><b>${x.id?icoCat(x.id,14):""}${esc(x.nome)}</b><span class="num">${brl(x.v)}${x.o>0?" / "+brl(x.o):c.despesas>0?" · "+Math.round(x.v/c.despesas*100)+"%":""}</span></div><div class="track"><div style="width:${w.toFixed(1)}%"></div></div>${subsLinha(x)}${x.sb>0?`<div class="sobraln">inclui ${brl(x.sb)} que sobraram dos meses anteriores</div>`:""}${alR[x.id]?`<div class="ritmo">No ritmo de hoje, chega a ${brl(alR[x.id].proj)} e estoura no dia ${alR[x.id].diaEstoura}</div>`:""}${delta?`<div class="delta">${delta} vs ${abrMes(prevK)}</div>`:""}</div>`; }).join("")||'<p class="hint">Assim que você lançar despesas, aparece aqui quanto foi para cada categoria.</p>'}</div></div>
    <p class="hint">Limites por categoria ficam em Ajustes: amarelo a partir de 80%, vermelho quando passa.</p></div>`;
  /* forma de pagamento */
  const formas=FORMAS.map(([id,n])=>({id,n,v:c.porForma[id]||0})).concat([{id:"?",n:"Não informado",v:c.porForma["?"]||0}]).filter(x=>x.v>0).sort((a,b)=>b.v-a.v);
  const pag=`<div class="card"><div class="cardhead"><h2>Forma de pagamento</h2></div>
    ${formas.length?`<div class="bars">${formas.map(x=>`<div class="bar" style="--dot:var(--fm-${x.id==="?"?"na":x.id})"><div class="t"><b>${esc(x.n)}</b><span class="num">${brl(x.v)} · ${Math.round(x.v/c.despesas*100)}%</span></div><div class="track"><div style="width:${(x.v/formas[0].v*100).toFixed(1)}%"></div></div></div>`).join("")}</div>`:'<p class="hint">Mostra quanto saiu no Pix, débito, crédito, dinheiro e boleto.</p>'}
    ${!cartaoAtivo()&&c.porForma.credito>0?`<p class="hint">Dica: em Ajustes → Cartões de crédito, cadastre seu cartão com o dia de fechamento para as compras no crédito contarem no mês da fatura.</p>`:""}</div>`;
  /* 5.0.6: no celular, o que não é do dia a dia fica recolhido em "Mais de <mês>" (no computador tudo aparece) */
  if(!ini&&ui.abre.receitas===undefined) ui.abre.receitas=true; /* primeiro uso: Receitas já aberta para informar o salário */
  const nCart=cartoesOk().length, totFat=cartoesOk().reduce((a,cc)=>a+soma(faturaDoMes(k,cc.id)),0);
  const fatHtml=Array.isArray(fatura)?fatura.join(""):fatura;
  const secs1=secaoMes("cal","Calendário","gastos por dia e vencimentos",ICON.mes,cardCalendario(k))
    +secaoMes("onde","Para onde foi",c.despesas>0?brl(c.despesas)+" em despesas":"",svgCat("pontos",18),onde);
  const secs2=secaoMes("contas","Contas",contasCard?"saldo por conta":"",ICON.banco,contasCard)
    +secaoMes("faturas",nCart>1?"Faturas dos cartões":"Fatura do cartão",nCart?brl(totFat):"",ICON.cartao,fatHtml)
    +secaoMes("fixas","Contas fixas",(fx.length||cc.length)?brl(totalFix):"",ICON.repete,fixas)
    +secaoMes("receitas","Receitas",brl(c.receitas),icq("seta-cima",18),receitas)
    +secaoMes("caixa","Caixinha",brl(cx),icq("cofre",18),caixa)
    +secaoMes("pag","Forma de pagamento","como você pagou",svgCat("dinheiro",18),pag);
  return aviso+(k===todayKey?cardViagemMes():"")+tiles.replace('<!--LEMB-->',cardLembretes())+`<div class="grid"><div class="col">${lista}${SECOES_RECOLHIVEIS?`<h2 class="maistit">Mais de ${esc(mesN)}</h2>`:""}${secs1}</div><div class="col">${secs2}</div></div>`;
}

/* ---------- aba Visão geral (só meses que já passaram + o atual) ---------- */
function viewAno(){
  const ini=inicioKey();
  if(!ini) return `<div class="empty-state">A visão geral aparece assim que você registrar sua primeira renda.<br>Vá na aba <b>Mês</b> e informe o salário do mês (ou uma receita avulsa).</div>`;
  const ks=MESES.filter(k=>k>=ini&&k<=todayKey);
  if(!ks.length) return `<div class="empty-state">Seu controle começa em ${esc(nomeMes(ini).toLowerCase())}. A visão geral mostra os meses a partir daí, até o mês atual.</div>`;
  const rows=ks.map(k=>({k,c:calc(k),ac:acumulado(k),cx:caixinhaAte(k)}));
  const T=rows.reduce((a,r)=>({rec:a.rec+r.c.receitas,des:a.des+r.c.despesas,sal:a.sal+r.c.saldo}),{rec:0,des:0,sal:0});
  const ult=rows[rows.length-1], periodo=abrMes(ks[0])+" a "+abrMes(ult.k)+" · "+ks.length+(ks.length===1?" mês":" meses");
  const comGasto=rows.filter(r=>r.c.despesas>0), media=comGasto.length?T.des/comGasto.length:0;
  const maior=comGasto.slice().sort((a,b)=>b.c.despesas-a.c.despesas)[0];
  const melhor=rows.slice().sort((a,b)=>b.c.saldo-a.c.saldo)[0];
  /* gráfico */
  const max=Math.max(1,...rows.map(r=>Math.max(r.c.receitas,r.c.despesas)));
  const nice=(()=>{const p=Math.pow(10,Math.floor(Math.log10(max)));const s=[1,2,2.5,5,10].find(s=>s*p>=max);return s*p;})();
  const W=Math.max(360,rows.length*64+70),H=230,L=58,B=28,top=12,gw=(W-L-8)/rows.length,bw=Math.min(18,gw/3);
  const y=v=>top+(H-top-B)*(1-v/nice);
  const descG="Gráfico de receitas e despesas por mês: "+rows.map(r=>nomeMes(r.k)+", receitas "+brl(r.c.receitas)+" e despesas "+brl(r.c.despesas)).join("; ")+".";
  let svg=`<svg class="grafmes" viewBox="0 0 ${W} ${H}" style="min-width:${Math.min(W,560)}px" role="img" aria-label="${esc(descG)}">`;
  [0,.5,1].forEach(f=>{const v=nice*f;svg+=`<line x1="${L}" x2="${W-8}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" font-size="11" fill="var(--muted)">${v>=1000?(v/1000).toLocaleString("pt-BR")+" mil":v.toLocaleString("pt-BR")}</text>`});
  rows.forEach((r,i)=>{const cx=L+gw*i+gw/2, cur=r.k===todayKey;
    const rx=Math.min(6,bw/2).toFixed(1), cl=cur?"cur":"past";
    svg+=`<rect class="${cl}" x="${cx-bw-1}" y="${y(r.c.receitas)}" width="${bw}" height="${Math.max(0,H-B-y(r.c.receitas))}" rx="${rx}" fill="var(--accent)"><title>${nomeMes(r.k)}: receitas ${brl(r.c.receitas)}</title></rect>`;
    svg+=`<rect class="${cl}" x="${cx+1}" y="${y(r.c.despesas)}" width="${bw}" height="${Math.max(0,H-B-y(r.c.despesas))}" rx="${rx}" fill="var(--c2)"><title>${nomeMes(r.k)}: despesas ${brl(r.c.despesas)}</title></rect>`;
    svg+=`<text x="${cx}" y="${H-10}" text-anchor="middle" font-size="11" fill="${cur?"var(--fg)":"var(--muted)"}" font-weight="${cur?700:400}">${ABR[kM(r.k)-1]}${kM(r.k)===1||i===0?" "+String(kY(r.k)).slice(2):""}</text>`;});
  svg+="</svg>";
  /* campos e formas no período */
  const cats=state.config.categorias;
  const catTot=cats.map((ct,i)=>({ct,i,v:rows.reduce((a,r)=>a+(r.c.porCat[ct.id]||0),0)})).filter(z=>z.v>0).sort((a,b)=>b.v-a.v);
  const fTot=FORMAS.map(([id,n])=>({id,n,v:rows.reduce((a,r)=>a+(r.c.porForma[id]||0),0)})).filter(z=>z.v>0).sort((a,b)=>b.v-a.v);
  const retroTopo=kM(todayKey)===12||kM(todayKey)===1;
  /* anel: quanto das receitas virou despesa no período */
  const pr=T.rec>0?T.des/T.rec:0, crA=pr<0.8?"var(--accent)":pr<1?"var(--warn)":"var(--bad)";
  const anel=T.rec>0?`<div class="card anelcard"><div class="anel"><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="none" stroke="var(--sunk)" stroke-width="5"/><circle class="anel-v" cx="22" cy="22" r="18" fill="none" stroke="${crA}" stroke-width="5" stroke-linecap="round" pathLength="100" stroke-dasharray="${Math.min(100,pr*100).toFixed(1)} 100" transform="rotate(-90 22 22)"/></svg><b style="color:${crA}">${Math.round(pr*100)}%</b></div>
    <div class="anel-t"><b>Das receitas viraram despesa</b><small>${pr<0.8?"Abaixo de 80% é um bom sinal.":pr<1?"Perto do limite: acima de 80% sobra pouco.":"Saiu mais do que entrou no período."} Média de gasto/mês: <b>${brl(media)}</b>.</small></div></div>`:"";
  return `${retroTopo?cardRetro():""}<div class="tiles">
    <div class="tile"><span class="lab">Receitas</span><span class="val">${brl(T.rec)}</span><span class="sub">${esc(periodo)}</span></div>
    <div class="tile"><span class="lab">Despesas</span><span class="val">${brl(T.des)}</span><span class="sub">${T.rec>0?Math.round(T.des/T.rec*100)+"% das receitas":"—"}</span></div>
    <div class="tile hero"><span class="lab">Saldo acumulado</span><span class="val ${ult.ac<0?"neg":"pos"}">${brl(ult.ac)}</span><span class="sub">até ${esc(abrMes(ult.k))}, com saldo inicial</span></div>
    <div class="tile"><span class="lab">Caixinha</span><span class="val">${brl(ult.cx)}</span><span class="sub">guardado até agora</span></div>
    <div class="tile"><span class="lab">Média de gasto/mês</span><span class="val">${brl(media)}</span><span class="sub">${comGasto.length} ${comGasto.length===1?"mês":"meses"} com lançamentos</span></div>
  </div>
  ${maior||melhor?`<div class="destaques">${maior?`<div><span class="lab">Mês que mais gastou</span><b>${esc(nomeMes(maior.k))}</b><span>${brl(maior.c.despesas)}</span></div>`:""}${melhor&&melhor.c.saldo>0?`<div><span class="lab">Melhor saldo</span><b>${esc(nomeMes(melhor.k))}</b><span class="pos">${brl(melhor.c.saldo)}</span></div>`:""}${catTot[0]?`<div><span class="lab">Categoria que mais pesou</span><b>${esc(catTot[0].ct.nome)}</b><span>${brl(catTot[0].v)} · ${Math.round(catTot[0].v/T.des*100)}%</span></div>`:""}</div>`:""}
  <div class="card chart"><div class="cardhead"><h2>Receitas x despesas</h2></div><div class="legend"><span><i style="background:var(--accent)"></i>Receitas</span><span><i style="background:var(--c2)"></i>Despesas</span></div><div class="tablewrap">${svg}</div></div>
  ${anel}${retroTopo?"":cardRetro()}
  ${cardAssinaturas(rows.length?T.rec/rows.length:0)}
  ${cardEtiquetas()}
  <div class="grid"><div class="card"><div class="cardhead"><h2>Mês a mês</h2><span class="num muted">valores em R$ · toque para abrir</span></div><div class="tablewrap"><table>
    <thead><tr><th>Mês</th><th>Receitas</th><th>Despesas</th><th>Saldo</th><th class="ac">Acumulado</th></tr></thead>
    <tbody>${rows.slice().reverse().map(r=>`<tr class="click ${r.k===todayKey?"cur":""}" data-open="${r.k}"><td>${esc(nomeMes(r.k))}${r.k===todayKey?' <small class="muted">atual</small>':""}</td><td>${brlT(r.c.receitas)}</td><td>${brlT(r.c.despesas)}</td><td class="${r.c.saldo<0?"neg":""}">${brlT(r.c.saldo)}</td><td class="ac ${r.ac<0?"neg":""}">${brlT(r.ac)}</td></tr>`).join("")}</tbody>
    <tfoot><tr><td>Total</td><td>${brlT(T.rec)}</td><td>${brlT(T.des)}</td><td>${brlT(T.sal)}</td><td class="ac">${brlT(ult.ac)}</td></tr></tfoot>
  </table></div></div>
  <div class="col"><div class="card"><h2>Para onde foi o dinheiro</h2>${catTot.length?`<div class="donutwrap">${donut(catTot.map(z=>({nome:z.ct.nome,v:z.v,cor:catColor(z.ct.id)})),T.des,brl(T.des),"no período")}<div class="bars">${catTot.map(z=>`<div class="bar" style="--dot:${catColor(z.ct.id)}"><div class="t"><b>${esc(z.ct.nome)}</b><span class="num">${brl(z.v)} · ${Math.round(z.v/T.des*100)}%</span></div><div class="track"><div style="width:${(z.v/catTot[0].v*100).toFixed(1)}%"></div></div><div class="delta">média ${brl(z.v/ks.length)}/mês</div></div>`).join("")}</div></div>`:`<div class="empty-state">Assim que você lançar despesas, o total por categoria aparece aqui.</div>`}</div>
  ${fTot.length?`<div class="card"><h2>Forma de pagamento no período</h2><div class="bars">${fTot.map(x=>`<div class="bar" style="--dot:var(--fm-${x.id})"><div class="t"><b>${esc(x.n)}</b><span class="num">${brl(x.v)} · ${Math.round(x.v/T.des*100)}%</span></div><div class="track"><div style="width:${(x.v/fTot[0].v*100).toFixed(1)}%"></div></div></div>`).join("")}</div></div>`:""}</div></div>`;
}

/* ---------- etiquetas: total por #etiqueta ---------- */
function cardEtiquetas(){
  const tot={};
  Object.keys(state.months).forEach(k=>((state.months[k]||{}).gastos||[]).forEach(g=>(g.tags||[]).forEach(t=>{ const x=tot[t]||(tot[t]={v:0,n:0,meses:new Set()}); x.v+=Number(g.valor)||0; x.n++; x.meses.add(k); })));
  state.config.parcelas.forEach(pp=>(pp.tags||[]).forEach(t=>{ const x=tot[t]||(tot[t]={v:0,n:0,meses:new Set()}); x.v+=pp.total; x.n++; x.meses.add(pp.compra); }));
  const ls=Object.entries(tot).sort((a,b)=>b[1].v-a[1].v); if(!ls.length) return "";
  const max=ls[0][1].v||1;
  return `<div class="card" id="etiquetas"><div class="cardhead"><h2>Etiquetas</h2><span class="num muted">toque para ver os lançamentos</span></div>
  <div class="bars">${ls.slice(0,12).map(([t,x])=>`<button type="button" class="bar tagbar" data-vertag="${esc(t)}" style="--dot:var(--accent)"><div class="t"><b>#${esc(t)}</b><span class="num">${brl(x.v)} · ${x.n} lançamento${x.n===1?"":"s"}</span></div><div class="track"><div style="width:${Math.max(3,x.v/max*100).toFixed(1)}%"></div></div></button>`).join("")}</div></div>`;
}

/* ---------- assinaturas: o que se repete todo mês ---------- */
function assinaturas(){
  const fixos=state.config.fixos.filter(f=>f.desde<=todayKey&&(!f.ate||f.ate>=todayKey)).slice().sort((a,b)=>b.valor-a.valor);
  const parcelas=parcelasDoMes(todayKey).map(p=>{ return Object.assign({},p,{falta:faltaParcelas(p.total,p.n,p.idx),fim:shiftKey(todayKey,p.n-p.idx)}); }).sort((a,b)=>b.valor-a.valor);
  /* gastos com a mesma descrição em pelo menos 3 dos últimos 4 meses que ainda não são conta fixa */
  const ks=[0,1,2,3].map(i=>shiftKey(todayKey,-i)), nomesFixos=new Set(state.config.fixos.map(f=>norm(f.nome))), mapa={};
  ks.forEach(k=>((state.months[k]||{}).gastos||[]).forEach(g=>{ const d=norm(g.desc); if(!d||nomesFixos.has(d)) return;
    const x=mapa[d]||(mapa[d]={nome:g.desc.trim(),meses:new Set(),vals:[],cat:g.cat,forma:g.forma,dia:g.dia}); if(x.nome===x.nome.toLowerCase()&&/[A-ZÀ-Ý]/.test(g.desc)) x.nome=g.desc.trim(); if(!x.meses.has(k)){ x.meses.add(k); x.vals.push(g.valor); } }));
  const repetidos=Object.values(mapa).filter(x=>x.meses.size>=3).map(x=>Object.assign(x,{media:Math.round(x.vals.reduce((a,v)=>a+v,0)/x.vals.length*100)/100})).sort((a,b)=>b.media-a.media);
  const mes=fixos.reduce((a,f)=>a+f.valor,0), mesParc=parcelas.reduce((a,p)=>a+p.valor,0);
  return {fixos,parcelas,repetidos,mes,mesParc};
}
function cardAssinaturas(rendaMedia){
  const A=assinaturas(); ui.repetidos=A.repetidos;
  const tot=A.mes+A.mesParc;
  if(!A.fixos.length&&!A.parcelas.length&&!A.repetidos.length) return `<div class="card"><h2>Assinaturas e contas fixas</h2>
    <p class="hint">Aqui aparece tudo o que se repete todo mês (aluguel, internet, Netflix, academia...) com o total por mês e por ano. Cadastre como conta fixa e elas entram sozinhas todo mês.</p>
    <button class="btn" type="button" data-novo="fixo">+ Nova conta fixa</button></div>`;
  return `<div class="card assin" id="assinaturas"><div class="cardhead"><h2>Assinaturas e contas fixas</h2><span class="tag">${brl(tot)}/mês</span></div>
  <div class="assintot"><div><span class="lab">Por mês</span><b>${brl(A.mes)}</b><small>contas fixas</small></div><div><span class="lab">Por ano</span><b>${brl(A.mes*12)}</b><small>se nada mudar</small></div>${rendaMedia>0?`<div><span class="lab">Da sua renda</span><b>${Math.round(tot/rendaMedia*100)}%</b><small>fixas + parcelas</small></div>`:""}</div>
  ${A.fixos.length?`<div class="subhead">Contas fixas (${A.fixos.length})</div><div>${A.fixos.map(f=>`<button type="button" class="item" data-edit="fixo" data-id="${esc(f.id)}" style="--dot:${catColor(f.cat)}"><span class="pill">dia ${pad2(f.dia)}</span><span class="desc"><b>${esc(f.nome)}</b><small>${esc(catName(f.cat))} · ${brl(f.valor*12)} por ano</small></span><span class="v">${brl(f.valor)}</span></button>`).join("")}</div>`:""}
  ${A.parcelas.length?`<div class="subhead">Parcelas em andamento (${brl(A.mesParc)}/mês)</div><div>${A.parcelas.map(p=>`<button type="button" class="item" data-edit="parcela" data-id="${esc(p.id)}" style="--dot:${catColor(p.cat)}"><span class="pill">${p.idx}/${p.n}</span><span class="desc"><b>${esc(p.desc||"Compra parcelada")}</b><small>${p.idx===p.n?"última parcela":"termina em "+esc(abrMes(p.fim))} · faltam ${brl(p.falta)}</small></span><span class="v">${brl(p.valor)}</span></button>`).join("")}</div>`:""}
  ${A.repetidos.length?`<div class="subhead">Parece que se repete</div><p class="hint">Estes gastos apareceram em quase todos os últimos meses. Se for assinatura, transforme em conta fixa para entrar sozinha.</p>
    <div>${A.repetidos.map((r,i)=>`<div class="item repet" style="--dot:${catColor(r.cat)}"><span class="desc"><b>${esc(r.nome)}</b><small>${r.meses.size} dos últimos 4 meses · média ${brl(r.media)}</small></span><button class="btn ghost mini" type="button" data-virafixo="${i}">Virar conta fixa</button></div>`).join("")}</div>`:""}
  </div>`;
}
function virarFixo(i){
  const r=(ui.repetidos||[])[i]; if(!r) return;
  const id="f"+uidGen(), desde=shiftKey(todayKey,1);
  state.config.fixos.push({id,nome:r.nome,cat:r.cat,valor:r.media,dia:Math.min(31,Math.max(1,r.dia||1)),forma:r.forma||"debito",desde,ate:null,contaId:null});
  save("config"); render();
  toast("“"+r.nome+"” virou conta fixa a partir de "+abrMes(desde)+".","Desfazer",()=>apagarItem("config","fixos",id,"Conta fixa desfeita."));
}

/* ---------- modo viagem ---------- */
const MOEDAS=[["USD","Dólar americano"],["EUR","Euro"],["ARS","Peso argentino"],["CLP","Peso chileno"],["UYU","Peso uruguaio"],["PYG","Guarani (Paraguai)"],["COP","Peso colombiano"],["PEN","Sol (Peru)"],["BOB","Boliviano"],["MXN","Peso mexicano"],["GBP","Libra esterlina"],["CAD","Dólar canadense"],["AUD","Dólar australiano"],["CHF","Franco suíço"],["JPY","Iene"],["CNY","Yuan"],["BRL","Real (viagem no Brasil)"]];
function fmtMoeda(v,m){ try{ return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:m}); }catch(e){ return m+" "+Number(v||0).toFixed(2); } }
const fmtCot=n=>Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:4});
const lerCot=t=>{ const n=Number(String(t||"").trim().replace(/\./g,"").replace(",",".")); return isFinite(n)&&n>0?n:NaN; };
const emReais=(valor,vg)=>Math.round((Number(valor)||0)*(vg.moeda==="BRL"?1:vg.cotacao)*(1+(vg.moeda==="BRL"?0:(vg.taxa||0))/100)*100)/100;
const viagemNoDia=iso=>(state.config.viagens||[]).find(v=>v.inicio&&v.fim&&iso>=v.inicio&&iso<=v.fim)||null;
const viagemAtiva=()=>viagemNoDia(hojeISO());
const nomeViagem=id=>((state.config.viagens||[]).find(v=>v.id===id)||{}).nome||"";
function gastosViagem(id){ const out=[]; Object.keys(state.months).sort().forEach(k=>((state.months[k]||{}).gastos||[]).forEach(g=>{ if(g.viagemId===id) out.push(Object.assign({k},g)); }));
  (state.config.parcelas||[]).forEach(pp=>{ if(pp.viagemId===id) out.push(Object.assign({},pp,{k:pp.compra,valor:pp.total,desc:(pp.desc||"Compra parcelada")+" ("+pp.n+"x)",orig:pp.orig?Object.assign({},pp.orig):null})); });
  return out; }
function resumoViagem(vg){
  const gs=gastosViagem(vg.id), total=Math.round(gs.reduce((a,g)=>a+(Number(g.valor)||0),0)*100)/100;
  const emMoeda=gs.reduce((a,g)=>a+(g.orig&&g.orig.moeda===vg.moeda?g.orig.valor:(vg.moeda==="BRL"?g.valor:0)),0);
  const porCat={}; gs.forEach(g=>porCat[g.cat]=(porCat[g.cat]||0)+(Number(g.valor)||0));
  const dias=vg.inicio&&vg.fim?Math.max(1,Math.round((new Date(vg.fim+"T12:00").getTime()-new Date(vg.inicio+"T12:00").getTime())/86400000)+1):1;
  const hoje=hojeISO(), passados=vg.inicio&&hoje>=vg.inicio?Math.min(dias,Math.round((new Date((hoje<vg.fim?hoje:vg.fim)+"T12:00").getTime()-new Date(vg.inicio+"T12:00").getTime())/86400000)+1):0;
  return {gs,total,emMoeda,porCat,dias,passados,porDia:passados?total/passados:0,resta:vg.orcamento?vg.orcamento-total:null};
}
const estadoViagem=vg=>{ const h=hojeISO(); return !vg.inicio||!vg.fim?"":h<vg.inicio?"proxima":h>vg.fim?"encerrada":"ativa"; };
function cardViagemMes(){
  const vg=viagemAtiva(); if(!vg) return "";
  const r=resumoViagem(vg), pct=vg.orcamento?Math.min(100,r.total/vg.orcamento*100):0;
  return `<div class="card viagemcard"><div class="cardhead"><h2>${ICON.aviao}${esc(vg.nome)}</h2><span class="tag">dia ${r.passados} de ${r.dias}</span></div>
    <div class="vgnums"><div><span class="lab">Gasto na viagem</span><b>${brl(r.total)}</b>${vg.moeda!=="BRL"?`<small>${fmtMoeda(r.emMoeda,vg.moeda)} lançados em ${vg.moeda}</small>`:""}</div>
    ${vg.orcamento?`<div><span class="lab">${r.resta>=0?"Ainda pode gastar":"Passou do orçamento"}</span><b class="${r.resta<0?"neg":"pos"}">${brl(Math.abs(r.resta))}</b><small>de ${brl(vg.orcamento)}</small></div>`:""}
    ${vg.moeda!=="BRL"?`<div><span class="lab">Cotação usada</span><b>1 ${esc(vg.moeda)} = ${brl(vg.cotacao)}</b><small>${vg.taxa?"+ "+fmtCot(vg.taxa)+"% de taxas":"sem taxas extras"}</small></div>`:""}</div>
    ${vg.orcamento?`<div class="track ${r.resta<0?"over":pct>=80?"warn":""}"><div style="width:${pct.toFixed(1)}%"></div></div>`:""}
    <div class="row2"><button class="btn" type="button" data-novo="gasto">+ Gasto da viagem</button><button class="btn ghost" type="button" data-edit="viagem" data-id="${esc(vg.id)}">Ver viagem</button></div></div>`;
}
function cardViagens(){
  const vs=(state.config.viagens||[]).slice().sort((a,b)=>String(b.inicio||"").localeCompare(String(a.inicio||"")));
  const rot={ativa:"acontecendo",proxima:"próxima",encerrada:"encerrada"};
  return `<div class="card" id="viagens"><div class="cardhead"><h2>Modo viagem</h2>${viagemAtiva()?'<span class="tag">em viagem</span>':""}</div>
  ${vs.length?`<div>${vs.map(vg=>{ const r=resumoViagem(vg), e=estadoViagem(vg); return `<button type="button" class="item" data-edit="viagem" data-id="${esc(vg.id)}" style="--dot:var(--accent)"><span class="pill">${esc(rot[e]||"")}</span><span class="desc"><b>${esc(vg.nome)}</b><small>${dataCurta(vg.inicio)} a ${dataCurta(vg.fim)} · ${esc(vg.moeda)}${vg.orcamento?" · orçamento "+brl(vg.orcamento):""}</small></span><span class="v">${brl(r.total)}</span></button>`; }).join("")}</div>`
    :`<p class="hint">Vai viajar? Cadastre a viagem com a moeda do destino. Durante a viagem, os gastos podem ser lançados na moeda de lá e o app converte para real, soma tudo e mostra quanto ainda dá para gastar.</p>`}
  <button class="btn ghost" type="button" data-novo="viagem">+ Nova viagem</button></div>`;
}
async function buscarCotacao(){
  const sel=document.getElementById("s-vmoeda"), out=document.getElementById("s-vcotinfo"), inp=document.getElementById("s-vcot"); if(!sel||!inp) return;
  const m=sel.value; if(m==="BRL"){ inp.value="1"; return; }
  out.textContent="Buscando a cotação de hoje…";
  try{ const r=await fetch("https://open.er-api.com/v6/latest/"+m,{cache:"no-store"}), j=await r.json(), v=j&&j.rates&&j.rates.BRL;
    if(!(v>0)) throw 0; inp.value=fmtCot(v); out.innerHTML="Cotação comercial de hoje: "+esc(fmtMoeda(1,m))+" = "+esc(brl(v))+". Fonte: <a href=\"https://www.exchangerate-api.com\" target=\"_blank\" rel=\"noopener\">ExchangeRate-API</a>. O cartão costuma cobrar um pouco mais.";
  }catch(e){ out.textContent="Não deu para buscar agora. Digite a cotação (quanto vale 1 "+m+" em reais)."; }
}
/* bloco "gasto da viagem" dentro da janela de despesa */
function blocoViagemGasto(it,k){
  const vs=state.config.viagens||[]; if(!vs.length) return "";
  const doItem=it&&it.viagemId&&vs.find(v=>v.id===it.viagemId), ativa=viagemAtiva(), vg=doItem||(!it?ativa:null)||ativa; if(!vg&&!doItem) return "";
  const on=it?!!doItem:!!ativa, moedaSel=it&&doItem&&it.orig?it.orig.moeda:(it?"BRL":vg.moeda);
  return `<div class="viagembox"><label class="switch"><input type="checkbox" id="s-vgon" ${on?"checked":""}><span></span>${ICON.aviao} Gasto da viagem</label>
    <div id="s-vgdet" ${on?"":"hidden"}>
      ${vs.length>1?`<label class="f">Viagem<select class="in" id="s-vgid">${vs.map(v=>`<option value="${esc(v.id)}" ${v.id===vg.id?"selected":""}>${esc(v.nome)}</option>`).join("")}</select></label>`:`<input type="hidden" id="s-vgid" value="${esc(vg.id)}">`}
      <div class="seg" role="radiogroup" aria-label="Moeda do valor" id="s-vgseg">${vg.moeda!=="BRL"?`<input type="radio" name="s-vgmoeda" id="s-vgm1" value="${esc(vg.moeda)}" ${moedaSel!=="BRL"?"checked":""}><label for="s-vgm1">Em ${esc(vg.moeda)}</label>`:""}<input type="radio" name="s-vgmoeda" id="s-vgm2" value="BRL" ${moedaSel==="BRL"||vg.moeda==="BRL"?"checked":""}><label for="s-vgm2">Em reais</label></div>
      <p class="hint" id="s-vgconv"></p></div></div>`;
}
function atualizaVg(){
  const on=document.getElementById("s-vgon"); if(!on) return;
  const det=document.getElementById("s-vgdet"); det.hidden=!on.checked;
  const vg=(state.config.viagens||[]).find(v=>v.id===((document.getElementById("s-vgid")||{}).value)); if(!vg) return;
  const seg=document.getElementById("s-vgseg"); if(seg&&seg.dataset.moeda!==vg.moeda){ /* troca de viagem: refaz as opções de moeda */
    const atual=(document.querySelector('#sheet input[name="s-vgmoeda"]:checked')||{}).value, estr=vg.moeda!=="BRL"&&(!seg.dataset.moeda||atual!=="BRL");
    seg.innerHTML=(vg.moeda!=="BRL"?`<input type="radio" name="s-vgmoeda" id="s-vgm1" value="${esc(vg.moeda)}" ${estr?"checked":""}><label for="s-vgm1">Em ${esc(vg.moeda)}</label>`:"")+`<input type="radio" name="s-vgmoeda" id="s-vgm2" value="BRL" ${estr?"":"checked"}><label for="s-vgm2">Em reais</label>`; seg.dataset.moeda=vg.moeda; }
  const moeda=(document.querySelector('#sheet input[name="s-vgmoeda"]:checked')||{}).value||"BRL", estrangeira=on.checked&&moeda!=="BRL";
  const parc=(document.getElementById("s-parc")||{}).checked, lab=document.getElementById("s-valorlab"); if(lab) lab.textContent=(parc?"Valor total da compra":"Valor")+(estrangeira?" em "+moeda:"");
  const v=parseMoney((document.getElementById("s-valor")||{}).value), conv=document.getElementById("s-vgconv");
  if(conv) conv.innerHTML=estrangeira?(v>0?"≈ <b>"+esc(brl(emReais(v,vg)))+"</b> · ":"")+esc(fmtMoeda(1,moeda))+" = "+esc(brl(vg.cotacao))+(vg.taxa?" + "+esc(fmtCot(vg.taxa))+"% de taxas":""):(on.checked?"O valor em reais entra na viagem "+esc(vg.nome)+".":"");
}

/* ---------- dívidas com pessoas ---------- */
const hojeISO=()=>{ const d=new Date(); return d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate()); };
const dataCurta=iso=>iso?iso.slice(8,10)+"/"+iso.slice(5,7)+(iso.slice(0,4)!==String(new Date().getFullYear())?"/"+iso.slice(2,4):""):"";
const pagoDiv=x=>Math.round(x.pags.reduce((a,p)=>a+p.valor,0)*100)/100;
const restaDiv=x=>Math.max(0,Math.round((x.valor-pagoDiv(x))*100)/100);
const quitada=x=>restaDiv(x)<0.005;
function diasAte(iso){ if(!iso) return null; const a=new Date(); a.setHours(0,0,0,0); const [y,m,d]=iso.split("-").map(Number); return Math.round((new Date(y,m-1,d).getTime()-a.getTime())/86400000); }
function cardDividas(){
  const ds=state.config.dividas, abertas=ds.filter(x=>!quitada(x)), q=ds.filter(quitada);
  const rec=abertas.filter(x=>x.tipo==="receber").reduce((a,x)=>a+restaDiv(x),0), pag=abertas.filter(x=>x.tipo==="pagar").reduce((a,x)=>a+restaDiv(x),0);
  const pessoas={}; abertas.forEach(x=>{ const k=norm(x.pessoa); (pessoas[k]=pessoas[k]||{nome:x.pessoa,itens:[],saldo:0}).itens.push(x); pessoas[k].saldo+=x.tipo==="receber"?restaDiv(x):-restaDiv(x); });
  const linha=x=>{ const dd=diasAte(x.venc), atras=dd!=null&&dd<0, r=restaDiv(x);
    return `<button type="button" class="item divrow ${atras?"atras":""}" data-edit="divida" data-id="${esc(x.id)}" style="--dot:${x.tipo==="receber"?"var(--good)":"var(--bad)"}"><span class="pill">${x.tipo==="receber"?"te deve":"você deve"}</span><span class="desc"><b class="${x.desc?"":"empty"}">${esc(x.desc||"sem descrição")}</b><small>${x.pags.length?"pago "+brl(pagoDiv(x))+" de "+brl(x.valor)+" · ":""}${x.venc?(atras?"venceu "+dataCurta(x.venc):dd===0?"vence hoje":"vence "+dataCurta(x.venc)):x.data?"desde "+dataCurta(x.data):""}</small></span><span class="v ${x.tipo==="receber"?"pos":"neg"}">${brl(r)}</span></button>`; };
  return `<div class="card" id="dividas"><div class="cardhead"><h2>Dívidas com pessoas</h2>${abertas.length?`<span class="tag">${abertas.length} em aberto</span>`:""}</div>
  ${ds.length?`<div class="assintot"><div><span class="lab">Te devem</span><b class="pos">${brl(rec)}</b></div><div><span class="lab">Você deve</span><b class="neg">${brl(pag)}</b></div><div><span class="lab">Saldo</span><b class="${rec-pag<0?"neg":""}">${brl(rec-pag)}</b></div></div>`
    :`<p class="hint">Anote quem te deve e para quem você deve: empréstimos, divisão de conta, vaquinha. Registre os pagamentos aos poucos e o app mostra quanto falta.</p>`}
  ${Object.values(pessoas).sort((a,b)=>Math.abs(b.saldo)-Math.abs(a.saldo)).map(pp=>`<div class="subhead pessoa"><span>${esc(pp.nome)}</span><span class="${pp.saldo>=0?"pos":"neg"}">${pp.saldo>=0?"te deve "+brl(pp.saldo):"você deve "+brl(-pp.saldo)}</span></div>${pp.itens.map(linha).join("")}`).join("")}
  ${q.length?`<button class="link" type="button" data-verquit="1">${ui.verQuit?"Esconder":"Ver"} quitadas (${q.length})</button>${ui.verQuit?`<div class="quitadas">${q.map(x=>`<button type="button" class="item" data-edit="divida" data-id="${esc(x.id)}" style="--dot:var(--line)"><span class="pill">quitada</span><span class="desc"><b>${esc(x.pessoa)}${x.desc?" · "+esc(x.desc):""}</b><small>${x.tipo==="receber"?"te devia":"você devia"} ${brl(x.valor)}</small></span><span class="v muted">${brl(x.valor)}</span></button>`).join("")}</div>`:""}`:""}
  <div class="row2"><button class="btn ghost" type="button" data-novo="divida" data-dtipo="receber">+ Alguém me deve</button><button class="btn ghost" type="button" data-novo="divida" data-dtipo="pagar">+ Eu devo</button></div>
  <button class="link" type="button" data-novo="simulador">Simular quitação de uma dívida com juros</button></div>`;
}
const catOutros=()=>(state.config.categorias.find(c=>/outro/.test(norm(c.nome)))||state.config.categorias[state.config.categorias.length-1]||{}).id;
function registrarPagDiv(tudo){
  const s=ui.sheet, x=itemAtual(); if(!x) return;
  const r=restaDiv(x), campo=(document.getElementById("s-pagval")||{}).value||"";
  const v=tudo?r:(campo.trim()?parseMoney(campo):r);
  if(!(v>0)) return erroSheet("Informe quanto foi pago.","s-pagval");
  if(v>r+0.005) return erroSheet("O valor é maior do que falta ("+brl(r)+").","s-pagval");
  const pid=uidGen(); x.pags.push({id:pid,valor:Math.round(v*100)/100,data:hojeISO()});
  const lanca=(document.getElementById("s-paglanca")||{}).checked;
  if(lanca){ const m=getMonth(todayKey), dia=today.getDate();
    if(x.tipo==="receber") m.avulsos.push(marcaPor({id:"dv"+pid,dia,valor:v,desc:"Recebido de "+x.pessoa}));
    else m.gastos.push(marcaPor({id:"dv"+pid,dia,cat:catOutros(),valor:v,desc:"Pago a "+x.pessoa,forma:"pix"}));
    save(todayKey); }
  save("config"); render(); renderSheet();
  toast(quitada(x)?"Dívida quitada!":brl(v)+" registrado. Faltam "+brl(restaDiv(x))+"."+(lanca?" Lançado no mês.":""));
}

/* ---------- retrospectiva do ano ---------- */
const DIAS_SEM=["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
function anosRetro(){ const ini=inicioKey(); if(!ini) return []; return [...new Set(MESES.filter(k=>k>=ini&&k<=todayKey).map(kY))].sort(); }
function dadosRetro(ano){
  const ini=inicioKey(); if(!ini) return null;
  const ks=MESES.filter(k=>kY(k)===ano&&k>=ini&&k<=todayKey); if(!ks.length) return null;
  const rows=ks.map(k=>({k,c:calc(k)}));
  const t=rows.reduce((a,r)=>({rec:a.rec+r.c.receitas,des:a.des+r.c.despesas,sal:a.sal+r.c.saldo,gu:a.gu+r.c.guardado,re:a.re+r.c.retirado,fx:a.fx+r.c.fixosTotal}),{rec:0,des:0,sal:0,gu:0,re:0,fx:0});
  const porCat={}; rows.forEach(r=>{ for(const id in r.c.porCat) porCat[id]=(porCat[id]||0)+r.c.porCat[id]; });
  const cats=Object.entries(porCat).filter(([,v])=>v>0).map(([id,v])=>({id,v,nome:catName(id)})).sort((a,b)=>b.v-a.v);
  const gastos=ks.flatMap(k=>((state.months[k]||{}).gastos||[]).map(g=>Object.assign({k},g)));
  const maior=gastos.slice().sort((a,b)=>b.valor-a.valor)[0]||null;
  const sem=[0,0,0,0,0,0,0], semN=[0,0,0,0,0,0,0]; gastos.forEach(g=>{ const d=new Date(kY(g.k),kM(g.k)-1,g.dia).getDay(); sem[d]+=g.valor; semN[d]++; });
  const diaTop=sem.some(v=>v>0)?sem.indexOf(Math.max(...sem)):null;
  const comGasto=rows.filter(r=>r.c.despesas>0);
  const caro=comGasto.slice().sort((a,b)=>b.c.despesas-a.c.despesas)[0]||null, barato=comGasto.length>1?comGasto.slice().sort((a,b)=>a.c.despesas-b.c.despesas)[0]:null;
  const melhor=rows.slice().sort((a,b)=>b.c.saldo-a.c.saldo)[0];
  const nLanc=ks.reduce((a,k)=>{ const m=/** @type {Partial<Mes>} */(state.months[k]||{}); return a+(m.gastos||[]).length+(m.avulsos||[]).length+(m.caixinha||[]).length; },0);
  const ult=ks[ks.length-1], metasFeitas=state.config.metas.filter(mt=>{ try{ return infoMeta(mt,ult).feita; }catch(e){ return false; } });
  return {ano,ks,rows,t,cats,maior,diaTop,semN,caro,barato,melhor,nLanc,metasFeitas,taxa:t.rec>0?t.sal/t.rec:0,parcial:ks[ks.length-1]===todayKey||kY(todayKey)===ano};
}
function slidesRetro(d){
  const per=abrMes(d.ks[0])+" a "+abrMes(d.ks[d.ks.length-1]);
  const sl=[];
  sl.push({cls:"capa",html:`<span class="rlab">Retrospectiva</span><b class="rbig">${d.ano}</b><p>O seu ${d.parcial?"ano até agora":"ano"} no Monetra: <b>${d.ks.length} ${d.ks.length===1?"mês":"meses"}</b> (${esc(per)}) e <b>${d.nLanc} lançamentos</b>.</p>
    ${anosRetro().length>1?`<div class="ranos">${anosRetro().map(a=>`<button type="button" class="${a===d.ano?"on":""}" data-rano="${a}">${a}</button>`).join("")}</div>`:""}`});
  sl.push({cls:"",html:`<span class="rlab">Entrou e saiu</span>
    <div class="rpar"><div><small>Entrou</small><b class="pos">${brl(d.t.rec)}</b></div><div><small>Saiu</small><b>${brl(d.t.des)}</b></div></div>
    <p>${d.t.sal>=0?`Sobraram <b class="pos">${brl(d.t.sal)}</b>. Você ficou com <b>${Math.round(d.taxa*100)}%</b> de tudo o que entrou.`:`Faltaram <b class="neg">${brl(-d.t.sal)}</b>: saiu mais do que entrou.`}</p>
    <p class="rsub">Em média, ${brl(d.t.des/d.ks.length)} de gastos por mês.</p>`});
  if(d.cats.length) sl.push({cls:"",html:`<span class="rlab">Para onde foi</span><p>O que mais pesou foi <b>${esc(d.cats[0].nome)}</b>, com ${brl(d.cats[0].v)}.</p>
    <div class="rcats">${d.cats.slice(0,5).map((c,i)=>`<div class="rcat"><span class="n">${i+1}</span><span class="t"><b>${esc(c.nome)}</b><i style="width:${Math.max(4,Math.round(c.v/d.cats[0].v*100))}%;background:${catColor(c.id)}"></i></span><span class="v">${brl(c.v)}<small>${d.t.des>0?Math.round(c.v/d.t.des*100):0}%</small></span></div>`).join("")}</div>`});
  if(d.caro) sl.push({cls:"",html:`<span class="rlab">Altos e baixos</span>
    <div class="rmeses"><div><small>Mês que mais gastou</small><b>${esc(nomeMes(d.caro.k))}</b><span>${brl(d.caro.c.despesas)}</span></div>
    ${d.barato?`<div><small>Mês mais econômico</small><b>${esc(nomeMes(d.barato.k))}</b><span>${brl(d.barato.c.despesas)}</span></div>`:""}
    ${d.melhor&&d.melhor.c.saldo>0?`<div><small>Melhor saldo</small><b>${esc(nomeMes(d.melhor.k))}</b><span class="pos">${brl(d.melhor.c.saldo)}</span></div>`:""}</div>`});
  if(d.maior) sl.push({cls:"",html:`<span class="rlab">Curiosidades</span>
    <p>Seu maior gasto foi <b>${esc(d.maior.desc||catName(d.maior.cat))}</b>: <b>${brl(d.maior.valor)}</b> em ${pad2(d.maior.dia)}/${pad2(kM(d.maior.k))}.</p>
    ${d.diaTop!=null?`<p>O dia da semana em que você mais gasta é <b>${DIAS_SEM[d.diaTop]}</b>${d.diaTop===0||d.diaTop===6?" (fim de semana!)":""}.</p>`:""}
    ${d.t.fx>0?`<p>As contas fixas somaram <b>${brl(d.t.fx)}</b> no período.</p>`:""}`});
  if(d.t.gu>0||d.metasFeitas.length) sl.push({cls:"",html:`<span class="rlab">Caixinha</span>
    <b class="rbig2 pos">${brl(d.t.gu-d.t.re)}</b><p>${d.t.gu-d.t.re>=0?"guardados a mais na caixinha":"tirados da caixinha"} no período (guardou ${brl(d.t.gu)}${d.t.re?", retirou "+brl(d.t.re):""}).</p>
    ${d.metasFeitas.length?`<p>Metas atingidas: <b>${d.metasFeitas.map(m=>esc(m.nome)).join(", ")}</b>.</p>`:""}`});
  const frase=d.taxa>=0.2?"Mandou muito bem: guardou mais de 20% do que entrou.":d.taxa>0?"Fechou no azul. Dá para mirar em guardar um pouco mais no próximo ano.":"Ano apertado. Use as metas e os limites por categoria para virar o jogo.";
  sl.push({cls:"fim",html:`<span class="rlab">Resumo de ${d.ano}</span><p class="rfrase">${frase}</p>
    <div class="rpar"><div><small>Entrou</small><b>${brl(d.t.rec)}</b></div><div><small>Saiu</small><b>${brl(d.t.des)}</b></div></div>
    <button class="btn wide" type="button" data-rshare="1">Compartilhar resumo</button>`});
  return sl;
}
function textoRetro(d){ return "Meu "+d.ano+" no Monetra\n"+"Entrou: "+brl(d.t.rec)+"\nSaiu: "+brl(d.t.des)+"\n"+(d.t.sal>=0?"Sobrou: "+brl(d.t.sal)+" ("+Math.round(d.taxa*100)+"%)":"Faltou: "+brl(-d.t.sal))+(d.cats[0]?"\nO que mais pesou: "+d.cats[0].nome:"")+"\n"+location.origin+location.pathname; }
async function compartilharRetro(){
  const d=dadosRetro(ui.sheet.ano); if(!d) return; const txt=textoRetro(d);
  try{ if(navigator.share){ await navigator.share({title:"Minha retrospectiva "+d.ano,text:txt}); return; } }catch(e){ if(e&&e.name==="AbortError") return; }
  try{ await navigator.clipboard.writeText(txt); toast("Resumo copiado."); }catch(e){ toast("Não foi possível copiar."); }
}
function cardRetro(){
  const anos=anosRetro(); if(!anos.length) return "";
  const a=anos[anos.length-1];
  return `<div class="card retrocard"><div><span class="rlab">Retrospectiva</span><b>Seu ${a} em números</b><small>Quanto entrou e saiu, onde mais gastou, seus recordes e curiosidades.</small></div><button class="btn" type="button" data-retro="${a}">Ver retrospectiva</button></div>`;
}

/* ---------- aba Ajustes ---------- */
function viewAjustes(){
  const cf=state.config;
  const ativos=cf.fixos.filter(f=>!f.ate||f.ate>=todayKey), encerrados=cf.fixos.filter(f=>f.ate&&f.ate<todayKey);
  const parc=cf.parcelas.map(p=>{ const cc=p.forma==="credito"?cartaoDe(p):null; const prim=cartaoOk(cc)?faturaMes(p.compra,p.dia,cc):p.compra; const pagas=Math.max(0,Math.min(p.n,entre(prim,todayKey)+1)); return {p,prim,pagas,ultima:shiftKey(prim,p.n-1)}; });
  const abertas=parc.filter(x=>x.ultima>=todayKey), quitadas=parc.length-abertas.length;
  return `<div class="grid"><div class="col">
    ${secaoMes("aj-fixas","Contas fixas",ativos.length?brl(soma(ativos))+"/mês · "+ativos.length+(ativos.length===1?" conta":" contas"):"nenhuma ainda",ICON.repete,`<div class="card"><div class="cardhead"><h2>Contas fixas</h2><span class="num muted">${ativos.length?brl(soma(ativos))+"/mês":""}</span></div>
    ${ativos.length?`<div>${ativos.slice().sort((a,b)=>a.dia-b.dia).map(f=>`<button type="button" class="item" data-edit="fixo" data-id="${esc(f.id)}" style="--dot:${catColor(f.cat)}"><span class="pill">dia ${pad2(f.dia)}</span><span class="desc"><b>${esc(f.nome)}</b><small>${esc(catName(f.cat))} · ${esc(formaNome(f.forma))}${f.desde>todayKey?" · começa em "+abrMes(f.desde):""}</small></span><span class="v">${brl(f.valor)}</span></button>`).join("")}</div>`:`<p class="hint">Nenhuma conta fixa ainda. Exemplos: aluguel, internet, plano de celular, academia, streaming.</p>`}
    ${encerrados.length?`<p class="hint">${encerrados.length} conta(s) encerrada(s) continuam aparecendo nos meses em que valiam.</p>`:""}
    <button class="btn ghost" data-novo="fixo" type="button">+ Nova conta fixa</button></div>`)}

    ${secaoMes("aj-parc","Compras parceladas",abertas.length?abertas.length+" em andamento":"nenhuma em andamento",ICON.cartao,`<div class="card"><div class="cardhead"><h2>Compras parceladas</h2><span class="num muted">${abertas.length?abertas.length+" em andamento":""}</span></div>
    ${abertas.length?`<div>${abertas.map(x=>`<button type="button" class="item" data-edit="parcela" data-id="${esc(x.p.id)}" style="--dot:${catColor(x.p.cat)}"><span class="pill">${x.pagas}/${x.p.n}</span><span class="desc"><b>${esc(x.p.desc||"Compra parcelada")}</b><small>${x.p.n}x de ${brl(x.p.total/x.p.n)} · até ${esc(abrMes(x.ultima))}</small></span><span class="v">${brl(x.p.total)}</span></button>`).join("")}</div>`:`<p class="hint">Para parcelar, ao lançar uma despesa ligue a opção <b>Compra parcelada</b>. As parcelas entram sozinhas nos meses seguintes.</p>`}
    ${quitadas?`<p class="hint">${quitadas} compra(s) já quitada(s).</p>`:""}</div>`)}
    ${secaoMes("aj-viagem","Modo viagem","gastos em outra moeda",svgCat("aviao",18),cardViagens())}
    ${secaoMes("aj-div","Dívidas com pessoas",(()=>{ const n=state.config.dividas.filter(x=>!quitada(x)).length; return n?n+" em aberto":"quem te deve e quem você deve"; })(),ICON.grupo,cardDividas())}
    ${secaoMes("aj-ferr","Ferramentas","simulador de dívidas, 13º, férias, salário líquido",icq("engrenagem",18),`<div class="card" id="ferramentas"><h2>Ferramentas</h2>
    <button type="button" class="ferr" data-novo="simulador"><span class="fi" style="--dot:#10B981">${ICON.relat}</span><span><b>Simulador de quitação</b><small>Em quanto tempo quita uma dívida ou financiamento e quanto economiza pagando a mais.</small></span></button>
    <button type="button" class="ferr" data-novo="calc" data-calc="decimo"><span class="fi" style="--dot:#E11D48">${svgCat('presente',20)}</span><span><b>13º salário</b><small>Quanto cai na 1ª e na 2ª parcela, já com INSS e Imposto de Renda.</small></span></button>
    <button type="button" class="ferr" data-novo="calc" data-calc="ferias"><span class="fi" style="--dot:#0EA5E9">${svgCat('aviao',20)}</span><span><b>Férias</b><small>Férias + 1/3, com opção de vender 10 dias.</small></span></button>
    <button type="button" class="ferr" data-novo="calc" data-calc="liquido"><span class="fi" style="--dot:#8B5CF6">${svgCat('dinheiro',20)}</span><span><b>Salário líquido</b><small>Do bruto ao que cai na conta, com a tabela de ${TAB.ano}.</small></span></button>
    <button type="button" class="ferr" data-novo="calc" data-calc="guardar"><span class="fi" style="--dot:#F59E0B">${icq('alvo',20)}</span><span><b>Quanto guardar por mês</b><small>Para comprar algo à vista numa data, com ou sem rendimento.</small></span></button></div>
    `)}${secaoMes("aj-imp","Importar extrato do banco","OFX ou CSV do seu banco",icq("seta-baixo",18),`<div class="card"><h2>Importar extrato do banco</h2>
    <p class="hint">Baixe o extrato (ou a fatura do cartão) em OFX ou CSV no app do seu banco e traga tudo de uma vez, com a categoria já sugerida.</p>
    <button class="btn" type="button" data-novo="importar">Importar extrato</button></div>`)}
    ${secaoMes("aj-contas","Contas",cf.contas.length?cf.contas.length+(cf.contas.length===1?" conta":" contas"):"separe por banco ou carteira",ICON.banco,`<div class="card"><div class="cardhead"><h2>Contas</h2><span class="num muted">${cf.contas.length?brl(saldoInicialTotal())+" inicial":""}</span></div>
    ${cf.contas.length?`<div class="contas">${cf.contas.map(ct=>`<button type="button" class="conta" data-edit="conta" data-id="${esc(ct.id)}"><span class="ic">${ICON[ct.tipo==="dinheiro"?"dinheiro":ct.tipo==="poupanca"?"poupanca":"banco"]}</span><span class="desc"><b>${esc(ct.nome)}</b><small>saldo inicial ${brl(ct.saldoInicial)}${(cf.contaSalario||(cf.contas[0]||{}).id)===ct.id?" · recebe o salário":""}</small></span><span class="v muted">editar</span></button>`).join("")}</div>`:`<p class="hint">Separe seu dinheiro por conta (ex.: Nubank, Caixa, Dinheiro). Cada lançamento pode sair de uma conta, e o app mostra o saldo de cada uma. Sem contas cadastradas, tudo fica num saldo só.</p>`}
    <button class="btn ghost" data-novo="conta" type="button">+ Nova conta</button></div>`)}
    ${secaoMes("aj-cart","Cartões de crédito",cf.cartoes.length?cf.cartoes.map(x=>x.nome).join(", "):"nenhum ainda",ICON.cartao,`<div class="card"><div class="cardhead"><h2>Cartões de crédito</h2><span class="num muted">${cf.cartoes.length||""}</span></div>
    ${cf.cartoes.length?`<div class="contas">${cf.cartoes.map(cc=>{ const u=usoCartao(cc); return `<button type="button" class="conta" data-edit="cartao" data-id="${esc(cc.id)}"><span class="ic">${ICON.cartao}</span><span class="desc"><b>${esc(cc.nome)}</b><small>${cartaoOk(cc)?"fecha dia "+pad2(cc.fecha)+" · vence dia "+pad2(cc.vence):"sem dias de fatura"}${cc.limite?" · livre "+brl(u.livre):""}</small></span><span class="v muted">editar</span></button>`; }).join("")}</div>`:`<p class="hint">Cadastre seus cartões com o dia de fechamento e vencimento: as compras no crédito passam a contar no mês da fatura, e o app mostra o limite disponível.</p>`}
    <button class="btn ghost" data-novo="cartao" type="button">+ Novo cartão</button></div>`)}</div>
    <div class="col">${secaoMes("aj-cats","Categorias de gastos",cf.categorias.length+" categorias e limites do mês",svgCat("pontos",18),`<div class="card"><div class="cardhead"><h2>Categorias de gastos</h2><span class="num muted">${cf.categorias.length}</span></div>
    <p class="hint">Toque numa categoria para mudar o nome, a cor ou o limite do mês, ou para excluir.</p>
    <div>${(ui.verCats||cf.categorias.length<=6?cf.categorias:cf.categorias.slice(0,5)).map(ct=>`<button type="button" class="item catitem" data-edit="categoria" data-id="${esc(ct.id)}" style="--dot:${catColor(ct.id)}">${icoCat(ct.id)}<span class="desc"><b>${esc(ct.nome)}</b><small>${ct.orcamento>0?"limite de "+brl(ct.orcamento)+" por mês"+(ct.sobra?" · sobra acumula"+(sobraCat(ct,todayKey)>0?" (+"+brl(sobraCat(ct,todayKey))+" em "+abrMes(todayKey)+")":""):""):"sem limite"}</small></span><span class="v muted">editar</span></button>`).join("")}</div>
    ${cf.categorias.length>6?`<button type="button" class="btn ghost wide vermais" data-vercats="1">${ui.verCats?"Mostrar só as 5 primeiras":"Ver todas as "+cf.categorias.length+" categorias"}</button>`:""}
    <button class="btn ghost" data-novo="categoria" type="button">+ Nova categoria</button>
    <p class="hint">Excluir uma categoria não apaga os valores já lançados nela (aparecem como "Sem categoria"; ao editar, escolha outra).</p></div>`)}</div></div>`;
}

/* ---------- aba Perfil ---------- */
/* Perfil: ícone no título de cada seção (mesmo conteúdo, visual novo) */
function perfilComIcones(){
  const I={"Renda e saldos":ICON.dinheiro,"Aparência":icq("sol"),"Bloqueio com PIN":ICON.cadeado,"Lembretes":ICON.sino,"Exportar e backup":icq("nuvem"),"Novidades":icq("estrela"),"Tutorial":svgCat("livro"),"Privacidade":ICON.digital,"Acessibilidade":icq("coracao"),"Recomeçar do zero":ICON.lixo};
  return viewPerfil().replace(/<h2>([^<]+)<\/h2>/g,(m,t)=>I[t]?`<h2 class="hico${t==="Recomeçar do zero"?" perigo":""}"><span class="hic" aria-hidden="true">${I[t]}</span>${t}</h2>`:m);
}
function viewPerfil(){
  const cf=state.config, u=authUser, ini=inicioKey();
  const criado=u&&u.metadata&&u.metadata.creationTime?new Date(u.metadata.creationTime).toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"}):"";
  const nLanc=Object.values(state.months).reduce((a,m)=>a+(m.gastos?m.gastos.length:0)+(m.avulsos?m.avulsos.length:0)+(m.caixinha?m.caixinha.length:0),0);
  const rendas=cf.rendas.filter(r=>!r.ate||r.ate>=todayKey);
  return `<button type="button" class="ajlink" data-tab="ajustes"><span class="aji">${icq("engrenagem",20)}</span><span><b>Ajustes</b><small>Contas fixas, categorias, cartões, ferramentas e mais</small></span><span class="chev">${icq("chev",18)}</span></button>
  <div class="perfilhead card">${avatar(72)}<div class="pinfo"><h2>${esc(u?(u.displayName||"Sua conta"):"Modo local")}</h2>
    <p class="muted">${u?esc(u.email||""):"Sem login: os dados ficam só neste aparelho."}</p>
    <p class="small muted">${criado?"Conta criada em "+esc(criado)+" · ":""}${ini?"controle desde "+esc(nomeMes(ini).toLowerCase()):"controle ainda não começou"} · ${nLanc} lançamento${nLanc===1?"":"s"}</p></div>
    ${u?`<button class="btn ghost" type="button" data-logout="1">Sair da conta</button>`:""}</div>
    ${cardCompartilhado()}
  <div class="grid"><div class="col"><div class="card"><h2>Renda e saldos</h2>
    <label class="f money">Salário / renda fixa padrão (todo mês)<input class="in num" id="cfSal" inputmode="numeric" value="${esc(moneyInput(cf.salarioPadrao))}" placeholder="0,00"></label>
    <p class="hint">Entra automaticamente a partir do mês em que seu controle começa. Se um mês for diferente, ajuste na aba Mês.</p>
    <div class="f"><span>Outras rendas que se repetem todo mês</span>
    ${rendas.length?`<div>${rendas.map(r=>`<button type="button" class="item" data-edit="renda" data-id="${esc(r.id)}" style="--dot:var(--good)"><span class="pill">dia ${pad2(r.dia||1)}</span><span class="desc"><b>${esc(r.nome)}</b>${r.desde>todayKey?`<small>começa em ${esc(abrMes(r.desde))}</small>`:""}</span><span class="v pos">${brl(r.valor)}</span></button>`).join("")}</div>`:`<p class="hint">Ex.: bolsa, pensão, aluguel que você recebe.</p>`}
    <button class="btn ghost" type="button" data-novo="renda">+ Renda fixa</button></div>
    <label class="f">Começar a contar em<select class="in" id="cfInicio"><option value="">Automático${ini&&!cf.inicio?" ("+esc(nomeMes(ini))+")":" (primeiro mês com renda)"}</option>${MESES.map(k=>`<option value="${k}" ${k===cf.inicio?"selected":""}>${esc(nomeMes(k))}</option>`).join("")}</select></label>
    <p class="hint">Antes desse mês, salário padrão, rendas e contas fixas não entram nas contas.</p>
    ${temContas()?`<p class="hint">Saldo inicial: <b>${brl(saldoInicialTotal())}</b>, somando as contas. Para mudar, edite cada conta em <b>Ajustes → Contas</b>.</p>`:`<label class="f money">Saldo inicial (o que você já tinha em conta)<input class="in num" id="cfSaldo" inputmode="numeric" data-neg="1" value="${esc(cf.saldoInicial<0?"-"+moneyInput(-cf.saldoInicial):moneyInput(cf.saldoInicial))}" placeholder="0,00"></label>`}
    <label class="f money">Saldo inicial da caixinha<input class="in num" id="cfCx" inputmode="numeric" value="${esc(moneyInput(cf.saldoCaixinha))}" placeholder="0,00"></label></div></div>
  <div class="col"><div class="card"><h2>Aparência</h2>
    <div class="seg" role="radiogroup" aria-label="Tema">${[["auto","Automático"],["claro","Claro"],["escuro","Escuro"]].map(([v,l])=>`<input type="radio" name="ptema" id="pt-${v}" value="${v}" ${tema===v?"checked":""}><label for="pt-${v}">${l}</label>`).join("")}</div>
    <p class="hint">Automático segue o tema do seu celular ou computador.</p></div>
    ${cardA11y()}
    ${cardPin()}
    <div class="card" id="lembretes"><h2>Lembretes</h2>
    <p class="hint">Avisa um dia antes do vencimento, no dia e, se não marcar como paga, no dia seguinte (atraso). Vale para contas fixas, parcelas e fatura do cartão.</p>
    <label class="switch"><input type="checkbox" id="notifOn" ${notifOn&&("Notification" in window)&&Notification.permission==="granted"?"checked":""}><span></span>Notificações neste aparelho</label>
    <p class="hint">${!("Notification" in window)?"Este navegador não permite notificações. Use o calendário abaixo.":Notification.permission==="denied"?"As notificações estão bloqueadas. Libere em: ícone ao lado do endereço → Configurações do site → Notificações → Permitir.":"Chegam enquanto o app estiver aberto ou em segundo plano. No celular, instale o app na tela inicial para funcionar melhor."}</p>
    <button class="btn ghost" type="button" data-calendario="1">Adicionar lembretes ao calendário</button>
    <p class="hint">Para avisar mesmo com o app fechado: baixa um arquivo com os vencimentos dos próximos 12 meses. No celular, abra o arquivo e escolha o Google Agenda (ou Calendário, no iPhone). No computador: Google Agenda → Configurações → Importar. Se cadastrar contas novas, baixe de novo.</p></div>
    <div class="card"><h2>Exportar e backup</h2><p class="hint">A planilha abre no Excel e no Google Planilhas. O backup serve para restaurar tudo depois.</p>
    <button class="btn ghost" type="button" data-planilha="1">Baixar planilha (Excel)</button>
    <div class="row"><button class="btn ghost" type="button" data-export="1">Baixar backup</button><label class="btn ghost" for="impFile" style="text-align:center">Restaurar backup<input type="file" id="impFile" accept="application/json,.json" hidden></label></div>
    ${ui.importMsg?`<p class="hint">${esc(ui.importMsg)}</p>`:""}
    <p class="hint bkinfo">${(()=>{ const bk=infoBackup(); return bk.ultimo?"Último backup baixado neste aparelho: "+fmtIso(bk.ultimo)+"/"+bk.ultimo.slice(0,4)+(entreDias(bk.ultimo,hojeISO())>=30?" · já faz mais de um mês":""):"Você ainda não baixou um backup neste aparelho. O app lembra uma vez por mês."; })()}</p></div>
    <div class="card"><div class="cardhead"><h2>Novidades</h2><span class="versao">versão ${VERSAO}</span></div>
    <ul class="novidades">${NOVIDADES.map(n=>`<li>${esc(n)}</li>`).join("")}</ul>
    <p class="hint">O histórico completo fica no arquivo CHANGELOG.md do projeto.</p></div>
    <div class="card" id="ajuda"><h2>Tutorial</h2><p class="hint">Reveja em 1 minuto como usar o app: salário, lançamentos, contas fixas, cartões, caixinha, avisos e muito mais.</p>
    <button class="btn ghost" type="button" data-tutorial="1">Ver o tutorial</button></div>
    <div class="card"><h2>Privacidade</h2><p class="hint">Só você vê seus lançamentos. Eles ficam guardados na sua conta e protegidos por regras que impedem qualquer outra pessoa de ler ou alterar.</p>
    ${meusTermos()?`<p class="hint">Você aceitou os termos de privacidade (versão ${esc(meusTermos().v)})${meusTermos().em?" em "+esc(dataBR(meusTermos().em)):""}.</p>`:""}
    <div class="row2"><button class="btn ghost" type="button" data-termos="ler">Ler os termos</button><button class="btn ghost" type="button" data-termos="revogar">Retirar meu aceite</button></div></div>
    ${souDono()?`    <div class="card perigo"><h2>Recomeçar do zero</h2><p class="hint">Apaga todos os seus lançamentos, contas fixas, parcelas e configurações. Não dá para desfazer; se quiser, baixe um backup antes.</p>
    ${ui.confirmaApagar?`<label class="f">Para confirmar, digite APAGAR<input class="in" id="txtApagar" autocomplete="off" placeholder="APAGAR"></label><div class="row2"><button class="btn ghost" type="button" data-apagar="nao">Cancelar</button><button class="btn danger" type="button" data-apagar="sim">Apagar tudo</button></div>`:`<button class="btn danger" type="button" data-apagar="pedir">Apagar todos os meus dados</button>`}</div>`:""}</div></div>`;
}

/* =====================================================================
   TERMOS DE PRIVACIDADE (aceite obrigatório para usar o app)
   ===================================================================== */
const TERMOS_V="1.1", TERMOS_DATA="17/10/2026", CONTATO="https://github.com/GustavoMBarbosaDEV";
const meusTermos=()=>mode==="cloud"?eu.termos:state.config.termos;
const precisaTermos=()=>{ const t=meusTermos(); return mode!=="login"&&state.loaded&&!(t&&t.v===TERMOS_V); };
const dataBR=iso=>{ const d=new Date(iso); return isNaN(d.getTime())?"":d.toLocaleDateString("pt-BR"); };
function textoTermos(){
  return `<h3>1. O que é o Monetra</h3>
  <p>O Monetra é um aplicativo gratuito de controle de gastos pessoais, criado por Gustavo M. Barbosa. Ele serve para você anotar e acompanhar o seu próprio dinheiro. Não é banco, não movimenta dinheiro e não pede senha de banco.</p>
  <h3>2. Quais dados o app guarda</h3>
  <ul><li><b>Da sua conta Google:</b> nome, e-mail, foto e um código de identificação, usados só para fazer o login e mostrar seu perfil.</li>
  <li><b>O que você digita:</b> salário, receitas, despesas, categorias, contas, cartões (só nome, datas e limite, nunca o número do cartão), parcelas, metas e lembretes.</li>
  <li><b>Extratos importados:</b> o arquivo é lido dentro do seu aparelho. Só os lançamentos que você escolher importar são salvos; o arquivo em si não é enviado.</li>
  <li><b>No seu aparelho:</b> preferências como tema, lembretes já avisados e uma cópia para funcionar sem internet.</li></ul>
  <h3>3. Para que os dados são usados</h3>
  <p>Somente para mostrar o seu controle financeiro a você, em qualquer aparelho em que você entrar. Os dados <b>não são vendidos, não são usados para publicidade e não são compartilhados</b> com ninguém, a não ser com as pessoas de um controle compartilhado do qual você decidir participar (item 5).</p>
  <h3>4. Onde os dados ficam</h3>
  <p>Na sua conta, nos servidores do Google Firebase (login e banco de dados), protegidos por regras que só deixam a sua própria conta ler e alterar os seus dados. O site é hospedado no GitHub Pages, que pode registrar dados técnicos de acesso (como endereço IP) por segurança. O Google e o GitHub seguem as próprias políticas de privacidade.</p>
  <h3>5. Controles compartilhados</h3>
  <ul><li>Só existem se você quiser. Um controle compartilhado é <b>separado do seu controle Pessoal</b>: quem participa não vê nada do Pessoal.</li>
  <li>Dentro de um controle compartilhado, todas as pessoas aceitas veem e alteram os lançamentos daquele controle e veem o nome, o e-mail e a foto umas das outras. O app mostra quem fez cada lançamento.</li>
  <li>Quem cria o controle aceita ou recusa os pedidos, pode remover pessoas e excluir o controle. Quem participa pode sair a qualquer momento.</li></ul>
  <h3>6. Seus direitos (LGPD — Lei 13.709/2018)</h3>
  <ul><li><b>Ver e levar seus dados:</b> Perfil → baixar backup ou planilha para Excel.</li>
  <li><b>Corrigir:</b> edite qualquer lançamento a qualquer momento.</li>
  <li><b>Apagar:</b> Perfil → Recomeçar do zero apaga todos os seus lançamentos e configurações (num controle compartilhado, só quem o criou).</li>
  <li><b>Retirar o aceite:</b> Perfil → Privacidade → Retirar meu aceite. Sem o aceite, o app não pode ser usado.</li>
  <li><b>Excluir a conta por completo</b> ou tirar dúvidas: fale com o responsável pelo contato abaixo.</li></ul>
  <h3>7. Notificações</h3>
  <p>Os avisos de contas a vencer só são enviados se você permitir no aparelho, e podem ser desligados no Perfil ou nas configurações do celular.</p>
  <h3>8. Responsabilidade</h3>
  <p>O app é oferecido de graça, como está. Os valores e saldos são calculados a partir do que você lança e servem para organização pessoal; não são consultoria financeira. Guarde backups dos dados importantes.</p>
  <h3>9. Mudanças nestes termos</h3>
  <p>Se os termos mudarem, o app mostra a nova versão e pede o seu aceite de novo antes de continuar.</p>
  <h3>10. Contato</h3>
  <p><a href="${CONTATO}" target="_blank" rel="noopener">${CONTATO.replace(/^https?:\/\//,"")}</a></p>`;
}
function viewTermos(pedir){
  const recusou=ui.recusouTermos&&pedir;
  return `<div class="card termos">
  <h2>Termos de privacidade</h2><p class="hint">Versão ${TERMOS_V} · ${TERMOS_DATA}</p>
  ${pedir?`<p>${meusTermos()?"Os termos mudaram. ":""}Antes de usar o Monetra, leia como seus dados são tratados e escolha se aceita.</p>`:""}
  <div class="termostexto">${textoTermos()}</div>
  ${recusou?`<p class="note">Sem aceitar os termos não é possível usar o app neste aparelho. Seus dados não foram alterados.</p>`:""}
  ${pedir?`<label class="checkline"><input type="checkbox" id="t-li"> Li e entendi os termos de privacidade</label>
  <div class="row2"><button class="btn ghost" type="button" data-termos="recusar">Não aceito</button><button class="btn" type="button" data-termos="aceitar" id="t-aceitar" disabled>Aceito</button></div>`
  :`<button class="btn wide" type="button" data-termos="fechar">Voltar</button>`}</div>`;
}
function acaoTermos(a){
  if(a==="ler"){ ui.lerTermos=true; render(); window.scrollTo({top:0}); return; }
  if(a==="fechar"){ ui.lerTermos=false; render(); window.scrollTo({top:0}); return; }
  if(a==="aceitar"){ const t={v:TERMOS_V,em:new Date().toISOString()}; if(mode==="cloud") salvaEu({termos:t}); else { state.config.termos=t; save("config"); } ui.recusouTermos=false; ui.lerTermos=false; render(); toast("Termos aceitos. Bom controle!"); return; }
  if(a==="recusar"){
    if(mode==="cloud"&&fb){ loginErro="Para usar o Monetra é preciso aceitar os termos de privacidade. Seus dados não foram alterados."; fb.signOut(fb.auth); return; }
    ui.recusouTermos=true; render(); return;
  }
  if(a==="revogar"){ if(!confirmaRevogar()) return; if(mode==="cloud") salvaEu({termos:null}); else { state.config.termos=null; save("config"); } ui.lerTermos=false; render(); window.scrollTo({top:0}); }
}
function confirmaRevogar(){ ui.revogarCont=(ui.revogarCont||0)+1; if(ui.revogarCont<2){ toast("Toque de novo em “Retirar meu aceite” para confirmar."); setTimeout(()=>{ ui.revogarCont=0; },5000); return false; } ui.revogarCont=0; return true; }

/* =====================================================================
   IMPORTAR EXTRATO (OFX ou CSV)
   ===================================================================== */
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
/* sugestão de categoria: primeiro pelo que você já lançou com a mesma descrição, depois por palavras-chave */
const REGRAS_CAT=[[/mercad|supermerc|atacad|assai|carrefour|hortifrut|padaria|acougue|sacolao|atacarejo/,/mercado|aliment/],
  [/uber|99app|\b99\b|posto|shell|ipiranga|petrobras|combust|estacion|onibus|metro|pedagio|recarga.*transporte/,/transp|combust/],
  [/farm|droga|raia|pacheco|pague menos|panvel|hospital|clinica|laborat|odonto|consulta/,/saude|farm/],
  [/ifood|restaur|lanch|pizza|burger|\bbar\b|cinema|ingresso|rappi|mcdonald|sorvet|cafe/,/lazer|restaur/],
  [/netflix|spotify|prime video|disney|hbo|internet|\bvivo\b|\bclaro\b|\btim\b|energia|cemig|enel|light|copel|celesc|sabesp|copasa|saneago|\bagua\b|\bgas\b/,/contas|luz|internet/],
  [/escola|curso|faculd|universidade|udemy|alura|livraria|mensalidade/,/educa/],
  [/aluguel|condominio|iptu|imobiliaria/,/moradia|aluguel/],
  [/loja|shopping|renner|riachuelo|\bc&a\b|shein|shopee|magalu|magazine|americanas|mercado ?livre|amazon|zara|centauro|netshoes/,/compras|vestu/]];
function sugerirCategoria(desc){
  const d=norm(desc);
  if(d) for(const k of Object.keys(state.months).sort().reverse()){ const g=((state.months[k]||{}).gastos||[]).find(x=>x.desc&&norm(x.desc)===d&&catIndex(x.cat)>=0); if(g) return g.cat; }
  for(const [re,alvo] of REGRAS_CAT) if(re.test(d)){ const ct=state.config.categorias.find(c=>alvo.test(norm(c.nome))); if(ct) return ct.id; }
  const outros=state.config.categorias.find(c=>/outro/.test(norm(c.nome))); return (outros||state.config.categorias[0]||{}).id;
}
function sugerirForma(desc,cartao){ if(cartao) return "credito"; const d=norm(desc); if(/pix/.test(d)) return "pix"; if(/boleto|titulo|pagto|pagamento de conta/.test(d)) return "boleto"; if(/saque/.test(d)) return "dinheiro"; return "debito"; }
/* prepara a prévia: mês, dia, tipo, categoria sugerida e se já foi lançado */
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
async function abrirArquivoExtrato(file){
  const s=ui.sheet; if(!s||s.tipo!=="importar") return;
  try{
    const t=await lerArquivoTexto(file);
    const ehOFX=/<OFX>|OFXHEADER|<STMTTRN>/i.test(t);
    const r=ehOFX?{itens:parseOFX(t),cartao:false}:parseCSV(t);
    const cartao=document.getElementById("s-impcartao")?document.getElementById("s-impcartao").checked||r.cartao:r.cartao;
    if(!r.itens.length){ s.erroImp=r.erro||"Não encontrei lançamentos neste arquivo. Confira se é um extrato em OFX ou CSV."; s.itens=null; renderSheet(); return; }
    s.erroImp=""; s.arquivo=file.name; s.cartaoArq=cartao; s.contaImp=valSel("s-impconta")||s.contaImp; s.cartaoImp=valSel("s-cartao")||s.cartaoImp;
    s.itens=preparaImportacao(r.itens,cartao); renderSheet();
  }catch(e){ console.error(e); s.erroImp="Não consegui ler o arquivo."; renderSheet(); }
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

/* =====================================================================
   JANELA DE LANÇAMENTO (adicionar / editar / buscar)
   ===================================================================== */
function sheetRoot(){ let r=document.getElementById("sheet"); if(!r){ r=document.createElement("div"); r.id="sheet"; document.body.appendChild(r); bindSheet(r); } return r; }
let sheetVoltaFoco=null;
function openSheet(tipo,id,extra){
  if(mode==="login"||precisaTermos()) return;
  if(mode==="login"||!state.loaded) return;
  if(!ui.sheet){ sheetVoltaFoco=document.activeElement; marcaHist("sheet"); }
  ui.sheet=Object.assign({tipo,id:id||null},extra||{});
  renderSheet();
  const f=/** @type {HTMLElement|null} */(document.querySelector("#sheet [data-autofocus]")||document.querySelector("#sheet #sheetTit"));
  if(f){ if(f.id==="sheetTit") f.setAttribute("tabindex","-1"); setTimeout(()=>f.focus(),30); }
}
/* botão voltar do celular: cada janela (folha) e cada aba fora do Início ganham um passo no histórico */
let _hist=0, _voltando=false, _ignoraPop=0;
function marcaHist(tipo){ try{ history.pushState({mb:tipo,n:++_hist},""); }catch(e){} }
window.addEventListener("popstate",()=>{
  if(_ignoraPop>0){ _ignoraPop--; return; }
  if(ui.sheet){ _voltando=true; closeSheet(); _voltando=false; return; }
  if(tutAberto&&typeof fecharTutorial==="function"){ try{ fecharTutorial(); }catch(e){} return; }
  if(ui.tab!=="mes"){ ui.tab="mes"; render(); window.scrollTo({top:0}); return; }
});
function closeSheet(){ const tinha=!!ui.sheet; if(tinha&&!_voltando&&history.state&&history.state.mb==="sheet"){ _ignoraPop++; try{ history.back(); }catch(e){ _ignoraPop--; } }
  ui.sheet=null; const r=document.getElementById("sheet"); if(r) r.innerHTML=""; document.body.classList.remove("sheet-open"); const _ap=document.getElementById("app"); if(_ap) _ap.inert=false; if(sheetVoltaFoco&&document.contains(sheetVoltaFoco)) try{sheetVoltaFoco.focus()}catch(e){} sheetVoltaFoco=null; }
const mesSheet=()=>(ui.sheet&&ui.sheet.mes)||ui.month;
/**
 * Item que a folha aberta está editando. O tipo depende da folha (despesa, meta, cartão, dívida…),
 * por isso devolve "qualquer item".
 * @returns {any}
 */
function itemAtual(){
  const s=ui.sheet; if(!s||!s.id) return null; const k=mesSheet(), m=getMonth(k);
  switch(s.tipo){
    case "gasto": return m.gastos.find(x=>x.id===s.id);
    case "avulso": return m.avulsos.find(x=>x.id===s.id);
    case "caixinha": return m.caixinha.find(x=>x.id===s.id);
    case "fixo": return state.config.fixos.find(x=>x.id===s.id);
    case "fixoMes": return fixosDoMes(k).find(x=>x.id===s.id);
    case "parcela": return state.config.parcelas.find(x=>x.id===s.id);
    case "renda": return state.config.rendas.find(x=>x.id===s.id);
    case "rendaMes": return rendasDoMes(k).find(x=>x.id===s.id);
    case "categoria": return state.config.categorias.find(x=>x.id===s.id);
    case "meta": return state.config.metas.find(x=>x.id===s.id);
    case "desafio": return (state.config.desafios||[]).find(x=>x.id===s.id);
    case "conta": return state.config.contas.find(x=>x.id===s.id);
    case "cartao": return state.config.cartoes.find(x=>x.id===s.id);
    case "transf": return m.transf.find(x=>x.id===s.id);
    case "divida": return state.config.dividas.find(x=>x.id===s.id);
    case "viagem": return state.config.viagens.find(x=>x.id===s.id);
  }
  return null;
}
function chipsCampo(sel){ return `<div class="cats" role="radiogroup" aria-label="Categoria">${state.config.categorias.map(ct=>`<input type="radio" name="s-cat" id="s-cat-${esc(ct.id)}" value="${esc(ct.id)}" ${ct.id===sel?"checked":""}><label for="s-cat-${esc(ct.id)}" style="--dot:${catColor(ct.id)}">${svgCat(catIc(ct.id),15)}${esc(ct.nome)}</label>`).join("")}<button type="button" class="chipnova" data-snovacat="1">+ Nova categoria</button></div>
  <div class="row" id="s-novacatbox" hidden><label class="f" style="flex:2 1 160px">Nome da nova categoria<input class="in" id="s-novacat" maxlength="40" placeholder="ex.: Pets, Presentes"></label><button class="btn ghost" type="button" data-scriacat="1">Criar</button></div>`; }
const linhaSub=x=>`<div class="subrow"><input class="in subnome" data-subid="${esc(x.id||"")}" maxlength="30" value="${esc(x.nome)}" aria-label="Nome da subcategoria"><button type="button" class="link" data-delsub="">remover</button></div>`;
function chipsSub(cat,sel){
  const ct=state.config.categorias.find(c=>c.id===cat), subs=(ct&&ct.subs)||[]; if(!subs.length) return "";
  return `<span>Subcategoria</span><div class="cats subcats" role="radiogroup" aria-label="Subcategoria"><input type="radio" name="s-sub" id="s-sub-0" value="" ${!sel?"checked":""}><label for="s-sub-0">Nenhuma</label>${subs.map(x=>`<input type="radio" name="s-sub" id="s-sub-${esc(x.id)}" value="${esc(x.id)}" ${x.id===sel?"checked":""}><label for="s-sub-${esc(x.id)}" style="--dot:${catColor(cat)}"><i></i>${esc(x.nome)}</label>`).join("")}</div>`;
}
function campoTags(tags){
  const sug=todasTags().filter(t=>!(tags||[]).includes(t)).slice(0,8);
  return `<label class="f">Etiquetas (opcional)<input class="in" id="s-tags" maxlength="120" autocomplete="off" placeholder="ex.: viagem, presente, trabalho" value="${esc((tags||[]).map(t=>"#"+t).join(" "))}"></label>
  ${sug.length?`<div class="tagsug">${sug.map(t=>`<button type="button" class="tag" data-addtag="${esc(t)}">#${esc(t)}</button>`).join("")}</div>`:""}`;
}
function atualizaSubBox(){ const bx=document.getElementById("s-subbox"); if(!bx) return; const cat=(document.querySelector('#sheet input[name="s-cat"]:checked')||{}).value; bx.innerHTML=chipsSub(cat,null); bx.hidden=!bx.innerHTML; }
function chipsForma(sel){ return `<div class="cats formas" role="radiogroup" aria-label="Forma de pagamento">${FORMAS.map(([id,n])=>`<input type="radio" name="s-forma" id="s-fm-${id}" value="${id}" ${id===sel?"checked":""}><label for="s-fm-${id}" style="--dot:var(--fm-${id})"><i></i>${n}</label>`).join("")}</div>`; }
/* escolher conta / cartão (só aparece quando há mais de um) */
function selConta(sel,lab,id){ const cs=state.config.contas; if(cs.length<2) return ""; const v=contaOk(sel);
  return `<label class="f">${lab||"Conta"}<select class="in" id="${id||"s-conta"}">${cs.map(c=>`<option value="${esc(c.id)}" ${c.id===v?"selected":""}>${esc(c.nome)}</option>`).join("")}</select></label>`; }
function selCartao(sel){ const cs=state.config.cartoes; if(cs.length<2) return ""; const v=(cs.find(c=>c.id===sel)||cs[0]).id;
  return `<label class="f">Cartão<select class="in" id="s-cartao">${cs.map(c=>`<option value="${esc(c.id)}" ${c.id===v?"selected":""}>${esc(c.nome)}</option>`).join("")}</select></label>`; }
const valSel=id=>(document.getElementById(id)||{}).value||null;
/* mostra "Sai da conta" ou "Cartão" conforme a forma de pagamento */
function atualizaFormaBox(){ const f=(document.querySelector('#sheet input[name="s-forma"]:checked')||{}).value; const a=document.getElementById("s-contabox"), b=document.getElementById("s-cartaobox"); if(a) a.hidden=f==="credito"; if(b) b.hidden=f!=="credito"; }
function selDia(k,sel){ const dim=diasMes(k); let o=""; for(let d=1;d<=dim;d++){ const wd=new Date(kY(k),kM(k)-1,d).toLocaleDateString("pt-BR",{weekday:"short"}).replace(".",""); o+=`<option value="${d}" ${d===sel?"selected":""}>${pad2(d)} · ${wd}${k===todayKey&&d===today.getDate()?" (hoje)":""}</option>`; } return `<select class="in" id="s-dia">${o}</select>`; }
const selMes=(id,sel)=>`<select class="in" id="${id}">${(sel&&!MESES.includes(sel)?[sel].concat(MESES):MESES).map(x=>`<option value="${x}" ${x===sel?"selected":""}>${esc(nomeMes(x))}</option>`).join("")}</select>`;
function renderSheet(){
  const r=sheetRoot(), s=ui.sheet;
  if(!s){ r.innerHTML=""; document.body.classList.remove("sheet-open"); return; }
  document.body.classList.add("sheet-open"); const _ap=document.getElementById("app"); if(_ap) _ap.inert=true;
  const k=mesSheet(), it=itemAtual(), novo=!s.id, diaPadrao=s.dia&&s.tipo!=="dia"?Math.min(diasMes(k),Number(s.dia)||1):k===todayKey?today.getDate():1;
  if(!novo&&!it&&s.tipo!=="busca"&&s.tipo!=="importar"&&s.tipo!=="avisos"&&s.tipo!=="dia"&&s.tipo!=="semana"&&s.tipo!=="meses"&&s.tipo!=="simulador"&&s.tipo!=="calc"&&s.tipo!=="pin"&&s.tipo!=="retro"){ closeSheet(); return; }
  const titulos={gasto:novo?"Nova despesa":"Editar despesa",avulso:novo?"Nova receita":"Editar receita",caixinha:novo?"Movimentar caixinha":"Editar caixinha",fixo:novo?"Nova conta fixa":"Editar conta fixa",fixoMes:it?it.desc:"",parcela:"Compra parcelada",renda:novo?"Nova renda fixa":"Editar renda fixa",rendaMes:it?it.nome:"",busca:"Buscar lançamentos",categoria:novo?"Nova categoria":"Editar categoria",meta:novo?"Nova meta de economia":"Meta de economia",conta:novo?"Nova conta":"Editar conta",cartao:novo?"Novo cartão de crédito":"Editar cartão",transf:novo?"Transferir entre contas":"Editar transferência",importar:"Importar extrato do banco",avisos:"Notificações",calc:"Calculadoras",simulador:"Simulador de quitação",semana:"Resumo da semana",meses:"Selecione o mês e o ano",desafio:novo?"Novo desafio":"Desafio",dia:ui.sheet&&ui.sheet.tipo==="dia"?(()=>{ const kk=mesSheet(), dt=new Date(kY(kk),kM(kk)-1,Number(ui.sheet.dia)||1); const t=DIAS_SEM[dt.getDay()]+", "+pad2(dt.getDate())+" de "+NOMES[dt.getMonth()].toLowerCase(); return t[0].toUpperCase()+t.slice(1); })():"",retro:"Retrospectiva",viagem:novo?"Nova viagem":"Viagem",divida:novo?((s.dTipo||"receber")==="pagar"?"Eu devo":"Alguém me deve"):"Dívida",pin:ui.sheet&&ui.sheet.pinModo==="trocar"?"Trocar PIN":ui.sheet&&ui.sheet.pinModo==="desligar"?"Desligar o PIN":"Criar PIN"};
  const abas=novo&&["gasto","avulso","caixinha","fixo"].includes(s.tipo)?`<div class="seg tipos" role="radiogroup" aria-label="Tipo de lançamento">${[["gasto","Despesa"],["avulso","Receita"],["caixinha","Caixinha"],["fixo","Conta fixa"]].map(([t,l])=>`<input type="radio" name="s-tipo" id="s-t-${t}" value="${t}" ${s.tipo===t?"checked":""}><label for="s-t-${t}">${l}</label>`).join("")}</div>`:"";
  const valorCampo=(v,lab,auto=true)=>`<label class="f money bigval"><span id="s-valorlab">${lab||"Valor"}</span><input class="in num" id="s-valor" inputmode="numeric" placeholder="0,00" value="${esc(v===0?"0,00":v!=null?moneyInput(v):(s.valorRasc||""))}" ${auto?"data-autofocus":""} required></label>`;
  const apagar=`<button class="btn danger" type="button" data-sapagar="1">Apagar</button>`;
  let corpo="", botoes="", sub=esc(nomeMes(k));
  if(s.tipo==="gasto"){
    const cat=it?it.cat:(ui.gCat&&catIndex(ui.gCat)>=0?ui.gCat:state.config.categorias[0]?.id);
    const forma=it?(it.forma||""):ui.gForma;
    corpo=`${novo?`<div class="rapido"><label class="rp-in"><span class="rp-ic" aria-hidden="true">${icq("raio",17)}</span><span class="sr">Lançamento rápido</span><input class="in" id="s-rapido" autocomplete="off" enterkeyhint="send" maxlength="100" placeholder="Rápido: 45 ifood pix · 120 mercado ontem"></label><div class="rp-prev" id="s-rapprev" aria-live="polite">${previaRapido(null)}</div></div>`:""}
      ${valorCampo(it?(it.orig&&it.orig.moeda!=="BRL"&&(state.config.viagens||[]).some(v=>v.id===it.viagemId)?it.orig.valor:it.valor):null)}
      ${blocoViagemGasto(it,k)}
      ${novo?`<label class="switch"><input type="checkbox" id="s-parc"><span></span>Compra parcelada</label>
      <div class="row" id="s-parcbox" hidden><label class="f narrow">Parcelas<input class="in num" id="s-n" type="number" min="2" max="48" value="2" inputmode="numeric"></label><label class="f narrow">Vence dia<input class="in num" id="s-venc" type="number" min="1" max="31" value="${diaPadrao}" inputmode="numeric"></label><p class="hint" id="s-parcinfo" style="flex:2 1 160px;align-self:center"></p></div>`:""}
      <div class="f"><span>Categoria</span>${chipsCampo(cat)}${it&&catIndex(it.cat)<0?'<p class="hint">A categoria desta despesa foi excluída. Escolha outra.</p>':""}</div>
      <div class="f" id="s-subbox" ${chipsSub(cat,it&&it.sub)?"":"hidden"}>${chipsSub(cat,it&&it.sub)}</div>
      <div class="row"><label class="f">Mês${selMes("s-gmes",k)}</label><label class="f" style="flex:0 1 150px">Dia${selDia(k,it?it.dia:diaPadrao)}</label></div>
      <label class="f">Descrição (opcional)<input class="in" id="s-desc" maxlength="80" placeholder="ex.: feira, gasolina, farmácia" value="${esc(it?it.desc:"")}"></label>
      <div class="f"><span>Forma de pagamento</span>${chipsForma(forma)}</div>
      ${it&&it.forma==="credito"?`<label class="switch"><input type="checkbox" id="s-gpago" ${it.pago?"checked":""}><span></span>Já paguei esta compra</label>`:""}
      <div id="s-contabox">${selConta(it?it.contaId:ui.gConta,"Sai da conta")}</div><div id="s-cartaobox">${selCartao(it?it.cartaoId:ui.gCartao)}</div>
      <p class="hint" id="s-fatinfo">${cartaoAtivo()?"No crédito, conta na fatura do cartão.":""}</p>
      ${campoTags(it&&it.tags)}`;
    botoes=novo?`<button class="btn ghost" type="button" data-outro="1">Salvar e lançar outra</button><button class="btn" type="submit">Salvar</button>`:`${apagar}<button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="avulso"){
    corpo=`${valorCampo(it&&it.valor)}<div class="row"><label class="f">Dia${selDia(k,it?it.dia:diaPadrao)}</label><label class="f" style="flex:2 1 180px">Descrição<input class="in" id="s-desc" maxlength="60" placeholder="ex.: freela, Pix recebido, 13º" value="${esc(it?it.desc:"")}"></label></div>
      ${selConta(it?it.contaId:null,"Entra na conta")}
      ${novo?`<label class="switch"><input type="checkbox" id="s-repete"><span></span>Recebo esse valor todo mês</label><p class="hint">Ligado, vira uma renda fixa que entra sozinha a partir deste mês.</p>`:""}`;
    botoes=novo?`<button class="btn" type="submit">Salvar</button>`:`${apagar}<button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="caixinha"){
    const tp=it?it.tipo:(s.cxTipo||"guardar");
    corpo=`<div class="seg" role="radiogroup" aria-label="Tipo"><input type="radio" name="s-cxtipo" id="s-cxG" value="guardar" ${tp==="guardar"?"checked":""}><label for="s-cxG">Guardar</label><input type="radio" name="s-cxtipo" id="s-cxR" value="retirar" ${tp==="retirar"?"checked":""}><label for="s-cxR">Retirar</label></div>
      ${valorCampo(it&&it.valor)}<div class="row"><label class="f">Dia${selDia(k,it?it.dia:diaPadrao)}</label><label class="f" style="flex:2 1 180px">Motivo (opcional)<input class="in" id="s-desc" maxlength="60" placeholder="ex.: reserva, viagem" value="${esc(it?it.desc:"")}"></label></div>
      ${state.config.metas.length?`<label class="f">Caixinha<select class="in" id="s-meta"><option value="">Geral (sem meta)</option>${state.config.metas.map(mt=>`<option value="${esc(mt.id)}" ${(it?it.metaId:s.metaId)===mt.id?"selected":""}>${esc(mt.nome)} — ${brl(saldoMeta(mt.id,null))} de ${brl(mt.alvo)}</option>`).join("")}</select></label>`:""}
      <p class="hint">Saldo atual da caixinha: <b>${brl(caixinhaAte(k))}</b></p>`;
    botoes=novo?`<button class="btn" type="submit">Salvar</button>`:`${apagar}<button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="fixo"){
    const cat=it?it.cat:(ui.gCat&&catIndex(ui.gCat)>=0?ui.gCat:state.config.categorias[0]?.id);
    const desde=it?it.desde:k;
    corpo=`<label class="f">Nome da conta<input class="in" id="s-nome" maxlength="40" placeholder="ex.: Aluguel, Internet, Academia" value="${esc(it?it.nome:"")}" ${s.valorRasc?"":"data-autofocus"}></label>
      ${valorCampo(it&&it.valor,"Valor por mês",false)}
      <div class="row"><label class="f narrow">Vence dia<input class="in num" id="s-diafixo" type="number" min="1" max="31" value="${it?it.dia:diaPadrao}"></label><label class="f">Começa em${selMes("s-desde",desde)}</label></div>
      <div class="f"><span>Categoria</span>${chipsCampo(cat)}</div>
      <div class="f"><span>Forma de pagamento</span>${chipsForma(it?it.forma:"boleto")}</div>
      ${selConta(it?it.contaId:null,"Sai da conta")}
      <p class="hint">Entra sozinha nas despesas de todos os meses a partir do mês escolhido. Em cada mês você marca se já pagou.</p>`;
    const apartir=ui.tab==="mes"?k:todayKey;
    if(!novo) corpo+=`<div class="zona"><p class="hint">Excluir a partir de ${esc(abrMes(apartir))} mantém a conta nos meses anteriores (o histórico continua certo).</p><button class="link danger" type="button" data-sexcluirfixo="todos">Apagar de todos os meses</button></div>`;
    sub=""; botoes=novo?`<button class="btn" type="submit">Salvar</button>`:`<button class="btn danger" type="button" data-sexcluirfixo="mes">Excluir a partir de ${esc(abrMes(apartir))}</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="fixoMes"){
    corpo=`<p class="hint">${esc(catName(it.cat))} · vence dia ${pad2(it.dia)} · ${esc(formaNome(it.forma))}</p>
      <label class="switch"><input type="checkbox" id="s-pago" ${it.pago?"checked":""}><span></span>Já paguei esta conta</label>
      ${valorCampo(it.valor,"Valor neste mês")}
      <p class="hint">Valor padrão: ${brl(it.padrao)}. Mudar aqui vale só para ${esc(nomeMes(k).toLowerCase())}.</p>
      <div class="row2"><button class="btn ghost" type="button" data-spular="fixos">${it.pular?"Voltar a contar neste mês":"Pular só este mês"}</button><button class="btn ghost" type="button" data-sabrir="fixo">Editar conta fixa</button></div>`;
    botoes=`<button class="btn danger" type="button" data-sexcluirfixo="mes">Excluir conta</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="parcela"){
    const ccp=it.forma==="credito"?cartaoDe(it):null, cartao=cartaoOk(ccp), prim=cartao?faturaMes(it.compra,it.dia,ccp):it.compra;
    corpo=`<p class="hint">Comprado em ${pad2(it.dia)}/${pad2(kM(it.compra))}/${kY(it.compra)} · parcelas de ${esc(abrMes(prim))} a ${esc(abrMes(shiftKey(prim,it.n-1)))}${cartao?" (na fatura)":""}</p>
      ${valorCampo(it.total,"Valor total da compra")}
      <div class="row"><label class="f narrow">Parcelas<input class="in num" id="s-n" type="number" min="2" max="48" value="${it.n}"></label>${cartao?"":`<label class="f narrow">Vence dia<input class="in num" id="s-venc" type="number" min="1" max="31" value="${it.venc||it.dia}"></label>`}<label class="f" style="flex:2 1 160px">Descrição<input class="in" id="s-desc" maxlength="80" value="${esc(it.desc)}"></label></div>
      ${(()=>{ const pm=parcelasDoMes(k).find(x=>x.id===it.id); return pm?`<label class="switch"><input type="checkbox" id="s-ppago" ${pm.pago?"checked":""}><span></span>Paguei a parcela ${pm.idx}/${pm.n} de ${esc(abrMes(k))} (${brl(pm.valor)})</label>`:""; })()}
      <div class="f"><span>Categoria</span>${chipsCampo(it.cat)}</div>
      <div class="f"><span>Forma de pagamento</span>${chipsForma(it.forma)}</div>
      <div id="s-contabox">${selConta(it.contaId,"Sai da conta")}</div><div id="s-cartaobox">${selCartao(it.cartaoId)}</div>`;
    sub=""; botoes=`<button class="btn danger" type="button" data-sapagar="1">Apagar compra</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="renda"){
    corpo=`<label class="f">Nome<input class="in" id="s-nome" maxlength="40" placeholder="ex.: Bolsa, Pensão, Aluguel recebido" value="${esc(it?it.nome:(s.nomeRasc||""))}" data-autofocus></label>
      ${valorCampo(it&&it.valor,"Valor por mês",false)}
      <div class="row"><label class="f narrow">Cai no dia<input class="in num" id="s-diarenda" type="number" min="1" max="31" inputmode="numeric" value="${it?(it.dia||1):1}"></label><label class="f">Começa em${selMes("s-desde",it?it.desde:k)}</label></div>
      ${selConta(it?it.contaId:null,"Entra na conta")}
      <p class="hint">Entra sozinha nas receitas de todos os meses a partir do mês escolhido.</p>`;
    sub=""; botoes=novo?`<button class="btn" type="submit">Salvar</button>`:`<button class="btn danger" type="button" data-sencerrar="rendas">Encerrar renda</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="rendaMes"){
    corpo=`${valorCampo(it.valor,"Valor neste mês")}<p class="hint">Valor padrão: ${brl(it.padrao)}. Mudar aqui vale só para ${esc(nomeMes(k).toLowerCase())}.</p>
      <div class="row2"><button class="btn ghost" type="button" data-spular="rendas">${it.pular?"Voltar a contar neste mês":"Pular só este mês"}</button><button class="btn ghost" type="button" data-sabrir="renda">Editar renda fixa</button></div>`;
    botoes=`<button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="categoria"){
    const usada=it?Object.values(state.months).reduce((a,m)=>a+(m.gastos||[]).filter(g=>g.cat===it.id).length,0)+state.config.fixos.filter(f=>f.cat===it.id).length+state.config.parcelas.filter(p=>p.cat===it.id).length:0;
    const usadas=new Set(state.config.categorias.filter(c=>c!==it).map(corIdx));
    const corSel=it?corIdx(it):[...Array(NCORES).keys()].find(i=>!usadas.has(i))??0;
    corpo=`<label class="f">Nome<input class="in" id="s-nome" maxlength="40" placeholder="ex.: Pets, Presentes, Viagem" value="${esc(it?it.nome:"")}" data-autofocus></label>
      <div class="f"><span>Ícone</span><div class="icones" role="radiogroup" aria-label="Ícone">${Object.keys(ICAT).map(kk=>{ const sel=it?(it.ic||icAuto(it.nome)):"pontos"; return `<input type="radio" name="s-ic" id="s-ic-${kk}" value="${kk}" ${kk===sel?"checked":""}><label for="s-ic-${kk}" title="${ICAT_NOMES[kk]}">${svgCat(kk,20)}<span class="sr">${ICAT_NOMES[kk]}</span></label>`; }).join("")}</div></div>
      <div class="f"><span>Cor</span><div class="cores" role="radiogroup" aria-label="Cor">${[...Array(NCORES).keys()].map(i=>`<input type="radio" name="s-cor" id="s-cor-${i}" value="${i}" ${i===corSel?"checked":""}><label for="s-cor-${i}" style="--dot:var(--c${i})" title="Cor ${i+1}"><span class="sr">Cor ${i+1}</span></label>`).join("")}</div></div>
      <label class="f money">Limite por mês (opcional)<input class="in num" id="s-valor" inputmode="numeric" placeholder="sem limite" value="${esc(it&&it.orcamento?moneyInput(it.orcamento):"")}"></label>
      <div class="f sobrabox"><label class="switch"><input type="checkbox" id="s-sobra" ${it&&it.sobra?"checked":""}><span></span>Sobra passa para o mês seguinte</label>
        <p class="hint">Ex.: limite de R$ 800 e gastou R$ 700: os R$ 100 que sobraram entram no limite do mês seguinte (R$ 900). Se passar do limite, a sobra zera. ${it&&it.sobra&&sobraCat(it,todayKey)>0?`<b>Em ${esc(abrMes(todayKey))}: ${brl(limiteCat(it,todayKey))} (${brl(it.orcamento)} + ${brl(sobraCat(it,todayKey))} de sobra).</b>`:"Só vale para categorias com limite e começa a contar a partir deste mês."}</p></div>
      <div class="f"><span>Subcategorias (opcional)</span><div id="s-sublista">${((it&&it.subs)||[]).map(linhaSub).join("")}</div>
        <div class="convrow"><input class="in" id="s-subnova" maxlength="30" placeholder="ex.: Mercado, Restaurante, iFood"><button class="btn ghost" type="button" data-addsub="1">Adicionar</button></div>
        <p class="hint">O limite e o gráfico continuam pela categoria; as subcategorias mostram o detalhe.</p></div>
      ${it&&usada?`<p class="hint">Usada em ${usada} lançamento(s). Se excluir, eles continuam nas contas como "Sem categoria".</p>`:""}`;
    sub=""; botoes=novo?`<button class="btn" type="submit">Criar categoria</button>`:`<button class="btn danger" type="button" data-sapagar="1" ${state.config.categorias.length<=1?"disabled":""}>Excluir</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="conta"){
    const primeira=!state.config.contas.length, recebe=it?(state.config.contaSalario||(state.config.contas[0]||{}).id)===it.id:primeira;
    corpo=`<label class="f">Nome<input class="in" id="s-nome" maxlength="30" placeholder="ex.: Nubank, Caixa, Carteira" value="${esc(it?it.nome:"")}" data-autofocus></label>
      <div class="seg" role="radiogroup" aria-label="Tipo de conta">${[["corrente","Corrente"],["poupanca","Poupança"],["dinheiro","Dinheiro"],["outra","Outra"]].map(([v,l])=>`<input type="radio" name="s-tipoconta" id="s-tc-${v}" value="${v}" ${(it?it.tipo:"corrente")===v?"checked":""}><label for="s-tc-${v}">${l}</label>`).join("")}</div>
      ${valorCampo(it?it.saldoInicial:(primeira&&state.config.saldoInicial?state.config.saldoInicial:null),"Saldo que a conta tinha no início do controle",false)}
      <label class="switch"><input type="checkbox" id="s-recebe" ${recebe?"checked":""}><span></span>O salário cai nesta conta</label>
      <p class="hint">Lançamentos sem conta escolhida usam a primeira conta da lista${state.config.contas[0]&&!primeira?" ("+esc(state.config.contas[0].nome)+")":""}.</p>`;
    sub=""; botoes=novo?`<button class="btn" type="submit">Criar conta</button>`:`<button class="btn danger" type="button" data-sapagar="1">Excluir conta</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="cartao"){
    const u=it?usoCartao(it):null;
    corpo=`<label class="f">Nome do cartão<input class="in" id="s-nome" maxlength="30" placeholder="ex.: Nubank, Inter, Itaú" value="${esc(it?it.nome:"")}" data-autofocus></label>
      <div class="row"><label class="f">Fecha dia<input class="in num" id="s-fecha" type="number" min="1" max="31" inputmode="numeric" placeholder="ex.: 25" value="${it&&it.fecha?it.fecha:""}"></label><label class="f">Vence dia<input class="in num" id="s-vence" type="number" min="1" max="31" inputmode="numeric" placeholder="ex.: 5" value="${it&&it.vence?it.vence:""}"></label></div>
      ${valorCampo(it?it.limite:null,"Limite do cartão (opcional)",false)}
      ${selConta(it?it.contaId:null,"A fatura é paga pela conta")}
      ${u&&it.limite?`<p class="hint">Usado: <b>${brl(u.usado)}</b> · livre: <b>${brl(u.livre)}</b> (compras e parcelas ainda não pagas).</p>`:`<p class="hint">Compras feitas até o dia anterior ao fechamento entram na fatura do mês; no dia do fechamento, já vão para a próxima.</p>`}`;
    sub=""; botoes=novo?`<button class="btn" type="submit">Salvar cartão</button>`:`<button class="btn danger" type="button" data-sapagar="1">Excluir cartão</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="transf"){
    const cs=state.config.contas;
    corpo=`${valorCampo(it&&it.valor)}
      <div class="row">${selConta(it?it.de:cs[0]&&cs[0].id,"Sai de","s-de")}${selConta(it?it.para:cs[1]&&cs[1].id,"Vai para","s-para")}</div>
      <div class="row"><label class="f">Dia${selDia(k,it?it.dia:diaPadrao)}</label><label class="f" style="flex:2 1 180px">Descrição (opcional)<input class="in" id="s-desc" maxlength="60" placeholder="ex.: saque, guardar na poupança" value="${esc(it?it.desc:"")}"></label></div>
      <p class="hint">Transferência só muda o saldo das contas. Não conta como receita nem como despesa.</p>`;
    botoes=novo?`<button class="btn" type="submit">Transferir</button>`:`${apagar}<button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="importar"){
    sub="";
    if(!s.itens){
      corpo=`<p class="hint">No app ou no site do seu banco, procure <b>Extrato</b> e a opção de <b>exportar / baixar</b> em <b>OFX</b> ou <b>CSV</b> (Excel). Depois escolha o arquivo aqui.</p>
        ${selConta(s.contaImp,"Os lançamentos são da conta","s-impconta")}
        <label class="switch"><input type="checkbox" id="s-impcartao" ${s.cartaoArq?"checked":""}><span></span>É a fatura de um cartão de crédito</label>
        ${state.config.cartoes.length>1?`<div id="s-impcartaobox">${selCartao(s.cartaoImp)}</div>`:""}
        <label class="btn wide" for="s-arquivo" style="cursor:pointer">Escolher arquivo do extrato<input type="file" id="s-arquivo" accept=".ofx,.csv,.txt,text/csv,application/x-ofx" hidden></label>
        ${s.erroImp?`<p class="erro">${esc(s.erroImp)}</p>`:""}
        <p class="hint">O app sugere a categoria de cada gasto e desmarca o que já foi lançado. Você confere antes de importar.</p>`;
    } else {
      const its=s.itens, inc=its.filter(x=>x.incluir&&!x.bloq), cats=state.config.categorias;
      corpo=`<p class="hint"><b>${esc(s.arquivo||"Arquivo")}</b> · ${its.length} lançamentos · ${inc.filter(x=>x.tipo==="gasto").length} despesa${inc.filter(x=>x.tipo==="gasto").length===1?"":"s"} (${brl(soma(inc.filter(x=>x.tipo==="gasto")))}) e ${inc.filter(x=>x.tipo==="receita").length} receita${inc.filter(x=>x.tipo==="receita").length===1?"":"s"} (${brl(soma(inc.filter(x=>x.tipo==="receita")))}) marcadas</p>
        <div class="implista">${its.slice(0,400).map((x,i)=>`<div class="imp ${x.incluir&&!x.bloq?"":"off"} ${x.tipo}">
          <input type="checkbox" data-impi="${i}" ${x.incluir&&!x.bloq?"checked":""} ${x.bloq?"disabled":""} aria-label="Importar este lançamento">
          <span class="d">${pad2(x.dia)}/${pad2(kM(x.k))}</span>
          <span class="t"><b>${esc(x.desc||"sem descrição")}</b>${x.obs?`<small>${esc(x.obs)}</small>`:""}
            ${x.tipo==="gasto"?`<select class="in mini" data-impcat="${i}" aria-label="Categoria">${cats.map(c=>`<option value="${esc(c.id)}" ${c.id===x.cat?"selected":""}>${esc(c.nome)}</option>`).join("")}</select>`:x.tipo==="receita"?`<small class="pos">receita</small>`:""}</span>
          <span class="v ${x.tipo==="receita"?"pos":""}">${x.tipo==="receita"?"+":"−"}${brl(x.valor)}</span></div>`).join("")}</div>
        ${its.length>400?`<p class="hint">Mostrando os 400 primeiros.</p>`:""}`;
      botoes=`<button class="btn ghost" type="button" data-impvoltar="1">Outro arquivo</button><button class="btn" type="button" data-impok="1">Importar ${inc.length} lançamento${inc.length===1?"":"s"}</button>`;
    }
  }else if(s.tipo==="desafio"){
    const e=it?estadoDesafio(it):null, tp=it?it.tipo:(s.mod&&MODELOS_DES[s.mod]?MODELOS_DES[s.mod].tipo:"sem"), md=s.mod&&MODELOS_DES[s.mod]||{};
    const catSel=it?it.cat:(md.icCat?((state.config.categorias.find(c=>catIc(c.id)===md.icCat)||{}).id||""):"");
    corpo=`${novo?`<div class="f"><span>Comece por um modelo</span><div class="cats modelos">${Object.entries(MODELOS_DES).map(([kk,m])=>`<button type="button" class="tag ${s.mod===kk?"on":""}" data-desmodelo="${kk}">${esc(m.nome)}</button>`).join("")}</div></div>`:""}
      ${e?`<div class="desafio ${e.st}" style="cursor:default"><div class="track ${e.st==="quebrou"?"over":""}"><div style="width:${Math.min(100,Math.round(e.pct*100))}%"></div></div><small>${esc(textoDesafio(it,e))}</small></div>`:""}
      <label class="f">Nome<input class="in" id="s-nome" maxlength="50" placeholder="ex.: 30 dias sem delivery" value="${esc(it?it.nome:md.nome||"")}"></label>
      <div class="f"><span>Tipo</span><div class="seg"><input type="radio" name="s-dtipo" id="s-dt-sem" value="sem" ${tp==="sem"?"checked":""}><label for="s-dt-sem">Não gastar nada</label><input type="radio" name="s-dtipo" id="s-dt-max" value="max" ${tp==="max"?"checked":""}><label for="s-dt-max">Gastar no máximo</label></div></div>
      <div id="s-dvalbox" ${tp==="max"?"":"hidden"}>${valorCampo(it?it.valor:md.valor||null,"Valor máximo no período",false)}</div>
      <label class="f">Com o quê (categoria)<select class="in" id="s-dcat"><option value="">Qualquer categoria (use as palavras)</option>${state.config.categorias.map(c=>`<option value="${esc(c.id)}" ${c.id===catSel?"selected":""}>${esc(c.nome)}</option>`).join("")}</select></label>
      <label class="f">Palavras na descrição (opcional)<input class="in" id="s-dpal" maxlength="80" placeholder="ex.: ifood, delivery, rappi" value="${esc(it?it.palavras:md.palavras||"")}"></label>
      <div class="row"><label class="f">Duração<select class="in" id="s-ddias">${[7,10,15,21,30,60,90].concat(it&&![7,10,15,21,30,60,90].includes(it.dias)?[it.dias]:[]).map(n=>`<option value="${n}" ${n===(it?it.dias:md.dias||30)?"selected":""}>${n} dias</option>`).join("")}</select></label><label class="f">Começa em<input class="in" id="s-dini" type="date" value="${it?it.inicio:hojeISO()}"></label></div>
      <p class="hint">O app confere sozinho pelos seus lançamentos: conta se a despesa for da categoria escolhida <b>ou</b> tiver uma das palavras na descrição.</p>`;
    sub=""; botoes=novo?`<button class="btn" type="submit">Começar desafio</button>`:`<button class="btn danger" type="button" data-sapagar="1">Excluir</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="meta"){
    const i=it?infoMeta(it,null):null;
    corpo=`<label class="f">Nome da meta<input class="in" id="s-nome" maxlength="40" placeholder="ex.: Viagem, Reserva de emergência" value="${esc(it?it.nome:"")}" data-autofocus></label>
      ${valorCampo(it&&it.alvo,"Quanto quer juntar",false)}
      <label class="f">Prazo (opcional)<input class="in" id="s-prazo" type="month" min="${todayKey}" value="${it&&it.prazo?it.prazo:""}"></label>
      ${i?`<div class="metas">${linhaMeta(it,null).replace('data-edit="meta"','data-x="1"')}</div><button class="btn ghost" type="button" data-sguardarmeta="1">+ Guardar nesta meta</button>`:`<p class="hint">Com prazo, o app mostra quanto guardar por mês para chegar lá.</p>`}`;
    sub=""; botoes=novo?`<button class="btn" type="submit">Criar meta</button>`:`<button class="btn danger" type="button" data-sapagar="1">Excluir meta</button><button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="viagem"){
    const r=it?resumoViagem(it):null, mo=it?it.moeda:"USD";
    corpo=`<label class="f">Nome da viagem<input class="in" id="s-nome" maxlength="40" placeholder="ex.: Chile 2027, Férias em Paris" value="${esc(it?it.nome:"")}" ${novo?"data-autofocus":""}></label>
      <div class="row"><label class="f">Ida<input class="in" id="s-vini" type="date" value="${esc(it&&it.inicio?it.inicio:hojeISO())}"></label><label class="f">Volta<input class="in" id="s-vfim" type="date" value="${esc(it&&it.fim?it.fim:"")}"></label></div>
      <label class="f">Moeda do destino<select class="in" id="s-vmoeda">${MOEDAS.map(([c,n])=>`<option value="${c}" ${c===mo?"selected":""}>${c} · ${esc(n)}</option>`).join("")}</select></label>
      <div class="row"><label class="f"><span id="s-vcotlab">Cotação (1 ${esc(mo)} em R$)</span><input class="in" id="s-vcot" inputmode="decimal" placeholder="ex.: 5,40" value="${esc(it?fmtCot(it.cotacao):"")}"></label><label class="f narrow">Taxas %<input class="in" id="s-vtaxa" inputmode="decimal" placeholder="0" value="${esc(it&&it.taxa?fmtCot(it.taxa):"")}"></label></div>
      <p class="hint" id="s-vcotinfo">${novo?"":"Mudar a cotação vale para os próximos gastos; os já lançados mantêm a cotação do dia em que foram lançados."}</p>
      <button class="btn ghost" type="button" data-vgcot="1">Buscar cotação de hoje</button>
      <p class="hint">Em "Taxas %", some o IOF e o spread que o seu cartão ou banco cobra em compras no exterior (confira no app do banco). Deixe 0 se pagar em dinheiro trocado.</p>
      <label class="f money">Orçamento da viagem em R$ (opcional)<input class="in num" id="s-valor" inputmode="numeric" placeholder="sem limite" value="${esc(it&&it.orcamento?moneyInput(it.orcamento):"")}"></label>`
      +(r?`<div class="divpags"><div class="subhead">Resumo</div>
        <div class="assintot"><div><span class="lab">Total</span><b>${brl(r.total)}</b>${it.moeda!=="BRL"?`<small>${fmtMoeda(r.emMoeda,it.moeda)} em ${it.moeda}</small>`:""}</div><div><span class="lab">Por dia</span><b>${brl(r.porDia)}</b><small>${r.passados} de ${r.dias} dias</small></div>${it.orcamento?`<div><span class="lab">${r.resta>=0?"Resta":"Passou"}</span><b class="${r.resta<0?"neg":"pos"}">${brl(Math.abs(r.resta))}</b></div>`:""}</div>
        ${Object.keys(r.porCat).length?`<div class="bars">${Object.entries(r.porCat).sort((a,b)=>b[1]-a[1]).map(([cid,v])=>`<div class="bar" style="--dot:${catColor(cid)}"><div class="t"><b>${esc(catName(cid))}</b><span class="num">${brl(v)}</span></div><div class="track"><div style="width:${(r.total?v/r.total*100:0).toFixed(1)}%"></div></div></div>`).join("")}</div>`:`<p class="hint">Nenhum gasto lançado nesta viagem ainda.</p>`}
        ${r.gs.length?`<div class="subhead">Gastos (${r.gs.length})</div>${r.gs.slice().reverse().slice(0,40).map(g=>`<div class="pagrow"><span>${pad2(g.dia)}/${pad2(kM(g.k))}</span><b>${esc(g.desc||catName(g.cat))}</b><small class="muted">${g.orig&&g.orig.moeda!=="BRL"?esc(fmtMoeda(g.orig.valor,g.orig.moeda)):""}</small><span>${brl(g.valor)}</span></div>`).join("")}`:""}</div>`:"");
    sub=""; botoes=novo?`<button class="btn" type="submit">Criar viagem</button>`:`${apagar}<button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="divida"){
    const tp=it?it.tipo:(s.dTipo||"receber"), nomes=[...new Set(state.config.dividas.map(x=>x.pessoa))];
    corpo=`<div class="seg" role="radiogroup" aria-label="Tipo"><input type="radio" name="s-dtipo" id="s-dtR" value="receber" ${tp==="receber"?"checked":""}><label for="s-dtR">Me devem</label><input type="radio" name="s-dtipo" id="s-dtP" value="pagar" ${tp==="pagar"?"checked":""}><label for="s-dtP">Eu devo</label></div>
      <label class="f">Pessoa<input class="in" id="s-pessoa" maxlength="40" list="s-pessoas" placeholder="ex.: João" value="${esc(it?it.pessoa:"")}" ${novo?"data-autofocus":""}></label><datalist id="s-pessoas">${nomes.map(n=>`<option value="${esc(n)}">`).join("")}</datalist>
      ${valorCampo(it&&it.valor,"Valor total",false)}
      <label class="f">Do que é (opcional)<input class="in" id="s-desc" maxlength="60" placeholder="ex.: empréstimo, conta do bar" value="${esc(it?it.desc:"")}"></label>
      <div class="row"><label class="f">Data<input class="in" id="s-ddata" type="date" value="${esc(it&&it.data?it.data:hojeISO())}"></label><label class="f">Combinado para (opcional)<input class="in" id="s-dvenc" type="date" value="${esc(it&&it.venc?it.venc:"")}"></label></div>`
      +(it?`<div class="divpags"><div class="subhead">Pagamentos</div>
        ${it.pags.length?it.pags.map(p=>`<div class="pagrow"><span>${dataCurta(p.data)}</span><b>${brl(p.valor)}</b><button type="button" class="link" data-divdelpag="${esc(p.id)}" aria-label="Apagar pagamento">apagar</button></div>`).join(""):`<p class="hint">Nenhum pagamento ainda.</p>`}
        <p class="divresta">${quitada(it)?`<b class="pos">Quitada</b>`:`Falta <b>${brl(restaDiv(it))}</b> de ${brl(it.valor)}`}</p>
        ${quitada(it)?"":`<div class="convrow"><label class="f money" style="flex:1"><span class="sr">Valor pago</span><input class="in num" id="s-pagval" inputmode="numeric" placeholder="${moneyInput(restaDiv(it))}"></label><button class="btn" type="button" data-divpag="1">Registrar</button></div>
        <label class="switch"><input type="checkbox" id="s-paglanca"><span></span>Lançar no mês como ${it.tipo==="receber"?"receita":"despesa"}</label>
        <button class="link" type="button" data-divquitar="1">Quitar tudo (${brl(restaDiv(it))})</button>`}</div>`:"");
    sub=""; botoes=novo?`<button class="btn" type="submit">Salvar</button>`:`${apagar}<button class="btn" type="submit">Salvar</button>`;
  }else if(s.tipo==="retro"){
    const d=dadosRetro(s.ano), sl=d?slidesRetro(d):[]; s.slide=Math.max(0,Math.min(s.slide||0,sl.length-1));
    corpo=d?`<div class="rprog">${sl.map((x,i)=>`<i class="${i<s.slide?"on":i===s.slide?"on cur":""}"></i>`).join("")}</div><div class="rslide ${sl[s.slide].cls}" data-rtoque="1">${sl[s.slide].html}</div>`:`<p class="hint">Ainda não há dados para a retrospectiva.</p>`;
    sub=d?(s.slide+1)+" de "+sl.length:""; botoes=d?`<button class="btn ghost" type="button" data-rpasso="-1" ${s.slide===0?"disabled":""}>Anterior</button>${s.slide<sl.length-1?`<button class="btn" type="button" data-rpasso="1">Próximo</button>`:`<button class="btn" type="button" data-sfechar="1">Fechar</button>`}`:"";
  }else if(s.tipo==="pin"){
    const campo=(id,lab,auto)=>`<label class="f">${lab}<input class="in pinin" id="${id}" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="${PINLEN}" autocomplete="off" ${auto?"data-autofocus":""}></label>`;
    corpo=(s.pinModo!=="criar"?campo("s-pinatual","PIN atual",true):"")+(s.pinModo!=="desligar"?campo("s-pinnovo","Novo PIN ("+PINLEN+" números)",s.pinModo==="criar")+campo("s-pinrep","Repita o novo PIN"):"")
      +(s.pinModo==="criar"?`<p class="hint">${mode==="cloud"?"Guarde bem: se esquecer, é preciso sair e entrar de novo com a conta Google para tirar o PIN.":"Guarde bem: sem login, se esquecer o PIN a única saída é apagar os dados deste aparelho."}</p>`:"");
    sub=""; botoes=`<button class="btn ${s.pinModo==="desligar"?"danger":""}" type="submit">${s.pinModo==="desligar"?"Desligar PIN":s.pinModo==="trocar"?"Trocar PIN":"Criar PIN"}</button>`;
  }else if(s.tipo==="avisos"){
    corpo=`<div class="avisos">${listaAvisos()}</div>`; sub=""; botoes="";
  }else if(s.tipo==="calc"){
    corpo=corpoCalc(s.calc||"decimo"); sub=""; botoes="";
  }else if(s.tipo==="simulador"){
    const devo=(state.config.dividas||[]).filter(x=>x.tipo==="pagar"&&!quitada(x));
    corpo=`<p class="hint">Descubra em quanto tempo quita uma dívida (cartão, cheque especial, empréstimo ou financiamento) e quanto economiza pagando um pouco a mais.</p>
      ${devo.length?`<div class="f"><span>Usar uma dívida anotada</span><div class="cats">${devo.map(x=>`<button type="button" class="tag" data-simdiv="${esc(x.id)}">${esc(x.pessoa)} · ${brl(restaDiv(x))}</button>`).join("")}</div></div>`:""}
      <label class="f money">Quanto deve hoje<input class="in num" id="s-simsaldo" inputmode="numeric" placeholder="0,00" value="${s.simSaldo?moneyInput(s.simSaldo):""}"></label>
      <p class="hint" id="s-simsaldoinfo"></p>
      <div class="row"><label class="f">Juros ao mês (%)<input class="in num" id="s-simtaxa" inputmode="decimal" placeholder="ex.: 2,5" maxlength="6"></label><label class="f">Ou: faltam quantas parcelas?<input class="in num" id="s-simn" type="number" min="1" max="600" inputmode="numeric" placeholder="opcional"></label></div>
      <div class="f"><span>Taxas de exemplo (confira a sua)</span><div class="cats">${[["Rotativo do cartão","14"],["Cheque especial","8"],["Empréstimo pessoal","4"],["Consignado","1,8"],["Financiamento","1,2"]].map(([n,t])=>`<button type="button" class="tag" data-simtaxa="${t}">${n} ~${t}%</button>`).join("")}</div></div>
      <div class="row"><label class="f money">Paga por mês hoje<input class="in num" id="s-simpag" inputmode="numeric" placeholder="0,00"></label><label class="f money">E se pagar a mais?<input class="in num" id="s-simextra" inputmode="numeric" placeholder="0,00"></label></div>
      <div id="s-simres">${resultadoSim()}</div>`;
    sub=""; botoes="";
  }else if(s.tipo==="meses"){
    const V=mesesVisiveis(), a0=kY(V[0]), a1=kY(V[V.length-1]), ano=Math.min(a1,Math.max(a0,Number(s.ano)||kY(ui.month))), sel=s.sel||ui.month;
    corpo=`<div class="mesano"><div class="mesnav"><button type="button" class="iconbtn" data-mesano="-1" aria-label="Ano anterior" ${ano<=a0?"disabled":""}>‹</button><b>${ano}</b><button type="button" class="iconbtn" data-mesano="1" aria-label="Próximo ano" ${ano>=a1?"disabled":""}>›</button></div>
      <div class="mesgrid">${ABR.map((ab,i)=>{ const k=keyOf(ano,i+1), ok=V.includes(k), conta=ok&&k>todayKey&&temContaNoMes(k);
        return `<button type="button" class="mg ${k===sel?"on":""} ${k===todayKey?"now":""}" data-messel="${k}" ${ok?"":"disabled"} aria-pressed="${k===sel}" aria-label="${esc(nomeMes(k))}${conta?", com conta a pagar":""}">${esc(ab.toUpperCase())}${conta?'<i class="mgdot" aria-hidden="true"></i>':""}</button>`; }).join("")}</div>
      <p class="hint mgleg"><i class="mgdot" aria-hidden="true"></i> mês com fatura ou parcela para pagar</p></div>`;
    sub=""; botoes=`<button class="btn" type="button" data-mesok="1">Ver ${esc(nomeMes(sel).toLowerCase())}</button>`;
  }else if(s.tipo==="semana"){
    corpo=`<div class="semana">${corpoSemana(s.fim||ultimoDomingo())}</div>`; sub=""; botoes="";
  }else if(s.tipo==="dia"){
    const dd=Math.min(diasMes(k),Math.max(1,Number(s.dia)||1));
    corpo=corpoDia(k,dd); sub=esc(nomeMes(k));
    botoes=`<button class="btn" type="button" data-callancar="${dd}">${ICON.mais||"+"} Lançar despesa neste dia</button>`;
  }else if(s.tipo==="busca"){
    corpo=`<label class="f"><span>Procure pela descrição, categoria, valor ou #etiqueta</span><input class="in" id="s-busca" type="search" placeholder="ex.: farmácia, aluguel, 89,90" value="${esc(s.q||"")}" data-autofocus autocomplete="off"></label><div id="s-result" class="busca"></div>`;
    sub="";
  }
  r.innerHTML=`<div class="sheet-wrap ${s.tipo==="retro"?"stories":""}" data-sfechar="1" role="dialog" aria-modal="true" aria-labelledby="sheetTit"><form class="sheet${s.tipo==="retro"?" st"+((s.slide||0)%6):""}" id="sheetForm" autocomplete="off" novalidate>
    <div class="sheethead"><h2 id="sheetTit">${esc(titulos[s.tipo])}</h2><span class="muted small">${sub}</span><button type="button" class="x" data-sfechar="1" aria-label="Fechar">×</button></div>
    ${abas}${corpo}<p class="erro" id="s-erro" hidden></p>${botoes?`<div class="sheetbtns">${botoes}</div>`:""}</form></div>`;
  if(s.tipo==="busca") atualizaBusca();
  /* retrospectiva em stories: avança sozinha a cada 6,5 s (não com "reduzir movimento") */
  clearTimeout(timerStory);
  if(s.tipo==="retro"&&!semMovimento()){ const fixo=s.slide; timerStory=setTimeout(()=>{ if(ui.sheet===s&&s.slide===fixo){ const nx=document.querySelector('#sheet [data-rpasso="1"]'); if(nx) nx.click(); } },6500); }
  if(s.tipo==="gasto") atualizaVg();
  setTimeout(()=>encolheValores(document.getElementById("sheet")),0);
  if(s.tipo==="conta"){ const ev=document.getElementById("s-valor"); if(ev) ev.dataset.neg="1"; }
  if(s.tipo==="gasto") atualizaParc();
  if(s.tipo==="gasto"||s.tipo==="parcela") atualizaFormaBox();
}
/* mostra o valor de cada parcela enquanto a pessoa digita */
function atualizaParc(){
  const box=document.getElementById("s-parcbox"), on=document.getElementById("s-parc"); if(!box||!on) return;
  box.hidden=!on.checked; document.getElementById("s-valorlab").textContent=on.checked?"Valor total da compra":"Valor"; if(document.getElementById("s-vgon")) atualizaVg();
  let v=parseMoney(document.getElementById("s-valor").value); const n=Math.round(Number(document.getElementById("s-n").value)||0);
  const vgOn=document.getElementById("s-vgon"), vgP=vgOn&&vgOn.checked?(state.config.viagens||[]).find(x=>x.id===((document.getElementById("s-vgid")||{}).value)):null, mP=(document.querySelector('#sheet input[name="s-vgmoeda"]:checked')||{}).value;
  if(vgP&&mP&&mP!=="BRL"&&v>0) v=emReais(v,vgP);
  document.getElementById("s-parcinfo").textContent=on.checked&&v>0&&n>=2?(valorParcela(v,n,0)===valorParcela(v,n,n-1)?n+"x de "+brl(valorParcela(v,n,0)):n+"x de "+brl(valorParcela(v,n,0))+" (última "+brl(valorParcela(v,n,n-1))+")")+", a primeira em "+abrMes(document.querySelector('#sheet input[name="s-forma"]:checked')?.value==="credito"?faturaMes((document.getElementById("s-gmes")||{}).value||((document.getElementById("s-gmes")||{}).value||mesSheet()),Number(document.getElementById("s-dia").value)||1,state.config.cartoes.find(c=>c.id===valSel("s-cartao"))||state.config.cartoes[0]||null):((document.getElementById("s-gmes")||{}).value||mesSheet())):"";
}
/* busca em todos os meses */
function atualizaBusca(){
  const el=document.getElementById("s-result"); if(!el) return;
  const q=((document.getElementById("s-busca")||{}).value||"").trim().toLowerCase(); ui.sheet.q=q;
  if(q.length<2){ el.innerHTML='<p class="hint">Digite pelo menos 2 letras.</p>'; return; }
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
  el.innerHTML=res.length?`<p class="hint">${res.length} resultado${res.length===1?"":"s"}</p>`+res.slice(0,60).map(x=>`<button type="button" class="item" data-sres="${x.tipo}" data-id="${esc(x.id)}" data-mes="${x.k||""}"><span class="pill">${x.k?esc(abrMes(x.k)):"fixa"}</span><span class="desc"><b>${esc(x.t)}</b><small>${esc(x.s)}</small></span><span class="v ${x.v>0?"pos":""}">${brl(Math.abs(x.v))}</span></button>`).join(""):'<p class="hint">Nada encontrado.</p>';
}
function erroSheet(msg,campo){ salvando=false; const e=document.getElementById("s-erro"); if(e){ e.textContent=msg; e.hidden=false; } if(campo){ const c=document.getElementById(campo); if(c) c.focus(); } }
const TIPOS_COM_ITEM=["desafio","viagem","gasto","avulso","caixinha","fixo","fixoMes","parcela","renda","rendaMes","categoria","meta","conta","cartao","transf","divida"];
let salvando=false;
function salvarSheet(outro){
  const s=ui.sheet, k=mesSheet(); if(!s) return;
  if(s.id&&TIPOS_COM_ITEM.includes(s.tipo)&&!itemAtual()){ closeSheet(); render(); toast("Este item foi apagado (talvez em outro aparelho)."); return; }
  if(salvando) return; salvando=true; setTimeout(()=>{ salvando=false; },350);
  if(s.tipo==="busca") return;
  if(s.tipo==="pin"){ salvarPin(); return; }
  if(s.tipo==="retro") return;
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
  if(s.tipo==="importar"){ if(s.itens) importarExtrato(); return; }
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
    if(s.id) Object.assign(itemAtual(),{nome,orcamento:lim,cor,subs,ic,sobra:sobraOn,sobraDesde}); else state.config.categorias.push({id:"c"+uidGen(),nome,orcamento:lim,cor,subs,ic,sobra:sobraOn,sobraDesde});
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
    /** @type {any} conta fixa ou renda */
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
    const subSel=radio("s-sub")||null, sub=subSel&&subName(cat,subSel)?subSel:null, tags=lerTags(val("s-tags"));
    const gm=val("s-gmes"), kd=gm&&(MESES.includes(gm)||gm===k)?gm:k, md=getMonth(kd), diaD=Math.min(dia,diasMes(kd)), emMes=kd!==ui.month?" em "+abrMes(kd):"";
    const vgOn=(document.getElementById("s-vgon")||{}).checked, vgSel=vgOn?(state.config.viagens||[]).find(x=>x.id===val("s-vgid")):null, vgMoeda=vgSel&&radio("s-vgmoeda")===vgSel.moeda?vgSel.moeda:"BRL";
    const old=s.id?itemAtual():null, mant=!!(old&&old.orig&&vgSel&&old.viagemId===vgSel.id&&old.orig.moeda===vgMoeda);
    const orig=vgSel&&vgMoeda!=="BRL"?{moeda:vgMoeda,valor:v,cotacao:mant?old.orig.cotacao:vgSel.cotacao,taxa:mant?old.orig.taxa:(vgSel.taxa||0)}:null, vv=orig?emReais(v,orig):v;
    const poeExtra=o=>{ if(sub) o.sub=sub; else delete o.sub; if(tags.length) o.tags=tags; else delete o.tags; if(vgSel) o.viagemId=vgSel.id; else delete o.viagemId; if(orig) o.orig=orig; else delete o.orig; return o; };
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
    const b=e.target.closest("[data-mesano],[data-messel],[data-mesok],[data-calctipo],[data-calcmeta],[data-simtaxa],[data-simdiv],[data-avsemana],[data-semnav],[data-avbackup],[data-avbackupdepois],[data-desmodelo],[data-caledit],[data-callancar],[data-vgcot],[data-rtoque],[data-addtag],[data-addsub],[data-delsub],[data-divpag],[data-divquitar],[data-divdelpag],[data-avdiv],[data-avretro],[data-rpasso],[data-rano],[data-rshare],[data-avpagar],[data-avgrupo],[data-avmes],[data-avassin],[data-avperfil],[data-impok],[data-impvoltar],[data-sguardarmeta],[data-sexcluirfixo],[data-sfechar],[data-sapagar],[data-sencerrar],[data-spular],[data-sabrir],[data-outro],[data-sres],[data-snovacat],[data-scriacat]");
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
    if(b.dataset.mesano){ ui.sheet.ano=(Number(ui.sheet.ano)||kY(ui.month))+Number(b.dataset.mesano); renderSheet(); return; }
    if(b.dataset.messel){ ui.sheet.sel=b.dataset.messel; ui.sheet.ano=kY(b.dataset.messel); renderSheet(); return; }
    if(b.dataset.mesok){ const k=ui.sheet.sel||ui.month; closeSheet(); goMonth(k); window.scrollTo({top:0}); return; }
    if(b.dataset.semnav){ const nf=somaDias(ui.sheet.fim||ultimoDomingo(),Number(b.dataset.semnav)); if(nf<=ultimoDomingo()){ ui.sheet.fim=nf; renderSheet(); } return; }
    if(b.dataset.avretro){ openSheet("retro",null,{ano:Number(b.dataset.avretro),slide:0}); return; }
    if(b.dataset.vgcot){ buscarCotacao(); return; }
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
    if(b.dataset.impvoltar){ s.itens=null; s.erroImp=""; renderSheet(); return; }
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
    if(b.dataset.sres){ const t=b.dataset.sres, id=b.dataset.id, mes=b.dataset.mes; closeSheet(); ui.tab=t==="fixo"?"ajustes":"mes";
      if(t!=="fixo"&&t!=="parcela"&&mes){ ui.month=mes; render(); openSheet(t,id); } else { render(); openSheet(t,id); } return; }
    if(b.dataset.sapagar){
      const id=s.id; closeSheet();
      if(s.tipo==="parcela") apagarItem("config","parcelas",id,"Compra parcelada apagada.");
      else if(s.tipo==="categoria") apagarItem("config","categorias",id,"Categoria excluída.");
      else if(s.tipo==="conta"){ if(state.config.contaSalario===id) state.config.contaSalario=null; apagarItem("config","contas",id,"Conta excluída (os lançamentos dela passam para a primeira conta)."); }
      else if(s.tipo==="cartao") apagarItem("config","cartoes",id,"Cartão excluído.");
      else if(s.tipo==="transf") apagarItem(k,"transf",id,"Transferência apagada.");
      else if(s.tipo==="divida") apagarItem("config","dividas",id,"Dívida excluída.");
      else if(s.tipo==="viagem") apagarItem("config","viagens",id,"Viagem excluída (os gastos continuam no mês).");
      else if(s.tipo==="desafio") apagarItem("config","desafios",id,"Desafio excluído.");
      else if(s.tipo==="meta") apagarItem("config","metas",id,"Meta excluída (o dinheiro guardado volta para a caixinha geral).");
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
  r.addEventListener("input",e=>{ if(/^s-sim/.test(e.target.id)){ setTimeout(atualizaSim,0); return; } if(/^s-c/.test(e.target.id)&&ui.sheet&&ui.sheet.tipo==="calc"){ setTimeout(atualizaCalc,0); return; } if(e.target.id==="s-rapido"){ const pv=document.getElementById("s-rapprev"); if(pv) pv.innerHTML=previaRapido(e.target.value.trim()?interpretaRapido(e.target.value):null); clearTimeout(_rapT); _rapT=setTimeout(()=>{ const inp=document.getElementById("s-rapido"); if(inp&&inp.value.trim()){ aplicaRapido(false,true); if(document.activeElement!==inp) inp.focus(); } },250); return; } if(e.target.id==="s-busca") atualizaBusca(); if(["s-valor","s-n"].includes(e.target.id)) atualizaParc(); });
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

/* =====================================================================
   EVENTOS
   ===================================================================== */
const app=document.getElementById("app");
function goMonth(k){ if(!mesesVisiveis().includes(k)) return; ui.month=k; render(); }
function passo(n){ const V=mesesVisiveis(), i=V.indexOf(ui.month)+n; if(V[i]){ goMonth(V[i]); return true; } return false; }
function setTab(t){ if(t!=="mes"&&ui.tab==="mes") marcaHist("tab"); else if(t==="mes"&&ui.tab!=="mes"&&history.state&&history.state.mb==="tab"){ ui.tab=t; _ignoraPop++; try{ history.back(); }catch(e){ _ignoraPop--; } render(); window.scrollTo({top:0}); return; } ui.tab=t; render(); window.scrollTo({top:0}); }
app.addEventListener("click",e=>{
  const b=e.target.closest("button,tr[data-open]"); if(!b) return;
  const d=b.dataset;
  if(d.espaco){ if(d.irpara){ ui.tab="perfil"; ui.rolarPara=d.irpara; } if(d.espaco===aberto) render(); else trocarEspaco(d.espaco); return; }
  if(d.irpara){ ui.tab="perfil"; render(); setTimeout(()=>{ const el=document.getElementById(d.irpara); if(el) el.scrollIntoView({block:"start",behavior:"smooth"}); },60); return; }
  if(d.tab){ setTab(d.tab); return; }
  if(d.abre){ ui.abre[d.abre]=!ui.abre[d.abre]; try{ localStorage.setItem("mb.abre",JSON.stringify(ui.abre)); }catch(e){} render(); if(ui.abre[d.abre]){ const sc=document.getElementById("sec-"+d.abre); if(sc) setTimeout(()=>sc.scrollIntoView({block:"nearest",behavior:"smooth"}),40); } return; }
  if(d.rolar){ const el=garanteVisivel(d.rolar); if(el) el.scrollIntoView({block:"start",behavior:"smooth"}); return; }
  if(d.irajustes){ setTab("ajustes"); return; }
  if(d.pular){ const m=document.getElementById("conteudo"), alvo=/** @type {HTMLElement|null} */(m&&(m.querySelector(".pagetitle h2, .heroSaldo, h2, h1")||m.firstElementChild));
    if(alvo){ if(!alvo.hasAttribute("tabindex")) alvo.setAttribute("tabindex","-1"); alvo.classList.add("alvo-pulo"); alvo.focus({preventScroll:true}); alvo.scrollIntoView({block:"start"}); } return; }
  if(d.login){ entrar(); return; }
  if(d.apres){ ui.verLogin=true; if(d.apres==="criar") ui.loginModo="criar"; render(); window.scrollTo({top:0}); return; }
  if(d.termos){ acaoTermos(d.termos); return; }
  if(d.comp){ acaoComp(d.comp,d.id); return; }
  if(d.virafixo!==undefined){ virarFixo(+d.virafixo); return; }
  if(d.logout){ setStatus("Salvando antes de sair…","saving"); salvaPendentes().finally(()=>fb.signOut(fb.auth)); return; }
  if(d.tema){ trocaTema(); return; }
  if(d.export){ exportar(); return; }
  if(d.month){ goMonth(d.month); return; }
  if(d.mescal){ openSheet("meses",null,{ano:kY(ui.month),sel:ui.month}); return; }
  if(d.nav){ passo(Number(d.nav)); return; }
  if(d.open){ ui.tab="mes"; goMonth(d.open); window.scrollTo({top:0}); return; }
  if(d.vertag){ openSheet("busca",null,{q:"#"+d.vertag}); return; }
  if(d.vertodasrec){ ui.verTodasRec=ui.verTodasRec===d.vertodasrec?null:d.vertodasrec; render(); return; }
  if(d.vercats){ const abrindo=!ui.verCats; ui.verCats=abrindo; render(); if(!abrindo){ const c=document.querySelector("[data-vercats]"); if(c) c.closest(".card").scrollIntoView({block:"start",behavior:"smooth"}); } return; }
  if(d.vertodas){ const abrindo=ui.verTodas!==d.vertodas; ui.verTodas=abrindo?d.vertodas:null; render(); if(!abrindo){ const c=document.querySelector(".listaresumo"); if(c) c.closest(".card").scrollIntoView({block:"start",behavior:"smooth"}); } return; }
  if(d.verquit){ ui.verQuit=!ui.verQuit; render(); return; }
  if(d.novo&&d.calc){ openSheet("calc",null,{calc:d.calc}); return; }
  if(d.novo){ openSheet(d.novo,null,d.cxtipo?{cxTipo:d.cxtipo}:d.pinmodo?{pinModo:d.pinmodo}:d.dtipo?{dTipo:d.dtipo}:null); return; }
  if(d.edit){ openSheet(d.edit,d.id,d.mes?{mes:d.mes}:null); return; }
  if(d.busca){ openSheet("busca"); return; }
  if(d.planilha){ exportarPlanilha(); return; }
  if(d.copialink){ const u=location.href; (navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>toast("Link copiado. Cole no Chrome ou Safari.")).catch(()=>prompt("Copie o link:",u)); return; }
  if(d.apagar==="pedir"){ ui.confirmaApagar=true; render(); const el=document.getElementById("txtApagar"); if(el) el.focus(); return; }
  if(d.apagar==="nao"){ ui.confirmaApagar=false; render(); return; }
  if(d.apagar==="sim"){ const el=document.getElementById("txtApagar"); if(!el||el.value.trim().toUpperCase()!=="APAGAR"){ toast("Digite APAGAR para confirmar."); if(el) el.focus(); return; } apagarTudo(); return; }
  if(d.delfixo){ excluirFixo(d.delfixo,ui.month); return; }
  if(d.pago){ const o=getMonth(ui.month).fixos[d.pago]||{}; marcaPago("fixo",d.pago,ui.month,!o.pago); return; }
  if(d.gpago){ const g=getMonth(d.mes||ui.month).gastos.find(x=>x.id===d.gpago); if(g) marcaGastoPago(d.mes||ui.month,d.gpago,!g.pago); return; }
  if(d.pagar){ pagarPend(d.pagar); return; }
  if(d.avisos){ openSheet("avisos"); return; }
  if(d.semana){ openSheet("semana",null,{fim:ultimoDomingo()}); return; }
  if(d.caldia){ openSheet("dia",null,{dia:Number(d.caldia)}); return; }
  if(d.status){ toast(statusTxt); return; }
  if(d.tutorial){ abrirTutorial(); return; }
  if(d.retro){ openSheet("retro",null,{ano:Number(d.retro),slide:0}); return; }
  if(d.calendario){ exportarCalendario(); return; }
  if(d.delcat){ apagarItem("config","categorias",d.delcat,"Campo retirado."); return; }
  if(d.addcat){ const id="c"+uidGen(); state.config.categorias.push({id,nome:"Novo gasto",orcamento:0}); save("config"); render(); const el=document.getElementById("cn-"+id); if(el){ el.focus(); el.select(); } return; }
});
app.addEventListener("change",e=>{
  const t=e.target, money=()=>t.value.trim()===""?0:parseMoney(t.value);
  if(t.name==="a11ytexto"){ a11y.texto=Number(t.value)||1; salvaA11y(); render(); anunciar("Tamanho do texto alterado."); return; }
  if(t.dataset&&t.dataset.a11y){ const k=t.dataset.a11y; if(k in a11y&&typeof a11y[k]==="boolean"){ a11y[k]=!!t.checked; salvaA11y(); render(); anunciar((t.checked?"Ligado: ":"Desligado: ")+((t.closest("label")||{}).querySelector?t.closest("label").querySelector("b").textContent:"")); } return; }
  if(t.name==="ptema"){ tema=t.value; try{localStorage.setItem("meucaixa.tema",tema)}catch(e){} aplicaTema(); render(); return; }
  if(t.name==="lmodo"){ ui.loginModo=t.value; render(); return; }
  if(t.id==="pinBio"){ if(t.checked) ligarBio(); else desligarBio(); return; }
  if(t.id==="pinApos"){ const c=pinCfg(); if(c){ c.apos=Number(t.value)||0; salvaPinCfg(c); toast("Pronto."); } return; }
  if(t.id==="t-li"){ const b=document.getElementById("t-aceitar"); if(b) b.disabled=!t.checked; return; }
  if(t.id==="impFile"&&t.files&&t.files[0]){ importar(t.files[0]); return; }
  if(t.dataset&&t.dataset.fatpaga){ marcaPago("fat",t.dataset.fatpaga,ui.month,t.checked); return; }
  if(t.id==="notifOn"){ ligaNotif(t.checked); return; }
  if(t.id==="filtroCat"){ ui.filtro=t.value; render(); return; }
  if(t.id==="salMes"){ const v=t.value.trim()===""?null:parseMoney(t.value); if(v!==null&&isNaN(v)){ toast("Valor inválido. Use, por exemplo, 2.800,00"); return; } getMonth(ui.month).salario=v; save(ui.month); if(v>0&&!state.config.salarioPadrao){ setTimeout(()=>toast("Salário de "+abrMes(ui.month)+" salvo.","Repetir todo mês",()=>{ state.config.salarioPadrao=v; save("config"); render(); toast("Pronto: "+brl(v)+" entra todo mês. Dá para mudar no Perfil."); }),60); } render(); return; }
  if(t.id==="cfSal"||t.id==="cfSaldo"||t.id==="cfCx"){ const v=money(); if(isNaN(v)){ toast("Valor inválido. Use, por exemplo, 2.800,00"); return; } state.config[{cfSal:"salarioPadrao",cfSaldo:"saldoInicial",cfCx:"saldoCaixinha"}[t.id]]=v;
    if(t.id==="cfSal"&&v>0&&!inicioKey()){ state.config.inicio=MESES.includes(todayKey)?todayKey:MESES[0]; toast("Controle começa em "+nomeMes(state.config.inicio).toLowerCase()+"."); }
    save("config"); render(); return; }
  if(t.id==="cfInicio"){ state.config.inicio=t.value||null; save("config"); if(!mesesVisiveis().includes(ui.month)) ui.month=todayKey; render(); return; }
  if(t.dataset.catname){ const c=state.config.categorias.find(c=>c.id===t.dataset.catname); if(c){ c.nome=t.value.trim()||"Sem nome"; save("config"); render(); } return; }
  if(t.dataset.catorc){ const c=state.config.categorias.find(c=>c.id===t.dataset.catorc), v=money(); if(c&&!isNaN(v)){ c.orcamento=Math.max(0,v); save("config"); render(); } return; }
});
/* teclado: N abre novo lançamento, Esc fecha, ← → trocam o mês */
document.addEventListener("keydown",e=>{
  if(e.key!=="Tab") return; const box=tutAberto?document.querySelector("#tutorial .tutbox"):ui.sheet?document.querySelector("#sheet .sheet"):null; if(!box||travado) return;
  const f=[...box.querySelectorAll('button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled&&x.offsetParent!==null&&x.type!=="hidden"); if(!f.length) return;
  const i=f.indexOf(document.activeElement); if(e.shiftKey&&(i<=0)){ e.preventDefault(); f[f.length-1].focus(); } else if(!e.shiftKey&&(i===-1||i===f.length-1)){ e.preventDefault(); f[0].focus(); }
});
document.addEventListener("keydown",e=>{
  if(travado||tutAberto) return;
  if(e.key==="Escape"&&ui.sheet){ closeSheet(); return; }
  if(ui.sheet&&ui.sheet.tipo==="retro"&&(e.key==="ArrowRight"||e.key==="ArrowLeft")){ const b=document.querySelector(e.key==="ArrowRight"?'#sheet [data-rpasso="1"]':'#sheet [data-rpasso="-1"]'); if(b&&!b.disabled) b.click(); return; }
  const tag=(e.target.tagName||"").toLowerCase(); if(tag==="input"||tag==="select"||tag==="textarea"||ui.sheet||e.ctrlKey||e.metaKey||e.altKey) return;
  if(mode==="login"||!state.loaded) return;
  if(e.key==="/"){ e.preventDefault(); openSheet("busca"); return; }
  if(ui.tab!=="mes") return;
  if(e.key==="n"||e.key==="N"){ e.preventDefault(); openSheet("gasto"); }
  else if(e.key==="ArrowLeft") passo(-1);
  else if(e.key==="ArrowRight") passo(1);
});
/* deslizar para os lados troca o mês (celular) */
let tx=null, ty=null;
app.addEventListener("touchstart",e=>{ if(ui.tab!=="mes"||ui.sheet||e.touches.length!==1||e.target.closest(".chips,.tablewrap,input,select,.cats")){ tx=null; return; } tx=e.touches[0].clientX; ty=e.touches[0].clientY; },{passive:true});
app.addEventListener("touchend",e=>{ if(tx===null) return; const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty; tx=null;
  if(Math.abs(dx)>70&&Math.abs(dy)<45){ if(passo(dx<0?1:-1)){ app.classList.remove("slide-l","slide-r"); void app.offsetWidth; app.classList.add(dx<0?"slide-l":"slide-r"); } } },{passive:true});

setTimeout(()=>{ try{ const v=localStorage.getItem("mb.versao"); if(v&&v!==VERSAO&&mode!=="login") toast("Monetra atualizado para a versão "+VERSAO+". Veja as novidades no Perfil."); localStorage.setItem("mb.versao",VERSAO); }catch(e){} },2500);
setInterval(()=>verificaLembretes(true),30*60000);
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible"){ verificaLembretes(true); if(ui.tab==="mes"&&!ui.sheet) render(); } });
/* quando o mês do calendário virar com o app aberto, atualiza sozinho */
setInterval(()=>{ const d=new Date(); if(keyOf(d.getFullYear(),d.getMonth()+1)!==todayKey&&!ui.sheet&&!dirty.size) location.reload(); },60000);

travar();
render();
init();
})();

/* o service worker é registrado no index.html */
