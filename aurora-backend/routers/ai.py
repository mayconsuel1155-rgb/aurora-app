from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from services.ai_service import gerar_insight, conversar_com_aurora
import schemas, security, models

router = APIRouter(
    prefix="/ai",
    tags=["ai"],
)

@router.get("/insights")
def get_insights(db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    casa_id = security.get_user_casa(current_user).id
    insight = gerar_insight(db, casa_id)
    return insight

@router.post("/chat")
def chat_com_ia(req: schemas.ChatRequest, db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    casa_id = security.get_user_casa(current_user).id
    historico_dict = [h.model_dump() for h in req.historico] if req.historico else []
    resposta = conversar_com_aurora(db, casa_id, req.mensagem, historico_dict)
    return resposta
