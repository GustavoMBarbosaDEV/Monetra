# MB Controle — controle de gastos

App de controle de gastos pessoal. A barra de meses mostra do início do seu controle até 2 meses à frente e avança sozinha com o calendário:
salário, recebimentos avulsos, despesas diárias por campo, caixinha (guardar/retirar), limites por campo,
visão geral com gráfico e backup.

Cada pessoa entra com a própria conta Google e vê **só os próprios dados**. Funciona no computador e no
celular, e dá para instalar como aplicativo na tela inicial.

---

## Passo 1 — Colocar o app no GitHub (GitHub Pages)

1. Entre em **github.com** e clique em **New repository** (botão verde "New").
2. Nome: `MB-Controle` (ou mantenha `Meu-Caixa`, se já criou). Deixe **Public** e clique em **Create repository**.
3. Na página do repositório, clique em **uploading an existing file**.
4. Arraste **todos os arquivos e a pasta `icons`** deste projeto (não a pasta de fora, o conteúdo dela)
   e clique em **Commit changes**.
5. Vá em **Settings → Pages**. Em *Branch*, escolha **main** e **/ (root)** e clique em **Save**.
6. Espere 1–2 minutos. O endereço do app será:
   `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`

Nesse ponto o app já abre, em **modo local** (os dados ficam só naquele aparelho, sem login).
Para cada pessoa ter a própria conta e sincronizar entre aparelhos, faça o passo 2.

## Passo 2 — Criar o login e o banco de dados (Firebase, gratuito)

1. Entre em **console.firebase.google.com** com sua conta Google e clique em **Criar um projeto**.
   Nome: `mb-controle`. Pode desativar o Google Analytics. Clique em **Criar projeto**.
2. **Registrar o app web:** na tela inicial do projeto, clique no ícone **`</>`** (Web).
   Apelido: `mb-controle`. **Não** marque Firebase Hosting. Clique em **Registrar app**.
   Vai aparecer um bloco `const firebaseConfig = { ... }`. **Copie os valores** de dentro das chaves.
3. **Ativar o login com Google:** menu **Criação → Authentication → Vamos começar**.
   Em *Provedores de login*, clique em **Google → Ativar**, escolha seu e-mail de suporte e **Salvar**.
4. **Autorizar o endereço do GitHub:** ainda em Authentication, vá em **Configurações → Domínios autorizados →
   Adicionar domínio** e digite `SEU-USUARIO.github.io` (sem https e sem o nome do repositório).
5. **Criar o banco:** menu **Criação → Firestore Database → Criar banco de dados**.
   Local: **southamerica-east1 (São Paulo)**. Modo: **produção**. Clique em **Criar**.
6. **Proteger os dados:** no Firestore, aba **Regras**. Apague tudo, cole o conteúdo do arquivo
   `firestore.rules` deste projeto e clique em **Publicar**. É isso que garante que uma pessoa
   nunca veja os dados da outra.

## Passo 3 — Ligar o app ao Firebase

1. No GitHub, abra o arquivo **`firebase-config.js`** e clique no lápis (**Edit**).
2. Troque os valores de exemplo pelos que você copiou no passo 2.2. Fica assim:

   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "AIza...",
     authDomain: "mb-controle-xxxx.firebaseapp.com",
     projectId: "mb-controle-xxxx",
     storageBucket: "mb-controle-xxxx.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```
3. Clique em **Commit changes**. Em 1–2 minutos o app passa a pedir login com Google.

> Esses valores não são senha e podem ficar públicos no GitHub. Quem protege os dados são as regras
> do passo 2.6.

## Passo 4 — Usar e compartilhar

- Mande o link `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/` para quem quiser usar. Cada pessoa entra com
  a própria conta Google e começa com a página dela vazia.
- **Instalar no celular:** abra o link no Chrome (Android) → menu ⋮ → **Adicionar à tela inicial**.
  No iPhone: Safari → botão Compartilhar → **Adicionar à Tela de Início**.
- **Backup:** em Ajustes → Backup você baixa uma cópia dos seus lançamentos e pode restaurá-la depois.

## Se algo der errado

| Mensagem | O que fazer |
|---|---|
| "Este endereço ainda não foi autorizado no Firebase" | Refaça o passo 2.4 com o domínio exato `SEU-USUARIO.github.io`. |
| "Sem acesso aos dados (permission-denied)" | Confira se publicou as regras do passo 2.6. |
| Continua em "Modo local" depois de configurar | Confira o `firebase-config.js` e recarregue a página com Ctrl+Shift+R. |
| A página do GitHub dá erro 404 | Espere alguns minutos e confira o passo 1.5. |

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | Página do app |
| `app.js` | Toda a lógica (cálculos, login, salvamento) |
| `style.css` | Visual (tema claro e escuro) |
| `firebase-config.js` | Onde você cola a configuração do seu Firebase |
| `firestore.rules` | Regras de segurança para colar no Firebase |
| `manifest.webmanifest`, `sw.js`, `icons/` | Deixam o app instalável e abrindo sem internet |

## Versões

O número da versão aparece no app em **Perfil → Novidades**, e o histórico completo fica no
[CHANGELOG.md](CHANGELOG.md).

Ao publicar uma versão nova:

1. Atualize `const VERSAO` e a lista `NOVIDADES` em `app.js`, e o `CACHE` em `sw.js`.
2. Escreva o que mudou no topo do `CHANGELOG.md`.
3. Faça o commit e o push.
4. No GitHub Desktop, aba **History** → botão direito no commit → **Create Tag** → `v2.4.0` (o número da versão) → **Push origin**.

Para mudanças grandes, use um branch `testes` e só junte na `main` (que é a versão no ar) quando estiver tudo certo.
