// @ts-check
// Aba Ajustes.
"use strict";
function cardRegras(){
  const cats=state.config.categorias, com=cats.filter(c=>(c.palavras||[]).length);
  return `<div class="card" id="regras"><h2>Regras automáticas</h2>
    <p class="hint">O app já reconhece palavras comuns (mercado, uber, farmácia…). Aqui você ensina as suas: toda despesa com a palavra na descrição entra direto na categoria escolhida. Suas regras vêm antes das automáticas.</p>
    ${com.length?`<div>${com.map(ct=>`<button type="button" class="item catitem" data-edit="categoria" data-id="${esc(ct.id)}" data-foco="regras" style="--dot:${catColor(ct.id)}">${icoCat(ct.id)}<span class="desc"><b>${esc(ct.nome)}</b><small>${esc(ct.palavras.join(", "))}</small></span><span class="v muted">editar</span></button>`).join("")}</div>`:`<p class="hint"><b>Nenhuma regra ainda.</b> Ex.: “petz, ração” em Pets ou “academia” em Saúde.</p>`}
    <label class="f">Nova regra: palavra ou nome da loja<input class="in" id="rg-pal" maxlength="30" placeholder="ex.: petz" autocomplete="off"></label>
    <div class="row"><label class="f">Vai para<select class="in" id="rg-cat">${cats.map(c=>`<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join("")}</select></label><button class="btn" type="button" data-addregra="1" style="align-self:flex-end">Criar regra</button></div></div>`;
}
function viewAjustes(){
  const cf=state.config;
  const ativos=cf.fixos.filter(f=>!f.ate||f.ate>=todayKey), encerrados=cf.fixos.filter(f=>f.ate&&f.ate<todayKey);
  const parc=cf.parcelas.map(p=>{ const cc=p.forma==="credito"?cartaoDe(p):null; const prim=cartaoOk(cc)?faturaMes(p.compra,p.dia,cc):p.compra; const pagas=Math.max(0,Math.min(p.n,entre(prim,todayKey)+1)); return {p,prim,pagas,ultima:shiftKey(prim,p.n-1)}; });
  const abertas=parc.filter(x=>x.ultima>=todayKey), quitadas=parc.length-abertas.length;
  return `<div class="grid"><div class="col">
    ${secaoMes("aj-fixas","Contas fixas",ativos.length?brl(soma(ativos))+"/mês · "+ativos.length+(ativos.length===1?" conta":" contas"):"nenhuma ainda",ICON.repete,`<div class="card"><div class="cardhead"><h2>Contas fixas</h2><span class="num muted">${ativos.length?brl(soma(ativos))+"/mês":""}</span></div>
    ${ativos.length?`<div>${ativos.slice().sort((a,b)=>a.dia-b.dia).map(f=>`<button type="button" class="item" data-edit="fixo" data-id="${esc(f.id)}" style="--dot:${catColor(f.cat)}"><span class="pill">dia ${pad2(f.dia)}</span><span class="desc"><b>${esc(f.nome)}</b><small>${esc(catName(f.cat))} · ${esc(formaNome(f.forma))}${f.desde>todayKey?" · começa em "+abrMes(f.desde):""}</small></span><span class="v">${brl(f.valor)}</span></button>`).join("")}</div>`:`<p class="hint">Nenhuma conta fixa ainda. Exemplos: aluguel, internet, plano de celular, academia, streaming.</p>`}
    ${encerrados.length?`<p class="hint">${encerrados.length} conta(s) encerrada(s) continuam aparecendo nos meses em que valiam.</p>`:""}
    <button class="btn ghost" data-novo="fixo" type="button">+ Nova conta fixa</button></div>`)}

    ${secaoMes("aj-parc","Compras parceladas",abertas.length?abertas.length+" em andamento":"nenhuma em andamento",ICON.cartao,`<div class="card"><div class="cardhead"><h2>Compras parceladas</h2><span class="num muted">${abertas.length?abertas.length+" em andamento":""}</span></div>
    ${abertas.length?`<div>${abertas.map(x=>`<button type="button" class="item" data-edit="parcela" data-id="${esc(x.p.id)}" style="--dot:${catColor(x.p.cat)}"><span class="pill">${x.pagas}/${x.p.n}</span><span class="desc"><b>${esc(x.p.desc||"Compra parcelada")}</b><small>${x.p.n}x de ${brl(x.p.total/x.p.n)} · até ${esc(abrMes(x.ultima))}</small></span><span class="v">${brl(x.p.total)}</span></button>`).join("")}</div>`:`<p class="hint">Para parcelar, ao lançar uma despesa ligue a opção <b>Compra parcelada</b>. As parcelas entram sozinhas nos meses seguintes.</p>`}
    ${quitadas?`<p class="hint">${quitadas} compra(s) já quitada(s).</p>`:""}</div>`)}
    ${secaoMes("aj-viagem","Modo viagem","gastos em outra moeda",svgCat("aviao",18),cardViagens())}
    ${secaoMes("aj-div","Dívidas com pessoas",(()=>{ const n=state.config.dividas.filter(x=>!quitada(x)).length; return n?n+" em aberto":"quem te deve e quem você deve"; })(),ICON.grupo,cardDividas())}
    ${secaoMes("aj-ferr","Ferramentas","simulador de dívidas, 13º, férias, salário líquido",icq("engrenagem",18),`<div class="card" id="ferramentas"><h2>Ferramentas</h2>
    <button type="button" class="ferr" data-novo="simulador"><span class="fi" style="--dot:#10B981">${ICON.relat}</span><span><b>Simulador de quitação</b><small>Em quanto tempo quita uma dívida ou financiamento e quanto economiza pagando a mais.</small></span></button>
    <button type="button" class="ferr" data-novo="calc" data-calc="decimo"><span class="fi" style="--dot:#E11D48">${svgCat('presente',20)}</span><span><b>13º salário</b><small>Quanto cai na 1ª e na 2ª parcela, já com INSS e Imposto de Renda.</small></span></button>
    <button type="button" class="ferr" data-novo="calc" data-calc="ferias"><span class="fi" style="--dot:#0EA5E9">${svgCat('aviao',20)}</span><span><b>Férias</b><small>Férias + 1/3, com opção de vender 10 dias.</small></span></button>
    <button type="button" class="ferr" data-novo="calc" data-calc="liquido"><span class="fi" style="--dot:#8B5CF6">${svgCat('dinheiro',20)}</span><span><b>Salário líquido</b><small>Do bruto ao que cai na conta, com a tabela de ${TAB.ano}.</small></span></button>
    <button type="button" class="ferr" data-novo="calc" data-calc="guardar"><span class="fi" style="--dot:#F59E0B">${icq('alvo',20)}</span><span><b>Quanto guardar por mês</b><small>Para comprar algo à vista numa data, com ou sem rendimento.</small></span></button></div>
    `)}${secaoMes("aj-imp","Importar extrato do banco","OFX, CSV ou PDF do seu banco",icq("seta-baixo",18),`<div class="card"><h2>Importar extrato do banco</h2>
    <p class="hint">Baixe o extrato (ou a fatura do cartão) em OFX, CSV ou PDF no app do seu banco e traga tudo de uma vez, com a categoria já sugerida. O arquivo é lido no seu aparelho; PDF com senha também funciona.</p>
    <button class="btn" type="button" data-novo="importar">Importar extrato</button></div>`)}
    ${secaoMes("aj-contas","Contas",contasMov().length?contasMov().length+(contasMov().length===1?" conta":" contas"):"separe por banco ou carteira",ICON.banco,`<div class="card"><div class="cardhead"><h2>Contas</h2><span class="num muted">${contasMov().length?brl(saldoInicialTotal())+" inicial":""}</span></div>
    ${contasMov().length?`<div class="contas">${contasMov().map(ct=>`<button type="button" class="conta" data-edit="conta" data-id="${esc(ct.id)}"><span class="ic">${ICON[ct.tipo==="dinheiro"?"dinheiro":ct.tipo==="poupanca"?"poupanca":"banco"]}</span><span class="desc"><b>${esc(ct.nome)}</b><small>saldo inicial ${brl(ct.saldoInicial)}${(cf.contaSalario||(contasMov()[0]||{}).id)===ct.id?" · recebe o salário":""}</small></span><span class="v muted">editar</span></button>`).join("")}</div>`:`<p class="hint">Separe seu dinheiro por conta (ex.: Nubank, Caixa, Dinheiro). Cada lançamento pode sair de uma conta, e o app mostra o saldo de cada uma. Sem contas cadastradas, tudo fica num saldo só.</p>`}
    <button class="btn ghost" data-novo="conta" type="button">+ Nova conta</button></div>`)}
    ${secaoMes("aj-cart","Cartões de crédito",cf.cartoes.length?cf.cartoes.map(x=>x.nome).join(", "):"nenhum ainda",ICON.cartao,`<div class="card"><div class="cardhead"><h2>Cartões de crédito</h2><span class="num muted">${cf.cartoes.length||""}</span></div>
    ${cf.cartoes.length?`<div class="contas">${cf.cartoes.map(cc=>{ const u=usoCartao(cc); return `<button type="button" class="conta" data-edit="cartao" data-id="${esc(cc.id)}"><span class="ic">${ICON.cartao}</span><span class="desc"><b>${esc(cc.nome)}</b><small>${cartaoOk(cc)?"fecha dia "+pad2(cc.fecha)+" · vence dia "+pad2(cc.vence):"sem dias de fatura"}${cc.limite?" · livre "+brl(u.livre):""}</small></span><span class="v muted">editar</span></button>`; }).join("")}</div>`:`<p class="hint">Cadastre seus cartões com o dia de fechamento e vencimento: as compras no crédito passam a contar no mês da fatura, e o app mostra o limite disponível.</p>`}
    <button class="btn ghost" data-novo="cartao" type="button">+ Novo cartão</button></div>`)}</div>
    <div class="col">${secaoMes("aj-cats","Categorias de gastos",cf.categorias.length+" categorias e limites do mês",svgCat("pontos",18),`<div class="card"><div class="cardhead"><h2>Categorias de gastos</h2><span class="num muted">${cf.categorias.length}</span></div>
    <p class="hint">Toque numa categoria para mudar o nome, a cor ou o limite do mês, ou para excluir.</p>
    <div>${(ui.verCats||cf.categorias.length<=6?cf.categorias:cf.categorias.slice(0,5)).map(ct=>`<button type="button" class="item catitem" data-edit="categoria" data-id="${esc(ct.id)}" style="--dot:${catColor(ct.id)}">${icoCat(ct.id)}<span class="desc"><b>${esc(ct.nome)}</b><small>${ct.orcamento>0?"limite de "+brl(ct.orcamento)+" por mês"+(ct.sobra?" · sobra acumula"+(sobraCat(ct,todayKey)>0?" (+"+brl(sobraCat(ct,todayKey))+" em "+abrMes(todayKey)+")":""):""):"sem limite"}</small></span><span class="v muted">editar</span></button>`).join("")}</div>
    ${cf.categorias.length>6?`<button type="button" class="btn ghost wide vermais" data-vercats="1">${ui.verCats?"Mostrar só as 5 primeiras":"Ver todas as "+cf.categorias.length+" categorias"}</button>`:""}
    <button class="btn ghost" data-novo="categoria" type="button">+ Nova categoria</button>
    <p class="hint">Excluir uma categoria não apaga os valores já lançados nela (aparecem como "Sem categoria"; ao editar, escolha outra).</p></div>`)}
    ${secaoMes("aj-regras","Regras automáticas",(()=>{ const n=cf.categorias.reduce((a,c)=>a+(c.palavras||[]).length,0); return n?n+(n===1?" palavra":" palavras")+" com categoria certa":"crie suas palavras para cada categoria"; })(),icq("raio",18),cardRegras())}</div></div>`;
}

function perfilComIcones(){
  const I={"Renda e saldos":ICON.dinheiro,"Aparência":icq("sol"),"Bloqueio com PIN":ICON.cadeado,"Lembretes":ICON.sino,"Exportar e backup":icq("nuvem"),"Novidades":icq("estrela"),"Tutorial":svgCat("livro"),"Privacidade":ICON.digital,"Acessibilidade":icq("coracao"),"Recomeçar do zero":ICON.lixo,"Excluir minha conta":ICON.lixo};
  return viewPerfil().replace(/<h2>([^<]+)<\/h2>/g,(m,t)=>I[t]?`<h2 class="hico${t==="Recomeçar do zero"||t==="Excluir minha conta"?" perigo":""}"><span class="hic" aria-hidden="true">${I[t]}</span>${t}</h2>`:m);
}
