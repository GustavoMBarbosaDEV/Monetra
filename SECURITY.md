# Segurança do Monetra

O Monetra guarda dados financeiros pessoais. Se você encontrou uma falha de segurança, obrigado por avisar.

## Como relatar

- **Use o relato privado do GitHub:** na página do repositório, aba **Security** → **Report a vulnerability**.
- **Não abra uma issue pública** e não publique detalhes da falha antes de ela ser corrigida.
- Conte o que encontrou, os passos para reproduzir e o que uma pessoa mal-intencionada conseguiria fazer.
- Não acesse, altere nem apague dados de outras pessoas para provar a falha. Teste só com contas suas.

## O que acontece depois

- Resposta em até **7 dias** confirmando o recebimento.
- Correção priorizada conforme a gravidade, com uma versão nova no [CHANGELOG.md](CHANGELOG.md).
- Se você quiser, seu nome aparece nos agradecimentos da versão que corrigir a falha.

## Versões cobertas

Só a versão publicada em https://gustavombarbosadev.github.io/Monetra/ (e o app Android, que abre esse mesmo site).

## O que está fora do escopo

- A chave `apiKey` do `firebase-config.js`: ela é pública por natureza. A proteção vem das regras do Firestore (`firestore.rules`) e das restrições da chave no Google Cloud.
- Ataques que exigem acesso físico a um aparelho já desbloqueado.
- Falhas em serviços do Google ou do GitHub (relate a eles).
