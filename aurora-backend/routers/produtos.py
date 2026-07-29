from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, security
from database import get_db

router = APIRouter(
    prefix="/produtos",
    tags=["produtos"],
)

@router.post("/", response_model=schemas.ProdutoResponse)
def criar_produto(produto: schemas.ProdutoCreate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    casa = security.get_user_casa(current_user)
    db_produto = models.Produto(**produto.model_dump(), casa_id=casa.id)
    db.add(db_produto)
    db.commit()
    db.refresh(db_produto)
    return db_produto

@router.get("/", response_model=List[schemas.ProdutoResponse])
def listar_produtos(db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    casa = security.get_user_casa(current_user)
    produtos = db.query(models.Produto).filter(models.Produto.casa_id == casa.id).all()
    return produtos

@router.put("/{produto_id}", response_model=schemas.ProdutoResponse)
def atualizar_produto(produto_id: int, produto_update: schemas.ProdutoUpdate, db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    casa = security.get_user_casa(current_user)
    db_produto = db.query(models.Produto).filter(models.Produto.id == produto_id, models.Produto.casa_id == casa.id).first()
    if not db_produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    for key, value in produto_update.model_dump(exclude_unset=True).items():
        setattr(db_produto, key, value)
    
    db.commit()
    db.refresh(db_produto)
    
    # Doutrina Aurora: Gerar lista de compras automaticamente
    if db_produto.quantidade <= db_produto.quantidade_minima:
        item_existente = db.query(models.ListaCompras).filter(
            models.ListaCompras.produto_id == db_produto.id,
            models.ListaCompras.status == "Pendente"
        ).first()
        
        if not item_existente:
            novo_item_lista = models.ListaCompras(
                casa_id=db_produto.casa_id,
                produto_id=db_produto.id,
                status="Pendente"
            )
            db.add(novo_item_lista)
            db.commit()

    return db_produto

@router.delete("/{produto_id}")
def deletar_produto(produto_id: int, db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    casa = security.get_user_casa(current_user)
    db_produto = db.query(models.Produto).filter(models.Produto.id == produto_id, models.Produto.casa_id == casa.id).first()
    if not db_produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    # Remover referências na lista de compras
    db.query(models.ListaCompras).filter(models.ListaCompras.produto_id == produto_id).delete()
    
    db.delete(db_produto)
    db.commit()
    return {"message": "Produto removido com sucesso"}
