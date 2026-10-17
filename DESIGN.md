---
version: 1.0.0
name: Aurora Domestic Editorial
description: Uma interface domestica calma, confiavel e humana para organizar a rotina compartilhada da casa.
colors:
  primary: "#1F513B"
  primary-hover: "#173E2D"
  primary-soft: "#DDEBE2"
  accent: "#D99A2B"
  canvas: "#F3F4EF"
  surface: "#FCFCF8"
  surface-soft: "#E9ECE5"
  border: "#D6DBD2"
  text: "#202820"
  text-muted: "#667066"
  error: "#B54135"
  warning: "#9A6509"
  success: "#28704E"
  dark-canvas: "#101713"
  dark-surface: "#18211B"
  dark-surface-soft: "#222D25"
  dark-border: "#334038"
  dark-text: "#EEF2EC"
  dark-text-muted: "#A9B4AA"
typography:
  headline-display:
    fontFamily: "Aptos Display, Segoe UI, sans-serif"
    fontSize: 48px
    fontWeight: 650
    lineHeight: 1.05
    letterSpacing: -0.045em
  headline-lg:
    fontFamily: "Aptos Display, Segoe UI, sans-serif"
    fontSize: 36px
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: -0.035em
  headline-md:
    fontFamily: "Aptos Display, Segoe UI, sans-serif"
    fontSize: 24px
    fontWeight: 620
    lineHeight: 1.2
    letterSpacing: -0.025em
  body-lg:
    fontFamily: "Aptos, Segoe UI, sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: "Aptos, Segoe UI, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: "Aptos, Segoe UI, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: "Aptos, Segoe UI, sans-serif"
    fontSize: 13px
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: 0.01em
rounded:
  sm: 6px
  md: 10px
  lg: 16px
  xl: 24px
  full: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: 12px
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: 24px
---

# Aurora Domestic Editorial

## Overview

Aurora e uma casa digital compartilhada. A interface deve parecer acolhedora e organizada, sem adquirir a aparencia fria de um painel corporativo. A direcao visual e “Domestic Editorial”: estrutura de caderno domestico, hierarquia tipografica forte, blocos continuos e sinais de cor que orientam sem competir.

Redesign mode: targeted evolution. Rotas, nomes da navegacao, fluxos, campos e recursos existentes permanecem intactos.

Design dials:

- Design variance: 6/10. Assimetria controlada e composicoes editoriais, preservando previsibilidade nas tarefas.
- Motion intensity: 3/10. Apenas feedback de estado, entrada curta e resposta ao toque.
- Visual density: 5/10. Informacao suficiente para decidir rapidamente, com espaco entre grupos.

As referencias estruturais sao Notion, pela leitura silenciosa e hierarquia, e Starbucks, pela disciplina de verdes, superficies solidas e calor humano. Nenhum token ou componente e copiado literalmente.

## Colors

- **Primary, #1F513B:** verde floresta usado em navegacao ativa, botoes principais e foco.
- **Accent, #D99A2B:** ambar reservado para atencao, prioridades e pequenos sinais editoriais.
- **Canvas, #F3F4EF:** fundo neutro com leve calor, sem o branco azulado de software corporativo.
- **Surface, #FCFCF8:** superficies de leitura e formularios.
- **Text, #202820:** tinta verde-carvao para reduzir o contraste agressivo do preto puro.
- Cores semanticas de erro, alerta e sucesso nao substituem o accent em acoes comuns.
- O modo escuro usa a mesma familia de matiz, sem trocar a identidade do produto.

## Typography

- Use a pilha humanista local Aptos e Segoe UI para evitar downloads e manter desempenho previsivel.
- Titulos sao compactos, em sentence case, com tracking negativo e `text-wrap: balance`.
- Corpo de texto usa largura maxima proxima de 65 caracteres e `text-wrap: pretty`.
- Numeros de metricas usam algarismos tabulares.
- Microtitulos em caixa alta ficam restritos a navegacao estrutural, nunca repetidos em todo bloco.

## Layout

- Container principal maximo de 1180px.
- Desktop usa uma barra lateral de identidade forte e um canvas continuo.
- Mobile usa barra inferior com alvos de toque de pelo menos 44px.
- Resumos usam uma faixa tipo livro-caixa com divisores, nao uma grade de cartoes identicos.
- Conteudo principal segue mobile-first, com padding de 20px, 36px e 48px.

## Elevation & Depth

- A hierarquia vem primeiro de cor, borda e espaco negativo.
- Sombras sao curtas, esverdeadas e reservadas para elementos flutuantes como menus e modais.
- Nao usar vidro, blur decorativo ou gradientes estruturais.

## Shapes

- Controles internos: 10px.
- Paineis: 16px.
- Recipientes de pagina e modais: ate 24px.
- Pills apenas para status ou filtros realmente compactos.

## Components

- **Navigation:** fundo floresta no desktop; item ativo com superficie clara e marcador ambar.
- **Buttons:** fundo solido, rotulos especificos, feedback de pressao com transformacao curta.
- **Inputs:** rotulo persistente, foco visivel de 3px, mensagens de erro proximas ao campo.
- **Panels:** poucos paineis, usados para agrupar uma tarefa; listas internas usam espaco e divisores seletivos.
- **Status:** cor acompanha texto ou icone; nunca depender apenas da cor.
- **Dialogs:** fundo opaco, fechamento nomeado para leitores de tela e rolagem contida.

## Do's and Don'ts

- Do preservar rotas, nomes da navegacao, ordem dos campos e a voz em portugues.
- Do usar verde primario para acoes e ambar para atencao.
- Do oferecer estados vazio, carregando e erro com orientacao clara.
- Do respeitar `prefers-reduced-motion` e foco por teclado.
- Don't usar roxo, gradientes azulados, glassmorphism ou mosaicos bento.
- Don't transformar toda informacao em cartao.
- Don't misturar varias familias de cinza ou raios arbitrarios.
- Don't usar animacao decorativa continua.
