# Segurança do Monetra

O Monetra guarda dados financeiros pessoais. Se você encontrou uma falha de segurança, obrigado por avisar.

## Como relatar

- **Use o relato privado do GitHub:** na página do repositório, aba **Security** → **Report a vulnerability**. Se preferir, escreva para **monetra.app26@gmail.com** com o assunto "Segurança".
- **Não abra uma issue pública** e não publique detalhes da falha antes de ela ser corrigida.
- Conte o que encontrou, os passos para reproduzir e o que uma pessoa mal-intencionada conseguiria fazer.
- Não acesse, altere nem apague dados de outras pessoas para provar a falha. Teste só com contas suas.

## O que acontece depois

- Resposta em até **7 dias** confirmando o recebimento.
- Correção priorizada conforme a gravidade, com uma versão nova no [CHANGELOG.md](CHANGELOG.md).
- Se você quiser, seu nome aparece nos agradecimentos da versão que corrigir a falha.

## Versões cobertas

Só a versão publicada em https://monetraapp.web.app (e o app Android, que abre esse mesmo site).

## O que está fora do escopo

- A chave `apiKey` do `firebase-config.js`: ela é pública por natureza. A proteção vem das regras do Firestore (`firestore.rules`), do App Check e das restrições da chave no Google Cloud.
- Ataques que exigem acesso físico a um aparelho já desbloqueado.
- Falhas em serviços do Google ou do GitHub (relate a eles).

## Plano de incidente

Para quem mantém o projeto. Seguir na ordem.

1. **Conter.**
   - Travar o acesso aos dados: publicar regras com `allow read, write: if false;` em tudo (Firebase Console → Firestore → Regras, ou `firebase deploy --only firestore:rules`).
   - Desabilitar contas suspeitas em Firebase Console → Authentication → Usuários.
   - Se uma chave ou credencial vazou, revogar e trocar **antes** de qualquer outra coisa: conta de serviço do deploy (Google Cloud → IAM → Contas de serviço, e o secret do GitHub), chave do reCAPTCHA, chave de API. Apagar o arquivo do repositório não desfaz o vazamento.
2. **Investigar a causa.** O que entrou, quando e por onde: regra frouxa, segredo no git, XSS, conta comprometida, dependência. Fontes: Firestore → Uso, App Check → Métricas, Authentication → Usuários, histórico do git e alertas do GitHub.
3. **Corrigir** no branch `testes`, testar (incluindo os testes das regras em `testes-regras/`) e publicar com uma versão nova.
4. **Comunicar.** Avisar as pessoas afetadas com clareza: o que aconteceu, quais dados, o que já foi feito e o que elas devem fazer. Pela LGPD, incidente que possa causar risco ou dano relevante aos titulares deve ser comunicado à ANPD e aos titulares; conferir prazos e formulário no site da ANPD (gov.br/anpd) na hora.
5. **Registrar** o que aconteceu, a causa e o que mudou, no `CHANGELOG.md` e nas notas internas, para não repetir.

## Rotina de monitoramento

De tempos em tempos (sugestão: uma vez por mês e depois de cada versão grande):

- Firebase Console → Authentication → Usuários: cadastros estranhos ou em massa.
- Firestore → Uso: picos de leitura ou gravação.
- App Check → Métricas: proporção de requisições não verificadas.
- GitHub → Security: alertas do Dependabot, do CodeQL e de segredos. Não fechar um alerta como falso positivo sem investigar; anotar o que foi conferido e por quê.
