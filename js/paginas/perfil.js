// @ts-check
// Aba Perfil.
"use strict";
function viewPerfil(){
  const cf=state.config, u=authUser, ini=inicioKey();
  const criado=u&&u.metadata&&u.metadata.creationTime?new Date(u.metadata.creationTime).toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"}):"";
  const nLanc=Object.values(state.months).reduce((a,m)=>a+(m.gastos?m.gastos.length:0)+(m.avulsos?m.avulsos.length:0)+(m.caixinha?m.caixinha.length:0),0);
  const rendas=cf.rendas.filter(r=>!r.ate||r.ate>=todayKey);
  return `<button type="button" class="ajlink" data-tab="ajustes"><span class="aji">${icq("engrenagem",20)}</span><span><b>Ajustes</b><small>Contas fixas, categorias, cartões, ferramentas e mais</small></span><span class="chev">${icq("chev",18)}</span></button>
  <div class="perfilhead card">${avatar(72)}<div class="pinfo"><h2>${esc(u?(u.isAnonymous?"Modo teste":(u.displayName||"Sua conta")):"Modo local")}</h2>
    <p class="muted">${u?(u.isAnonymous?"Sem conta: crie a sua para não perder os lançamentos.":esc(u.email||"")):"Sem login: os dados ficam só neste aparelho."}</p>
    ${u?`<p class="small muted">${u.isAnonymous?`<button class="link" type="button" data-novo="vincular">Criar minha conta</button>`:`Entra com ${esc(((u.providerData||[]).map(p=>NOMES_PROV[p.providerId]||p.providerId)).join(", "))} · <button class="link" type="button" data-novo="vincular">Formas de entrar</button>`}</p>${temProv("google.com")?`<p class="small muted">Dica: ative a <a href="https://myaccount.google.com/signinoptions/twosv" target="_blank" rel="noopener">verificação em 2 etapas da sua conta Google</a>. Ela também protege o seu Monetra.</p>`:""}`:""}
    <p class="small muted">${criado?"Conta criada em "+esc(criado)+" · ":""}${ini?"controle desde "+esc(nomeMes(ini).toLowerCase()):"controle ainda não começou"} · ${nLanc} lançamento${nLanc===1?"":"s"}</p></div>
    ${u?`<button class="btn ghost" type="button" data-logout="1">Sair da conta</button>`:""}</div>
    ${cardCompartilhado()}
  <div class="grid"><div class="col"><div class="card"><h2>Renda e saldos</h2>
    <label class="f money">Salário / renda fixa padrão (todo mês)<input class="in num" id="cfSal" inputmode="numeric" value="${esc(moneyInput(cf.salarioPadrao))}" placeholder="0,00"></label>
    <p class="hint">Entra automaticamente a partir do mês em que seu controle começa. Se um mês for diferente, ajuste no Início.</p>
    ${(()=>{ const sd=cfgSal(); return `<div class="row"><label class="f">Quando o salário cai<select class="in" id="cfSalTipo">${[["util","Dia útil do mês"],["fixo","Dia fixo"],["quinz","Quinzenal (duas partes)"]].map(([v,l])=>`<option value="${v}" ${sd.tipo===v?"selected":""}>${l}</option>`).join("")}</select></label>
      <label class="f narrow">${sd.tipo==="util"?"Qual dia útil":sd.tipo==="quinz"?"1ª parte, dia":"Dia"}<input class="in num" id="cfSalDia" type="number" min="1" max="${sd.tipo==="util"?20:31}" inputmode="numeric" value="${sd.dia}"></label>
      ${sd.tipo==="quinz"?`<label class="f narrow">2ª parte, dia<input class="in num" id="cfSalDia2" type="number" min="1" max="31" inputmode="numeric" value="${sd.dia2}"></label>`:""}</div>
    <label class="switch"><input type="checkbox" id="cfSalModo" ${sd.off?"":"checked"}><span></span>Tela “Aguardando salário” no Início</label>
    <p class="hint">Até o salário cair, o Início mostra só o que pagar no mês. No dia previsto${sd.tipo==="util"?" ("+sd.dia+"º dia útil, sem contar fins de semana e feriados nacionais)":""}, o sininho pergunta se ele caiu.</p>`; })()}
    <div class="f"><span>Outras rendas que se repetem todo mês</span>
    ${rendas.length?`<div>${rendas.map(r=>`<button type="button" class="item" data-edit="renda" data-id="${esc(r.id)}" style="--dot:var(--good)"><span class="pill">dia ${pad2(r.dia||1)}</span><span class="desc"><b>${esc(r.nome)}</b>${r.desde>todayKey?`<small>começa em ${esc(abrMes(r.desde))}</small>`:""}</span><span class="v pos">${brl(r.valor)}</span></button>`).join("")}</div>`:`<p class="hint">Ex.: bolsa, pensão, aluguel que você recebe.</p>`}
    <button class="btn ghost" type="button" data-novo="renda">+ Renda fixa</button></div>
    <label class="f">Começar a contar em<select class="in" id="cfInicio"><option value="">Automático${ini&&!cf.inicio?" ("+esc(nomeMes(ini))+")":" (primeiro mês com renda)"}</option>${MESES.map(k=>`<option value="${k}" ${k===cf.inicio?"selected":""}>${esc(nomeMes(k))}</option>`).join("")}</select></label>
    <p class="hint">Antes desse mês, salário padrão, rendas e contas fixas não entram nas contas.</p>
    ${temContas()?`<p class="hint">Saldo inicial: <b>${brl(saldoInicialTotal())}</b>, somando as contas. Para mudar, edite cada conta em <b>Ajustes → Contas</b>.</p>`:`<label class="f money">Saldo inicial (o que você já tinha em conta)<input class="in num" id="cfSaldo" inputmode="numeric" data-neg="1" value="${esc(cf.saldoInicial<0?"-"+moneyInput(-cf.saldoInicial):moneyInput(cf.saldoInicial))}" placeholder="0,00"></label>`}
    <label class="f money">Saldo inicial da caixinha<input class="in num" id="cfCx" inputmode="numeric" value="${esc(moneyInput(cf.saldoCaixinha))}" placeholder="0,00"></label></div></div>
  <div class="col"><div class="card"><h2>Aparência</h2>
    <div class="seg" role="radiogroup" aria-label="Tema">${[["auto","Automático"],["claro","Claro"],["escuro","Escuro"]].map(([v,l])=>`<input type="radio" name="ptema" id="pt-${v}" value="${v}" ${tema===v?"checked":""}><label for="pt-${v}">${l}</label>`).join("")}</div>
    <p class="hint">Automático segue o tema do seu celular ou computador.</p></div>
    ${cardA11y()}
    ${cardPin()}
    <div class="card" id="lembretes"><h2>Lembretes</h2>
    <p class="hint">Avisa um dia antes do vencimento, no dia e, se não marcar como paga, no dia seguinte (atraso). Vale para contas fixas, parcelas e fatura do cartão.</p>
    <label class="switch"><input type="checkbox" id="notifOn" ${notifOn&&("Notification" in window)&&Notification.permission==="granted"?"checked":""}><span></span>Notificações neste aparelho</label>
    <p class="hint">${!("Notification" in window)?"Este navegador não permite notificações. Use o calendário abaixo.":Notification.permission==="denied"?"As notificações estão bloqueadas. Libere em: ícone ao lado do endereço → Configurações do site → Notificações → Permitir.":"Chegam enquanto o app estiver aberto ou em segundo plano. No celular, instale o app na tela inicial para funcionar melhor."}</p>
    <button class="btn ghost" type="button" data-calendario="1">Adicionar lembretes ao calendário</button>
    <p class="hint">Para avisar mesmo com o app fechado: baixa um arquivo com os vencimentos dos próximos 12 meses. No celular, abra o arquivo e escolha o Google Agenda (ou Calendário, no iPhone). No computador: Google Agenda → Configurações → Importar. Se cadastrar contas novas, baixe de novo.</p></div>
    <div class="card"><h2>Exportar e backup</h2><p class="hint">A planilha abre no Excel e no Google Planilhas. O backup serve para restaurar tudo depois.</p>
    <button class="btn ghost" type="button" data-planilha="1">Baixar planilha (Excel)</button>
    <div class="row"><button class="btn ghost" type="button" data-export="1">Baixar backup</button><button class="btn ghost" type="button" data-novo="bksenha">Baixar backup com senha</button><label class="btn ghost" for="impFile" style="text-align:center">Restaurar backup<input type="file" id="impFile" accept="application/json,.json" hidden></label></div>
    ${ui.importMsg?`<p class="hint">${esc(ui.importMsg)}</p>`:""}
    <p class="hint bkinfo">${(()=>{ const bk=infoBackup(); return bk.ultimo?"Último backup baixado neste aparelho: "+fmtIso(bk.ultimo)+"/"+bk.ultimo.slice(0,4)+(entreDias(bk.ultimo,hojeISO())>=30?" · já faz mais de um mês":""):"Você ainda não baixou um backup neste aparelho. O app lembra uma vez por mês."; })()}</p></div>
    <div class="card"><div class="cardhead"><h2>Novidades</h2><span class="versao">versão ${VERSAO}</span></div>
    <ul class="novidades">${NOVIDADES.map(n=>`<li>${esc(n)}</li>`).join("")}</ul>
    <p class="hint">O histórico completo fica no arquivo CHANGELOG.md do projeto.</p></div>
    <div class="card" id="ajuda"><h2>Tutorial</h2><p class="hint">Reveja em 1 minuto como usar o app: salário, lançamentos, contas fixas, cartões, caixinha, avisos e muito mais.</p>
    <button class="btn ghost" type="button" data-tutorial="1">Ver o tutorial</button></div>
    <div class="card"><h2>Privacidade</h2><p class="hint">Só você vê seus lançamentos. Eles ficam guardados na sua conta e protegidos por regras que impedem qualquer outra pessoa de ler ou alterar.</p>
    ${meusTermos()?`<p class="hint">Você aceitou os termos de privacidade (versão ${esc(meusTermos().v)})${meusTermos().em?" em "+esc(dataBR(meusTermos().em)):""}.</p>`:""}
    <div class="row2"><button class="btn ghost" type="button" data-termos="ler">Ler os termos</button><button class="btn ghost" type="button" data-termos="revogar">Retirar meu aceite</button></div></div>
    ${souDono()?`    <div class="card perigo"><h2>Recomeçar do zero</h2><p class="hint">Apaga todos os seus lançamentos, contas fixas, parcelas e configurações. Não dá para desfazer; se quiser, baixe um backup antes.</p>
    ${ui.confirmaApagar?`<label class="f">Para confirmar, digite APAGAR<input class="in" id="txtApagar" autocomplete="off" placeholder="APAGAR"></label><div class="row2"><button class="btn ghost" type="button" data-apagar="nao">Cancelar</button><button class="btn danger" type="button" data-apagar="sim">Apagar tudo</button></div>`:`<button class="btn danger" type="button" data-apagar="pedir">Apagar todos os meus dados</button>`}</div>`:""}
    ${mode==="cloud"&&authUser?`<div class="card perigo" id="excluirconta"><h2>Excluir minha conta</h2><p class="hint">Apaga para sempre os seus dados no Monetra e a sua conta de login. Controles compartilhados que você criou também são excluídos. Não dá para desfazer.</p>
      <button class="btn danger" type="button" data-novo="excluirconta">Excluir minha conta…</button></div>`:""}</div></div>`;
}

