from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
import security

router = APIRouter(
    prefix="/remedios",
    tags=["Remédios"]
)

@router.get("/", response_model=List[schemas.RemedioResponse])
def get_remedios(db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    casa = security.get_user_casa(current_user)
    remedios = db.query(models.Remedio).filter(models.Remedio.casa_id == casa.id).all()
    return remedios

@router.post("/", response_model=schemas.RemedioResponse)
def create_remedio(
    remedio: schemas.RemedioCreate, 
    db: Session = Depends(get_db), 
    current_user: models.Usuario = Depends(security.get_current_user)
):
    casa = security.get_user_casa(current_user)
    novo_remedio = models.Remedio(
        casa_id=casa.id,
        nome=remedio.nome,
        horarios=remedio.horarios,
        ativo=remedio.ativo,
        estoque=remedio.estoque
    )
    db.add(novo_remedio)
    db.commit()
    db.refresh(novo_remedio)
    return novo_remedio

@router.put("/{remedio_id}/toggle", response_model=schemas.RemedioResponse)
def toggle_remedio(
    remedio_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.Usuario = Depends(security.get_current_user)
):
    casa = security.get_user_casa(current_user)
    remedio = db.query(models.Remedio).filter(
        models.Remedio.id == remedio_id,
        models.Remedio.casa_id == casa.id
    ).first()
    
    if not remedio:
        raise HTTPException(status_code=404, detail="Remédio não encontrado")
        
    remedio.ativo = not remedio.ativo
    db.commit()
    db.refresh(remedio)
    return remedio

@router.delete("/{remedio_id}")
def delete_remedio(
    remedio_id: int, 
    db: Session = Depends(get_db), 
    current_user: models.Usuario = Depends(security.get_current_user)
):
    casa = security.get_user_casa(current_user)
    remedio = db.query(models.Remedio).filter(
        models.Remedio.id == remedio_id,
        models.Remedio.casa_id == casa.id
    ).first()
    
    if not remedio:
        raise HTTPException(status_code=404, detail="Remédio não encontrado")
        
    db.delete(remedio)
    db.commit()
    return {"status": "sucesso"}
