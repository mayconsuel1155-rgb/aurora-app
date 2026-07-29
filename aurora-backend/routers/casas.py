from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random
import string
import models, schemas, security
from database import get_db

router = APIRouter(
    prefix="/casas",
    tags=["casas"],
)

def gerar_codigo_convite(tamanho=6):
    letras_numeros = string.ascii_uppercase + string.digits
    return ''.join(random.choice(letras_numeros) for _ in range(tamanho))

@router.post("/convite", response_model=schemas.ConviteResponse)
def criar_convite(db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    # Resolvendo a casa (dono)
    if not current_user.casas:
        raise HTTPException(status_code=403, detail="Apenas o dono da casa pode gerar convites")
        
    casa = current_user.casas[0]
    
    # Expirar convites antigos não usados
    db.query(models.ConviteCasa).filter(models.ConviteCasa.casa_id == casa.id).update({"usado": True})
    
    codigo = gerar_codigo_convite()
    expiracao = datetime.utcnow() + timedelta(days=1)
    
    novo_convite = models.ConviteCasa(
        codigo=codigo,
        casa_id=casa.id,
        expiracao=expiracao
    )
    db.add(novo_convite)
    db.commit()
    db.refresh(novo_convite)
    
    return novo_convite

@router.post("/entrar")
def entrar_em_casa(req: schemas.EntrarCasaRequest, db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    convite = db.query(models.ConviteCasa).filter(models.ConviteCasa.codigo == req.codigo.upper(), models.ConviteCasa.usado == False).first()
    
    if not convite:
        raise HTTPException(status_code=404, detail="Convite inválido ou expirado")
        
    if convite.expiracao < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Convite expirado")
        
    # Verificar se o usuário já é membro da casa
    membro_existente = db.query(models.MembroCasa).filter(
        models.MembroCasa.usuario_id == current_user.id,
        models.MembroCasa.casa_id == convite.casa_id
    ).first()
    
    if membro_existente or (current_user.casas and current_user.casas[0].id == convite.casa_id):
        raise HTTPException(status_code=400, detail="Você já é membro desta casa")

    # Adicionar o usuário como membro
    novo_membro = models.MembroCasa(
        usuario_id=current_user.id,
        casa_id=convite.casa_id,
        permissao="membro"
    )
    db.add(novo_membro)
    
    # Marcar convite como usado
    convite.usado = True
    db.commit()
    
    return {"message": "Bem-vindo à casa digital!"}

@router.get("/membros", response_model=list[schemas.MembroResponse])
def listar_membros(db: Session = Depends(get_db), current_user: models.Usuario = Depends(security.get_current_user)):
    # Resolvendo a casa atual do usuário (dono ou membro)
    casa_id = None
    if current_user.casas:
        casa_id = current_user.casas[0].id
    elif current_user.casas_membro:
        casa_id = current_user.casas_membro[0].casa_id
        
    if not casa_id:
        return []
        
    casa = db.query(models.Casa).filter(models.Casa.id == casa_id).first()
    if not casa:
        return []
        
    membros = []
    
    # Adicionar o dono da casa
    dono = db.query(models.Usuario).filter(models.Usuario.id == casa.usuario_id).first()
    if dono:
        membros.append({
            "id": dono.id,
            "nome": dono.nome,
            "email": dono.email,
            "permissao": "admin"
        })
        
    # Adicionar os outros membros
    for membro_casa in casa.membros:
        u = membro_casa.usuario
        if u:
            membros.append({
                "id": u.id,
                "nome": u.nome,
                "email": u.email,
                "permissao": membro_casa.permissao
            })
            
    return membros
