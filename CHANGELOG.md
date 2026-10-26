# Histórico de versões — Monetra

Cada versão publicada fica registrada aqui, da mais nova para a mais antiga.
O número segue o padrão **MAIOR.MENOR.CORREÇÃO**:

- **MAIOR** (ex.: 2.0.0): mudança grande no jeito de usar o app.
- **MENOR** (ex.: 2.4.0): funções novas.
- **CORREÇÃO** (ex.: 2.4.1): só correções de erros.

Ao publicar uma versão, atualize o número em `app.js` (`const VERSAO`) e em `sw.js` (`CACHE`),
escreva aqui o que mudou e marque o commit com uma tag (ex.: `v2.4.0`).

---

## 5.2.1 — 26/10/2026 **App Check com reCAPTCHA Enterprise**

- App Check: o app pede um token do App Check (reCAPTCHA Enterprise, chave em firebase-config.js) antes de falar com o Firebase. Quando a verificação for aplicada no console, só o site e o app oficiais conseguem usar o Firestore e o login. Se o App Check falhar ao carregar, o app segue funcionando como antes.
- CSP: liberado https://www.google.com para scripts e conexões, e www.google.com/recaptcha.google.com em frames, que o reCAPTCHA usa.

## 5.2.0 — 26/10/2026 **Segurança: CSP, sair limpo, PIN, backup com senha, excluir conta e regras**

- **CSP sem nada inline:** os scripts e o estilo que ficavam escritos no `index.html` foram para `pre.js` (preferências de acessibilidade e privacidade antes de desenhar), `boot.js` (tela de abertura e service worker) e `boot.css`. A política agora aceita scripts só do próprio site e do Google (`www.gstatic.com`, `apis.google.com`), sem hashes. Estilos em tag/arquivo só do site e do Google Fonts (`style-src-elem`); atributos `style` continuam liberados (`style-src-attr`), porque o app usa as cores das categorias neles. Também `media-src 'none'`. Nova meta **Referrer-Policy** `strict-origin-when-cross-origin`.
- **Sair limpa o aparelho:** além da cópia offline do Firestore (5.1.3), sair agora envia antes o que estiver pendente (em todos os caminhos: Sair, "Esqueci o PIN", recusar os termos) e apaga do aparelho o PIN, as informações de backup, as conquistas e os avisos já vistos dessa pessoa. Ficam as preferências do aparelho (tema, acessibilidade, privacidade) e a fila de edições ainda não enviadas, que se esvazia sozinha quando o envio dá certo. O service worker guarda só o app e as bibliotecas do Firebase; nunca guardou respostas do Firestore. A mensagem de saída (ex.: termos recusados) também aparece como aviso na página de apresentação.
- **PIN com PBKDF2:** o PIN passa a ser guardado com PBKDF2-SHA256 (310 mil iterações, sal próprio) sobre o hash anterior. O PIN atual migra sozinho ao abrir o app, sem pedir de novo, e o hash antigo deixa de ficar salvo. Continua o bloqueio crescente depois de 5 erros e o bloqueio automático em segundo plano (Na hora, 1, 5 ou 15 minutos).
- **Backup com senha (opcional):** "Baixar backup com senha" em Perfil → Exportar e backup. AES-GCM 256 com chave derivada da senha (PBKDF2-SHA256, 310 mil iterações), mínimo de 8 caracteres e confirmação. Restaurar reconhece o arquivo protegido e pede a senha; senha errada não altera nada. Limite do arquivo de backup passou de 5 para 10 MB (o arquivo protegido é maior).
- **Excluir minha conta** (Perfil, com login): janela que lista o que será apagado (controles que a pessoa criou somem para todos; dos outros, ela só sai) e pede para digitar EXCLUIR. Se o login não for recente, o Google confirma que é a pessoa **antes** de apagar qualquer coisa. Depois apaga controles próprios (com convite e pedidos), sai dos outros, cancela pedidos pendentes, apaga os dados pessoais e a conta no Authentication.
- **firestore.rules mais rígido** (precisa ser publicado no Firebase, veja o DESENVOLVIMENTO.md): o controle Pessoal passa a ter a mesma validação de formato do compartilhado; limites de tamanho de listas e mapas (ex.: 5.000 lançamentos por lista no mês, 300 categorias), `ate`/`inicio` no formato AAAA-MM, termos e `contaSalario` com tipo certo; por usuário, só `docs/` e `meta/eu`; grupos com até 50 membros; convites com código de até 20 caracteres.
- **Testes das regras** em `testes-regras/` com `@firebase/rules-unit-testing` no emulador (sem login não entra, ninguém lê dados de outro, compartilhado só para membros, formatos errados recusados, convites e pedidos) e GitHub Action `regras.yml` que roda a cada mudança. `firebase.json` na raiz só aponta para as regras. Dependabot também para as dependências dos testes.
- Testado no emulador do Firebase com o app de verdade: login, gravação com as regras novas, migração do PIN, sair limpando, backup com senha (ida e volta, senha errada) e exclusão de conta com grupo próprio; e no navegador: CSP sem bloqueios (modo local e Firebase real), service worker, voz, notificações e telas iguais às da versão anterior.

## 5.1.7 — 26/10/2026 **Backup validado antes de restaurar**

- O arquivo é conferido inteiro **antes** de mexer em qualquer dado; se algo estiver errado, aparece o motivo e nada é alterado (antes, um erro no meio podia deixar parte restaurada).
- Limites: até 5 MB, 600 meses e 5.000 lançamentos por lista em cada mês. Precisa ser um objeto com `config` e `months`; se tiver `app`, tem que ser `"monetra"` (backups antigos sem esse campo continuam aceitos).
- Lançamentos ficam só com os campos que o app usa (`id`, `dia`, `valor`, `desc`, `cat`, `sub`, `forma`, `contaId`, `cartaoId`, `metaId`, `tipo`, `de`, `para`, `por`, `pagou`, `imp`, `viagemId`, `tags`, `pago`, `pagoEm`, `orig`, `ir`), com tipos corrigidos e textos limitados. Nos mapas do mês (contas fixas, rendas, parcelas) ficam só `pago`, `pagoEm` (AAAA-MM-DD), `valor` (número), `pular` e `por`; faturas pagas viram verdadeiro/falso. Meses com chave inválida e chaves desconhecidas são descartados. As configurações já eram limpas campo a campo.
- Mensagem com o resultado ("Backup restaurado: 2 meses e 6 lançamentos.") ou com o motivo da recusa, também lida pelo leitor de tela.
- Testes: ida e volta (exportar e restaurar não perde nenhum valor; uma segunda volta não muda nada), arquivo de 6 MB, texto que não é JSON, lista, backup de outro app, backup sem meses, backup com campos estranhos e tipos errados, e backup com HTML malicioso.

## 5.1.6 — 26/10/2026 **Auditoria de XSS**

