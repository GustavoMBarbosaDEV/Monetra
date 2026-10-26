import { test, before, after, beforeEach } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, deleteField } from "firebase/firestore";

const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080").split(":");
let env;

const configValida = () => ({
  desafios: [], viagens: [], dividas: [], termos: { v: "1.1", em: "2026-10-01T10:00:00.000Z" },
  salarioPadrao: 5000, saldoInicial: 0, saldoCaixinha: 0, ate: "2027-12", inicio: "2026-09",
  categorias: [{ id: "c1", nome: "Mercado", orcamento: 800 }], fixos: [], parcelas: [], rendas: [],
  cartoes: [], contas: [], contaSalario: null, metas: []
});
const mesValido = () => ({
  salario: null, avulsos: [], caixinha: [], transf: [], fixos: {}, rendas: {}, parcelas: {}, faturasPagas: {}, faturaPaga: false,
  gastos: [{ id: "g1", dia: 3, valor: 20, desc: "Mercado", cat: "c1", forma: "pix" }]
});

const como = uid => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();
const semRegras = fn => env.withSecurityRulesDisabled(ctx => fn(ctx.firestore()));

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-monetra",
    firestore: { host, port: Number(port), rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8") }
  });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

async function criaGrupo(dono = "ana", membros = {}) {
  await semRegras(async db => {
    await setDoc(doc(db, "grupos", "g1"), { nome: "Casa", dono, codigo: "ABCD1234", criado: "2026-10-01", m: { [dono]: { nome: "Ana" }, ...membros } });
    await setDoc(doc(db, "grupos", "g1", "docs", "m-2026-10"), mesValido());
    await setDoc(doc(db, "convites", "ABCD1234"), { grupo: "g1", dono, nome: "Casa", donoNome: "Ana", em: "2026-10-01" });
  });
}

test("sem login não lê nem grava nada", async () => {
  await semRegras(db => setDoc(doc(db, "users", "ana", "docs", "config"), configValida()));
  await assertFails(getDoc(doc(como(null), "users", "ana", "docs", "config")));
  await assertFails(setDoc(doc(como(null), "users", "ana", "docs", "config"), configValida()));
  await criaGrupo();
  await assertFails(getDoc(doc(como(null), "grupos", "g1")));
  await assertFails(getDoc(doc(como(null), "convites", "ABCD1234")));
});

test("cada pessoa lê e grava só os próprios dados", async () => {
  await assertSucceeds(setDoc(doc(como("ana"), "users", "ana", "docs", "config"), configValida()));
  await assertSucceeds(setDoc(doc(como("ana"), "users", "ana", "docs", "m-2026-10"), mesValido()));
  await assertSucceeds(getDoc(doc(como("ana"), "users", "ana", "docs", "config")));
  await assertSucceeds(setDoc(doc(como("ana"), "users", "ana", "meta", "eu"), { ativo: "pessoal", grupos: {}, pendentes: {} }));
  await assertFails(getDoc(doc(como("bia"), "users", "ana", "docs", "config")));
  await assertFails(getDocs(collection(como("bia"), "users", "ana", "docs")));
  await assertFails(setDoc(doc(como("bia"), "users", "ana", "docs", "m-2026-10"), mesValido()));
  await assertFails(deleteDoc(doc(como("bia"), "users", "ana", "docs", "config")));
  await assertFails(getDoc(doc(como("bia"), "users", "ana", "meta", "eu")));
  await assertSucceeds(deleteDoc(doc(como("ana"), "users", "ana", "docs", "config")));
});

test("dados no formato errado são recusados", async () => {
  const ana = como("ana");
  await assertFails(setDoc(doc(ana, "users", "ana", "docs", "config"), { ...configValida(), chaveEstranha: 1 }));
  await assertFails(setDoc(doc(ana, "users", "ana", "docs", "config"), { ...configValida(), categorias: "não é lista" }));
  await assertFails(setDoc(doc(ana, "users", "ana", "docs", "config"), { ...configValida(), ate: "dezembro" }));
  await assertFails(setDoc(doc(ana, "users", "ana", "docs", "config"), { ...configValida(), categorias: Array.from({ length: 301 }, (_, i) => ({ id: "c" + i })) }));
  await assertFails(setDoc(doc(ana, "users", "ana", "docs", "m-2026-10"), { ...mesValido(), gastos: {} }));
  await assertFails(setDoc(doc(ana, "users", "ana", "docs", "m-2026-10"), { ...mesValido(), salario: "muito" }));
  await assertFails(setDoc(doc(ana, "users", "ana", "docs", "m-2026-10"), { ...mesValido(), extra: true }));
  await assertFails(setDoc(doc(ana, "users", "ana", "docs", "qualquer"), mesValido()));
  await assertFails(setDoc(doc(ana, "users", "ana", "outracoisa", "x"), { a: 1 }));
  await assertFails(setDoc(doc(ana, "users", "ana", "meta", "eu"), { grupos: "não é mapa" }));
});

