// @ts-check
// Tipos dos dados (JSDoc), usados na conferência de tipos.
"use strict";
/** @typedef {string} MesKey */
/** @typedef {string} DataISO */
/** @typedef {string} Forma */
/**
 * @typedef {Object} ValorOrig
 * @property {string} moeda
 * @property {number} valor
 * @property {number} cotacao
 * @property {number} taxa
 */
/**
 * @typedef {Object} Gasto
 * @property {string} id
 * @property {number} dia
 * @property {number} valor
 * @property {string} desc
 * @property {string} [cat]
 * @property {string} [sub]
 * @property {Forma} [forma]
 * @property {string} [contaId]
 * @property {string} [cartaoId]
 * @property {string} [metaId]
 * @property {string} [tipo]
 * @property {string} [de]
 * @property {string} [para]
 * @property {string} [por]
 * @property {string} [imp]
 * @property {string} [viagemId]
 * @property {string[]} [tags]
 * @property {boolean} [pago]
 * @property {DataISO} [pagoEm]
 * @property {ValorOrig} [orig]
 * @property {string} [ir]
 * @property {string} [pagou]
 * @property {boolean} [sal]
 * @property {boolean} [falta]
 */
/**
 * @typedef {Object} ItemMes
 * @property {string} id
 * @property {number} dia
 * @property {number} valor
 * @property {string} [desc]
 * @property {string} [cat]
 * @property {string|null} [sub]
 * @property {Forma} [forma]
 * @property {string|null} [contaId]
 * @property {string|null} [cartaoId]
 * @property {string[]} [tags]
 * @property {boolean} [pago]
 * @property {MesKey} [compraK]
 * @property {boolean} [parcela]
 * @property {number} [idx]
 * @property {number} [n]
 * @property {boolean} [fixo]
 * @property {boolean} [pular]
 * @property {boolean} [cartao]
 */
/**
 * @typedef {Object} ParcelaMes
 * @property {string} id
 * @property {true} parcela
 * @property {number} idx
 * @property {number} n
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
 * @property {boolean} cartao
 * @property {boolean} pago
 * @property {DataISO|null} pagoEm
 */
/**
 * @typedef {Object} Mes
 * @property {number|null} salario
 * @property {Gasto[]} avulsos
 * @property {Gasto[]} gastos
 * @property {Gasto[]} caixinha
 * @property {Object<string,{pago?:boolean,valor?:number,pular?:boolean,pagoEm?:string,por?:string}>} fixos
 * @property {Object<string,{valor?:number,pular?:boolean,pago?:boolean,pagoEm?:string}>} rendas
 * @property {Object<string,{pago?:boolean,pagoEm?:string,por?:string}>} parcelas
 * @property {Object<string,boolean>} faturasPagas
 * @property {Gasto[]} transf
 * @property {boolean} faturaPaga
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
 * @property {number} orcamento
 * @property {number|null} [cor]
 * @property {string|null} [ic]
 * @property {boolean} [sobra]
 * @property {MesKey|null} [sobraDesde]
 * @property {string[]} [palavras]
 * @property {Subcategoria[]} [subs]
 */
/**
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
 * @typedef {Object} Parcela
 * @property {string} id
 * @property {string} desc
 * @property {string} cat
 * @property {string|null} sub
 * @property {string[]} tags
 * @property {Forma} forma
 * @property {number} total
 * @property {number} n
 * @property {MesKey} compra
 * @property {number} dia
 * @property {number|null} venc
 * @property {string|null} contaId
 * @property {string|null} cartaoId
 * @property {string|null} viagemId
 * @property {ValorOrig|null} orig
 * @property {string|null} ir
 * @property {string|null} por
 * @property {string|null} pagou
 */
/**
 * @typedef {Object} Renda
 * @property {string} id
 * @property {string} nome
 * @property {number} valor
 * @property {number} dia
 * @property {MesKey} desde
 * @property {MesKey|null} ate
 * @property {string|null} contaId
 */
/**
 * @typedef {Object} Cartao
 * @property {string} id
 * @property {string} nome
 * @property {number|null} fecha
 * @property {number|null} vence
 * @property {number} limite
 * @property {string|null} contaId
 */
/**
 * @typedef {Object} Conta
 * @property {string} id
 * @property {string} nome
 * @property {string} tipo
 * @property {number} saldoInicial
 */
/**
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
 * @property {number} taxa
 * @property {DataISO|null} inicio
 * @property {DataISO|null} fim
 * @property {number} orcamento
 */
/**
 * @typedef {Object} Desafio
 * @property {string} id
 * @property {string} nome
 * @property {"sem"|"max"} tipo
 * @property {string|null} cat
 * @property {string} palavras
 * @property {number} dias
 * @property {DataISO} inicio
 * @property {number} valor
 */
/**
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
 * @property {{tipo:string,dia:number,dia2:number,off:boolean}|null} salarioDia
 * @property {Categoria[]} categorias
 * @property {Fixo[]} fixos
 */
/**
 * @typedef {Object} Folha
 * @property {string} tipo
 * @property {string|null} id
 * @property {MesKey} [mes]
 * @property {number} [ano]
 * @property {string} [foco]
 * @property {string} [calc]
 * @property {number} [dia]
 * @property {string} [fim]
 * @property {MesKey} [sel]
 * @property {string} [q]
 * @property {Array<any>} [itens]
 * @property {string} [pinModo]
 * @property {boolean} [cartaoArq]
 * @property {boolean} [cartaoMarcado]
 * @property {File|null} [pdfArq]
 * @property {boolean} [pedeSenha]
 * @property {boolean} [lendo]
 * @property {string} [cartaoImp]
 * @property {string} [contaImp]
 * @property {string} [dTipo]
 * @property {string} [cxTipo]
 * @property {string} [ctTipo]
 * @property {number} [slide]
 * @property {any} [mod]
 * @property {string} [erroImp]
 * @property {any} [arquivo]
 * @property {string} [valorRasc]
 * @property {number} [simSaldo]
 * @property {string} [metaId]
 * @property {string} [nomeRasc]
 * @property {string} [cat]
 */
/**
 * @typedef {Object} UI
 * @property {string} [lgEmail]
 * @property {string} [lgAviso]
 * @property {string} [linkHref]
 * @property {Object<string,boolean>} abre
 * @property {string} tab
 * @property {MesKey|null} month
 * @property {Folha|null} sheet
 * @property {string} importMsg
 * @property {string} loginModo
 * @property {boolean} [verTudo]
 * @property {boolean} [verLogin]
 * @property {string|null} gCat
 * @property {Forma} gForma
 * @property {string} filtro
 * @property {string|null} [gConta]
 * @property {string|null} [gCartao]
 * @property {string|null} [rolarPara]
 * @property {boolean} [ocupado]
 * @property {boolean} [lerTermos]
 * @property {number} [revogarCont]
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
 * @property {number} [irAno]
 */
/**
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
 * @property {number} dim
 * @property {number} fixosTotal
 * @property {number} fixosPend
 * @property {number} fatura
 * @property {number} pct
 */
/**
 * @typedef {Object} Previsao
 * @property {number} dia
 * @property {number} rest
 * @property {number} dim
 * @property {number} ritmo
 * @property {number} extra
 * @property {number} saldo
 * @property {number} cartao
 * @property {number} foraRitmo
 * @property {number} grande
 * @property {(id:string)=>number} ritmoCat
 */
