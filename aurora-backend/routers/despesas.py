from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
import models
import schemas
from utils.auth import get_current_user

router = APIRouter(
    prefix="/despesas",
    tags=["despesas"]
)

@router.get("/", response_model=List[schemas.DespesaResponse])
def get_despesas(db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    return db.query(models.Despesa).filter(models.Despesa.casa_id == current_user.casa_id).all()

@router.post("/", response_model=schemas.DespesaResponse, status_code=status.HTTP_201_CREATED)
def create_despesa(despesa: schemas.DespesaCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    nova_despesa = models.Despesa(
        casa_id=current_user.casa_id,
        descricao=despesa.descricao,
        categoria=despesa.categoria,
        valor=despesa.valor,
        vencimento=despesa.vencimento,
        pago=despesa.pago,
        timestamp=datetime.utcnow()
    )
    db.add(nova_despesa)
    db.commit()
    db.refresh(nova_despesa)
    return nova_despesa

@router.put("/{despesa_id}", response_model=schemas.DespesaResponse)
def update_despesa(despesa_id: int, despesa_update: schemas.DespesaUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    despesa = db.query(models.Despesa).filter(
        models.Despesa.id == despesa_id, 
        models.Despesa.casa_id == current_user.casa_id
    ).first()
    
    if not despesa:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")
        
    update_data = despesa_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(despesa, key, value)
        
    db.commit()
    db.refresh(despesa)
    return despesa

@router.delete("/{despesa_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_despesa(despesa_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(get_current_user)):
    despesa = db.query(models.Despesa).filter(
        models.Despesa.id == despesa_id, 
        models.Despesa.casa_id == current_user.casa_id
    ).first()
    
    if not despesa:
        raise HTTPException(status_code=404, detail="Despesa não encontrada")
        
    db.delete(despesa)
    db.commit()
    return None
