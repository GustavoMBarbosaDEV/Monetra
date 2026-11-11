// @ts-check
// Entrar com Google, e-mail, link ou sem conta, e senha da conta.
"use strict";
function traduzErro(e){ const c=e&&e.code||"";
  if(c.includes("unauthorized-domain")) return "Este endereço ainda não foi autorizado no Firebase (Authentication → Configurações → Domínios autorizados).";
  if(c.includes("popup-closed")||c.includes("cancelled")) return "";
  if(c.includes("network")) return "Sem internet. Tente de novo.";
  if(c.includes("invalid-credential")||c.includes("wrong-password")||c.includes("user-not-found")||c.includes("invalid-login")) return "E-mail ou senha incorretos.";
  if(c.includes("email-already-in-use")) return "Este e-mail já tem conta no Monetra. Entre com a senha, com o link por e-mail ou com o Google, se foi assim que você criou.";
  if(c.includes("weak-password")) return "Senha fraca: use pelo menos 8 caracteres, com letras e números.";
  if(c.includes("invalid-email")||c.includes("missing-email")) return "Este e-mail não parece válido.";
  if(c.includes("too-many-requests")) return "Muitas tentativas. Espere alguns minutos e tente de novo.";
  if(c.includes("operation-not-allowed")||c.includes("admin-restricted")) return "Esta forma de entrar ainda não está ativada. Use o Google por enquanto.";
  if(c.includes("credential-already-in-use")||c.includes("provider-already-linked")) return "Essa conta já está ligada a outro Monetra. Use outra forma de entrar ou saia e entre com ela.";
  if(c.includes("requires-recent-login")) return "Por segurança, saia e entre de novo antes de fazer isso.";
  if(c.includes("invalid-action-code")||c.includes("expired-action-code")) return "Este link expirou ou já foi usado. Peça um novo.";
  if(c.includes("app-check")) return "Não deu para confirmar que você não é um robô. Recarregue a página e tente de novo.";
  return "Não foi possível entrar ("+c+")."; }
const LINK_KEY="mb.linkEmail", NOMES_PROV={"google.com":"Google","microsoft.com":"Microsoft","password":"e-mail e senha"};
/** @type {any} */
let credPendente=null;
const urlRetorno=()=>location.origin+location.pathname;
const emailOk=e=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const senhaBoa=x=>x.length>=8&&/[a-zA-Z]/.test(x)&&/\d/.test(x);
// senhas fáceis de adivinhar: listas conhecidas, sequências, repetições e o próprio e-mail
const SENHAS_OBVIAS=["senha123","senha1234","senha12345","password1","password123","abc12345","abcd1234","qwerty123","admin123","admin1234","mudar123","teste123","12345678a","a12345678","iloveyou1","brasil123","monetra123"];
function senhaObvia(senha,email){ const s=String(senha||"").toLowerCase(), so=s.replace(/[^a-z0-9]/g,""), user=String(email||"").toLowerCase().split("@")[0].replace(/[^a-z0-9]/g,"");
  if(SENHAS_OBVIAS.includes(so)||/(.)\1{5,}/.test(so)) return true;
  if(/^(?:0123456789|123456789|12345678|87654321|abcdefgh|qwertyui)/.test(so)) return true;
  return user.length>=4&&so.includes(user); }