test("controle compartilhado só para quem participa", async () => {
  await criaGrupo("ana", { bia: { nome: "Bia" } });
  await assertSucceeds(getDoc(doc(como("bia"), "grupos", "g1")));
  await assertSucceeds(getDoc(doc(como("bia"), "grupos", "g1", "docs", "m-2026-10")));
  await assertSucceeds(setDoc(doc(como("bia"), "grupos", "g1", "docs", "m-2026-10"), mesValido()));
  await assertFails(getDoc(doc(como("caio"), "grupos", "g1")));
  await assertFails(getDoc(doc(como("caio"), "grupos", "g1", "docs", "m-2026-10")));
  await assertFails(setDoc(doc(como("caio"), "grupos", "g1", "docs", "m-2026-10"), mesValido()));
  await assertFails(setDoc(doc(como("bia"), "grupos", "g1", "docs", "m-2026-10"), { ...mesValido(), extra: 1 }));
  await assertFails(deleteDoc(doc(como("bia"), "grupos", "g1", "docs", "m-2026-10")));
  await assertSucceeds(deleteDoc(doc(como("ana"), "grupos", "g1", "docs", "m-2026-10")));
});

test("quem participa sai sozinho, mas não mexe no grupo nem tira outros", async () => {
  await criaGrupo("ana", { bia: { nome: "Bia" }, caio: { nome: "Caio" } });
  await assertFails(updateDoc(doc(como("bia"), "grupos", "g1"), { ["m.caio"]: deleteField() }));
  await assertFails(updateDoc(doc(como("bia"), "grupos", "g1"), { nome: "Minha casa" }));
  await assertFails(deleteDoc(doc(como("bia"), "grupos", "g1")));
  await assertSucceeds(updateDoc(doc(como("bia"), "grupos", "g1"), { ["m.bia"]: deleteField() }));
  await assertSucceeds(updateDoc(doc(como("ana"), "grupos", "g1"), { ["m.caio"]: deleteField() }));
  await assertSucceeds(deleteDoc(doc(como("ana"), "grupos", "g1")));
});

test("criar grupo: dono é quem cria e começa sozinho", async () => {
  await assertSucceeds(setDoc(doc(como("ana"), "grupos", "g2"), { nome: "Viagem", dono: "ana", codigo: null, criado: "2026-10-01", m: { ana: { nome: "Ana" } } }));
  await assertFails(setDoc(doc(como("ana"), "grupos", "g3"), { nome: "Viagem", dono: "bia", codigo: null, criado: "2026-10-01", m: { ana: {} } }));
  await assertFails(setDoc(doc(como("ana"), "grupos", "g4"), { nome: "Viagem", dono: "ana", codigo: null, criado: "2026-10-01", m: { ana: {}, bia: {} } }));
});

test("pedido para entrar exige código de convite válido do grupo", async () => {
  await criaGrupo();
  const pedido = cod => ({ codigo: cod, nome: "Caio", email: "caio@exemplo.com", foto: "", em: "2026-10-02" });
  await assertFails(setDoc(doc(como("caio"), "grupos", "g1", "pedidos", "caio"), pedido("ERRADO00")));
  await assertFails(setDoc(doc(como("caio"), "grupos", "g1", "pedidos", "bia"), pedido("ABCD1234")));
  await assertSucceeds(setDoc(doc(como("caio"), "grupos", "g1", "pedidos", "caio"), pedido("ABCD1234")));
  await assertSucceeds(getDoc(doc(como("ana"), "grupos", "g1", "pedidos", "caio")));
  await assertFails(getDoc(doc(como("bia"), "grupos", "g1", "pedidos", "caio")));
});

test("convites: dá para consultar um código, mas não listar nem criar para grupo dos outros", async () => {
  await criaGrupo();
  await assertSucceeds(getDoc(doc(como("caio"), "convites", "ABCD1234")));
  await assertFails(getDocs(collection(como("caio"), "convites")));
  await assertFails(setDoc(doc(como("caio"), "convites", "ZZZZ0000"), { grupo: "g1", dono: "caio", nome: "Casa", donoNome: "Caio", em: "2026-10-02" }));
  await assertSucceeds(setDoc(doc(como("ana"), "convites", "NOVO0000"), { grupo: "g1", dono: "ana", nome: "Casa", donoNome: "Ana", em: "2026-10-02" }));
});

test("caminhos fora do app ficam fechados", async () => {
  await assertFails(setDoc(doc(como("ana"), "qualquer", "coisa"), { a: 1 }));
  await assertFails(getDoc(doc(como("ana"), "users", "bia")));
});
