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
        'scope': 'openid email profile https://www.googleapis.com/auth/calendar.readonly'
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
        return RedirectResponse("http://localhost:5173/integracoes?status=session_error")

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
        
        # Redirecionar de volta para o frontend (configurável no futuro para a url de prod)
        return RedirectResponse("http://localhost:5173/integracoes?status=success")
        
    return RedirectResponse("http://localhost:5173/integracoes?status=provider_error")

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
