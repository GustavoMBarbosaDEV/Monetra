# Histórico de versões — MB Controle

Cada versão publicada fica registrada aqui, da mais nova para a mais antiga.
O número segue o padrão **MAIOR.MENOR.CORREÇÃO**:

- **MAIOR** (ex.: 2.0.0): mudança grande no jeito de usar o app.
- **MENOR** (ex.: 2.4.0): funções novas.
- **CORREÇÃO** (ex.: 2.4.1): só correções de erros.

Ao publicar uma versão, atualize o número em `app.js` (`const VERSAO`) e em `sw.js` (`CACHE`),
escreva aqui o que mudou e marque o commit com uma tag (ex.: `v2.4.0`).

---

## 3.8.0 — 17/10/2026
**Revisão geral**

Segurança
- Todo lançamento vindo da nuvem, de um backup ou de outro participante de um controle compartilhado é conferido (tipos e formato) antes de aparecer na tela. Isso fecha uma brecha em que um lançamento adulterado poderia rodar código no app de quem abrisse o controle.
- A planilha para Excel não deixa descrições virarem fórmulas (proteção contra "injeção de fórmula").
- Meses com identificação inválida em backups ou na nuvem são ignorados.

Salvamento na nuvem
- Mesclagem em 3 vias: quando duas pessoas (ou dois aparelhos) mexem no mesmo mês, o que cada uma mudou é mantido; edições e exclusões de um lado não são mais desfeitas pelo outro.
- Duas edições muito rápidas no mesmo mês não se perdem mais.
- Sem internet, nada sobrescreve a nuvem: as edições ficam guardadas no aparelho (mesmo se o app for fechado) e são enviadas e mescladas quando a conexão volta. Se o envio falhar, o app tenta de novo sozinho.
- Trocar de controle ou sair da conta logo depois de editar salva antes de trocar, e nada vai parar no controle errado.
- "Recomeçar do zero" em um aparelho limpa também os outros aparelhos abertos.
- Abrir o app sem internet em um aparelho novo não tira mais você dos controles compartilhados; trocar de controle sem internet funciona.
- Fatura marcada como não paga não volta sozinha para paga.
- Restaurar backup só no controle Pessoal.

Cálculos
- Parcelas calculadas em centavos inteiros (ex.: R$ 19,90 em 2x = 9,95 + 9,95; antes podia sair 9,94 + 9,96). Vale para listas, limite do cartão e assinaturas.
- Salário de R$ 0,00 num mês pode ser informado (antes voltava para o salário padrão). Saldo inicial negativo (conta no vermelho) é aceito.
- Excluir uma conta fixa já encerrada não traz de volta meses passados.
- Cartão com fechamento no dia 31: em meses mais curtos, o fechamento é o último dia do mês.
- Importar extrato: "1.234" vira R$ 1.234,00 e datas impossíveis (31/02) são ignoradas.
- Saldos arredondados em centavos (nada de "−R$ 0,00").
- Calendário não cria lembrete de fatura zerada.

Novidade e correção pedidas
- Campo **Mês** na janela de nova despesa: escolha em que mês a despesa entra (ela fica só naquele mês). Ao editar, dá para mover a despesa para outro mês. Compras parceladas começam no mês escolhido.
- Conta fixa criada em Ajustes começa no mês que você está vendo na barra de meses (antes começava sempre no mês atual e podia aparecer como atrasada).

Interface
- Arrastar o mouse de dentro da janela para fora não fecha mais a janela (nem perde o que foi digitado).
- Salvar um item apagado em outro aparelho fecha a janela com aviso, em vez de travar.
- Colar um valor negativo não vira um valor estranho.
- Valores grandes (milhões) e nomes longos não estouram a tela do celular.
- Filtro de categoria apagada volta para "Todas"; tecla "/" busca em qualquer aba; tocar no slide da retrospectiva avança.
- Se o dia virar com o app aberto, ele se atualiza ao voltar.
- O modo offline não guarda mais respostas com erro.

## 3.7.0 — 17/10/2026
**Tutorial**
- Tutorial de boas-vindas em 9 telas: salário, lançamentos, contas fixas e cartões, caixinha e metas, acompanhamento, avisos e os demais recursos.
- Aparece sozinho só para quem está começando (sem renda e sem lançamentos); quem já usa o app não é interrompido.
- No fim, o botão **Informar o salário** leva direto ao campo certo.
- Pode ser pulado, e revisto quando quiser em **Perfil → Tutorial**. Setas do teclado e Esc funcionam no computador.
- README do GitHub reescrito para quem vai usar o app (o que faz, como instalar, privacidade). O passo a passo técnico foi para o arquivo DESENVOLVIMENTO.md.

