// @ts-check
// Firebase: login salvo, App Check, Firestore, exclusão de conta e espaço aberto.
"use strict";
let fb=null, authUser=null, unsub=null, loginErro=(()=>{ try{ const m=sessionStorage.getItem("mb.loginErro")||""; sessionStorage.removeItem("mb.loginErro"); return m; }catch(e){ return ""; } })();
if(loginErro){ const m=loginErro; setTimeout(()=>{ toast(m); anunciar(m); },1200); }
const CHAVES_DA_PESSOA=["mb.backup.","mb.conq.","mb.notif.vistos","mb.pin","mb.pin.erros"];
function limpaDadosDaPessoa(){
  try{ Object.keys(localStorage).filter(k=>CHAVES_DA_PESSOA.some(p=>k===p||(p.endsWith(".")&&k.startsWith(p)))).forEach(k=>localStorage.removeItem(k)); }catch(e){}
  try{ const idb=/** @type {any} */(indexedDB); if(idb&&idb.databases) idb.databases().then(ls=>ls.forEach(d=>{ if(d.name&&/^firestore\//.test(d.name)) indexedDB.deleteDatabase(d.name); })).catch(()=>{}); }catch(e){}
}
async function excluirConta(){
  const F=fb, user=F&&F.auth.currentUser, meu=uid; if(!user||!meu) throw new Error("Entre na sua conta para excluí-la.");
  const ultimo=Date.parse((user.metadata&&user.metadata.lastSignInTime)||"")||0;
  if(!user.isAnonymous&&Date.now()-ultimo>4*60*1000){ const pid=((user.providerData||[]).find(p=>p.providerId==="google.com"||p.providerId==="microsoft.com")||{}).providerId;
    if(!pid) throw new Error("Por segurança, saia, entre de novo (com senha ou link por e-mail) e exclua a conta logo em seguida. Nada foi apagado.");
    const quem=pid==="google.com"?"O Google":"A Microsoft";
    try{ await F.reauthenticateWithPopup(user,provedor(pid==="google.com"?"google":"microsoft")); }
    catch(e){ throw new Error(String(e&&e.code||"").includes("popup")?quem+" precisa confirmar que é você. Permita a janela e tente de novo.":quem+" não confirmou o login. Nada foi apagado."); } }
  seqEspaco++; pararEspaco(); zeraFila(); setStatus("Excluindo sua conta…","saving");
  for(const g of meusGrupos()){
    try{
      const d=await F.getDoc(F.doc(F.db,"grupos",g.id)); if(!d.exists()) continue;
      if(d.data().dono===meu){ const cod=d.data().codigo||null; if(cod) await F.deleteDoc(F.doc(F.db,"convites",cod)).catch(()=>{});
        for(const sub of ["docs","pedidos"]){ const q=await F.getDocs(F.collection(F.db,"grupos",g.id,sub)); await Promise.all(q.docs.map(x=>F.deleteDoc(x.ref))); }
        await F.deleteDoc(F.doc(F.db,"grupos",g.id)); }
      else await F.updateDoc(F.doc(F.db,"grupos",g.id),{["m."+meu]:F.deleteField()});
    }catch(e){ if(!negado(e)&&!(e&&e.code==="not-found")) throw e; } }
  for(const g of Object.keys(eu.pendentes||{})){
    await F.deleteDoc(F.doc(F.db,"grupos",g,"pedidos",meu)).catch(()=>{});
    if(!(eu.grupos||{})[g]) await F.updateDoc(F.doc(F.db,"grupos",g),{["m."+meu]:F.deleteField()}).catch(()=>{});
  }
  const q=await F.getDocs(F.collection(F.db,"users",meu,"docs")); await Promise.all(q.docs.map(x=>F.deleteDoc(x.ref)));
  await F.deleteDoc(F.doc(F.db,"users",meu,"meta","eu"));
  try{ Object.keys(localStorage).filter(k=>k.startsWith("mb.pend."+meu+".")).forEach(k=>localStorage.removeItem(k)); }catch(e){}
  await F.deleteUser(user);
  try{ sessionStorage.setItem("mb.loginErro","Sua conta e os seus dados foram excluídos do Monetra."); }catch(e){}
  try{ await F.terminate(F.db); await F.clearIndexedDbPersistence(F.db); }catch(e){}
  limpaDadosDaPessoa();
  setTimeout(()=>location.reload(),150);
}
async function encerraSessao(msg){
  if(msg){ try{ sessionStorage.setItem("mb.loginErro",msg); }catch(e){} }
  try{ await salvaPendentes(); }catch(e){}
  try{ await fb.signOut(fb.auth); }catch(e){}
  try{ await fb.terminate(fb.db); await fb.clearIndexedDbPersistence(fb.db); }catch(e){}
  limpaDadosDaPessoa();
  setTimeout(()=>location.reload(),150);
}
let aberto="pessoal", eu={}, euCarregado=false, grupoDoc=null, pedidosG={}, unsubs=[], unsubsFixos=[], seqEspaco=0, perdendo={};
const FB_V="13.2.0", FB_REV="2";
async function init(){
  const cfg=window.FIREBASE_CONFIG;
  if(!cfg||!cfg.apiKey||/COLE|SUA_/i.test(cfg.apiKey)){ mode="local"; loadLocal(); state.loaded=true; setStatus("Modo local (sem login)",""); render(); return; }
  try{
    fbBase=new URL("vendor/firebase-"+FB_V+"/",document.baseURI).href;
    const [A,U]=await Promise.all([import(fbBase+"firebase-app.js?r="+FB_REV),import(fbBase+"firebase-auth.js?r="+FB_REV)]);
    fbApp=A.initializeApp(cfg);
    const redirecao=redirectPendente(cfg.apiKey);
    const viaLink=/[?&]oobCode=/.test(location.search);
    if(redirecao||viaLink||await sessaoSalva(cfg.apiKey)) await iniciaAppCheck();
    const auth=U.getAuth(fbApp);
    try{ U.useDeviceLanguage(auth); }catch(e){}
    fb={...U,auth};
    if(redirecao) U.getRedirectResult(auth).then(r=>{ if(r) aposLogin(r); }).catch(e=>{ loginErro=traduzErro(e); render(); });
    if(viaLink&&U.isSignInWithEmailLink(auth,location.href)){ const href=location.href; auth.authStateReady().then(()=>concluiLink(href,"")); }
    U.onAuthStateChanged(auth,user=>{
      pararEspaco(); dirty.clear();
      if(!user){ if(travado) destravar(); zeraFila(); unsubsFixos.forEach(f=>{ try{f()}catch(e){} }); unsubsFixos=[]; authUser=null; uid=null; aberto="pessoal"; eu={}; euCarregado=false; grupoDoc=null; pedidosG={}; mode="login"; resetState(); state.loaded=true; closeSheet(); render(); return; }
      authUser=user; uid=user.uid; mode="cloud"; resetState(); state.loaded=false; render();
      Promise.all([iniciaAppCheck(),carregaFirestore()]).then(()=>{ if(authUser===user) abrirEspaco(); })
        .catch(e=>{ console.error(e); setStatus("Sem conexão com o servidor","err"); render(); });
    });
  }catch(e){ console.error(e); mode="local"; loadLocal(); state.loaded=true; setStatus("Sem conexão com o login — modo local","err"); render(); }
}
/** @type {any} */
let fbApp=null;
let fbBase="";
/** @type {Promise<void>|null} */
let appCheckProm=null;
/** @type {Promise<void>|null} */
let firestoreProm=null;
function iniciaAppCheck(){
  if(!fbApp||!window.APPCHECK_SITE_KEY) return Promise.resolve();
  if(/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) /** @type {any} */(self).FIREBASE_APPCHECK_DEBUG_TOKEN=true;
  if(!appCheckProm) appCheckProm=import(fbBase+"firebase-app-check.js?r="+FB_REV).then(C=>{ C.initializeAppCheck(fbApp,{provider:new C.ReCaptchaEnterpriseProvider(window.APPCHECK_SITE_KEY),isTokenAutoRefreshEnabled:true}); }).catch(e=>{ appCheckProm=null; console.warn("App Check não iniciou",e); });
  return appCheckProm;
}
function carregaFirestore(){
  if(!firestoreProm) firestoreProm=import(fbBase+"firebase-firestore.js?r="+FB_REV).then(F=>{ let db; try{ db=F.initializeFirestore(fbApp,{localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()})}); }catch(e){ db=F.getFirestore(fbApp); } Object.assign(fb,F,{db}); }).catch(e=>{ firestoreProm=null; throw e; });
  return firestoreProm;
}
/** @param {string} chave */
function redirectPendente(chave){ try{ return !!sessionStorage.getItem("firebase:pendingRedirect:"+chave+":[DEFAULT]"); }catch(e){ return false; } }
/** @param {string} chave */
async function sessaoSalva(chave){
  const k="firebase:authUser:"+chave+":[DEFAULT]";
  try{ if(localStorage.getItem(k)) return true; }catch(e){}
  try{
    if(!indexedDB.databases) return true;
    const dbs=await indexedDB.databases(); if(!dbs.some(d=>d.name==="firebaseLocalStorageDb")) return false;
    return await new Promise(ok=>{ const req=indexedDB.open("firebaseLocalStorageDb");
      req.onerror=()=>ok(true); req.onblocked=()=>ok(true);
      req.onsuccess=()=>{ const db=req.result; try{ const g=db.transaction("firebaseLocalStorage","readonly").objectStore("firebaseLocalStorage").get(k); g.onsuccess=()=>{ ok(!!g.result); db.close(); }; g.onerror=()=>{ ok(true); db.close(); }; }catch(e){ ok(true); db.close(); } }; });
  }catch(e){ return true; }
}
const docsPath=()=>aberto==="pessoal"?["users",uid,"docs"]:["grupos",aberto,"docs"];
function pararEspaco(){ if(unsub){ unsub(); unsub=null; } unsubs.forEach(f=>{ try{f()}catch(e){} }); unsubs=[]; }
async function salvaEu(obj){ Object.assign(eu,obj); try{ fb.setDoc(fb.doc(fb.db,"users",uid,"meta","eu"),obj,{merge:true}).catch(e=>console.error(e)); }catch(e){ console.error(e); } }
async function euSet(chave,sub,valor){
  let remoto;
  if(sub){ eu[chave]=Object.assign({},eu[chave]||{}); if(valor==null){ delete eu[chave][sub]; remoto={[chave]:{[sub]:fb.deleteField()}}; } else { eu[chave][sub]=valor; remoto={[chave]:{[sub]:valor}}; } }
  else { eu[chave]=valor; remoto={[chave]:valor}; }
  try{ fb.setDoc(fb.doc(fb.db,"users",uid,"meta","eu"),remoto,{merge:true}).catch(e=>console.error(e)); }catch(e){ console.error(e); }
}
const negado=e=>e&&e.code==="permission-denied";
const meusGrupos=()=>Object.entries(eu.grupos||{}).map(([id,x])=>Object.assign({id},x)).sort((a,b)=>String(a.nome).localeCompare(String(b.nome)));
async function abrirEspaco(aviso){
  const F=fb, meu=uid, seq=++seqEspaco;
  closeSheet(); pararEspaco(); zeraFila(); resetState(); state.loaded=false; grupoDoc=null; setStatus("Carregando…",""); render();
  if(!euCarregado){
    try{ const d=await F.getDoc(F.doc(F.db,"users",meu,"meta","eu")); eu=d.exists()?d.data():{}; }catch(e){ eu={}; }
    if(seq!==seqEspaco||uid!==meu) return;
    euCarregado=true; refazVigias();
  }
  aberto=eu.ativo&&eu.grupos&&eu.grupos[eu.ativo]?eu.ativo:"pessoal";
  if(aberto!=="pessoal"){
    let ok;
    try{ const g=await F.getDoc(F.doc(F.db,"grupos",aberto)); ok=!!(g.exists()&&g.data().m&&g.data().m[meu]); if(ok) grupoDoc=g.data(); }
    catch(e){ ok=negado(e)?false:true; }
    if(seq!==seqEspaco) return;
    if(!ok){ const nome=(eu.grupos[aberto]||{}).nome||""; await euSet("grupos",aberto,null); await euSet("ativo",null,"pessoal"); refazVigias(); aberto="pessoal"; aviso="Você não faz mais parte do controle “"+nome+"”. Voltou para o Pessoal."; }
  }
  const g=aberto;
  unsub=F.onSnapshot(F.collection(F.db,...docsPath()),snap=>{
    let changed=!state.loaded;
    docIds.clear(); snap.docs.forEach(doc=>docIds.add(doc.id));
    snap.docs.forEach(doc=>{
      const valido=doc.id==="config"||(doc.id.startsWith("m-")&&mesValido(doc.id.slice(2))); if(!valido) return;
      const d=doc.data();
      /** @type {any} */
      let norm; try{ norm=doc.id==="config"?normConfig(d):normMonth(d); }catch(e){ console.warn("documento ignorado",doc.id,e); return; }
      if(dirty.has(doc.id)) return;
      base[doc.id]=clone(norm);
      if(doc.id==="config"){ if(J(norm)!==J(state.config)){ state.config=norm; buildMeses(); changed=true; } }
      else { const k=doc.id.slice(2); if(J(norm)!==J(state.months[k]||null)){ state.months[k]=norm; changed=true; } }
    });
    if(state.loaded&&typeof snap.docChanges==="function") snap.docChanges().forEach(ch=>{ if(ch.type!=="removed"||dirty.has(ch.doc.id)) return; const id=ch.doc.id; delete base[id];
      if(id==="config"){ state.config=defaultConfig(); buildMeses(); changed=true; } else if(id.startsWith("m-")&&state.months[id.slice(2)]){ delete state.months[id.slice(2)]; changed=true; } });
    if(!state.loaded){ state.loaded=true; if(!mesesVisiveis().includes(ui.month)) ui.month=todayKey;
      const pend=recolhePend(); Object.keys(pend).forEach(id=>{ const pd=pend[id]; if(!pd||!pd.body) return; if(pd.base) base[id]=pd.base; else delete base[id];
        if(id==="config"){ state.config=normConfig(pd.body); buildMeses(); } else if(id.startsWith("m-")&&mesValido(id.slice(2))) state.months[id.slice(2)]=normMonth(pd.body); else return;
        dirty.add(id); changed=true; if(navigator.onLine) setTimeout(()=>flush(id),300); });
    }
    if(!dirty.size) setStatus(snap.metadata.fromCache&&!navigator.onLine?"Sem internet — salvo no aparelho":"Sincronizado","ok");
    if(changed) render();
  },err=>{ console.error(err); if(negado(err)&&g!=="pessoal"){ perdeuGrupo(g); return; } setStatus("Sem acesso aos dados ("+(err.code||"erro")+")","err"); state.loaded=true; render(); });
  if(g!=="pessoal") unsubs.push(F.onSnapshot(F.doc(F.db,"grupos",g),d=>{
    if(!d.exists()&&d.metadata&&d.metadata.fromCache) return;
    grupoDoc=d.exists()?d.data():null;
    if(!(grupoDoc&&grupoDoc.m&&grupoDoc.m[meu])){ perdeuGrupo(g); return; }
    const x=(eu.grupos||{})[g]; if(x&&grupoDoc.nome&&x.nome!==grupoDoc.nome) euSet("grupos",g,Object.assign({},x,{nome:grupoDoc.nome}));
    render();
  },err=>{ if(negado(err)) perdeuGrupo(g); }));
  if(aviso) setTimeout(()=>toast(aviso),300);
}
async function perdeuGrupo(g){
  if(perdendo[g]||!(eu.grupos||{})[g]) return; perdendo[g]=true;
  const nome=((eu.grupos||{})[g]||{}).nome||"compartilhado";
  await euSet("grupos",g,null); if(eu.ativo===g||aberto===g) await euSet("ativo",null,"pessoal"); refazVigias();
  perdendo[g]=false; if(aberto===g) abrirEspaco("Você não faz mais parte do controle “"+nome+"”. Voltou para o Pessoal."); else { render(); toast("Você não faz mais parte do controle “"+nome+"”."); }
}
function refazVigias(){
  unsubsFixos.forEach(f=>{ try{f()}catch(e){} }); unsubsFixos=[]; pedidosG={};
  const F=fb, meu=uid;
  meusGrupos().filter(x=>x.dono).forEach(x=>unsubsFixos.push(F.onSnapshot(F.collection(F.db,"grupos",x.id,"pedidos"),q=>{ pedidosG[x.id]=q.docs.map(d=>Object.assign({uid:d.id},d.data())); render(); },()=>{})));
  meusGrupos().forEach(x=>unsubsFixos.push(F.onSnapshot(F.doc(F.db,"grupos",x.id),d=>{ if(!d.exists()&&d.metadata&&d.metadata.fromCache) return; if(!(d.exists()&&d.data().m&&d.data().m[meu])) perdeuGrupo(x.id); },e=>{ if(negado(e)) perdeuGrupo(x.id); })));
  Object.keys(eu.pendentes||{}).forEach(g=>unsubsFixos.push(F.onSnapshot(F.doc(F.db,"grupos",g,"pedidos",meu),d=>{ if(!d.exists()) resolvePendente(g); },()=>{})));
}
async function resolvePendente(g){
  const p=(eu.pendentes||{})[g]; if(!p) return;
  let ok=false, nome=p.nome||"";
  try{ const d=await fb.getDoc(fb.doc(fb.db,"grupos",g)); ok=!!(d.exists()&&d.data().m&&d.data().m[uid]); if(ok) nome=d.data().nome||nome; }catch(e){ if(!negado(e)) return; }
  if(!(eu.pendentes||{})[g]) return;
  await euSet("pendentes",g,null);
  if(ok){ await euSet("grupos",g,{nome,dono:false}); toast("Pedido aceito! “"+nome+"” já aparece no topo da tela."); }
  else toast("Seu pedido para entrar em “"+nome+"” não foi aceito.");
  refazVigias(); render();
}
