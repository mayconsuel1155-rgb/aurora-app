import os
import json
import urllib.request
from urllib.error import HTTPError
import time
import re
from sqlalchemy.orm import Session
import models

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

def _make_gemini_request(payload):
    if not GEMINI_API_KEY:
        raise Exception("GEMINI_API_KEY não configurada no servidor.")
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={GEMINI_API_KEY}"
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except HTTPError as e:
        error_msg = e.read().decode('utf-8')
        raise Exception(f"Gemini API Error {e.code}: {error_msg}")
    except Exception as e:
        raise e

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

def conversar_com_aurora_mock(produtos, mensagem_usuario, eventos_agenda=None):
    if eventos_agenda is None:
        eventos_agenda = []
        
    em_falta = [p for p in produtos if p.quantidade <= p.quantidade_minima]
    mensagem_lower = mensagem_usuario.lower()
    
    if "falta" in mensagem_lower or "comprar" in mensagem_lower or "acabando" in mensagem_lower or "preciso" in mensagem_lower:
        if not em_falta:
            return {"resposta": "[Modo Offline] Não há nada em falta no momento. Seu estoque está em níveis adequados!"}
        nomes = [p.nome for p in em_falta]
        return {"resposta": f"[Modo Offline] Os seguintes itens estão em falta ou no limite mínimo: {', '.join(nomes)}."}
        
    if "estoque" in mensagem_lower or "inventário" in mensagem_lower or "produtos" in mensagem_lower or "temos" in mensagem_lower:
        if not em_falta:
            return {"resposta": f"[Modo Offline] Você possui {len(produtos)} produtos cadastrados. Nenhum precisa de reposição."}
        nomes = [p.nome for p in em_falta]
        return {"resposta": f"[Modo Offline] Você possui {len(produtos)} produtos cadastrados. Precisam de reposição: {', '.join(nomes)}."}
        
    if "agenda" in mensagem_lower or "reunião" in mensagem_lower or "compromisso" in mensagem_lower or "hoje" in mensagem_lower or "amanhã" in mensagem_lower:
        if not eventos_agenda:
            return {"resposta": "[Modo Offline] Você não possui compromissos agendados próximos."}
        titulos = [e.get("titulo", "") for e in eventos_agenda]
        return {"resposta": f"[Modo Offline] Seus próximos compromissos são: {', '.join(titulos)}."}
        
    return {"resposta": f"[Modo Offline] Sou a Aurora. Meus servidores principais estão inacessíveis no momento, então estou respondendo localmente. Você tem {len(produtos)} produtos e {len(eventos_agenda)} compromissos. Como posso ajudar?"}

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
    
    payload = {
        "systemInstruction": {
            "parts": [{"text": prompt_sistema}]
        },
        "contents": [
            {"role": "user", "parts": [{"text": prompt_usuario}]}
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1024,
            "responseMimeType": "application/json"
        }
    }
    
    try:
        data = _make_gemini_request(payload)
        
        if "candidates" not in data or not data["candidates"]:
            raise Exception(f"Resposta inesperada da API: {data}")
            
        content = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        
        parsed = json.loads(content)
        if isinstance(parsed, dict) and "tipo" in parsed and "mensagem" in parsed:
            # Validar tipo permitido
            if parsed["tipo"] not in ["sucesso", "alerta", "info"]:
                parsed["tipo"] = "info"
            print("[AI Aurora] Insight gerado com sucesso via Gemini:", parsed)
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
        "1. TOM ELEGANTE E SOFISTICADO: Aja como uma assistente executiva de alto nível (Chief of Staff). Suas respostas devem ser impecavelmente educadas, bem elaboradas e fluidas.\n"
        "2. RESPOSTAS ELABORADAS: Ao invés de ser robótica e apenas listar itens, crie frases completas e humanas. Conecte as informações de forma inteligente. Ex: Em vez de 'Falta café', diga 'Notei que o seu estoque de café está abaixo do ideal. Recomendo adicioná-lo à sua próxima lista de compras.'\n"
        "3. FORMATAÇÃO PREMIUM: Utilize negrito para destacar informações chave (como nomes de compromissos e horários) e organize em parágrafos curtos para uma leitura agradável.\n"
        "4. PRECISÃO ABSOLUTA: Baseie-se ESTRITAMENTE no inventário e agenda reais fornecidos abaixo. Nunca invente dados. Se a agenda estiver vazia, informe com cordialidade que o dia está livre.\n\n"
        f"INVENTÁRIO ATUAL DA CASA (CASA ID {casa_id}):\n"
        f"{lista_texto}\n\n"
        f"AGENDA DO USUÁRIO (PRÓXIMOS COMPROMISSOS):\n"
        f"{lista_eventos}\n\n"
        "Utilize os dados acima para responder de maneira altamente profissional, clara e concisa."
    )
    
    historico_str = ""
    if historico and isinstance(historico, list):
        for item in historico[-6:]:
            role = item.get("role", "user").upper()
            content = str(item.get("content", ""))
            historico_str += f"{role}: {content}\n"
            
    if historico_str:
        prompt_completo = f"Histórico Recente da Conversa:\n{historico_str}\n\nNova Mensagem do Usuário:\n{mensagem_usuario}"
    else:
        prompt_completo = f"Mensagem do Usuário:\n{mensagem_usuario}"
    
    payload = {
        "systemInstruction": {
            "parts": [{"text": prompt_sistema}]
        },
        "contents": [
            {"role": "user", "parts": [{"text": prompt_completo}]}
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 4096
        }
    }
    
    try:
        data = _make_gemini_request(payload)
        
        if "candidates" not in data or not data["candidates"]:
            raise Exception(f"Resposta inesperada da API: {data}")
            
        content = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        return {"resposta": content}
    except Exception as e:
        print("[AI Aurora Chat] Erro ao conectar ao Gemini LLM:", e)
        return conversar_com_aurora_mock(produtos, mensagem_usuario, eventos_agenda)

def extrair_eventos_de_email(texto_email: str):
    prompt_sistema = (
        "Você é a IA do Aurora Inbox. Seu objetivo é ler o texto de um e-mail e extrair informações úteis ou compromissos.\n"
        "Se o e-mail contiver uma informação importante (ex: aviso escolar, conta a pagar, entrega de pedido) ou um compromisso (voo, consulta, reunião), "
        "retorne um JSON extrito no formato:\n"
        '{"titulo": "Resumo do Assunto", "data": "YYYY-MM-DDTHH:MM:SS" (ou null se não houver data), "tipo": "voo|consulta|reuniao|reserva|geral", "detalhes": "Breve resumo do contexto"}\n'
        "Se o e-mail for spam inútil ou propaganda irrelevante, retorne APENAS um JSON vazio: {}\n"
        "Não inclua nenhum texto antes ou depois do JSON."
    )
    
    payload = {
        "systemInstruction": {
            "parts": [{"text": prompt_sistema}]
        },
        "contents": [
            {"role": "user", "parts": [{"text": f"E-mail:\n{texto_email}"}]}
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 1024,
            "responseMimeType": "application/json"
        }
    }
    
    try:
        data = _make_gemini_request(payload)
        if "candidates" not in data or not data["candidates"]:
            return None
            
        content = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        
        parsed = json.loads(content)
        if isinstance(parsed, dict) and "titulo" in parsed:
            return parsed
        return None
    except Exception as e:
        print(f"[AI Aurora Inbox] Erro ao analisar e-mail no Gemini: {e}")
        return None
