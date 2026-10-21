# Pesquisa de NFC-e por chave

## Objetivo

Aceitar link ou chave de 44 dígitos, consultar o histórico da casa e preservar os dados completos da nota sem permitir duplicação de estoque.

## Tarefas

- [x] Ampliar nota importada e criar itens de histórico normalizados → verificar migração sobre o banco atual.
- [x] Criar consulta autenticada por chave com validação de UF/modelo → verificar nota existente e chave nova.
- [x] Salvar emitente, valor e todos os itens ao importar → verificar persistência e bloqueio de duplicata.
- [x] Transformar a entrada manual em campo unificado e exibir o histórico → verificar link, chave formatada e chave pura.
- [x] Executar testes, lint, build e reiniciar o ambiente local.

## Concluído quando

- [x] Uma chave existente exibe seus detalhes sem alterar o estoque; uma chave nova identifica a UF e orienta o QR Code quando a consulta estadual exigir dados adicionais.
