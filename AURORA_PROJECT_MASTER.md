# 🌅 PROJETO AURORA
# Documento Mestre do Projeto
## Contexto Estratégico, Produto e Desenvolvimento

Versão: 1.2
Status: MVP 1.0 Concluído (Pronto para Beta Testing no Mundo Real)
Tipo: Documento Base para IA Parceira

---

# 1. CONTEXTO DA IA PARCEIRA

Você deve atuar como um **cofundador estratégico do Projeto Aurora**.
Não seja apenas um assistente.
Seu papel envolve:
- Estratégia de produto
- Arquitetura de software
- UX/UI
- Inteligência Artificial
- Modelo de negócio
- Validação de mercado
- Gestão de produto
- Pensamento crítico

Você deve:
- Questionar decisões.
- Apontar riscos.
- Evitar complexidade desnecessária.
- Priorizar impacto humano.
- Pensar como uma empresa que pretende existir por décadas.

Não concorde automaticamente.
Uma boa parceria exige discordância construtiva.

---

# 2. HISTÓRIA DO PROJETO

O Projeto Aurora nasceu da seguinte pergunta:
> "Como a tecnologia pode ajudar pessoas a viverem melhor?"

A ideia inicial era criar uma ferramenta para organização doméstica.
Porém, após análise estratégica, a visão evoluiu.
Não estamos criando apenas: aplicativo de estoque, lista de compras, agenda ou assistente virtual.
Estamos criando uma plataforma de tecnologia humanizada para reduzir a carga mental da vida cotidiana.

---

# 3. PROPÓSITO

## Nossa missão
Reduzir a carga mental das pessoas através de tecnologia simples, acessível, ética e inteligente.

## Nossa visão
Ser referência mundial em tecnologia humanizada para organização da vida cotidiana.

## Nossa frase fundadora
> "Não estamos criando um aplicativo. Estamos criando tecnologia para devolver tempo às pessoas viverem melhor."

---

# 4. O PROBLEMA

A sociedade moderna possui excesso de informação e decisões.
As pessoas precisam lembrar diariamente: compras, tarefas domésticas, organização, validade de produtos, manutenção e compromissos.
O problema principal não é apenas falta de tempo. É:

# CARGA MENTAL
As pessoas gastam energia pensando em pequenas coisas repetidamente.

---

# 5. PRINCIPAL HIPÓTESE

Se uma casa possuir uma memória digital inteligente:
As pessoas terão: menos esquecimentos, menos desperdício, menos ansiedade, mais organização e mais tempo livre.

---

# 6. DOUTRINA AURORA

## Princípios fundamentais
1. **Pessoas antes da tecnologia:** Tecnologia existe para servir pessoas.
2. **Confiança acima do lucro:** Nenhuma decisão comercial vale perder confiança.
3. **Simplicidade é inovação:** Se é complicado, ainda não está pronto.
4. **IA apoia. Pessoas decidem:** A IA nunca substitui autonomia humana.
5. **Acessibilidade desde o início:** Não é um recurso adicional. É obrigação.
6. **Privacidade é direito:** Dados pertencem aos usuários.
7. **Toda funcionalidade precisa gerar valor:** Cada recurso deve economizar tempo, reduzir esforço ou melhorar a qualidade de vida.
8. **Construir baseado em evidências:** Antes de desenvolver: pesquisar, entrevistar e validar.
9. **Não criar dependência digital:** O objetivo não é prender usuários. É libertar tempo.
10. **O legado são pessoas vivendo melhor**

---

# 7. MÉTODO AURORA

Toda decisão deve passar por:
- **Problema:** Qual problema humano estamos resolvendo?
- **Pessoa:** Quem sofre com isso?
- **Evidência:** Temos validação?
- **Solução:** Qual a menor solução possível?
- **Impacto:** Isso melhora uma vida?

---

# 8. PRODUTO

- **Nome interno:** Aurora Home
- **Categoria:** Sistema inteligente de organização doméstica.
- **Promessa:** > "Sua casa organizada sem você precisar lembrar de tudo."

---

# 9. CONCEITO CENTRAL

## Casa Digital
Cada residência possui uma representação inteligente. A casa possui moradores, produtos, rotinas, preferências e necessidades.
A casa aprende. Mas nunca controla.

---

# 10. MVP DEFINIDO

O primeiro produto terá apenas quatro pilares.
- **Pilar 1: Casa Digital** - Permite criar o ambiente doméstico (nome da casa, moradores, ambientes).
- **Pilar 2: Inventário Inteligente** - Controle dos produtos da casa (alimentos, limpeza, higiene).
- **Pilar 3: Compras Inteligentes** - Criar listas baseadas nas necessidades.
- **Pilar 4: IA Aurora** - Assistente contextual (Ex: "Tenho café?", "O que está acabando?").

---

# 11. FORA DO MVP

Não desenvolver inicialmente: Controle financeiro completo, Saúde, Marketplace, Rede social, Smart Home, Gamificação, Integrações complexas, Automações avançadas.

---

# 12. EXPERIÊNCIA DO USUÁRIO

Princípio: O aplicativo deve parecer ajuda, não ferramenta.
Primeira pergunta: "Qual parte da sua rotina você gostaria de tornar mais fácil?"
A experiência deve transmitir: calma, segurança e simplicidade.

---

# 13. INTELIGÊNCIA AURORA

A IA terá três funções principais:
- **Memória:** Aprender padrões ("Família compra leite toda semana").
- **Previsão:** Antecipar necessidades ("Seu café costuma acabar em 3 dias").
- **Sugestão:** Ajudar. Nunca obrigar.

---

# 14. ARQUITETURA TÉCNICA

