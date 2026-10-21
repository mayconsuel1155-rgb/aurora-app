from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import timedelta, datetime, timezone
import logging
import os
import secrets
import models, schemas, security
from database import get_db
from services.email_service import send_password_reset_email


logger = logging.getLogger(__name__)
PASSWORD_RESET_TOKEN_MINUTES = 15
PASSWORD_RESET_RESEND_SECONDS = 60

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
    try:
        user = db.query(models.Usuario).filter(models.Usuario.email == login_data.email).first()
        if not user or not security.verify_password(login_data.senha, user.hash_senha):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou senha incorretos",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            data={"sub": str(user.id), "ver": user.auth_version or 0},
            expires_delta=access_token_expires,
        )
        return {"access_token": access_token, "token_type": "bearer", "user": user}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = "".join(traceback.format_exception(type(e), e, e.__traceback__))
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


def _utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _deliver_password_reset_email(recipient: str, reset_url: str) -> None:
    try:
        send_password_reset_email(recipient, reset_url)
    except Exception:
        logger.exception("Não foi possível enviar o e-mail de recuperação de senha")


@router.post(
    "/password/forgot",
    response_model=schemas.PasswordResetMessage,
    status_code=status.HTTP_202_ACCEPTED,
)
def forgot_password(
    request_data: schemas.ForgotPasswordRequest,
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None,
):
    generic_response = schemas.PasswordResetMessage(
        message=schemas.PASSWORD_RESET_GENERIC_MESSAGE,
    )
    user = db.query(models.Usuario).filter(
        func.lower(models.Usuario.email) == request_data.email,
    ).first()
    if not user:
        return generic_response

    now = datetime.now(timezone.utc)
    recent_token = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.usuario_id == user.id,
        models.PasswordResetToken.used_at.is_(None),
    ).order_by(models.PasswordResetToken.created_at.desc()).first()
    if recent_token and (now - _utc(recent_token.created_at)).total_seconds() < PASSWORD_RESET_RESEND_SECONDS:
        return generic_response

    raw_token = secrets.token_urlsafe(32)
    db.add(models.PasswordResetToken(
        usuario_id=user.id,
        token_hash=security.hash_password_reset_token(raw_token),
        expires_at=now + timedelta(minutes=PASSWORD_RESET_TOKEN_MINUTES),
    ))
    db.commit()

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5174").rstrip("/")
    reset_url = f"{frontend_url}/redefinir-senha?token={raw_token}"
    if background_tasks is not None:
        background_tasks.add_task(_deliver_password_reset_email, user.email, reset_url)
    else:
        _deliver_password_reset_email(user.email, reset_url)
    return generic_response


@router.post("/password/reset", response_model=schemas.PasswordResetMessage)
def reset_password(
    request_data: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    token_hash = security.hash_password_reset_token(request_data.token)
    reset_token = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token_hash == token_hash,
        models.PasswordResetToken.used_at.is_(None),
    ).first()
    if not reset_token or _utc(reset_token.expires_at) <= now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este link é inválido ou expirou. Solicite uma nova recuperação.",
        )

    claimed = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.id == reset_token.id,
        models.PasswordResetToken.used_at.is_(None),
    ).update({models.PasswordResetToken.used_at: now}, synchronize_session=False)
    if claimed != 1:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este link já foi utilizado. Solicite uma nova recuperação.",
        )

    user = db.query(models.Usuario).filter(models.Usuario.id == reset_token.usuario_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Link inválido")

    user.hash_senha = security.get_password_hash(request_data.nova_senha)
    user.auth_version = (user.auth_version or 0) + 1
    active_tokens = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.usuario_id == user.id,
        models.PasswordResetToken.used_at.is_(None),
    ).all()
    for item in active_tokens:
        item.used_at = now
    db.commit()

    return schemas.PasswordResetMessage(
        message="Senha redefinida com sucesso. Entre novamente no Aurora.",
    )
