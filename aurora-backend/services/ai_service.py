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
            "mensagem": "Nenhum produto precisa de reposição no momento."
        }
    
    nomes_em_falta = [p.nome for p in em_falta]
    
    if any("café" in n.lower() for n in nomes_em_falta):
         return {
            "tipo": "alerta",
            "mensagem": "O café chegou ao limite mínimo. Adicione-o à próxima compra."
         }
         
    return {
        "tipo": "info",
        "mensagem": f"{len(em_falta)} {'produto precisa' if len(em_falta) == 1 else 'produtos precisam'} de reposição. Confira a lista de compras."
    }

def conversar_com_aurora_mock(produtos, mensagem_usuario, eventos_agenda=None):
    if eventos_agenda is None:
        eventos_agenda = []
        
    em_falta = [p for p in produtos if p.quantidade <= p.quantidade_minima]
    mensagem_lower = mensagem_usuario.lower()
    
    if "falta" in mensagem_lower or "comprar" in mensagem_lower or "acabando" in mensagem_lower or "preciso" in mensagem_lower:
        if not em_falta:
            return {"resposta": "Nenhum produto precisa de reposição no momento."}
        nomes = [p.nome for p in em_falta]
        return {"resposta": f"Para repor: {', '.join(nomes)}."}
        
    if "estoque" in mensagem_lower or "inventário" in mensagem_lower or "produtos" in mensagem_lower or "temos" in mensagem_lower:
        if not em_falta:
            return {"resposta": f"Há {len(produtos)} {'produto cadastrado' if len(produtos) == 1 else 'produtos cadastrados'}. Nenhum precisa de reposição."}
        nomes = [p.nome for p in em_falta]
        return {"resposta": f"Há {len(produtos)} {'produto cadastrado' if len(produtos) == 1 else 'produtos cadastrados'}. Para repor: {', '.join(nomes)}."}
        
    if "agenda" in mensagem_lower or "reunião" in mensagem_lower or "compromisso" in mensagem_lower or "hoje" in mensagem_lower or "amanhã" in mensagem_lower:
        if not eventos_agenda:
            return {"resposta": "Nenhum compromisso próximo foi encontrado."}
        titulos = [e.get("titulo", "") for e in eventos_agenda]
        return {"resposta": f"Próximos compromissos: {', '.join(titulos)}."}
        
    return {"resposta": f"No momento, posso consultar os dados salvos localmente: {len(produtos)} {'produto' if len(produtos) == 1 else 'produtos'} e {len(eventos_agenda)} {'compromisso' if len(eventos_agenda) == 1 else 'compromissos'}."}

def gerar_insight_llm(produtos):
    if not produtos:
        return {
            "tipo": "info",
            "mensagem": "O estoque ainda está vazio. Adicione o primeiro produto para começar."
        }

    resumo_produtos = []
    for p in produtos:
        status = "Repor" if p.quantidade <= p.quantidade_minima else "OK"
        resumo_produtos.append(f"- {p.nome} ({p.categoria}): {p.quantidade} {p.unidade or 'un'} (mínimo: {p.quantidade_minima}) [{status}]")
    
    lista_texto = "\n".join(resumo_produtos)
    
    prompt_sistema = (
        "Você é a IA Aurora. Escreva em português do Brasil com tom natural, calmo e objetivo. "
        "Gere uma orientação útil sobre o estoque em uma ou duas frases curtas. "
        "Evite elogios exagerados, perguntas retóricas, exclamações, termos técnicos e frases promocionais. "
        "Use singular e plural corretamente. Chame a área de 'estoque', nunca de 'inventário'.\n"
        "Retorne APENAS um objeto JSON válido sem qualquer texto antes ou depois, no seguinte formato estrito:\n"
        '{"tipo": "sucesso", "mensagem": "texto do insight em português"}\n'
        'onde "tipo" DEVE ser obrigatoriamente um destes três valores: "sucesso", "alerta" ou "info".'
    )
    
    prompt_usuario = (
        f"Estoque atual da casa:\n{lista_texto}\n\n"
        "Escreva a orientação mais útil para este momento."
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
        resumo_produtos.append(f"- {p.nome} ({p.categoria}){loc}: {p.quantidade} {p.unidade or 'un'} (Estoque Mínimo: {p.quantidade_minima}) [{status}]")
    
    lista_texto = "\n".join(resumo_produtos) if resumo_produtos else "Nenhum produto cadastrado no momento."
    
    resumo_eventos = []
    for e in eventos_agenda:
        titulo = e.get("titulo", "Sem título")
        data = e.get("data", "")
        # Formatar a data se possível
        resumo_eventos.append(f"- {titulo} (Data/Hora: {data})")
    
    lista_eventos = "\n".join(resumo_eventos) if resumo_eventos else "Não há eventos agendados ou a agenda não está conectada."

    prompt_sistema = (
        "Você é a IA Aurora. Responda em português do Brasil com tom natural, respeitoso e direto.\n"
        "Ajude a pessoa a consultar o estoque e os compromissos da casa.\n\n"
        "REGRAS DE ESTILO E FORMATAÇÃO DE RESPOSTA:\n"
        "1. Responda em até quatro frases curtas, salvo quando uma lista for mais clara.\n"
        "2. Para itens em falta, apresente os nomes em uma lista simples e informe apenas o necessário.\n"
        "3. Para compromissos, use o formato '[horário] · [nome do compromisso]'.\n"
        "4. Use somente os dados fornecidos. Não invente produtos, datas ou compromissos.\n"
        "5. Evite exclamações, linguagem promocional, diminutivos, perguntas retóricas e o termo 'inventário'.\n"
        "6. Se não houver compromissos, responda 'Nenhum compromisso agendado.'.\n\n"
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
