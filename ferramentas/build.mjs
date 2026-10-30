// Monta dist/ para o Firebase Hosting a partir de uma lista fixa de arquivos (nada fora dela é publicado).
// Uso: cd ferramentas && npm ci && node build.mjs
// Minifica app.js, boot.js, pre.js, style.css e boot.css com esbuild; o resto é copiado como está.
// O código na raiz do repositório continua legível (e é o que o GitHub Pages serve).
import { transform } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(raiz, "dist");

const ARQUIVOS = ["index.html", "firebase-config.js", "manifest.webmanifest", "sw.js", "app.js", "boot.js", "pre.js", "style.css", "boot.css"];
const PASTAS = ["icons", "screenshots", "fonts", "vendor", ".well-known"];
const MINIFICA = { "app.js": "js", "boot.js": "js", "pre.js": "js", "style.css": "css", "boot.css": "css" };

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist);

let antes = 0, depois = 0;
for (const a of ARQUIVOS) {
  const origem = path.join(raiz, a);
  if (!fs.existsSync(origem)) { console.error("Falta o arquivo:", a); process.exit(1); }
  const texto = fs.readFileSync(origem, "utf8");
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

const v = /const VERSAO="([0-9.]+)"/.exec(fs.readFileSync(path.join(raiz, "app.js"), "utf8"))[1];
const idx = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(dist, "sw.js"), "utf8");
const faltaV = Object.keys(MINIFICA).filter((a) => !idx.includes(`${a}?v=${v}"`));
if (faltaV.length || !sw.includes(`const V = "${v}"`)) {
  console.error(`Versões desencontradas (app.js ${v}). Rode: node bump.mjs ${v}`, faltaV);
  process.exit(1);
}

const total = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? total(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
console.log(`dist/ pronta (versão ${v}): ${Math.round(total(dist) / 1024)} KiB no total; JS/CSS minificados ${Math.round(antes / 1024)} → ${Math.round(depois / 1024)} KiB.`);
