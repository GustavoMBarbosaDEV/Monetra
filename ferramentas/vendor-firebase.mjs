// Gera vendor/firebase-<versão>/ a partir do pacote "firebase" do npm (versão fixa no package.json).
// Uso: cd ferramentas && npm ci && node vendor-firebase.mjs
// Saem quatro módulos ES (app, auth, firestore, app-check) com as mesmas funções que o app.js usa,
// mais pedaços comuns: o núcleo do Firebase fica num arquivo só, compartilhado pelos quatro.
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.join(aqui, "..");
const versao = JSON.parse(fs.readFileSync(path.join(aqui, "node_modules/firebase/package.json"), "utf8")).version;
const fbv = /const FB_V="([0-9.]+)"/.exec(fs.readFileSync(path.join(raiz, "app.js"), "utf8"));
if (!fbv || fbv[1] !== versao) {
  console.error(`FB_V no app.js (${fbv && fbv[1]}) é diferente do firebase instalado (${versao}). Ajuste os dois juntos.`);
  process.exit(1);
}

const MODULOS = {
  "firebase-app": ["firebase/app", ["initializeApp"]],
  "firebase-auth": ["firebase/auth", ["getAuth", "onAuthStateChanged", "getRedirectResult", "signInWithPopup", "signInWithRedirect", "signOut", "GoogleAuthProvider", "reauthenticateWithPopup", "deleteUser", "getAdditionalUserInfo"]],
  "firebase-firestore": ["firebase/firestore", ["initializeFirestore", "getFirestore", "persistentLocalCache", "persistentMultipleTabManager", "clearIndexedDbPersistence", "terminate", "collection", "doc", "getDoc", "getDocs", "setDoc", "updateDoc", "deleteDoc", "deleteField", "onSnapshot", "runTransaction"]],
  "firebase-app-check": ["firebase/app-check", ["initializeAppCheck", "ReCaptchaEnterpriseProvider"]],
};

const tmp = path.join(aqui, ".entradas");
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp);
const entradas = {};
for (const [nome, [pacote, nomes]] of Object.entries(MODULOS)) {
  const arq = path.join(tmp, nome + ".mjs");
  fs.writeFileSync(arq, `export { ${nomes.join(", ")} } from "${pacote}";\n`);
  entradas[nome] = arq;
}

const destino = path.join(raiz, "vendor", "firebase-" + versao);
fs.rmSync(destino, { recursive: true, force: true });
await build({
  entryPoints: entradas,
  outdir: destino,
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "browser",
  target: "es2020",
  minify: true,
  legalComments: "none",
  chunkNames: "nucleo-[hash]",
  entryNames: "[name]",
  outExtension: { ".js": ".js" },
  nodePaths: [path.join(aqui, "node_modules")],
  logLevel: "warning",
});
const apache = fs.readdirSync(path.join(raiz, "vendor")).filter((d) => d.startsWith("pdfjs-")).map((d) => path.join(raiz, "vendor", d, "LICENSE")).find((f) => fs.existsSync(f));
const ler = (f) => fs.readFileSync(path.join(aqui, "node_modules", f), "utf8").trim();
fs.writeFileSync(path.join(destino, "LICENSE"), [
  `Firebase JavaScript SDK ${versao} (pacotes firebase e @firebase/*), Copyright Google LLC.`,
  "Licenciado sob a Apache License, Version 2.0 (texto completo no fim deste arquivo).",
  "",
  "Também inclui:",
  "",
  "idb (ISC):", ler("idb/LICENSE"), "",
  "tslib (0BSD):", ler("tslib/LICENSE.txt"), "",
  "----------------------------------------------------------------------", "",
  apache ? fs.readFileSync(apache, "utf8") : "https://www.apache.org/licenses/LICENSE-2.0",
].join("\n"));
fs.rmSync(tmp, { recursive: true, force: true });

for (const f of fs.readdirSync(destino)) console.log(String(fs.statSync(path.join(destino, f)).size).padStart(8), f);
