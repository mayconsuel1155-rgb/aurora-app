# Importar compras por NFC-e

## Goal
Ler o QR Code de uma NFC-e brasileira, apresentar os itens para revisão e atualizar o estoque preservando quantidades, unidades e preços.

## Tasks
- [x] Definir os contratos de prévia e confirmação da nota → Verify: OpenAPI expõe os novos schemas.
- [x] Consultar com segurança o portal estadual e normalizar layouts conhecidos → Verify: testes de parser e validação de URL passam.
- [x] Confirmar itens em uma transação, atualizando existentes e criando novos → Verify: teste de importação cobre os dois casos.
- [x] Adicionar unidade de medida aos produtos com migração compatível → Verify: bancos existentes recebem a coluna sem perder dados.
- [x] Criar leitor de câmera e revisão editável na tela de Compras → Verify: fluxo permite escanear, corrigir, selecionar e importar.
- [x] Executar testes, lint, tipos e build → Verify: todos os comandos encerram com código zero.
- [x] Registrar o recurso e suas limitações no documento mestre → Verify: documentação descreve consulta estadual e confirmação humana.

## Done When
- [x] Uma NFC-e válida gera uma prévia revisável e somente os itens confirmados alteram o estoque.
- [x] Falhas, CAPTCHA e navegadores sem câmera têm mensagens e alternativas claras.

## Notes
- A página pública continua sob responsabilidade de cada SEFAZ; o extrator precisa falhar com segurança quando o layout não for reconhecido.
- A URL recebida do QR Code deve ser validada contra SSRF antes de qualquer consulta externa.