## 3.6.0 — 17/10/2026
**Subcategorias e etiquetas**
- **Subcategorias**: na categoria (Ajustes → Categorias), adicione, renomeie ou remova subcategorias (ex.: Alimentação → Mercado, Restaurante, iFood).
- Ao lançar uma despesa (ou compra parcelada), as subcategorias da categoria escolhida aparecem para selecionar (opcional).
- O limite e o gráfico continuam pela categoria principal; o card "Para onde foi" mostra quanto foi para cada subcategoria.
- **Etiquetas** livres nos gastos (ex.: #viagem, #presente, #trabalho), com sugestões das etiquetas já usadas.
- Subcategoria e etiquetas aparecem nas listas de lançamentos.
- Card **Etiquetas** na Visão geral com o total gasto em cada uma; tocar abre os lançamentos.
- Busca encontra por subcategoria e por **#etiqueta**.
- Correção: marcar ou desmarcar uma conta como paga (e outras ações na tela) não faz mais a página pular para o topo.

## 3.5.0 — 17/10/2026
**Dívidas com pessoas e desbloqueio por digital**
- Ajustes → **Dívidas com pessoas**: "Alguém me deve" e "Eu devo", com pessoa, valor, descrição, data e dia combinado.
- Totais de quanto te devem, quanto você deve e o saldo; lista agrupada por pessoa.
- Registre pagamentos aos poucos (ou "Quitar tudo"). Opção de lançar o pagamento no mês como receita ou despesa.
- Dívidas quitadas ficam guardadas e podem ser vistas depois.
- O sininho avisa um dia antes, no dia e depois da data combinada.
- **Desbloqueio por digital (ou rosto)**: com o PIN ligado, ative em Perfil → Bloqueio com PIN. Ao abrir, o app pede a digital; o PIN continua valendo como alternativa.

## 3.4.0 — 17/10/2026
**Retrospectiva do ano**
- Card **Retrospectiva** no topo da Visão geral, que abre um resumo em telas (use Anterior/Próximo ou as setas do teclado).
- Telas: o ano em números, entrou e saiu (e quanto sobrou), para onde foi (5 categorias que mais pesaram), mês mais caro, mais econômico e melhor saldo, curiosidades (maior gasto, dia da semana em que mais gasta, total de contas fixas), caixinha e metas atingidas, e um resumo final.
- Botão **Compartilhar resumo** (WhatsApp, etc.) só com totais, sem detalhes dos lançamentos.
- Com mais de um ano de controle, dá para escolher o ano.
- Em dezembro e janeiro, o sininho avisa que a retrospectiva está pronta.

## 3.3.0 — 17/10/2026
**Bloqueio com PIN**
- Perfil → **Bloqueio com PIN**: crie um PIN de 4 números, pedido sempre que o app abrir neste aparelho (cada aparelho tem o seu).
- Tela de desbloqueio com teclado numérico (também aceita o teclado do computador).
- Escolha quando pedir de novo ao voltar para o app: na hora, depois de 1, 5 ou 15 minutos fora.
- Depois de 5 tentativas erradas, o app espera 30 segundos (e mais a cada novo erro).
- PINs óbvios (1111, 1234) não são aceitos. O PIN fica guardado só como código embaralhado (hash), nunca o número.
- **Esqueci o PIN**: com login, basta sair e entrar de novo com a conta Google. Sem login, só apagando os dados do aparelho.

## 3.2.0 — 17/10/2026
**Sininho de notificações**
- Ícone de sino no topo, ao lado da foto do perfil, com o número de avisos.
- Ao tocar, abre a central de notificações com: pedidos para entrar nos seus controles compartilhados, contas que vencem amanhã, hoje ou estão atrasadas (com botão **Paguei**), categorias perto ou acima do limite e dicas de gastos que parecem assinatura.
- Cada aviso leva direto para o lugar certo (pedido, mês, assinaturas ou ativar notificações no Perfil).

## 3.1.0 — 17/10/2026
**Assinaturas**
- Novo card **Assinaturas e contas fixas** na Visão geral: lista tudo o que se repete todo mês, com o total por mês, por ano e a porcentagem da renda.
- **Parcelas em andamento**: parcela atual, quanto falta pagar e o mês em que termina.
- **Parece que se repete**: gastos lançados à mão com a mesma descrição em 3 dos últimos 4 meses aparecem como sugestão, com o botão **Virar conta fixa** (começa no mês seguinte, com Desfazer).

## 3.0.1 — 17/10/2026
**Correção**
- Botão **Excluir** do controle compartilhado bem visível: no fim do card (com aviso do que é apagado) e na lista de controles do Perfil. Quem participa tem o botão **Sair** nos mesmos lugares.

## 3.0.0 — 17/10/2026
**Controles compartilhados**
- Crie um controle compartilhado separado (ex.: Casa, Viagem) para dividir com outra pessoa, cada uma com a própria conta Google. Ele começa do zero.
- O controle **Pessoal continua só seu**: quem participa de um compartilhado não vê nada dele.
- Botões no topo da tela para trocar entre o Pessoal e os compartilhados (dá para participar de mais de um).
- Perfil → Controles compartilhados: criar, enviar convite (link ou código de 8 letras), aceitar ou recusar pedidos, remover pessoas e excluir o controle. Quem participa pode sair quando quiser.
- Aviso de pedido novo na tela do mês e no botão do controle.
- Cada lançamento num controle compartilhado mostra quem fez (ex.: "Pix · Maria").
- Termos de privacidade versão 1.1, com as regras do compartilhamento. O aceite passa a ser de cada pessoa (todos aceitam de novo uma vez).
- **Novas regras do Firestore** (arquivo `firestore.rules`): precisam ser publicadas no Firebase antes de usar esta versão.

## 2.8.0 — 17/10/2026
**Importar extrato e termos de privacidade**
- Importar extrato do banco em **OFX** ou **CSV** (Ajustes → Importar extrato), inclusive a fatura do cartão de crédito.
- Prévia antes de importar: dá para desmarcar lançamentos e trocar a categoria de cada gasto.
- Categoria sugerida automaticamente (pelo que você já lançou com a mesma descrição e por palavras como mercado, uber, farmácia, iFood).
- Lançamentos já registrados e pagamentos de fatura vêm desmarcados, para não contar duas vezes.
- Importação com **Desfazer**.
- **Termos de privacidade**: na primeira vez que entrar (inclusive em contas que já existiam), o app mostra os termos e pede o aceite. Quem não aceita sai do app sem nenhum dado alterado.
- Perfil → Privacidade: reler os termos, ver quando aceitou e retirar o aceite.

## 2.7.0 — 17/10/2026
**Várias contas e vários cartões**
- Contas: cadastre conta corrente, poupança, dinheiro etc. com o saldo inicial de cada uma. O card "Contas" mostra o saldo de cada conta mês a mês.
- Transferências entre contas (não contam como receita nem despesa).
- Ao lançar despesa, receita, conta fixa, parcela ou renda fixa, escolha a conta. O salário vai para a conta marcada como "recebe o salário".
- Vários cartões de crédito, cada um com nome, dia de fechamento, dia de vencimento, limite e conta que paga a fatura.
- Uma fatura por cartão na tela do mês, com o limite disponível; lembretes e calendário por cartão.
- O cartão único das versões anteriores vira automaticamente o primeiro cartão da lista.
- A planilha para Excel ganhou a coluna "Conta / cartão" e as transferências.

## 2.6.0 — 17/10/2026
**Metas de economia e alertas de orçamento**
- Metas de economia: caixinhas com nome, valor e prazo. O app mostra o progresso e quanto guardar por mês para chegar lá.
- Ao guardar ou retirar da caixinha, dá para escolher a meta. O que não tem meta fica na caixinha "Geral".
- Alertas de orçamento: aviso nos Lembretes e por notificação quando uma categoria chega a 80% e quando passa do limite do mês.
- O aviso de despesa lançada mostra quando a categoria está perto do limite.
- Avisos de "Desfazer" mais achatados, no canto de baixo da tela, com o **Desfazer** em vermelho.

## 2.5.1 — 17/10/2026
**Correção**
- O service worker passa a ser registrado direto na página (index.html), para o PWABuilder e o Chrome reconhecerem o app como instalável e com funcionamento offline.
- A instalação do modo offline não falha mais se um arquivo não carregar.

## 2.5.0 — 17/10/2026
**Pronto para virar aplicativo Android**
- Manifest completo (nome, descrição, categorias, ícones, cores) para gerar o APK pelo PWABuilder.
- Capturas de tela do app (celular e computador) mostradas na instalação.
- Atalhos no ícone do app: "Nova despesa" e "Lembretes".

## 2.4.1 — 17/10/2026
**Correção**
- Campos de valor no estilo dos apps de banco: digite só os números e o campo se forma sozinho, com ponto do milhar e vírgula dos centavos (ex.: 1, 8, 9, 3, 2, 0 → 1.893,20).
- No celular, abre o teclado numérico.
- Colar um valor (ex.: "1.200" ou "1200,50") mantém o número certo.

## 2.4.0 — 16/10/2026
**Cartão de crédito em Contas fixas**
- Compras no cartão de crédito aparecem no card **Contas fixas** até o mês da última parcela.
- Opção **paga / não paga** em cada compra no cartão (fica registrado o dia do pagamento).
- Marcar a fatura como paga marca as compras e parcelas dela.
- A lista "Despesas do mês" mostra só o que não é cartão.
- Número da versão e "Novidades" no Perfil.
- Campos de valor corrigidos: começam vazios (não juntam com "0,00"), selecionam tudo ao tocar, aceitam só números e formatam ao sair (ex.: 1.893,20).

## 2.3.0 — 16/10/2026
**Parcelas pagas e lembretes**
- Marcar cada parcela como paga, com registro do dia do pagamento.
- Escolher o dia de vencimento das parcelas.
- Card **Lembretes**: contas que vencem amanhã, hoje ou estão atrasadas, com botão "Paguei".
- Notificações no aparelho (um dia antes, no dia e alerta de atraso).
- Exportar lembretes para o calendário do celular (avisa mesmo com o app fechado).

## 2.2.0 — 16/10/2026
- Excluir contas fixas a qualquer momento (lixeira no card do mês), mantendo o histórico dos meses anteriores.
- Opção "Apagar de todos os meses" para contas cadastradas por engano.

## 2.1.0 — 16/10/2026
**Correções**
- Valores como `1.200` (ponto de milhar sem vírgula) agora são lidos corretamente.
- Despesa de categoria excluída pede uma categoria nova ao editar.
- Aviso correto quando está sem internet ("salvo no aparelho").
- Meses com lançamentos não somem da barra de meses.
- Lançamentos feitos em dois aparelhos ao mesmo tempo não se perdem mais.
- "Desfazer" devolve só o item apagado.
- Aviso para abrir no Chrome/Safari quando o link é aberto dentro do Instagram ou Facebook.

**Novidades**
- Compras parceladas.
- Cartão de crédito com fatura (dia de fechamento e vencimento).
- Categorias com cor: criar, renomear, escolher cor, limite e excluir.
- Mais de uma renda fixa.
- Busca de lançamentos em todos os meses.
- Planilha para Excel.
- "Recomeçar do zero" no Perfil.

## 2.0.0 — 16/10/2026
**Nova navegação e organização**
- Barra de navegação no celular e botão **+** para lançar rápido.
- Deslizar para os lados troca o mês; no computador, tecla **N** e setas.
- Editar e apagar qualquer lançamento, com **Desfazer**.
- Contas fixas que entram sozinhas todo mês, com marcação de paga.
- Gráfico "Para onde foi", comparação com o mês anterior e forma de pagamento.
- O controle começa no mês da primeira renda registrada.
- Barra de meses mostra até 2 meses à frente e avança sozinha com o calendário.
- Visão geral mostra só os meses que já passaram e o atual.
- Tela de **Perfil** com conta, renda, tema e backup.

## 1.2.0 — 16/10/2026
- Login com Google e dados na nuvem (Firebase) funcionando.
- Correção de arquivos antigos guardados pelo navegador.
- Correção dos botões da caixinha.

## 1.1.0 — 16/10/2026
- Novo nome: **MB Controle** (antes "Meu Caixa") e novo ícone.
- Modo escuro com botão de troca de tema.
- Opção "Criar conta com Google".

## 1.0.0 — 16/10/2026
**Primeira versão**
- Controle mensal com salário, recebimentos avulsos e despesas por categoria.
- Caixinha (guardar e retirar).
- Limites por categoria.
- Visão geral com gráfico e saldo acumulado.
- Funciona como app no celular (instalável) e offline.
