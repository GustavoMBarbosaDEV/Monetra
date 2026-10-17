# Histórico de versões — MB Controle

Cada versão publicada fica registrada aqui, da mais nova para a mais antiga.
O número segue o padrão **MAIOR.MENOR.CORREÇÃO**:

- **MAIOR** (ex.: 2.0.0): mudança grande no jeito de usar o app.
- **MENOR** (ex.: 2.4.0): funções novas.
- **CORREÇÃO** (ex.: 2.4.1): só correções de erros.

Ao publicar uma versão, atualize o número em `app.js` (`const VERSAO`) e em `sw.js` (`CACHE`),
escreva aqui o que mudou e marque o commit com uma tag (ex.: `v2.4.0`).

---

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
