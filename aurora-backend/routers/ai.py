from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from services.ai_service import gerar_insight, conversar_com_aurora
import schemas, security, models

from fastapi.concurrency import run_in_threadpool
from routers.connect import get_google_events
from fastapi import HTTPException

router = APIRouter(
    prefix="/ai",
    tags=["ai"],
)

@router.get("/insights")
async def get_insights(db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    casa_id = security.get_user_casa(current_user).id
    
    eventos_agenda = []
    try:
        res = await get_google_events(db=db, current_user=current_user)
        eventos_agenda = res.get("eventos", [])
    except HTTPException:
        pass
        
    insight = await run_in_threadpool(gerar_insight, db, casa_id, eventos_agenda)
    return insight

@router.post("/chat")
async def chat_com_ia(req: schemas.ChatRequest, db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    casa_id = security.get_user_casa(current_user).id
    historico_dict = [h.model_dump() for h in req.historico] if req.historico else []
    
    eventos_agenda = []
    try:
        res = await get_google_events(db=db, current_user=current_user)
        eventos_agenda = res.get("eventos", [])
    except HTTPException:
        pass
        
    resposta = await run_in_threadpool(conversar_com_aurora, db, casa_id, req.mensagem, historico_dict, eventos_agenda)
    return resposta
