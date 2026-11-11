// @ts-check
// Versão, novidades e endereços do app.
"use strict";
const VERSAO="5.8.7";
const NOVIDADES=[
  "Conheça o MoneBot, o robozinho no canto da tela: pergunte, por exemplo, “quanto gastei com mercado este mês?” ou “quando termino de pagar as parcelas?”.",
  "As respostas são calculadas neste aparelho, com os seus dados. Nada é enviado para fora.",
  "Dá para perguntar falando, pelo microfone da conversa, e ir direto para os lançamentos da categoria.",
  "O MoneBot está atrapalhando? Arraste o robozinho para outro lugar da tela. Ele lembra onde você deixou."
];
const ENDERECO_NOVO="https://monetraapp.web.app/";
const APK_URL=ENDERECO_NOVO+"baixar";
const HOSTS_ANTIGOS=["gustavombarbosadev.github.io","mb-controle-f70b6.web.app","mb-controle-f70b6.firebaseapp.com"];
const enderecoAntigo=()=>HOSTS_ANTIGOS.includes(location.hostname);