- Auditoria de todos os pontos que escrevem HTML (25 `innerHTML`, 1 `insertAdjacentHTML`, 1 `outerHTML`) e de todas as interpolações `${…}` dos templates, seguindo variáveis, parâmetros e listas até a origem. As 240 que não eram seguras por construção foram revisadas uma a uma: todo texto vindo do usuário, de extrato OFX/CSV, de backup ou de outro membro do compartilhado passa por `esc()`, inclusive em atributos (`data-*`, `aria-label`, `value`, `title`). Os demais são números, chaves de mês validadas ou textos fixos do app.
- **Corrigido:** a data de pagamento de parcela (`pagoEm`, no mapa `parcelas` do mês) chegava à tela sem validação. Não era explorável (só 2 caracteres por recorte apareciam), mas agora só vale o formato `AAAA-MM-DD`, conferido em `parcelasDoMes`.
- Teste de ataque: HTML malicioso em todos os campos de texto dos dados (categorias, subcategorias, contas, cartões, contas fixas, rendas, metas, parcelas, dívidas, viagens, desafios, etiquetas, ids, formas, `pagoEm`, quem lançou/pagou, transferências e acertos). Nas 5 abas, em todas as janelas de edição, na busca, no sininho e nos 31 dias do calendário, nenhum código executou e nenhum elemento foi injetado.

## 5.1.5 — 26/10/2026 **Segurança do repositório**

- `.gitignore`: chaves e segredos nunca vão para o GitHub (`*.keystore`, `*.jks`, `*.pem`, `*.p12`, `*.key`, `signing*`, `.env*`, `google-services.json`, contas de serviço do Firebase) e o guia local `SEGURANCA-PAINEIS.md`.
- **gitleaks** numa GitHub Action a cada push e pull request (`.github/workflows/gitleaks.yml`), com `.gitleaks.toml` liberando só a `apiKey` pública do Firebase. Histórico atual (92 commits) sem vazamentos.
- **CodeQL** (JavaScript e Actions, consultas `security-extended`) a cada push em `main`/`testes`, em pull requests e toda segunda-feira.
- **Dependabot** para as GitHub Actions.
- `SECURITY.md`: como relatar falhas pelo relato privado do GitHub.
- Erro ao ler extrato (OFX/CSV) não vai mais inteiro para o console (a mensagem podia trazer um trecho do arquivo); fica só o tipo do erro.

## 5.1.4 — 25/10/2026 **Avisos do navegador**

- `manifest.webmanifest`: `share_target` com `"enctype": "application/x-www-form-urlencoded"` explícito (era o padrão, mas o Chrome avisava).
- `index.html`: meta `mobile-web-app-capable`, que substitui a `apple-mobile-web-app-capable` no Chrome. A da Apple continua para iPhones mais antigos.

## 5.1.3 — 25/10/2026 **Segurança**

- **Sair apaga a cópia offline:** ao sair da conta (botão Sair, "Esqueci o PIN" ou recusar os termos), o app encerra o Firestore e apaga a cópia dos dados guardada no navegador (`terminate` + `clearIndexedDbPersistence`) e recarrega a página. Antes, os lançamentos continuavam no IndexedDB depois de sair. Pendências são enviadas antes, como já acontecia. Com outra aba do app aberta, o navegador não deixa apagar; nesse caso a saída acontece normalmente e a cópia fica até a próxima saída.
- **Política de segurança de conteúdo (CSP)** no `index.html`: scripts só do próprio site, dos 2 scripts do index.html (por hash) e do Google (`www.gstatic.com`, `apis.google.com`); conexões só com o Google (`*.googleapis.com`) e a API de cotação (`open.er-api.com`); fotos de perfil do Google; nada de `object`/`embed`.
- **PIN:** o quadro do PIN explica que ele trava a tela, mas não criptografa os dados, e sugere usar Sair em computador de outras pessoas.

## 5.1.2 — 25/10/2026 **Limpeza e textos atualizados**

- Textos com nomes antigos das abas: Relatórios sem dados dizia “A visão geral aparece…” e “Vá na aba Mês”; Perfil → Renda e saldos dizia “ajuste na aba Mês”. Agora falam em Relatórios e Início. A descrição da página (index.html) também.
- Limpeza sem mudança de comportamento: código sem uso (`irNome`, `domingoDe`, `nomeViagem`, `comDesfazer` e variáveis locais), verificações repetidas em `openSheet` e `render`, regras CSS de classes que o app não gera mais e regras sempre redeclaradas depois. Conferido com o HTML e o estilo calculado de 12 telas, nos temas claro e escuro, iguais aos de antes.
- Código sem comentários descritivos: saíram de `app.js`, `sw.js`, `firebase-config.js`, `index.html`, `style.css` e `firestore.rules`. No `app.js` ficam só o `// @ts-check` e as marcações de tipo (JSDoc: `@typedef`, `@property`, `@type`, `@param`, `@returns`), sem texto explicativo, porque a checagem de tipos depende delas. Documentação revisada.
- `jsconfig.json` com `"module": "ES2022"`: a checagem de tipos (`tsc`) não mostra mais o TS1323 e termina sem nenhum erro. Não muda o app (o jsconfig não é carregado).

## 5.1.1 — 25/10/2026 **Correções da revisão**

- Menu do +: depois de fechar o menu (Esc, toque fora) ou de um clique com o botão direito, o próximo toque no + abria nada. Agora volta a abrir a despesa.
- Ajustes → Contas: o resumo (quantidade de contas) e o “recebe o salário” contavam os bens do patrimônio como conta. Agora usam só as contas de dinheiro.
- Quem pagou (compartilhado): ao editar uma despesa antiga sem dono, o campo mostra “Não informado” em vez de marcar você sem querer. Sem mudança no campo, nada é gravado.
- Busca que navega: novos destinos para Patrimônio, Imposto de Renda, Inflação pessoal, Quanto renderia, Saúde financeira e Divisão do mês; “aumento”/“reajuste” levam às assinaturas.

## 5.1.0 — 25/10/2026 **Compartilhar comprovante, divisão de despesas e patrimônio**

- **Lançar compartilhando (Share Target):** com o app instalado, “Compartilhar” um texto de outro app (comprovante de Pix, banco, loja) abre a nova despesa com o texto no campo rápido. O valor em R$ vai para a frente; links, ano e hora saem. O formulário já vem preenchido para conferir e salvar. Manifest com `share_target` (GET, parâmetros `st`, `sx`, `su`).
- **Divisão de despesas no compartilhado:** a despesa ganhou o campo “Quem pagou” (`pagou`; sem ele vale quem lançou). O Início do controle compartilhado mostra a **Divisão do mês** em partes iguais: quanto cada um pagou, a parte de cada um, quem recebe e quem deve. Também sugere os acertos, com o botão “Registrar acerto” (e Desfazer). Os acertos ficam nas transferências do mês com `tipo:"acerto"` e não mexem no saldo das contas nem na planilha. Contas fixas entram quando alguém marca como paga (guarda `por`). Compras parceladas agora guardam quem lançou e quem pagou.
- **Patrimônio (Relatórios):** contas (ou saldo acumulado), caixinha, imóveis, veículos e outros bens, valores a receber, menos dívidas e parcelas a vencer, com a variação desde o mês passado. Bens ficam em `config.contas` com tipo `bem-imovel`, `bem-veiculo` ou `bem-outro`, fora das listas de conta para lançar e transferir. Contas ganharam o tipo “Investimento”.
- Tutorial e novidades atualizados. Sem mudança no `firestore.rules`.

