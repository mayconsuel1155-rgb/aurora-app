# Controle de tentativas da SEFAZ

## Objetivo

Mostrar tentativas por portal e o tempo restante do bloqueio, liberando uma nova consulta somente por ação do usuário.

## Tarefas

- [x] Retornar erro 429 estruturado com portal, tentativas e segundos restantes.
- [x] Manter a contagem isolada por domínio estadual durante a janela de espera.
- [x] Exibir contador regressivo `mm:ss` e botão de nova tentativa no modal.
- [x] Validar parser, API, lint e build.

## Concluído quando

- [x] O bloqueio da SEFAZ SC mostra número de tentativas e tempo restante sem impedir consultas de outros estados.
- [x] O sistema não repete a consulta automaticamente.
