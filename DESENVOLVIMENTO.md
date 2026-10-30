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
- **Backup:** em Perfil → Exportar e backup você baixa uma cópia dos seus lançamentos e pode restaurá-la depois.

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
| `pre.js`, `boot.js`, `boot.css` | Preferências aplicadas antes de desenhar, tela de abertura e registro do service worker (fora do `index.html` por causa da CSP) |
| `firebase.json` | Regras do Firestore, Firebase Hosting (arquivos publicados, cabeçalhos e cache) e emuladores |
| `testes-regras/` | Testes das regras do Firestore no emulador |
| `.github/workflows/hosting.yml` | Deploy no Firebase Hosting em push na `main` (precisa do secret da conta de serviço) |

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
   - Se cria uma chave nova no topo das configurações ou do mês, atualize o `firestore.rules` e publique as regras antes. Campo novo dentro de um item (lançamento, categoria, conta…) não precisa.
3. Faça o commit e o push.
4. No GitHub Desktop, aba **History** → botão direito no commit → **Create Tag** → `v2.4.0` (o número da versão) → **Push origin**.

A meta **Content-Security-Policy** do `index.html` só deixa rodar scripts dos arquivos do próprio site e do Google. Não escreva `<script>` nem `<style>` dentro do `index.html`: use um arquivo `.js`/`.css` e coloque no `SHELL` do `sw.js`. Domínio externo novo (API, imagem, fonte) precisa entrar na meta, senão o navegador bloqueia.
Para mudanças grandes, use um branch `testes` e só junte na `main` (que é a versão no ar) quando estiver tudo certo.

## Aplicativo Android (APK) — grátis

**Jeito mais simples (sem APK):** no celular, abra o site no Chrome → menu ⋮ → **Instalar app**.

**Gerar o APK (PWABuilder, grátis):**

1. Abra **pwabuilder.com**, cole o endereço do app e clique em **Start**.
2. Clique em **Package for stores** → **Android** → **Generate Package**.
3. Em *Package ID*, use **sempre o mesmo** do APK já instalado (`io.github.gustavombarbosadev.twa`), senão o celular instala como outro app. Em *Signing key*: **só na primeira vez** use **Create new**. Em toda atualização, escolha **Use mine** (ou "Upload existing") e envie o **mesmo `signing.keystore`** com as senhas do `signing-key-info.txt`; com chave nova o Android recusa a atualização e o `assetlinks.json` deixa de valer.
4. Baixe o .zip. Dentro dele:
   - o arquivo **.apk**, para instalar e compartilhar;
   - o **signing.keystore** e o **signing-key-info.txt**: **guarde em lugar seguro**, porque sem eles não dá para atualizar o app depois;
   - o **assetlinks.json**, que tira a barra de endereço de dentro do app (veja abaixo).
5. Mande o .apk para o celular e instale (o Android pede para permitir "instalar apps desconhecidos").

**Tirar a barra de endereço do app (assetlinks):** o arquivo precisa ficar na raiz do domínio, em
`https://gustavombarbosadev.github.io/.well-known/assetlinks.json`. Para isso, crie um repositório chamado
`GustavoMBarbosaDEV.github.io`, coloque nele a pasta `.well-known` com o `assetlinks.json` e um arquivo `.nojekyll`, e ative o GitHub Pages.

O APK abre o próprio site, então toda atualização publicada aparece no app sem gerar outro APK. O endereço atual do app e do APK está em "Firebase Hosting" (abaixo); o download do APK para quem usa fica em `https://monetraapp.web.app/baixar`.


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


## Firebase Hosting

Endereço oficial: `https://monetraapp.web.app` (site `monetraapp`, desde a 5.3.3). O projeto continua o `mb-controle-f70b6`.
Endereços antigos que ainda servem o app e mostram o aviso de mudança (`HOSTS_ANTIGOS` no `app.js`): `gustavombarbosadev.github.io/Monetra` (GitHub Pages, branch `main`) e o site padrão `mb-controle-f70b6.web.app` (5.3.0 a 5.3.2).

- **Dois sites no `firebase.json`:** `hosting` é uma lista com uma configuração para `monetraapp` e outra para `mb-controle-f70b6`, iguais (arquivos, `ignore`, `/baixar`, cabeçalhos e cache). Mudou uma? **Mude a outra igual.**
- **Deploy pela CLI (neste PC):** `.\testes-regras\node_modules\.bin\firebase.cmd login` uma vez; depois
  `.\testes-regras\node_modules\.bin\firebase.cmd deploy --only hosting:monetraapp --project mb-controle-f70b6`.
  Para o site antigo (só para o aviso de mudança chegar a quem ainda está nele): `--only hosting:mb-controle-f70b6`. O `--only hosting:...` não mexe nas regras do Firestore.