## 5.0.42 — 25/10/2026 **Gestos, dicas e novos quadros financeiros**

- **Deslizar para trocar de aba:** no celular, fora do Início, deslizar a tela para os lados troca de aba na ordem da barra de baixo (Início → Relatórios → Metas → Perfil → Ajustes). No Início, deslizar continua trocando o mês. Não vale em tabelas, gráficos, barras de meses, campos e lançamentos deslizáveis.
- **Menu do +:** segurar o + (ou botão direito, tecla Menu ou Shift+F10) abre Despesa, Receita, Transferência (com 2 contas ou mais) e Por voz (abre a despesa já ouvindo). Toque normal continua abrindo a despesa. Setas e Esc funcionam no menu.
- **Barrinha fixa ao rolar:** passando do saldo (Início) ou do topo (outras abas), aparece uma barra fixa com o saldo do mês ou o nome da tela; tocar nela volta ao topo.
- **Dicas pontuais:** na primeira vez que cada aba abre, um balão com uma dica e o botão “Entendi” (fica guardado no aparelho em `mb.dicas`). Não aparece antes do tutorial.
- **Imposto de Renda:** na despesa, o campo “Imposto de Renda” marca o tipo de dedução (saúde, educação, PGBL, pensão, doações, outra), guardado em `ir` no gasto ou na compra parcelada. Relatórios ganhou o resumo anual por tipo, com os lançamentos de cada um e troca de ano.
- **Sua inflação x IPCA:** Relatórios compara o gasto por categoria com os mesmos meses do ano anterior e mostra a diferença para o IPCA de referência (editável, guardado no aparelho em `mb.taxas`).
- **Quanto renderia:** Metas mostra quanto a caixinha renderia em 1 e 12 meses no CDI e na poupança, e para cada meta com prazo quanto o rendimento ajuda (e quanto bastaria guardar por mês). CDI editável; poupança pela regra atual.
- **Nota de saúde financeira:** Início ganhou a nota do mês de 0 a 100 (sobra, contas em dia, limites, caixinha e peso das contas fixas), com cada critério explicado.
- **Assinatura mais cara:** contas fixas e gastos que se repetem com valor maior que no mês anterior aparecem em “Ficou mais caro” (Relatórios) e no sininho.
- Tutorial e novidades atualizados.

## 5.0.41 — 25/10/2026 **Transição entre abas**

- Ao trocar de aba, o conteúdo novo entra deslizando na direção da aba: indo para a direita na barra (Início → Relatórios → Metas → Perfil → Ajustes) vem da direita; voltando, vem da esquerda.
- Vale para a barra de baixo, as abas do topo, o botão Voltar do celular e a busca que navega. Sem barra de rolagem lateral durante o movimento.
- Com Reduzir movimento ou Modo calmo, a troca continua instantânea.

## 5.0.40 — 25/10/2026 **Esqueleto de carregamento**

- No lugar do texto “Carregando…”, a tela mostra blocos cinza no formato do Início (saldo, atalhos e lista de lançamentos) enquanto os dados chegam, com um brilho suave passando.
- Vale na abertura do app (já no index.html) e ao trocar de controle ou atualizar os dados.
- Com Reduzir movimento ou Modo calmo, os blocos ficam parados. Leitor de tela ouve “Carregando seus lançamentos…”.

## 5.0.39 — 25/10/2026 **Puxar para atualizar**

- No celular, no topo da página, puxar para baixo mostra o aviso “Puxe para atualizar”; passando do ponto vira “Solte para atualizar” (com vibração). Ao soltar: na nuvem, salva o que estiver pendente e recarrega os dados; no modo local, relê o aparelho e redesenha a tela.
- O “puxar para recarregar” do navegador foi desligado no app (`overscroll-behavior-y`), para não recarregar a página inteira por engano.
- Não atrapalha a rolagem, o deslizar de lançamentos nem a troca de mês. Leitor de tela avisa “Dados atualizados”. Tutorial cita o gesto.

## 5.0.38 — 25/10/2026 **Modo privacidade**

- Botão de olho no topo esconde todos os valores (borrados) em qualquer tela, janela ou aviso: saldo, listas, gráficos, balões e tabelas. Toque de novo para mostrar.
- A escolha fica guardada neste aparelho (`mb.privado`) e já vale antes de desenhar a tela, sem piscar os valores.
- Leitor de tela avisa “Valores escondidos” / “Valores visíveis”; o botão informa se está ligado. Tutorial cita o olho.

## 5.0.37 — 25/10/2026 **Fatia clicável em “Para onde foi”**

- Início: tocar numa fatia do gráfico de rosca de “Para onde foi” abre uma janela com os lançamentos daquela categoria no mês (despesas, contas fixas, parcelas e compras no cartão), com total e % das despesas. Tocar num item abre a edição dele.
- As fatias também funcionam pelo teclado (Tab até a fatia, Enter ou Espaço) e o leitor de tela lê o nome, o valor e “Ver lançamentos”. Fatia em destaque ao passar o mouse ou com foco.
- Dica do quadro e tutorial citam a fatia clicável.

## 5.0.36 — 25/10/2026 **Gráfico do saldo tocável**

- Início: tocar ou arrastar no gráfico do saldo mostra o dia escolhido com marcador (linha + ponto) e balão com o saldo e quanto entrou ou saiu naquele dia. No toque, o balão some sozinho pouco depois de soltar.
- No computador, passar o mouse faz o mesmo. Pelo teclado, o gráfico recebe foco e as setas, Home/End e PageUp/PageDown andam pelos dias; o leitor de tela lê a data e o valor.
- Arrastar no gráfico não troca mais o mês por engano. Tutorial cita o gráfico tocável.

## 5.0.35 — 25/10/2026 **Deslizar o lançamento**

- Lançamentos do Início e do dia no calendário: no toque, deslizar para a esquerda apaga (com Desfazer); para a direita, a despesa de crédito não paga é marcada como paga e as outras são repetidas hoje (com Desfazer).
- Fundo colorido por trás da linha enquanto arrasta (vermelho para apagar, verde para paga, cor do app para repetir), com vibração ao passar do ponto. Um toque normal continua abrindo a edição; mouse e teclado não mudam.
- Respeita Reduzir movimento e Modo calmo (sem animação de saída). Dica da lista e tutorial explicam o gesto.

## 5.0.34 — 25/10/2026 **Busca que navega**

