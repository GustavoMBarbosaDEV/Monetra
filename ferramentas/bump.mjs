// Troca a versão do Monetra nos lugares que dependem dela.
// Uso: cd ferramentas && node bump.mjs 5.4.5
//   app.js     const VERSAO="X.Y.Z"
//   sw.js      const V = "X.Y.Z"   (nome do cache e ?v= do SHELL)
//   index.html ?v=X.Y.Z nos links de style.css, boot.css, pre.js, boot.js e app.js
// NOVIDADES (app.js) e CHANGELOG.md continuam à mão.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const nova = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(nova || "")) { console.error("Uso: node bump.mjs X.Y.Z"); process.exit(1); }

function troca(arquivo, trocas) {
  const f = path.join(raiz, arquivo);
  let t = fs.readFileSync(f, "utf8");
  for (const [re, novo, esperado] of trocas) {
    const n = (t.match(re) || []).length;
    if (n !== esperado) { console.error(`${arquivo}: esperava ${esperado} ocorrência(s) de ${re}, achei ${n}. Nada foi alterado.`); process.exit(1); }
    t = t.replace(re, novo);
  }
  return () => { fs.writeFileSync(f, t); console.log("atualizado:", arquivo); };
}

const ARQUIVOS_V = ["style.css", "boot.css", "pre.js", "boot.js", "app.js"];
const gravar = [
  troca("app.js", [[/const VERSAO="\d+\.\d+\.\d+";/g, `const VERSAO="${nova}";`, 1]]),
  troca("sw.js", [[/const V = "\d+\.\d+\.\d+";/g, `const V = "${nova}";`, 1]]),
  troca("index.html", ARQUIVOS_V.map((a) => [new RegExp(`((?:href|src)="${a.replace(".", "\\.")})(?:\\?v=[0-9.]+)?"`, "g"), `$1?v=${nova}"`, 1])),
];
gravar.forEach((g) => g());
console.log(`Versão ${nova}. Falta escrever NOVIDADES no app.js e a entrada no CHANGELOG.md.`);
