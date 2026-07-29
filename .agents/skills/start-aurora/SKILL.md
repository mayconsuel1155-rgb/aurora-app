---
name: start-aurora
description: Gerencia o ciclo de vida, inicialização, monitoramento de status e saúde do Projeto Aurora (Backend FastAPI e Frontend React Vite).
---

# Habilidade de Inicialização do Projeto Aurora

Esta habilidade permite ao agente de IA orquestrar, verificar o status e iniciar a aplicação Aurora de maneira automatizada.

## Quando usar esta Habilidade
Use esta habilidade sempre que o usuário pedir para:
- "Iniciar o projeto" / "Start project" / "Rodar o Aurora"
- "Subir o servidor" / "Verificar se o backend ou frontend está rodando"
- "Executar o seed do banco de dados"
- "Verificar a saúde da aplicação"

## Procedimentos Operacionais

### 1. Iniciar o Projeto Aurora (Modo Não-Bloqueante / Background)
⚠️ **ATENÇÃO CRÍTICA**: `start.py` é um processo de servidor contínuo (`while True`). **NUNCA** execute `python start.py` de forma síncrona aguardando o término, pois isso trava a execução do agente e força o usuário a cancelar (`User cancelled agent execution`).

- **Primeiro, verifique se os serviços já estão rodando**:
  ```powershell
  python d:\Aurora\start.py --status
  ```
- **Caso não estejam rodando, inicie em segundo plano** usando o `run_command` com `WaitMsBeforeAsync: 3000`:
  ```powershell
  python d:\Aurora\start.py
  ```
- O script iniciará o FastAPI em `http://localhost:8000` e o Vite Frontend em `http://localhost:5173` em background task.

### 2. Verificar Status dos Servidores
Para verificar rapidamente a saúde e se os servidores estão ativas sem bloquear:
- Execute `python d:\Aurora\start.py --status`
- Ou verifique as portas via requisição HTTP:
  - Backend: `http://localhost:8000/`
  - Frontend: `http://localhost:5173/`

### 3. Popular Banco de Dados (Seed)
Caso a base SQLite (`aurora-backend/aurora.db`) precise de dados iniciais de teste:
- Execute a partir da pasta `aurora-backend`:
  ```powershell
  d:\Aurora\aurora-backend\venv\Scripts\python.exe seed_db.py
  ```

### 4. Estrutura de Portas do Aurora
- **Backend FastAPI**: `http://localhost:8000`
- **Documentação Swagger (OpenAPI)**: `http://localhost:8000/docs`
- **Frontend React Vite**: `http://localhost:5173`