- Busca: bloco "Ir para" com até 4 telas/quadros/ferramentas que combinam com o que foi digitado (nomes e apelidos, sem acento; "13" já acha o 13º).
- Ao tocar, abre a aba certa, rola até o quadro com um destaque rápido e leva o foco para ele (leitor de tela avisa); calculadoras, simulador e notificações abrem direto.
- Título "Buscar no app" e dica explicando que dá para buscar telas. Tutorial cita a busca e as regras automáticas.

## 5.0.33 — 25/10/2026 **Regras automáticas**

- Ajustes → Regras automáticas: criar regra (palavra + categoria), lista das regras por categoria e atalho para editar.
- Cada categoria ganhou o campo "Regras automáticas" (palavras separadas por vírgula); uma palavra fica em uma categoria só.
- As regras têm prioridade sobre o histórico e as palavras conhecidas no lançamento rápido, preenchem a categoria ao digitar a descrição de uma despesa nova e são usadas na importação de extrato.

## 5.0.32 — 25/10/2026 **Comemorações**

- Cartão de comemoração (confete de barrinhas, vibração curta, botão "Valeu!" com foco; fecha ao tocar, com Esc ou sozinho em 6 s) para meta atingida, desafio concluído, conquista nova e mês anterior fechado com saldo positivo.
- "Mês no azul" é avisado uma vez por mês, na primeira abertura do mês seguinte; se outra comemoração aparecer antes, ele fica para a próxima abertura.
- Respeita Reduzir movimento/Modo calmo (sem confete) e é lido pelo leitor de tela.

## 5.0.31 — 25/10/2026 **Modo foco, menos texto e Retrospectiva sem pressa**

- Perfil → Acessibilidade → Modo foco: Início reduzido (saldo, atalhos, avisos, orçamento, lançamentos, fatura, contas fixas e receitas) com botão "Mostrar tudo do Início" e "Voltar ao modo foco"; o leitor de tela avisa a troca.
- Menos texto: esconde dicas e explicações dos quadros (o painel de Acessibilidade e as janelas continuam com texto).
- Retrospectiva: sem avanço automático por padrão; botão "Avançar sozinha"/"Pausar" no topo dos stories (a escolha fica salva). Barra de progresso só anda quando o avanço automático está ligado.
- Tutorial cita o modo foco.

## 5.0.30 — 25/10/2026 **Voz: ouvir o resumo e lançar falando**

- Botão "Ouvir" no cartão de saldo (navegadores com síntese de voz): lê em português o resumo do mês com valores por extenso ("417 reais e 80 centavos"), contas fixas a pagar, atrasadas, vencendo hoje/amanhã e limites estourados ou estourando; tocar de novo para.
- Microfone no campo rápido da nova despesa (Chrome/Android): o que for dito preenche o campo e a prévia; o leitor de tela confirma o que foi entendido. Pede permissão de microfone na primeira vez.
- Vibração curta ao salvar, apagar ou marcar como pago (Android); opção "Vibrar ao confirmar" em Perfil → Acessibilidade.
- Tutorial cita o Ouvir e o microfone.

## 5.0.29 — 25/10/2026 **Painel de Acessibilidade**

- Perfil → Acessibilidade (preferências por aparelho, aplicadas antes de desenhar a tela para não piscar):
  - Tamanho do texto: 100%, 115%, 130% ou 150% (o app inteiro cresce e se reorganiza; topo quebra em duas linhas, meses e menu não picotam palavras).
  - Alto contraste: fundo puro, texto branco/preto, bordas visíveis, sem brilhos, foco mais grosso.
  - Cores para daltonismo: paleta Okabe-Ito nas categorias; positivo azul, negativo laranja; listras nas barras acima/perto do limite.
  - Sem animações: tudo aparece pronto (também desliga o avanço automático da Retrospectiva).
  - Modo calmo: sem animações e sem auras, brilhos, confete e efeitos da apresentação.
  - Fonte de leitura fácil: Atkinson Hyperlegible com mais espaço entre letras, palavras e linhas.
  - Botões maiores: alvos de toque de no mínimo 48 px e mais espaço entre itens.
  - Sublinhar links.
- Leitor de tela avisa quando uma opção é ligada/desligada. Tutorial cita o painel.
- Contraste: hoje no calendário com texto na cor principal do tema; etiquetas da rosca no tema escuro.
- axe (WCAG 2.2 AA) sem problemas em todas as abas, nos dois temas, em cada modo e com todos ligados juntos.

## 5.0.28 — 25/10/2026 **Acessibilidade: base para leitor de tela e teclado**

- Regiões da página marcadas (topo, conteúdo principal e menu) e botão "Pular para o conteúdo" no primeiro Tab.
- Aviso falado (aria-live) com o nome da tela e o saldo ao trocar de aba ou de mês; o conteúdo principal tem o nome da aba.
- Janelas: papel de diálogo no contêiner certo, fundo fica inacessível (inert) enquanto aberta, foco vai para o primeiro campo ou para o título; Esc fecha e o foco volta.
- Valores com centavos menores agora têm o texto inteiro para o leitor de tela ("R$ 417,80").
- Descrição em texto: linha do saldo (início, menor valor e hoje), rosca (total e maiores categorias) e gráfico de receitas x despesas (cada mês).
- Tabelas e gráficos que rolam de lado agora recebem foco pelo teclado.
- Contraste: etiquetas da rosca e pílulas de categoria no tema claro.
- Grupos de opções (Entrar/Criar conta, tipo de lançamento) marcados como grupo de escolha; títulos da página de apresentação em ordem.
- Verificação automática (axe, WCAG 2.2 AA) sem nenhum problema nas 4 abas, janelas, apresentação e login, nos dois temas.

## 5.0.27 — 25/10/2026 **Detalhes finais do visual**

- Início: barrinhas do logo (sobem animadas) ao lado do nome/saudação.
- Barra de meses: destaque que desliza do mês anterior até o escolhido.
- Faixa de avisos com conta atrasada: sininho balança a cada 6 s.
- Atalhos Despesa/Receita/Conta fixa/Caixinha: sobem com o mouse e encolhem ao tocar.
- Perfil → Aparência: destaque desliza entre Automático, Claro e Escuro. Sem animação com "reduzir movimento".

## 5.0.26 — 25/10/2026 **Tutorial revisado**

- Tutorial: passo 2 explica fechar a janela no X ou arrastando o topo; passo 4 cita o anel das metas; passo 5 corrige "círculo" para "quadradinho" ao marcar conta paga, explica os marcadores do calendário (anel, ponto, triângulo) e cita o anel de Relatórios e a Retrospectiva em stories.
- Revisão geral das telas (8 cenários, formulários, renda fixa por dia, tutorial em 360 px e 390 px): sem problemas novos.

## 5.0.25 — 25/10/2026 **Página de apresentação animada**

