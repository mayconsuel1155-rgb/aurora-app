from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
import models
from routers.auth import get_current_user
import os

router = APIRouter(
    prefix="/push",
    tags=["Push Notifications"]
)

class PushKeys(BaseModel):
    p256dh: str
    auth: str

class PushSubscription(BaseModel):
    endpoint: str
    keys: PushKeys

@router.post("/subscribe")
def subscribe(
    sub: PushSubscription,
    db: Session = Depends(get_db),
    current_user: models.Usuario = Depends(get_current_user)
):
    try:
        # Verifica se já existe a inscrição
        inscricao = db.query(models.InscricaoPush).filter(models.InscricaoPush.endpoint == sub.endpoint).first()
        if inscricao:
            inscricao.usuario_id = current_user.id
            inscricao.p256dh = sub.keys.p256dh
            inscricao.auth = sub.keys.auth
        else:
            nova_insc = models.InscricaoPush(
                usuario_id=current_user.id,
                endpoint=sub.endpoint,
                p256dh=sub.keys.p256dh,
                auth=sub.keys.auth
            )
            db.add(nova_insc)
            
        db.commit()
        return {"status": "ok"}
    except Exception as e:
        db.rollback()
        print(f"Erro ao salvar inscricao push: {e}")
        raise HTTPException(status_code=500, detail="Erro ao salvar assinatura de push")

@router.get("/vapid-public-key")
def get_vapid_public_key():
    key = os.getenv("VAPID_PUBLIC_KEY", "BJilCbzjYfT_vhASrjmGfq9gyssnCmK5E8tFfIkANu0DwpdEKzM9vQtj6dM1u7grVeBxftnjuD_kfa0qdgBSQpo")
    if not key:
        raise HTTPException(status_code=500, detail="VAPID public key não configurada no servidor")
    return {"public_key": key}
