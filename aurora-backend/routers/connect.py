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
import schemas

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
        'scope': 'openid email profile https://www.googleapis.com/auth/calendar.events'
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

@router.post("/google/events")
async def create_google_event(evento: schemas.GoogleEventCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    conexao = db.query(models.ConexaoExterna).filter(
        models.ConexaoExterna.usuario_id == current_user.id,
        models.ConexaoExterna.provedor == "google"
    ).first()
    
    if not conexao or not conexao.access_token:
        raise HTTPException(status_code=401, detail="Google Calendar não conectado")
        
    url = f"https://www.googleapis.com/calendar/v3/calendars/primary/events"
    headers = {
        "Authorization": f"Bearer {conexao.access_token}",
        "Content-Type": "application/json"
    }
    
    # Determinar formato da data
    start = {}
    end = {}
    if evento.is_all_day:
        # Pega só YYYY-MM-DD
        dt_str = evento.data.split('T')[0] if 'T' in evento.data else evento.data
        start["date"] = dt_str
        end["date"] = dt_str
    else:
        # Precisamos de datetime ISO. Se a string só tiver data, forçamos um tempo
        dt_str = evento.data
        if 'T' not in dt_str:
            dt_str += "T09:00:00-03:00" # fallback timezone Brasil
        
        # O Google precisa de start e end. Para simplificar, o end é 1 hora depois do start.
        try:
            start_dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
            end_dt = start_dt + timedelta(hours=1)
            start["dateTime"] = start_dt.isoformat()
            end["dateTime"] = end_dt.isoformat()
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de data inválido. Use ISO 8601.")

    body = {
        "summary": evento.titulo,
        "start": start,
        "end": end
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=body, headers=headers)
        if response.status_code == 401:
            db.delete(conexao)
            db.commit()
            raise HTTPException(status_code=401, detail="Token expirado. Reconecte.")
        if response.status_code not in (200, 201):
            raise HTTPException(status_code=response.status_code, detail=f"Erro ao criar evento: {response.text}")
            
    return {"status": "success", "data": response.json()}


@router.patch("/google/events/{event_id}")
async def update_google_event(event_id: str, evento: schemas.GoogleEventUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    conexao = db.query(models.ConexaoExterna).filter(
        models.ConexaoExterna.usuario_id == current_user.id,
        models.ConexaoExterna.provedor == "google"
    ).first()
    
    if not conexao or not conexao.access_token:
        raise HTTPException(status_code=401, detail="Google Calendar não conectado")
        
    url = f"https://www.googleapis.com/calendar/v3/calendars/primary/events/{event_id}"
    headers = {
        "Authorization": f"Bearer {conexao.access_token}",
        "Content-Type": "application/json"
    }
    
    body = {}
    if evento.titulo is not None:
        body["summary"] = evento.titulo
        
    if evento.data is not None:
        start = {}
        end = {}
        if evento.is_all_day:
            dt_str = evento.data.split('T')[0] if 'T' in evento.data else evento.data
            start["date"] = dt_str
            end["date"] = dt_str
        else:
            dt_str = evento.data
            if 'T' not in dt_str:
                dt_str += "T09:00:00-03:00"
            try:
                start_dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
                end_dt = start_dt + timedelta(hours=1)
                start["dateTime"] = start_dt.isoformat()
                end["dateTime"] = end_dt.isoformat()
            except ValueError:
                pass
        
        if start and end:
            body["start"] = start
            body["end"] = end
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(url, json=body, headers=headers)
        if response.status_code == 401:
            db.delete(conexao)
            db.commit()
            raise HTTPException(status_code=401, detail="Token expirado. Reconecte.")
        if response.status_code not in (200, 201):
            raise HTTPException(status_code=response.status_code, detail=f"Erro ao atualizar evento: {response.text}")
            
    return {"status": "success"}


@router.delete("/google/events/{event_id}")
async def delete_google_event(event_id: str, db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    conexao = db.query(models.ConexaoExterna).filter(
        models.ConexaoExterna.usuario_id == current_user.id,
        models.ConexaoExterna.provedor == "google"
    ).first()
    
    if not conexao or not conexao.access_token:
        raise HTTPException(status_code=401, detail="Google Calendar não conectado")
        
    url = f"https://www.googleapis.com/calendar/v3/calendars/primary/events/{event_id}"
    headers = {
        "Authorization": f"Bearer {conexao.access_token}"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.delete(url, headers=headers)
        if response.status_code == 401:
            db.delete(conexao)
            db.commit()
            raise HTTPException(status_code=401, detail="Token expirado. Reconecte.")
        if response.status_code not in (200, 204):
            raise HTTPException(status_code=response.status_code, detail="Erro ao deletar evento")
            
    return {"status": "success"}

