import os
import json
import urllib.request
from urllib.error import HTTPError
import time
import re
from sqlalchemy.orm import Session
import models

OPENROUTER_API_KEY = os.getenv(
    "OPENROUTER_API_KEY", 
    "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"
)
PREFERRED_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/free")

def _make_openrouter_request(payload, headers, max_retries=3):
    url = "https://openrouter.ai/api/v1/chat/completions"
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers)
    
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except HTTPError as e:
            if e.code == 429:
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Backoff: 1s, 2s, 4s
                    continue
            raise e
        except Exception as e:
            raise e
    raise Exception("Max retries exceeded")

def gerar_insight_mock(produtos):
    em_falta = [p for p in produtos if p.quantidade <= p.quantidade_minima]
    
    if not em_falta:
        return {
            "tipo": "sucesso",
            "mensagem": "Sua casa está perfeitamente abastecida. Nenhuma compra necessária."
        }
    
    nomes_em_falta = [p.nome for p in em_falta]
    
    if any("café" in n.lower() for n in nomes_em_falta):
         return {
            "tipo": "alerta",
            "mensagem": "Notei que o Café está no limite. Gostaria de repor antes do final de semana?"
         }
         
    return {
        "tipo": "info",
        "mensagem": f"Você tem {len(em_falta)} itens aguardando reposição na Lista de Compras. Recomendo reposição em breve."
    }

def conversar_com_aurora_mock(produtos, mensagem_usuario):
    em_falta = [p for p in produtos if p.quantidade <= p.quantidade_minima]
    mensagem_lower = mensagem_usuario.lower()
    
    if "falta" in mensagem_lower or "comprar" in mensagem_lower or "acabando" in mensagem_lower or "preciso" in mensagem_lower:
        if not em_falta:
            return {"resposta": "Não há nada em falta no momento. Seu estoque está em níveis adequados!"}
        nomes = [p.nome for p in em_falta]
        return {"resposta": f"Os seguintes itens estão em falta ou no limite mínimo: {', '.join(nomes)}."}
        
    if "estoque" in mensagem_lower or "inventário" in mensagem_lower or "produtos" in mensagem_lower or "temos" in mensagem_lower:
        return {"resposta": f"Você possui {len(produtos)} produtos cadastrados no total. Destes, {len(em_falta)} precisam de reposição."}
        
    return {"resposta": f"Olá! Sou a Aurora. Estou operando no modo de contingência devido à alta demanda nos servidores da IA, mas posso confirmar que você tem {len(produtos)} produtos no seu inventário. Como posso ajudar com eles?"}

def gerar_insight_llm(produtos):
    if not produtos:
        return {
            "tipo": "info",
            "mensagem": "Sua casa ainda não tem produtos cadastrados. Adicione o primeiro no Inventário!"
        }

    resumo_produtos = []
    for p in produtos:
        status = "Repor" if p.quantidade <= p.quantidade_minima else "OK"
        resumo_produtos.append(f"- {p.nome} ({p.categoria}): {p.quantidade} un (mínimo: {p.quantidade_minima}) [{status}]")
    
    lista_texto = "\n".join(resumo_produtos)
    
    prompt_sistema = (
        "Você é a IA Aurora, uma assistente doméstica com tom profissional, claro e objetivo. "
        "Seu objetivo é gerar um alerta ou relatório de status sobre o inventário de forma direta e formal (1 a 2 frases no máximo).\n"
        "Retorne APENAS um objeto JSON válido sem qualquer texto antes ou depois, no seguinte formato estrito:\n"
        '{"tipo": "sucesso", "mensagem": "texto do insight em português"}\n'
        'onde "tipo" DEVE ser obrigatoriamente um destes três valores: "sucesso", "alerta" ou "info".'
    )
    
    prompt_usuario = (
        f"Inventário Atual da Casa:\n{lista_texto}\n\n"
        f"Gere o insight ideal para os moradores agora."
    )
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json; charset=utf-8",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Aurora Home"
    }
    
    payload = {
        "model": PREFERRED_MODEL,
        "messages": [
            {"role": "system", "content": prompt_sistema},
            {"role": "user", "content": prompt_usuario}
        ],
        "temperature": 0.7,
        "max_tokens": 150
    }
    
    try:
        data = _make_openrouter_request(payload, headers)
        
        if "choices" not in data:
            error_msg = data.get("error", {}).get("message", str(data)) if isinstance(data, dict) else str(data)
            raise Exception(f"Resposta inesperada da API: {error_msg}")
            
        content = data["choices"][0]["message"]["content"].strip()
        
        # Remover blocos ```json ... ``` se o modelo envolver
        if "```" in content:
            match = re.search(r"\{.*\}", content, re.DOTALL)
            if match:
                content = match.group(0)

        parsed = json.loads(content)
        if isinstance(parsed, dict) and "tipo" in parsed and "mensagem" in parsed:
            # Validar tipo permitido
            if parsed["tipo"] not in ["sucesso", "alerta", "info"]:
                parsed["tipo"] = "info"
            print("[AI Aurora] Insight gerado com sucesso via LLM:", parsed)
            return parsed
    except Exception as e:
        print("[AI Aurora] Fallback para insight local devido ao erro na IA:", e)

        
    return gerar_insight_mock(produtos)

def gerar_insight(db: Session, casa_id: int, eventos_agenda: list = None):
    produtos = db.query(models.Produto).filter(models.Produto.casa_id == casa_id).all()
    # Para o MVP da timeline/insight, passamos o mock se não houver eventos
    return gerar_insight_llm(produtos)

