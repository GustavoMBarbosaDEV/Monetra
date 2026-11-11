// Monta dist/ para o Firebase Hosting a partir de uma lista fixa de arquivos (nada fora dela é publicado).
// Uso: cd ferramentas && npm ci && node build.mjs
// O código do app fica em js/, um arquivo por assunto. Aqui eles são juntados, na ordem das tags
// <script src="js/..."> do index.html, dentro de uma função só, e viram o app.js publicado.
// O index.html publicado carrega só esse app.js (com ?v=).
// Minifica app.js, boot.js, pre.js, style.css e boot.css com esbuild; o resto é copiado como está.
import { transform } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(raiz, "dist");

const ARQUIVOS = ["index.html", "firebase-config.js", "manifest.webmanifest", "sw.js", "app.js", "boot.js", "pre.js", "style.css", "boot.css",
  "site.js", "site.css", "faq.html", "privacidade.html", "termos.html", "obrigado.html", "404.html", "robots.txt", "sitemap.xml"];
const PASTAS = ["icons", "screenshots", "fonts", "vendor", "img", ".well-known"];
const MINIFICA = { "app.js": "js", "boot.js": "js", "pre.js": "js", "style.css": "css", "boot.css": "css" };

const v = /const VERSAO="([0-9.]+)"/.exec(fs.readFileSync(path.join(raiz, "js", "versao.js"), "utf8"))[1];
const TAG_JS = /<script src="(js\/[^"?]+\.js)"><\/script>\r?\n/g;
const BLOCO_JS = /(?:<script src="js\/[^"?]+\.js"><\/script>\r?\n)+/g;
const indexRaiz = fs.readFileSync(path.join(raiz, "index.html"), "utf8");
const pedacos = [...indexRaiz.matchAll(TAG_JS)].map((m) => m[1]);
const noDisco = fs.readdirSync(path.join(raiz, "js"), { recursive: true }).map((f) => "js/" + String(f).split(path.sep).join("/")).filter((f) => f.endsWith(".js"));
const fora = noDisco.filter((f) => !pedacos.includes(f));
if (!pedacos.length || fora.length || (indexRaiz.match(BLOCO_JS) || []).length !== 1) {
  console.error("index.html precisa carregar todos os arquivos de js/, com as tags juntas, uma por linha. Fora da lista:", fora);
  process.exit(1);
}
function juntaApp() {
  const corpos = pedacos.map((f) => {
    const linhas = fs.readFileSync(path.join(raiz, f), "utf8").split(/\r?\n/);
    const i = linhas.indexOf('"use strict";');
    if (i < 0 || i > 3) { console.error(`${f}: precisa de "use strict"; nas primeiras linhas.`); process.exit(1); }
    if (linhas[linhas.length - 1] === "") linhas.pop();
    return linhas.slice(i + 1).join("\n");
  });
  return '// @ts-check\n(function(){\n"use strict";\n' + corpos.join("\n") + "\n})();\n";
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist);

let antes = 0, depois = 0;
for (const a of ARQUIVOS) {
  const origem = path.join(raiz, a);
  if (a !== "app.js" && !fs.existsSync(origem)) { console.error("Falta o arquivo:", a); process.exit(1); }
  let texto = a === "app.js" ? juntaApp() : fs.readFileSync(origem, "utf8");
  if (a === "index.html") texto = texto.replace(BLOCO_JS, (m) => `<script src="app.js?v=${v}"></script>${m.endsWith("\r\n") ? "\r\n" : "\n"}`);
  if (a === "app.js" && process.env.SALVA_APP) fs.writeFileSync(process.env.SALVA_APP, texto);
  let saida = texto;
  if (MINIFICA[a]) {
    const r = await transform(texto, { loader: MINIFICA[a], minify: true, charset: "utf8", legalComments: "none", ...(MINIFICA[a] === "js" ? { target: "es2020" } : {}) });
    for (const w of r.warnings) console.warn(`${a}: ${w.text}`);
    saida = r.code;
    antes += Buffer.byteLength(texto); depois += Buffer.byteLength(saida);
  }
  fs.writeFileSync(path.join(dist, a), saida);
}
for (const p of PASTAS) {
  const origem = path.join(raiz, p);
  if (fs.existsSync(origem)) fs.cpSync(origem, path.join(dist, p), { recursive: true });
}

const idx = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(dist, "sw.js"), "utf8");
const faltaV = Object.keys(MINIFICA).filter((a) => !idx.includes(`${a}?v=${v}"`));
if (faltaV.length || !sw.includes(`const V = "${v}"`)) {
  console.error(`Versões desencontradas (js/versao.js ${v}). Rode: node bump.mjs ${v}`, faltaV);
  process.exit(1);
}

const total = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? total(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
console.log(`dist/ pronta (versão ${v}): ${Math.round(total(dist) / 1024)} KiB no total; JS/CSS minificados ${Math.round(antes / 1024)} → ${Math.round(depois / 1024)} KiB.`);