- **`/baixar`:** redirecionamento 302 para `https://github.com/gustavombarbosadev/Monetra/releases/latest/download/Monetra.apk`, o APK da Release mais nova. O botão **Baixar o app para Android** da apresentação usa `https://monetraapp.web.app/baixar` (`APK_URL`).
- **O que é publicado:** a raiz do repositório, menos o que está em `ignore`. Saem só os arquivos do app e o `.well-known/assetlinks.json` (20 hoje). Para conferir a lista exata antes de publicar:
  `node -e "const {listFiles}=require('./testes-regras/node_modules/firebase-tools/lib/listFiles.js');console.log(listFiles('.',require('./firebase.json').hosting[0].ignore).join('
'))"`
- **Arquivo novo no app** (CSS, JS, ícone): confira se entra na lista. **Arquivo interno novo** (nota, script, credencial): confira se fica de fora; na dúvida, acrescente ao `ignore` dos dois sites.
- **Cabeçalhos:** a CSP do cabeçalho repete a da meta do `index.html`, mais `frame-ancestors 'none'` e `upgrade-insecure-requests`. Mudou a CSP da meta? Mude também a do `firebase.json` (nos dois sites). No Hosting a CSP do cabeçalho vale também para o `sw.js`: tudo o que o service worker busca com `fetch` (o SDK em `www.gstatic.com`, por exemplo) precisa estar no `connect-src`.
- **APK (TWA):** o `.well-known/assetlinks.json` deste repositório é publicado nos dois sites, com o mesmo Package ID (`io.github.gustavombarbosadev.twa`) e a mesma impressão SHA-256. No PWABuilder, use o host `monetraapp.web.app`, o **mesmo Package ID**, a **mesma chave** e um **versionCode maior** (veja "Gerar o APK"); publique o `.apk` como `Monetra.apk` numa Release nova do GitHub para o `/baixar` entregar a versão nova. Quem atualizar o APK abre o app no domínio novo: dados do modo local, PIN e preferências do domínio antigo não vêm junto (os dados da nuvem vêm).
- **Deploy automático:** `.github/workflows/hosting.yml` publica no site `monetraapp` (canal `live`) a cada push na `main`, só se existir o secret `FIREBASE_SERVICE_ACCOUNT_MB_CONTROLE_F70B6` (JSON de uma conta de serviço com o papel **Administrador do Firebase Hosting** e **Leitor de chaves de API**). Sem o secret, o job só avisa. Nunca coloque esse JSON no repositório.
- **Domínio novo no Firebase:** incluir `https://<domínio>/*` nos sites permitidos da chave de API, `<domínio>` nos domínios da chave do reCAPTCHA (App Check) e nos domínios autorizados do Authentication. Os endereços antigos ficam nessas listas enquanto estiverem em uso (inclusive por APKs antigos).
- **PWA instalado:** o `id` do manifest é relativo (`./`), então em outro domínio ele vira outro endereço e o celular trata como **outra instalação**; PIN, preferências e dados do modo local ficam no domínio antigo.

## Bibliotecas de terceiros (vendor/)

- **Firebase JS SDK** (`FB_V` em `app.js`), em `vendor/firebase-<versão>/`, gerado por `ferramentas/vendor-firebase.mjs`. **Atualizar:** troque a versão de `firebase` em `ferramentas/package.json` **e** o `FB_V` no `app.js`, rode `cd ferramentas && npm install && node vendor-firebase.mjs`, apague a pasta antiga do `vendor/`, leia as notas de mudança (https://firebase.google.com/support/release-notes/js) e teste login, modo local, sincronização, compartilhado e offline. Se o app passar a usar outra função do SDK, acrescente o nome na lista `MODULOS` do script.
- O workflow `versoes.yml` abre uma issue toda semana em que o npm tiver versão nova do Firebase ou do pdf.js.

- **pdf.js 6.4.299** (build `legacy`), em `vendor/pdfjs-6.4.299/`: `pdf.min.mjs`, `pdf.worker.min.mjs` e `LICENSE` (Apache-2.0). Usado só na importação de extrato em PDF e carregado sob demanda (`carregaPdfjs()` em `app.js`). Não entra no `SHELL` do `sw.js` (são ~1,8 MB); o service worker guarda os arquivos na primeira vez que forem usados.
- **Atualizar:** `npm pack pdfjs-dist@<versão>` numa pasta temporária, copie `legacy/build/pdf.min.mjs`, `legacy/build/pdf.worker.min.mjs` e `LICENSE` para uma pasta nova `vendor/pdfjs-<versão>/`, troque `PDFJS_DIR` no `app.js`, apague a pasta antiga e teste a importação com PDFs reais e com senha. A pasta leva a versão no nome para nenhum cache antigo misturar arquivos.

## Segurança do repositório

- `.github/workflows/gitleaks.yml`: procura senhas e chaves em cada push. Falsos positivos se liberam no `.gitleaks.toml` (nunca libere uma chave de verdade).
- `.github/workflows/codeql.yml`: análise de segurança do código; os alertas aparecem na aba **Security** do GitHub.
- `.github/dependabot.yml`: abre pull requests quando sai versão nova das Actions.
- Como relatar falhas: `SECURITY.md`.

## Regras do Firestore: testar e publicar

- Testes em `testes-regras/regras.test.js`. Para rodar: instale o Node 20+ e o Java 21, depois `cd testes-regras`, `npm ci` e `npm test` (o emulador sobe sozinho). A Action `regras.yml` faz o mesmo no GitHub.
- Mudou o `firestore.rules`? Rode os testes e **publique as regras**: Firebase Console → Firestore Database → Regras → cole o arquivo inteiro → Publicar. O app não depende de publicar, mas a proteção nova só vale depois disso.

## Checagem de tipos (VS Code / TypeScript)

- O `app.js` começa com `// @ts-check` e tem os tipos principais em JSDoc (Config, Mes, Gasto, Parcela…).
- `jsconfig.json` liga a checagem; `tipos.d.ts` completa os tipos dos elementos da tela. Nenhum dos dois é carregado pelo app.
- No VS Code: abra a pasta do projeto e veja os avisos em **Problemas** (Ctrl+Shift+M).
- No terminal (com Node): `npx -p typescript tsc -p jsconfig.json` — o esperado é terminar sem nenhum erro.
- Ao criar campos novos nos dados, atualize o typedef correspondente no topo do `app.js`.