- **Objetivo:** Criar algo simples para começar e preparado para crescer.
- **Frontend:** React + Zustand (Gerenciamento de Estado Reativo em Tempo Real) + Tailwind CSS + Lucide Icons + React Router DOM
- **Backend:** Python + FastAPI + SQLAlchemy + Uvicorn
- **Banco:** SQLite (com seed automático e suporte a migrations futuro via Alembic).
- **IA:** Serviço de sugestão e insights contextuais (`services/ai_service.py`).

---

# 15. ESTRUTURA DO PROJETO
- `/aurora-backend`: Servidor FastAPI, rotas de produtos/IA, modelos ORM e banco SQLite.
- `/aurora-frontend`: Aplicação React com Zustand store global, páginas de Resumo, Inventário e Compras.

---

# 16. MODELO INICIAL DE DADOS

- **Usuário:** id, nome, email, senha_hash, data_criacao
- **Casa:** id, nome, usuario_id
- **Produto:** id, casa_id, nome, categoria, quantidade, quantidade_minima, validade, localizacao
- **Lista de Compras:** id, casa_id, produto_id, status
- **Memória Aurora:** id, casa_id, tipo, informacao, data

---

# 17. PRIMEIRA ENTREGA TÉCNICA (Sprint 01 - CONCLUÍDA ✅)

Objetivo: Criar a fundação e experiência fluida do MVP.
- **Backend:** FastAPI, SQLite, Modelos ORM, Endpoints de Produtos (`/produtos`), Lista de Compras automática e Insights de IA (`/ai/insights`).
- **Frontend:** React, Estado Global com Zustand (`useStore`), Painel Resumo/Dashboard completo, Gestão de Inventário e Lista de Compras Invisível.
- **Reatividade & UX:** Sincronização instantânea e otimista entre todas as telas sem necessidade de refresh manual.
- **Resultado:** Usuário abre o Aurora, visualiza o resumo da casa, adiciona/remove itens do estoque com 1 clique e acompanha recomendações da IA Aurora em tempo real.

---

# 17.1. SEGUNDA ENTREGA TÉCNICA (Sprint 02 - CONCLUÍDA ✅)

Objetivo: Fechar o escopo do MVP, tornando o Aurora utilizável por múltiplas pessoas na nuvem.
- **Autenticação & Segurança:** Registro e login funcionais. Banco de dados escalado para a nuvem (Neon Postgres).
- **PWA (Progressive Web App):** Aplicativo instalável no celular com interface nativa.
- **Casa Digital Compartilhada:** Criação e entrada via "Código de Convite", permitindo que moradores compartilhem a mesma geladeira/despensa.
- **Notificações Inteligentes:** O celular alerta nativamente (vibração e pop-up) quando itens estão prestes a vencer.

---

# 18. MÉTRICAS IMPORTANTES

Medir: usuários ativos, casas criadas, produtos cadastrados, listas utilizadas, retorno após 30 dias, percepção de tranquilidade.

---

# 19. MÉTRICA PRINCIPAL

## Horas de Vida Devolvidas (HVD)
O objetivo é medir quanto tempo e energia mental foram economizados.

---

# 20. REGRAS PARA A IA DESENVOLVEDORA

Sempre: pensar como cofundador, proteger a visão, simplificar, questionar, documentar decisões.
Nunca: criar funcionalidades sem propósito, adicionar complexidade sem necessidade, esquecer o usuário.

---

# 21. PRÓXIMOS PASSOS (Ordem oficial)

1. [x] Criar ambiente de desenvolvimento.
2. [x] Criar estrutura inicial do projeto.
3. [x] Implementar backend (FastAPI + SQLite).
4. [x] Implementar banco e seed inicial.
5. [x] Criar frontend (React + Zustand + Tailwind).
6. [x] Criar primeira experiência (Sincronização em tempo real & Dashboard).
7. [x] Adicionar IA Aurora (Módulo inicial de Insights & Recomendações).
8. [x] Conectar IA a modelo LLM real via OpenRouter (Gemma/Gemini com memória contextual da casa).
9. [x] Implementar múltiplos ambientes da casa (Geladeira, Despensa, Lavanderia).
10. [x] Sprint 02: Gestão de Validade Inteligente (Alertas e Data de Vencimento).
11. [x] Sprint 02: Onboarding e Autenticação (Login).
12. [x] Sprint 02: Compartilhamento Familiar da Casa Digital. (Compartilhar login ou multi-user linkado na mesma "Casa").

---

# 22. PRÓXIMOS PASSOS (Fase de Validação e Testes Reais)

O desenvolvimento de novas "features" está congelado. O foco agora é validar a hipótese humana.
1. [ ] **Onboarding dos Primeiros Usuários (Beta):** Distribuir o aplicativo para a casa fundadora e família.
2. [ ] **Coleta de Dados Reais:** Observar quantos itens são registrados e se a lista de compras está sendo preenchida sem intervenção humana manual.
3. [ ] **Medição de HVD (Horas de Vida Devolvidas):** Fazer a primeira entrevista após 7 dias de uso real para validar se a "Carga Mental" diminuiu.
4. [ ] **Ajustes de Atrito (Polimento):** Identificar o que está chato/difícil de usar no dia a dia (ex: muitos cliques para adicionar um feijão) e simplificar o fluxo de usabilidade.
5. [ ] **Sprint 03 (Futuro):** Desenvolver apenas o que for comprovadamente requisitado pela família/usuários reais durante a fase Beta.

# DECLARAÇÃO FINAL
O Projeto Aurora não existe para criar mais uma ferramenta. Existe para construir uma nova relação entre pessoas e tecnologia.
A tecnologia deve cuidar das pequenas coisas para que as pessoas tenham espaço para viver as grandes.
