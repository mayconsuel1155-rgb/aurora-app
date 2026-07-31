from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models
import schemas
import security

router = APIRouter(
    prefix="/categorias",
    tags=["categorias"]
)

@router.get("/", response_model=List[schemas.CategoriaProdutoResponse])
def get_categorias(db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    casa = security.get_user_casa(current_user)
    return db.query(models.CategoriaProduto).filter(models.CategoriaProduto.casa_id == casa.id).all()

@router.post("/", response_model=schemas.CategoriaProdutoResponse, status_code=status.HTTP_201_CREATED)
def create_categoria(categoria: schemas.CategoriaProdutoCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    casa = security.get_user_casa(current_user)
    nova_categoria = models.CategoriaProduto(
        casa_id=casa.id,
        nome=categoria.nome
    )
    db.add(nova_categoria)
    db.commit()
    db.refresh(nova_categoria)
    return nova_categoria

@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_categoria(categoria_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    casa = security.get_user_casa(current_user)
    categoria = db.query(models.CategoriaProduto).filter(
        models.CategoriaProduto.id == categoria_id, 
        models.CategoriaProduto.casa_id == casa.id
    ).first()
    
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
        
    db.delete(categoria)
    db.commit()
    return None
