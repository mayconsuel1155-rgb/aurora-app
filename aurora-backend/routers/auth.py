from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
import models, schemas, security
from database import get_db

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

@router.post("/register", response_model=schemas.UsuarioResponse)
def register(user_in: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    try:
        # Verifica se já existe email
        user = db.query(models.Usuario).filter(models.Usuario.email == user_in.email).first()
        if user:
            raise HTTPException(status_code=400, detail="Email já cadastrado")
        
        hashed_password = security.get_password_hash(user_in.senha)
        new_user = models.Usuario(
            nome=user_in.nome,
            email=user_in.email,
            hash_senha=hashed_password
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        if user_in.codigo_convite:
            convite = db.query(models.ConviteCasa).filter(models.ConviteCasa.codigo == user_in.codigo_convite.upper(), models.ConviteCasa.usado == False).first()
            if not convite or convite.expiracao < datetime.utcnow():
                raise HTTPException(status_code=400, detail="Convite inválido ou expirado")
            
            # Adicionar o usuário como membro da casa existente
            novo_membro = models.MembroCasa(
                usuario_id=new_user.id,
                casa_id=convite.casa_id,
                permissao="membro"
            )
            db.add(novo_membro)
            convite.usado = True
            db.commit()
        else:
            # Cria uma Casa Digital padrão para este novo usuário
            nova_casa = models.Casa(nome="Minha Casa", usuario_id=new_user.id)
            db.add(nova_casa)
            db.commit()
            db.refresh(nova_casa)
            
            # Adiciona ambientes padrão
            ambientes = [
                models.Ambiente(casa_id=nova_casa.id, nome="Geladeira", icone="🧊"),
                models.Ambiente(casa_id=nova_casa.id, nome="Despensa", icone="📦"),
                models.Ambiente(casa_id=nova_casa.id, nome="Lavanderia", icone="🧺"),
                models.Ambiente(casa_id=nova_casa.id, nome="Banheiro", icone="🧼"),
            ]
            db.add_all(ambientes)
            db.commit()
        
        return new_user
    except Exception as e:
        import traceback
        error_msg = "".join(traceback.format_exception(type(e), e, e.__traceback__))
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.post("/login", response_model=schemas.Token)
def login(login_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.email == login_data.email).first()
    if not user or not security.verify_password(login_data.senha, user.hash_senha):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