const temProv=id=>!!(authUser&&(authUser.providerData||[]).some(p=>p.providerId===id));
const ehAnonimo=()=>!!(authUser&&authUser.isAnonymous);
function provedor(nome){ const p=nome==="microsoft"?new fb.OAuthProvider("microsoft.com"):new fb.GoogleAuthProvider(); p.setCustomParameters({prompt:"select_account"}); return p; }
async function entrar(nome,vincular){
  loginErro=""; const p=provedor(nome), u=fb.auth.currentUser, ligar=!!u&&(vincular||u.isAnonymous);
  iniciaAppCheck();
  try{ const r=ligar?await fb.linkWithPopup(u,p):await fb.signInWithPopup(fb.auth,p); await aposLogin(r); }
  catch(e){ const c=e.code||"";
    if(c.includes("popup-blocked")||c.includes("operation-not-supported")){ if(ligar) await fb.linkWithRedirect(u,p); else await fb.signInWithRedirect(fb.auth,p); return; }
    if(c.includes("account-exists-with-different-credential")){ const em=(e.customData&&e.customData.email)||"este e-mail"; credPendente={c:(nome==="microsoft"?fb.OAuthProvider:fb.GoogleAuthProvider).credentialFromError(e),email:em==="este e-mail"?"":em,em:Date.now()};
      loginErro="Você já tem conta no Monetra com "+em+". Entre do jeito que usou antes (Google, senha ou link por e-mail): a "+(nome==="microsoft"?"Microsoft":"conta Google")+" é vinculada em seguida, sem criar outra conta."; ui.lgEmail=em==="este e-mail"?ui.lgEmail:em; render(); return; }
    loginErro=traduzErro(e); if(ligar&&loginErro) toast(loginErro); render(); }
}
async function aposLogin(r){
  // só vincula a credencial pendente à conta do mesmo e-mail, e por no máximo 10 minutos
  const pend=credPendente; credPendente=null;
  const mesmoEmail=!!(pend&&pend.c&&pend.email&&r&&r.user&&r.user.email&&pend.email.toLowerCase()===r.user.email.toLowerCase()&&Date.now()-pend.em<10*60000);
  if(mesmoEmail){ const c=pend.c; try{ await fb.linkWithCredential(r.user,c); toast("Pronto: agora você também entra com "+(NOMES_PROV[c.providerId]||c.providerId)+"."); }catch(e){ console.warn("vincular",e&&e.code); } }
  ui.lgAviso=""; if(fb.auth.currentUser) authUser=fb.auth.currentUser;
  boasVindas(r); if(ui.sheet&&ui.sheet.tipo==="vincular") closeSheet(); render();
}
function boasVindas(r){
  try{ const info=fb.getAdditionalUserInfo(r); const nome=((r.user&&r.user.displayName)||"").split(" ")[0];
    if(r.operationType==="link"){ toast("Conta criada! Seus lançamentos continuam aqui."); return; }
    if(r.user&&r.user.isAnonymous){ toast("Modo teste: crie sua conta quando quiser, sem perder nada."); return; }
    toast(info&&info.isNewUser?"Conta criada! Bem-vindo(a)"+(nome?", "+nome:"")+".":"Bem-vindo(a) de volta"+(nome?", "+nome:"")+"."); }catch(e){}
}
function erroLogin(msg,campo){ loginErro=msg; render(); const c=document.getElementById(campo); if(c) c.focus(); }
async function entrarEmail(){
  const email=campoTexto("lg-email").trim(), senha=campoTexto("lg-senha"), novo=ui.loginModo==="criar"; ui.lgEmail=email; ui.lgAviso="";
  if(!emailOk(email)) return erroLogin("Digite um e-mail válido.","lg-email");
  if(!senha) return erroLogin("Digite a senha.","lg-senha");
  if(novo&&!senhaBoa(senha)) return erroLogin("A senha precisa de pelo menos 8 caracteres, com letras e números.","lg-senha");
  if(novo&&senhaObvia(senha,email)) return erroLogin("Essa senha é fácil de adivinhar. Evite sequências, palavras como “senha” e o seu e-mail.","lg-senha");
  loginErro=""; await iniciaAppCheck();
  try{ const u=fb.auth.currentUser;
    const r=novo&&u&&u.isAnonymous?await fb.linkWithCredential(u,fb.EmailAuthProvider.credential(email,senha)):novo?await fb.createUserWithEmailAndPassword(fb.auth,email,senha):await fb.signInWithEmailAndPassword(fb.auth,email,senha);
    if(novo) fb.sendEmailVerification(r.user,{url:urlRetorno()}).catch(()=>{});
    await aposLogin(r); }
  catch(e){ if(novo&&String(e.code||"").includes("email-already-in-use")) credPendente={c:fb.EmailAuthProvider.credential(email,senha),email,em:Date.now()}; erroLogin(traduzErro(e),"lg-senha"); }
}
async function enviarLink(){
  const email=campoTexto("lg-email").trim(); ui.lgEmail=email;
  if(!emailOk(email)) return erroLogin("Digite seu e-mail acima para receber o link.","lg-email");
  loginErro=""; await iniciaAppCheck();
  try{ await fb.sendSignInLinkToEmail(fb.auth,email,{url:urlRetorno(),handleCodeInApp:true}); try{ localStorage.setItem(LINK_KEY,email); }catch(e){}
    ui.lgAviso="Enviamos um link para "+email+". Abra o e-mail neste aparelho e toque no link para entrar. Se não chegar, confira o spam."; render(); anunciar(ui.lgAviso); }
  catch(e){ erroLogin(traduzErro(e),"lg-email"); }
}
async function esqueciSenha(){
  const email=campoTexto("lg-email").trim(); ui.lgEmail=email;
  if(!emailOk(email)) return erroLogin("Digite seu e-mail acima para receber o link de nova senha.","lg-email");
  loginErro=""; await iniciaAppCheck();
  try{ await fb.sendPasswordResetEmail(fb.auth,email,{url:urlRetorno()}); }
  catch(e){ if(!String(e.code||"").includes("user-not-found")) return erroLogin(traduzErro(e),"lg-email"); }
  ui.lgAviso="Se houver uma conta com "+email+", enviamos um link para criar uma nova senha. Confira também o spam."; render(); anunciar(ui.lgAviso);
}
async function testarSemConta(){ loginErro=""; await iniciaAppCheck(); try{ const r=await fb.signInAnonymously(fb.auth); boasVindas(r); }catch(e){ loginErro=traduzErro(e); render(); } }
async function concluiLink(href,email){
  if(!email){ try{ email=localStorage.getItem(LINK_KEY)||""; }catch(e){} }
  if(!email){ ui.linkHref=href; render(); return; }
  await iniciaAppCheck(); ui.linkHref="";
  try{ history.replaceState(history.state,"",urlRetorno()); }catch(e){}
  try{ const u=fb.auth.currentUser, r=u&&u.isAnonymous?await fb.linkWithCredential(u,fb.EmailAuthProvider.credentialWithLink(email,href)):await fb.signInWithEmailLink(fb.auth,email,href);
    try{ localStorage.removeItem(LINK_KEY); }catch(e){} await aposLogin(r); }
  catch(e){ loginErro=traduzErro(e); render(); }
}
async function salvaSenhaConta(){
  const u=fb.auth.currentUser; if(!u) return;
  const email=(u.isAnonymous?campoTexto("s-lgemail"):(u.email||campoTexto("s-lgemail"))).trim(), senha=campoTexto("s-lgsenha");
  if(!emailOk(email)) return erroSheet("Digite um e-mail válido.","s-lgemail");
  if(!senhaBoa(senha)) return erroSheet("A senha precisa de pelo menos 8 caracteres, com letras e números.","s-lgsenha");
  if(senhaObvia(senha,email)) return erroSheet("Essa senha é fácil de adivinhar. Evite sequências, palavras como “senha” e o seu e-mail.","s-lgsenha");
  await iniciaAppCheck();
  try{ const r=await fb.linkWithCredential(u,fb.EmailAuthProvider.credential(email,senha)); if(!r.user.emailVerified) fb.sendEmailVerification(r.user,{url:urlRetorno()}).catch(()=>{}); await aposLogin(r); toast(u.isAnonymous?"Conta criada! Enviamos um link para confirmar o e-mail.":"Senha criada: agora você também entra com e-mail e senha."); }
  catch(e){ erroSheet(traduzErro(e)||"Não deu certo. Tente de novo.","s-lgsenha"); }
}
function avisoConta(){
  if(mode!=="cloud"||!authUser) return "";
  if(authUser.isAnonymous) return `<div class="note info">Você está testando sem conta. <button class="link" type="button" data-novo="vincular">Crie sua conta</button> para guardar seus lançamentos e usar em outros aparelhos.</div>`;
  if(temProv("password")&&!authUser.emailVerified) return `<div class="note info">Confirme seu e-mail: enviamos um link para ${esc(authUser.email||"")}. <button class="link" type="button" data-reenviar="1">Reenviar</button></div>`;
  return "";
}