- Nova tela antes do login (só no navegador; no app instalado/APK vai direto ao login): topo escuro com aurora e grade, logo com barras subindo, título "Controle seu dinheiro. Viva seus planos." entrando palavra por palavra (degradê na palavra "dinheiro"), botões "Entrar com Google" e "Criar conta grátis", celular de demonstração que flutua e acompanha a rolagem sem invadir a seção de baixo.
- Faixa de números que contam, 5 seções (saldo, contas e cartões, metas, previsão, privacidade) que aparecem ao rolar, chamada final e rodapé.
- Em navegadores de outros apps (Instagram, Facebook…), o botão de entrar abre o login com o aviso de sempre. Com "reduzir movimento", tudo aparece pronto e sem animação.

## 5.0.24 — 25/10/2026 **Janela que fecha ao arrastar e barra inferior com indicador**

- Janelas (sheets) no celular: alça no topo; arrastar o cabeçalho para baixo acompanha o dedo e fecha se passar de 110 px ou se o gesto for rápido; senão volta. Não vale para a Retrospectiva.
- Barra inferior: indicador verde que desliza da aba anterior para a aba aberta.
- Botão +: brilho na cor do app, encolhe ao tocar e o + gira 45° enquanto a janela está aberta. Sem animação com "reduzir movimento".

## 5.0.23 — 25/10/2026 **Perfil com ícones nas seções**

- Perfil: ícone em quadradinho colorido antes do título de cada seção; "Recomeçar do zero" em vermelho.
- Cartão da conta com brilho animado no fundo, contorno verde na foto/avatar e nome na fonte de destaque.
- Atalho de Ajustes encolhe de leve ao tocar. Sem animação com "reduzir movimento".

## 5.0.22 — 25/10/2026 **Metas: anéis, barras com porcentagem e telas vazias**

- Metas (aba Metas): anel de progresso com % no centro (verde; concluída em verde-sucesso; atrasada em vermelho), valor guardado em destaque e barra de 11 px com brilho.
- Caixinha (Início): % de cada meta ao lado do nome.
- Telas vazias de "Metas de economia" e "Desafios" com as 3 barrinhas do logo (sobem animadas) e texto explicativo.
- Conquistas: ícone de sequência pulsa devagar, cartões sobem ao passar o mouse e as obtidas ganham brilho. Sem animação com "reduzir movimento".

## 5.0.21 — 21/10/2026 **Relatórios: gráfico por mês, anel e Retrospectiva em stories**

- Retrospectiva em stories: tela cheia (no computador, cartão de até 780 px), gradiente diferente por tela, barras de progresso que andam e avanço automático a cada 6,5 s; toque no terço esquerdo volta, no resto avança; na última tela o toque fecha. Com "reduzir movimento", sem avanço automático nem animação.
- Anel "Das receitas viraram despesa" (verde abaixo de 80%, âmbar até 100%, vermelho acima), com a média de gasto/mês.
- Gráfico Receitas x despesas: mês atual com brilho, meses anteriores mais apagados, cantos mais redondos.
- Cartão da Retrospectiva vai para depois do gráfico; no topo só em dezembro e janeiro.

## 5.0.20 — 21/10/2026 **Fatura em quadro, check com confete e Retirar vermelho**

- Fatura: quadro neutro (sem cor do banco) com "Fatura <nome do cartão>", vence/fecha, valor em fonte Sora com centavos menores (conta até o valor) e barra de limite disponível.
- Contas fixas e compras do cartão: ao marcar como paga, o check pula e se desenha, com confete de 12 barrinhas. Sem animação com "reduzir movimento".
- Caixinha: botão Retirar com contorno e texto vermelhos.

## 5.0.19 — 21/10/2026 **Calendário, rosca e barras de categoria**

- Calendário: calor do dia em verde (antes cinza), dias sem bordas, marcadores de vencimento com forma: anel (vence), ponto (pago), triângulo (atrasado); legenda acompanha.
- Rosca (Início e Relatórios): etiquetas com nome e % das 3 maiores fatias (a partir de 6%), em volta do gráfico; nomes longos são encurtados.
- Barras de categoria com 9 px, cantos redondos e brilho na cor da categoria.

## 5.0.18 — 21/10/2026 **Ícones de categoria e lançamentos no novo estilo**

- Ícones de categoria (lançamentos, categorias, orçamento) em círculo com contorno na cor da categoria.
- Lançamentos do Início: valor em fonte Sora com "R$" e centavos menores, cabeçalho de dia mais discreto, sem divisórias entre itens, fundo suave ao passar o mouse e leve encolhida ao tocar.

## 5.0.17 — 21/10/2026 **Cartão de saldo novo**

- Saldo, receitas e despesas do cartão do Início em fonte Sora, com "R$" e centavos menores (o texto lido continua o mesmo valor).
- Aura animada no fundo do cartão, colorida pela saúde do mês: saudável (verde), apertado (saldo abaixo de 5% das receitas, âmbar), no vermelho (negativo). Selo com o estado ao lado do título.
- Linha do saldo com brilho e ponto final pulsando. Sem animação com "reduzir movimento".

## 5.0.16 — 20/10/2026 **Abertura animada**

- Tela de abertura com o logo desenhado em SVG: as pernas do M entram, as 3 barras sobem em sequência e o nome aparece.
- A abertura fica no mínimo 1,15 s (tempo das barras subirem); com "reduzir movimento", 0,5 s e sem animação.
- Quadros entram em cascata (60 ms entre cada um) na abertura e ao trocar de aba; ao trocar de mês, só números e barras se mexem.

## 5.0.15 — 20/10/2026 **Movimento: valores que contam e barras que enchem**

- Valores grandes (saldo, receitas, despesas, quadros de Relatórios) contam de zero até o número ao trocar de tela.
- Barras de categorias, formas de pagamento, limite do cartão, metas, desafios e viagens enchem em sequência.
- Linha do saldo se desenha; rosca e gráfico de meses de Relatórios surgem animados.
- Só anima quando a tela muda (aba, mês, abertura), nunca ao digitar. Respeita "reduzir movimento" do aparelho.
- Na abertura, o movimento espera a tela do logo sair.

## 5.0.14 — 19/10/2026 **Checagem de tipos sem avisos**

- `tsc -p jsconfig.json` agora passa com **0 avisos** (eram 416 na 5.0.12).
- Novo `tipos.d.ts` (só para o editor, o app não carrega): diz ao TypeScript que os elementos da tela lidos com
  `getElementById` podem ser campos de formulário (`.value`, `.checked`…), e declara o `FIREBASE_CONFIG` global.
- `itemAtual()` anotado como "qualquer item" (depende da folha aberta); listas e objetos montados aos poucos ganharam tipo em comentário.
- Pequenos ajustes que não mudam o resultado, só deixam o tipo explícito: contas com datas usam `getTime()`,
  a ordenação de alertas usa `Number(...)` no verdadeiro/falso, a leitura do backup usa `String(...)`.
