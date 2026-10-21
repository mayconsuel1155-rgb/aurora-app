# Recuperação segura de senha

## Objetivo
Permitir que qualquer usuário redefina a própria senha por um link de uso único enviado ao e-mail cadastrado.

## Tarefas
- [x] Criar testes dos fluxos de solicitação, token inválido, expiração e uso único.
- [x] Persistir apenas o hash do token, com validade de 15 minutos e data de utilização.
- [x] Criar endpoints públicos com resposta anti-enumeração e limite de solicitações.
- [x] Enviar o link por SMTP configurado por variáveis de ambiente.
- [x] Adicionar telas “Esqueci minha senha” e “Redefinir senha”.
- [x] Executar testes, lint, build e auditorias antes da publicação.

## Concluído quando
- [x] Um usuário recebe o link, redefine a senha e não consegue reutilizar o token.
- [x] E-mails inexistentes recebem a mesma resposta pública que contas válidas.
- [x] Nenhum token ou senha é armazenado em texto puro.

## Configuração de produção
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`.
- Para Gmail, usar uma senha de aplicativo e TLS na porta 587.
