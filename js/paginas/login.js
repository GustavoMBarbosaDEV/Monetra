// @ts-check
// Tela de login.
"use strict";
function viewLogin(){
  const novo=ui.loginModo==="criar", erro=loginErro?`<p class="note" role="alert">${esc(loginErro)}</p>`:"";
  const marca=`<div class="loginmarca"><img src="icons/logo-128.png" alt="" width="56" height="56"><span><b>Monetra</b><small>Controle financeiro</small></span></div>`;
  const links=`<p class="hint lgpe"><a href="privacidade">Política de privacidade</a> · <a href="termos">Termos de uso</a> · <a href="faq">Ajuda</a></p>`;
  if(ui.linkHref) return `<div class="login card">${marca}<h2>Confirme seu e-mail</h2><p>Você abriu o link em outro aparelho ou navegador. Digite o e-mail para onde o link foi enviado.</p>
    <form class="lgform" data-lgform="link" novalidate><label class="f">E-mail<input class="in" id="lg-email" type="email" inputmode="email" autocomplete="email" required value="${esc(ui.lgEmail||"")}"></label><button class="btn wide" type="submit">Entrar</button></form>${erro}${links}</div>`;
  return `<div class="login card">
  ${marca}
  <div class="seg" role="radiogroup" aria-label="Entrar ou criar conta" style="width:100%"><input type="radio" name="lmodo" id="lmE" value="entrar" ${novo?"":"checked"}><label for="lmE">Entrar</label><input type="radio" name="lmodo" id="lmC" value="criar" ${novo?"checked":""}><label for="lmC">Criar conta</label></div>
  <h2>${novo?"Crie sua conta grátis":"Seu controle de gastos, só seu"}</h2>
  <p>${novo?"Escolha como quer entrar. Sua página começa vazia e só você vê os seus lançamentos.":"Entre do mesmo jeito que você usou para criar a conta."}</p>
  ${/FBAN|FBAV|FB_IAB|Instagram|Line\/|LinkedInApp|TikTok|musical_ly|Snapchat|Twitter/i.test(navigator.userAgent)?`<div class="note">Você abriu o link dentro de outro app (Instagram, Facebook…), e o Google não permite entrar por aqui. Toque nos <b>três pontinhos</b> e escolha <b>Abrir no navegador</b> (Chrome ou Safari).<br><button class="link" type="button" data-copialink="1">Copiar link</button></div>`:""}
  <div class="lgprov"><button class="btn google" data-login="google" type="button"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Continuar com Google</button></div>
  <div class="lgsep"><span>ou com e-mail</span></div>
  <form class="lgform" data-lgform="email" novalidate>
    <label class="f">E-mail<input class="in" id="lg-email" type="email" inputmode="email" autocomplete="email" required value="${esc(ui.lgEmail||"")}"></label>
    <label class="f">Senha<input class="in" id="lg-senha" type="password" autocomplete="${novo?"new-password":"current-password"}" required ${novo?'minlength="8" aria-describedby="lg-regra"':""}></label>
    ${novo?`<p class="hint" id="lg-regra">Mínimo de 8 caracteres, com letras e números. Enviamos um link para confirmar o e-mail.</p>`:""}
    <button class="btn wide" type="submit">${novo?"Criar conta com e-mail":"Entrar com e-mail"}</button>
  </form>
  <div class="lglinks">${novo?"":`<button class="link" type="button" data-lg="senha">Esqueci a senha</button>`}<button class="link" type="button" data-lg="link">Entrar sem senha, por link no e-mail</button></div>
  ${ui.lgAviso?`<p class="note info" role="status">${esc(ui.lgAviso)}</p>`:""}
  ${erro}
  <div class="lgsep"><span>ou</span></div>
  <button class="btn ghost wide" type="button" data-lg="anon">Testar sem criar conta</button>
  <p class="hint">No teste, os lançamentos ficam guardados e você cria a conta depois, sem perder nada.</p>
  <p class="hint">Ao entrar, você vai ler e decidir se aceita os <button class="link" type="button" data-termos="ler">termos de privacidade</button>.</p>
  ${links}</div>`;
}

