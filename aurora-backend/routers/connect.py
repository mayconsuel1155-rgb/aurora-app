from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
import os
import httpx
from datetime import datetime, timezone, timedelta
import security
import models
from database import get_db
import base64
from services.ai_service import extrair_eventos_de_email

router = APIRouter(
    prefix="/connect",
    tags=["connect"],
)

# Configuração do OAuth
config = Config(".env")
oauth = OAuth(config)

oauth.register(
    name='google',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly'
    }
)

@router.get("/{provider}/login")
async def login(provider: str, request: Request, token: str, db: Session = Depends(get_db)):
    # Autenticar usuário pelo token via query string
    try:
        import jwt
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        if not payload:
            raise HTTPException(status_code=401, detail="Token inválido")
        user_id = int(payload.get("sub"))
        user = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Não autorizado")

    # Armazenar o ID do usuário na sessão (cookie seguro via SessionMiddleware no main.py)
    request.session['user_id'] = user.id

    # Redirecionar para o provedor
    redirect_uri = request.url_for('auth_callback', provider=provider)
    if provider == 'google':
        return await oauth.google.authorize_redirect(request, redirect_uri, access_type='offline', prompt='consent')
    
    raise HTTPException(status_code=400, detail="Provedor não suportado")

@router.get("/{provider}/callback")
async def auth_callback(provider: str, request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get('user_id')
    if not user_id:
        # Se a sessão foi perdida ou não existe
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(f"{frontend_url}/integracoes?status=session_error")

    if provider == 'google':
        token_data = await oauth.google.authorize_access_token(request)
        
        # O token_data contém access_token, refresh_token, expires_at, etc.
        access_token = token_data.get('access_token')
        refresh_token = token_data.get('refresh_token')
        expires_at = token_data.get('expires_at')
        
        # Salvar no banco
        conexao = db.query(models.ConexaoExterna).filter(
            models.ConexaoExterna.usuario_id == user_id,
            models.ConexaoExterna.provedor == provider
        ).first()
        
        if not conexao:
            conexao = models.ConexaoExterna(
                usuario_id=user_id,
                provedor=provider
            )
            db.add(conexao)
            
        conexao.access_token = access_token
        if refresh_token:
            conexao.refresh_token = refresh_token
        if expires_at:
            conexao.expires_at = expires_at
            
        db.commit()
        
        # Limpar sessão para segurança
        request.session.pop('user_id', None)
        
        # Redirecionar de volta para o frontend
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        return RedirectResponse(f"{frontend_url}/integracoes?status=success")
        
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    return RedirectResponse(f"{frontend_url}/integracoes?status=provider_error")

@router.get("/status")
def check_connections(db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    conexoes = db.query(models.ConexaoExterna).filter(models.ConexaoExterna.usuario_id == current_user.id).all()
    
    return {
        "google": any(c.provedor == "google" for c in conexoes)
    }

@router.get("/google/events")
async def get_google_events(db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    conexao = db.query(models.ConexaoExterna).filter(
        models.ConexaoExterna.usuario_id == current_user.id,
        models.ConexaoExterna.provedor == "google"
    ).first()
    
    if not conexao or not conexao.access_token:
        raise HTTPException(status_code=401, detail="Google Calendar não conectado")
        
    # Verificar se token expirou rudimentarmente (poderíamos usar refresh_token aqui)
    # Para o MVP, se der erro 401 na API, vamos retornar erro para pedir reconexão
    
    now = datetime.now(timezone.utc).isoformat()
    # Buscar os próximos 10 eventos a partir de agora
    url = f"https://www.googleapis.com/calendar/v3/calendars/primary/events"
    params = {
        "timeMin": now,
        "maxResults": 10,
        "singleEvents": "true",
        "orderBy": "startTime"
    }
    headers = {
        "Authorization": f"Bearer {conexao.access_token}",
        "Accept": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, headers=headers)
        
        if response.status_code == 401:
            # Token expirado. Ideal: usar refresh_token.
            # Workaround MVP: deletar conexao e pedir reconnect.
            db.delete(conexao)
            db.commit()
            raise HTTPException(status_code=401, detail="Token expirado. Reconecte.")
            
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Erro ao buscar agenda")
            
        data = response.json()
        
    eventos_limpos = []
    for item in data.get("items", []):
        # Pegar data (pode ser dateTime ou só date para eventos de dia inteiro)
        start = item.get("start", {})
        dt = start.get("dateTime") or start.get("date")
        
        eventos_limpos.append({
            "id": item.get("id"),
            "titulo": item.get("summary", "Sem título"),
            "data": dt,
            "link_meet": item.get("hangoutLink", None),
            "origem": "google"
        })
        
        
    return {"eventos": eventos_limpos}

def decode_base64_url(data: str) -> str:
    """Decodifica string base64url do Gmail"""
    data = data.replace('-', '+').replace('_', '/')
    padding = len(data) % 4
    if padding:
        data += '=' * (4 - padding)
    try:
        return base64.b64decode(data).decode('utf-8', errors='ignore')
    except Exception:
        return ""

def extrair_texto_gmail(parts) -> str:
    """Extrai texto simples do payload do Gmail iterando as parts"""
    texto = ""
    for part in parts:
        if part.get("mimeType") == "text/plain":
            body_data = part.get("body", {}).get("data", "")
            if body_data:
                texto += decode_base64_url(body_data)
        elif "parts" in part:
            texto += extrair_texto_gmail(part["parts"])
    return texto

@router.get("/google/emails")
async def get_google_emails(db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    conexao = db.query(models.ConexaoExterna).filter(
        models.ConexaoExterna.usuario_id == current_user.id,
        models.ConexaoExterna.provedor == "google"
    ).first()
    
    if not conexao or not conexao.access_token:
        raise HTTPException(status_code=401, detail="Google não conectado ou token ausente")

    headers = {
        "Authorization": f"Bearer {conexao.access_token}",
        "Accept": "application/json"
    }

    async with httpx.AsyncClient() as client:
        # 1. Buscar os 10 últimos emails (inbox, não enviados)
        url_list = "https://gmail.googleapis.com/gmail/v1/users/me/messages"
        params = {"maxResults": 10, "q": "in:inbox -in:chats -from:me"}
        
        resp_list = await client.get(url_list, params=params, headers=headers)
        
        if resp_list.status_code == 401:
            db.delete(conexao)
            db.commit()
            raise HTTPException(status_code=401, detail="Token expirado. Reconecte.")
            
        if resp_list.status_code != 200:
            raise HTTPException(status_code=resp_list.status_code, detail="Erro ao buscar emails no Gmail")
            
        mensagens = resp_list.json().get("messages", [])
        if not mensagens:
            return {"eventos_inbox": []}

        emails_processados = []
        
        # 2. Para cada ID, baixar o conteúdo e processar na IA
        for msg in mensagens:
            msg_id = msg.get("id")
            url_msg = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}"
            resp_msg = await client.get(url_msg, headers=headers)
            
            if resp_msg.status_code == 200:
                detalhes = resp_msg.json()
                payload = detalhes.get("payload", {})
                
                # Pegar Assunto, Remetente e Data
                headers_msg = payload.get("headers", [])
                assunto = next((h["value"] for h in headers_msg if h["name"].lower() == "subject"), "Sem assunto")
                remetente = next((h["value"] for h in headers_msg if h["name"].lower() == "from"), "Desconhecido")
                
                # Extrair corpo
                corpo = ""
                if payload.get("mimeType") == "text/plain":
                    corpo = decode_base64_url(payload.get("body", {}).get("data", ""))
                elif "parts" in payload:
                    corpo = extrair_texto_gmail(payload["parts"])
                
                if not corpo:
                    # Tentar html se não houver plain text
                    corpo = "Conteúdo não legível em texto plano."
                
                # 3. Enviar para a IA
                email_texto_completo = f"De: {remetente}\nAssunto: {assunto}\nCorpo: {corpo[:1000]}" # Limite 1000 chars pra não estourar tokens
                
                try:
                    resultado_ia = extrair_eventos_de_email(email_texto_completo)
                    if resultado_ia:
                        emails_processados.append({
                            "id": msg_id,
                            "email_assunto": assunto,
                            "email_remetente": remetente,
                            "insight": resultado_ia
                        })
                    # Pausa estratégica para evitar Rate Limit (429) na IA gratuita
                    import asyncio
                    await asyncio.sleep(2)
                except Exception as e:
                    print(f"Erro na extração IA do email {msg_id}: {e}")
                    
        return {"eventos_inbox": emails_processados}