- Nenhuma mudança visível no app.

## 5.0.13 — 19/10/2026 **Renda fixa com dia**

- Renda fixa (bolsa, pensão, aluguel recebido) ganhou o campo "Cai no dia". Antes ela não tinha dia, e o calendário do mês e o resumo da semana a mostravam sempre no dia 1 (achado pela checagem de tipos da 5.0.12).
- Em meses mais curtos, um dia 31 vira o último dia do mês.
- Rendas já cadastradas continuam no dia 1 até serem editadas; nada muda no saldo nem nos totais.
- Receita avulsa marcada como "Recebo esse valor todo mês" cria a renda fixa no mesmo dia da receita.
- Nas listas de receitas, a pílula mostra "dia 10" no lugar de "todo mês".

## 5.0.12 — 19/10/2026 **Checagem de tipos (só para desenvolvimento)**

- `// @ts-check` no topo do `app.js` e tipos em JSDoc (comentários) para Config, Mes, Gasto, Parcela, Cartao, Conta,
  Categoria, Fixo, Renda, Meta, Divida, Viagem, Desafio, UI e os resultados de calc/previsaoMes.
- Funções de cálculo anotadas: calc, parcelasDoMes, faturaDoMes, saldosContas, previsaoMes, sobraCat, parseMoney, valorParcela.
- Novo `jsconfig.json` para o VS Code entender o projeto e mostrar os avisos.
- Nenhuma mudança de funcionamento ou visual: só comentários (além do número da versão).
- Checagem: `npx -p typescript tsc -p jsconfig.json` (veja DESENVOLVIMENTO/CHANGELOG para o que os avisos significam).

## 5.0.11 — 19/10/2026 **Nada sai da caixa**

- Calculadora "Quanto guardar": o botão "Criar meta de economia com esses valores" saía para a direita (com letra grande no celular) e encostava no resultado e no texto; agora ocupa a largura certa, quebra a linha e tem espaço entre os blocos.
- Botões em geral: texto longo quebra a linha em vez de passar da borda.
- Títulos das caixas com nome comprido (viagem, desafio etc.) ganham reticências em vez de empurrar a tela.
- Nomes sem espaço (ex.: "aaaa…") em categorias, metas, contas fixas, lançamentos e avisos quebram a linha em vez de criar rolagem para o lado.
- Barra de meses em telas estreitas: o ano fica embaixo do mês, para caber com letra grande.
- Relatórios: a legenda do gráfico (Receitas/Despesas) foi para dentro da caixa.
- Valores muito altos no topo (Receitas/Despesas) diminuem a letra para caber.
- Testado página por página e função por função: celular (360 e 390 px) e computador, temas claro e escuro, letra normal e 30% maior, usuário novo, nomes longos e virada do ano.

## 5.0.10 — 19/10/2026 **Caixas do Início abertas de novo**

- Início e Ajustes: as caixas voltaram a ficar sempre abertas, como antes da 5.0.6. Fatura do cartão, contas fixas, receitas, caixinha, calendário e para onde foi aparecem direto, com o círculo de "paga" e o toque para editar à mão.
- Mantidos: barra de meses com 4 meses + calendário de mês e ano (5.0.8) e a correção da faixa verde do topo.
- Tutorial atualizado: explica a barra de meses e onde marcar contas como pagas.

## 5.0.9 — 19/10/2026 **Novo endereço e tela de abertura**

- Tela de abertura: logo do Monetra grande, sem o quadrado, em fundo escuro de tela cheia, que some com um fade quando o app fica pronto (fica pelo menos ~0,7 s para não piscar; some sozinha em 6 s se algo travar).
- Novo `icons/splash-512.png` (logo sem fundo) para a tela de abertura do APK; cor de fundo do app `#030605`.
- Nome antigo removido do que aparece para quem usa: backup `monetra-backup-AAAA-MM-DD.json`, planilha `monetra-planilha…`, lembretes `monetra-lembretes.ics`. Backups antigos continuam podendo ser restaurados.
- Endereço novo: `https://gustavombarbosadev.github.io/Monetra/` (repositório renomeado de MB-Controle para Monetra). O endereço antigo redireciona, mantendo convites.
- README e DESENVOLVIMENTO atualizados (passo a passo da troca de nome e do APK).

## 5.0.8 — 19/10/2026 **Barra de meses nova**

- Barra de meses do Início:
  - mostra só 4 meses, que cabem na tela: mês anterior, mês atual e os próximos que têm fatura do cartão ou parcela para pagar (completa com os meses seguintes quando não há contas);
  - se você abre um mês fora desses 4, ele entra na barra no lugar do mais distante;
  - as setas ‹ › saíram; no lugar, um botão de calendário.
- Novo seletor "Selecione o mês e o ano": grade com os 12 meses, troca de ano por setas, meses sem dados desativados, pontinho nos meses com conta a pagar e botão "Ver <mês>".
- Os meses futuros agora vão até a última parcela a pagar (antes paravam 2 meses à frente).
- Setas do teclado continuam trocando de mês.
- Tutorial atualizado.

## 5.0.7 — 19/10/2026 **Tom mais calmo**

- Vermelho reservado para o que pede ação (conta atrasada, limite estourado):
  - total de Despesas no topo em cor normal;
  - calendário de calor em tom neutro (antes rosa/vermelho em todo dia com gasto); semana mais pesada com borda neutra;
  - variação do saldo vs mês anterior ("▼ 49%") sem vermelho.
- Faixa de avisos do Início: cada aviso numa linha própria, em vez de tudo numa frase.
- Notificações: conta atrasada com ícone de alerta e conta a vencer com relógio (antes era um ✓).
- Previsão do mês: "≈ R$ ..." não quebra mais de linha no meio.

## 5.0.6 — 19/10/2026 **Início mais enxuto**

- Início (celular): a página caiu de ~5.400px para ~2.500px de altura.
  - Ficam à mostra: saldo, atalhos, lembretes, previsão, orçamento do mês e últimos lançamentos.
  - Em "Mais de <mês>": calendário, para onde foi, contas, faturas, contas fixas, receitas, caixinha e forma de pagamento, cada um numa linha com resumo (ex.: total) que abre ao tocar.
  - "Ver tudo" do orçamento e os avisos abrem a seção certa sozinhos.
  - No primeiro uso, Receitas já vem aberta para informar o salário.
- Ajustes (celular): contas fixas, parcelas, viagem, dívidas, ferramentas, importar extrato, contas, cartões e categorias viram linhas com resumo que abrem ao tocar.
- O app lembra, neste aparelho, quais seções você deixou abertas.
- Computador: sem mudança, tudo continua aberto em duas colunas.
- Tutorial atualizado para explicar o "Mais do mês".
- Corrigido o cálculo da faixa verde do topo, que podia crescer demais em telas curtas.

## 5.0.5 — 19/10/2026 **Lançamento rápido preenche o formulário**

