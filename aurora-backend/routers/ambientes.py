from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, security
from database import get_db

router = APIRouter(
    tags=["ambientes"],
)

@router.get("/", response_model=List[schemas.AmbienteResponse])
def listar_ambientes(db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    casa = security.get_user_casa(current_user)
    ambientes = db.query(models.Ambiente).filter(models.Ambiente.casa_id == casa.id).all()
    return ambientes

@router.post("/", response_model=schemas.AmbienteResponse)
def criar_ambiente(ambiente: schemas.AmbienteCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    casa = security.get_user_casa(current_user)
    db_ambiente = models.Ambiente(**ambiente.model_dump())
    db_ambiente.casa_id = casa.id
    db.add(db_ambiente)
    db.commit()
    db.refresh(db_ambiente)
    return db_ambiente

@router.delete("/{ambiente_id}")
def deletar_ambiente(ambiente_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    casa = security.get_user_casa(current_user)
    db_ambiente = db.query(models.Ambiente).filter(models.Ambiente.id == ambiente_id, models.Ambiente.casa_id == casa.id).first()
    if not db_ambiente:
        raise HTTPException(status_code=404, detail="Ambiente não encontrado")
    
    db.query(models.Produto).filter(models.Produto.ambiente_id == ambiente_id).update({"ambiente_id": None})
    db.delete(db_ambiente)
    db.commit()
    return {"message": "Ambiente removido com sucesso"}
