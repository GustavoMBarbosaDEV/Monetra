// @ts-check
// Termos de uso, privacidade e contato.
"use strict";
const TERMOS_V="1.2", TERMOS_DATA="05/11/2026", CONTATO="https://github.com/GustavoMBarbosaDEV";
const CONTATO_EMAIL="monetra.app26@gmail.com", CONTATO_WHATS="";
/** @typedef {{nome:string,cidade?:string,texto:string,foto?:string}} Depoimento */
/** @type {Depoimento[]} */
const CASES=[];
/** @type {Depoimento[]} */
const AVALIACOES=[];
const FAQ=[
  ["O Monetra é grátis?","Sim. O Monetra é grátis, sem anúncios e sem plano pago. Você usa todas as funções sem pagar nada."],
  ["Meus dados estão seguros?","Você entra com a sua conta e só ela lê e altera os seus lançamentos: regras no servidor do Google Firebase bloqueiam qualquer outra pessoa. O app nunca pede senha de banco nem número de cartão, e você pode ativar bloqueio com PIN ou digital. Seus dados não são vendidos nem usados para publicidade."],
  ["Funciona no iPhone?","Funciona. Abra monetraapp.web.app no Safari, toque em Compartilhar e depois em Adicionar à Tela de Início. O Monetra abre pelo ícone como um aplicativo. Não há versão na App Store."],
  ["Como instalo o APK no Android?","Toque em Baixar para Android e abra o arquivo Monetra.apk quando o download terminar. Se o celular pedir, permita instalar apps desta fonte (o navegador ou o gerenciador de arquivos) e toque em Instalar. Se preferir, abra o site no Chrome e use o menu ⋮ → Instalar app. As atualizações chegam sozinhas."],
  ["Como funciona o “Meu salário caiu”?","Até o salário cair, o Início mostra só o que você tem para pagar no mês, com as contas vencidas e as próximas em destaque. Quando o dinheiro entrar, toque em Meu salário caiu e confirme o valor: o app passa a mostrar o saldo em conta e o saldo livre, que é o que sobra depois das contas do mês. Dá para receber em duas partes, e o dia esperado se ajusta em Ajustes."]
];
const linkContato=txt=>CONTATO_WHATS?"https://wa.me/"+CONTATO_WHATS+"?text="+encodeURIComponent(txt):CONTATO_EMAIL?"mailto:"+CONTATO_EMAIL+"?subject="+encodeURIComponent("Monetra")+"&body="+encodeURIComponent(txt):"";
const meusTermos=()=>mode==="cloud"?eu.termos:state.config.termos;
const precisaTermos=()=>{ const t=meusTermos(); return mode!=="login"&&state.loaded&&!(t&&t.v===TERMOS_V); };
const dataBR=iso=>{ const d=new Date(iso); return isNaN(d.getTime())?"":d.toLocaleDateString("pt-BR"); };
function textoTermos(){
  return `<h3>1. O que é o Monetra</h3>
  <p>O Monetra é um aplicativo gratuito de controle de gastos pessoais, criado por Gustavo M. Barbosa. Ele serve para você anotar e acompanhar o seu próprio dinheiro. Não é banco, não movimenta dinheiro e não pede senha de banco.</p>
  <h3>2. Quais dados o app guarda</h3>
  <ul><li><b>Da forma de login que você escolher</b> (Google, e-mail e senha ou link por e-mail): nome, e-mail e foto, quando existirem, e um código de identificação, usados só para fazer o login e mostrar seu perfil. A senha é guardada de forma protegida pelo Google Firebase; o Monetra não tem acesso a ela. No modo teste, sem conta, só o código de identificação é criado.</li>
  <li><b>O que você digita:</b> salário, receitas, despesas, categorias, contas, cartões (só nome, datas e limite, nunca o número do cartão), parcelas, metas e lembretes.</li>
  <li><b>Extratos importados:</b> o arquivo é lido dentro do seu aparelho. Só os lançamentos que você escolher importar são salvos; o arquivo em si não é enviado.</li>
  <li><b>No seu aparelho:</b> preferências como tema, lembretes já avisados e uma cópia para funcionar sem internet.</li></ul>
  <h3>3. Para que os dados são usados</h3>
  <p>Somente para mostrar o seu controle financeiro a você, em qualquer aparelho em que você entrar. Os dados <b>não são vendidos, não são usados para publicidade e não são compartilhados</b> com ninguém, a não ser com as pessoas de um controle compartilhado do qual você decidir participar (item 5).</p>
  <h3>4. Onde os dados ficam</h3>
  <p>Na sua conta, nos servidores do Google Firebase (login e banco de dados), protegidos por regras que só deixam a sua própria conta ler e alterar os seus dados. O site é hospedado no Firebase Hosting, que registra dados técnicos de acesso (como endereço IP) por segurança, e o login usa o reCAPTCHA do Google para bloquear robôs. Se você aceitar os cookies de análise, o Google Analytics conta as visitas ao site, sem os seus lançamentos. O Google segue a própria política de privacidade.</p>
  <h3>5. Controles compartilhados</h3>
  <ul><li>Só existem se você quiser. Um controle compartilhado é <b>separado do seu controle Pessoal</b>: quem participa não vê nada do Pessoal.</li>
  <li>Dentro de um controle compartilhado, todas as pessoas aceitas veem e alteram os lançamentos daquele controle e veem o nome, o e-mail e a foto umas das outras. O app mostra quem fez cada lançamento.</li>
  <li>Quem cria o controle aceita ou recusa os pedidos, pode remover pessoas e excluir o controle. Quem participa pode sair a qualquer momento.</li></ul>
  <h3>6. Seus direitos (LGPD — Lei 13.709/2018)</h3>
  <ul><li><b>Ver e levar seus dados:</b> Perfil → baixar backup ou planilha para Excel.</li>
  <li><b>Corrigir:</b> edite qualquer lançamento a qualquer momento.</li>
  <li><b>Apagar:</b> Perfil → Recomeçar do zero apaga todos os seus lançamentos e configurações (num controle compartilhado, só quem o criou).</li>
  <li><b>Retirar o aceite:</b> Perfil → Privacidade → Retirar meu aceite. Sem o aceite, o app não pode ser usado.</li>
  <li><b>Excluir a conta por completo</b> ou tirar dúvidas: fale com o responsável pelo contato abaixo.</li></ul>
  <h3>7. Notificações</h3>
  <p>Os avisos de contas a vencer só são enviados se você permitir no aparelho, e podem ser desligados no Perfil ou nas configurações do celular.</p>
  <h3>8. Responsabilidade</h3>
  <p>O app é oferecido de graça, como está. Os valores e saldos são calculados a partir do que você lança e servem para organização pessoal; não são consultoria financeira. Guarde backups dos dados importantes.</p>
  <h3>9. Mudanças nestes termos</h3>
  <p>Se os termos mudarem, o app mostra a nova versão e pede o seu aceite de novo antes de continuar.</p>
  <h3>10. Contato</h3>
  <p>E-mail: <a href="mailto:${CONTATO_EMAIL}">${CONTATO_EMAIL}</a> (respondemos em até 24h, em dias úteis) · <a href="${CONTATO}" target="_blank" rel="noopener">${CONTATO.replace(/^https?:\/\//,"")}</a></p>`;
}
function viewTermos(pedir){
  const recusou=ui.recusouTermos&&pedir;
  return `<div class="card termos">
  <h2>Termos de privacidade</h2><p class="hint">Versão ${TERMOS_V} · ${TERMOS_DATA}</p>
  ${pedir?`<p>${meusTermos()?"Os termos mudaram. ":""}Antes de usar o Monetra, leia como seus dados são tratados e escolha se aceita.</p>`:""}
  <div class="termostexto">${textoTermos()}</div>
  ${recusou?`<p class="note">Sem aceitar os termos não é possível usar o app neste aparelho. Seus dados não foram alterados.</p>`:""}
  ${pedir?`<label class="checkline"><input type="checkbox" id="t-li"> Li e entendi os termos de privacidade</label>
  <div class="row2"><button class="btn ghost" type="button" data-termos="recusar">Não aceito</button><button class="btn" type="button" data-termos="aceitar" id="t-aceitar" disabled>Aceito</button></div>`
  :`<button class="btn wide" type="button" data-termos="fechar">Voltar</button>`}</div>`;
}
function acaoTermos(a){
  if(a==="ler"){ ui.lerTermos=true; render(); window.scrollTo({top:0}); return; }
  if(a==="fechar"){ ui.lerTermos=false; render(); window.scrollTo({top:0}); return; }
  if(a==="aceitar"){ const t={v:TERMOS_V,em:new Date().toISOString()}, primeira=mode==="cloud"&&!meusTermos(); if(primeira&&window.mbEvento){ window.mbEvento("sign_up",{method:"google"}); window.mbEvento("conversao",{tipo:"cadastro"}); } if(mode==="cloud") salvaEu({termos:t}); else { state.config.termos=t; save("config"); } ui.recusouTermos=false; ui.lerTermos=false; render(); toast("Termos aceitos. Bom controle!"); return; }
  if(a==="recusar"){
    if(mode==="cloud"&&fb){ encerraSessao("Para usar o Monetra é preciso aceitar os termos de privacidade. Seus dados não foram alterados."); return; }
    ui.recusouTermos=true; render(); return;
  }
  if(a==="revogar"){ if(!confirmaRevogar()) return; if(mode==="cloud") salvaEu({termos:null}); else { state.config.termos=null; save("config"); } ui.lerTermos=false; render(); window.scrollTo({top:0}); }
}
function confirmaRevogar(){ ui.revogarCont=(ui.revogarCont||0)+1; if(ui.revogarCont<2){ toast("Toque de novo em “Retirar meu aceite” para confirmar."); setTimeout(()=>{ ui.revogarCont=0; },5000); return false; } ui.revogarCont=0; return true; }

