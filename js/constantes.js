// @ts-check
// Nomes dos meses, categorias padrão, formas de pagamento e chave do armazenamento local.
"use strict";
const NOMES=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const ABR=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const INICIO="2026-09", PADRAO_ATE="2027-12", LIMITE_ATE="2036-12";
const DEFAULT_CATS=["Mercado / Alimentação","Moradia (aluguel, condomínio)","Contas (luz, água, internet, celular)","Transporte / Combustível","Saúde / Farmácia","Educação","Lazer / Restaurantes","Compras / Vestuário","Outros"];
const FORMAS=[["pix","Pix"],["debito","Débito"],["credito","Crédito"],["dinheiro","Dinheiro"],["boleto","Boleto"]];
const LSKEY="meucaixa.v1";
