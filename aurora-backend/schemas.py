from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AmbienteBase(BaseModel):
    nome: str
    icone: str = "🏠"

class AmbienteCreate(AmbienteBase):
    pass

class AmbienteResponse(AmbienteBase):
    id: int
    casa_id: int
    class Config:
        from_attributes = True

class ProdutoBase(BaseModel):
    nome: str
    categoria: str
    quantidade: float = 0.0
    quantidade_minima: float = 0.0
    ambiente_id: Optional[int] = None
    validade: Optional[datetime] = None

class ProdutoUpdate(BaseModel):
    nome: Optional[str] = None
    categoria: Optional[str] = None
    quantidade: Optional[float] = None
    quantidade_minima: Optional[float] = None
    ambiente_id: Optional[int] = None
    validade: Optional[datetime] = None

class ProdutoCreate(ProdutoBase):
    pass

class ProdutoResponse(ProdutoBase):
    id: int
    casa_id: int
    ambiente: Optional[AmbienteResponse] = None
    class Config:
        from_attributes = True

class CasaBase(BaseModel):
    nome: str

class CasaCreate(CasaBase):
    pass

class CasaResponse(CasaBase):
    id: int
    usuario_id: int
    produtos: List[ProdutoResponse] = []
    ambientes: List[AmbienteResponse] = []
    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    mensagem: str
    historico: Optional[List[ChatMessage]] = []

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str
    codigo_convite: Optional[str] = None

class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str
    
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    senha: str

class MembroResponse(BaseModel):
    id: int
    nome: str
    email: str
    permissao: str

class ConviteResponse(BaseModel):
    codigo: str
    expiracao: datetime

class EntrarCasaRequest(BaseModel):
    codigo: str

class GoogleEventCreate(BaseModel):
    titulo: str
    data: str
    is_all_day: bool = False

class GoogleEventUpdate(BaseModel):
    titulo: Optional[str] = None
    data: Optional[str] = None
    is_all_day: Optional[bool] = None
