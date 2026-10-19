# Monetra — guia de desenvolvimento

Anotações técnicas de como o app foi montado e como publicar novas versões.
Para a apresentação do app, veja o [README](README.md).

---

## Passo 1 — Colocar o app no GitHub (GitHub Pages)

1. Entre em **github.com** e clique em **New repository** (botão verde "New").
2. Nome: `Monetra` (era `MB-Controle` até a 5.0.9; veja "Troca de nome do repositório" abaixo). Deixe **Public** e clique em **Create repository**.
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

## Controles compartilhados

Desde a versão 3.0, dá para criar controles separados para dividir com outras pessoas (a casa, uma viagem).
O controle **Pessoal** de cada um continua só dele.

1. Em **Perfil → Controles compartilhados**, dê um nome (ex.: Casa) e toque em **Criar**.
2. Toque em **Convidar alguém** e depois em **Enviar convite**.
3. A outra pessoa abre o link (ou digita o código no Perfil dela) e toca em **Pedir para entrar**.
4. Você aceita o pedido. Os botões no topo da tela trocam entre **Pessoal** e **Casa**.

> Para isso funcionar, as regras do arquivo `firestore.rules` precisam estar publicadas no Firebase
> (Firestore Database → Regras → colar → Publicar).

## Versões

O número da versão aparece no app em **Perfil → Novidades**, e o histórico completo fica no
[CHANGELOG.md](CHANGELOG.md).

Ao publicar uma versão nova:

1. Atualize `const VERSAO` e a lista `NOVIDADES` em `app.js`, e o `CACHE` em `sw.js`.
2. Escreva o que mudou no topo do `CHANGELOG.md`.
   - Se a mudança altera telas, abas ou o jeito de usar, atualize também o **tutorial** (`passosTutorial()` em `app.js`).
   - Se cria um campo novo nas configurações ou no mês, atualize o `firestore.rules` e publique as regras antes.
3. Faça o commit e o push.
4. No GitHub Desktop, aba **History** → botão direito no commit → **Create Tag** → `v2.4.0` (o número da versão) → **Push origin**.

Para mudanças grandes, use um branch `testes` e só junte na `main` (que é a versão no ar) quando estiver tudo certo.

## Aplicativo Android (APK) — grátis

**Jeito mais simples (sem APK):** no celular, abra o site no Chrome → menu ⋮ → **Instalar app**.

**Gerar o APK (PWABuilder, grátis):**

1. Abra **pwabuilder.com**, cole o endereço do app e clique em **Start**.
2. Clique em **Package for stores** → **Android** → **Generate Package**.
3. Em *Package ID*, use **sempre o mesmo** do APK já instalado (`io.github.gustavombarbosadev.twa`), senão o celular instala como outro app. Em *Signing key*, deixe **Create new**.
4. Baixe o .zip. Dentro dele:
   - o arquivo **.apk**, para instalar e compartilhar;
   - o **signing.keystore** e o **signing-key-info.txt**: **guarde em lugar seguro**, porque sem eles não dá para atualizar o app depois;
   - o **assetlinks.json**, que tira a barra de endereço de dentro do app (veja abaixo).
5. Mande o .apk para o celular e instale (o Android pede para permitir "instalar apps desconhecidos").

**Tirar a barra de endereço do app (assetlinks):** o arquivo precisa ficar na raiz do domínio, em
`https://gustavombarbosadev.github.io/.well-known/assetlinks.json`. Para isso, crie um repositório chamado
`GustavoMBarbosaDEV.github.io`, coloque nele a pasta `.well-known` com o `assetlinks.json` e um arquivo `.nojekyll`, e ative o GitHub Pages.

O APK abre o próprio site, então toda atualização publicada no GitHub aparece no app sem gerar outro APK.


## Troca de nome do repositório (MB-Controle → Monetra, na 5.0.9)

O endereço do app passou de `https://gustavombarbosadev.github.io/MB-Controle/` para
`https://gustavombarbosadev.github.io/Monetra/`.

- **Firebase:** nada muda (o domínio autorizado continua `gustavombarbosadev.github.io`). O projeto no Firebase
  continua se chamando `mb-controle`; esse nome não aparece para quem usa.
- **Dados no aparelho** (modo local, PIN, preferências) continuam, porque ficam guardados por domínio, não por pasta.
- **Endereço antigo:** um repositório novo chamado `MB-Controle` só com a pasta `redirecionar-mb-controle`
  (index.html, 404.html, sw.js, .nojekyll) manda quem abrir o link antigo para o novo, mantendo convites
  (`?convite=...`), e desliga o service worker antigo.
- **APK:** gerar de novo no PWABuilder com o endereço novo, o **mesmo Package ID**, a **mesma chave** (signing key
  existente) e um **número de versão maior**. O `assetlinks.json` fica na raiz do domínio
  (`GustavoMBarbosaDEV.github.io/.well-known/`), então não precisa mudar.
- **Tela de abertura do APK:** no PWABuilder, use em *Icon URL* o `icons/splash-512.png` (logo sem o quadrado)
  e em *Background color* / *Splash color* o `#030605`. O ícone do celular continua vindo do `icon-maskable-512.png`.