- Nova despesa: o campo rápido agora preenche o formulário enquanto você digita (com uma pequena espera), em vez de só mostrar uma prévia. Antes a prévia dizia "R$ 45,00 · Lazer" e o formulário continuava "0,00 · Mercado", e tocar em Salvar podia gravar o valor errado.
- Os campos preenchidos ganham um destaque rápido (sem animação para quem prefere menos movimento).
- O cursor continua no campo rápido; Enter salva como antes.

## 5.0.4 — 19/10/2026 **Contraste e botão +**

- Botão + da barra inferior: o ícone herdava o cinza dos outros botões e ficava quase invisível; agora usa a cor de texto do botão.
- Tema claro dentro do contraste mínimo (WCAG AA, 4,5:1):
  - verde de texto e botões: #0E9F6E → #0A7A55;
  - laranja de alerta: #C47F17 → #9A5B00; vermelho: #E5484D → #C62F35; cinza secundário: #66756C → #5A675F;
  - degradê dos botões cheios escurecido para o texto branco continuar legível.
- Textos pequenos (ano nos meses, Receitas/Despesas no topo) passaram para 11,5px.
- Alvos de toque no celular: lupa, sino 44px; setas dos meses 40px; meses 38px de altura.
- Anel de foco dos campos mais visível no tema claro.

## 5.0.3 — 19/10/2026 **Espaçamentos no celular**

- Espaçamentos revisados no celular (telas de 360 px):
  - títulos que ficam fora das caixas ganharam mais espaço em relação à caixa de cima;
  - "Últimos lançamentos" e o filtro de categorias ficam numa linha só, sem invadir a lista;
  - nomes de metas, categorias e cartões aparecem inteiros: o valor desce de linha quando não cabe;
  - abas das calculadoras sem a pílula oval espremida;
  - campos lado a lado alinhados mesmo com rótulos de tamanhos diferentes.
- Tabela "Mês a mês": no celular a coluna Acumulado fica oculta (o valor continua no card de saldo acumulado).
- Movimentos da caixinha: pílula só com o dia; "Guardou/Retirou" vai para a linha de baixo.

## 5.0.2 — 19/10/2026 **Tutorial atualizado**

- Tutorial reescrito para as abas novas (Início, Relatórios, Metas, Perfil → Ajustes) e as funções das últimas versões: lançamento rápido por texto, calendário, previsão do mês, sobra acumulada, metas e desafios, resumo da semana e ferramentas.
- Logo do Monetra no tutorial (antes aparecia "MB"), na tela de entrada e no bloqueio por PIN.
- Em Ajustes → Categorias de gastos aparecem só as 5 primeiras; o botão "Ver todas as N categorias" mostra o resto (e "Mostrar só as 5 primeiras" recolhe).

## 5.0.1 — 19/10/2026 **Início como no modelo + botão voltar**

- Início no formato aprovado: saudação ("Boa tarde, Gustavo"), saldo com variação vs mês anterior, gráfico do saldo dia a dia, receitas e despesas dentro do cartão, atalhos rápidos, previsão do mês e o card "Orçamento do mês" (ou "Onde mais gastou", sem limites).
- Logo e ícones refeitos a partir da imagem em alta resolução; no topo aparece só o M.
- Barra de baixo: Início, Relatórios, +, Metas e Perfil. Ajustes abre pelo Perfil (e pelas abas no computador).
- Botão voltar do celular: fecha a janela aberta (nova despesa, edição etc.) ou volta para o Início, em vez de fechar o app.
- Barra de rolagem dos meses escondida.

## 5.0.0 — 19/10/2026 **Monetra**

- O app passa a se chamar **Monetra**, com logo e ícones novos (tela inicial do celular, aba do navegador e APK).
- Visual novo: tema claro com o topo em verde da marca e o saldo em "vidro"; tema escuro preto com verde neon. Fonte Inter.
- Caixas sem borda, cantos mais redondos, sombra suave (claro) ou relevo sutil (escuro) e o título de cada seção fora da caixa.
- Navegação nova: Início, Relatórios, botão + no centro (em todas as abas), Metas e Ajustes. O Perfil abre pela foto no topo.
- Nova aba **Metas**: metas de economia, desafios e conquistas juntos (saíram de Ajustes e da Visão geral).
- Ícones de traço no lugar de todos os emojis (ferramentas, conquistas, sequências).
- Os dados, o endereço do site e as chaves salvas no aparelho continuam os mesmos: nada precisa ser refeito.

## 4.9.0 — 19/10/2026 **Calculadoras brasileiras**

- Em Ajustes → Ferramentas: 13º salário (1ª parcela sem descontos e 2ª com INSS e IR), férias (férias + 1/3, com opção de vender 10 dias) e salário líquido.
- Usam as tabelas de 2026: INSS progressivo (até R$ 8.475,55) e Imposto de Renda com a isenção até R$ 5.000 e a redução até R$ 7.350 (Lei 15.270/2025), dependentes e desconto simplificado. Atualizar a constante `TAB` em app.js a cada ano.
- "Quanto guardar por mês": valor da compra, quanto já tem, prazo e rendimento opcional; mostra o depósito mensal e cria uma meta de economia com um toque.

## 4.8.0 — 18/10/2026 **Simulador de quitação**

- Nova seção Ferramentas em Ajustes, com o Simulador de quitação (também pelo link no card Dívidas).
- Informe quanto deve, os juros ao mês e quanto paga por mês: o app mostra em quantos meses quita, em que mês, quanto paga de juros e o total. Se a parcela não cobre os juros, avisa que a dívida nunca acaba.
- Campo "E se pagar a mais?": compara os dois cenários, mostra quantos meses antes quita e quanto economiza de juros, com gráfico do saldo.
- Para financiamento sem saber o saldo: informe as parcelas que faltam e o app estima o saldo. Taxas de exemplo para preencher rápido e atalho para usar uma dívida anotada.

## 4.7.0 — 18/10/2026 **Resumo da semana**

- De domingo a terça, o sininho mostra o resumo da semana (segunda a domingo): quanto gastou, comparação com a semana anterior e a categoria que mais subiu. Com as notificações ligadas, chega um aviso por semana.
- Tela "Resumo da semana" (pelo sininho ou pelo botão no card Calendário): gasto por dia em gráfico, onde mais gastou com a diferença para a semana anterior, maior gasto e setas para ver semanas anteriores.

## 4.6.0 — 18/10/2026 **Lembrete de backup**

- Uma vez por mês (a partir de 10 lançamentos) o sininho sugere baixar o backup, com os botões "Baixar" e "Depois" (lembra de novo em 7 dias).
- Sem login, o lembrete conta como aviso importante (os dados ficam só no aparelho); com login, aparece como dica.
- Com as notificações ligadas, chega também um aviso no aparelho, no máximo uma vez por mês.
- Em Perfil → Exportar e backup aparece a data do último backup baixado neste aparelho.

## 4.5.0 — 18/10/2026 **Conquistas e desafios**