def conversar_com_aurora(db: Session, casa_id: int, mensagem_usuario: str, historico: list = None, eventos_agenda: list = None):
    produtos = db.query(models.Produto).filter(models.Produto.casa_id == casa_id).all()
    if eventos_agenda is None:
        eventos_agenda = []
    
    resumo_produtos = []
    for p in produtos:
        status = "CRÍTICO/REPOR" if p.quantidade <= p.quantidade_minima else "OK"
        loc = f" no ambiente {p.ambiente.nome}" if p.ambiente else ""
        resumo_produtos.append(f"- {p.nome} ({p.categoria}){loc}: {p.quantidade} un (Estoque Mínimo: {p.quantidade_minima}) [{status}]")
    
    lista_texto = "\n".join(resumo_produtos) if resumo_produtos else "Nenhum produto cadastrado no momento."
    
    resumo_eventos = []
    for e in eventos_agenda:
        titulo = e.get("titulo", "Sem título")
        data = e.get("data", "")
        # Formatar a data se possível
        resumo_eventos.append(f"- {titulo} (Data/Hora: {data})")
    
    lista_eventos = "\n".join(resumo_eventos) if resumo_eventos else "Não há eventos agendados ou a agenda não está conectada."

    prompt_sistema = (
        "Você é a IA Aurora, uma assistente virtual profissional, objetiva e clara, especializada em gestão doméstica e organização de rotina.\n"
        "Sua missão é fornecer informações sobre o inventário da casa e a agenda de compromissos do usuário de forma direta e útil.\n\n"
        "REGRAS DE ESTILO E FORMATAÇÃO DE RESPOSTA:\n"
        "1. TOM PROFISSIONAL E OBJETIVO: Vá direto ao ponto. Evite excesso de emojis, linguagem informal ou frases prolixas.\n"
        "2. FOCO NO ESSENCIAL: Se o usuário perguntar sobre o dia dele, resuma os compromissos. Se perguntar sobre a casa, fale dos produtos.\n"
        "3. SEM INVENTAR DADOS: Baseie-se ESTRITAMENTE no inventário e agenda fornecidos abaixo. Nunca invente compromissos ou produtos.\n"
        "4. DADOS VAZIOS: Se a lista de eventos estiver vazia, avise ao usuário que não há compromissos ou que a agenda do Google precisa ser reconectada em 'Aurora Connect'.\n\n"
        f"INVENTÁRIO ATUAL DA CASA (CASA ID {casa_id}):\n"
        f"{lista_texto}\n\n"
        f"AGENDA DO USUÁRIO (PRÓXIMOS COMPROMISSOS):\n"
        f"{lista_eventos}\n\n"
        "Utilize os dados acima para responder de maneira altamente profissional, clara e concisa."
    )
    
    messages = [{"role": "system", "content": prompt_sistema}]
    
    if historico and isinstance(historico, list):
        for item in historico[-6:]:  # Manter últimos 6 turnos para economizar contexto
            if isinstance(item, dict) and "role" in item and "content" in item:
                role = "assistant" if item["role"] in ["assistant", "aurora"] else "user"
                messages.append({"role": role, "content": str(item["content"])})
                
    messages.append({"role": "user", "content": mensagem_usuario})
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json; charset=utf-8",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Aurora Home"
    }
    
    payload = {
        "model": PREFERRED_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 400
    }
    
    try:
        data = _make_openrouter_request(payload, headers)
        
        if "choices" not in data:
            error_msg = data.get("error", {}).get("message", str(data)) if isinstance(data, dict) else str(data)
            raise Exception(f"Resposta inesperada da API: {error_msg}")
            
        content = data["choices"][0]["message"]["content"].strip()
        return {"resposta": content}
    except Exception as e:
        print("[AI Aurora Chat] Erro ao conectar ao LLM:", e)
        return conversar_com_aurora_mock(produtos, mensagem_usuario)

def extrair_eventos_de_email(texto_email: str):
    """
    Analisa um e-mail com a IA e retorna um dicionário com os eventos encontrados,
    ou None se não for relevante (ex: newsletter).
    """
    prompt_sistema = (
        "Você é a IA do Aurora Inbox. Seu objetivo é ler o texto de um e-mail e extrair informações úteis ou compromissos.\n"
        "Se o e-mail contiver uma informação importante (ex: aviso escolar, conta a pagar, entrega de pedido) ou um compromisso (voo, consulta, reunião), "
        "retorne um JSON extrito no formato:\n"
        '{"titulo": "Resumo do Assunto", "data": "YYYY-MM-DDTHH:MM:SS" (ou null se não houver data), "tipo": "voo|consulta|reuniao|reserva|geral", "detalhes": "Breve resumo do contexto"}\n'
        "Se o e-mail for spam inútil ou propaganda irrelevante, retorne APENAS um JSON vazio: {}\n"
        "Não inclua nenhum texto antes ou depois do JSON."
    )
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json; charset=utf-8",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Aurora Home"
    }
    
    payload = {
        "model": PREFERRED_MODEL,
        "messages": [
            {"role": "system", "content": prompt_sistema},
            {"role": "user", "content": f"E-mail:\n{texto_email}"}
        ],
        "temperature": 0.1,
        "max_tokens": 200
    }
    
    try:
        data = _make_openrouter_request(payload, headers)
        if "choices" not in data:
            return None
            
        content = data["choices"][0]["message"]["content"].strip()
        
        # Limpar crases
        if "```" in content:
            match = re.search(r"\{.*\}", content, re.DOTALL)
            if match:
                content = match.group(0)
                
        parsed = json.loads(content)
        if isinstance(parsed, dict) and "titulo" in parsed:
            return parsed
        return None
    except Exception as e:
        print(f"[AI Aurora Inbox] Erro ao analisar e-mail: {e}")
        return None

