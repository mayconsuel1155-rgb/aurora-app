# Diretrizes do Agente no Projeto Aurora

## Prevenção do erro "User cancelled agent execution"
1. **Execução de Servidores e Processos Contínuos (`start.py`, `npm run dev`, `uvicorn`)**:
   - `start.py` e servidores web mantêm loops ativos (`while True`).
   - NUNCA execute esses comandos de forma síncrona aguardando o término.
   - Sempre utilize execução em segundo plano (background tasks) e verifique a saúde com `python start.py --status` ou requisições HTTP em `http://localhost:8000` e `http://localhost:5173`.

2. **Comandos Interativos**:
   - Sempre passe flags não-interativas (ex: `-y`, `--yes`, `--non-interactive`) para evitar que a execução fique aguardando entrada de texto no terminal.

3. **Verificação de Saúde**:
   - Para checar se o Aurora está rodando: `python d:\Aurora\start.py --status`