- Novo card em Visão geral: sequência de dias lançando gastos, meses seguidos fechando no azul (com recordes) e 12 conquistas para desbloquear.
- Desafios: "não gastar nada" ou "gastar no máximo R$ X" com uma categoria e/ou palavras da descrição, por 7 a 90 dias. Modelos prontos: 30 dias sem delivery, semana sem compras, mercado no limite. O app acompanha sozinho pelos lançamentos.
- Avisa quando uma conquista é desbloqueada ou quando um desafio termina.
- **Regras do Firebase atualizadas** (nova lista `desafios` nas configurações) — publique o firestore.rules antes de usar desafios na conta.

## 4.4.0 — 18/10/2026 **Lançamento rápido por texto**

- No topo da nova despesa há um campo rápido: escreva "45 ifood", "120 mercado ontem pix" ou "600 tv 3x crédito" e aperte Enter para lançar.
- Entende valor (45 · 45,90 · 1.200), forma de pagamento (pix, débito, crédito/cartão, dinheiro, boleto), o nome do cartão, data (hoje, ontem, anteontem, dia 12, 12/10) e parcelas (3x).
- A categoria vem do seu histórico (despesas com a mesma palavra), do nome da categoria/subcategoria ou de palavras conhecidas (ifood, uber, farmácia…). Sem IA paga: tudo roda no aparelho.
- Uma prévia mostra o que vai ser lançado antes do Enter; os campos de baixo continuam funcionando para ajustar.

## 4.3.0 — 18/10/2026 **Calendário do mês**

- Novo card "Calendário" na aba Mês: cada dia mostra quanto foi gasto (cor mais forte = dia mais pesado), receitas do dia e bolinhas para as contas que vencem (amarela = vence, verde = paga, vermelha = atrasada).
- O topo do card mostra a semana mais pesada do mês.
- Toque num dia para ver as despesas e contas dele, marcar conta como paga ou lançar uma despesa já com aquela data.

## 4.2.0 — 18/10/2026 **Orçamento com sobra acumulada**

- Opção por categoria (Ajustes → Categorias → "Sobra passa para o mês seguinte"): o que não foi gasto do limite entra no limite do mês seguinte. Ex.: limite de R$ 800, gastou R$ 700 → no mês seguinte o limite é R$ 900.
- Se passar do limite, a sobra zera e o mês seguinte volta ao limite normal. Conta a partir do mês em que a opção foi ligada.
- O gráfico "Para onde foi", os avisos de 80%/limite estourado e o alerta de ritmo usam o limite com a sobra.

## 4.1.0 — 18/10/2026 **Previsão do fim do mês**

- No topo do mês atual, o app mostra com quanto o mês deve terminar se você continuar gastando no mesmo ritmo (média por dia dos gastos do dia a dia). Contas fixas e parcelas já entram no saldo; compras no cartão aparecem à parte, porque vão para a próxima fatura.
- Alerta de ritmo: categorias com limite avisam **antes** de estourar ("No ritmo de hoje, Mercado estoura o limite no dia 22"). Aparece na faixa de lembretes, no sininho, nas notificações e no gráfico "Para onde foi". Começa a valer a partir do 5º dia do mês.

## 4.0.0 — 17/10/2026 **Visual novo**

- Saldo do mês em destaque no topo, com barra de quanto do que entrou já foi usado; receitas, despesas, por dia e caixinha viram cartões menores logo abaixo.
- Lembretes viram uma faixa compacta (contas atrasadas, que vencem hoje/amanhã e categorias no limite); um toque abre a lista para marcar como paga.
- Ícones nas categorias: aparecem na lista de despesas, no gráfico "Para onde foi" e na escolha de categoria. Dá para trocar o ícone em Ajustes → Categorias (vem um automático pelo nome).
- Status de salvamento vira um pontinho colorido ao lado do logo no celular (toque para ver o texto).
- Botões secundários sem borda tracejada; mais espaço no fim da tela para o botão + não cobrir nada.
- Fatura de cartão sem compras ocupa só uma linha.

## 3.9.1 — 17/10/2026
**Listas do mês mais curtas**
- A lista "Despesas do mês" mostra só as 5 mais recentes, com o total e a quantidade do mês no topo. O botão **Ver todas as N despesas** abre o resto (e "Mostrar só as 5 mais recentes" fecha). O total de cada dia continua considerando todas as despesas daquele dia.
- O mesmo vale para as receitas avulsas no card Receitas.

## 3.9.0 — 17/10/2026
**Modo viagem**
- Ajustes → **Modo viagem**: cadastre viagens com nome, datas de ida e volta, moeda do destino, cotação, taxas do cartão (IOF + spread, em %) e orçamento em reais.
- Botão **Buscar cotação de hoje** (cotação comercial da ExchangeRate-API); dá para digitar a cotação à mão.
- Nos dias da viagem, a nova despesa já abre como **gasto da viagem**: digite o valor na moeda de lá (ou em reais) e o app mostra e salva a conversão para real com a cotação e as taxas da viagem.
- Cada gasto guarda a cotação do dia em que foi lançado; mudar a cotação depois vale só para os próximos.
- Card da viagem no topo do mês atual: total gasto (em reais e na moeda), quanto ainda pode gastar no orçamento e a cotação usada.
- Resumo da viagem: total, média por dia, gastos por categoria e lista de lançamentos.
- Os gastos da viagem continuam contando normalmente no mês (saldo, categorias, limites).
- Compras parceladas feitas na viagem entram no total da viagem; a prévia das parcelas já mostra o valor convertido.

**Segunda revisão (correções)**
- Salvamento: três situações raras em que um lançamento de outro aparelho podia se perder (editar enquanto um envio está em andamento, edição guardada sem internet em um mês ainda vazio, primeiro uso offline em um aparelho novo) foram corrigidas.
- Editar um gasto da viagem mantém a cotação do dia em que foi lançado; se a viagem for excluída, o valor em reais é mantido.
- Celular: a categoria da despesa vai para a linha de baixo e a descrição aparece inteira.
- Avisos com "Desfazer" aparecem por cima da janela aberta.
- Enter na janela de despesa salva e fecha (antes fazia "Salvar e lançar outra").
- Números grandes diminuem de tamanho em vez de quebrar no meio (assinaturas, dívidas, viagem).
- Visão geral no computador: card da retrospectiva e gráfico com tamanho certo.
- Tab fica dentro da janela aberta (teclado).
- Caixinha: não dá para retirar da "Geral" mais do que ela tem; texto "retirado da caixinha".
- Desmarcar uma compra do cartão como paga desmarca a fatura daquele mês.
- "Passou do limite" aparece em vermelho nos lembretes.
- "Recomeçar do zero" no modo sem login não pede para aceitar os termos de novo.
- Ao informar o primeiro salário, o app oferece repetir o valor todo mês.
- Textos do modo sem login e do PIN corrigidos; plurais na importação de extrato.

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
